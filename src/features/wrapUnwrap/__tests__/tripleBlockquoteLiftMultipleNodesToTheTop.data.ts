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
  testBuilders.paragraph("Hello"),
  testBuilders.paragraph("World"),
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
        type: "replaceAround",
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
        insert: 3,
        structure: true,
        debug: {
          inverseFrom: 0,
          inverseTo: 14,
          inverseGapFrom: 0,
          inverseGapTo: 14,
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
          insert: 3,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 14,
            inverseGapFrom: 0,
            inverseGapTo: 14,
            gapFromOffset: 0,
            gapToOffset: 0,
            fromOffset: 0,
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
        value: "gapTo",
        position: "end",
        toOffset: 0,
        type: "replaceAround",
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
        insert: 3,
        structure: true,
        debug: {
          inverseFrom: 0,
          inverseTo: 14,
          inverseGapFrom: 0,
          inverseGapTo: 14,
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
          insert: 3,
          structure: true,
          debug: {
            inverseFrom: 0,
            inverseTo: 14,
            inverseGapFrom: 0,
            inverseGapTo: 14,
            gapFromOffset: 0,
            gapToOffset: 0,
            fromOffset: 0,
            toOffset: 0,
          },
        },
      },
      testBuilders.paragraph("World"),
    ),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 20,
    gapFrom: 3,
    gapTo: 17,
    insert: 0,
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 0,
    to: 14,
    gapFrom: 0,
    gapTo: 14,
    insert: 3,
    slice: {
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [
                {
                  type: "blockquote",
                },
              ],
            },
          ],
        },
      ],
    },
    structure: true,
  },
];
