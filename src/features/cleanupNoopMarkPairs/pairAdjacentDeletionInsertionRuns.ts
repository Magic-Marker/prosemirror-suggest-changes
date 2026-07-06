import { type SuggestionPair, type SuggestionRun } from "./types.js";

/**
 * Finds structural Deletion/Insertion Mark Pairs without deciding whether the
 * paired content is semantically no-op.
 */
export function pairAdjacentDeletionInsertionRuns(
  runs: SuggestionRun[],
): SuggestionPair[] {
  const pairs: SuggestionPair[] = [];

  for (let index = 1; index < runs.length; index++) {
    // The loop bounds prove these exist; the assertions are only for
    // noUncheckedIndexedAccess, not runtime uncertainty.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const deletion = runs[index - 1]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const insertion = runs[index]!;

    // Only deletion -> insertion can cancel into ordinary content. Reversed or
    // differently-id'd neighbors are separate suggestions, even if adjacent.
    if (
      deletion.kind !== "deletion" ||
      insertion.kind !== "insertion" ||
      deletion.id !== insertion.id ||
      deletion.to !== insertion.from
    ) {
      continue;
    }

    pairs.push({ deletion, insertion });
  }

  return pairs;
}
