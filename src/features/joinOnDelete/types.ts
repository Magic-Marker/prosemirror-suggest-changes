import { type Mark, type Attrs, type Node } from "prosemirror-model";
import { getSuggestionMarks } from "../../utils.js";

export interface SerializedJoinNode {
  type: string;
  attrs: object;
  marks: { attrs: Record<string, unknown> }[];
}

export interface JoinMarkAttrs {
  type: "join";
  data: {
    // Legacy shape from single-depth Block join suggestions.
    leftNode?: SerializedJoinNode;
    rightNode?: SerializedJoinNode;
    // Current child-first shape for multi-depth Block join suggestions.
    leftNodes?: SerializedJoinNode[];
    rightNodes?: SerializedJoinNode[];
  };
}

export interface JoinPair {
  leftNode: Node;
  rightNode: Node;
}

export interface JoinCandidate {
  joinPos: number;
  leftNodes: Node[];
  rightNodes: Node[];
}

export function isSerializedJoinNode(
  node: unknown,
): node is SerializedJoinNode {
  if (node === null || typeof node !== "object") return false;

  const data = node as Record<keyof SerializedJoinNode, unknown>;
  return (
    typeof data.type === "string" &&
    typeof data.attrs === "object" &&
    data.attrs !== null &&
    Array.isArray(data.marks)
  );
}

export function isJoinMarkAttrs(attrs: Attrs): attrs is JoinMarkAttrs {
  if (attrs["type"] !== "join") return false;
  if (attrs["data"] == null) return false;
  return true;
}

export function isJoinMarkObject(
  mark: unknown,
): mark is Omit<Mark, "attrs"> & { attrs: JoinMarkAttrs } {
  if (mark === null || typeof mark !== "object") return false;
  if (!("attrs" in mark)) return false;
  return isJoinMarkAttrs(mark.attrs as Attrs);
}

export function isJoinMark(
  mark: Mark,
): mark is Omit<Mark, "attrs"> & { attrs: JoinMarkAttrs } {
  const { deletion } = getSuggestionMarks(mark.type.schema);
  return mark.type === deletion && isJoinMarkAttrs(mark.attrs);
}
