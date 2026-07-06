import { Mark, type MarkType } from "prosemirror-model";

import { type SuggestionRun } from "./types.js";

interface NormalizedInlineSegment {
  text: string;
  marks: readonly Mark[];
}

/**
 * Removes suggestion-only metadata from a run so no-op detection compares the
 * inline content users see, not incidental ProseMirror text-node boundaries.
 */
export function normalizeSuggestionRun(
  run: SuggestionRun,
  deletion: MarkType,
  insertion: MarkType,
): NormalizedInlineSegment[] {
  const normalizedSegments: NormalizedInlineSegment[] = [];

  for (const segment of run.segments) {
    const text = segment.node.text ?? "";
    const marks = segment.node.marks.filter(
      (mark) => mark.type !== deletion && mark.type !== insertion,
    );
    const previousSegment = normalizedSegments[normalizedSegments.length - 1];

    if (previousSegment && Mark.sameSet(previousSegment.marks, marks)) {
      previousSegment.text += text;
      continue;
    }

    normalizedSegments.push({ text, marks });
  }

  return normalizedSegments;
}
