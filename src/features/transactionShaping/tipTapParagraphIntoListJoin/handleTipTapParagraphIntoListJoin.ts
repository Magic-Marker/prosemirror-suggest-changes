import { EditorState, type Transaction } from "prosemirror-state";
import {
  preserveTransactionData,
  transformToSuggestionTransaction,
} from "../../../transformToSuggestionTransaction.js";
import { generateNextNumberId } from "../../../generateId.js";
import { suggestStructureChanges } from "../../wrapUnwrap/structureChangesPlugin.js";
import { detectSpecialTransactionShape } from "../detectSpecialTransactionShape.js";
import {
  type HandleSpecialTransactionShapeArgs,
  type SpecialTransactionShape,
  type TipTapParagraphIntoListJoinShape,
} from "../types.js";

// handle the specific TipTap pattern when backspacing from a paragraph into a list above
// causes a transaction with 3 steps
// "slice" the transaction into two pieces, first piece is the first 2 steps, second piece is the last step
// first piece "moves" the paragraph - handled by structure change tracking - a structure "move" suggestion
// second piece joins two paragraphs - handled by the main plugin join-on-delete feature - deletion type="join" mark
export function handleTipTapParagraphIntoListJoin(
  args: HandleSpecialTransactionShapeArgs,
): Transaction | null {
  const shape = detectSpecialTransactionShape(args.transaction);
  if (!isTipTapParagraphIntoListJoinShape(shape)) return null;

  if (!args.structuralContextPaths || !args.ensureUniqueNodeIds) return null;

  const docBefore = args.transaction.docs[0];
  if (!docBefore) return null;

  const trackedTransaction = args.state.tr;
  const sharedSuggestionId = args.generateId
    ? args.generateId(args.state.schema, docBefore)
    : generateNextNumberId(args.state.schema, docBefore);
  const generateSharedSuggestionId = () => sharedSuggestionId;

  try {
    trackedTransaction.step(shape.deleteStep);
    trackedTransaction.step(shape.insertStep);
  } catch {
    return null;
  }

  const uniqueNodeIdsTransform = args.ensureUniqueNodeIds(
    [args.transaction],
    docBefore,
    trackedTransaction.doc,
  );

  uniqueNodeIdsTransform.steps.forEach((step) => {
    trackedTransaction.step(step);
  });

  const structureChangesResult = suggestStructureChanges(
    docBefore,
    uniqueNodeIdsTransform.doc,
    args.structuralContextPaths,
    generateSharedSuggestionId,
  );

  if (!structureChangesResult.handled) {
    return null;
  }

  structureChangesResult.transform.steps.forEach((step) => {
    trackedTransaction.step(step);
  });

  const intermediateState = EditorState.create({
    schema: args.state.schema,
    doc: trackedTransaction.doc,
  });
  const joinTransaction = intermediateState.tr;

  try {
    joinTransaction.step(shape.joinStep);
  } catch {
    return null;
  }

  const trackedJoinTransaction = transformToSuggestionTransaction(
    joinTransaction,
    intermediateState,
    generateSharedSuggestionId,
  );

  trackedJoinTransaction.steps.forEach((step) => {
    trackedTransaction.step(step);
  });

  preserveTransactionData(trackedTransaction, trackedJoinTransaction, {
    selection: "currentDocument",
    preserveScroll: false,
    preserveStoredMarks: false,
    preserveMeta: false,
  });
  preserveTransactionData(trackedTransaction, args.transaction);

  return trackedTransaction;
}

function isTipTapParagraphIntoListJoinShape(
  shape: SpecialTransactionShape | null,
): shape is TipTapParagraphIntoListJoinShape {
  return shape?.type === "tipTapParagraphIntoListJoin";
}
