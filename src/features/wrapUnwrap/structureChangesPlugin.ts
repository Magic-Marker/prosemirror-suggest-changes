import { type Schema, type Node } from "prosemirror-model";
import {
  type EditorState,
  Plugin,
  PluginKey,
  type Transaction,
} from "prosemirror-state";
import { getSuggestionMarks } from "../../utils.js";
import { generateNextNumberId, type SuggestionId } from "../../generateId.js";
import { getNodeId } from "./getNodeId.js";
import {
  guardStructureMarkAttrs,
  type MoveOp,
  type Op,
  type MaterializedPaths,
  type Parent,
  type StructuralContextPath,
} from "./types.js";
import { DOC_NODE_ID, STRUCTURE_CHANGES_ADD_MARKS } from "./constants.js";
import { Transform } from "prosemirror-transform";
import { isSuggestChangesEnabled, suggestChangesKey } from "../../plugin.js";
import { buildMaterializedPaths } from "./buildMaterializedPaths.js";
import { sameParentChain } from "./sameParentChain.js";

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[structureChanges]", ...args);
}

export const structureChangesKey = new PluginKey(
  "@handlewithcare/prosemirror-suggest-changes-structure-changes",
);

export type SuggestStructureChangesReason = "split-derived-add";

export interface SuggestStructureChangesResult {
  handled: boolean;
  transform: Transform;
  reason?: SuggestStructureChangesReason;
}

export function structureChangesPlugin(
  generateId?: (schema: Schema, doc?: Node) => SuggestionId,
  opts?: { experimental_trackStructures?: StructuralContextPath[] },
) {
  const structuralContextPaths = getRequiredStructuralContextPaths(
    opts?.experimental_trackStructures,
  );

  return new Plugin({
    key: structureChangesKey,
    appendTransaction(transactions, _oldState, newState) {
      if (transactions.some((tr) => !isEnabled(tr, newState))) {
        console.warn(
          "structureChangesPlugin",
          "tracking changes is disabled, skipping structure changes plugin",
          [...transactions],
        );
        return;
      }

      // do nothing if doc hasn't changed
      const docChanged = transactions.some(
        (transaction) => transaction.docChanged,
      );
      if (!docChanged) {
        console.warn("structureChangesPlugin", "doc not changed, skipping", [
          ...transactions,
        ]);
        return;
      }

      const firstTr = transactions[0];
      const lastTr = transactions[transactions.length - 1];

      const oldDoc = firstTr?.docs[0];
      const newDoc = lastTr?.doc;

      // do nothing if there isn't a pair of docs to compare
      if (!oldDoc || !newDoc) {
        console.warn(
          "structureChangesPlugin",
          "old or new doc is missing, skipping",
          {
            oldDoc,
            newDoc,
            transactions: [...transactions],
          },
        );
        return;
      }

      let idsSettled = true as boolean;

      newDoc.descendants((node, pos) => {
        if (node.isText) return true;
        const nodeId = getNodeId(node);
        if (nodeId == null) {
          console.warn(
            "structureChangesPlugin",
            "node",
            node.type.name,
            "at pos",
            pos,
            "is missing a unique id",
            { id: node.attrs["id"] as unknown },
          );
          idsSettled = false;
          return true;
        }
        return true;
      });

      oldDoc.descendants((node, pos) => {
        if (node.isText) return true;
        const nodeId = getNodeId(node);
        if (nodeId == null) {
          console.warn(
            "structureChangesPlugin",
            "node",
            node.type.name,
            "at pos",
            pos,
            "is missing a unique id",
            { id: node.attrs["id"] as unknown },
          );
          idsSettled = false;
          return true;
        }
        return true;
      });

      // do nothing if some nodes are missing unique ids - the diff is not possible then
      if (!idsSettled) {
        console.warn("structureChangesPlugin", "ids not settled, skipping", {
          oldDoc,
          newDoc,
          transactions: [...transactions],
        });
        return;
      }

      trace("structureChangesPlugin", "appendTransaction", [...transactions]);

      const { transform } = suggestStructureChanges(
        oldDoc,
        newDoc,
        structuralContextPaths,
        generateId,
      );

      const tr = newState.tr;
      transform.steps.forEach((step) => {
        tr.step(step);
      });

      if (!tr.steps.length) return;

      tr.setMeta(structureChangesKey, STRUCTURE_CHANGES_ADD_MARKS);
      return tr;
    },
  });
}

function isEnabled(tr: Transaction, editorState: EditorState) {
  const ySyncMeta = (tr.getMeta("y-sync$") ?? {}) as {
    isUndoRedoOperation?: boolean;
    isChangeOrigin?: boolean;
  };

  const isEnabled =
    isSuggestChangesEnabled(editorState) &&
    !tr.getMeta("history$") &&
    !tr.getMeta("collab$") &&
    !ySyncMeta.isUndoRedoOperation &&
    !ySyncMeta.isChangeOrigin &&
    !("skip" in (tr.getMeta(suggestChangesKey) ?? {}));

  return isEnabled;
}

