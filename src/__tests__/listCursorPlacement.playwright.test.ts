import { PILCROW, ZWSP } from "../constants.js";
import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("Cursor placement in lists", () => {
  test("Lands on the new list item from below with track changes disabled", async ({
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 4" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.disableTrackChanges();

    await expect(editorPage.getListItems()).toHaveCount(4);
    await expect(editorPage.getParagraphs()).toHaveCount(4);

    // place cursor at "|Item 4"
    await editorPage.pressKey("Home");
    // move cursor up to "|Item 3"
    await editorPage.pressKey("ArrowUp", { waitForSelectionChange: true });

    // press Enter to create a new list item above "Item 3"
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });

    await expect(editorPage.getListItems()).toHaveCount(5);
    await expect(editorPage.getParagraphs()).toHaveCount(5);

    await editorPage.setCursorToEnd();
    // place cursor at "|Item 4"
    await editorPage.pressKey("Home");
    // place cursor at the newly created paragraph above
    await editorPage.pressKeyMultiple("ArrowUp", 2, {
      waitForSelectionChange: true,
    });

    // enter some text to verify cursor placement
    await editorPage.insertText("FOO");

    await expect(editorPage.getParagraphAt(1)).toHaveText("Item 2");
    await expect(editorPage.getParagraphAt(2)).toHaveText("FOO");
    await expect(editorPage.getParagraphAt(3)).toHaveText("Item 3");
  });

  test("Lands on the new list item from above with track changes disabled", async ({
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 4" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.disableTrackChanges();

    await expect(editorPage.getListItems()).toHaveCount(4);
    await expect(editorPage.getParagraphs()).toHaveCount(4);

    // place cursor at "|Item 4"
    await editorPage.pressKey("Home");
    // move cursor up to "|Item 3"
    await editorPage.pressKey("ArrowUp", { waitForSelectionChange: true });

    // press Enter to create a new list item above "Item 3"
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });

    await expect(editorPage.getListItems()).toHaveCount(5);
    await expect(editorPage.getParagraphs()).toHaveCount(5);

    // place cursor at the start of the document
    await editorPage.setCursorToStart();
    // go down to "|Item 2" and then down once more to the new paragraph
    await editorPage.pressKeyMultiple("ArrowDown", 2, {
      waitForSelectionChange: true,
    });

    // enter some text to verify cursor placement
    await editorPage.insertText("FOO");

    await expect(editorPage.getParagraphAt(1)).toHaveText("Item 2");
    await expect(editorPage.getParagraphAt(2)).toHaveText("FOO");
    await expect(editorPage.getParagraphAt(3)).toHaveText("Item 3");
  });

  test("Lands on the new list item from below with track changes enabled", async ({
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 4" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.enableTrackChanges();

    await expect(editorPage.getListItems()).toHaveCount(4);
    await expect(editorPage.getParagraphs()).toHaveCount(4);

    // place cursor at "|Item 4"
    await editorPage.pressKey("Home");
    // move cursor up to "|Item 3"
    await editorPage.pressKey("ArrowUp", { waitForSelectionChange: true });

    // press Enter to create a new list item above "Item 3"
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });

    await expect(editorPage.getListItems()).toHaveCount(5);
    await expect(editorPage.getParagraphs()).toHaveCount(5);

    await editorPage.setCursorToEnd();
    // place cursor at "|Item 4"
    await editorPage.pressKey("Home");
    // place cursor at the newly created paragraph above
    await editorPage.pressKeyMultiple("ArrowUp", 2, {
      waitForSelectionChange: true,
    });

    // enter some text to verify cursor placement
    await editorPage.insertText("FOO");

    await expect(editorPage.getParagraphAt(1)).toHaveText("Item 2");
    await expect(editorPage.getParagraphAt(2)).toHaveText(
      `FOO${ZWSP}${PILCROW}`,
    );
    await expect(editorPage.getParagraphAt(3)).toHaveText("Item 3");
  });

  test("Lands on the new list item from above with track changes enabled", async ({
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 4" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.enableTrackChanges();

    await expect(editorPage.getListItems()).toHaveCount(4);
    await expect(editorPage.getParagraphs()).toHaveCount(4);

    // place cursor at "|Item 4"
    await editorPage.pressKey("Home");
    // move cursor up to "|Item 3"
    await editorPage.pressKey("ArrowUp", { waitForSelectionChange: true });

    // press Enter to create a new list item above "Item 3"
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });

    await expect(editorPage.getListItems()).toHaveCount(5);
    await expect(editorPage.getParagraphs()).toHaveCount(5);

    // place cursor at the start of the document
    await editorPage.setCursorToStart();

    // go down to "|Item 2" and then down once more to the new paragraph
    await editorPage.pressKeyMultiple("ArrowDown", 2, {
      waitForSelectionChange: true,
    });

    // enter some text to verify cursor placement
    await editorPage.insertText("FOO");

    await expect(editorPage.getParagraphAt(1)).toHaveText("Item 2");
    await expect(editorPage.getParagraphAt(2)).toHaveText(
      `FOO${ZWSP}${PILCROW}`,
    );
    await expect(editorPage.getParagraphAt(3)).toHaveText("Item 3");
  });
});
