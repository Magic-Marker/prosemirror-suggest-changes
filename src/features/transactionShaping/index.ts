import { type Transaction } from "prosemirror-state";
import { handleProseMirrorSplitBlockAfterSelectionDelete } from "./proseMirrorSplitBlockAfterSelectionDelete/index.js";
import { handleTipTapParagraphIntoListJoin } from "./tipTapParagraphIntoListJoin/index.js";
import { type HandleSpecialTransactionShapeArgs } from "./types.js";

type SpecialTransactionShapeHandler = (
  args: HandleSpecialTransactionShapeArgs,
) => Transaction | null;

const specialTransactionShapeHandlers: SpecialTransactionShapeHandler[] = [
  // Handlers are ordered from most direct fallthrough to partial reshaping.
  // A whole-transaction main-route escape should claim its shape before any
  // handler tries to split a compound transaction into structure/main phases.
  handleProseMirrorSplitBlockAfterSelectionDelete,
  handleTipTapParagraphIntoListJoin,
];

export function handleSpecialTransactionShape(
  args: HandleSpecialTransactionShapeArgs,
): Transaction | null {
  for (const handler of specialTransactionShapeHandlers) {
    const transaction = handler(args);
    if (transaction) return transaction;
  }

  return null;
}
