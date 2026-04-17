import { Transform } from "prosemirror-transform";
import { revertStructureSuggestionsInNode } from "./revertStructureSuggestions.js";
import { type Node } from "prosemirror-model";
import { type SuggestionId } from "../../../generateId.js";

export function revertAllStructureSuggestions(
  node: Node,
  from?: number,
  to?: number,
) {
  const tr = new Transform(node);
  revertStructureSuggestionsInNode({ tr, node: tr.doc, from, to });
  return tr;
}

export function revertStructureSuggestion(
  node: Node,
  suggestionId: SuggestionId,
) {
  const tr = new Transform(node);
  revertStructureSuggestionsInNode({ tr, node: tr.doc, suggestionId });
  return tr;
}
