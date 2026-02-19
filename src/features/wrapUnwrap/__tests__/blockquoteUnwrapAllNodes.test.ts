import { describe, it } from "vitest";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { assertDocumentChanged, applySteps } from "./testUtils.js";
import {
  initialDoc,
  finalDoc,
  finalDocWithMarks,
  steps,
  inverseSteps,
} from "./blockquoteUnwrapAllNodes.data.js";

describe("unwrap multiple nodes from a blockquote | [ReplaceAroundStep]", () => {
  it("should unwrap multiple paragraphs from a blockquote by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialDoc, finalDoc, applySteps(steps));
  });

  it("should revert the unwrap of multiple paragraphs from a blockquote by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalDoc,
      initialDoc,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the unwrap of multiple paragraphs froma blockquote by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalDocWithMarks,
      initialDoc,
      revertStructureSuggestion(1),
    );
  });
});
