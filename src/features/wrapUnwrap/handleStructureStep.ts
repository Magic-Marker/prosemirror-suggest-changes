import {
  ReplaceAroundStep,
  ReplaceStep,
  Transform,
  type Step,
} from "prosemirror-transform";
import { contentBetween } from "../../contentBetween.js";
import { type Transaction } from "prosemirror-state";
import { rebaseStep } from "../../rebaseStep.js";
import { type SuggestionId } from "../../generateId.js";
import { findMatchingNodeSides } from "./findMatchingNodeSides.js";
import { addStructureMark } from "./addStructureMark.js";

export function handleStructureStep(
  trackedTransaction: Transaction,
  step: Step,
  prevSteps: Step[],
  suggestionId: SuggestionId,
) {
  if (step instanceof ReplaceAroundStep) {
    return handleReplaceAroundStep(
      trackedTransaction,
      step,
      prevSteps,
      suggestionId,
    );
  }
  if (step instanceof ReplaceStep) {
    return handleReplaceStep(trackedTransaction, step, prevSteps, suggestionId);
  }
  return false;
}

function handleReplaceAroundStep(
  trackedTransaction: Transaction,
  step: ReplaceAroundStep,
  prevSteps: Step[],
  suggestionId: SuggestionId,
) {
  // consider step structure if structure === true or there is no content in from-gapFrom and gapTo-to
  // inspired by https://github.com/ProseMirror/prosemirror-transform/blob/1.11.0/src/replace_step.ts#L110
  const isStructureStep =
    (step as ReplaceAroundStep & { structure: boolean }).structure ||
    !(
      contentBetween(trackedTransaction.doc, step.from, step.gapFrom) ||
      contentBetween(trackedTransaction.doc, step.gapTo, step.to)
    );

  if (!isStructureStep) return false;

  console.groupCollapsed(
    `handle structure ReplaceAround step from = ${step.from.toString()}, to = ${step.to.toString()}, gapFrom = ${step.gapFrom.toString()}, gapTo = ${step.gapTo.toString()}`,
  );

  const rebasedStep = rebaseStep(step, prevSteps, trackedTransaction.steps);

  if (!rebasedStep || !(rebasedStep instanceof ReplaceAroundStep)) {
    throw new Error(
      "Failed to rebase replace around step: unexpected step type",
    );
  }

  const docBeforeStep = trackedTransaction.doc;
  trackedTransaction.step(rebasedStep);
  const inverseStep = rebasedStep.invert(docBeforeStep);
  console.log({ step, rebasedStep, inverseStep });

  if (!(inverseStep instanceof ReplaceAroundStep)) {
    throw new Error(
      "Failed to invert replace around step: unexpected step type",
    );
  }

  const inverseFrom = inverseStep.from;
  const inverseTo = inverseStep.to;

  const $inverseFrom = trackedTransaction.doc.resolve(inverseFrom);
  const $inverseTo = trackedTransaction.doc.resolve(inverseTo);

  const inverseGapFrom = inverseStep.gapFrom;
  const inverseGapTo = inverseStep.gapTo;

  const $inverseGapFrom = trackedTransaction.doc.resolve(inverseGapFrom);
  const $inverseGapTo = trackedTransaction.doc.resolve(inverseGapTo);

  const inverseBlockRange = $inverseFrom.blockRange($inverseTo);
  const inverseGapBlockRange = $inverseGapFrom.blockRange($inverseGapTo);

  if (!inverseBlockRange || !inverseGapBlockRange) {
    throw new Error("Failed to get inverse block range: unexpected range");
  }

  const slice = inverseStep.slice;
  const insert = inverseStep.insert;

  // positive number - subtract from gapFrom later to reconstruct "from"
  const fromOffset = inverseGapFrom - inverseFrom;
  // positive number - add to gapTo on reverse to reconstruct "to"
  const toOffset = inverseTo - inverseGapTo;

  // positive number - add to from later to reconstruct "gapFrom"
  const gapFromOffset = inverseGapFrom - inverseFrom;
  // positive number - subtract from to later to reconstruct "gapTo"
  const gapToOffset = inverseTo - inverseGapTo;

  const isInverseStepStructural = (
    inverseStep as ReplaceAroundStep & { structure: boolean }
  ).structure;

  const gapFromToSides = findMatchingNodeSides(
    trackedTransaction.doc,
    inverseGapBlockRange,
    { from: inverseGapFrom, to: inverseGapTo },
  );

  addStructureMark(
    suggestionId,
    gapFromToSides.from.pos,
    {
      type: "replaceAround",
      slice,
      insert,
      structure: isInverseStepStructural,
      value: "gapFrom",
      position: gapFromToSides.from.side,
      fromOffset,
    },
    trackedTransaction,
  );

  addStructureMark(
    suggestionId,
    gapFromToSides.to.pos,
    {
      type: "replaceAround",
      slice,
      insert,
      structure: isInverseStepStructural,
      value: "gapTo",
      position: gapFromToSides.to.side,
      toOffset,
    },
    trackedTransaction,
  );

  const fromToSides = findMatchingNodeSides(
    trackedTransaction.doc,
    inverseBlockRange,
    { from: inverseFrom, to: inverseTo },
  );

  addStructureMark(
    suggestionId,
    fromToSides.from.pos,
    {
      type: "replaceAround",
      slice,
      insert,
      structure: isInverseStepStructural,
      value: "from",
      position: fromToSides.from.side,
      gapFromOffset,
    },
    trackedTransaction,
  );

  addStructureMark(
    suggestionId,
    fromToSides.to.pos,
    {
      type: "replaceAround",
      slice,
      insert,
      structure: isInverseStepStructural,
      value: "to",
      position: fromToSides.to.side,
      gapToOffset,
    },
    trackedTransaction,
  );

  return true;
}

