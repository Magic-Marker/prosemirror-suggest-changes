import { test, expect } from "../../../__tests__/playwrightBaseTest.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";

test.describe("Editing behavior around hidden deletions", () => {
  test.skip("deleting in front of a hidden deletion at node boundary should not insert new paragraph", async ({
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
    // there is also an automatically added empty paragraph on the bottom
    expect(await editorPage.getParagraphCount()).toBe(6);

    // go up to |Paragraph 3
    for (let i = 0; i < 3; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // go right to Paragraph| 3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Paragraph".length; ++i) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
    }

    // Delete whitespace, then "3", then boundary between paragraphs (join with Paragraph 4)
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);
    await page.keyboard.press("Delete");
    await page.waitForTimeout(50);

    // Verify no insertion mark was inserted
    const insertionMarkCount =
      await editorPage.getProseMirrorMarkCount("insertion");
    expect(insertionMarkCount).toBe(0);
    expect(await editorPage.getParagraphCount()).toBe(5);
  });
});
