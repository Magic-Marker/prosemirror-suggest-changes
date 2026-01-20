import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2"),
      testBuilders.orderedList(
        testBuilders.listItem(
          testBuilders.paragraph("Item 2.1"),
          testBuilders.orderedList(
            testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
          ),
        ),
        testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.4")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

const finalState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
  ),
  testBuilders.paragraph("Item 2"),
  testBuilders.orderedList(
    testBuilders.listItem(
      testBuilders.paragraph("Item 2.1"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
    testBuilders.listItem(testBuilders.paragraph("Item 2.4")),
  ),
  testBuilders.paragraph("Item 3"),
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

const finalStateWithMarks = finalState;

const steps = [
  {
    stepType: "replace",
    from: 72,
    to: 74,
  },
  {
    stepType: "replaceAround",
    from: 11,
    to: 81,
    gapFrom: 12,
    gapTo: 80,
    insert: 1,
    slice: {
      content: [
        { type: "orderedList", attrs: { order: 1 } },
        { type: "orderedList", attrs: { order: 1 } },
      ],
      openStart: 1,
      openEnd: 1,
    },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replace",
    from: 72,
    to: 72,
    slice: {
      content: [{ type: "listItem" }, { type: "listItem" }],
      openStart: 1,
      openEnd: 1,
    },
  },
  {
    stepType: "replaceAround",
    from: 11,
    to: 81,
    gapFrom: 12,
    gapTo: 80,
    insert: 1,
    slice: {
      content: [{ type: "listItem" }],
    },
    structure: true,
  },
];

describe("lift list items mixed levels | [ReplaceStep, ReplaceAroundStep]", () => {
  it("should lift list items to mixed levels by applying 2 steps", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the lift by applying 2 inverse steps", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the lift by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
