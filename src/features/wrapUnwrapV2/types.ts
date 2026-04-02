import { type Attrs, type Node } from "prosemirror-model";

export type NodeIdGenerator = (
  node: Node,
  pos: number,
  parent: Node | null,
  index: number,
) => string;

interface NonDocNodeWithChildren {
  node: Node;
  pos: number;
  children: Set<string>;
}

export interface DocWithChildren extends Omit<NonDocNodeWithChildren, "pos"> {
  pos: null;
}

export type NodeWithChildren = NonDocNodeWithChildren | DocWithChildren;

interface NodeParent {
  nodeId: string;
  nodeType: string;
  nodeAttrs: object;
  nodeMarks: object[];
  childSiblingIds: [string | null, string | null];
  childIndex: number;
}

export interface DocParent extends Omit<NodeParent, "nodeId"> {
  nodeId: "__doc__";
  nodeType: "__doc__";
}

export type Parent = NodeParent | DocParent;

export interface MoveOp {
  op: "move";
  from: Parent[];
}

export interface AddOp {
  op: "add";
}

export type Op = MoveOp | AddOp;

export type MaterializedPaths = Map<
  string,
  { chain: Parent[]; nodeType: string }
>;

export function guardDocParent(
  parent: Parent | undefined,
): parent is DocParent {
  return (
    parent != null &&
    parent.nodeId === "__doc__" &&
    parent.nodeType === "__doc__"
  );
}

export function guardStructureMarkAttrs(
  attrs: Attrs,
): attrs is { data: { op: Op } } {
  if (!("data" in attrs)) return false;

  const data = attrs["data"] as unknown;
  if (data === null || typeof data !== "object") return false;

  if (!("op" in data)) return false;

  return true;
}

export function guardDocWithChildren(
  nodeWithChildren: NodeWithChildren | undefined,
): nodeWithChildren is DocWithChildren {
  return nodeWithChildren != null && nodeWithChildren.pos === null;
}
