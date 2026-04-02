import { type Node } from "prosemirror-model";
import { getSuggestionMarks } from "../../utils.js";
import { type Mark } from "prosemirror-model";
import { getNodeId } from "./getNodeId.js";
import { Transform } from "prosemirror-transform";
import { type SuggestionId } from "../../generateId.js";
import {
  type AddOp,
  type DocWithChildren,
  guardDocParent,
  guardDocWithChildren,
  guardStructureMarkAttrs,
  type MoveOp,
  type NodeWithChildren,
  type Parent,
} from "./types.js";

/* public */

export function applyAllStructureSuggestions(node: Node) {
  const tr = new Transform(node);
  applyAllStructureMarks(tr);
  return tr;
}

export function revertAllStructureSuggestions(node: Node) {
  const tr = new Transform(node);
  revertAllStructureMarks(tr);
  return tr;
}

export function applyOneStructureSuggestion(
  node: Node,
  suggestionId: SuggestionId,
) {
  const tr = new Transform(node);
  applyStructureMarkGroup(tr, suggestionId);
  return tr;
}

export function revertOneStructureSuggestion(
  node: Node,
  suggestionId: SuggestionId,
) {
  const tr = new Transform(node);
  revertStructureMarkGroup(tr, suggestionId);
  return tr;
}

export function applyAllStructureSuggestionsOnNode(
  node: Node,
  from?: number,
  to?: number,
): Transform {
  const tr = new Transform(node);
  applyAllStructureMarksOnNode(tr, node, from, to);
  return tr;
}

export function revertAllStructureSuggestionsOnNode(
  node: Node,
  from?: number,
  to?: number,
) {
  const tr = new Transform(node);
  revertAllStructureMarksOnNode(tr, node, from, to);
  return tr;
}

/* private */

function applyAllStructureMarks(tr: Transform) {
  applyAllStructureMarksOnNode(tr, tr.doc);
}

function revertAllStructureMarks(tr: Transform) {
  revertAllStructureMarksOnNode(tr, tr.doc);
}

function applyAllStructureMarksOnNode(
  tr: Transform,
  node: Node,
  from?: number,
  to?: number,
) {
  const { structure } = getSuggestionMarks(node.type.schema);

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
      const suggestionId = mark.attrs["id"] as SuggestionId;
      suggestionIds.add(suggestionId);
    });

    return true;
  });

  for (const suggestionId of suggestionIds) {
    applyStructureMarkGroup(tr, suggestionId);
  }
}

function revertAllStructureMarksOnNode(
  tr: Transform,
  node: Node,
  from?: number,
  to?: number,
) {
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
      const suggestionId = mark.attrs["id"] as SuggestionId;
      suggestionIds.add(suggestionId);
    });

    return true;
  });

  for (const suggestionId of suggestionIds) {
    revertStructureMarkGroup(tr, suggestionId);
  }
}

function applyStructureMarkGroup(tr: Transform, suggestionId: SuggestionId) {
  const { structure } = getSuggestionMarks(tr.doc.type.schema);
  tr.doc.descendants((node, pos) => {
    if (node.isText) return true;
    if (!structure.isInSet(node.marks)) return true;
    node.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      if (mark.attrs["id"] !== suggestionId) return;
      applyStructureMark(tr, mark, pos);
    });
    return true;
  });
}

function revertStructureMarkGroup(tr: Transform, suggestionId: SuggestionId) {
  console.group("reverting structure suggestion", suggestionId);
  let structureMark = findNextStructureMark(tr.doc, suggestionId);
  while (structureMark !== null) {
    console.groupCollapsed(
      "reverting structure mark",
      structureMark.mark.attrs["id"],
      "at pos",
      structureMark.pos,
      "at node",
      `${String(getNodeId(structureMark.node))}::${structureMark.node.type.name}::"${structureMark.node.textContent}"`,
      { structureMark },
    );
    revertStructureMark(tr, structureMark.mark, structureMark.pos);
    console.groupEnd();
    structureMark = findNextStructureMark(tr.doc, suggestionId);
  }
  console.groupEnd();
}

function applyStructureMark(tr: Transform, mark: Mark, pos: number) {
  tr.removeNodeMark(pos, mark);
}

