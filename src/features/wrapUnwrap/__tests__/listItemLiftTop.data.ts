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
  testBuilders.paragraph("Item One"),
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item Two")),
    testBuilders.listItem(testBuilders.paragraph("Item Three")),
    testBuilders.listItem(testBuilders.paragraph("Item Four")),
    testBuilders.listItem(testBuilders.paragraph("Item Five")),
  ),
);

export const finalDocWithMarks = testBuilders.doc(
  testBuilders.structure(
    {
      id: 1,
      type: "structure",
      data: {
        value: "gapFrom",
        position: "start",
        fromOffset: 0,
        slice: {
          content: [
            {
              type: "orderedList",
              attrs: { order: 1 },
              content: [{ type: "listItem" }],
            },
          ],
          openEnd: 1,
        },
        insert: 2,
        structure: true,
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
          slice: {
            content: [
              {
                type: "orderedList",
                attrs: { order: 1 },
                content: [{ type: "listItem" }],
              },
            ],
            openEnd: 1,
          },
          insert: 2,
          structure: true,
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
            slice: {
              content: [
                {
                  type: "orderedList",
                  attrs: { order: 1 },
                  content: [{ type: "listItem" }],
                },
              ],
              openEnd: 1,
            },
            insert: 2,
            structure: true,
          },
        },
        testBuilders.paragraph("Item One"),
      ),
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
          slice: {
            content: [
              {
                type: "orderedList",
                attrs: { order: 1 },
                content: [{ type: "listItem" }],
              },
            ],
            openEnd: 1,
          },
          insert: 2,
          structure: true,
        },
      },
      testBuilders.listItem(testBuilders.paragraph("Item Two")),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item Three")),
    testBuilders.listItem(testBuilders.paragraph("Item Four")),
    testBuilders.listItem(testBuilders.paragraph("Item Five")),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 13,
    gapFrom: 2,
    gapTo: 12,
    insert: 0,
    slice: {
      content: [
        {
          type: "orderedList",
          attrs: { order: 1 },
        },
      ],
      openEnd: 1,
    },
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 11,
    gapFrom: 0,
    gapTo: 10,
    insert: 2,
    slice: {
      content: [
        {
          type: "orderedList",
          attrs: { order: 1 },
          content: [{ type: "listItem" }],
        },
      ],
      openEnd: 1,
    },
    structure: true,
  },
];
