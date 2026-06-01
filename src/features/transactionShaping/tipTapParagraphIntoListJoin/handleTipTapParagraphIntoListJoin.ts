import { EditorState, type Transaction } from "prosemirror-state";
import {
  preserveTransactionData,
  transformToSuggestionTransaction,
} from "../../../transformToSuggestionTransaction.js";
import { getSuggestionMarks } from "../../../utils.js";
import { getNodeId } from "../../wrapUnwrap/getNodeId.js";
import {
  suggestStructureChanges,
  type SuggestStructureChangesResult,
} from "../../wrapUnwrap/structureChangesPlugin.js";
import { guardStructureMarkAttrs } from "../../wrapUnwrap/types.js";
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

  const movedNodeId = getNodeId(shape.movedNode);
  if (!movedNodeId) return null;

  const trackedTransaction = args.state.tr;

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
    args.generateId,
  );

  if (
    !structureChangesResult.handled ||
    !hasMoveStructureMark(structureChangesResult, movedNodeId)
  ) {
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
    args.generateId,
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

function hasMoveStructureMark(
  structureChangesResult: SuggestStructureChangesResult,
  movedNodeId: string,
) {
  const { structure } = getSuggestionMarks(
    structureChangesResult.transform.doc.type.schema,
  );

  let found = false;
  structureChangesResult.transform.doc.descendants((node) => {
    if (getNodeId(node) !== movedNodeId) return true;

    found = node.marks.some((mark) => {
      if (mark.type !== structure) return false;
      if (!guardStructureMarkAttrs(mark.attrs)) return false;
      return mark.attrs.data.op.op === "move";
    });

    return !found;
  });

  return found;
}
