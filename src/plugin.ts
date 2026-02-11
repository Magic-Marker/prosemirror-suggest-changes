import {
  type EditorState,
  Plugin,
  PluginKey,
  TextSelection,
} from "prosemirror-state";
import { getSuggestionDecorations } from "./decorations.js";
import {
  type DocumentSuggestions,
  findSuggestions,
} from "./findSuggestions.js";
import { type SuggestionId } from "./generateId.js";
import { getSuggestionMarks } from "./utils.js";
import { Decoration, DecorationSet } from "prosemirror-view";

export const suggestChangesKey = new PluginKey<{
  enabled: boolean;
  decorations: DecorationSet;
}>("@handlewithcare/prosemirror-suggest-changes");

export function suggestChanges() {
  return new Plugin<{ enabled: boolean }>({
    key: suggestChangesKey,
    state: {
      init() {
        return { enabled: false, decorations: DecorationSet.empty };
      },
      apply(tr, value, state, newState) {
        const meta = tr.getMeta(suggestChangesKey) as
          | { enabled: boolean }
          | { skip: true }
          | undefined;

        if (meta && "enabled" in meta) return meta;

        // Skip decoration updates for selection-only changes to prevent
        // unnecessary DecorationSet recreation which disrupts browser selection
        if (!tr.docChanged) {
          return value;
        }

        const suggestions = findSuggestions(newState);
        const nextDecorations = getDecorations(newState, suggestions);

        return { ...value, decorations: nextDecorations };
      },
    },
    props: {
      decorations: getSuggestionDecorations,
      // Add a custom keydown handler that skips over any zero-width
      // spaces that we've inserted so that users aren't aware of them
      handleKeyDown(view, event) {
        if (
          event.key === "ArrowRight" &&
          view.state.selection instanceof TextSelection &&
          view.state.selection.empty &&
          view.state.selection.$cursor?.nodeAfter?.text?.startsWith("\u200B")
        ) {
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(
                view.state.doc,
                view.state.selection.$cursor.pos + 1,
              ),
            ),
          );
        }

        if (
          event.key === "ArrowLeft" &&
          view.state.selection instanceof TextSelection &&
          view.state.selection.empty &&
          view.state.selection.$cursor?.nodeBefore?.text?.endsWith("\u200B")
        ) {
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(
                view.state.doc,
                view.state.selection.$cursor.pos - 1,
              ),
            ),
          );
        }

        // Never block any other handlers from running after
        return false;
      },
    },
  });
}

export function isSuggestChangesEnabled(state: EditorState) {
  return !!suggestChangesKey.getState(state)?.enabled;
}

function getDecorations(state: EditorState, suggestions: DocumentSuggestions) {
  const { deletion } = getSuggestionMarks(state.schema);

  const decorations: Decoration[] = [];

  // Combine all suggestion IDs from deletions and insertions
  const allSuggestionIds = new Set([
    ...Object.keys(suggestions.deletions),
    ...Object.keys(suggestions.insertions),
  ]) as Set<SuggestionId>;

  // Apply decorations based on collected data
  for (const suggestionId of allSuggestionIds) {
    const deletions = suggestions.deletions[suggestionId]?.nodes ?? [];

    // Apply decorations to deletions (always hidden)
    for (const { node, pos } of deletions) {
      // Check if this is a ZWSP join mark - these should NOT be hidden
      // because hiding them with display:none breaks browser backspace behavior
      // when a character is sandwiched between two hidden elements
      const isJoinMark =
        node.text === "\u200B" &&
        node.marks.some(
          (m) => m.type.name === deletion.name && m.attrs["type"] === "join",
        );

      // Hide deletions unless showOriginal is set
      // BUT don't hide join marks - they need to stay in DOM for backspace to work
      if (!isJoinMark) {
        decorations.push(
          Decoration.inline(pos, pos + node.nodeSize, {
            style: "display: none;",
          }),
        );
      }
    }
  }

  return DecorationSet.create(state.doc, decorations);
}
