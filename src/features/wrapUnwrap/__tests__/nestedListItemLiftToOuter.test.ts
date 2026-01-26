import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
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

const finalState = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 2.2")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2.3"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.4")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5")),
  ),
);

const finalStateWithMarks = testBuilders.doc(
  testBuilders.orderedList(
    testBuilders.listItem(testBuilders.paragraph("Item 1")),
    testBuilders.listItem(
      testBuilders.paragraph("Item 2"),
      testBuilders.orderedList(
        testBuilders.structure(
          {
            id: 2,
            type: "structure",
            data: {
              value: "from",
              position: "end",
              gapFromOffset: 2,
              type: "replaceAround",
              slice: {
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "orderedList", attrs: { order: 1 } }],
                  },
                ],
                openStart: 2,
              },
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 33,
                inverseTo: 73,
                inverseGapFrom: 35,
                inverseGapTo: 73,
                gapFromOffset: 2,
                gapToOffset: 0,
                fromOffset: 2,
                toOffset: 0,
              },
            },
          },
          testBuilders.listItem(testBuilders.paragraph("Item 2.1"))
        )
      )
    ),
    testBuilders.structure(
      {
        id: 2,
        type: "structure",
        data: {
          value: "gapFrom",
          position: "start",
          fromOffset: 2,
          type: "replaceAround",
          slice: {
            content: [
              {
                type: "listItem",
                content: [{ type: "orderedList", attrs: { order: 1 } }],
              },
            ],
            openStart: 2,
          },
          insert: 0,
          structure: true,
          debug: {
            inverseFrom: 33,
            inverseTo: 73,
            inverseGapFrom: 35,
            inverseGapTo: 73,
            gapFromOffset: 2,
            gapToOffset: 0,
            fromOffset: 2,
            toOffset: 0,
          },
        },
      },
      testBuilders.listItem(testBuilders.paragraph("Item 2.2"))
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
            inverseFrom: 56,
            inverseTo: 71,
            inverseGapFrom: 57,
            inverseGapTo: 69,
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
              openStart: 2,
            },
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 33,
              inverseTo: 73,
              inverseGapFrom: 35,
              inverseGapTo: 73,
              gapFromOffset: 2,
              gapToOffset: 0,
              fromOffset: 2,
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
                openStart: 2,
              },
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 33,
                inverseTo: 73,
                inverseGapFrom: 35,
                inverseGapTo: 73,
                gapFromOffset: 2,
                gapToOffset: 0,
                fromOffset: 2,
                toOffset: 0,
              },
            },
          },
          testBuilders.listItem(
            testBuilders.paragraph("Item 2.3"),
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
                    inverseFrom: 56,
                    inverseTo: 71,
                    inverseGapFrom: 57,
                    inverseGapTo: 69,
                    gapFromOffset: 1,
                    gapToOffset: 2,
                    fromOffset: 1,
                    toOffset: 2,
                  },
                },
              },
              testBuilders.orderedList(
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
                        inverseFrom: 56,
                        inverseTo: 71,
                        inverseGapFrom: 57,
                        inverseGapTo: 69,
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
                        position: "end",
                        toOffset: 2,
                        type: "replaceAround",
                        slice: { content: [{ type: "listItem" }], openStart: 1 },
                        insert: 1,
                        structure: true,
                        debug: {
                          inverseFrom: 56,
                          inverseTo: 71,
                          inverseGapFrom: 57,
                          inverseGapTo: 69,
                          gapFromOffset: 1,
                          gapToOffset: 2,
                          fromOffset: 1,
                          toOffset: 2,
                        },
                      },
                    },
                    testBuilders.listItem(testBuilders.paragraph("Item 2.4"))
                  )
                )
              )
            )
          )
        )
      )
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
    testBuilders.listItem(testBuilders.paragraph("Item 4")),
    testBuilders.listItem(testBuilders.paragraph("Item 5"))
  )
);

const steps = [
  {
    stepType: "replaceAround",
    from: 56,
    to: 69,
    gapFrom: 57,
    gapTo: 69,
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
    from: 33,
    to: 73,
    gapFrom: 33,
    gapTo: 71,
    insert: 2,
    slice: {
      content: [
        {
          type: "listItem",
          content: [{ type: "orderedList", attrs: { order: 1 } }],
        },
      ],
      openStart: 2,
    },
    structure: true,
  },
];

const inverseSteps = [
  {
    stepType: "replaceAround",
    from: 56,
    to: 71,
    gapFrom: 57,
    gapTo: 69,
    insert: 1,
    slice: {
      content: [{ type: "listItem" }],
      openStart: 1,
    },
    structure: true,
  },
  {
    stepType: "replaceAround",
    from: 33,
    to: 73,
    gapFrom: 35,
    gapTo: 73,
    insert: 0,
    slice: {
      content: [
        {
          type: "listItem",
          content: [{ type: "orderedList", attrs: { order: 1 } }],
        },
      ],
      openStart: 2,
    },
    structure: true,
  },
];

describe("lift nested list item to outer list | [ReplaceAroundStep, ReplaceAroundStep]", () => {
  it("should lift nested list item to outer list by applying 2 ReplaceAround steps", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the lift by applying 2 inverse ReplaceAround steps", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the lift by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(2),
    );
  });
});
