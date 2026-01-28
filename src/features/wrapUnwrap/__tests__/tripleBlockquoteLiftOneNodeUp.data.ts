import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
        testBuilders.paragraph("Hello"),
        testBuilders.paragraph("World"),
      ),
    ),
  ),
);

export const finalDoc = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Hello")),
      testBuilders.paragraph("World"),
    ),
  ),
);

export const finalDocWithMarks = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
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
                content: [{ type: "blockquote" }],
                openStart: 1,
              },
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 10,
                inverseTo: 18,
                inverseGapFrom: 11,
                inverseGapTo: 18,
                gapFromOffset: 1,
                gapToOffset: 0,
                fromOffset: 1,
                toOffset: 0,
              },
            },
          },
          testBuilders.paragraph("Hello"),
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
              content: [{ type: "blockquote" }],
              openStart: 1,
            },
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 10,
              inverseTo: 18,
              inverseGapFrom: 11,
              inverseGapTo: 18,
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
                content: [{ type: "blockquote" }],
                openStart: 1,
              },
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 10,
                inverseTo: 18,
                inverseGapFrom: 11,
                inverseGapTo: 18,
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
                  content: [{ type: "blockquote" }],
                  openStart: 1,
                },
                insert: 0,
                structure: true,
                debug: {
                  inverseFrom: 10,
                  inverseTo: 18,
                  inverseGapFrom: 11,
                  inverseGapTo: 18,
                  gapFromOffset: 1,
                  gapToOffset: 0,
                  fromOffset: 1,
                  toOffset: 0,
                },
              },
            },
            testBuilders.paragraph("World"),
          ),
        ),
      ),
    ),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 18,
    gapFrom: 10,
    gapTo: 17,
    insert: 1,
    slice: {
      content: [{ type: "blockquote" }],
      openStart: 1,
    },
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 18,
    gapFrom: 11,
    gapTo: 18,
    insert: 0,
    slice: {
      content: [
        {
          type: "blockquote",
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
];
