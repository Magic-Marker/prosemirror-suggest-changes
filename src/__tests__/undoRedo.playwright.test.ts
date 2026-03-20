import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("Undo redo with track changes enabled", () => {
  test("Undoing a replacement next to an existing insertion should not remove the existing insertion", async ({
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
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    expect(await editorPage.getParagraphCount()).toBe(4);

    // go up to |Paragraph 2
    for (let i = 0; i < 2; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // go right to Para|graph 2
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Insert "X"
    await page.keyboard.press("X");
    await page.waitForTimeout(50);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgraph 2");

    // now select "g"
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(50);
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // replace selected "g" with "Y"
    await page.keyboard.type("Y");
    await page.waitForTimeout(50);

    // insertion "X", deletion "g", insertion "Y"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(2);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgYraph 2");

    // now Undo
    await page.keyboard.press("ControlOrMeta+Z");
    await page.waitForTimeout(50);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgraph 2");
  });

  test("Undoing a replacement on the left side of an existing insertion should not remove the existing insertion", async ({
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
          content: [],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    expect(await editorPage.getParagraphCount()).toBe(4);

    // go up to |Paragraph 2
    for (let i = 0; i < 2; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // go right to Para|graph 2
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Insert "X"
    await page.keyboard.press("X");
    await page.waitForTimeout(50);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgraph 2");

    // now select "a"
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(50);
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(50);
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // replace selected "a" with "Y"
    await page.keyboard.type("Y");
    await page.waitForTimeout(50);

    // deletion "A", insertion "YX"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
    expect(await editorPage.getParagraphText(1)).toBe("ParaYXgraph 2");

    // now Undo
    await page.keyboard.press("ControlOrMeta+Z");
    await page.waitForTimeout(50);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgraph 2");
  });
});
