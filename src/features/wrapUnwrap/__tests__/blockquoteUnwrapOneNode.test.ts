import { describe, it } from "vitest";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { assertDocumentChanged, applySteps } from "./testUtils.js";
import {
  initialDoc,
  finalDoc,
  finalDocWithMarks,
  steps,
  inverseSteps,
} from "./blockquoteUnwrapOneNode.data.js";

describe("unwrap one node from a blockquote with multiple nodes | [ReplaceAroundStep]", () => {
  it("should unwrap one paragraph from a blockquote with multiple paragraphs by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialDoc, finalDoc, applySteps(steps));
  });

  it("should revert the unwrap of one paragraph from a blockquote with multiple paragraphs by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalDoc,
      initialDoc,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the unwrap of one paragraph from a blockquote with multiple paragraphs by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalDocWithMarks,
      initialDoc,
      revertStructureSuggestion(1),
    );
  });
});
