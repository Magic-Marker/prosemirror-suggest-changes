import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.blockquote(testBuilders.paragraph("Hello World")),
);

export const finalDoc = testBuilders.doc(testBuilders.paragraph("Hello World"));

export const finalDocWithMarks = testBuilders.doc(
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
          inverseTo: 13,
          inverseGapFrom: 0,
          inverseGapTo: 13,
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
          value: "gapTo",
          position: "end",
          toOffset: 0,
          type: "replaceAround",
          slice: { content: [{ type: "blockquote" }] },
          insert: 1,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 13,
            inverseGapFrom: 0,
            inverseGapTo: 13,
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
              inverseTo: 13,
              inverseGapFrom: 0,
              inverseGapTo: 13,
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
                inverseTo: 13,
                inverseGapFrom: 0,
                inverseGapTo: 13,
                gapFromOffset: 0,
                gapToOffset: 0,
                fromOffset: 0,
                toOffset: 0,
              },
            },
          },
          testBuilders.paragraph("Hello World"),
        ),
      ),
    ),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 15,
    gapFrom: 1,
    gapTo: 14,
    insert: 0,
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 13,
    gapFrom: 0,
    gapTo: 13,
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
