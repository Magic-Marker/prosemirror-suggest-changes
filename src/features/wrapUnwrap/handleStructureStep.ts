import {
  ReplaceAroundStep,
  ReplaceStep,
  type Step,
} from "prosemirror-transform";
import { contentBetween } from "../../contentBetween.js";
import { type EditorState, type Transaction } from "prosemirror-state";
import { getSuggestionMarks } from "../../utils.js";
import { rebaseStep } from "../../rebaseStep.js";
import { type SuggestionId } from "../../generateId.js";

export function handleStructureStep(
  trackedTransaction: Transaction,
  state: EditorState,
  step: Step,
  prevSteps: Step[],
  suggestionId: SuggestionId,
) {
  if (step instanceof ReplaceAroundStep) {
    return handleReplaceAroundStep(
      trackedTransaction,
      state,
      step,
      prevSteps,
      suggestionId,
    );
  }
  if (step instanceof ReplaceStep) {
    return handleReplaceStep(
      trackedTransaction,
      state,
      step,
      prevSteps,
      suggestionId,
    );
  }
  return false;
}

function handleReplaceAroundStep(
  trackedTransaction: Transaction,
  state: EditorState,
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
  const { structure } = getSuggestionMarks(state.schema);

  const rebasedStep = rebaseStep(step, prevSteps, trackedTransaction.steps);
  console.log({ step, rebasedStep });

  if (!rebasedStep || !(rebasedStep instanceof ReplaceAroundStep)) {
    throw new Error(
      "Failed to rebase replace around step: unexpected step type",
    );
  }

  const docBeforeStep = trackedTransaction.doc;
  trackedTransaction.step(rebasedStep);
  const inverseStep = rebasedStep.invert(docBeforeStep);
  console.log({ inverseStep });

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

  const slice = inverseStep.slice.toJSON() as object;
  const insert = inverseStep.insert;

  // positive number - subtract from gapFrom later to reconstruct "from"
  const fromOffset = inverseGapFrom - inverseFrom;
  // positive number - add to gapTo on reverse to reconstruct "to"
  const toOffset = inverseTo - inverseGapTo;

  // positive number - add to from later to reconstruct "gapFrom"
  const gapFromOffset = inverseGapFrom - inverseFrom;
  // positive number - subtract from to later to reconstruct "gapTo"
  const gapToOffset = inverseTo - inverseGapTo;

  let fromFound = false as boolean;
  let toFound = false as boolean;
  let gapFromFound = false as boolean;
  let gapToFound = false as boolean;

  const isInverseStepStructural = (
    inverseStep as ReplaceAroundStep & { structure: boolean }
  ).structure;

  const addStructureMark = (pos: number, data: object) => {
    trackedTransaction.addNodeMark(
      pos,
      structure.create({
        id: suggestionId,
        data: {
          ...data,
          type: "replaceAround",
          slice,
          insert,
          structure: isInverseStepStructural,
          debug: {
            inverseFrom,
            inverseTo,
            inverseGapFrom,
            inverseGapTo,
            gapFromOffset,
            gapToOffset,
            fromOffset,
            toOffset,
          },
        },
      }),
    );
  };

  // check if inverseGapFrom or inverseGapTo are at the start of some node in range
  trackedTransaction.doc.nodesBetween(
    inverseBlockRange.start,
    inverseBlockRange.end,
    (node, pos) => {
      if (node.isInline) return true;

      let localGapFromFound = false;

      // inverseGapFrom is at start of this node?
      if (!gapFromFound && pos === inverseGapFrom) {
        addStructureMark(pos, {
          value: "gapFrom",
          position: "start",
          fromOffset,
        });
        gapFromFound = localGapFromFound = true;
        console.log("gapFrom at start of node", {
          inverseGapFrom,
          node,
          pos,
        });
      }

      // inverseGapFrom is at inner start of this node?
      if (!gapFromFound && pos + 1 === inverseGapFrom) {
        addStructureMark(pos, {
          value: "gapFrom",
          position: "innerStart",
          fromOffset,
        });
        gapFromFound = localGapFromFound = true;
        console.log("gapFrom at inner start of node", {
          inverseGapFrom,
          node,
          pos: pos + 1,
        });
      }

        // if inverseGapFrom is at start of this node, maybe inverseGapTo is at the end of this node?
        // this way the case when both gapFrom and gapTo can be indicated by the same node is prioritized
      if (localGapFromFound && !gapToFound) {
        // inverseGapTo is at end of this node?
        if (pos + node.nodeSize === inverseGapTo) {
          addStructureMark(pos, {
            value: "gapTo",
            position: "end",
            toOffset,
          });
          gapToFound = true;
          console.log("ALSO gapTo at end of node", {
            inverseGapTo,
            node,
            pos: pos + node.nodeSize,
          });
        }

        // inverseGapTo is at inner end of this node?
        if (pos + node.nodeSize - 1 === inverseGapTo) {
          addStructureMark(pos, {
            value: "gapTo",
            position: "innerEnd",
            toOffset,
          });
          gapToFound = true;
          console.log("ALSO gapTo at inner end of node", {
            inverseGapTo,
            node,
            pos: pos + node.nodeSize - 1,
          });
        }
      }

      // inverseGapTo is at start of this node?
      if (!gapToFound && pos === inverseGapTo) {
        addStructureMark(pos, {
          value: "gapTo",
          position: "start",
          toOffset,
        });
        gapToFound = true;
        console.log("gapTo at start of node", { inverseGapTo, node, pos });
      }

      // inverseGapTo is at inner start of this node?
      if (!gapToFound && pos + 1 === inverseGapTo) {
        addStructureMark(pos, {
          value: "gapTo",
          position: "innerStart",
          toOffset,
        });
        gapToFound = true;
        console.log("gapTo at inner start of node", {
          inverseGapTo,
          node,
          pos: pos + 1,
        });
      }

      return true;
    },
  );

  // check if inverseGapFrom or inverseGapTo are at the end of some node
  trackedTransaction.doc.nodesBetween(
    inverseBlockRange.start,
    inverseBlockRange.end,
    (node, pos) => {
      if (node.isInline) return true;

      // inverseGapFrom is at end of this node?
      if (!gapFromFound && pos + node.nodeSize === inverseGapFrom) {
        addStructureMark(pos, {
          value: "gapFrom",
          position: "end",
          fromOffset,
        });
        gapFromFound = true;
        console.log("gapFrom at end of node", {
          inverseGapFrom,
          node,
          pos: pos + node.nodeSize,
        });
      }

      // inverseGapFrom is at inner end of this node?
      if (!gapFromFound && pos + node.nodeSize - 1 === inverseGapFrom) {
        addStructureMark(pos, {
          value: "gapFrom",
          position: "innerEnd",
          fromOffset,
        });
        gapFromFound = true;
        console.log("gapFrom at inner end of node", {
          inverseGapFrom,
          node,
          pos: pos + node.nodeSize - 1,
        });
      }

      // inverseGapTo is at end of this node?
      if (!gapToFound && pos + node.nodeSize === inverseGapTo) {
        addStructureMark(pos, {
          value: "gapTo",
          position: "end",
          toOffset,
        });
        gapToFound = true;
        console.log("gapTo at end of node", {
          inverseGapTo,
          node,
          pos: pos + node.nodeSize,
        });
      }

      // inverseGapTo is at inner end of this node?
      if (!gapToFound && pos + node.nodeSize - 1 === inverseGapTo) {
        addStructureMark(pos, {
          value: "gapTo",
          position: "innerEnd",
          toOffset,
        });
        gapToFound = true;
        console.log("gapTo at inner end of node", {
          inverseGapTo,
          node,
          pos: pos + node.nodeSize - 1,
        });
      }

      return true;
    },
  );

  // check if inverseFrom, inverseTo are at the start of some node in range
  trackedTransaction.doc.nodesBetween(
    inverseBlockRange.start,
    inverseBlockRange.end,
    (node, pos) => {
      if (node.isInline) return true;

      let localFromFound = false;

      // inverseFrom is at start of this node?
      if (!fromFound && pos === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "start",
          gapFromOffset,
        });
        fromFound = localFromFound = true;
        console.log("from at start of node", { inverseFrom, node, pos });
      }

      // inverseFrom is at inner start of this node?
      if (!fromFound && pos + 1 === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "innerStart",
          gapFromOffset,
        });
        fromFound = localFromFound = true;
        console.log("from at inner start of node", {
          inverseFrom,
          node,
          pos: pos + 1,
        });
      }

        // if inverseFrom is at start of this node, maybe inverseTo is at the end of this node?
        // this way the case when both from and to can be indicated by the same node is prioritized
      if (localFromFound && !toFound) {
        // inverseTo is at end of this node?
        if (pos + node.nodeSize === inverseTo) {
          addStructureMark(pos, {
            value: "to",
            position: "end",
            gapToOffset,
          });
          toFound = true;
          console.log("ALSO found to at end of node", {
            inverseTo,
            node,
            pos: pos + node.nodeSize,
          });
        }

        // inverseTo is at inner end of this node?
        if (pos + node.nodeSize - 1 === inverseTo) {
          addStructureMark(pos, {
            value: "to",
            position: "innerEnd",
            gapToOffset,
          });
          toFound = true;
          console.log("ALSO found to at inner end of node", {
            inverseTo,
            node,
            pos: pos + node.nodeSize - 1,
          });
        }
      }

      // inverseTo is at start of this node?
      if (!toFound && pos === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "start",
          gapToOffset,
        });
        toFound = true;
        console.log("to at start of node", { inverseTo, node, pos });
      }

      // inverseTo is at inner start of this node?
      if (!toFound && pos + 1 === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "innerStart",
          gapToOffset,
        });
        toFound = true;
        console.log("to at inner start of node", {
          inverseTo,
          node,
          pos: pos + 1,
        });
      }

      return true;
    },
  );

  // check if inverseFrom, inverseTo are at the end of some node in range
  trackedTransaction.doc.nodesBetween(
    inverseBlockRange.start,
    inverseBlockRange.end,
    (node, pos) => {
      if (node.isInline) return true;

      // inverseFrom is at end of this node?
      if (!fromFound && pos + node.nodeSize === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "end",
          gapFromOffset,
        });
        fromFound = true;
        console.log("from at end of node", {
          inverseFrom,
          node,
          pos: pos + node.nodeSize,
        });
      }

      // inverseFrom is at inner end of this node?
      if (!fromFound && pos + node.nodeSize - 1 === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "innerEnd",
          gapFromOffset,
        });
        fromFound = true;
        console.log("from at inner end of node", {
          inverseFrom,
          node,
          pos: pos + node.nodeSize - 1,
        });
      }

      // inverseTo is at end of this node?
      if (!toFound && pos + node.nodeSize === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "end",
          gapToOffset,
        });
        toFound = true;
        console.log("found to at end of node", {
          inverseTo,
          node,
          pos: pos + node.nodeSize,
        });
      }

      // inverseTo is at inner end of this node?
      if (!toFound && pos + node.nodeSize - 1 === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "innerEnd",
          gapToOffset,
        });
        toFound = true;
        console.log("found to at inner end of node", {
          inverseTo,
          node,
          pos: pos + node.nodeSize - 1,
        });
      }

      return true;
    },
  );

  if (gapFromFound && gapToFound && fromFound && toFound) {
    console.log("all points found");
  } else {
    console.log("not all points found", {
      step,
      inverseStep,
      rebasedStep,
    });
  }

  console.groupEnd();

  return true;
}

