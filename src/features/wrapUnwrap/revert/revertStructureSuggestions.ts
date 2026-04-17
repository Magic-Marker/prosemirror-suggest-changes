import { type Node } from "prosemirror-model";
import { getSuggestionMarks } from "../../../utils.js";
import { type Mark } from "prosemirror-model";
import { getNodeId } from "../getNodeId.js";
import { Transform } from "prosemirror-transform";
import { type SuggestionId } from "../../../generateId.js";
import { guardStructureMarkAttrs, type MaterializedPaths } from "../types.js";
import { sameParentChain } from "../sameParentChain.js";
import { buildMaterializedPaths } from "../buildMaterializedPaths.js";
import { revertAddOp } from "./revertAddOp.js";
import { revertMoveOp } from "./revertMoveOp.js";

export function revertStructureSuggestionsInNode({
  tr,
  node,
  suggestionId,
  from,
  to,
}: {
  tr: Transform;
  node: Node;
  suggestionId?: SuggestionId;
  from?: number | undefined;
  to?: number | undefined;
}) {
  const { structure } = getSuggestionMarks(node.type.schema);

  // collect all structure mark ids
  const suggestionIds = new Set<SuggestionId>();

  node.descendants((node, pos) => {
    if (from !== undefined && pos < from) {
      return true;
    }
    if (to !== undefined && pos > to) {
      return false;
    }
    if (node.isText) return true;
    if (!structure.isInSet(node.marks)) return true;

    node.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      const markSuggestionId = mark.attrs["id"] as SuggestionId;
      if (suggestionId != null && markSuggestionId !== suggestionId) return;
      suggestionIds.add(markSuggestionId);
    });

    return true;
  });

  for (const suggestionId of suggestionIds) {
    revertStructureSuggestionWithPrerequisites(tr, suggestionId);
  }
}

function revertStructureSuggestionWithPrerequisites(
  tr: Transform,
  suggestionId: SuggestionId,
) {
  console.group(
    "revertStructureMarkGroupInOrder",
    "reverting structure mark group",
    suggestionId,
  );
  const suggestionIds = buildOrderedSuggestionIds(
    tr.doc,
    suggestionId,
    buildMaterializedPaths(tr.doc),
  );
  console.log(
    "revertStructureMarkGroupInOrder",
    "suggestion groups to revert",
    suggestionIds,
  );
  for (const suggestionId of suggestionIds) {
    revertOneStructureSuggestion(tr, suggestionId);
  }
  console.groupEnd();
}

function revertOneStructureSuggestion(
  tr: Transform,
  suggestionId: SuggestionId,
) {
  console.group(
    "revertStructureSuggestion",
    "reverting structure suggestion",
    suggestionId,
  );
  let structureMark = findNextStructureMark(tr.doc, suggestionId);
  while (structureMark !== null) {
    console.groupCollapsed(
      "revertStructureSuggestion",
      "reverting structure mark",
      structureMark.mark.attrs["id"],
      "at pos",
      structureMark.pos,
      "at node",
      structureMark.node.toString(),
      { structureMark },
    );
    revertStructureMark(tr, structureMark.mark, structureMark.pos);
    console.groupEnd();
    structureMark = findNextStructureMark(tr.doc, suggestionId);
  }
  console.groupEnd();
}

export function revertStructureMark(tr: Transform, mark: Mark, pos: number) {
  const transform = new Transform(tr.doc);
  transform.removeNodeMark(pos, mark);

  const node = transform.doc.nodeAt(pos);
  if (!node) {
    throw new Error(`Node not found at position ${String(pos)}`);
  }
  console.log(
    "revertStructureMark",
    mark.attrs["id"],
    "at node",
    node.toString(),
    {
      node,
      mark,
      pos,
    },
  );

  const attrs = mark.attrs;
  if (!guardStructureMarkAttrs(attrs)) {
    console.warn(
      "revertStructureMark",
      "invalid shape of structure mark attrs",
      { attrs },
    );
    return;
  }

  const op = attrs.data.op;
  switch (op.op) {
    case "add": {
      revertAddOp(op, transform, node, pos);
      break;
    }
    case "move": {
      revertMoveOp(op, transform, node, pos);
      break;
    }
    default:
      console.warn("revertStructureMark", "unknown op", { op });
      break;
  }

  transform.steps.forEach((step) => {
    tr.step(step);
  });
}

