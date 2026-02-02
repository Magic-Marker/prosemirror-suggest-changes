import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(testBuilders.paragraph("Item 2")),
    testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
    testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
    testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

export const finalDoc = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

export const finalDocWithMarks = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.structure(
      {
        id: 1,
        type: "structure",
        data: {
          value: "to",
          position: "end",
          gapToOffset: 2,
          type: "replaceAround",
          slice: { content: [{ type: "listItem" }], openStart: 1 },
          insert: 1,
          structure: true,
          debug: {
            inverseFrom: 20,
            inverseTo: 59,
            inverseGapFrom: 21,
            inverseGapTo: 57,
            gapFromOffset: 1,
            gapToOffset: 2,
            fromOffset: 1,
            toOffset: 2,
          },
        },
      },
      testBuilders.listItem(
        testBuilders.paragraph("Item 2"),
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "gapFrom",
              position: "innerStart",
              fromOffset: 1,
              type: "replaceAround",
              slice: { content: [{ type: "listItem" }], openStart: 1 },
              insert: 1,
              structure: true,
              debug: {
                inverseFrom: 20,
                inverseTo: 59,
                inverseGapFrom: 21,
                inverseGapTo: 57,
                gapFromOffset: 1,
                gapToOffset: 2,
                fromOffset: 1,
                toOffset: 2,
              },
            },
          },
          testBuilders.structure(
            {
              id: 1,
              type: "structure",
              data: {
                value: "gapTo",
                position: "innerEnd",
                toOffset: 2,
                type: "replaceAround",
                slice: { content: [{ type: "listItem" }], openStart: 1 },
                insert: 1,
                structure: true,
                debug: {
                  inverseFrom: 20,
                  inverseTo: 59,
                  inverseGapFrom: 21,
                  inverseGapTo: 57,
                  gapFromOffset: 1,
                  gapToOffset: 2,
                  fromOffset: 1,
                  toOffset: 2,
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
                  gapFromOffset: 1,
                  type: "replaceAround",
                  slice: { content: [{ type: "listItem" }], openStart: 1 },
                  insert: 1,
                  structure: true,
                  debug: {
                    inverseFrom: 20,
                    inverseTo: 59,
                    inverseGapFrom: 21,
                    inverseGapTo: 57,
                    gapFromOffset: 1,
                    gapToOffset: 2,
                    fromOffset: 1,
                    toOffset: 2,
                  },
                },
              },
              testBuilders.orderedList(
                testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
                testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
                testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
              ),
            ),
          ),
        ),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

export const finalDocWithMarksJSON = {
  type: "doc",
  content: [
    {
      type: "orderedList",
      attrs: {
        order: 1,
      },
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Item 1",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Item 2",
                },
              ],
            },
            {
              type: "orderedList",
              attrs: {
                order: 1,
              },
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Item 2.1",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Item 2.2",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Item 2.3",
                        },
                      ],
                    },
                  ],
                },
              ],
              marks: [
                {
                  type: "structure",
                  attrs: {
                    id: 1,
                    data: {
                      value: "gapFrom",
                      position: "innerStart",
                      fromOffset: 1,
                      type: "replaceAround",
                      slice: {
                        content: [
                          {
                            type: "listItem",
                          },
                        ],
                        openStart: 1,
                      },
                      insert: 1,
                      structure: true,
                      debug: {
                        inverseFrom: 20,
                        inverseTo: 59,
                        inverseGapFrom: 21,
                        inverseGapTo: 57,
                        gapFromOffset: 1,
                        gapToOffset: 2,
                        fromOffset: 1,
                        toOffset: 2,
                      },
                    },
                  },
                },
                {
                  type: "structure",
                  attrs: {
                    id: 1,
                    data: {
                      value: "gapTo",
                      position: "innerEnd",
                      toOffset: 2,
                      type: "replaceAround",
                      slice: {
                        content: [
                          {
                            type: "listItem",
                          },
                        ],
                        openStart: 1,
                      },
                      insert: 1,
                      structure: true,
                      debug: {
                        inverseFrom: 20,
                        inverseTo: 59,
                        inverseGapFrom: 21,
                        inverseGapTo: 57,
                        gapFromOffset: 1,
                        gapToOffset: 2,
                        fromOffset: 1,
                        toOffset: 2,
                      },
                    },
                  },
                },
                {
                  type: "structure",
                  attrs: {
                    id: 1,
                    data: {
                      value: "from",
                      position: "start",
                      gapFromOffset: 1,
                      type: "replaceAround",
                      slice: {
                        content: [
                          {
                            type: "listItem",
                          },
                        ],
                        openStart: 1,
                      },
                      insert: 1,
                      structure: true,
                      debug: {
                        inverseFrom: 20,
                        inverseTo: 59,
                        inverseGapFrom: 21,
                        inverseGapTo: 57,
                        gapFromOffset: 1,
                        gapToOffset: 2,
                        fromOffset: 1,
                        toOffset: 2,
                      },
                    },
                  },
                },
              ],
            },
          ],
          marks: [
            {
              type: "structure",
              attrs: {
                id: 1,
                data: {
                  value: "to",
                  position: "end",
                  gapToOffset: 2,
                  type: "replaceAround",
                  slice: {
                    content: [
                      {
                        type: "listItem",
                      },
                    ],
                    openStart: 1,
                  },
                  insert: 1,
                  structure: true,
                  debug: {
                    inverseFrom: 20,
                    inverseTo: 59,
                    inverseGapFrom: 21,
                    inverseGapTo: 57,
                    gapFromOffset: 1,
                    gapToOffset: 2,
                    fromOffset: 1,
                    toOffset: 2,
                  },
                },
              },
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Item 3",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Item 4",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Item 5",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const steps = [
  {
    stepType: "replaceAround",
    from: 20,
    to: 57,
    gapFrom: 21,
    gapTo: 57,
    insert: 1,
    slice: {
      content: [
        {
          type: "listItem",
          content: [{ type: "orderedList", attrs: { order: 1 } }],
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
    from: 20,
    to: 59,
    gapFrom: 21,
    gapTo: 57,
    insert: 1,
    slice: {
      content: [{ type: "listItem" }],
      openStart: 1,
    },
    structure: true,
  },
];
