import { type Parent } from "./types.js";

export function sameParentChain(
  parentChainA: Parent[],
  parentChainB: Parent[],
) {
  if (parentChainA.length !== parentChainB.length) return false;
  return parentChainA.every(
    (parent, index) => parent.nodeId === parentChainB[index]?.nodeId,
  );
}
