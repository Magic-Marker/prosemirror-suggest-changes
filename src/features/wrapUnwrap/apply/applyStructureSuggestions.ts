import { type Node } from "prosemirror-model";
import { getSuggestionMarks } from "../../../utils.js";
import { type Mark } from "prosemirror-model";
import { type Transform } from "prosemirror-transform";
import { type SuggestionId } from "../../../generateId.js";

export function applyStructureSuggestionsInNode({
  tr,
  node,
  suggestionId,
  from,
  to,
}: {
  tr: Transform;
  node: Node;
  suggestionId?: SuggestionId;
  from?: number | undefined;
  to?: number | undefined;
}) {
  const { structure } = getSuggestionMarks(node.type.schema);

  const suggestionIds = new Set<SuggestionId>();

  node.descendants((node, pos) => {
    if (from !== undefined && pos < from) {
      return true;
    }
    if (to !== undefined && pos > to) {
      return false;
    }
    if (node.isText) return true;
    if (!structure.isInSet(node.marks)) return true;

    node.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      const markSuggestionId = mark.attrs["id"] as SuggestionId;
      if (suggestionId != null && markSuggestionId !== suggestionId) return;
      suggestionIds.add(markSuggestionId);
    });

    return true;
  });

  for (const suggestionId of suggestionIds) {
    applyOneStructureSuggestion(tr, suggestionId);
  }
}

function applyOneStructureSuggestion(
  tr: Transform,
  suggestionId: SuggestionId,
) {
  const { structure } = getSuggestionMarks(tr.doc.type.schema);
  tr.doc.descendants((node, pos) => {
    if (node.isText) return true;
    if (!structure.isInSet(node.marks)) return true;
    node.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      if (mark.attrs["id"] !== suggestionId) return;
      applyStructureMark(tr, mark, pos);
    });
    return true;
  });
}

function applyStructureMark(tr: Transform, mark: Mark, pos: number) {
  tr.removeNodeMark(pos, mark);
}
