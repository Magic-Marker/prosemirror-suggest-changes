import { getNodeId } from "./getNodeId.js";
import {
  type MaterializedPaths,
  type DocParent,
  type Parent,
} from "./types.js";
import { type Node } from "prosemirror-model";

const TRACE_ENABLED = true;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[structureChanges]", ...args);
}

export function buildMaterializedPaths(doc: Node): MaterializedPaths {
  const perfPaths = performance.now();
  const paths: MaterializedPaths = new Map();

  // add direct doc children first since they have a specific parent signature due to doc not having an ID
  doc.children.forEach((node, index, children) => {
    const nodeId = getNodeId(node);
    if (nodeId == null) return;

    const leftSibling = children[index - 1];
    const leftSiblingId = leftSibling ? getNodeId(leftSibling) : null;

    const rightSibling = children[index + 1];
    const rightSiblingId = rightSibling ? getNodeId(rightSibling) : null;

    const parent: DocParent = {
      nodeId: "__doc__",
      nodeType: "__doc__",
      nodeAttrs: {},
      nodeMarks: [],
      childSiblingIds: [leftSiblingId, rightSiblingId],
      childIndex: index,
    };

    paths.set(nodeId, { nodeType: node.type.name, chain: [parent] });
  });

  // now add the rest of the nodes
  doc.descendants((node, _pos, parent, childIndex) => {
    if (node.isText) return false;

    const nodeId = getNodeId(node);
    if (nodeId == null) return true;

    // this is to avoid processing direct doc children twice
    if (paths.has(nodeId)) return true;

    if (parent == null) return true;

    const parentId = getNodeId(parent);
    if (parentId == null) return true;

    // by definition, for any node it's parent chain should already exist
    // because we go downwards
    const parentChain = paths.get(parentId);
    if (parentChain == null) return true;

    const leftSibling = parent.children[childIndex - 1];
    const leftSiblingId = leftSibling ? getNodeId(leftSibling) : null;

    const rightSibling = parent.children[childIndex + 1];
    const rightSiblingId = rightSibling ? getNodeId(rightSibling) : null;

    // (this node parent chain) is (parent chain of the parent node) + (the parent node itself)

    const parentDesc: Parent = {
      nodeId: parentId,
      nodeType: parent.type.name,
      nodeAttrs: parent.attrs,
      nodeMarks: parent.marks.map((mark) => mark.toJSON() as object),
      childSiblingIds: [leftSiblingId, rightSiblingId],
      childIndex: childIndex,
    };

    const chain: Parent[] = [parentDesc, ...parentChain.chain];
    paths.set(nodeId, { nodeType: node.type.name, chain });

    return true;
  });

  trace(
    "perf",
    "buildMaterializedPaths",
    "took",
    Number((performance.now() - perfPaths).toFixed(2)),
    "ms",
  );

  return paths;
}
