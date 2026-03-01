import { test, expect } from "@playwright/test";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";

test.describe("Join Block Backspace Bug", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto("/test-fixtures/keyboard-test.html");

    // Wait for the editor to be initialized
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await page.waitForFunction(() => window.pmEditor !== undefined);

    // Focus the editor
    await page.locator("#editor .ProseMirror").click();
  });

  test("should join blocks correctly when deleting a selection that spans across a block boundary and a single paragraph above", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 1" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 2" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 3" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 4" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 5" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 6" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 7" }],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);

    // there is also an automatically added empty paragraph on the bottom
    expect(await editorPage.getParagraphCount()).toBe(8);

    // go up to |Paragraph 5
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // hold shift
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    // select Paragraph 4 above
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(50);
    // release shift
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // press backspace
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    // Paragraph 5 should be joined with Paragraph 4
    // and Paragraph 4 contents should be wrapped in a deletion mark because it was fully selected
    expect(await editorPage.getParagraphCount()).toBe(7);
    expect(await editorPage.getParagraphText(3)).toBe(
      `\u200BParagraph 4\u200BParagraph 5`,
    );
    const deletionMarkCount =
      await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(2);
    const insertionMarkCount =
      await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(0);
  });

  test("should join blocks correctly when deleting a selection spans across a block boundary and multiple paragraphs above", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 1" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 2" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 3" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 4" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 5" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 6" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 7" }],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);

    // there is also an automatically added empty paragraph on the bottom
    expect(await editorPage.getParagraphCount()).toBe(8);

    // go up to |Paragraph 5
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // hold shift
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    // select two paragraphs above
    for (let i = 0; i < 2; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }
    // release shift
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // press backspace
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    // all 3 paragraphs should be joined into one,
    // and the contents of the first two paragraphs should become deletion marks
    expect(await editorPage.getParagraphCount()).toBe(6);
    expect(await editorPage.getParagraphText(3)).toBe(
      `\u200BParagraph 3\u200BParagraph 4\u200BParagraph 5`,
    );
    const deletionMarkCount =
      await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(4);
    const insertionMarkCount =
      await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(0);
  });

  test("should join blocks correctly when deleting multiple selections that span multiple paragraphs above", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 1" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 2" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 3" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 4" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 5" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 6" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 7" }],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);

    // there is also an automatically added empty paragraph on the bottom
    expect(await editorPage.getParagraphCount()).toBe(8);

    // go up to |Paragraph 6
    for (let i = 0; i < 2; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // move to Paragraph 6|
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragraph 6".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // hold shift
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    // select Paragraph 6
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragraph 6".length; ++i) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);
    }
    // select one paragraph above
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(50);
    // release shift
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // press backspace
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    // one paragraph should be deleted, one should contain contents of both paragraphs in deletion marks
    expect(await editorPage.getParagraphCount()).toBe(7);
    expect(await editorPage.getParagraphText(4)).toBe(
      `\u200BParagraph 5\u200BParagraph 6`,
    );
    let deletionMarkCount =
      await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(4);
    let insertionMarkCount =
      await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(0);

    // now select two more paragraphs above

    // hold shift
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    // select two paragraphs above
    for (let i = 0; i < 2; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }
    // release shift
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // press backspace
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    // we should end up with a paragraph that contains contents of all 4 deleted paragraphs in deletion marks
    expect(await editorPage.getParagraphCount()).toBe(5);
    expect(await editorPage.getParagraphText(4)).toBe(
      `\u200BParagraph 3\u200BParagraph 4\u200BParagraph 5\u200BParagraph 6`,
    );
    deletionMarkCount = await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(8);
    insertionMarkCount = await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(0);
  });

  test("should join blocks correctly after emptying a paragraph, when deleting a selection that spans across a block boundary and multiple paragraphs above", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 1" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 2" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 3" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 4" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 5" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 6" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 7" }],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);

    // there is also an automatically added empty paragraph on the bottom
    expect(await editorPage.getParagraphCount()).toBe(8);

    // go up to |Paragraph 5
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // got to Paragraph 5|
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragraph 5".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // delete "Paragraph 5"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragraph 5".length; ++i) {
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);
    }

    // unchanged - the paragraph is emptied
    expect(await editorPage.getParagraphCount()).toBe(8);

    // hold shift
    await page.keyboard.down("Shift");

    // select two paragraphs above
    for (let i = 0; i < 2; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // press backspace to delete selected paragraphs
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    // 3 paragraphs should be joined into one and contents deleted
    expect(await editorPage.getParagraphCount()).toBe(6);
    expect(await editorPage.getParagraphText(2)).toBe(
      `\u200BParagraph 3\u200BParagraph 4\u200BParagraph 5`,
    );
    const deletionMarkCount =
      await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(6);
    const insertionMarkCount =
      await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(0);
  });

  test("should join blocks correctly after creating a new paragraph and then selecting and deleting multiple paragraphs above", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 1" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 2" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 3" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 4" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 5" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 6" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 7" }],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);

    // there is also an automatically added empty paragraph on the bottom
    expect(await editorPage.getParagraphCount()).toBe(8);
    // there is also an automatically added empty paragraph on the bottom
    expect(await editorPage.getParagraphCount()).toBe(8);

    // go up to |Paragraph 5
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // got to Paragraph 5|
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragraph 5".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // press enter to create a new paragraph
    await page.keyboard.press("Enter");
    await page.waitForTimeout(50);
    expect(await editorPage.getParagraphCount()).toBe(9);
    let insertionMarkCount =
      await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(2);

    // move cursor between "Paragraph 5" and split mark
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);
    }

    // hold shift
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);

    // select "Paragraph 5"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragraph 5".length; ++i) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);
    }

    // now press up to select Paragraph 4
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(50);

    // release shift
    await page.keyboard.up("Shift");

    // verify selection is at what we expect
    const selection = await editorPage.getProseMirrorSelection();
    expect(selection.anchor).toBe(64);
    expect(selection.head).toBe(40);

    // press Backspace
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphCount()).toBe(8);
    insertionMarkCount = await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(2);
    expect(await editorPage.getParagraphText(3)).toBe(
      `\u200BParagraph 4\u200BParagraph 5\u200B`,
    );
  });
});