function revertStructureMark(tr: Transform, mark: Mark, pos: number) {
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
    `${String(getNodeId(node))}::${node.type.name}::"${node.textContent}"`,
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
      revertAdd(op, transform, node, pos);
      break;
    }
    case "move": {
      revertMove(op, transform, node, pos);
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

function revertAdd(op: AddOp, tr: Transform, node: Node, pos: number) {
  console.log(
    "revertAdd",
    "node",
    `${String(getNodeId(node))}::${node.type.name}::"${node.textContent}"`,
    "was added at",
    pos,
    { op, node, pos },
  );
  deleteNodeWithParents(tr, node, pos);
}

function revertMove(op: MoveOp, tr: Transform, node: Node, pos: number) {
  console.log(
    "revertMove",
    "node",
    `${String(getNodeId(node))}::${node.type.name}::"${node.textContent}"`,
    "was moved from",
    op.from,
    { op, node },
  );

  const parent = getDeepestSurvivingParent(op.from, tr.doc);
  console.log(
    "revertMove",
    "deepest surviving parent is",
    `${String(getNodeId(parent.node))}::${parent.node.type.name}::"${parent.node.textContent}"`,
    { parent },
  );

  const child = wrapNodeInParentChain(parent.remainingChain, node);
  console.log(
    "revertMove",
    "wrapped node in parent chain is",
    `${String(getNodeId(child))}::${child.type.name}::"${child.textContent}"`,
    { child },
  );

  const insertionPos = findInsertionPos(parent.node, parent.pos, parent.parent);
  console.log("revertMove", "insertion pos", { insertionPos });

  tr.insert(insertionPos, child);

  const mappedPos = tr.mapping.map(pos);
  deleteNodeWithParents(tr, node, mappedPos);
}

function findNextStructureMark(doc: Node, suggestionId?: SuggestionId) {
  const { structure } = getSuggestionMarks(doc.type.schema);

  let structureMark = null as { mark: Mark; node: Node; pos: number } | null;

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    const mark = structure.isInSet(node.marks) ?? null;
    if (mark && (suggestionId == null || mark.attrs["id"] === suggestionId)) {
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
  }

  return structureMark;
}

function getNodesWithChildren(doc: Node) {
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
function getDeepestSurvivingParent(parentChain: Parent[], doc: Node) {
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
function wrapNodeInParentChain(parentChain: Parent[], node: Node) {
  let child = node.copy(node.content);

  for (const parent of parentChain) {
    const schema = node.type.schema;

    const nodeType = schema.nodes[parent.nodeType];
    if (!nodeType) {
      throw new Error(`node type ${parent.nodeType} not found in schema`);
    }

    const marks = parent.nodeMarks.map((mark) => schema.markFromJSON(mark));

    child = nodeType.create(parent.nodeAttrs, child, marks);
  }

  return child;
}

// given a node, its position, and a parent descriptor of this node in some parent chain,
// use the info from the descriptor to find the insertion position in the node
// first try to find siblings, fallback to end of node
function findInsertionPos(node: Node, pos: number | null, parent: Parent) {
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

// delete a given node, and traverse upwards deleting parent nodes if they are now empty
function deleteNodeWithParents(transform: Transform, node: Node, pos: number) {
  let $mappedPos = transform.doc.resolve(pos);

  let deleteFrom = $mappedPos.pos;
  let deleteTo = $mappedPos.pos + node.nodeSize;
  console.log(
    "deleteNodeWithParents",
    "initial delete range covers node",
    `${String(getNodeId(node))}::${node.type.name}::"${node.textContent}"`,
    { deleteFrom, deleteTo, $mappedPos },
  );

  while ($mappedPos.depth > 0) {
    $mappedPos = transform.doc.resolve($mappedPos.before());
    if ($mappedPos.nodeAfter?.childCount !== 1) break;

    deleteFrom = $mappedPos.pos;
    deleteTo = $mappedPos.pos + $mappedPos.nodeAfter.nodeSize;

    console.log(
      "deleteNodeWithParents",
      "expanded delete range to cover node",
      `${String(getNodeId($mappedPos.nodeAfter))}::${$mappedPos.nodeAfter.type.name}::"${$mappedPos.nodeAfter.textContent}"`,
      {
        deleteFrom,
        deleteTo,
        $mappedPos,
      },
    );
  }

  console.log(
    "deleteNodeWithParents",
    "final delete range covers node",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    `${String(getNodeId($mappedPos.nodeAfter!))}::${$mappedPos.nodeAfter!.type.name}::"${$mappedPos.nodeAfter!.textContent}"`,
    { deleteFrom, deleteTo, $mappedPos },
  );
  transform.delete(deleteFrom, deleteTo);
}
