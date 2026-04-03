import { type Node } from "prosemirror-model";

export function getNodeId(node: Node) {
  const nodeId = node.attrs["id"] as unknown;
  if (typeof nodeId !== "string") return null;
  return nodeId;
}
