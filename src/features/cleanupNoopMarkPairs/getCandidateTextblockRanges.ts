import { type Node } from "prosemirror-model";

import { mergeRanges } from "./mergeRanges.js";
import { type Range, type TextblockRange } from "./types.js";

/**
 * Expands changed ranges to whole textblock content ranges because a no-op pair
 * may start just outside the exact step map range but cannot cross textblocks.
 */
export function getCandidateTextblockRanges(
  doc: Node,
  ranges: Range[],
): TextblockRange[] {
  const textblockRanges: TextblockRange[] = [];

  for (const range of mergeRanges(ranges)) {
    const { from, to } = range;
    if (from >= to) continue;

    const $from = doc.resolve(from);
    // `to` is exclusive. Resolving `to - 1` anchors the block range in content
    // that actually belongs to this changed window.
    const $to = doc.resolve(to - 1);
    const blockRange = $from.blockRange($to);
    if (!blockRange) continue;

    doc.nodesBetween(blockRange.start, blockRange.end, (node, pos) => {
      if (!node.isTextblock) return true;

      const textblockRange = {
        from: pos + 1,
        to: pos + node.nodeSize - 1,
      };
      // The block range can include neighboring textblocks in the same parent
      // structure; only scan textblocks that the original seed actually touched.
      const overlapsRange =
        textblockRange.from < to && textblockRange.to > from;
      if (overlapsRange) {
        textblockRanges.push(textblockRange);
      }

      return false;
    });
  }

  // make sure we don't have duplicated textblock ranges
  // meaning ranges that cover the same textblock
  const seenRanges = new Set<string>();
  const uniqueRanges: TextblockRange[] = [];
  for (const range of textblockRanges) {
    // Multiple changed ranges can expand to the same textblock. Deduping here
    // prevents duplicate pairs without making callers reason about scan windows.
    const key = `${String(range.from)}:${String(range.to)}`;
    if (seenRanges.has(key)) continue;
    seenRanges.add(key);
    uniqueRanges.push(range);
  }

  return uniqueRanges;
}