export function suggestStructureChanges(
  docBefore: Node,
  docAfter: Node,
  structuralContextPaths: StructuralContextPath[],
  generateId?: (schema: Schema, doc?: Node) => SuggestionId,
): SuggestStructureChangesResult {
  const suggestionId = generateId
    ? generateId(docBefore.type.schema, docBefore)
    : generateNextNumberId(docBefore.type.schema, docBefore);

  const pathsBefore = buildMaterializedPaths(docBefore);
  const pathsAfter = buildMaterializedPaths(docAfter);

  trace("suggestStructureChanges", "materialized paths", {
    pathsBefore: Object.fromEntries(pathsBefore.entries()),
    pathsAfter: Object.fromEntries(pathsAfter.entries()),
  });

  const { ops, reason } = getOps(
    pathsBefore,
    pathsAfter,
    structuralContextPaths,
  );
  trace("suggestStructureChanges", "ops", {
    ops: Object.fromEntries(ops.entries()),
    reason,
  });

  const transform = new Transform(docAfter);

  if (reason) {
    // A reason is an intentional fallthrough, not an error. The Structure
    // detector recognized a shape that should be handled by normal suggestion
    // tracking.
    return { handled: false, transform, reason };
  }

  addMarks(ops, transform, suggestionId);

  return { handled: ops.size > 0, transform };
}

export function getRequiredStructuralContextPaths(
  structuralContextPaths: StructuralContextPath[] | undefined,
) {
  if (!structuralContextPaths?.length) {
    throw new Error(
      "experimental_trackStructures must be provided when structure tracking is enabled",
    );
  }

  return structuralContextPaths;
}

function addMarks(
  ops: Map<string, Op>,
  tr: Transform,
  suggestionId: SuggestionId,
) {
  const perfAddMarks = performance.now();
  const { structure } = getSuggestionMarks(tr.doc.type.schema);
  tr.doc.descendants((node, pos) => {
    if (node.isText) return true;

    const nodeId = getNodeId(node);
    if (nodeId == null) return true;

    const op = ops.get(nodeId);
    if (op == null) return true;

    if (op.op === "move") {
      // A provisional Structure add already means this node is not accepted yet.
      // Moving it should not create a second review artifact until the add is
      // accepted.
      if (hasStructureAddMark(node)) return true;

      const inverseMoveMark = findInverseStructureMoveMark(node, op);
      if (inverseMoveMark) {
        tr.removeNodeMark(pos, inverseMoveMark);
        return true;
      }
    }

    tr.addNodeMark(pos, structure.create({ id: suggestionId, data: { op } }));

    return true;
  });
  trace(
    "perf",
    "addMarks",
    "took",
    Number((performance.now() - perfAddMarks).toFixed(2)),
    "ms",
  );
}

function findInverseStructureMoveMark(node: Node, op: MoveOp) {
  const { structure } = getSuggestionMarks(node.type.schema);
  return node.marks.find((mark) => {
    if (mark.type !== structure) return false;
    if (!guardStructureMarkAttrs(mark.attrs)) return false;

    const existingOp = mark.attrs.data.op;
    if (existingOp.op !== "move") return false;

    return (
      sameParentChain(existingOp.from, op.to) &&
      sameParentChain(existingOp.to, op.from)
    );
  });
}

function hasStructureAddMark(node: Node) {
  const { structure } = getSuggestionMarks(node.type.schema);
  return node.marks.some((mark) => {
    if (mark.type !== structure) return false;
    if (!guardStructureMarkAttrs(mark.attrs)) return false;
    return mark.attrs.data.op.op === "add";
  });
}