function handleReplaceStep(
  trackedTransaction: Transaction,
  step: ReplaceStep,
  prevSteps: Step[],
  suggestionId: SuggestionId,
) {
  const isStructureStep =
    (step as ReplaceStep & { structure: boolean }).structure ||
    !contentBetween(trackedTransaction.doc, step.from, step.to);

  if (!isStructureStep) return false;

  // handle this step as structure step

  console.groupCollapsed(
    `handle structure Replace step from = ${step.from.toString()}, to = ${step.to.toString()}`,
  );

  const rebasedStep = rebaseStep(step, prevSteps, trackedTransaction.steps);
  if (!rebasedStep || !(rebasedStep instanceof ReplaceStep)) {
    throw new Error("Failed to rebase replace step: unexpected step type");
  }

  const transform = new Transform(trackedTransaction.doc);
  const $stepFromBefore = trackedTransaction.doc.resolve(rebasedStep.from);
  const $stepToBefore = trackedTransaction.doc.resolve(rebasedStep.to);
  console.log({ $stepFromBefore, $stepToBefore });

  transform.step(rebasedStep);

  const $stepFromAfter = transform.doc.resolve(
    transform.mapping.map($stepFromBefore.pos),
  );
  const $stepToAfter = transform.doc.resolve(
    transform.mapping.map($stepToBefore.pos),
  );
  console.log({ $stepFromAfter, $stepToAfter });

  // detect join inside textblock so we can bail out
  // those are not handled with structure marks, those are handled with a ZWSP deletion mark
  if (
    !$stepFromBefore.sameParent($stepToBefore) &&
    $stepFromAfter.sameParent($stepToAfter) &&
    $stepFromAfter.pos === $stepToAfter.pos &&
    $stepFromAfter.parent.isTextblock
  ) {
    console.log("this is a join inside textblock");
    console.groupEnd();
    return false;
  }

  if (
    !$stepFromBefore.sameParent($stepToBefore) &&
    $stepFromAfter.sameParent($stepToAfter) &&
    $stepFromAfter.pos === $stepToAfter.pos &&
    !$stepFromAfter.parent.isTextblock
  ) {
    console.log("this is a join inside non-textblock");
  }

  const docBeforeStep = trackedTransaction.doc;
  trackedTransaction.step(rebasedStep);

  const inverseStep = rebasedStep.invert(docBeforeStep);
  if (!(inverseStep instanceof ReplaceStep)) {
    throw new Error("Failed to invert replace step: unexpected step type");
  }

  const inverseFrom = inverseStep.from;
  const inverseTo = inverseStep.to;

  const $inverseFrom = trackedTransaction.doc.resolve(inverseFrom);
  const $inverseTo = trackedTransaction.doc.resolve(inverseTo);

  const inverseBlockRange = $inverseFrom.blockRange($inverseTo);

  if (!inverseBlockRange) {
    throw new Error("Failed to get inverse block range: unexpected range");
  }

  const slice = inverseStep.slice;

  const isInverseStepStructural =
    (inverseStep as ReplaceStep & { structure: boolean }).structure ||
    !contentBetween(trackedTransaction.doc, inverseFrom, inverseTo);

  const fromToSides = findMatchingNodeSides(
    trackedTransaction.doc,
    inverseBlockRange,
    { from: inverseFrom, to: inverseTo },
  );

  addStructureMark(
    suggestionId,
    fromToSides.from.pos,
    {
      type: "replace",
      slice,
      structure: isInverseStepStructural,
      value: "from",
      position: fromToSides.from.side,
    },
    trackedTransaction,
  );

  addStructureMark(
    suggestionId,
    fromToSides.to.pos,
    {
      type: "replace",
      slice,
      structure: isInverseStepStructural,
      value: "to",
      position: fromToSides.to.side,
    },
    trackedTransaction,
  );

  return true;
}