// given a suggestion id
// return an array of suggestion ids to revert
// resolve suggestion dependencies, meaning,
// if to revert suggestion id 1 you need to revert 2, and to revert 2 you need to revert 3
// it will return [3,2,1]
// todo: this should probably use topological sort at some point
function buildOrderedSuggestionIds(
  node: Node,
  suggestionId: SuggestionId,
  materializedPaths: MaterializedPaths,
) {
  const { structure } = getSuggestionMarks(node.type.schema);

  // collect marks with the given suggestionId
  const markGroup: { mark: Mark; node: Node; pos: number }[] = [];

  node.descendants((descendant, pos) => {
    if (descendant.isText) return true;
    if (!structure.isInSet(descendant.marks)) return true;

    descendant.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      if (mark.attrs["id"] !== suggestionId) return;

      markGroup.push({ mark, node: descendant, pos });
    });

    return true;
  });

  const suggestionIds = new Set<SuggestionId>();
  suggestionIds.add(suggestionId);

  // find first mark that doesn't have a matching op.to
  const mismatch = markGroup.find((mark) => {
    const nodeId = getNodeId(mark.node);
    if (nodeId == null) return false;

    const parentChain = materializedPaths.get(nodeId);
    if (parentChain == null) return false;

    const { attrs } = mark.mark;
    if (!guardStructureMarkAttrs(attrs)) return false;

    if (attrs.data.op.op !== "move") return false;

    return !sameParentChain(attrs.data.op.to, parentChain.chain);
  });

  if (mismatch == null) {
    return Array.from(suggestionIds).reverse();
  }

  console.log(
    "findOrderedSuggestionIdsToRevert",
    "suggestion",
    suggestionId,
    "contains mark with a mismatched 'to':",
    mismatch,
    "searching a different suggestion with the matching 'to'...",
  );

  // find first mark on the node that does have a matching op.to
  const match = mismatch.node.marks.find((mark) => {
    if (mark.type !== structure) return false;

    const { attrs } = mark;
    if (!guardStructureMarkAttrs(attrs)) return false;

    if (attrs.data.op.op !== "move") return false;

    const nodeId = getNodeId(mismatch.node);
    if (nodeId == null) return false;

    const parentChain = materializedPaths.get(nodeId);
    if (parentChain == null) return false;

    return sameParentChain(attrs.data.op.to, parentChain.chain);
  });

  if (match) {
    console.log(
      "findOrderedSuggestionIdsToRevert",
      "found suggestin with matching 'to'",
      match,
    );
    suggestionIds.add(match.attrs["id"] as SuggestionId);
  }

  return Array.from(suggestionIds).reverse();
}

function findNextStructureMark(doc: Node, suggestionId: SuggestionId) {
  console.log("findNextStructureMark", suggestionId);
  const { structure } = getSuggestionMarks(doc.type.schema);

  let structureMark = null as { mark: Mark; node: Node; pos: number } | null;

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    const mark = node.marks.find(
      (mark) => mark.type === structure && mark.attrs["id"] === suggestionId,
    );
    if (mark) {
      structureMark = { mark, node, pos };
    }
    return structureMark === null;
  });

  if (structureMark) {
    console.log(
      "findStructureMark",
      "found structure mark with id",
      suggestionId,
      { structureMark, suggestionId },
    );
  } else {
    console.log(
      "findStructureMark",
      "no structure mark found with id",
      suggestionId,
    );
  }

  return structureMark;
}
