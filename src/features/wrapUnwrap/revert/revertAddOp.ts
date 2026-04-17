import { type Transform } from "prosemirror-transform";
import { type AddOp } from "../types.js";
import { deleteNodeUpwards } from "./deleteNodeUpwards.js";
import { type Node } from "prosemirror-model";

export function revertAddOp(op: AddOp, tr: Transform, node: Node, pos: number) {
  console.log("revertAddOp", "node", node.toString(), "was added at", pos, {
    op,
    node,
    pos,
  });
  deleteNodeUpwards(tr, node, pos);
}
