import { expect, test } from "../../../__tests__/playwrightBaseTest.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { ZWSP } from "../../../constants.js";
import { getSuggestionMarks } from "../../../utils.js";
import { eq } from "prosemirror-test-builder";

test.describe("Join on Delete E2E - Real Keyboard Events", () => {
  test.describe("Paragraph: Backspace then Enter (after join modification)", () => {
    test("should revert document to original state (join mark is adjacent to split mark)", async ({
      page,
    }) => {
      await setupDocFromJSON(page, {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "World" }],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "World".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      await page.keyboard.press("Backspace");

      const editorPage = new EditorPage(page);
      expect(await editorPage.getParagraphText(0)).toBe(`Hello${ZWSP}World`);
      expect(await editorPage.getParagraphCount()).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

      await page.keyboard.press("Enter");

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc({
          type: "doc",
          content: [
            {
              type: "paragraph",
              attrs: {
                id: "node-1",
              },
              content: [{ type: "text", text: "Hello" }],
            },
            {
              type: "paragraph",
              attrs: {
                id: "node-4",
              },
              content: [{ type: "text", text: "World" }],
            },
          ],
        });
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });

    test("should NOT revert document to original state (join mark is not adjacent to split mark)", async ({
      page,
    }) => {
      await setupDocFromJSON(page, {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "World" }],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // move to the end of the second paragraph
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "World".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      // join with the previous paragraph
      await page.keyboard.press("Backspace");

      const editorPage = new EditorPage(page);
      expect(await editorPage.getParagraphText(0)).toBe(`Hello${ZWSP}World`);
      expect(await editorPage.getParagraphCount()).toBe(1);

      // type "aaa" (insertion mark)
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "aaa".length; i++) {
        await page.keyboard.press("a");
        await page.waitForTimeout(50);
      }

      // move 3 characters forward
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "Wor".length; i++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(50);
      }

      // delete "Wor" (deletion mark)
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "Wor".length; i++) {
        await page.keyboard.press("Backspace");
        await page.waitForTimeout(50);
      }

      // move 2 characters forward (to be inside deletion mark)
      // for (let i = 0; i < "Wo".length; i++) {
      //   await page.keyboard.press("ArrowRight");
      //   await page.waitForTimeout(50);
      // }
      // this won't work with hidden deletions (being inside deletion mark is not allowed, and the plugin will move selection forward)
      // with hidden deletions we already are where we want to be to split

      // split node here
      await page.keyboard.press("Enter");
      await page.waitForTimeout(50);

      const finalState = await page.evaluate(() => window.pmEditor.getState());

      expect(finalState.marks.length).toBe(5);
      expect(finalState.textContent).toBe(`Hello${ZWSP}aaaWor${ZWSP}${ZWSP}ld`);

      const schema = await page.evaluate(
        () => window.pmEditor.view.state.schema,
      );
      const { deletion, insertion } = getSuggestionMarks(schema);

      expect(finalState.marks[0]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[0]?.attrs["type"]).toEqual("join");
      expect(finalState.marks[0]?.type).toEqual(deletion);

      expect(finalState.marks[1]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[1]?.type).toEqual(insertion);

      expect(finalState.marks[2]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[2]?.type).toEqual(deletion);

      // zwsp split mark at first node
      expect(finalState.marks[3]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[3]?.type).toEqual(insertion);

      // zwsp split mark at second node
      expect(finalState.marks[4]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[4]?.type).toEqual(insertion);
    });
  });

  test.describe("Paragraph: Backspace then Enter (in front of the join modification)", () => {
    test("should revert document to original state", async ({ page }) => {
      await setupDocFromJSON(page, {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "World" }],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "World".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      await page.keyboard.press("Backspace");

      const editorPage = new EditorPage(page);
      expect(await editorPage.getParagraphText(0)).toBe(`Hello${ZWSP}World`);
      expect(await editorPage.getParagraphCount()).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);
      expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);

      // first arrow keypress skips the join mod and goes behind the last letter
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);

      // move cursor forward so it is in front of the join mod
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(50);

      await page.keyboard.press("Enter");
      await page.waitForTimeout(50);

      const { currentDoc, expectedDoc } =
        await editorPage.getCurrentAndExpectedDoc({
          type: "doc",
          content: [
            {
              type: "paragraph",
              attrs: {
                id: "node-1",
              },
              content: [{ type: "text", text: "Hello" }],
            },
            {
              type: "paragraph",
              attrs: {
                id: "node-4",
              },
              content: [{ type: "text", text: "World" }],
            },
          ],
        });
      expect(eq(currentDoc, expectedDoc)).toBe(true);
    });
  });

  test.describe("Two paragraphs: join marks survive deletions over them", () => {
    test("should have the same content after backspacing over the join mark", async ({
      page,
    }) => {
      await setupDocFromJSON(page, {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "World" }],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "World".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);

      let finalState = await page.evaluate(() => window.pmEditor.getState());
      expect(finalState.paragraphCount).toBe(1);
      expect(finalState.textContent).toBe(`Hello${ZWSP}World`);
      expect(finalState.marks.length).toBe(1);
      expect(
        finalState.marks.find((mark) => mark.attrs["type"] === "join"),
      ).toBeDefined();

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "HelloWorld".length; i++) {
        await page.keyboard.press("Backspace");
        await page.waitForTimeout(50);
      }

      finalState = await page.evaluate(() => window.pmEditor.getState());
      expect(finalState.cursorFrom).toBe(1);
      // anchor mark in front
      expect(finalState.textContent).toBe(`${ZWSP}Hello${ZWSP}World`);
      // 3 deletions + one deletion anchor
      expect(finalState.marks.length).toBe(4);
      expect(
        finalState.marks.find((mark) => mark.attrs["type"] === "join"),
      ).toBeDefined();
    });

    test("should have the same content after deleting a selection that contains join mark", async ({
      page,
    }) => {
      await setupDocFromJSON(page, {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "World" }],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "World".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);

      let finalState = await page.evaluate(() => window.pmEditor.getState());
      expect(finalState.paragraphCount).toBe(1);
      expect(finalState.textContent).toBe(`Hello${ZWSP}World`);
      expect(finalState.marks.length).toBe(1);
      expect(
        finalState.marks.find((mark) => mark.attrs["type"] === "join"),
      ).toBeDefined();

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // move cursor to the left a bit

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "rld".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      // hold shift and select using left arrow

      await page.keyboard.down("Shift");
      await page.waitForTimeout(50);

      for (let i = 0; i < "loWo".length + 1; i++) {
        // todo: +1 to go over a zwsp, remove when skipping is improved
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }
      await page.keyboard.up("Shift");
      await page.waitForTimeout(50);

      // delete the selection

      await page.keyboard.press("Delete");
      await page.waitForTimeout(50);

      finalState = await page.evaluate(() => window.pmEditor.getState());
      expect(finalState.cursorFrom).toBe(10); // it's 10 and not 9 because 9 is adjacent to a hidden deletion
      expect(finalState.textContent).toBe(`Hello${ZWSP}World`);
      expect(finalState.marks.length).toBe(3);
      expect(
        finalState.marks.find((mark) => mark.attrs["type"] === "join"),
      ).toBeDefined();
    });

    test("should have the same mark id after backspacing repeatedly over the join", async ({
      page,
    }) => {
      await setupDocFromJSON(page, {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "World" }],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // first, join two paragraphs: navigate to the front of the second paragraph, and press backspace

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "World".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);

      // now navigate 2 times with arrow right, and then 4 times with backspace
      // (should delete 4 characters in the middle)

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "Wo".length; i++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(50);
      }

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "loWo".length; i++) {
        await page.keyboard.press("Backspace");
        await page.waitForTimeout(50);
      }

      // we should have 3 marks in total, all with the same id, one is the join mark

      const finalState = await page.evaluate(() => window.pmEditor.getState());
      const schema = await page.evaluate(
        () => window.pmEditor.view.state.schema,
      );
      const { deletion } = getSuggestionMarks(schema);

      expect(finalState.textContent).toBe(`Hello${ZWSP}World`);
      expect(finalState.marks.length).toBe(3);

      expect(finalState.marks[0]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[0]?.type).toEqual(deletion);

      expect(finalState.marks[1]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[1]?.attrs["type"]).toEqual("join");
      expect(finalState.marks[1]?.type).toEqual(deletion);

      expect(finalState.marks[2]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[2]?.type).toEqual(deletion);
    });

    test("should have the same mark id after backspacing once after join", async ({
      page,
    }) => {
      await setupDocFromJSON(page, {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "World" }],
          },
        ],
      });

      await page.evaluate(() => {
        window.pmEditor.setCursorToEnd();
      });

      // first, join two paragraphs: navigate to the front of the second paragraph, and press backspace

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < "World".length; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(50);
      }

      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);

      // now press backspace again (to delete the last character of the left paragraph)
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(50);

      // we should have 2 marks in total, all with the same id, one is the join mark
      const finalState = await page.evaluate(() => window.pmEditor.getState());
      const schema = await page.evaluate(
        () => window.pmEditor.view.state.schema,
      );
      const { deletion } = getSuggestionMarks(schema);

      expect(finalState.textContent).toBe(`Hello${ZWSP}World`);
      expect(finalState.marks.length).toBe(2);

      expect(finalState.marks[0]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[0]?.type).toEqual(deletion);

      expect(finalState.marks[1]?.attrs["id"]).toEqual(1);
      expect(finalState.marks[1]?.attrs["type"]).toEqual("join");
      expect(finalState.marks[1]?.type).toEqual(deletion);
    });
  });
});
