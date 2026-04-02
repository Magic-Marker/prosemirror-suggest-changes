/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Node } from "prosemirror-model";

export function generateNodeId(
  node: Node,
  pos: number,
  parent: Node | null,
  index: number,
) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `node-${Math.random().toString(36).slice(2)}`;
}
