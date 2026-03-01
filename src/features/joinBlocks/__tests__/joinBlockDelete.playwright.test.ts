import { test, expect } from "@playwright/test";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";

test.describe("Join Block Delete Bug", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto("/test-fixtures/keyboard-test.html");

    // Wait for the editor to be initialized
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await page.waitForFunction(() => window.pmEditor !== undefined);

    // Focus the editor
    await page.locator("#editor .ProseMirror").click();
  });

  test("(using Delete key) should join blocks correctly when deleting a selection spans across a block boundary and multiple paragraphs above", async ({
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
    await page.keyboard.press("Delete");
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

  test("should join blocks correctly when repeatedly pressing Delete key", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "p 1" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "p 2" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "p 3" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "p 4" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "p 5" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "p 6" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "p 7" }],
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

    // go up to |p 5
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // Delete "p"
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);
    expect(await editorPage.getParagraphText(4)).toBe(`\u200Bp 5`);
    let deletionMarkCount =
      await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(2);

    // delete " "
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);
    expect(await editorPage.getParagraphText(4)).toBe(`\u200Bp 5`);
    deletionMarkCount = await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(2);

    // delete "5"
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);
    expect(await editorPage.getParagraphText(4)).toBe(`\u200Bp 5`);
    deletionMarkCount = await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(2);

    // press Delete again to join with "p 6" and then delete "p 6"
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "p 6".length; ++i) {
      await page.keyboard.press("Delete");
    }

    expect(await editorPage.getParagraphText(4)).toBe(`\u200Bp 5\u200Bp 6`);

    deletionMarkCount = await editorPage.getProseMirrorMarkCount("deletion");
    expect(deletionMarkCount).toBe(4);

    const insertionMarkCount =
      await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(0);
  });
});
