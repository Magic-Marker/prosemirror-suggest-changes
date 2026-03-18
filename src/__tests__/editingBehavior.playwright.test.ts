import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("General editing behavior around suggestion marks", () => {
  test("backspacing into a pair of adjacent deletion/insertion marks should delete characters in the insertion", async ({
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

    // go up to |Paragraph 2
    for (let i = 0; i < 4; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // go right to Paragr|aph 3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragr".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Delete "agr"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "agr".length; ++i) {
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);
    }

    // Type "XYZ"
    await page.keyboard.type("XYZ", { delay: 50 });
    await page.waitForTimeout(50);

    // move to ParagrXYZap|h 2
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "ap".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Delete "ap"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "ap".length; ++i) {
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);
    }

    // should have deletion "agr", insertion "XYZ", deletion "ap"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    // Press backspace one more time (Should delete "Z" in "XYZ")
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(1)).toBe("ParagrXYaph 2");
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    // Press backspace one more time (Should delete "Y" in "XY")
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(1)).toBe("ParagrXaph 2");
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    // Press backspace one more time (Should delete "X" in "X")
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(1)).toBe("Paragraph 2");
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);
    // two adjacent deletions are merged into one
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
  });

  test("(with whitespaces) backspacing into a pair of adjacent deletion/insertion marks should delete characters in the insertion", async ({
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
          content: [{ type: "text", text: "Par agr aph 2" }],
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

    // go up to |Par agr aph 2
    for (let i = 0; i < 4; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // go right to Par agr| aph 3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Par agr".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Delete "agr"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "agr".length; ++i) {
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);
    }

    // Type "XYZ"
    await page.keyboard.type("XYZ", { delay: 50 });
    await page.waitForTimeout(50);

    // move to Par agrXYZ ap|h 2
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < " ap".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Delete " ap"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < " ap".length; ++i) {
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);
    }

    // should have deletion "agr", insertion "XYZ", deletion " ap"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    // Press backspace one more time (Should delete "Z" in "XYZ")
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(1)).toBe("Par agrXY aph 2");
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    // Press backspace one more time (Should delete "Y" in "XY")
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(1)).toBe("Par agrX aph 2");
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(2);

    // Press backspace one more time (Should delete "X" in "X")
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(50);

    expect(await editorPage.getParagraphText(1)).toBe("Par agr aph 2");
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);
    // two adjacent deletions are merged into one
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
  });
});
