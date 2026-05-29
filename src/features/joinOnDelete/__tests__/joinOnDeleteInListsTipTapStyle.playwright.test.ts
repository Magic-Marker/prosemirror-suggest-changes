import type { Page } from "@playwright/test";
import { expect, test } from "../../../__tests__/playwrightBaseTest.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { ZWSP } from "../../../constants.js";
import { eq } from "prosemirror-test-builder";

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

async function dispatchTipTapDepthTwoJoinStep(page: Page) {
  await page.evaluate((step) => {
    window.pmEditor.dispatchTransactionWithSteps([step]);
  }, TIPTAP_DEPTH_TWO_JOIN_STEP);
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
});
