import { type Mark } from "prosemirror-model";
import { sameParentChain } from "./sameParentChain.js";
import { guardStructureMarkAttrs } from "./types.js";

export function areEquivalentStructureMarks(a: Mark, b: Mark) {
  if (a.type !== b.type) return false;
  if (!guardStructureMarkAttrs(a.attrs)) return false;
  if (!guardStructureMarkAttrs(b.attrs)) return false;

  const aOp = a.attrs.data.op;
  const bOp = b.attrs.data.op;
  if (aOp.op !== bOp.op) return false;

  if (aOp.op === "add" && bOp.op === "add") {
    return a.attrs.id === b.attrs.id;
  }

  if (aOp.op === "move" && bOp.op === "move") {
    return (
      sameParentChain(aOp.from, bOp.from) && sameParentChain(aOp.to, bOp.to)
    );
  }

  return false;
}
