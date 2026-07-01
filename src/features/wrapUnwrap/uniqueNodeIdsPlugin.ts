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

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[uniqueNodeIdsPlugin]", ...args);
}

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
      trace("appendTransaction");
      const pluginState = uniqueNodeIdsPluginKey.getState(newState);

      // Structure tracking relies on stable node IDs even for the initial
      // document. Run once without a doc change, then only rerun after edits.
      const docChanged = transactions.some(
        (transaction) => transaction.docChanged,
      );
      if (!docChanged && pluginState?.completedInitialRun) {
        trace("doc not changed, skipping", [...transactions]);
        return;
      }

      trace("appendTransaction", [...transactions]);

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

      trace("tr steps", tr.steps);

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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (TRACE_ENABLED) console.groupCollapsed("ensureUniqueNodeIds");

  tr.doc.descendants((node, pos) => {
    if (node.isText) return false;

    const nodeId = getNodeId(node);

    if (nodeId != null && !nodeIds.has(nodeId)) {
      nodeIds.add(nodeId);
      return true;
    }

    // ProseMirror commands such as split can copy attrs onto new nodes. Duplicates
    // must be rewritten immediately or structure diffing cannot tell which node
    // moved and which node was newly materialized.
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
      trace(
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
      trace("set unique id", id, "for node", node.type.name, "at pos", pos);
      return true;
    }

    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (TRACE_ENABLED) console.groupEnd();

  return tr;
}
