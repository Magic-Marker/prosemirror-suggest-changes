import { test, expect } from "../../../__tests__/playwrightBaseTest.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { eq } from "prosemirror-test-builder";

test.describe("Structure changes in lists", () => {
  test("Revert a single outdent (last item)", async ({
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Four" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Five" }],
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

    // press shift+tab to outdent Item Five
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert a single indent (middle item)", async ({
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
                  content: [{ type: "text", text: "Item 1" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 2" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 3" }],
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

    // move to Item 2
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(50);

    // press tab to indent Item 2
    await page.keyboard.press("Tab");
    await page.waitForTimeout(50);

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert a single outdent (middle item)", async ({
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Four" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item Five" }],
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

    // go up to Item Three
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }

    // press shift+tab to outdent Item Three
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });
});
