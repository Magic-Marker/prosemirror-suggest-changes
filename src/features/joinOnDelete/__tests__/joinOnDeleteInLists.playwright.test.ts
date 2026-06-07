import { expect, test } from "../../../__tests__/playwrightBaseTest.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { eq } from "prosemirror-test-builder";

test.describe("Join on Delete E2E - Real Keyboard Events", () => {
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

    test("should revert after pressing backspace multiple times at the start of list items, joining them into one", async ({
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

    test("should automatically revert a later structure suggestion when rejecting a join restores an older dependent structure suggestion", async ({
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

      // revert only the join mark
      await editorPage.revertSuggestion(2);

      // what should happen is that join mark reversal will deserialize an old structure mark (id=1)
      // that will also be automatically reverted
      // but structure mark reversal will detect that later structure mark (id=3) needs to be reverted as well
      // so both structure moves and the selected join are reverted, returning to the original document.”

      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(initialDoc);
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });

    test("should revert after pressing backspace multiple times across multiple list items, deleting content and joining them into one", async ({
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

      // use backspace to delete "Item 4" and press it one more time to join with the above list item Item 3
      await editorPage.pressKeyMultiple("Backspace", "Item 4".length);
      await editorPage.pressKey("Backspace");

      // we should have 2 deletion marks (one "anchor", one deleted "Item 4") and one structure mark
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

      // join paragraph Item 4 with paragraph Item 3 in one list item
      await editorPage.pressKey("Backspace");

      // we should have 2 deletion marks (one join marker, one deleted "Item 4") and no structure mark (swallowed by the join marker)
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

      // use backspace to delete "Item 3" and press it one more time to join with the above list item Item 2
      await editorPage.pressKeyMultiple("Backspace", "Item 3".length);
      await editorPage.pressKey("Backspace");

      // we should have 4 deletion marks (one "anchor", one join marker, two deletions "Item 4" and "Item 3")
      // and one structure mark (the move of paragraph Item 3 into a list item Item 2)
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(4);

      // join paragraph Item 3 with paragraph Item 2 in one list item
      await editorPage.pressKey("Backspace");

      // we should have 4 deletion marks (two join markers, two deletions "Item 4" and "Item 3")
      // and no structure mark (swallowed by the join marker)
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(4);

      // use backspace to delete "Item 2"
      await editorPage.pressKeyMultiple("Backspace", "Item 2".length);

      // we should have 6 deletion marks (one "anchor", two join markers, three deletions "Item 4", "Item 3" and "Item 2")
      // and no structure marks
      // (all structure marks were swallowed by the join markers and exist in their metadata)
      expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(6);

      await editorPage.revertAll();

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc(initialDoc);
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });
  });
});
