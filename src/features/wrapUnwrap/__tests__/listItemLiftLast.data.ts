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
    testBuilders.listItem(testBuilders.paragraph("Item Three")),
    testBuilders.listItem(testBuilders.paragraph("Item Four")),
  ),
  testBuilders.paragraph("Item Five"),
);

export const finalDocWithMarks = testBuilders.doc(
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

export const steps = [
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

export const inverseSteps = [
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
