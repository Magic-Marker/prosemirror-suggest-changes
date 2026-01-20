import { type Node, type Schema } from "prosemirror-model";
import { getSuggestionMarks } from "./utils.js";
import { isJoinMark } from "./features/joinOnDelete/types.js";
import { normalizeJoinNodesMetadata } from "./features/joinOnDelete/normalizeJoinNodesMetadata.js";

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
    // find max suggestion id across all suggestion marks and across all suggestion marks that are serialized into metadata of the join marks
    const marks = node.marks.filter(
      (mark) =>
        mark.type === insertion ||
        mark.type === deletion ||
        mark.type === modification ||
        mark.type === structure,
    );

    const markIds = marks.map((mark) => mark.attrs["id"] as number);

    // collect suggestion ids of marks that are serialized into join marks metadata
    const joinMarks = marks.filter((mark) => isJoinMark(mark));
    const joinMetadataMarkIds: number[] = [];
    joinMarks.forEach((mark) => {
      const joinMetadata = normalizeJoinNodesMetadata(mark.attrs);
      if (!joinMetadata) return;
      joinMetadata.leftNodes.forEach((node) => {
        node.marks.forEach((mark) => {
          if (!mark.attrs["id"]) return;
          joinMetadataMarkIds.push(mark.attrs["id"] as number);
        });
      });
      joinMetadata.rightNodes.forEach((node) => {
        node.marks.forEach((mark) => {
          if (!mark.attrs["id"]) return;
          joinMetadataMarkIds.push(mark.attrs["id"] as number);
        });
      });
    });

    const allMarkIds = [...markIds, ...joinMetadataMarkIds];
    if (allMarkIds.length > 0) {
      suggestionId = Math.max(suggestionId, ...allMarkIds);
      return false;
    }
    return true;
  });
  return suggestionId + 1;
}
