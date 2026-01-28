import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item One")),
    testBuilders.listItem(testBuilders.paragraph("Item Two")),
    testBuilders.listItem(testBuilders.paragraph("Item Three")),
    testBuilders.listItem(testBuilders.paragraph("Item Four")),
    testBuilders.listItem(testBuilders.paragraph("Item Five")),
  ),
);

export const finalDoc = testBuilders.doc(
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

export const finalDocWithMarks = testBuilders.doc(
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

export const steps = [
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

export const inverseSteps = [
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