function getOps(
  beforePaths: MaterializedPaths,
  afterPaths: MaterializedPaths,
  structuralContextPaths: StructuralContextPath[],
): { ops: Map<string, Op>; reason?: SuggestStructureChangesReason } {
  const ops = new Map<string, Op>();
  const contextNodeTypes = getStructuralContextNodeTypes(
    structuralContextPaths,
  );

  // first take care of nodes that exist in both
  for (const [id, beforePath] of beforePaths) {
    if (contextNodeTypes.has(beforePath.nodeType)) continue;

    const afterPath = afterPaths.get(id);
    // node was removed - do nothing
    if (afterPath == null) continue;
    if (contextNodeTypes.has(afterPath.nodeType)) continue;

    const sameChain = sameParentChain(beforePath.chain, afterPath.chain);
    // node did not move anywhere - do nothing
    if (sameChain) continue;

    const hasStructuralContext =
      chainHasStructuralContext(beforePath.chain, structuralContextPaths) ||
      chainHasStructuralContext(afterPath.chain, structuralContextPaths);
    // node is outside configured structural contexts
    if (!hasStructuralContext) continue;

    const op: Op = { op: "move", from: beforePath.chain, to: afterPath.chain };
    ops.set(id, op);
  }

  // now take care of nodes that exist only in afterPaths
  // (we don't care about nodes that exist only in beforePaths - they were deleted)

  for (const [id, afterPath] of afterPaths) {
    if (contextNodeTypes.has(afterPath.nodeType)) continue;

    // ignore nodes that also exist in beforePaths - they are already handled
    if (beforePaths.has(id)) continue;

    const hasStructuralContext = chainHasStructuralContext(
      afterPath.chain,
      structuralContextPaths,
    );
    // node is outside configured structural contexts
    if (!hasStructuralContext) continue;

    // detect block split - if detected, bail out, and let the main plugin handle it
    if (isSplitDerivedAdd(id, beforePaths, afterPaths, contextNodeTypes)) {
      return { ops: new Map(), reason: "split-derived-add" };
    }

    // node was added
    const op: Op = { op: "add" };
    ops.set(id, op);
  }

  return { ops };
}

function getStructuralContextNodeTypes(
  structuralContextPaths: StructuralContextPath[],
) {
  return new Set(structuralContextPaths.flat());
}

function chainHasStructuralContext(
  chain: Parent[],
  structuralContextPaths: StructuralContextPath[],
) {
  const topDownChain = [...chain]
    .reverse()
    .filter((parent) => parent.nodeType !== DOC_NODE_ID)
    .map((parent) => parent.nodeType);

  return structuralContextPaths.some((path) =>
    containsContiguousPath(topDownChain, path),
  );
}

// does a chain like: nodeTypeA->nodeTypeB->nodeTypeC
// end with a structural context path like nodeTypeB->nodeTypeC ?
function containsContiguousPath(
  chainNodeTypes: string[],
  structuralContextPath: StructuralContextPath,
) {
  if (structuralContextPath.length > chainNodeTypes.length) return false;

  let structuralPathPointer = structuralContextPath.length - 1;
  let chainPointer = chainNodeTypes.length - 1;

  while (structuralPathPointer >= 0) {
    if (
      structuralContextPath[structuralPathPointer] !==
      chainNodeTypes[chainPointer]
    ) {
      return false;
    }

    structuralPathPointer--;
    chainPointer--;
  }

  return true;
}

// detect block split - try to look at the node above, concatenate two text contents,
// and see if it combines into a single node in the old document
function isSplitDerivedAdd(
  newNodeId: string,
  beforePaths: MaterializedPaths,
  afterPaths: MaterializedPaths,
  contextNodeTypes: Set<string>,
) {
  const newNode = afterPaths.get(newNodeId)?.node;
  // Empty after-only nodes are not considered split-derived in whole-doc diff
  // mode. Without a step-local proof of a split, keep them as Structure adds.
  if (!newNode || newNode.textContent === "") return false;

  if (
    matchesSplitDerivedPair(
      newNodeId,
      newNode.textContent,
      beforePaths,
      afterPaths,
    )
  ) {
    return true;
  }

  const afterPath = afterPaths.get(newNodeId);
  if (!afterPath) return false;

  for (const parent of afterPath.chain) {
    if (parent.nodeType === DOC_NODE_ID) continue;
    if (!contextNodeTypes.has(parent.nodeType)) continue;

    const parentNode = afterPaths.get(parent.nodeId)?.node;
    if (!parentNode || parentNode.textContent === "") continue;

    if (
      matchesSplitDerivedPair(
        parent.nodeId,
        parentNode.textContent,
        beforePaths,
        afterPaths,
      )
    ) {
      return true;
    }
  }

  return false;
}

function matchesSplitDerivedPair(
  rightNodeId: string,
  rightText: string,
  beforePaths: MaterializedPaths,
  afterPaths: MaterializedPaths,
) {
  const rightPath = afterPaths.get(rightNodeId);
  const previousSiblingId = rightPath?.chain[0]?.childSiblingIds[0];
  if (!previousSiblingId) return false;

  const previousBefore = beforePaths.has(previousSiblingId)
    ? beforePaths.get(previousSiblingId)?.node
    : null;
  const previousAfter = afterPaths.has(previousSiblingId)
    ? afterPaths.get(previousSiblingId)?.node
    : null;

  if (!previousBefore || !previousAfter) return false;
  if (hasStructureAddMarkInSubtree(previousBefore)) return false;

  return previousBefore.textContent === previousAfter.textContent + rightText;
}

function hasStructureAddMarkInSubtree(node: Node) {
  if (hasStructureAddMark(node)) return true;

  let found = false;
  node.descendants((descendant) => {
    if (descendant.isText) return false;
    if (!hasStructureAddMark(descendant)) return true;
    found = true;
    return false;
  });

  return found;
}
