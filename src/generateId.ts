import { type Node, type Schema } from "prosemirror-model";
import { getSuggestionMarks } from "./utils.js";

export type SuggestionId = string | number;

export const suggestionIdValidate = "number|string";

export function parseSuggestionId(id: string): SuggestionId {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    return id;
  }
  return parsed;
}

export function generateNextNumberId(schema: Schema, doc?: Node) {
  const { deletion, insertion, modification, structure } =
    getSuggestionMarks(schema);
  // Find the highest change id in the document so far,
  // and use that as the starting point for new changes
  let suggestionId = 0;
  doc?.descendants((node) => {
    const mark = node.marks.find(
      (mark) =>
        mark.type === insertion ||
        mark.type === deletion ||
        mark.type === modification ||
        mark.type === structure,
    );
    if (mark) {
      suggestionId = Math.max(suggestionId, mark.attrs["id"] as number);
      return false;
    }
    return true;
  });
  return suggestionId + 1;
}
