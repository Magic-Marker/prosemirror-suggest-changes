import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.paragraph("Hello"),
  testBuilders.paragraph("World"),
);

export const finalDoc = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.paragraph("Hello"),
    testBuilders.paragraph("World"),
  ),
);

export const finalDocWithMarks = testBuilders.doc(
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
            },
          },
          testBuilders.paragraph("Hello"),
        ),
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
            },
          },
          testBuilders.paragraph("World"),
        ),
      ),
    ),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 14,
    gapFrom: 0,
    gapTo: 14,
    insert: 1,
    slice: { content: [{ type: "blockquote" }] },
    structure: true,
  },
];

export const inverseSteps = [
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
