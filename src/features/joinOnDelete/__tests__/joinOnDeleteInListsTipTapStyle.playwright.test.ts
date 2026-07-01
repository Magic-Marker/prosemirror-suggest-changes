import type { Page } from "@playwright/test";
import { expect, test } from "../../../__tests__/playwrightBaseTest.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { ZWSP } from "../../../constants.js";
import { eq } from "prosemirror-test-builder";
import { isJoinMarkObject } from "../types.js";

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

const TIPTAP_PARAGRAPH_INTO_LIST_SELECTION = {
  type: "text",
  anchor: 39,
  head: 39,
};

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

// same situation as above, but the paragraph below and it's content were added with track changes on,
// so the paragraph has a structure mark, and it's content is an insertion mark
const TIPTAP_NEW_PARAGRAPH_INTO_LIST_STEPS = [
  { stepType: "replace", from: 42, to: 60 },
  {
    stepType: "replace",
    from: 40,
    to: 40,
    slice: {
      content: [
        {
          type: "paragraph",
          attrs: { id: "node-10", textAlign: null },
          content: [
            {
              type: "text",
              marks: [{ type: "insertion", attrs: { id: "2" } }],
              text: "sample paragraph",
            },
          ],
          marks: [
            {
              type: "structure",
              attrs: { id: "1", data: { op: { op: "add" } } },
            },
          ],
        },
      ],
    },
  },
  { stepType: "replace", from: 39, to: 41, structure: true },
];

const TIPTAP_NEW_PARAGRAPH_INTO_LIST_SELECTION = {
  type: "text",
  anchor: 39,
  head: 39,
};

const TIPTAP_NEW_PARAGRAPH_INTO_LIST_DOC = {
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
  ],
};

async function dispatchTipTapDepthTwoJoinStep(page: Page) {
  await page.evaluate((step) => {
    window.pmEditor.dispatchTransactionWithSteps([step]);
  }, TIPTAP_DEPTH_TWO_JOIN_STEP);
}

async function dispatchTipTapParagraphIntoListStep(page: Page) {
  await page.evaluate(
    ({ steps, selection }) => {
      window.pmEditor.dispatchTransactionWithSteps(steps, selection);
    },
    {
      steps: TIPTAP_PARAGRAPH_INTO_LIST_STEPS,
      selection: TIPTAP_PARAGRAPH_INTO_LIST_SELECTION,
    },
  );
}

