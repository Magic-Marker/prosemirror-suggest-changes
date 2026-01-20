import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { assertDocumentChanged, applySteps } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.paragraph("Hello"),
  testBuilders.paragraph("World"),
);

const finalState = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.paragraph("Hello"),
    testBuilders.paragraph("World"),
  ),
);

const finalStateWithMarks = finalState;

const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 14,
    gapFrom: 0,
    gapTo: 14,
    insert: 1,
    slice: { content: [{ type: "blockquote" }] },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 16,
    gapFrom: 1,
    gapTo: 15,
    insert: 0,
    structure: true,
  },
];

describe("wrap multiple nodes with a blockquote | [ReplaceAroundStep]", () => {
  it("should wrap multiple paragraphs in a blockquote by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the wrap of multiple paragraphs in a blockquote by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the wrap of multiple paragraphs in a blockquote by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
