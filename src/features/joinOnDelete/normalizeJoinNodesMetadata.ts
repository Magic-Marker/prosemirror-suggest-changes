import { isSerializedJoinNode, type JoinMarkAttrs } from "./types.js";

// Block join suggestion metadata/revert currently supports the depth TipTap uses
// when Backspace joins both list-item paragraphs and their parent list items.
export const MAX_BLOCK_JOIN_DEPTH = 2;

export function normalizeJoinNodesMetadata(attrs: JoinMarkAttrs) {
  const data = attrs.data;

  // Normalize legacy metadata so revert can use the same array path.
  const leftNodes = data.leftNodes ?? (data.leftNode ? [data.leftNode] : null);
  const rightNodes =
    data.rightNodes ?? (data.rightNode ? [data.rightNode] : null);

  if (!Array.isArray(leftNodes) || !Array.isArray(rightNodes)) return false;
  if (leftNodes.length === 0 || leftNodes.length !== rightNodes.length)
    return false;

  // Reject unsupported depths instead of partially reverting unknown structure.
  if (leftNodes.length > MAX_BLOCK_JOIN_DEPTH) return false;

  if (!leftNodes.every(isSerializedJoinNode)) return false;
  if (!rightNodes.every(isSerializedJoinNode)) return false;

  return { leftNodes, rightNodes };
}
