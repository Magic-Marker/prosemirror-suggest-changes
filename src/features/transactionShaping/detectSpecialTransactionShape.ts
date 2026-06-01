import { type Transaction } from "prosemirror-state";
import { detectTipTapParagraphIntoListJoin } from "./tipTapParagraphIntoListJoin/detectTipTapParagraphIntoListJoin.js";
import { type SpecialTransactionShape } from "./types.js";

export function detectSpecialTransactionShape(
  transaction: Transaction,
): SpecialTransactionShape | null {
  return detectTipTapParagraphIntoListJoin(transaction);
}
