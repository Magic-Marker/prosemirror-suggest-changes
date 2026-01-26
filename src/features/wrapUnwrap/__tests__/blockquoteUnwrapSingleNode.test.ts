import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.blockquote(testBuilders.paragraph("Hello World")),
);
const finalState = testBuilders.doc(testBuilders.paragraph("Hello World"));
const finalStateWithMarks = testBuilders.doc(
  testBuilders.structure(
    {
      id: 1,
      type: "structure",
      data: {
        value: "gapFrom",
        position: "start",
        fromOffset: 0,
        type: "replaceAround",
        slice: { content: [{ type: "blockquote" }] },
        insert: 1,
        structure: true,
        debug: {
          inverseFrom: 0,
          inverseTo: 13,
          inverseGapFrom: 0,
          inverseGapTo: 13,
          gapFromOffset: 0,
          gapToOffset: 0,
          fromOffset: 0,
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
          slice: { content: [{ type: "blockquote" }] },
          insert: 1,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 13,
            inverseGapFrom: 0,
            inverseGapTo: 13,
            gapFromOffset: 0,
            gapToOffset: 0,
            fromOffset: 0,
            toOffset: 0,
          },
        },
      },
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 0,
            type: "replaceAround",
            slice: { content: [{ type: "blockquote" }] },
            insert: 1,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 13,
              inverseGapFrom: 0,
              inverseGapTo: 13,
              gapFromOffset: 0,
              gapToOffset: 0,
              fromOffset: 0,
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
              slice: { content: [{ type: "blockquote" }] },
              insert: 1,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 13,
                inverseGapFrom: 0,
                inverseGapTo: 13,
                gapFromOffset: 0,
                gapToOffset: 0,
                fromOffset: 0,
                toOffset: 0,
              },
            },
          },
          testBuilders.paragraph("Hello World")
        )
      )
    )
  )
);
const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 15,
    gapFrom: 1,
    gapTo: 14,
    insert: 0,
    structure: true,
  },
];
const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 13,
    gapFrom: 0,
    gapTo: 13,
    insert: 1,
    slice: {
      content: [
        {
          type: "blockquote",
        },
      ],
    },
    structure: true,
  },
];

describe("unwrap a single node from a blockquote | [ReplaceAroundStep]", () => {
  it("should unwrap a paragraph from a blockquote by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the unwrap of a paragraph from a blockquote by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the unwrap of a paragraph from a blockquote by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
