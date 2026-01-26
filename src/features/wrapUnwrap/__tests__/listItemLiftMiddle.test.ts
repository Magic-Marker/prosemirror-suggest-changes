import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item One")),
    testBuilders.listItem(testBuilders.paragraph("Item Two")),
    testBuilders.listItem(testBuilders.paragraph("Item Three")),
    testBuilders.listItem(testBuilders.paragraph("Item Four")),
    testBuilders.listItem(testBuilders.paragraph("Item Five")),
  ),
);

const finalState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item One")),
    testBuilders.listItem(testBuilders.paragraph("Item Two")),
  ),
  testBuilders.paragraph("Item Three"),
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item Four")),
    testBuilders.listItem(testBuilders.paragraph("Item Five")),
  ),
);

const finalStateWithMarks = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item One")),
    testBuilders.structure(
      {
        id: 1,
        type: "structure",
        data: {
          value: "from",
          position: "end",
          gapFromOffset: 1,
          type: "replaceAround",
          slice: { content: [{ type: "listItem" }] },
          insert: 1,
          structure: false,
          debug: {
            inverseFrom: 25,
            inverseTo: 39,
            inverseGapFrom: 26,
            inverseGapTo: 38,
            gapFromOffset: 1,
            gapToOffset: 1,
            fromOffset: 1,
            toOffset: 1,
          },
        },
      },
      testBuilders.listItem(testBuilders.paragraph("Item Two")),
    ),
  ),
  testBuilders.structure(
    {
      id: 1,
      type: "structure",
      data: {
        value: "gapFrom",
        position: "start",
        fromOffset: 1,
        type: "replaceAround",
        slice: { content: [{ type: "listItem" }] },
        insert: 1,
        structure: false,
        debug: {
          inverseFrom: 25,
          inverseTo: 39,
          inverseGapFrom: 26,
          inverseGapTo: 38,
          gapFromOffset: 1,
          gapToOffset: 1,
          fromOffset: 1,
          toOffset: 1,
        },
      },
    },
    testBuilders.structure(
      {
        id: 1,
        type: "structure",
        data: {
          value: "gapTo",
          position: "end",
          toOffset: 1,
          type: "replaceAround",
          slice: { content: [{ type: "listItem" }] },
          insert: 1,
          structure: false,
          debug: {
            inverseFrom: 25,
            inverseTo: 39,
            inverseGapFrom: 26,
            inverseGapTo: 38,
            gapFromOffset: 1,
            gapToOffset: 1,
            fromOffset: 1,
            toOffset: 1,
          },
        },
      },
      testBuilders.paragraph("Item Three"),
    ),
  ),
  testBuilders.orderedList(
    testBuilders.structure(
      {
        id: 1,
        type: "structure",
        data: {
          value: "to",
          position: "start",
          gapToOffset: 1,
          type: "replaceAround",
          slice: { content: [{ type: "listItem" }] },
          insert: 1,
          structure: false,
          debug: {
            inverseFrom: 25,
            inverseTo: 39,
            inverseGapFrom: 26,
            inverseGapTo: 38,
            gapFromOffset: 1,
            gapToOffset: 1,
            fromOffset: 1,
            toOffset: 1,
          },
        },
      },
      testBuilders.listItem(testBuilders.paragraph("Item Four")),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item Five")),
  ),
);

const steps = [
  {
    stepType: "replaceAround",
    from: 25,
    to: 39,
    gapFrom: 26,
    gapTo: 38,
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
    stepType: "replaceAround",
    from: 25,
    to: 39,
    gapFrom: 26,
    gapTo: 38,
    insert: 1,
    slice: {
      content: [
        {
          type: "listItem",
        },
      ],
    },
    structure: true,
  },
];

describe("middle list item lift | [ReplaceAroundStep]", () => {
  it("should lift middle list item out of ordered list by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the lift by applying 1 inverse ReplaceAround step", () => {
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
