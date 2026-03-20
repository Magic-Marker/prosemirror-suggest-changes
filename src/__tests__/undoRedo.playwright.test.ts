/* eslint-disable @typescript-eslint/prefer-for-of */
import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

const TYPING_DELAY = 250;

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
      await page.waitForTimeout(TYPING_DELAY);
    }

    // go right to Para|graph 2

    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // Insert "X"
    await page.keyboard.press("X");
    await page.waitForTimeout(TYPING_DELAY);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgraph 2");

    // now select "g"
    await page.keyboard.down("Shift");
    await page.waitForTimeout(TYPING_DELAY);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(TYPING_DELAY);
    await page.keyboard.up("Shift");
    await page.waitForTimeout(TYPING_DELAY);

    // replace selected "g" with "Y"
    await page.keyboard.type("Y");
    await page.waitForTimeout(TYPING_DELAY);

    // insertion "X", deletion "g", insertion "Y"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(2);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgYraph 2");

    // now Undo
    await page.keyboard.press("ControlOrMeta+Z");
    await page.waitForTimeout(TYPING_DELAY);

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
      await page.waitForTimeout(TYPING_DELAY);
    }

    // go right to Para|graph 2

    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // Insert "X"
    await page.keyboard.press("X");
    await page.waitForTimeout(TYPING_DELAY);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgraph 2");

    // now select "a"
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(TYPING_DELAY);
    await page.keyboard.down("Shift");
    await page.waitForTimeout(TYPING_DELAY);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(TYPING_DELAY);
    await page.keyboard.up("Shift");
    await page.waitForTimeout(TYPING_DELAY);

    // replace selected "a" with "Y"
    await page.keyboard.type("Y");
    await page.waitForTimeout(TYPING_DELAY);

    // deletion "A", insertion "YX"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
    expect(await editorPage.getParagraphText(1)).toBe("ParaYXgraph 2");

    // now Undo
    await page.keyboard.press("ControlOrMeta+Z");
    await page.waitForTimeout(TYPING_DELAY);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXgraph 2");
  });

  test("Undoing a replacement that overlaps an existing insertion from the right should not remove the existing insertion", async ({
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
      await page.waitForTimeout(TYPING_DELAY);
    }

    // go right to Para|graph 2
    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // Insert "XXX"
    for (let i = 0; i < "XXX".length; ++i) {
      await page.keyboard.press("X");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // insertion "XXX"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXXXgraph 2");

    // go right to ParaXXXgr|aph
    for (let i = 0; i < "gr".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // select into the insertion ParaXX|Xgraph
    await page.keyboard.down("Shift");
    await page.waitForTimeout(TYPING_DELAY);
    for (let i = 0; i < "Xgr".length; ++i) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(TYPING_DELAY);
    }
    await page.keyboard.up("Shift");
    await page.waitForTimeout(TYPING_DELAY);

    // now replace selected "Xgr" with "Y"
    await page.keyboard.type("Y");
    await page.waitForTimeout(TYPING_DELAY);

    // insertion "XX", deletion "gr", insertion "Y"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(2);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXXgrYaph 2");

    // now Undo
    await page.keyboard.press("ControlOrMeta+z");
    await page.waitForTimeout(TYPING_DELAY);

    // insertion "XXX"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXXXgraph 2");
  });

  test("Undoing a replacement that overlaps an existing insertion from the left should not remove the existing insertion", async ({
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
      await page.waitForTimeout(TYPING_DELAY);
    }

    // go right to Para|graph 2
    for (let i = 0; i < "Para".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // Insert "XXX"
    for (let i = 0; i < "XXX".length; ++i) {
      await page.keyboard.press("X");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // insertion "XXX"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXXXgraph 2");

    // go left to Pa|raXXXgraph
    for (let i = 0; i < "raXXX".length; ++i) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(TYPING_DELAY);
    }

    // select into the insertion ParaX|XXgraph
    await page.keyboard.down("Shift");
    await page.waitForTimeout(TYPING_DELAY);
    for (let i = 0; i < "raX".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(TYPING_DELAY);
    }
    await page.keyboard.up("Shift");
    await page.waitForTimeout(TYPING_DELAY);

    // now replace selected "raX" with "Y"
    await page.keyboard.type("Y");
    await page.waitForTimeout(TYPING_DELAY);

    // deletion "ra", insertion "YXX"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
    expect(await editorPage.getParagraphText(1)).toBe("ParaYXXgraph 2");

    // now Undo
    await page.keyboard.press("ControlOrMeta+z");
    await page.waitForTimeout(TYPING_DELAY);

    // insertion "XXX"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
    expect(await editorPage.getParagraphText(1)).toBe("ParaXXXgraph 2");
  });
});
