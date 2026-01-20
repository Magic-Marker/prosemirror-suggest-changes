import { type Node, type Schema } from "prosemirror-model";
import { type EditorState, type Transaction } from "prosemirror-state";
import { type ReplaceStep, type Transform } from "prosemirror-transform";
import { type SuggestionId } from "../../generateId.js";
import { type StructuralContextPath } from "../wrapUnwrap/types.js";

export interface TipTapParagraphIntoListJoinShape {
  type: "tipTapParagraphIntoListJoin";
  deleteStep: ReplaceStep;
  insertStep: ReplaceStep;
  joinStep: ReplaceStep;
  movedNode: Node;
}

export type SpecialTransactionShape = TipTapParagraphIntoListJoinShape;

export interface HandleSpecialTransactionShapeArgs {
  transaction: Transaction;
  state: EditorState;
  generateId: ((schema: Schema, doc?: Node) => SuggestionId) | undefined;
  structuralContextPaths: StructuralContextPath[] | null;
  ensureUniqueNodeIds:
    | ((transactions: Transaction[], oldDoc: Node, newDoc: Node) => Transform)
    | undefined;
}
