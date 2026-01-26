import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import { applySteps, assertDocumentChanged } from "./testUtils.js";

const initialState = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(
        testBuilders.paragraph("Hello"),
        testBuilders.paragraph("World"),
      ),
    ),
  ),
);

const finalState = testBuilders.doc(
  testBuilders.blockquote(
    testBuilders.blockquote(
      testBuilders.blockquote(testBuilders.paragraph("Hello")),
    ),
  ),
  testBuilders.paragraph("World"),
);

const finalStateWithMarks = testBuilders.doc(
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

const steps = [
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

const inverseSteps = [
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

describe("lift one node through all levels in a multi-level wrap | [ReplaceAroundStep]", () => {
  it("should lift one paragraph out of all blockquotes by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialState, finalState, applySteps(steps));
  });

  it("should revert the lift by applying 1 inverse ReplaceAround step", () => {
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
      revertStructureSuggestion(1),
    );
  });
});
