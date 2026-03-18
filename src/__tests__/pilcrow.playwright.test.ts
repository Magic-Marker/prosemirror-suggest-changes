import { PILCROW } from "../constants.js";
import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("Pilcrow decoration behavior", () => {
  test("should not insert a pilcrow decoration when typing into adjacent pre-existing paragraphs", async ({
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
          content: [],
        },
        {
          type: "paragraph",
          content: [],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraph 4" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    expect(await editorPage.getParagraphCount()).toBe(4);

    // go up to second paragraph
    for (let i = 0; i < 2; ++i) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // type "FOO"
    await page.keyboard.type("FOO", { delay: 50 });

    // move to paragraph below
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(50);

    // type "BAR"
    await page.keyboard.type("BAR", { delay: 50 });

    // should have insertion "FOO" and insertion "BAR"
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(2);
    expect(await editorPage.getDOMTextContentOfChildAtIndex(1)).not.toContain(
      PILCROW,
    );
  });
});