function handleReplaceStep(
  trackedTransaction: Transaction,
  state: EditorState,
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

  const { structure } = getSuggestionMarks(state.schema);

  const rebasedStep = rebaseStep(step, prevSteps, trackedTransaction.steps);
  if (!rebasedStep || !(rebasedStep instanceof ReplaceStep)) {
    throw new Error("Failed to rebase replace step: unexpected step type");
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

  const slice = inverseStep.slice.toJSON() as object;

  let fromFound = false as boolean;
  let toFound = false as boolean;

  const isInverseStepStructural =
    (inverseStep as ReplaceStep & { structure: boolean }).structure ||
    !contentBetween(trackedTransaction.doc, inverseFrom, inverseTo);

  const addStructureMark = (pos: number, data: object) => {
    trackedTransaction.addNodeMark(
      pos,
      structure.create({
        id: suggestionId,
        data: {
          ...data,
          type: "replace",
          slice,
          structure: isInverseStepStructural,
          debug: {
            inverseFrom,
            inverseTo,
          },
        },
      }),
    );
  };

  // check if inverseFrom, inverseTo are at the start of some node in range
  trackedTransaction.doc.nodesBetween(
    inverseBlockRange.start,
    inverseBlockRange.end,
    (node, pos) => {
      if (node.isInline) return true;

      let localFromFound = false;

      // inverseFrom is at start of this node?
      if (!fromFound && pos === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "start",
        });
        fromFound = localFromFound = true;
        console.log("from at start of node", { inverseFrom, node, pos });
      }

      // inverseFrom is at inner start of this node?
      if (!fromFound && pos + 1 === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "innerStart",
        });
        fromFound = localFromFound = true;
        console.log("from at inner start of node", {
          inverseFrom,
          node,
          pos: pos + 1,
        });
      }

      // if inverseFrom is at start or innerStart of this node, maybe inverseTo is at the end or innerEnd of this node?
        // this way the case when both from and to can be indicated by the same node is prioritized
      if (localFromFound && !toFound) {
        if (pos + node.nodeSize === inverseTo) {
          addStructureMark(pos, {
            value: "to",
            position: "end",
          });
          toFound = true;
          console.log("ALSO found to at end of node", {
            inverseTo,
            node,
            pos: pos + node.nodeSize,
          });
        } else if (pos + node.nodeSize - 1 === inverseTo) {
          addStructureMark(pos, {
            value: "to",
            position: "innerEnd",
          });
          toFound = true;
          console.log("ALSO found to at inner end of node", {
            inverseTo,
            node,
            pos: pos + node.nodeSize - 1,
          });
        }
      }

      // inverseTo is at start of this node?
      if (!toFound && pos === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "start",
        });
        toFound = true;
        console.log("to at start of node", { inverseTo, node, pos });
      }

      // inverseTo is at inner start of this node?
      if (!toFound && pos + 1 === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "innerStart",
        });
        toFound = true;
        console.log("to at inner start of node", {
          inverseTo,
          node,
          pos: pos + 1,
        });
      }

      return true;
    },
  );

  // check if inverseFrom, inverseTo are at the end of some node in range
  trackedTransaction.doc.nodesBetween(
    inverseBlockRange.start,
    inverseBlockRange.end,
    (node, pos) => {
      if (node.isInline) return true;

      // inverseFrom is at end of this node?
      if (!fromFound && pos + node.nodeSize === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "end",
        });
        fromFound = true;
        console.log("from at end of node", {
          inverseFrom,
          node,
          pos: pos + node.nodeSize,
        });
      }

      // inverseFrom is at inner end of this node?
      if (!fromFound && pos + node.nodeSize - 1 === inverseFrom) {
        addStructureMark(pos, {
          value: "from",
          position: "innerEnd",
        });
        fromFound = true;
        console.log("from at inner end of node", {
          inverseFrom,
          node,
          pos: pos + node.nodeSize - 1,
        });
      }

      // inverseTo is at end of this node?
      if (!toFound && pos + node.nodeSize === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "end",
        });
        toFound = true;
        console.log("found to at end of node", {
          inverseTo,
          node,
          pos: pos + node.nodeSize,
        });
      }

      // inverseTo is at inner end of this node?
      if (!toFound && pos + node.nodeSize - 1 === inverseTo) {
        addStructureMark(pos, {
          value: "to",
          position: "innerEnd",
        });
        toFound = true;
        console.log("found to at inner end of node", {
          inverseTo,
          node,
          pos: pos + node.nodeSize - 1,
        });
      }

      return true;
    },
  );

  if (fromFound && toFound) {
    console.log("all points found");
  } else {
    console.log("not all points found", { step, rebasedStep, inverseStep });
  }

  console.groupEnd();

  return true;
}
