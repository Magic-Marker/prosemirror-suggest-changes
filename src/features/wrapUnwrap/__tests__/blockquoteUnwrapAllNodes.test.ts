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
  testBuilders.paragraph("Hello"),
  testBuilders.paragraph("World"),
);

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
          inverseTo: 14,
          inverseGapFrom: 0,
          inverseGapTo: 14,
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
            inverseTo: 14,
            inverseGapFrom: 0,
            inverseGapTo: 14,
            gapFromOffset: 0,
            gapToOffset: 0,
            fromOffset: 0,
            toOffset: 0,
          },
        },
      },
      testBuilders.paragraph("Hello")
    )
  ),
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
          inverseTo: 14,
          inverseGapFrom: 0,
          inverseGapTo: 14,
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
            inverseTo: 14,
            inverseGapFrom: 0,
            inverseGapTo: 14,
            gapFromOffset: 0,
            gapToOffset: 0,
            fromOffset: 0,
            toOffset: 0,
          },
        },
      },
      testBuilders.paragraph("World")
    )
  )
);

const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 16,
    gapFrom: 1,
    gapTo: 15,
    insert: 0,
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 14,
    gapFrom: 0,
    gapTo: 14,
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

describe("unwrap multiple nodes from a blockquote | [ReplaceAroundStep]", () => {
  it("should unwrap multiple paragraphs from a blockquote by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the unwrap of multiple paragraphs from a blockquote by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the unwrap of multiple paragraphs froma blockquote by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
