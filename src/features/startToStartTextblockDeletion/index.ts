import { TextSelection, type Selection } from "prosemirror-state";
import { type ReplaceStep, type Step } from "prosemirror-transform";

export function adjustForStartToStartTextblockDeletion(
  selection: Selection,
  step: ReplaceStep,
  prevSteps: Step[],
) {
  if (prevSteps.length > 0) return { from: step.from, to: step.to };
  if (!(selection instanceof TextSelection)) {
    return { from: step.from, to: step.to };
  }
  if (selection.empty || step.slice.size !== 0) {
    return { from: step.from, to: step.to };
  }

  const { $from, $to } = selection;
  if (!$from.parent.isTextblock || !$to.parent.isTextblock) {
    return { from: step.from, to: step.to };
  }
  if ($from.parentOffset !== 0 || $to.parentOffset !== 0) {
    return { from: step.from, to: step.to };
  }
  if ($from.start() === $to.start()) return { from: step.from, to: step.to };

  if (step.from !== $from.before($from.depth)) {
    return { from: step.from, to: step.to };
  }
  if (step.to !== $to.before($to.depth)) {
    return { from: step.from, to: step.to };
  }

  // The step boundary is moved before the right textblock, but the selection
  // boundary is the user-visible end of the deleted text range.
  return { from: step.from, to: selection.to };
}
