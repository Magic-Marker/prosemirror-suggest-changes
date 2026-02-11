import { expect, test } from "@playwright/test";
import { setupDocFromJSON } from "../../joinBlocks/__tests__/playwrightHelpers.js";

test.describe("Backspace with hidden deletions", () => {
  // those failures are not 100% sometimes
  test.describe.configure({ retries: 5 });

  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto("/test-fixtures/keyboard-test.html");
    // Wait for the editor to be initialized
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await page.waitForFunction(() => window.pmEditor !== undefined);
    // Focus the editor
    await page.locator("#editor .ProseMirror").click();
  });

  test.describe("Backspace in a paragraph", () => {
    test("Deletes multiple characters with Backspace one after another, skips over the hidden deletion, but then the cursor is stuck", async ({
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
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // to up to Paragraph 3
      for (let i = 0; i < 2; i++) await page.keyboard.press("ArrowUp");

      // go to Par|agraph 3
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "agraph 3".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      let cursorInfo = await page.evaluate(() => {
        return window.pmEditor.getCursorInfo();
      });
      expect(cursorInfo.from).toBe(30);
      expect(cursorInfo.to).toBe(30);

      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);

      // correct position should be 28 after two Backspace presses
      cursorInfo = await page.evaluate(() => {
        return window.pmEditor.getCursorInfo();
      });
      expect(cursorInfo.from).toBe(28);
      expect(cursorInfo.to).toBe(28);

      // retrieve text in the deletion mark
      const { delText, delPos, delSize } = await page.evaluate(() => {
        const doc = window.pmEditor.view.state.doc;
        let delText = "" as string | null;
        let delPos = null as number | null;
        let delSize = null as number | null;
        doc.nodesBetween(0, doc.content.size, (node, pos) => {
          if (delText !== "") return false;
          const del = node.marks.find((mark) => mark.type.name === "deletion");
          if (!del || node.text == null) return true;
          delText = node.text;
          delPos = pos;
          delSize = node.nodeSize;
          return false;
        });
        return { delText, delPos, delSize };
      });

      expect(delSize).toBe(2);
      // correct start position of the deletion mark should be 28 after two Backspace presses
      expect(delPos).toBe(28);

      // pressing Backspace twice in this position Par|agraph 3
      // correct behavior: should first delete "r", then "a", so deletion mark should cover this: P<del>ar</del>agraph 3

      expect(delText).toBe("ar");

      // it should skip over the hidden deletion

      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);

      if (delSize == null || delPos == null)
        throw new Error("delSize or delPos is null");

      cursorInfo = await page.evaluate(() => {
        return window.pmEditor.getCursorInfo();
      });
      expect(cursorInfo.from).toBeGreaterThanOrEqual(delPos + delSize);
      expect(cursorInfo.to).toBeGreaterThanOrEqual(delPos + delSize);
      expect(cursorInfo.from).toBe(30);
      expect(cursorInfo.to).toBe(30);

      // is cursor stuck?

      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);

      cursorInfo = await page.evaluate(() => {
        return window.pmEditor.getCursorInfo();
      });
      // if it's not stuck it should be at 32
      expect(cursorInfo.from).not.toBe(32);
      expect(cursorInfo.to).not.toBe(32);
      // but it is still at 30
      expect(cursorInfo.from).toBe(30);
      expect(cursorInfo.to).toBe(30);
    });
  });
});
