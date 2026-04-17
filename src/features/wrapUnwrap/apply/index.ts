import { Transform } from "prosemirror-transform";
import { type Node } from "prosemirror-model";
import { applyStructureSuggestionsInNode } from "./applyStructureSuggestions.js";
import { type SuggestionId } from "../../../generateId.js";

export function applyAllStructureSuggestions(
  node: Node,
  from?: number,
  to?: number,
) {
  const tr = new Transform(node);
  applyStructureSuggestionsInNode({ tr, node: tr.doc, from, to });
  return tr;
}

export function applyStructureSuggestion(
  node: Node,
  suggestionId: SuggestionId,
) {
  const tr = new Transform(node);
  applyStructureSuggestionsInNode({ tr, node: tr.doc, suggestionId });
  return tr;
}
