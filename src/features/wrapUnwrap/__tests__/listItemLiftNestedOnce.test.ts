import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { assertDocumentChanged, applySteps } from "./testUtils.js";

const initialState = testBuilders.doc(
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
    testBuilders.listItem(
      testBuilders.paragraph("Item 2.2"),
      testBuilders.orderedList(
        testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
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
            },
          },
          testBuilders.listItem(testBuilders.paragraph("Item 2.1")),
        ),
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
          slice: { content: [{ type: "listItem" }], openStart: 1 },
          insert: 1,
          structure: true,
        },
      },
      testBuilders.structure(
        {
          id: 2,
          type: "structure",
          data: {
            value: "gapFrom",
            position: "start",
            fromOffset: 2,
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
              },
            },
            testBuilders.listItem(
              testBuilders.paragraph("Item 2.2"),
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "from",
                    position: "start",
                    gapFromOffset: 1,
                    slice: {
                      content: [{ type: "listItem" }],
                      openStart: 1,
                    },
                    insert: 1,
                    structure: true,
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
                        slice: {
                          content: [{ type: "listItem" }],
                          openStart: 1,
                        },
                        insert: 1,
                        structure: true,
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
                          slice: {
                            content: [{ type: "listItem" }],
                            openStart: 1,
                          },
                          insert: 1,
                          structure: true,
                        },
                      },
                      testBuilders.listItem(testBuilders.paragraph("Item 2.3")),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
    testBuilders.listItem(testBuilders.paragraph("Item 3")),
  ),
);

const steps = [
  // the first step sinks Item 2.3
  // so the nested list changes from this
  /*
        ...
            1. Item 2.1
            2. Item 2.2
            3. Item 2.3
        ...
        */
  // to this
  /*
        ...
            1. Item 2.1
            2. Item 2.2
                1. Item 2.3
        ...
        */
  {
    stepType: "replaceAround",
    from: 44,
    to: 57,
    gapFrom: 45,
    gapTo: 57,
    insert: 1,
    slice: {
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "orderedList",
              attrs: {
                order: 1,
              },
            },
          ],
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
  // the second step lifts Item 2.2
  // so the outer list changes from this
  /*
        1. Item 1
        2. Item 2
            1. Item 2.1
            2. Item 2.2
                1. Item 2.3 
        3. Item 3
        */
  // to this
  /*
        1. Item 1
        2. Item 2
            1. Item 2.1
        3. Item 2.2
            1. Item 2.3 
        4. Item 3
        */
  {
    stepType: "replaceAround",
    from: 33,
    to: 61,
    gapFrom: 33,
    gapTo: 59,
    insert: 2,
    slice: {
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "orderedList",
              attrs: {
                order: 1,
              },
            },
          ],
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
    from: 44,
    to: 59,
    gapFrom: 45,
    gapTo: 57,
    insert: 1,
    slice: {
      content: [
        {
          type: "listItem",
        },
      ],
      openStart: 1,
    },
    structure: true,
  },
  {
    stepType: "replaceAround",
    from: 33,
    to: 61,
    gapFrom: 35,
    gapTo: 61,
    insert: 0,
    slice: {
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "orderedList",
              attrs: {
                order: 1,
              },
            },
          ],
        },
      ],
      openStart: 2,
    },
    structure: true,
  },
];

describe("single nested list item lift | [ReplaceAroundStep, ReplaceAroundStep]", () => {
  it("should lift a nested list item once by directly applying 2 ReplaceAround steps", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the lift of a nested list item by directly applying 2 inverse ReplaceAround steps", () => {
    assertDocumentChanged(
      finalState,
      initialState,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the lift of a nested list item by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalStateWithMarks,
      initialState,
      revertStructureSuggestion(1),
    );
  });
});
