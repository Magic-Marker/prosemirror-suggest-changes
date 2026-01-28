import { describe, it } from "vitest";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";
import {
  initialDoc,
  finalDoc,
  finalDocWithMarks,
  steps,
  inverseSteps,
} from "./tripleBlockquoteLiftOneNodeToTheTop.data.js";

describe("lift one node through all levels in a multi-level wrap | [ReplaceAroundStep]", () => {
  it("should lift one paragraph out of all blockquotes by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialDoc, finalDoc, applySteps(steps));
  });

  it("should revert the lift by applying 1 inverse ReplaceAround step", () => {
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
      revertStructureSuggestion(1),
    );
  });
});
