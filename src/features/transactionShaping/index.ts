import { type Transaction } from "prosemirror-state";
import { handleTipTapParagraphIntoListJoin } from "./tipTapParagraphIntoListJoin/index.js";
import { type HandleSpecialTransactionShapeArgs } from "./types.js";

type SpecialTransactionShapeHandler = (
  args: HandleSpecialTransactionShapeArgs,
) => Transaction | null;

const specialTransactionShapeHandlers: SpecialTransactionShapeHandler[] = [
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
