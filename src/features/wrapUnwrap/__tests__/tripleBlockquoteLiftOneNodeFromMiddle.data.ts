import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
        testBuilders.paragraph("Hello"),
        testBuilders.paragraph("World"),
        testBuilders.paragraph("Foo"),
      ),
    ),
  ),
);

export const finalDoc = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Hello")),
    ),
  ),
  testBuilders.paragraph("World"),
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Foo")),
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
              gapFromOffset: 3,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 10,
                inverseTo: 23,
                inverseGapFrom: 13,
                inverseGapTo: 20,
                gapFromOffset: 3,
                gapToOffset: 3,
                fromOffset: 3,
                toOffset: 3,
              },
            },
          },
          testBuilders.paragraph("Hello"),
        ),
      ),
    ),
  ),
  testBuilders.structure(
    {
      id: 1,
      type: "structure",
      data: {
        value: "gapFrom",
        position: "start",
        fromOffset: 3,
        type: "replaceAround",
        slice: null,
        insert: 0,
        structure: true,
        debug: {
          inverseFrom: 10,
          inverseTo: 23,
          inverseGapFrom: 13,
          inverseGapTo: 20,
          gapFromOffset: 3,
          gapToOffset: 3,
          fromOffset: 3,
          toOffset: 3,
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
          toOffset: 3,
          type: "replaceAround",
          slice: null,
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 10,
            inverseTo: 23,
            inverseGapFrom: 13,
            inverseGapTo: 20,
            gapFromOffset: 3,
            gapToOffset: 3,
            fromOffset: 3,
            toOffset: 3,
          },
        },
      },
      testBuilders.paragraph("World"),
    ),
  ),
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "start",
              gapToOffset: 3,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 10,
                inverseTo: 23,
                inverseGapFrom: 13,
                inverseGapTo: 20,
                gapFromOffset: 3,
                gapToOffset: 3,
                fromOffset: 3,
                toOffset: 3,
              },
            },
          },
          testBuilders.paragraph("Foo"),
        ),
      ),
    ),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 17,
    gapFrom: 10,
    gapTo: 17,
    insert: 3,
    slice: {
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [{ type: "blockquote" }],
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [{ type: "blockquote" }],
            },
          ],
        },
      ],
      openStart: 3,
      openEnd: 3,
    },
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 23,
    gapFrom: 13,
    gapTo: 20,
    insert: 0,
    structure: true,
  },
];
