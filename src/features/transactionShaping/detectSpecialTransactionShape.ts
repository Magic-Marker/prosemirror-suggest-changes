import { type Transaction } from "prosemirror-state";
import { detectProseMirrorSplitBlockAfterSelectionDelete } from "./proseMirrorSplitBlockAfterSelectionDelete/index.js";
import { detectTipTapParagraphIntoListJoin } from "./tipTapParagraphIntoListJoin/detectTipTapParagraphIntoListJoin.js";
import { type SpecialTransactionShape } from "./types.js";

export function detectSpecialTransactionShape(
  transaction: Transaction,
): SpecialTransactionShape | null {
  return (
    detectProseMirrorSplitBlockAfterSelectionDelete(transaction) ??
    detectTipTapParagraphIntoListJoin(transaction)
  );
}
