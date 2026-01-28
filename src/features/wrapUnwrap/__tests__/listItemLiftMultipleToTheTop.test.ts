import { describe, it } from "vitest";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";
import {
  initialDoc,
  finalDoc,
  finalDocWithMarks,
  steps,
  inverseSteps,
} from "./listItemLiftMultipleToTheTop.data.js";

describe("lift multiple list items to the top, splitting the list in half | [ReplaceStep, ReplaceAroundStep]", () => {
  it("should lift multiple list items out of ordered list by applying 2 steps", () => {
    assertDocumentChanged(initialDoc, finalDoc, applySteps(steps));
  });

  it("should revert the lift by applying 2 inverse steps", () => {
    assertDocumentChanged(
      finalDoc,
      initialDoc,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the lift by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalDocWithMarks,
      initialDoc,
      revertStructureSuggestion(2),
    );
  });
});
