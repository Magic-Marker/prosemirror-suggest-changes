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
import { type Op, type MaterializedPaths } from "./types.js";
import { LIST_NODES, STRUCTURE_CHANGES_ADD_MARKS } from "./constants.js";
import { Transform } from "prosemirror-transform";
import { isSuggestChangesEnabled, suggestChangesKey } from "../../plugin.js";
import { buildMaterializedPaths } from "./buildMaterializedPaths.js";
import { sameParentChain } from "./sameParentChain.js";

export const structureChangesKey = new PluginKey(
  "@handlewithcare/prosemirror-suggest-changes-structure-changes",
);

// const listStructure = {
//   type: [LIST_NODE],
//   children: [{ type: [LIST_ITEM_NODE] }],
// };

// const structures = [listStructure];

export function structureChangesPlugin(
  generateId?: (schema: Schema, doc?: Node) => SuggestionId,
) {
  return new Plugin({
    key: structureChangesKey,
    appendTransaction(transactions, oldState, newState) {
      if (transactions.some((tr) => !isEnabled(tr, newState))) {
        console.warn(
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
        console.warn("doc not changed, skipping structure changes plugin", [
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
          "old or new doc is missing, skipping structure changes plugin",
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
            "node",
            node.type.name,
            "at pos",
            pos,
            "is missing a stable id",
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
            "node",
            node.type.name,
            "at pos",
            pos,
            "is missing a stable id",
            { id: node.attrs["id"] as unknown },
          );
          idsSettled = false;
          return true;
        }
        return true;
      });

      // do nothing if some nodes are missing stable ids - the diff is not possible then
      if (!idsSettled) {
        console.warn("ids not settled, skipping structure changes plugin", {
          oldDoc,
          newDoc,
          transactions: [...transactions],
        });
        return;
      }

      console.log("structureChangesPlugin", "appendTransaction", [
        ...transactions,
      ]);

      const transform = suggestStructureChanges(oldDoc, newDoc, generateId);

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
  generateId?: (schema: Schema, doc?: Node) => SuggestionId,
): Transform {
  const suggestionId = generateId
    ? generateId(docBefore.type.schema, docBefore)
    : generateNextNumberId(docBefore.type.schema, docBefore);

  const pathsBefore = buildMaterializedPaths(docBefore);
  const pathsAfter = buildMaterializedPaths(docAfter);

  console.log("materialized paths", {
    pathsBefore: Object.fromEntries(pathsBefore.entries()),
    pathsAfter: Object.fromEntries(pathsAfter.entries()),
  });

  const ops = getOps(pathsBefore, pathsAfter);
  console.log("ops", { ops: Object.fromEntries(ops.entries()) });

  const transform = new Transform(docAfter);

  addMarks(ops, transform, suggestionId);

  return transform;
}

function addMarks(
  ops: Map<string, Op>,
  tr: Transform,
  suggestionId: SuggestionId,
) {
  const { structure } = getSuggestionMarks(tr.doc.type.schema);
  tr.doc.descendants((node, pos) => {
    if (node.isText) return true;

    const nodeId = getNodeId(node);
    if (nodeId == null) return true;

    const op = ops.get(nodeId);
    if (op == null) return true;

    tr.addNodeMark(pos, structure.create({ id: suggestionId, data: { op } }));

    return true;
  });
}

function getOps(beforePaths: MaterializedPaths, afterPaths: MaterializedPaths) {
  const ops = new Map<string, Op>();

  // first take care of nodes that exist in both
  for (const [id, beforePath] of beforePaths) {
    if (LIST_NODES.includes(beforePath.nodeType)) continue;

    const afterPath = afterPaths.get(id);
    // node was removed - do nothing
    if (afterPath == null) continue;

    const sameChain = sameParentChain(beforePath.chain, afterPath.chain);
    // node did not move anywhere - do nothing
    if (sameChain) continue;

    const hasList =
      beforePath.chain.some((parent) => LIST_NODES.includes(parent.nodeType)) ||
      afterPath.chain.some((parent) => LIST_NODES.includes(parent.nodeType));
    // node is outside lists
    if (!hasList) continue;

    const op: Op = { op: "move", from: beforePath.chain, to: afterPath.chain };
    ops.set(id, op);
  }

  // now take care of nodes that exist only in afterPaths
  // (we don't care about nodes that exist only in beforePaths - they were deleted)

  for (const [id, afterPath] of afterPaths) {
    if (LIST_NODES.includes(afterPath.nodeType)) continue;

    // ignore nodes that also exist in beforePaths - they are already handled
    if (beforePaths.has(id)) continue;

    const hasList = afterPath.chain.some((parent) =>
      LIST_NODES.includes(parent.nodeType),
    );
    // node is outside lists
    if (!hasList) continue;

    // node was added
    const op: Op = { op: "add" };
    ops.set(id, op);
  }

  return ops;
}
