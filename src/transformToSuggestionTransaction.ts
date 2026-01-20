import { type Node, type Schema } from "prosemirror-model";
import { type EditorState, type Transaction } from "prosemirror-state";
import {
  AddMarkStep,
  AddNodeMarkStep,
  AttrStep,
  Mapping,
  RemoveMarkStep,
  RemoveNodeMarkStep,
  ReplaceAroundStep,
  ReplaceStep,
  type Step,
} from "prosemirror-transform";
import { trackAddMarkStep } from "./addMarkStep.js";
import { trackAddNodeMarkStep } from "./addNodeMarkStep.js";
import { trackAttrStep } from "./attrStep.js";
import { generateNextNumberId, type SuggestionId } from "./generateId.js";
import { suggestRemoveMarkStep } from "./removeMarkStep.js";
import { suggestRemoveNodeMarkStep } from "./removeNodeMarkStep.js";
import { suggestReplaceAroundStep } from "./replaceAroundStep.js";
import { suggestReplaceStep } from "./replaceStep.js";
import { getSuggestionMarks } from "./utils.js";

type StepHandler<S extends Step> = (
  trackedTransaction: Transaction,
  state: EditorState,
  doc: Node,
  step: S,
  prevSteps: Step[],
  suggestionId: SuggestionId,
) => boolean;

function getStepHandler<S extends Step>(step: S): StepHandler<S> {
  if (step instanceof ReplaceStep) {
    return suggestReplaceStep as unknown as StepHandler<S>;
  }
  if (step instanceof ReplaceAroundStep) {
    return suggestReplaceAroundStep as unknown as StepHandler<S>;
  }
  if (step instanceof AddMarkStep) {
    return trackAddMarkStep as unknown as StepHandler<S>;
  }
  if (step instanceof RemoveMarkStep) {
    return suggestRemoveMarkStep as unknown as StepHandler<S>;
  }
  if (step instanceof AddNodeMarkStep) {
    return trackAddNodeMarkStep as unknown as StepHandler<S>;
  }
  if (step instanceof RemoveNodeMarkStep) {
    return suggestRemoveNodeMarkStep as unknown as StepHandler<S>;
  }
  if (step instanceof AttrStep) {
    return trackAttrStep as unknown as StepHandler<S>;
  }

  // Default handler — simply rebase the step onto the
  // tracked transaction and apply it.
  return (
    trackedTransaction: Transaction,
    _state: EditorState,
    _doc: Node,
    step: S,
    prevSteps: Step[],
  ) => {
    const reset = prevSteps
      .slice()
      .reverse()
      .reduce<Step | null>(
        (acc, step) => acc?.map(step.getMap().invert()) ?? null,
        step,
      );

    const rebased = trackedTransaction.steps.reduce(
      (acc, step) => acc?.map(step.getMap()) ?? null,
      reset,
    );

    if (rebased) {
      trackedTransaction.step(rebased);
    }
    return false;
  };
}

interface PreserveTransactionDataOptions {
  selection?: "mapFromOriginalTransaction" | "currentDocument" | false;
  preserveScroll?: boolean;
  preserveStoredMarks?: boolean;
  preserveMeta?: boolean;
}

export function preserveTransactionData(
  transaction: Transaction,
  originalTransaction: Transaction,
  options: PreserveTransactionDataOptions = {},
) {
  const {
    selection = "mapFromOriginalTransaction",
    preserveScroll = true,
    preserveStoredMarks = true,
    preserveMeta = true,
  } = options;

  if (
    selection &&
    originalTransaction.selectionSet &&
    !transaction.selectionSet
  ) {
    if (selection === "currentDocument") {
      transaction.setSelection(
        originalTransaction.selection.map(transaction.doc, new Mapping()),
      );
    } else {
      const originalBaseDoc = originalTransaction.docs[0];
      const base = originalBaseDoc
        ? originalTransaction.selection.map(
            originalBaseDoc,
            originalTransaction.mapping.invert(),
          )
        : originalTransaction.selection;

      transaction.setSelection(base.map(transaction.doc, transaction.mapping));
    }
  }

  if (preserveScroll && originalTransaction.scrolledIntoView) {
    transaction.scrollIntoView();
  }

  if (preserveStoredMarks && originalTransaction.storedMarksSet) {
    transaction.setStoredMarks(originalTransaction.storedMarks);
  }

  if (preserveMeta) {
    // @ts-expect-error Preserve original transaction meta exactly as-is
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    transaction.meta = originalTransaction.meta;
  }
}

/**
 * Given a standard transaction from ProseMirror, produce
 * a new transaction that tracks the changes from the original,
 * rather than applying them.
 *
 * For each type of step, we implement custom behavior to prevent
 * deletions from being removed from the document, instead adding
 * deletion marks, and ensuring that all insertions have insertion
 * marks.
 */
export function transformToSuggestionTransaction(
  originalTransaction: Transaction,
  state: EditorState,
  generateId?: (schema: Schema, doc?: Node) => SuggestionId,
) {
  getSuggestionMarks(state.schema);

  let suggestionId = generateId
    ? generateId(state.schema, originalTransaction.docs[0])
    : generateNextNumberId(state.schema, originalTransaction.docs[0]);
  // Create a new transaction from scratch. The original transaction
  // is going to be dropped in favor of this one.
  const trackedTransaction = state.tr;

  for (let i = 0; i < originalTransaction.steps.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const step = originalTransaction.steps[i]!;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const doc = originalTransaction.docs[i]!;

    const stepTracker = getStepHandler(step);
    if (
      stepTracker(
        trackedTransaction,
        state,
        doc,
        step,
        originalTransaction.steps.slice(0, i),
        suggestionId,
      ) &&
      i < originalTransaction.steps.length - 1
    ) {
      // If the suggestionId was used by one of the step handlers,
      // increment it so that it's not reused.
      if (generateId) {
        suggestionId = generateId(state.schema, trackedTransaction.doc);
      } else if (typeof suggestionId === "number") {
        suggestionId = suggestionId + 1;
      }
    }
    continue;
  }

  preserveTransactionData(trackedTransaction, originalTransaction);

  return trackedTransaction;
}
