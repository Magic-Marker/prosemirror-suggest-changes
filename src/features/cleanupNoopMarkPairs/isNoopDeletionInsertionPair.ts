import { Mark, type MarkType } from "prosemirror-model";

import { normalizeSuggestionRun } from "./normalizeSuggestionRun.js";
import { type SuggestionPair } from "./types.js";

/**
 * Decides whether a structural deletion/insertion pair has no user-visible
 * difference once suggestion marks themselves are ignored.
 */
export function isNoopDeletionInsertionPair(
  pair: SuggestionPair,
  deletion: MarkType,
  insertion: MarkType,
) {
  const deletionSegments = normalizeSuggestionRun(
    pair.deletion,
    deletion,
    insertion,
  );
  const insertionSegments = normalizeSuggestionRun(
    pair.insertion,
    deletion,
    insertion,
  );

  if (deletionSegments.length !== insertionSegments.length) return false;

  for (let index = 0; index < deletionSegments.length; index++) {
    // The length check above proves both indexed segments exist; the assertions
    // keep noUncheckedIndexedAccess from forcing impossible runtime branches.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const deletionSegment = deletionSegments[index]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const insertionSegment = insertionSegments[index]!;

    if (
      deletionSegment.text !== insertionSegment.text ||
      !Mark.sameSet(deletionSegment.marks, insertionSegment.marks)
    ) {
      return false;
    }
  }

  return true;
}
