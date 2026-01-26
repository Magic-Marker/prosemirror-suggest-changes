import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
        testBuilders.paragraph("Hello"),
        testBuilders.paragraph("World"),
        testBuilders.paragraph("Foo"),
      ),
    ),
  ),
);

const finalState = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Hello")),
    ),
  ),
  testBuilders.paragraph("World"),
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Foo")),
    ),
  ),
);

const finalStateWithMarks = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "from",
              position: "end",
              gapFromOffset: 3,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 10,
                inverseTo: 23,
                inverseGapFrom: 13,
                inverseGapTo: 20,
                gapFromOffset: 3,
                gapToOffset: 3,
                fromOffset: 3,
                toOffset: 3,
              },
            },
          },
          testBuilders.paragraph("Hello"),
        ),
      ),
    ),
  ),
  testBuilders.structure(
    {
      id: 1,
      type: "structure",
      data: {
        value: "gapFrom",
        position: "start",
        fromOffset: 3,
        type: "replaceAround",
        slice: null,
        insert: 0,
        structure: true,
        debug: {
          inverseFrom: 10,
          inverseTo: 23,
          inverseGapFrom: 13,
          inverseGapTo: 20,
          gapFromOffset: 3,
          gapToOffset: 3,
          fromOffset: 3,
          toOffset: 3,
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
          toOffset: 3,
          type: "replaceAround",
          slice: null,
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 10,
            inverseTo: 23,
            inverseGapFrom: 13,
            inverseGapTo: 20,
            gapFromOffset: 3,
            gapToOffset: 3,
            fromOffset: 3,
            toOffset: 3,
          },
        },
      },
      testBuilders.paragraph("World"),
    ),
  ),
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "start",
              gapToOffset: 3,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 10,
                inverseTo: 23,
                inverseGapFrom: 13,
                inverseGapTo: 20,
                gapFromOffset: 3,
                gapToOffset: 3,
                fromOffset: 3,
                toOffset: 3,
              },
            },
          },
          testBuilders.paragraph("Foo"),
        ),
      ),
    ),
  ),
);

const steps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 17,
    gapFrom: 10,
    gapTo: 17,
    insert: 3,
    slice: {
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [{ type: "blockquote" }],
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [{ type: "blockquote" }],
            },
          ],
        },
      ],
      openStart: 3,
      openEnd: 3,
    },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 23,
    gapFrom: 13,
    gapTo: 20,
    insert: 0,
    structure: true,
  },
];

describe("lift one node from middle through all levels in a multi-level wrap | [ReplaceAroundStep]", () => {
  it("should lift middle paragraph out of all blockquotes by applying 1 ReplaceAround step", () => {
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
