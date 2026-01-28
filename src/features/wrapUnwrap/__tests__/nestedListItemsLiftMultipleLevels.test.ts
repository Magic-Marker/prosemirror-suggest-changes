import { describe, it } from "vitest";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";
import {
  finalDoc,
  finalDocWithMarks,
  initialDoc,
  inverseSteps,
  steps,
} from "./nestedListItemsLiftMultipleLevels.data.js";

describe("lift multiple list items from different levels | [ReplaceAroundStep, ReplaceAroundStep, ReplaceStep]", () => {
  it("should lift multiple list items from different levels by applying 3 steps", () => {
    assertDocumentChanged(initialDoc, finalDoc, applySteps(steps));
  });

  it("should revert the lift by applying 3 inverse steps", () => {
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
