import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.paragraph("Hello World"),
);

export const finalDoc = testBuilders.doc(
  testBuilders.blockquote(testBuilders.paragraph("Hello World")),
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
        debug: {
          inverseFrom: 0,
          inverseTo: 15,
          inverseGapFrom: 1,
          inverseGapTo: 14,
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
          value: "to",
          position: "end",
          gapToOffset: 1,
          type: "replaceAround",
          slice: null,
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 15,
            inverseGapFrom: 1,
            inverseGapTo: 14,
            gapFromOffset: 1,
            gapToOffset: 1,
            fromOffset: 1,
            toOffset: 1,
          },
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
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
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
                slice: null,
                insert: 0,
                structure: true,
                debug: {
                  inverseFrom: 0,
                  inverseTo: 15,
                  inverseGapFrom: 1,
                  inverseGapTo: 14,
                  gapFromOffset: 1,
                  gapToOffset: 1,
                  fromOffset: 1,
                  toOffset: 1,
                },
              },
            },
            testBuilders.paragraph("Hello World"),
          ),
        ),
      ),
    ),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 13,
    gapFrom: 0,
    gapTo: 13,
    insert: 1,
    slice: { content: [{ type: "blockquote" }] },
    structure: true,
  },
];

export const inverseSteps = [
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
