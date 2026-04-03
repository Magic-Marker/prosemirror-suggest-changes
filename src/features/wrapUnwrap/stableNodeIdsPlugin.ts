import { type Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { getNodeId } from "./getNodeId.js";
import { Transform } from "prosemirror-transform";
import { type NodeIdGenerator } from "./types.js";

// stable ids plugin
// https://discuss.prosemirror.net/t/how-to-avoid-copying-attributes-to-new-paragraph/4568/2
// (also checks and fix duplicates that inevitably appear)

export const stableNodeIdsKey = new PluginKey<{ completedInitialRun: boolean }>(
  "@handlewithcare/prosemirror-suggest-changes-stable-node-ids",
);

export const STABLE_NODE_IDS_PLUGIN_META = "stable-node-ids-plugin";

export function stableNodeIds(generateNodeId: NodeIdGenerator) {
  return new Plugin<{ completedInitialRun: boolean }>({
    key: stableNodeIdsKey,
    appendTransaction(transactions, _oldState, newState) {
      console.log("stableNodeIdsPlugin.appendTransaction");
      const pluginState = stableNodeIdsKey.getState(newState);

      // do nothing if doc hasn't changed (but make sure it runs initially)
      const docChanged = transactions.some(
        (transaction) => transaction.docChanged,
      );
      if (!docChanged && pluginState?.completedInitialRun) {
        console.warn("doc not changed, skipping stable node ids plugin", [
          ...transactions,
        ]);
        return;
      }

      console.groupCollapsed("stableNodeIdsPlugin", "appendTransaction");
      console.log("stableNodeIdsPlugin", "appendTransaction", [
        ...transactions,
      ]);

      const tr = newState.tr;
      const transform = ensureStableIds(tr.doc, generateNodeId);
      transform.steps.forEach((step) => {
        tr.step(step);
      });

      console.log("tr steps", tr.steps);
      console.groupEnd();

      if (!tr.steps.length) return;

      tr.setMeta(stableNodeIdsKey, STABLE_NODE_IDS_PLUGIN_META);
      return tr;
    },
    state: {
      init() {
        return { completedInitialRun: false };
      },
      apply(tr, value) {
        const meta = tr.getMeta(stableNodeIdsKey) as string | undefined;
        if (
          meta === STABLE_NODE_IDS_PLUGIN_META &&
          !value.completedInitialRun
        ) {
          return { completedInitialRun: true };
        }
        return value;
      },
    },
  });
}

export function ensureStableIds(
  doc: Node,
  generateNodeId: NodeIdGenerator,
): Transform {
  const tr = new Transform(doc);

  const nodeIds = new Set<string>();

  tr.doc.descendants((node, pos, parent, index) => {
    if (node.isText) return false;

    const nodeId = getNodeId(node);

    // nodeId is set and is not duplicated
    if (nodeId != null && !nodeIds.has(nodeId)) {
      nodeIds.add(nodeId);
      return true;
    }

    // nodeId is set and it is duplicated
    if (nodeId != null && nodeIds.has(nodeId)) {
      const id = generateNodeId(node, pos, parent, index);
      nodeIds.add(id);
      tr.setNodeMarkup(
        pos,
        node.type,
        {
          ...node.attrs,
          id,
        },
        node.marks,
      );
      console.log(
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
      const id = generateNodeId(node, pos, parent, index);
      nodeIds.add(id);
      tr.setNodeMarkup(
        pos,
        node.type,
        {
          ...node.attrs,
          id,
        },
        node.marks,
      );
      console.log(
        "set stable id",
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
