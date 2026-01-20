import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.orderedList(//1
    testBuilders.listItem(testBuilders.paragraph("Item One")),//13
    testBuilders.listItem(testBuilders.paragraph("Item Two")),//25
    testBuilders.listItem(testBuilders.paragraph("Item Three")),//39
    testBuilders.listItem(testBuilders.paragraph("Item Four")),//52
    testBuilders.listItem(testBuilders.paragraph("Item Five")),//65
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

const finalStateWithMarks = finalState;

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
    "stepType": "replaceAround",
    "from": 52,
    "to": 64,
    "gapFrom": 53,
    "gapTo": 64,
    "insert": 1,
    "slice": {
      "content": [
        {
          "type": "orderedList",
          "attrs": {
            "order": 1
          },
          "content": [
            {
              "type": "listItem"
            }
          ]
        }
      ],
      "openStart": 1
    },
    "structure": true
  }
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
