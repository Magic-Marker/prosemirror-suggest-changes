import { Transform } from "prosemirror-transform";
import { revertStructureSuggestionsInDoc } from "./revertStructureSuggestions.js";
import { type Node } from "prosemirror-model";
import { type SuggestionId } from "../../../generateId.js";

export function revertAllStructureSuggestions(
  doc: Node,
  from?: number,
  to?: number,
) {
  const tr = new Transform(doc);
  revertStructureSuggestionsInDoc({ tr, from, to });
  return tr;
}

export function revertStructureSuggestion(
  doc: Node,
  suggestionId: SuggestionId,
) {
  const tr = new Transform(doc);
  revertStructureSuggestionsInDoc({ tr, suggestionId });
  return tr;
}
