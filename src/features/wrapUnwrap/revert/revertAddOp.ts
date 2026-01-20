import { type Transform } from "prosemirror-transform";
import { type AddOp } from "../types.js";
import { deleteNodeUpwards } from "./deleteNodeUpwards.js";
import { type Node } from "prosemirror-model";

export function revertAddOp(
  _op: AddOp,
  tr: Transform,
  node: Node,
  pos: number,
) {
  deleteNodeUpwards(tr, node, pos);
}
