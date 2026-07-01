import { type Transaction } from "prosemirror-state";
import { ReplaceStep, Transform } from "prosemirror-transform";
import { getNodeId } from "../../wrapUnwrap/getNodeId.js";
import { type ProseMirrorSplitBlockAfterSelectionDeleteShape } from "../types.js";

/**
 * Detect a Transaction of a certain shape
 * The shape that occurs when there is a non empty selection across multiple nodes,
 * followed by an Enter keypress
 *
 * A two-step transaction is produced - first step deletes the selection,
 * second step splits the final selection-containing node
 *
 * That second split triggers the structure tracking code path - not the main code path
 * which causes the selection deletion to be lost in time
 *
 * So we bail this transaction shape out of the structure tracking,
 * and let the main code path handle it with deletion + insertion marks
 *
 * @param transaction
 * @returns
 */
export function detectProseMirrorSplitBlockAfterSelectionDelete(
  transaction: Transaction,
): ProseMirrorSplitBlockAfterSelectionDeleteShape | null {
  // a 2-step transaction
  if (transaction.steps.length !== 2) return null;

  const [deleteStep, splitStep] = transaction.steps;
  if (
    !(deleteStep instanceof ReplaceStep) ||
    !(splitStep instanceof ReplaceStep)
  ) {
    return null;
  }

  // non-empty deletion step
  if (deleteStep.from >= deleteStep.to) return null;
  if (deleteStep.slice.content.size !== 0) return null;
  if (hasStructureFlag(deleteStep)) return null;

  // there is a docBefore, and step boundaries are in the different textblocks
  const docBefore = transaction.docs[0];
  if (!docBefore) return null;

  if (!docBefore.resolve(deleteStep.from).parent.isTextblock) return null;
  if (!docBefore.resolve(deleteStep.to).parent.isTextblock) return null;

  // non empty split step
  if (splitStep.from !== splitStep.to) return null;
  // split step happens at the deletion step "from"
  if (splitStep.from !== deleteStep.from) return null;
  if (!hasStructureFlag(splitStep)) return null;
  if (splitStep.slice.openStart !== 1 || splitStep.slice.openEnd !== 1) {
    return null;
  }
  if (splitStep.slice.content.childCount !== 2) return null;

  const leftSplitChild = splitStep.slice.content.child(0);
  const rightSplitChild = splitStep.slice.content.child(1);
  if (!leftSplitChild.isTextblock || !rightSplitChild.isTextblock) return null;

  const leftSplitChildId = getNodeId(leftSplitChild);
  if (!leftSplitChildId || getNodeId(rightSplitChild) !== leftSplitChildId) {
    return null;
  }

  try {
    const preview = new Transform(docBefore);
    preview.step(deleteStep);
    preview.step(splitStep);
  } catch {
    return null;
  }

  return {
    type: "proseMirrorSplitBlockAfterSelectionDelete",
    deleteStep,
    splitStep,
  };
}

function hasStructureFlag(step: ReplaceStep) {
  return (step as ReplaceStep & { structure?: boolean }).structure === true;
}
