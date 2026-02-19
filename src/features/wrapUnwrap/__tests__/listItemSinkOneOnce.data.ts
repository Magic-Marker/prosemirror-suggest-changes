import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(testBuilders.paragraph("Item 2")),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
  ),
);

export const finalDoc = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(
      testBuilders.paragraph("Item 1"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
  ),
);

export const finalDocWithMarks = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.structure(
      {
        id: 1,
        type: "structure",
        data: {
          value: "to",
          position: "end",
          gapToOffset: 2,
          slice: { content: [{ type: "listItem" }], openStart: 1 },
          insert: 1,
          structure: true,
        },
      },
      testBuilders.listItem(
        testBuilders.paragraph("Item 1"),
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "from",
              position: "start",
              gapFromOffset: 1,
              slice: { content: [{ type: "listItem" }], openStart: 1 },
              insert: 1,
              structure: true,
            },
          },
          testBuilders.orderedList(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  slice: {
                    content: [{ type: "listItem" }],
                    openStart: 1,
                  },
                  insert: 1,
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
                    toOffset: 2,
                    slice: {
                      content: [{ type: "listItem" }],
                      openStart: 1,
                    },
                    insert: 1,
                    structure: true,
                  },
                },
                testBuilders.listItem(testBuilders.paragraph("Item 2")),
              ),
            ),
          ),
        ),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 21,
    gapFrom: 11,
    gapTo: 21,
    insert: 1,
    slice: {
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "orderedList",
              attrs: {
                order: 1,
              },
            },
          ],
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 23,
    gapFrom: 11,
    gapTo: 21,
    insert: 1,
    slice: {
      content: [
        {
          type: "listItem",
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
];