async function dispatchTipTapNewParagraphIntoListStep(page: Page) {
  await page.evaluate(
    ({ steps, selection }) => {
      window.pmEditor.dispatchTransactionWithSteps(steps, selection);
    },
    {
      steps: TIPTAP_NEW_PARAGRAPH_INTO_LIST_STEPS,
      selection: TIPTAP_NEW_PARAGRAPH_INTO_LIST_SELECTION,
    },
  );
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

      // disable suggestions
      await page.evaluate(() => {
        window.pmEditor.setSuggestChangesEnabled(false);
      });

      const editorPage = new EditorPage(page);

      // 4 list items, one single paragraph
      await expect(editorPage.editor.locator("p")).toHaveCount(5);

      // join the paragraph into the last list item
      await dispatchTipTapParagraphIntoListStep(page);

      // expect one less paragraph
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
    });

    test("joins the paragraph into the last list item, inserts text adjacent to the join, and reverts all cleanly", async ({
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

      // verify that the cursor is at the correct spot after the join (should be right at the join point)
      await editorPage.insertText("FOO");
      await expect(editorPage.editor.locator("p").nth(3)).toHaveText(
        `Item 4${ZWSP}FOOsample paragraph`,
      );

      // revert all
      await editorPage.revertAll();

      // verify reverted
      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(
          TIPTAP_PARAGRAPH_INTO_LIST_DOC,
        );
      expect(eq(currentDoc, expectedDoc)).toBe(true);

      // verify cursor placement after the revert
      await editorPage.insertText("BAR");
      await expect(editorPage.editor.locator("p").nth(4)).toHaveText(
        "BARsample paragraph",
      );
    });

    test("joins the paragraph into the last list item, inserts text adjacent to the join, and reverts only the join cleanly", async ({
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

      // verify that the cursor is at the correct spot after the join (should be right at the join point)
      await editorPage.insertText("FOO");
      await expect(editorPage.editor.locator("p").nth(3)).toHaveText(
        `Item 4${ZWSP}FOOsample paragraph`,
      );

      // revert join (will revert the emerged structure suggestion too and the insertion)
      // insertion is reverted because it is adjacent to the join deletion mark and shares it's suggestion ID
      await editorPage.revertSuggestion(1);

      // verify reverted
      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(
          TIPTAP_PARAGRAPH_INTO_LIST_DOC,
        );
      expect(eq(currentDoc, expectedDoc)).toBe(true);

      // verify cursor placement after the revert
      await editorPage.insertText("BAR");
      await expect(editorPage.editor.locator("p").nth(4)).toHaveText(
        "BARsample paragraph",
      );
    });

    test("joins the paragraph into the last list item, inserts text non adjacent to the join, and reverts only the join cleanly", async ({
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

      // move the cursor one character to the left so the insertion is not adjacent to the join,
      // and doesn't share it's suggestion ID
      await editorPage.pressKey("ArrowLeft");

      // verify that the cursor is at the correct spot after the join (should be here: "Item |4<join>sample paragraph")
      await editorPage.insertText("FOO");
      await expect(editorPage.editor.locator("p").nth(3)).toHaveText(
        `Item FOO4${ZWSP}sample paragraph`,
      );

      // revert join (will revert the emerged structure suggestion too but no the insertion)
      // the insertion is not reverted because it is not adjacent to the join deletion mark and doesn't share its suggestion ID
      await editorPage.revertSuggestion(1);

      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);

      // verify not reverted
      const expectedNotReverted = await editorPage.getCurrentAndExpectedDoc(
        TIPTAP_PARAGRAPH_INTO_LIST_DOC,
      );
      expect(
        eq(expectedNotReverted.currentDoc, expectedNotReverted.expectedDoc),
      ).not.toBe(true);

      // verify fourth list item content
      await expect(editorPage.editor.locator("li").nth(3)).toHaveText(
        "Item FOO4",
      );

      // revert the insertion
      await editorPage.revertSuggestion(2);

      // verify reverted
      const expectedReverted = await editorPage.getCurrentAndExpectedDoc(
        TIPTAP_PARAGRAPH_INTO_LIST_DOC,
      );
      expect(
        eq(expectedReverted.currentDoc, expectedReverted.expectedDoc),
      ).toBe(true);
    });

    test("joins the paragraph into the last list item and reverts cleanly - revert all", async ({
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

    test("joins the paragraph into the last list item and reverts cleanly - revert one", async ({
      page,
    }) => {
      await setupDocFromJSON(page, TIPTAP_PARAGRAPH_INTO_LIST_DOC);

      const editorPage = new EditorPage(page);

      // join the paragraph into the last list item
      await dispatchTipTapParagraphIntoListStep(page);

      const marks = await editorPage.getProseMirrorMarksJSON();
      const joinMarks = marks.filter(isJoinMarkObject);
      expect(joinMarks).toHaveLength(1);

      await editorPage.revertSuggestion(1);

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(
          TIPTAP_PARAGRAPH_INTO_LIST_DOC,
        );
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });

    test("joins the paragraph into the last list item and applies cleanly", async ({
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

  test.describe("TipTap-style new paragraph into list join", () => {
    test("joins the new paragraph into the last list item when suggestions are disabled", async ({
      page,
    }) => {
      await setupDocFromJSON(page, TIPTAP_NEW_PARAGRAPH_INTO_LIST_DOC);

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      const editorPage = new EditorPage(page);
      // the document already uses ids 0-8
      await editorPage.setNextNodeId(9);

      await expect(editorPage.editor.locator("li")).toHaveCount(4);
      await expect(editorPage.editor.locator("p")).toHaveCount(4);
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);

      // from the last list item, press Enter to create a new list item
      await editorPage.pressKey("Enter");
      await expect(editorPage.editor.locator("li")).toHaveCount(5);
      await expect(editorPage.editor.locator("p")).toHaveCount(5);
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);

      // press Enter again, to turn the newly added list item into a root-level paragraph
      await editorPage.pressKey("Enter");
      await expect(editorPage.editor.locator("li")).toHaveCount(4);
      await expect(editorPage.editor.locator("p")).toHaveCount(5);
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);

      // enter text into the paragraph
      await editorPage.insertText("sample paragraph");
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);

      // disable suggestions
      await page.evaluate(() => {
        window.pmEditor.setSuggestChangesEnabled(false);
      });

      // put the cursor to the start of the paragraph
      await editorPage.pressKey("Home");

      // join the paragraph into the last list item
      await dispatchTipTapNewParagraphIntoListStep(page);

      // the number of list items unchanged
      await expect(editorPage.editor.locator("li")).toHaveCount(4);
      // expect one less paragraph
      await expect(editorPage.editor.locator("p")).toHaveCount(4);

      // the paragraph is now merged into the list item's first paragraph
      await expect(editorPage.getParagraphAt(3)).toHaveText(
        "Item 4sample paragraph",
      );

      // the structure mark is gone, insertion remains
      // no join mark because track changes off
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);

      // verify cursor position by entering text
      await editorPage.insertText("FOO");
      await expect(editorPage.getParagraphAt(3)).toHaveText(
        "Item 4FOOsample paragraph",
      );
    });

    test("joins the new paragraph into the last list item when suggestions are enabled", async ({
      page,
    }) => {
      await setupDocFromJSON(page, TIPTAP_NEW_PARAGRAPH_INTO_LIST_DOC);

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      const editorPage = new EditorPage(page);
      // the document already uses ids 0-8
      await editorPage.setNextNodeId(9);

      await expect(editorPage.editor.locator("li")).toHaveCount(4);
      await expect(editorPage.editor.locator("p")).toHaveCount(4);
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);

      // from the last list item, press Enter to create a new list item
      await editorPage.pressKey("Enter");
      await expect(editorPage.editor.locator("li")).toHaveCount(5);
      await expect(editorPage.editor.locator("p")).toHaveCount(5);
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);

      // press Enter again, to turn the newly added list item into a root-level paragraph
      await editorPage.pressKey("Enter");
      await expect(editorPage.editor.locator("li")).toHaveCount(4);
      await expect(editorPage.editor.locator("p")).toHaveCount(5);
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);

      // enter text into the paragraph
      await editorPage.insertText("sample paragraph");
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);

      // put the cursor to the start of the paragraph
      await editorPage.pressKey("Home", { waitForSelectionChange: true });

      // join the paragraph into the last list item
      await dispatchTipTapNewParagraphIntoListStep(page);

      // the number of list items unchanged
      await expect(editorPage.editor.locator("li")).toHaveCount(4);
      // expect one less paragraph
      await expect(editorPage.editor.locator("p")).toHaveCount(4);

      // the paragraph is now merged into the list item's first paragraph
      await expect(editorPage.getParagraphAt(3)).toHaveText(
        "Item 4sample paragraph",
      );

      // the structure mark is gone, insertion remains
      // no join mark because the joined paragraph was a provisional structure add
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
      // extract join marks and verify none exist
      const marks = await editorPage.getProseMirrorMarksJSON();
      const joinMarks = marks.filter(isJoinMarkObject);
      expect(joinMarks).toHaveLength(0);

      // verify cursor position by entering text
      await editorPage.insertText("FOO");
      await expect(editorPage.getParagraphAt(3)).toHaveText(
        "Item 4FOOsample paragraph",
      );
    });
  });
});
