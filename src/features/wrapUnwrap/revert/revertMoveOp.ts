import { type Transform } from "prosemirror-transform";
import { type MoveOp } from "../types.js";
import { type Node } from "prosemirror-model";
import { deleteNodeUpwards } from "./deleteNodeUpwards.js";
import { getNodeId } from "../getNodeId.js";
import {
  type DocWithChildren,
  guardDocParent,
  guardDocWithChildren,
  type NodeWithChildren,
  type Parent,
} from "../types.js";

export function revertMoveOp(
  op: MoveOp,
  tr: Transform,
  node: Node,
  pos: number,
) {
  console.log(
    "revertMoveOp",
    "node",
    node.toString(),
    "was moved from",
    op.from,
    { op, node },
  );

  const parent = getDeepestSurvivingParent(op.from, tr.doc);
  console.log(
    "revertMoveOp",
    "deepest surviving parent is",
    parent.node.toString(),
    { parent },
  );

  const child = wrapNodeInParentChain(parent.remainingChain, node);
  console.log(
    "revertMoveOp",
    "wrapped node in parent chain is",
    child.toString(),
    { child },
  );

  const insertionPos = findInsertionPos(parent.node, parent.pos, parent.parent);
  console.log("revertMoveOp", "insertion pos", { insertionPos });

  tr.insert(insertionPos, child);

  const mappedPos = tr.mapping.map(pos);
  deleteNodeUpwards(tr, node, mappedPos);
}

export function getNodesWithChildren(doc: Node) {
  const nodesWithChildren = new Map<string, NodeWithChildren>();

  const docWithChildren: DocWithChildren = {
    node: doc,
    pos: null,
    children: new Set<string>(),
  };

  doc.children.forEach((child) => {
    const nodeId = getNodeId(child);
    if (nodeId == null) return;
    docWithChildren.children.add(nodeId);
  });

  nodesWithChildren.set("__doc__", docWithChildren);

  doc.descendants((node, pos) => {
    if (node.isText) return true;

    const nodeId = getNodeId(node);
    if (nodeId == null) return true;

    if (nodesWithChildren.has(nodeId)) return true;

    const children = node.children.reduce((acc, child) => {
      const childId = getNodeId(child);
      if (childId == null) return acc;
      acc.add(childId);
      return acc;
    }, new Set<string>());

    nodesWithChildren.set(nodeId, {
      node,
      pos,
      children,
    });

    return true;
  });

  return nodesWithChildren;
}

// given a chain of parent node descriptors, follow the chain from top to bottom as long as nodes exist
// return the deepest existing parent node descriptor, along with the actual node and the pos in the current document
// also return the remaining part of the chain
export function getDeepestSurvivingParent(parentChain: Parent[], doc: Node) {
  const chain = [...parentChain].reverse();

  const currentNodes = getNodesWithChildren(doc);

  let currentNode = currentNodes.get("__doc__"); // get doc node with children from current doc
  if (!guardDocWithChildren(currentNode)) {
    throw new Error("doc not found in nodesWithChildren");
  }

  let parent = chain.shift(); // get doc node descriptor from parent chain
  if (!guardDocParent(parent)) {
    throw new Error("doc parent not found in op chain");
  }

  let remainingChain: Parent[] = [];

  for (const [index, nextParent] of chain.entries()) {
    const nextNodeWithChildren = currentNodes.get(nextParent.nodeId);

    // nextParent does not exist in the current document at all
    if (nextNodeWithChildren == null) {
      remainingChain = chain.slice(index);
      break;
    }

    // nextParent exists in the document, but in a different parent chain
    if (!currentNode.children.has(nextParent.nodeId)) {
      remainingChain = chain.slice(index);
      break;
    }

    currentNode = nextNodeWithChildren;
    parent = nextParent;
  }

  return {
    parent,
    node: currentNode.node,
    pos: currentNode.pos,
    remainingChain: [...remainingChain].reverse(),
  };
}

// given a chain of parent node descriptors and a node
// wrap the node in the parent chain
export function wrapNodeInParentChain(parentChain: Parent[], node: Node) {
  let child = node.copy(node.content);

  for (const parent of parentChain) {
    const schema = node.type.schema;

    const nodeType = schema.nodes[parent.nodeType];
    if (!nodeType) {
      throw new Error(`node type ${parent.nodeType} not found in schema`);
    }

    const marks = parent.nodeMarks.map((mark) => schema.markFromJSON(mark));

    child = nodeType.create(parent.nodeAttrs, child, marks);
    child.check();
  }

  return child;
}

// given a node, its position, and a parent descriptor of this node in some parent chain,
// use the info from the descriptor to find the insertion position in the node
// first try to find siblings, fallback to end of node
export function findInsertionPos(
  node: Node,
  pos: number | null,
  parent: Parent,
) {
  let leftSibling = null as { node: Node; pos: number } | null;
  let rightSibling = null as { node: Node; pos: number } | null;

  node.descendants((child, localChildPos) => {
    const childId = getNodeId(child);
    if (childId == null) return false;

    const globalChildPos =
      pos != null ? pos + 1 + localChildPos : localChildPos;

    if (parent.childSiblingIds[0] === childId) {
      leftSibling = { node: child, pos: globalChildPos };
    }

    if (parent.childSiblingIds[1] === childId) {
      rightSibling = { node: child, pos: globalChildPos };
    }

    // iterate only direct children
    return false;
  });

  if (rightSibling != null) {
    // insert before right sibling
    return rightSibling.pos;
  }

  if (leftSibling != null) {
    // insert after left sibling
    return leftSibling.pos + leftSibling.node.nodeSize;
  }

  // insert at end of node
  return pos != null ? pos + node.nodeSize - 1 : node.nodeSize - 1;
}
