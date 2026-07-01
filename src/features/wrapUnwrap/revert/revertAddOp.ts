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
  // A Structure add marks the content node, but reverting it may also need to
  // remove now-empty structural parents that only existed to contain it.
  deleteNodeUpwards(tr, node, pos);
}
