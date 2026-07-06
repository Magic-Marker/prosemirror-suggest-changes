import { type Transaction } from "prosemirror-state";
import { Transform } from "prosemirror-transform";

import { getSuggestionMarks } from "../../utils.js";
import { findNoopDeletionInsertionPairs } from "./findNoopDeletionInsertionPairs.js";
import { type Range } from "./types.js";

/**
 * Find no-op deletion/insertion pairs and remove them
 * Leaving only one copy of their content behind
 */
export function cleanupNoopDeletionInsertionPairs(
  transaction: Transaction,
  ranges: Range[],
): Transaction {
  const { deletion } = getSuggestionMarks(transaction.doc.type.schema);

  // process right to left so we don't need to rebase positions
  const pairs = findNoopDeletionInsertionPairs(transaction.doc, ranges)
    .slice()
    .sort((a, b) => b.deletion.from - a.deletion.from);
  const transform = new Transform(transaction.doc);

  for (const pair of pairs) {
    transform.delete(pair.insertion.from, pair.insertion.to);
    transform.removeMark(pair.deletion.from, pair.deletion.to, deletion);
  }

  transform.steps.forEach((step) => {
    transaction.step(step);
  });

  return transaction;
}
