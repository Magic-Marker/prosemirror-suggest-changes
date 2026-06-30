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

export type StructureMarkRole = "primary" | "supporting";

interface StructureMoveMarkData {
  op: MoveOp;
  role?: StructureMarkRole;
}

interface StructureAddMarkData {
  op: AddOp;
  role?: StructureMarkRole;
}

interface StructureMoveMarkAttrs {
  id: SuggestionId;
  data: StructureMoveMarkData;
}

interface StructureAddMarkAttrs {
  id: SuggestionId;
  data: StructureAddMarkData;
}

export type StructureMarkAttrs = StructureMoveMarkAttrs | StructureAddMarkAttrs;

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

export function getStructureMarkRole(
  attrs: StructureMarkAttrs,
): StructureMarkRole {
  return attrs.data.role === "supporting" ? "supporting" : "primary";
}

export function guardStructureMoveMarkAttrs(
  attrs: Attrs,
): attrs is StructureMoveMarkAttrs {
  return guardStructureMarkAttrs(attrs) && attrs.data.op.op === "move";
}

export function guardStructureAddMarkAttrs(
  attrs: Attrs,
): attrs is StructureAddMarkAttrs {
  return guardStructureMarkAttrs(attrs) && attrs.data.op.op === "add";
}

export interface StructureMarkObject {
  type: "structure";
  attrs: StructureMarkAttrs;
}

export function guardStructureMarkObject(
  mark: unknown,
): mark is StructureMarkObject {
  if (mark === null || typeof mark !== "object") return false;
  if (!("type" in mark) || mark.type !== "structure") return false;
  if (!("attrs" in mark)) return false;
  return guardStructureMarkAttrs(mark.attrs as Attrs);
}
