import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(testBuilders.paragraph("Item 2")),
    testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
    testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
    testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

const finalState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

const finalStateWithMarks = finalState;

const steps = [
  {
    stepType: "replaceAround",
    from: 20,
    to: 57,
    gapFrom: 21,
    gapTo: 57,
    insert: 1,
    slice: {
      content: [
        {
          type: "listItem",
          content: [{ type: "orderedList", attrs: { order: 1 } }],
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 20,
    to: 59,
    gapFrom: 21,
    gapTo: 57,
    insert: 1,
    slice: {
      content: [{ type: "listItem" }],
      openStart: 1,
    },
    structure: true,
  },
];

describe("sink multiple list items into nested list | [ReplaceAroundStep]", () => {
  it("should sink multiple list items into a nested list by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the sink by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the sink by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
