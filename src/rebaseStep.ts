import { type Step } from "prosemirror-transform";

/**
 * Rebase a step onto a new lineage of steps
 *
 * @param step The step to rebase
 * @param back The old steps to undo, in the order they were originally applied
 * @param forth The new steps to map through
 */
export function rebaseStep(step: Step, back: Step[], forth: Step[]) {
  const reset = back
    .slice()
    .reverse()
    .reduce<Step | null>(
      (acc, step) => acc?.map(step.getMap().invert()) ?? null,
      step,
    );

  const rebased = forth.reduce(
    (acc, step) => acc?.map(step.getMap()) ?? null,
    reset,
  );

  return rebased;
}
