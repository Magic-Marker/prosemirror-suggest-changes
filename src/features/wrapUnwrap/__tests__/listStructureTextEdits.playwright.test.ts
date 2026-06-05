import { test, expect } from "../../../__tests__/playwrightBaseTest.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { eq } from "prosemirror-test-builder";
import {
  guardStructureMarkObject,
  guardStructureMoveMarkAttrs,
} from "../types.js";

test.describe("Structure changes with text edits in lists", () => {
  test("Revert all reverts a moved list item and text edits inside it", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item One" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Two" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Three" }],
                },
              ],
            },
          ],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    // move to Item Two
    await page.keyboard.press("ArrowUp");

    // indent Item Two under Item One
    await page.keyboard.press("Tab");

    // delete "Two"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Two".length; i++) {
      await page.keyboard.press("Backspace");
    }

    // insert "Second"
    await page.keyboard.type("Second");

    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

    await editorPage.revertAll();

    const docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert a structure mark preserves text edits inside the moved list item", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item One" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Two" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Three" }],
                },
              ],
            },
          ],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    // move to Item Two
    await page.keyboard.press("ArrowUp");

    // indent Item Two under Item One
    await page.keyboard.press("Tab");

    // delete "Two"
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < "Two".length; i++) {
      await page.keyboard.press("Backspace");
    }

    // insert "Second"
    await page.keyboard.type("Second");

    const structureMarks = (await editorPage.getProseMirrorMarksJSON()).filter(
      guardStructureMarkObject,
    );
    expect(structureMarks).toHaveLength(1);
    expect(
      structureMarks[0] && guardStructureMoveMarkAttrs(structureMarks[0].attrs),
    ).toBe(true);
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

    await editorPage.revertSuggestion(structureMarks[0]?.attrs.id as number);

    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

    const currentDoc = await editorPage.getCurrentDoc();
    const list = currentDoc.child(0);
    expect(list.type.name).toBe("orderedList");
    expect(list.childCount).toBe(3);
    expect(list.child(0).childCount).toBe(1);
    expect(list.child(1).childCount).toBe(1);
    expect(list.child(2).childCount).toBe(1);
  });
});
