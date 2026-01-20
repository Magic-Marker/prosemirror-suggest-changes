import { test, expect } from "../../../__tests__/playwrightBaseTest.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { ZWSP } from "../../../constants.js";
import initialDoc from "./listWithJoinsAndStructureMarks.doc.json" with { type: "json" };

/**
 * This initial document reproduces a state in the TipTap editor after joining multiple list items with backspace
 * Backspace #1 - lift a paragraph out of the list, Backspace #2 - join the paragraph with the above list item,
 * place the cursor at the start, repeat
 * Re-creating this state from scratch here is very verbose because the plugin doesn't use tiptap, so you would have to have multiple serialized steps to replay
 * So instead we have a document with all the marks already in place, and we test their reversal
 */

test.describe("List with joins and structure marks", () => {
  test("should revert all joins one by one and get back to a clean list", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, initialDoc);

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await expect(editorPage.getParagraphs()).toHaveCount(3);
    await expect(editorPage.getListItems()).toHaveCount(2);
    await expect(editorPage.getParagraphAt(0)).toHaveText("Item 1");
    await expect(editorPage.getParagraphAt(1)).toHaveText(
      `Item 2${ZWSP}Item 3${ZWSP}Item 4`,
    );
    // two join marks, 0 structure marks, but there are serialized structure marks in the join metadata
    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    await editorPage.revertSuggestion(
      "sg_01kty2whj7fn2s9bbvr6erc1sx" as unknown as number,
    );

    await editorPage.revertSuggestion(
      "sg_01kty2w4zgfbqrebnczmtd5qvv" as unknown as number,
    );

    await expect(editorPage.getParagraphs()).toHaveCount(5);
    await expect(editorPage.getListItems()).toHaveCount(4);
    await expect(editorPage.getParagraphAt(0)).toHaveText("Item 1");
    await expect(editorPage.getParagraphAt(1)).toHaveText("Item 2");
    await expect(editorPage.getParagraphAt(2)).toHaveText("Item 3");
    await expect(editorPage.getParagraphAt(3)).toHaveText("Item 4");

    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
  });

  test("should revert all joins one by one in reverse order and get back to a clean list", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, initialDoc);

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await expect(editorPage.getParagraphs()).toHaveCount(3);
    await expect(editorPage.getListItems()).toHaveCount(2);
    await expect(editorPage.getParagraphAt(0)).toHaveText("Item 1");
    await expect(editorPage.getParagraphAt(1)).toHaveText(
      `Item 2${ZWSP}Item 3${ZWSP}Item 4`,
    );
    // two join marks, 0 structure marks, but there are serialized structure marks in the join metadata
    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    await editorPage.revertSuggestion(
      "sg_01kty2w4zgfbqrebnczmtd5qvv" as unknown as number,
    );

    await editorPage.revertSuggestion(
      "sg_01kty2whj7fn2s9bbvr6erc1sx" as unknown as number,
    );

    await expect(editorPage.getParagraphs()).toHaveCount(5);
    await expect(editorPage.getListItems()).toHaveCount(4);
    await expect(editorPage.getParagraphAt(0)).toHaveText("Item 1");
    await expect(editorPage.getParagraphAt(1)).toHaveText("Item 2");
    await expect(editorPage.getParagraphAt(2)).toHaveText("Item 3");
    await expect(editorPage.getParagraphAt(3)).toHaveText("Item 4");

    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
  });

  test("should revert all joins at once and get back to a clean list", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, initialDoc);

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await expect(editorPage.getParagraphs()).toHaveCount(3);
    await expect(editorPage.getListItems()).toHaveCount(2);
    await expect(editorPage.getParagraphAt(0)).toHaveText("Item 1");
    await expect(editorPage.getParagraphAt(1)).toHaveText(
      `Item 2${ZWSP}Item 3${ZWSP}Item 4`,
    );
    // two join marks, 0 structure marks, but there are serialized structure marks in the join metadata
    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    await editorPage.revertAll();

    await expect(editorPage.getParagraphs()).toHaveCount(5);
    await expect(editorPage.getListItems()).toHaveCount(4);
    await expect(editorPage.getParagraphAt(0)).toHaveText("Item 1");
    await expect(editorPage.getParagraphAt(1)).toHaveText("Item 2");
    await expect(editorPage.getParagraphAt(2)).toHaveText("Item 3");
    await expect(editorPage.getParagraphAt(3)).toHaveText("Item 4");

    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
  });
});
