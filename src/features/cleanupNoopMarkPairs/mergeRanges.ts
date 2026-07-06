import { type Range } from "./types.js";

/**
 * Normalizes changed ranges before we expand them to textblocks, so adjacent
 * steps in one user transaction do not make us scan the same area repeatedly.
 */
export function mergeRanges(ranges: Range[]): Range[] {
  const sortedRanges = ranges
    .filter((range) => range.from < range.to)
    .slice()
    .sort((a, b) => a.from - b.from || a.to - b.to);

  const mergedRanges: Range[] = [];
  for (const range of sortedRanges) {
    const previousRange = mergedRanges[mergedRanges.length - 1];
    // Touching intervals can share a deletion/insertion pair at the boundary,
    // so treat them as one search window instead of two independent windows.
    if (!previousRange || range.from > previousRange.to) {
      mergedRanges.push({ ...range });
      continue;
    }

    previousRange.to = Math.max(previousRange.to, range.to);
  }

  return mergedRanges;
}
