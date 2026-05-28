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

  test.describe("Lists: join nodes inside lists and list items", () => {
    test("should revert document to original state after joining two paragraphs inside a list item and then splitting them again", async ({
      page,
    }) => {
      const { initialState } = await setupDocFromJSON(page, {
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
                    content: [{ type: "text", text: "Hello" }],
                  },
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "World" }],
                  },
                ],
              },
            ],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      let state = await page.evaluate(() => window.pmEditor.getState());
      expect(state.marks.length).toBe(0);
      expect(state.textContent).toBe(initialState.textContent);

      await page.keyboard.press("Home");
      await page.waitForTimeout(50);

      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);

      state = await page.evaluate(() => window.pmEditor.getState());
      expect(state.marks.length).toBe(1);
      expect(state.textContent).not.toBe(initialState.textContent);

      await page.keyboard.down("Shift");
      await page.waitForTimeout(50);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(50);
      await page.keyboard.up("Shift");
      await page.waitForTimeout(50);

      state = await page.evaluate(() => window.pmEditor.getState());
      expect(state.marks.length).toBe(0);
      expect(state.textContent).toBe(initialState.textContent);
      expect(
        state.cursorFrom,
        "Cursor is not at the start of the second node after the split",
      ).toBe(10);
      expect(
        state.cursorTo,
        "Cursor is not at the start of the second node after the split",
      ).toBe(10);
    });

    test("should revert after joining multiple list items one after another", async ({
      page,
      deletionMarksVisibility,
    }) => {
      const { initialDoc } = await setupDocFromJSON(page, {
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
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Item 4" }],
                  },
                ],
              },
            ],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      const editorPage = new EditorPage(page, deletionMarksVisibility);

      // move to start of list item Item 4
      await editorPage.pressKey("Home");
      // join list item Item 4 with list item Item 3,
      // paragraph Item 4 will be placed next to paragraph Item 3 (2 paragraphs in one list item)
      await editorPage.pressKey("Backspace");

      // we should have 1 structure mark that represents a move of paragraph Item 4 into a list item Item 3
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);

      // join paragraph Item 4 with the paragraph Item 3
      // paragraph Item 4 will be joined with paragraph Item 3 so the list item will have one paragraph Item 3Item 4
      await editorPage.pressKey("Backspace");

      // we should have a single deletion mark (join marker) that holds the information about the structure mark in it's rightNode data
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

      // move to start of list item Item 3Item 4
      await editorPage.pressKey("Home");
      // join list item Item 3Item 4 with list item Item 2,
      // paragraph Item 3Item 4 will be placed next to paragraph Item 2 (2 paragraphs in one list item)
      await editorPage.pressKey("Backspace");

      // we should have 1 structure mark that represents a move of paragraph Item 3Item 4 into a list item Item 2
      // and one deletion mark (join marker) from the previous step
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

      // join paragraph Item 3Item 4 with the paragraph Item 2
      // paragraph Item 3Item 4 will be joined with paragraph Item 2 so the list item will have one paragraph Item 2Item 3Item 4
      await editorPage.pressKey("Backspace");

      // we should have two deletion marks (join markers) that hold information about the structure marks in its rightNode data
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

      // the bug is as follows
      // on revertAll, first we revert all structure marks
      // but no structure marks are currently present
      // so we revert all normal marks (join markers)
      // first we revert the last join
      // it reverts into left and right node, where right node holds a restored structure mark from the join marker metadata
      // then we revert the second to last join
      // it also reverts into left and right node
      // however at the moment of revert, the node on the right holds a structure marks
      // and the join metadata of the left node doesn't have any marks (because when this join marker was created, left node didn't have any marks)
      // so when we revert the second to last join marker, node on the left loses its structure mark, so revert to initial state becomes impossible

      await editorPage.revertAll();

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(initialDoc);
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });
  });
});
