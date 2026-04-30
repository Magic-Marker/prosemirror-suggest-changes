import { type Attrs } from "prosemirror-model";
import { type SuggestionId } from "../../generateId.js";

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

export interface DocParent extends Omit<NodeParent, "nodeId"> {
  nodeId: "__doc__";
  nodeType: "__doc__";
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
): attrs is StructureMarkAttrs {
  if (!("data" in attrs)) return false;

  const data = attrs["data"] as unknown;
  if (data === null || typeof data !== "object") return false;

  if (!("op" in data)) return false;

  return true;
}
