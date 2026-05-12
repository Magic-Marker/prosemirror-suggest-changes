import { type Attrs, type Node } from "prosemirror-model";
import { type SuggestionId } from "../../generateId.js";
import { DOC_NODE_ID } from "./constants.js";

interface NodeParent {
  nodeId: string;
  nodeType: string;
  nodeAttrs: object;
  nodeMarks: object[];
  childSiblingIds: [string | null, string | null];
  childIndex: number;
}

export interface StructureMarkAttrs {
  id: SuggestionId;
  data: { op: Op };
}

export type StructuralContextPath = readonly [string, ...string[]];

export interface DocParent extends Omit<NodeParent, "nodeId"> {
  nodeId: typeof DOC_NODE_ID;
  nodeType: typeof DOC_NODE_ID;
}

export type Parent = NodeParent | DocParent;

export interface MoveOp {
  op: "move";
  from: Parent[];
  to: Parent[];
}

export interface AddOp {
  op: "add";
}

export type Op = MoveOp | AddOp;

export type MaterializedPaths = Map<
  string,
  { chain: Parent[]; nodeType: string; node: Node }
>;

export function guardDocParent(
  parent: Parent | undefined,
): parent is DocParent {
  return (
    parent != null &&
    parent.nodeId === DOC_NODE_ID &&
    parent.nodeType === DOC_NODE_ID
  );
}

export function guardStructureMarkAttrs(
  attrs: Attrs,
): attrs is StructureMarkAttrs {
  if (!("data" in attrs)) return false;

  const data = attrs["data"] as unknown;
  if (data === null || typeof data !== "object") return false;

  if (!("op" in data)) return false;

  return true;
}
