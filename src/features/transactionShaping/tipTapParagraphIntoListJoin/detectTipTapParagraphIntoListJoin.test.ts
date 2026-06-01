import { EditorState } from "prosemirror-state";
import { Step } from "prosemirror-transform";
import { describe, expect, it } from "vitest";
import { createSchema } from "../../../testing/e2eTestSchema.js";
import { detectTipTapParagraphIntoListJoin } from "./detectTipTapParagraphIntoListJoin.js";

const schema = createSchema();

// when joining a paragraph into a list above it,
// TipTap List extension overrides the default ProseMirror behavior
// by default, ProseMirror puts the paragraph to the end of list as a separate list item
// TipTap instead joins the paragraph with the paragraph of the last list item
const TIPTAP_PARAGRAPH_INTO_LIST_STEPS = [
  // first step deletes the paragraph that we're joining
  { stepType: "replace", from: 42, to: 60 },
  // second step inserts that paragraph into the last list item
  {
    stepType: "replace",
    from: 40,
    to: 40,
    slice: {
      content: [
        {
          type: "paragraph",
          attrs: { id: "node-9", textAlign: null },
          content: [{ type: "text", text: "sample paragraph" }],
        },
      ],
    },
  },
  // third step joins the two paragraphs in the list item
  { stepType: "replace", from: 39, to: 41, structure: true },
];

const TIPTAP_PARAGRAPH_INTO_LIST_DOC = {
  type: "doc",
  content: [
    {
      type: "orderedList",
      attrs: {
        order: 1,
        id: "node-0",
      },
      content: [
        {
          type: "listItem",
          attrs: {
            id: "node-1",
          },
          content: [
            {
              type: "paragraph",
              attrs: {
                id: "node-2",
              },
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
          attrs: {
            id: "node-3",
          },
          content: [
            {
              type: "paragraph",
              attrs: {
                id: "node-4",
              },
              content: [
                {
                  type: "text",
                  text: "Item 2",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          attrs: {
            id: "node-5",
          },
          content: [
            {
              type: "paragraph",
              attrs: {
                id: "node-6",
              },
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
          attrs: {
            id: "node-7",
          },
          content: [
            {
              type: "paragraph",
              attrs: {
                id: "node-8",
              },
              content: [
                {
                  type: "text",
                  text: "Item 4",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      attrs: {
        id: "node-9",
      },
      content: [
        {
          type: "text",
          text: "sample paragraph",
        },
      ],
    },
  ],
};

describe("detectTipTapParagraphIntoListJoin", () => {
  it("detects TipTap's three-step paragraph-into-list join shape", () => {
    const doc = schema.nodeFromJSON(TIPTAP_PARAGRAPH_INTO_LIST_DOC);
    const state = EditorState.create({ doc });
    const transaction = state.tr;

    TIPTAP_PARAGRAPH_INTO_LIST_STEPS.forEach((stepJSON) => {
      transaction.step(Step.fromJSON(schema, stepJSON));
    });

    const shape = detectTipTapParagraphIntoListJoin(transaction);

    expect(shape).toMatchObject({
      type: "tipTapParagraphIntoListJoin",
      deleteStep: {
        from: 42,
        to: 60,
      },
      insertStep: {
        from: 40,
        to: 40,
      },
      joinStep: {
        from: 39,
        to: 41,
      },
      movedNode: {
        attrs: {
          id: "node-9",
        },
      },
    });
    expect(shape?.movedNode.textContent).toBe("sample paragraph");
  });
});
