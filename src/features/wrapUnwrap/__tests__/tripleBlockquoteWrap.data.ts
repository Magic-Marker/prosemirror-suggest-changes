import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(testBuilders.paragraph("Hello World"));

export const finalDoc = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Hello World")),
    ),
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
        gapFromOffset: 3,
        type: "replaceAround",
        slice: null,
        insert: 0,
        structure: true,
        debug: {
          inverseFrom: 0,
          inverseTo: 19,
          inverseGapFrom: 3,
          inverseGapTo: 16,
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
          value: "to",
          position: "end",
          gapToOffset: 3,
          type: "replaceAround",
          slice: null,
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 19,
            inverseGapFrom: 3,
            inverseGapTo: 16,
            gapFromOffset: 3,
            gapToOffset: 3,
            fromOffset: 3,
            toOffset: 3,
          },
        },
      },
      testBuilders.blockquote(
        testBuilders.blockquote(
          testBuilders.blockquote(
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
                    inverseFrom: 0,
                    inverseTo: 19,
                    inverseGapFrom: 3,
                    inverseGapTo: 16,
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
                      inverseFrom: 0,
                      inverseTo: 19,
                      inverseGapFrom: 3,
                      inverseGapTo: 16,
                      gapFromOffset: 3,
                      gapToOffset: 3,
                      fromOffset: 3,
                      toOffset: 3,
                    },
                  },
                },
                testBuilders.paragraph("Hello World")
              )
            )
          )
        )
      )
    )
  )
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 13,
    gapFrom: 0,
    gapTo: 13,
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
      ],
    },
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 19,
    gapFrom: 3,
    gapTo: 16,
    insert: 0,
    structure: true,
  },
];
