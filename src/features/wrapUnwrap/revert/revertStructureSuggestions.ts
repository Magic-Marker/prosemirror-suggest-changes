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

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[revertStructureSuggestions]", ...args);
}

export function revertStructureSuggestionsInDoc({
  tr,
  suggestionId,
  from,
  to,
}: {
  tr: Transform;
  suggestionId?: SuggestionId;
  from?: number | undefined;
  to?: number | undefined;
}) {
  if (suggestionId) {
    // when suggestionId is given, just revert it, no other logic required
    revertStructureSuggestionWithPrerequisites(tr, suggestionId);
    return;
  }

  if (from || to) {
    // when range is given, find suggestion ids inside that range,
    // but make sure to revert furthermost suggestions first
    // todo: most likely a better strategy would be to search for the next suggestion in the updated doc after each reversal (and map from and to)
    const { structure } = getSuggestionMarks(tr.doc.type.schema);

    const structureMarks: { mark: Mark; node: Node; pos: number }[] = [];

    tr.doc.descendants((node, pos) => {
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
        structureMarks.push({ mark, node, pos });
      });

      return true;
    });

    structureMarks.sort((a, b) => b.pos - a.pos);

    const suggestionIds = new Set<SuggestionId>();
    structureMarks.forEach(({ mark }) => {
      suggestionIds.add(mark.attrs["id"] as SuggestionId);
    });

    for (const suggestionId of suggestionIds) {
      revertStructureSuggestionWithPrerequisites(tr, suggestionId);
    }

    return;
  }

  // if no suggestion id nor range is given, revert all suggestions one by one, always take furthermost first
  // after each reversal, the next suggestion is searched in the new doc after the previous reversal
  let nextSuggestionId = findNextStructureSuggestion(tr.doc);
  while (nextSuggestionId != null) {
    revertStructureSuggestionWithPrerequisites(tr, nextSuggestionId);
    nextSuggestionId = findNextStructureSuggestion(tr.doc);
  }
}

function revertStructureSuggestionWithPrerequisites(
  tr: Transform,
  suggestionId: SuggestionId,
) {
  const suggestionIds = buildOrderedSuggestionIds(
    tr.doc,
    suggestionId,
    buildMaterializedPaths(tr.doc),
  );
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (TRACE_ENABLED)
    console.group("reverting structure suggestions", suggestionIds);
  for (const suggestionId of suggestionIds) {
    revertOneStructureSuggestion(tr, suggestionId);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (TRACE_ENABLED) console.groupEnd();
}

function revertOneStructureSuggestion(
  tr: Transform,
  suggestionId: SuggestionId,
) {
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (TRACE_ENABLED)
    console.groupCollapsed("reverting structure suggestion", suggestionId);
  let structureMark = findNextStructureMark(tr.doc, suggestionId);
  while (structureMark !== null) {
    trace(
      "reverting structure suggestion",
      suggestionId,
      "structure mark",
      structureMark.mark,
      "at pos",
      structureMark.pos,
      "at node",
      structureMark.node.toString(),
    );
    revertStructureMark(tr, structureMark.mark, structureMark.pos);
    structureMark = findNextStructureMark(tr.doc, suggestionId);
    count++;
  }
  trace("reverted", count, "structure marks for suggestion", suggestionId);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (TRACE_ENABLED) console.groupEnd();
}

export function revertStructureMark(tr: Transform, mark: Mark, pos: number) {
  const transform = new Transform(tr.doc);
  transform.removeNodeMark(pos, mark);

  const node = transform.doc.nodeAt(pos);
  if (!node) {
    throw new Error(`Node not found at position ${String(pos)}`);
  }

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

  trace(
    "reverting structure mark with suggestion id",
    attrs.id,
    "at node",
    node.toString(),
    "at pos",
    pos,
    "with op",
    op.op,
    {
      mark,
      node,
      $pos: transform.doc.resolve(pos),
      op,
    },
  );

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
    trace(
      "suggestion",
      match.attrs["id"],
      "is a prerequisite for suggestion",
      suggestionId,
    );
    suggestionIds.add(match.attrs["id"] as SuggestionId);
  }

  return Array.from(suggestionIds).reverse();
}

function findNextStructureSuggestion(doc: Node): SuggestionId | null {
  const { structure } = getSuggestionMarks(doc.type.schema);

  const structureMarks: { mark: Mark; node: Node; pos: number }[] = [];

  doc.descendants((node, pos) => {
    if (node.isText) return true;
    if (!structure.isInSet(node.marks)) return true;

    node.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      structureMarks.push({ mark, node, pos });
    });

    return true;
  });

  structureMarks.sort((a, b) => b.pos - a.pos);

  return structureMarks[0]?.mark.attrs["id"] as SuggestionId | null;
}

// given a suggestion id, find next structure mark to revert that belongs to that suggestion
// always take furthermost mark first
function findNextStructureMark(node: Node, suggestionId: SuggestionId) {
  const { structure } = getSuggestionMarks(node.type.schema);

  const structureMarks: {
    mark: Mark;
    node: Node;
    pos: number;
  }[] = [];

  node.descendants((descendant, pos) => {
    // the assumption here is that a single node cannot have multiple structure marks with the same suggestion id
    // check the invariant
    const suggestionIds = new Set<SuggestionId>();
    descendant.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      const markSuggestionId = mark.attrs["id"] as SuggestionId;
      if (suggestionIds.has(markSuggestionId)) {
        console.warn(
          "node",
          node,
          "has multiple structure marks with the same suggestion id",
          markSuggestionId,
        );
      }
      suggestionIds.add(markSuggestionId);
    });

    const mark = descendant.marks.find(
      (mark) => mark.type === structure && mark.attrs["id"] === suggestionId,
    );
    if (mark == null) return true;
    structureMarks.push({
      mark,
      node: descendant,
      pos,
    });
    return true;
  });

  structureMarks.sort((a, b) => b.pos - a.pos);

  return structureMarks[0] ?? null;
}
