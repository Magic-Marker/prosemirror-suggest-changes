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
    testBuilders.listItem(testBuilders.paragraph("Item Three")),
    testBuilders.listItem(testBuilders.paragraph("Item Four")),
  ),
  testBuilders.paragraph("Item Five"),
);

const finalStateWithMarks = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item One")),
    testBuilders.listItem(testBuilders.paragraph("Item Two")),
    testBuilders.listItem(testBuilders.paragraph("Item Three")),
    testBuilders.structure(
      {
        id: 1,
        type: "structure",
        data: {
          value: "from",
          position: "end",
          gapFromOffset: 1,
          type: "replaceAround",
          slice: {
            content: [
              {
                type: "orderedList",
                attrs: { order: 1 },
                content: [{ type: "listItem" }],
              },
            ],
            openStart: 1,
          },
          insert: 1,
          structure: false,
          debug: {
            inverseFrom: 52,
            inverseTo: 64,
            inverseGapFrom: 53,
            inverseGapTo: 64,
            gapFromOffset: 1,
            gapToOffset: 0,
            fromOffset: 1,
            toOffset: 0,
          },
        },
      },
      testBuilders.listItem(testBuilders.paragraph("Item Four")),
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
        slice: {
          content: [
            {
              type: "orderedList",
              attrs: { order: 1 },
              content: [{ type: "listItem" }],
            },
          ],
          openStart: 1,
        },
        insert: 1,
        structure: false,
        debug: {
          inverseFrom: 52,
          inverseTo: 64,
          inverseGapFrom: 53,
          inverseGapTo: 64,
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
          slice: {
            content: [
              {
                type: "orderedList",
                attrs: { order: 1 },
                content: [{ type: "listItem" }],
              },
            ],
            openStart: 1,
          },
          insert: 1,
          structure: false,
          debug: {
            inverseFrom: 52,
            inverseTo: 64,
            inverseGapFrom: 53,
            inverseGapTo: 64,
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
            slice: {
              content: [
                {
                  type: "orderedList",
                  attrs: { order: 1 },
                  content: [{ type: "listItem" }],
                },
              ],
              openStart: 1,
            },
            insert: 1,
            structure: false,
            debug: {
              inverseFrom: 52,
              inverseTo: 64,
              inverseGapFrom: 53,
              inverseGapTo: 64,
              gapFromOffset: 1,
              gapToOffset: 0,
              fromOffset: 1,
              toOffset: 0,
            },
          },
        },
        testBuilders.paragraph("Item Five"),
      ),
    ),
  ),
);

const steps = [
  {
    stepType: "replaceAround",
    from: 52,
    to: 66,
    gapFrom: 53,
    gapTo: 64,
    insert: 1,
    slice: {
      content: [{ type: "orderedList", attrs: { order: 1 } }],
      openStart: 1,
    },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 52,
    to: 64,
    gapFrom: 53,
    gapTo: 64,
    insert: 1,
    slice: {
      content: [
        {
          type: "orderedList",
          attrs: {
            order: 1,
          },
          content: [
            {
              type: "listItem",
            },
          ],
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
];

describe("last list item lift | [ReplaceAroundStep]", () => {
  it("should lift last list item out of ordered list by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps, true));
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
