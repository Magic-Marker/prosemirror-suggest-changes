import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("Delete key tests", () => {
  test("should be able to delete a single character", async ({ page }) => {
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
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    expect(await editorPage.getParagraphCount()).toBe(6);

    // go up to |Paragraph 3
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // go right to Para|graph 3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Delete "g"
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);

    await editorPage.acceptAllSuggestions();
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(2)).toBe("Pararaph 3");
  });

  test("should be able to delete multiple characters in a row", async ({
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
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    expect(await editorPage.getParagraphCount()).toBe(6);

    // go up to |Paragraph 3
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // go right to Para|graph 3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Delete "g"
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);

    // delete "r"
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);

    // delete "a"
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);

    await editorPage.acceptAllSuggestions();
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(2)).toBe("Paraaph 3");
  });
});
