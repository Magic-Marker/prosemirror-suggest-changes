import { type Transaction } from "prosemirror-state";
import { getSuggestionMarks } from "../../utils.js";
import { type SuggestionId } from "../../generateId.js";
import { type MatchingNodeSide } from "./findMatchingNodeSides.js";
import { type Slice } from "prosemirror-model";

type ReplaceAroundData = {
  type: "replaceAround";
  slice: Slice;
  insert: number;
  structure: boolean;
  debug?: object;
} & (
  | { value: "gapFrom"; position: MatchingNodeSide; fromOffset: number }
  | { value: "gapTo"; position: MatchingNodeSide; toOffset: number }
  | { value: "from"; position: MatchingNodeSide; gapFromOffset: number }
  | { value: "to"; position: MatchingNodeSide; gapToOffset: number }
);

type ReplaceData = {
  type: "replace";
  slice: Slice;
  structure: boolean;
  debug?: object;
} & (
  | { value: "from"; position: MatchingNodeSide }
  | { value: "to"; position: MatchingNodeSide }
);

export function addStructureMark(
  suggestionId: SuggestionId,
  pos: number,
  payload: ReplaceAroundData | ReplaceData,
  transaction: Transaction,
) {
  const { structure } = getSuggestionMarks(transaction.doc.type.schema);

  transaction.addNodeMark(
    pos,
    structure.create({
      id: suggestionId,
      data: {
        ...payload,
        slice: payload.slice.toJSON() as object,
      },
    }),
  );

  console.log("added structure mark", {
    suggestionId,
    payload,
  });
}
