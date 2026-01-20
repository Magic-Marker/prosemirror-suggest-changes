import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { assertDocumentChanged, applySteps } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.paragraph("Hello"),
    testBuilders.paragraph("World"),
  ),
);

const finalState = testBuilders.doc(
  testBuilders.blockquote(testBuilders.paragraph("Hello")),
  testBuilders.paragraph("World"),
);

const finalStateWithMarks = finalState;

const steps = [
  {
    stepType: "replaceAround",
    from: 8,
    to: 16,
    gapFrom: 8,
    gapTo: 15,
    insert: 1,
    slice: { content: [{ type: "blockquote" }], openStart: 1 },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 8,
    to: 16,
    gapFrom: 9,
    gapTo: 16,
    insert: 0,
    slice: {
      content: [
        {
          type: "blockquote",
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
];

describe("unwrap one node from a blockquote with multiple nodes | [ReplaceAroundStep]", () => {
  it("should unwrap one paragraph from a blockquote with multiple paragraphs by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the unwrap of one paragraph from a blockquote with multiple paragraphs by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the unwrap of one paragraph from a blockquote with multiple paragraphs by reverting a structure suggestion", async () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
