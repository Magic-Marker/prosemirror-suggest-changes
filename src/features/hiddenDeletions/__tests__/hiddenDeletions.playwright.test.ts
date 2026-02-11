import { expect, test } from "@playwright/test";
import { setupDocFromJSON } from "../../joinBlocks/__tests__/playwrightHelpers.js";

test.describe("Backspace with hidden deletions", () => {
  // those failures are not 100% sometimes
  // test.describe.configure({ retries: 5 });

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
    test("Fails to delete multiple characters with Backspace one after another, but skips over the hidden deletion", async ({
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

      // correct position should be 28 after two Backspace presses, but it is actually 29
      cursorInfo = await page.evaluate(() => {
        return window.pmEditor.getCursorInfo();
      });
      expect(cursorInfo.from).not.toBe(28);
      expect(cursorInfo.to).not.toBe(28);
      expect(cursorInfo.from).toBe(29);
      expect(cursorInfo.to).toBe(29);

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
      // correct start position of the deletion mark should be 28 after two Backspace presses, but it is actually 29
      expect(delPos).not.toBe(28);
      expect(delPos).toBe(29);

      // pressing Backspace twice in this position Par|agraph 3
      // correct behavior: should first delete "r", then "a", so deletion mark should cover this: P<del>ar</del>agraph 3
      // actual behavior: it deletes "r" first, then it deletes "a" on the right, resulting in this: Pa<del>ra</del>graph 3

      expect(delText).not.toBe("ar");
      expect(delText).toBe("ra");

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
      expect(cursorInfo.from).toBeGreaterThan(delPos + delSize);
      expect(cursorInfo.to).toBeGreaterThan(delPos + delSize);
      expect(cursorInfo.from).toBe(32);
      expect(cursorInfo.to).toBe(32);
    });
  });
});
