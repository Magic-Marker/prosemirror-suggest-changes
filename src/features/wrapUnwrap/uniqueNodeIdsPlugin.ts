import { type Node } from "prosemirror-model";
import { Plugin, PluginKey, type Transaction } from "prosemirror-state";
import { getNodeId } from "./getNodeId.js";
import { Transform } from "prosemirror-transform";

// unique ids plugin
// https://discuss.prosemirror.net/t/how-to-avoid-copying-attributes-to-new-paragraph/4568/2
// (also checks and fix duplicates that inevitably appear)

export const uniqueNodeIdsPluginKey = new PluginKey<{
  completedInitialRun: boolean;
}>("@handlewithcare/prosemirror-suggest-changes-unique-node-ids");

export const UNIQUE_NODE_IDS_PLUGIN_META = "unique-node-ids-plugin";

export function uniqueNodeIdsPlugin({
  attributeName,
  generateID,
}: {
  attributeName: string;
  generateID: () => string;
}) {
  return new Plugin<{ completedInitialRun: boolean }>({
    key: uniqueNodeIdsPluginKey,
    appendTransaction(transactions, oldState, newState) {
      console.log("uniqueNodeIdsPlugin.appendTransaction");
      const pluginState = uniqueNodeIdsPluginKey.getState(newState);

      // do nothing if doc hasn't changed (but make sure it runs initially)
      const docChanged = transactions.some(
        (transaction) => transaction.docChanged,
      );
      if (!docChanged && pluginState?.completedInitialRun) {
        console.warn("uniqueNodeIdsPlugin", "doc not changed, skipping", [
          ...transactions,
        ]);
        return;
      }

      console.groupCollapsed("uniqueNodeIdsPlugin", "appendTransaction");
      console.log("uniqueNodeIdsPlugin", "appendTransaction", [
        ...transactions,
      ]);

      const tr = newState.tr;

      const transform = ensureUniqueNodeIds(
        transactions as Transaction[],
        oldState.doc,
        newState.doc,
        {
          attributeName,
          generateID,
        },
      );

      transform.steps.forEach((step) => {
        tr.step(step);
      });

      console.log("ensureUniqueNodeIdsPlugin", "tr steps", tr.steps);
      console.groupEnd();

      if (!tr.steps.length) return;

      tr.setMeta(uniqueNodeIdsPluginKey, UNIQUE_NODE_IDS_PLUGIN_META);
      return tr;
    },
    state: {
      init() {
        return { completedInitialRun: false };
      },
      apply(tr, value) {
        const meta = tr.getMeta(uniqueNodeIdsPluginKey) as string | undefined;
        if (
          meta === UNIQUE_NODE_IDS_PLUGIN_META &&
          !value.completedInitialRun
        ) {
          return { completedInitialRun: true };
        }
        return value;
      },
    },
  });
}

export function ensureUniqueNodeIds(
  _transactions: Transaction[],
  _oldDoc: Node,
  newDoc: Node,
  options: {
    attributeName: string;
    generateID: () => string;
  },
): Transform {
  const tr = new Transform(newDoc);

  const nodeIds = new Set<string>();

  tr.doc.descendants((node, pos) => {
    if (node.isText) return false;

    const nodeId = getNodeId(node);

    // nodeId is set and is not duplicated
    if (nodeId != null && !nodeIds.has(nodeId)) {
      nodeIds.add(nodeId);
      return true;
    }

    // nodeId is set and it is duplicated
    if (nodeId != null && nodeIds.has(nodeId)) {
      const id = options.generateID();
      nodeIds.add(id);
      tr.setNodeMarkup(
        pos,
        node.type,
        {
          ...node.attrs,
          [options.attributeName]: id,
        },
        node.marks,
      );
      console.log(
        "ensureUniqueNodeIds",
        "fixed duplicate id",
        id,
        "for node",
        node.type.name,
        "at pos",
        pos,
        { was: nodeId, is: id },
      );
      return true;
    }

    // node id is not set
    if (nodeId == null) {
      const id = options.generateID();
      nodeIds.add(id);
      tr.setNodeMarkup(
        pos,
        node.type,
        {
          ...node.attrs,
          [options.attributeName]: id,
        },
        node.marks,
      );
      console.log(
        "ensureUniqueNodeIds",
        "set unique id",
        id,
        "for node",
        node.type.name,
        "at pos",
        pos,
      );
      return true;
    }

    return true;
  });

  return tr;
}
