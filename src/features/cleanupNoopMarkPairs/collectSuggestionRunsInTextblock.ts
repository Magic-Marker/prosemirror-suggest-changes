import { type Node } from "prosemirror-model";

import { type SuggestionId } from "../../generateId.js";
import { getSuggestionMarks } from "../../utils.js";
import { type SuggestionRun, type TextblockRange } from "./types.js";

/**
 * Finds contiguous suggestion runs inside textblocks so later stages can pair
 * runs structurally instead of reinterpreting individual text nodes.
 */
export function collectSuggestionRunsInTextblock(
  doc: Node,
  textblockRange: TextblockRange,
): SuggestionRun[] {
  const { deletion, insertion } = getSuggestionMarks(doc.type.schema);
  const runs: SuggestionRun[] = [];
  let currentRun: SuggestionRun | null = null;

  // A run is meaningful only while suggestion-marked text is contiguous. Any
  // interruption makes the next suggestion text a separate cleanup candidate.
  const flush = () => {
    if (!currentRun) return;
    runs.push(currentRun);
    currentRun = null;
  };

  doc.nodesBetween(textblockRange.from, textblockRange.to, (node, pos) => {
    if (!node.isText) {
      // Non-text inline content may have its own semantics. For this first pass,
      // it is a hard boundary rather than something to compare or collapse.
      flush();
      return true;
    }

    // starting and ending position of this text node
    const from = pos;
    const to = pos + node.nodeSize;

    const deletionMark = deletion.isInSet(node.marks);
    const insertionMark = insertion.isInSet(node.marks);

    let kind: SuggestionRun["kind"];
    let id: SuggestionId;

    if (deletionMark) {
      kind = "deletion";
      id = deletionMark.attrs["id"] as SuggestionId;
    } else if (insertionMark) {
      kind = "insertion";
      id = insertionMark.attrs["id"] as SuggestionId;
    } else {
      // Unmarked text is a real gap between suggestions, so the next marked text
      // must start a separate cleanup candidate.
      flush();
      return false;
    }

    // if current node kind matches the current run kind, extend the current run
    if (
      currentRun &&
      currentRun.kind === kind &&
      currentRun.id === id &&
      currentRun.to === from
    ) {
      // ProseMirror can split adjacent text by non-suggestion marks. Keep them
      // in one run when the suggestion identity is still continuous.
      currentRun.to = to;
      currentRun.segments.push({ from, to, node });
      return false;
    }

    // otherwise flush the current run and initialize a new one
    flush();
    currentRun = {
      kind,
      id,
      from,
      to,
      segments: [{ from, to, node }],
    };

    return false;
  });

  flush();
  return runs;
}
