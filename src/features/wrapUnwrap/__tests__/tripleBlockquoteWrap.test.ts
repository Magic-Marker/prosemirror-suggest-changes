import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(testBuilders.paragraph("Hello World"));

const finalState = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Hello World")),
    ),
  ),
);

const finalStateWithMarks = testBuilders.doc(
  testBuilders.structure(
    {
      id: 1,
      type: "structure",
      data: {
        value: "from",
        position: "start",
        gapFromOffset: 3,
        type: "replaceAround",
        slice: null,
        insert: 0,
        structure: true,
        debug: {
          inverseFrom: 0,
          inverseTo: 19,
          inverseGapFrom: 3,
          inverseGapTo: 16,
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
          value: "to",
          position: "end",
          gapToOffset: 3,
          type: "replaceAround",
          slice: null,
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 19,
            inverseGapFrom: 3,
            inverseGapTo: 16,
            gapFromOffset: 3,
            gapToOffset: 3,
            fromOffset: 3,
            toOffset: 3,
          },
        },
      },
      testBuilders.blockquote(
        testBuilders.blockquote(
          testBuilders.blockquote(
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
                    inverseFrom: 0,
                    inverseTo: 19,
                    inverseGapFrom: 3,
                    inverseGapTo: 16,
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
                      inverseFrom: 0,
                      inverseTo: 19,
                      inverseGapFrom: 3,
                      inverseGapTo: 16,
                      gapFromOffset: 3,
                      gapToOffset: 3,
                      fromOffset: 3,
                      toOffset: 3,
                    },
                  },
                },
                testBuilders.paragraph("Hello World")
              )
            )
          )
        )
      )
    )
  )
);

const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 13,
    gapFrom: 0,
    gapTo: 13,
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
      ],
    },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 19,
    gapFrom: 3,
    gapTo: 16,
    insert: 0,
    structure: true,
  },
];

describe("wrap a single node with three nested blockquotes | [ReplaceAroundStep]", () => {
  it("should wrap a paragraph in three blockquotes by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the wrap of a paragraph in three blockquotes by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the wrap of a paragraph in three blockquotes by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
