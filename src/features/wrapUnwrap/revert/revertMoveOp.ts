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

// given a chain of parent node descriptors, follow the chain from top to bottom as long as nodes exist
// return the deepest existing parent node descriptor, along with the actual node and the pos in the current document
// also return the remaining part of the chain
export function getDeepestSurvivingParent(parentChain: Parent[], doc: Node) {
  const chain = [...parentChain].reverse();

  const root = chain.shift();
  if (root == null) {
    throw new Error("Parent chain is empty");
  }

  let result: { parent: Parent; node: Node; pos: number | null } = {
    parent: root,
    node: doc,
    pos: null,
  };

  let remainingChain: Parent[] = [...chain];

  // follow the chain up-down
  // look for the node with the matching id in the children of the previously found node
  for (const [index, item] of chain.entries()) {
    let found = false as boolean;

    result.node.forEach((child, offset) => {
      if (found) return;
      if (child.attrs["id"] !== item.nodeId) return;

      found = true;
      const pos = result.pos == null ? offset : result.pos + 1 + offset;
      result = {
        parent: item,
        node: child,
        pos,
      };
      remainingChain = chain.slice(index + 1);
    });

    if (!found) break;
  }

  return {
    parent: result.parent,
    node: result.node,
    pos: result.pos,
    remainingChain: remainingChain.reverse(),
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

    const parentNode = nodeType.createAndFill(parent.nodeAttrs, child, marks);
    if (parentNode == null)
      throw new Error(
        `Unable to create node ${nodeType.name} with child ${child.toString()}`,
      );

    child = parentNode;
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
