import { type Transaction } from "prosemirror-state";
import { transformToSuggestionTransaction } from "../../../transformToSuggestionTransaction.js";
import { type HandleSpecialTransactionShapeArgs } from "../types.js";
import { detectProseMirrorSplitBlockAfterSelectionDelete } from "./detectProseMirrorSplitBlockAfterSelectionDelete.js";

export function handleProseMirrorSplitBlockAfterSelectionDelete(
  args: HandleSpecialTransactionShapeArgs,
): Transaction | null {
  if (!detectProseMirrorSplitBlockAfterSelectionDelete(args.transaction)) {
    return null;
  }

  // Unlike the TipTap join shape, both steps belong to the main suggestion
  // route: deletion marks preserve the selected content, and split handling
  // marks the created split side. Structure tracking would drop the deletion.
  return transformToSuggestionTransaction(
    args.transaction,
    args.state,
    args.generateId,
  );
}
