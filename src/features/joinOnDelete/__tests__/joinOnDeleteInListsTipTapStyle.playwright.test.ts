import type { Page } from "@playwright/test";
import { expect, test } from "../../../__tests__/playwrightBaseTest.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { ZWSP } from "../../../constants.js";
import { eq } from "prosemirror-test-builder";
import { isJoinMarkObject } from "../types.js";
import {
  isStructureMarkObject,
  type StructureMarkObject,
} from "../../wrapUnwrap/types.js";

// join two list items like TipTap does:
// from the beginning of a list item, backspace joins both the list item and the paragraph inside with the list item above
// so the result of the join is a single list item with a single paragraph that has joined content inside
// (by default, prosemirror joins the list items but not the paragraphs
// so the result is a single list item with two paragraphs)
const TIPTAP_DEPTH_TWO_JOIN_STEP = {
  stepType: "replace",
  from: 19,
  to: 23,
  structure: true,
};

const TIPTAP_DEPTH_TWO_JOIN_DOC = {
  type: "doc",
  content: [
    {
      type: "orderedList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Item 0" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Item 1" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Item 2" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Item 3" }],
            },
          ],
        },
      ],
    },
  ],
};

// in a situation where we have a list, and a paragraph below the list
// and we are at the beginning of the paragraph, and we press backspace
// raw ProseMirror joins the paragraph with the list, but not with the last list item,
// so the paragraph becomes the new last list item
// in raw ProseMirror you get <li><p>LastListItem</p></li><li><p>ParagraphText</p></li>
// TipTap additionally joins the paragraph with the last list item
// so in TipTap you get <li><p>LastListItemParagraphText</p></li>
// this is the steps that are produced by TipTap for the given document in this situation
const TIPTAP_PARAGRAPH_INTO_LIST_STEPS = [
  { stepType: "replace", from: 42, to: 60 },
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

async function dispatchTipTapDepthTwoJoinStep(page: Page) {
  await page.evaluate((step) => {
    window.pmEditor.dispatchTransactionWithSteps([step]);
  }, TIPTAP_DEPTH_TWO_JOIN_STEP);
}

async function dispatchTipTapParagraphIntoListStep(page: Page) {
  await page.evaluate((steps) => {
    window.pmEditor.dispatchTransactionWithSteps(steps);
  }, TIPTAP_PARAGRAPH_INTO_LIST_STEPS);
}

test.describe("Join on Delete E2E - Real Keyboard Events", () => {
  test.describe("TipTap-style multi-depth list item join step", () => {
    test("joins list items when suggestions are disabled", async ({ page }) => {
      await setupDocFromJSON(page, TIPTAP_DEPTH_TWO_JOIN_DOC);
      await page.evaluate(() => {
        window.pmEditor.setSuggestChangesEnabled(false);
      });

      await dispatchTipTapDepthTwoJoinStep(page);

      const editorPage = new EditorPage(page);
      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc({
          type: "doc",
          content: [
            {
              type: "orderedList",
              attrs: {
                id: "node-1",
              },
              content: [
                {
                  type: "listItem",
                  attrs: {
                    id: "node-2",
                  },
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        id: "node-3",
                      },
                      content: [{ type: "text", text: "Item 0" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  attrs: {
                    id: "node-4",
                  },
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        id: "node-5",
                      },
                      content: [{ type: "text", text: "Item 1Item 2" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  attrs: {
                    id: "node-8",
                  },
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        id: "node-9",
                      },
                      content: [{ type: "text", text: "Item 3" }],
                    },
                  ],
                },
              ],
            },
          ],
        });
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });

    test("creates one block join suggestion and reverts it", async ({
      page,
    }) => {
      const { initialDoc } = await setupDocFromJSON(
        page,
        TIPTAP_DEPTH_TWO_JOIN_DOC,
      );

      await dispatchTipTapDepthTwoJoinStep(page);

      const editorPage = new EditorPage(page);
      expect(await editorPage.getListItemCount()).toBe(3);
      expect(await editorPage.getParagraphText(0, [1])).toBe(
        `Item 1${ZWSP}Item 2`,
      );
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

      await editorPage.revertAll();

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(initialDoc);
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });

    test("creates one block join suggestion and applies it", async ({
      page,
    }) => {
      await setupDocFromJSON(page, TIPTAP_DEPTH_TWO_JOIN_DOC);

      await dispatchTipTapDepthTwoJoinStep(page);

      const editorPage = new EditorPage(page);
      expect(await editorPage.getListItemCount()).toBe(3);
      expect(await editorPage.getParagraphText(0, [1])).toBe(
        `Item 1${ZWSP}Item 2`,
      );
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

      await editorPage.applyAll();

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc({
          type: "doc",
          content: [
            {
              type: "orderedList",
              attrs: {
                id: "node-1",
              },
              content: [
                {
                  type: "listItem",
                  attrs: {
                    id: "node-2",
                  },
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        id: "node-3",
                      },
                      content: [{ type: "text", text: "Item 0" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  attrs: {
                    id: "node-4",
                  },
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        id: "node-5",
                      },
                      content: [{ type: "text", text: "Item 1Item 2" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  attrs: {
                    id: "node-8",
                  },
                  content: [
                    {
                      type: "paragraph",
                      attrs: {
                        id: "node-9",
                      },
                      content: [{ type: "text", text: "Item 3" }],
                    },
                  ],
                },
              ],
            },
          ],
        });
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });
  });

  test.describe("TipTap-style paragraph into list join", () => {
    test("joins the paragraph into the last list item when suggestions are disabled", async ({
      page,
    }) => {
      await setupDocFromJSON(page, TIPTAP_PARAGRAPH_INTO_LIST_DOC);
      await page.evaluate(() => {
        window.pmEditor.setSuggestChangesEnabled(false);
      });

      const editorPage = new EditorPage(page);

      // 4 list items, one single paragraph
      await expect(editorPage.editor.locator("p")).toHaveCount(5);

      // join the paragraph into the last list item
      await dispatchTipTapParagraphIntoListStep(page);

      // one less paragraph
      await expect(editorPage.editor.locator("p")).toHaveCount(4);
      const lastListItemParagraphLocator = editorPage.editor
        .locator("ol")
        .first()
        .locator("li")
        .nth(3)
        .locator("p")
        .first();

      // the paragraph is now merged into the list item's first paragraph
      await expect(lastListItemParagraphLocator).toContainText(
        "sample paragraph",
      );
      await expect(lastListItemParagraphLocator).toContainText("Item 4");
    });

    test("joins the paragraph into the last list item when suggestions are enabled", async ({
      page,
      deletionMarksVisibility,
    }) => {
      await setupDocFromJSON(page, TIPTAP_PARAGRAPH_INTO_LIST_DOC);

      const editorPage = new EditorPage(page, deletionMarksVisibility);

      // 4 list items, one single paragraph
      await expect(editorPage.editor.locator("p")).toHaveCount(5);

      // join the paragraph into the last list item
      await dispatchTipTapParagraphIntoListStep(page);

      // one less paragraph
      await expect(editorPage.editor.locator("p")).toHaveCount(4);
      const lastListItemParagraphLocator = editorPage.editor
        .locator("ol")
        .first()
        .locator("li")
        .nth(3)
        .locator("p")
        .first();

      // the paragraph is now merged into the list item's first paragraph
      await expect(lastListItemParagraphLocator).toContainText(
        "sample paragraph",
      );
      await expect(lastListItemParagraphLocator).toContainText("Item 4");

      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

      // extract join mark and verify it exists
      const marks = await editorPage.getProseMirrorMarksJSON();

      const joinMarks = marks.filter(isJoinMarkObject);
      expect(joinMarks).toHaveLength(1);

      // verify that the join mark contains a serialized structure mark on it's right side
      const joinMark = joinMarks[0];
      let structureMarkObject = null as StructureMarkObject | null;
      joinMark?.attrs.data.rightNodes?.forEach((node) => {
        node.marks.forEach((mark) => {
          if (isStructureMarkObject(mark) && structureMarkObject === null) {
            structureMarkObject = mark;
          }
        });
      });
      expect(structureMarkObject).toBeDefined();
      expect(structureMarkObject?.attrs.data.op.op).toBe("move");
    });

    test("joins the paragraph into the last list item when suggestions are enabled and reverts cleanly", async ({
      page,
    }) => {
      await setupDocFromJSON(page, TIPTAP_PARAGRAPH_INTO_LIST_DOC);

      const editorPage = new EditorPage(page);

      // join the paragraph into the last list item
      await dispatchTipTapParagraphIntoListStep(page);

      await editorPage.revertAll();

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(
          TIPTAP_PARAGRAPH_INTO_LIST_DOC,
        );
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });

    test("joins the paragraph into the last list item when suggestions are enabled and applies cleanly", async ({
      page,
    }) => {
      await setupDocFromJSON(page, TIPTAP_PARAGRAPH_INTO_LIST_DOC);

      const editorPage = new EditorPage(page);

      // join the paragraph into the last list item
      await dispatchTipTapParagraphIntoListStep(page);

      await editorPage.applyAll();

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc({
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
                      content: [{ type: "text", text: "Item 1" }],
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
                      content: [{ type: "text", text: "Item 2" }],
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
                      content: [{ type: "text", text: "Item 3" }],
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
                        { type: "text", text: "Item 4sample paragraph" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });
  });
});
