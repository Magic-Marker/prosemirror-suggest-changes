import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(testBuilders.paragraph("Hello World"));

const finalState = testBuilders.doc(
  testBuilders.blockquote(testBuilders.paragraph("Hello World")),
);

const finalStateWithMarks = testBuilders.doc(
  testBuilders.structure(
    {
      id: 1,
      type: "structure",
      data: {
        value: "from",
        position: "start",
        gapFromOffset: 1,
        type: "replaceAround",
        slice: null,
        insert: 0,
        structure: true,
        debug: {
          inverseFrom: 0,
          inverseTo: 15,
          inverseGapFrom: 1,
          inverseGapTo: 14,
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
          value: "to",
          position: "end",
          gapToOffset: 1,
          type: "replaceAround",
          slice: null,
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 15,
            inverseGapFrom: 1,
            inverseGapTo: 14,
            gapFromOffset: 1,
            gapToOffset: 1,
            fromOffset: 1,
            toOffset: 1,
          },
        },
      },
      testBuilders.blockquote(
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "gapFrom",
              position: "start",
              fromOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
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
                slice: null,
                insert: 0,
                structure: true,
                debug: {
                  inverseFrom: 0,
                  inverseTo: 15,
                  inverseGapFrom: 1,
                  inverseGapTo: 14,
                  gapFromOffset: 1,
                  gapToOffset: 1,
                  fromOffset: 1,
                  toOffset: 1,
                },
              },
            },
            testBuilders.paragraph("Hello World"),
          ),
        ),
      ),
    ),
  ),
);

const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 13,
    gapFrom: 0,
    gapTo: 13,
    insert: 1,
    slice: { content: [{ type: "blockquote" }] },
    structure: true,
  },
];

const inverseSteps = [
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

describe("wrap a single node with a blockquote | [ReplaceAroundStep]", () => {
  it("should wrap a paragraph in a blockquote by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the wrap of a paragraph in a blockquote by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the wrap of a paragraph in a blockquote by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
