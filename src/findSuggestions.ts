import { type Node, type Mark } from "prosemirror-model";
import { type SuggestionId } from "./generateId.js";
import { type EditorState } from "prosemirror-state";
import { getSuggestionMarks } from "./utils.js";

export interface NodeWithMark {
  mark: Mark;
  node: Node;
  pos: number;
}

export interface SuggestionRange {
  from: number;
  nodes: NodeWithMark[];
  to: number;
}

export interface DocumentSuggestions {
  deletions: Record<SuggestionId, SuggestionRange>;
  insertions: Record<SuggestionId, SuggestionRange>;
  modifications: Record<SuggestionId, SuggestionRange>;
}

/**
 * Track a suggestion in the aggregated map
 */
const trackSuggestion = (
  map: Record<SuggestionId, SuggestionRange>,
  pos: number,
  mark: Mark,
  node: Node,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const prev = map[mark.attrs["id"]];
  if (prev) {
    prev.nodes.push({ mark, node, pos });
    prev.to = pos + node.nodeSize;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    map[mark.attrs["id"]] = {
      from: pos,
      nodes: [{ mark, node, pos }],
      to: pos + node.nodeSize,
    };
  }
};

/**
 * Find all suggestions in the document with both individual mark data and aggregated ranges
 * This unified function serves both decoration needs and integrity checking
 */
export const findSuggestions = (state: EditorState): DocumentSuggestions => {
  const suggestions: DocumentSuggestions = {
    deletions: {},
    insertions: {},
    modifications: {},
  };

  const { deletion, insertion, modification } = getSuggestionMarks(
    state.schema,
  );

  state.doc.descendants((node, pos) => {
    node.marks.forEach((mark) => {
      switch (mark.type.name) {
        case deletion.name: {
          trackSuggestion(suggestions.deletions, pos, mark, node);
          break;
        }
        case insertion.name: {
          trackSuggestion(suggestions.insertions, pos, mark, node);
          break;
        }
        case modification.name: {
          trackSuggestion(suggestions.modifications, pos, mark, node);
          break;
        }
      }
    });
  });

  return suggestions;
};
