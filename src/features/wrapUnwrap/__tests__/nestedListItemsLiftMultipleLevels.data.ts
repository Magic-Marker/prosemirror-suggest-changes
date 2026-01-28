import { testBuilders } from "../../../testing/testBuilders.js";

export const initialDoc = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2"),
      testBuilders.orderedList(
        testBuilders.listItem(
          testBuilders.paragraph("Item 2.1"),
          testBuilders.orderedList(
            testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
          ),
        ),
        testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.4")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

export const finalDoc = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(testBuilders.paragraph("Item 2")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2.1"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
        testBuilders.listItem(testBuilders.paragraph("Item 2.4")),
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
    testBuilders.listItem(
      testBuilders.structure(
        {
          id: 2,
          type: "structure",
          data: {
            value: "from",
            position: "end",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: {
              content: [
                {
                  type: "listItem",
                  content: [{ type: "orderedList", attrs: { order: 1 } }],
                },
              ],
              openStart: 1,
            },
            insert: 1,
            structure: true,
            debug: {
              inverseFrom: 20,
              inverseTo: 73,
              inverseGapFrom: 21,
              inverseGapTo: 73,
              gapFromOffset: 1,
              gapToOffset: 0,
              fromOffset: 1,
              toOffset: 0,
            },
          },
        },
        testBuilders.paragraph("Item 2"),
      ),
    ),
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
            inverseFrom: 46,
            inverseTo: 73,
            inverseGapFrom: 47,
            inverseGapTo: 71,
            gapFromOffset: 1,
            gapToOffset: 2,
            fromOffset: 1,
            toOffset: 2,
          },
        },
      },
      testBuilders.structure(
        {
          id: 2,
          type: "structure",
          data: {
            value: "gapFrom",
            position: "start",
            fromOffset: 1,
            type: "replaceAround",
            slice: {
              content: [
                {
                  type: "listItem",
                  content: [{ type: "orderedList", attrs: { order: 1 } }],
                },
              ],
              openStart: 1,
            },
            insert: 1,
            structure: true,
            debug: {
              inverseFrom: 20,
              inverseTo: 73,
              inverseGapFrom: 21,
              inverseGapTo: 73,
              gapFromOffset: 1,
              gapToOffset: 0,
              fromOffset: 1,
              toOffset: 0,
            },
          },
        },
        testBuilders.structure(
          {
            id: 2,
            type: "structure",
            data: {
              value: "gapTo",
              position: "end",
              toOffset: 0,
              type: "replaceAround",
              slice: {
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "orderedList", attrs: { order: 1 } }],
                  },
                ],
                openStart: 1,
              },
              insert: 1,
              structure: true,
              debug: {
                inverseFrom: 20,
                inverseTo: 73,
                inverseGapFrom: 21,
                inverseGapTo: 73,
                gapFromOffset: 1,
                gapToOffset: 0,
                fromOffset: 1,
                toOffset: 0,
              },
            },
          },
          testBuilders.structure(
            {
              id: 2,
              type: "structure",
              data: {
                value: "to",
                position: "end",
                gapToOffset: 0,
                type: "replaceAround",
                slice: {
                  content: [
                    {
                      type: "listItem",
                      content: [{ type: "orderedList", attrs: { order: 1 } }],
                    },
                  ],
                  openStart: 1,
                },
                insert: 1,
                structure: true,
                debug: {
                  inverseFrom: 20,
                  inverseTo: 73,
                  inverseGapFrom: 21,
                  inverseGapTo: 73,
                  gapFromOffset: 1,
                  gapToOffset: 0,
                  fromOffset: 1,
                  toOffset: 0,
                },
              },
            },
            testBuilders.listItem(
              testBuilders.paragraph("Item 2.1"),
              testBuilders.orderedList(
                testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
                testBuilders.structure(
                  {
                    id: 1,
                    type: "structure",
                    data: {
                      value: "gapFrom",
                      position: "start",
                      fromOffset: 1,
                      type: "replaceAround",
                      slice: { content: [{ type: "listItem" }], openStart: 1 },
                      insert: 1,
                      structure: true,
                      debug: {
                        inverseFrom: 46,
                        inverseTo: 73,
                        inverseGapFrom: 47,
                        inverseGapTo: 71,
                        gapFromOffset: 1,
                        gapToOffset: 2,
                        fromOffset: 1,
                        toOffset: 2,
                      },
                    },
                  },
                  testBuilders.structure(
                    {
                      id: 3,
                      type: "structure",
                      data: {
                        value: "from",
                        position: "start",
                        type: "replace",
                        slice: {
                          content: [
                            { type: "orderedList", attrs: { order: 1 } },
                            {
                              type: "orderedList",
                              attrs: { order: 1 },
                              marks: [
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
                                        content: [{ type: "listItem" }],
                                        openStart: 1,
                                      },
                                      insert: 1,
                                      structure: true,
                                      debug: {
                                        inverseFrom: 46,
                                        inverseTo: 73,
                                        inverseGapFrom: 47,
                                        inverseGapTo: 71,
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
                          openStart: 1,
                          openEnd: 1,
                        },
                        structure: true,
                        debug: {
                          inverseFrom: 45,
                          inverseTo: 45,
                        },
                      },
                    },
                    testBuilders.structure(
                      {
                        id: 3,
                        type: "structure",
                        data: {
                          value: "to",
                          position: "start",
                          type: "replace",
                          slice: {
                            content: [
                              { type: "orderedList", attrs: { order: 1 } },
                              {
                                type: "orderedList",
                                attrs: { order: 1 },
                                marks: [
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
                                          content: [{ type: "listItem" }],
                                          openStart: 1,
                                        },
                                        insert: 1,
                                        structure: true,
                                        debug: {
                                          inverseFrom: 46,
                                          inverseTo: 73,
                                          inverseGapFrom: 47,
                                          inverseGapTo: 71,
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
                            openStart: 1,
                            openEnd: 1,
                          },
                          structure: true,
                          debug: {
                            inverseFrom: 45,
                            inverseTo: 45,
                          },
                        },
                      },
                      testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
                    ),
                  ),
                ),
                testBuilders.structure(
                  {
                    id: 1,
                    type: "structure",
                    data: {
                      value: "gapTo",
                      position: "end",
                      toOffset: 2,
                      type: "replaceAround",
                      slice: { content: [{ type: "listItem" }], openStart: 1 },
                      insert: 1,
                      structure: true,
                      debug: {
                        inverseFrom: 46,
                        inverseTo: 73,
                        inverseGapFrom: 47,
                        inverseGapTo: 71,
                        gapFromOffset: 1,
                        gapToOffset: 2,
                        fromOffset: 1,
                        toOffset: 2,
                      },
                    },
                  },
                  testBuilders.listItem(testBuilders.paragraph("Item 2.4")),
                ),
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

export const steps = [
  {
    stepType: "replaceAround",
    from: 46,
    to: 71,
    gapFrom: 47,
    gapTo: 71,
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
  {
    stepType: "replaceAround",
    from: 20,
    to: 75,
    gapFrom: 21,
    gapTo: 73,
    insert: 1,
    slice: {
      content: [{ type: "listItem" }],
      openStart: 1,
    },
    structure: true,
  },
  {
    stepType: "replace",
    from: 45,
    to: 47,
    structure: true,
  },
];

export const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 46,
    to: 73,
    gapFrom: 47,
    gapTo: 71,
    insert: 1,
    slice: {
      content: [{ type: "listItem" }],
      openStart: 1,
    },
    structure: true,
  },
  {
    stepType: "replaceAround",
    from: 20,
    to: 73,
    gapFrom: 21,
    gapTo: 73,
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
  {
    stepType: "replace",
    from: 45,
    to: 45,
    slice: {
      content: [
        { type: "orderedList", attrs: { order: 1 } },
        { type: "orderedList", attrs: { order: 1 } },
      ],
      openStart: 1,
      openEnd: 1,
    },
  },
];
