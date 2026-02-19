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
    ),
  ),
  testBuilders.paragraph("World"),
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
                openStart: 3,
              },
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 10,
                inverseTo: 20,
                inverseGapFrom: 13,
                inverseGapTo: 20,
                gapFromOffset: 3,
                gapToOffset: 0,
                fromOffset: 3,
                toOffset: 0,
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
          openStart: 3,
        },
        insert: 0,
        structure: true,
        debug: {
          inverseFrom: 10,
          inverseTo: 20,
          inverseGapFrom: 13,
          inverseGapTo: 20,
          gapFromOffset: 3,
          gapToOffset: 0,
          fromOffset: 3,
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
          },
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 10,
            inverseTo: 20,
            inverseGapFrom: 13,
            inverseGapTo: 20,
            gapFromOffset: 3,
            gapToOffset: 0,
            fromOffset: 3,
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
              openStart: 3,
            },
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 10,
              inverseTo: 20,
              inverseGapFrom: 13,
              inverseGapTo: 20,
              gapFromOffset: 3,
              gapToOffset: 0,
              fromOffset: 3,
              toOffset: 0,
            },
          },
        },
        testBuilders.paragraph("World"),
      ),
    ),
  ),
);

export const steps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 20,
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
      ],
      openStart: 3,
    },
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 10,
    to: 20,
    gapFrom: 13,
    gapTo: 20,
    insert: 0,
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
      openStart: 3,
    },
    structure: true,
  },
];
