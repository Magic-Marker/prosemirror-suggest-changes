import { type Transaction } from "prosemirror-state";
import { ReplaceStep, Transform } from "prosemirror-transform";
import { getNodeId } from "../../wrapUnwrap/getNodeId.js";
import { type TipTapParagraphIntoListJoinShape } from "../types.js";

// detect a very specific TipTap pattern where joining a paragraph into a list above it
// causes a 3-step transaction, which is different from normal prosemirror where you just get 1 step
// see unit test for details
export function detectTipTapParagraphIntoListJoin(
  transaction: Transaction,
): TipTapParagraphIntoListJoinShape | null {
  if (transaction.steps.length !== 3) return null;

  const [deleteStep, insertStep, joinStep] = transaction.steps;
  if (
    !(deleteStep instanceof ReplaceStep) ||
    !(insertStep instanceof ReplaceStep) ||
    !(joinStep instanceof ReplaceStep)
  ) {
    return null;
  }

  if (deleteStep.slice.content.size !== 0) return null;
  if (insertStep.from !== insertStep.to) return null;
  if (insertStep.slice.openStart !== 0 || insertStep.slice.openEnd !== 0)
    return null;
  if (insertStep.slice.content.childCount !== 1) return null;
  if (joinStep.slice.content.size !== 0) return null;
  if ((joinStep as ReplaceStep & { structure?: boolean }).structure !== true)
    return null;

  const docBefore = transaction.docs[0];
  if (!docBefore) return null;

  const movedNode = docBefore.nodeAt(deleteStep.from);
  if (
    !movedNode ||
    !movedNode.isTextblock ||
    movedNode.nodeSize !== deleteStep.to - deleteStep.from
  ) {
    return null;
  }

  const insertedNode = insertStep.slice.content.firstChild;
  if (!insertedNode?.isTextblock) return null;
  if (insertedNode.type !== movedNode.type) return null;
  if (insertedNode.textContent !== movedNode.textContent) return null;

  const movedNodeId = getNodeId(movedNode);
  if (!movedNodeId || getNodeId(insertedNode) !== movedNodeId) return null;

  const previousSibling = docBefore.resolve(deleteStep.from).nodeBefore;
  if (!previousSibling || previousSibling.isInline) return null;

  try {
    const preview = new Transform(docBefore);
    preview.step(deleteStep);
    preview.step(insertStep);
    new Transform(preview.doc).step(joinStep);
  } catch {
    return null;
  }

  console.warn(
    "[prosemirror-suggest-changes]",
    "detected TipTap paragraph into list join shape",
  );

  return {
    type: "tipTapParagraphIntoListJoin",
    deleteStep,
    insertStep,
    joinStep,
    movedNode,
  };
}
