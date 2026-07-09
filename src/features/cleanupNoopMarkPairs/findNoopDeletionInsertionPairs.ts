import { type Node } from "prosemirror-model";

import { getSuggestionMarks } from "../../utils.js";
import { collectSuggestionRunsInTextblock } from "./collectSuggestionRunsInTextblock.js";
import { getCandidateTextblockRanges } from "./getCandidateTextblockRanges.js";
import { isNoopDeletionInsertionPair } from "./isNoopDeletionInsertionPair.js";
import { pairAdjacentDeletionInsertionRuns } from "./pairAdjacentDeletionInsertionRuns.js";
import { type Range, type SuggestionPair } from "./types.js";

/**
 * Find no-op deletion/insertion pairs in the given ranges
 */
export function findNoopDeletionInsertionPairs(
  doc: Node,
  ranges: Range[],
): SuggestionPair[] {
  const { deletion, insertion } = getSuggestionMarks(doc.type.schema);

  return getCandidateTextblockRanges(doc, ranges).flatMap((textblockRange) =>
    pairAdjacentDeletionInsertionRuns(
      collectSuggestionRunsInTextblock(doc, textblockRange),
    ).filter((pair) => isNoopDeletionInsertionPair(pair, deletion, insertion)),
  );
}
