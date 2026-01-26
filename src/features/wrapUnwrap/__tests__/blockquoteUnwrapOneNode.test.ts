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

const finalStateWithMarks = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.structure(
      {
        id: 1,
        type: "structure",
        data: {
          value: "from",
          position: "end",
          gapFromOffset: 1,
          type: "replaceAround",
          slice: { content: [{ type: "blockquote" }], openStart: 1 },
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 8,
            inverseTo: 16,
            inverseGapFrom: 9,
            inverseGapTo: 16,
            gapFromOffset: 1,
            gapToOffset: 0,
            fromOffset: 1,
            toOffset: 0,
          },
        },
      },
      testBuilders.paragraph("Hello"),
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
        slice: { content: [{ type: "blockquote" }], openStart: 1 },
        insert: 0,
        structure: true,
        debug: {
          inverseFrom: 8,
          inverseTo: 16,
          inverseGapFrom: 9,
          inverseGapTo: 16,
          gapFromOffset: 1,
          gapToOffset: 0,
          fromOffset: 1,
          toOffset: 0,
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
          toOffset: 0,
          type: "replaceAround",
          slice: { content: [{ type: "blockquote" }], openStart: 1 },
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 8,
            inverseTo: 16,
            inverseGapFrom: 9,
            inverseGapTo: 16,
            gapFromOffset: 1,
            gapToOffset: 0,
            fromOffset: 1,
            toOffset: 0,
          },
        },
      },
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "to",
            position: "end",
            gapToOffset: 0,
            type: "replaceAround",
            slice: { content: [{ type: "blockquote" }], openStart: 1 },
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 8,
              inverseTo: 16,
              inverseGapFrom: 9,
              inverseGapTo: 16,
              gapFromOffset: 1,
              gapToOffset: 0,
              fromOffset: 1,
              toOffset: 0,
            },
          },
        },
        testBuilders.paragraph("World"),
      ),
    ),
  ),
);

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

  it("should revert the unwrap of one paragraph from a blockquote with multiple paragraphs by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
