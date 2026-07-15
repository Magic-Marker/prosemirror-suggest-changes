import { PILCROW } from "../constants.js";
import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("copy paste in lists", () => {
  test("with track changes off, copies a list that was added with track changes off, without the above linebreak", async ({
    page,
    deletionMarksVisibility,
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
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.disableTrackChanges();

    // place cursor at "Paragraph 1|"
    await editorPage.pressKeyMultiple("ArrowUp", 2, {
      waitForSelectionChange: true,
    });

    // input a new list
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("- ");
    await editorPage.insertText("Item 1");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 2");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 3");

    // the cursor is at "Item 3|"
    // so now we select the whole list without the linebreak above
    await editorPage.pressKeyMultiple("Shift+ArrowUp", 3, {
      waitForSelectionChange: true,
    });
    // exclude the linebreak
    await editorPage.pressKey("Shift+ArrowRight", {
      waitForSelectionChange: true,
    });

    // copy selection
    await page.keyboard.press("ControlOrMeta+c");

    // reset selection to "Item 3"
    await editorPage.pressKey("ArrowRight", { waitForSelectionChange: true });

    // move cursor to "Paragraph 2|"
    await editorPage.pressKey("ArrowDown", { waitForSelectionChange: true });

    // new line
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    // because we excluded the linebreak from the selection, the first item will occupy the line we've just created

    // paste
    await editorPage.pressKey("ControlOrMeta+v", {
      waitForSelectionChange: true,
    });

    // 3 original paragraphs + 6 paragraphs in two lists
    await expect(editorPage.editor.locator("p")).toHaveCount(9);
    await expect(editorPage.editor.locator("ul")).toHaveCount(2);
    await expect(editorPage.editor.locator("li")).toHaveCount(6);

    // verify the correct order of the elements (paragraph, list, paragraph, pasted list, paragraph)
    await expect(editorPage.editor.locator("> *").nth(0)).toHaveText(
      `Paragraph 1`,
    );
    await expect(editorPage.editor.locator("> *").nth(1)).toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(2)).toHaveText(
      `Paragraph 2`,
    );
    await expect(editorPage.editor.locator("> *").nth(3)).toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(4)).toHaveText(
      `Paragraph 3`,
    );
  });

  test("with track changes off, copies a list that was added with track changes off, including the above linebreak", async ({
    page,
    deletionMarksVisibility,
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
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.disableTrackChanges();

    // place cursor at "Paragraph 1|"
    await editorPage.pressKeyMultiple("ArrowUp", 2, {
      waitForSelectionChange: true,
    });

    // input a new list
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("- ");
    await editorPage.insertText("Item 1");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 2");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 3");

    // the cursor is at "Item 3|"
    // so now we select the whole list without the linebreak above
    await editorPage.pressKeyMultiple("Shift+ArrowUp", 3, {
      waitForSelectionChange: true,
    });
    // do NOT exclude the linebreak
    // await editorPage.pressKey("Shift+ArrowRight", {
    //   waitForSelectionChange: true,
    // });

    // copy selection
    await page.keyboard.press("ControlOrMeta+c");

    // reset selection to "Item 3"
    await editorPage.pressKey("ArrowRight", { waitForSelectionChange: true });

    // move cursor to "Paragraph 2|"
    await editorPage.pressKey("ArrowDown", { waitForSelectionChange: true });

    // paste
    await editorPage.pressKey("ControlOrMeta+v", {
      waitForSelectionChange: true,
    });

    // 3 original paragraphs + 6 paragraphs in two lists
    await expect(editorPage.editor.locator("p")).toHaveCount(9);
    await expect(editorPage.editor.locator("ul")).toHaveCount(2);
    await expect(editorPage.editor.locator("li")).toHaveCount(6);

    // verify the correct order of the elements (paragraph, list, paragraph, pasted list, paragraph)
    await expect(editorPage.editor.locator("> *").nth(0)).toHaveText(
      `Paragraph 1`,
    );
    await expect(editorPage.editor.locator("> *").nth(1)).toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(2)).toHaveText(
      `Paragraph 2`,
    );
    await expect(editorPage.editor.locator("> *").nth(3)).toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(4)).toHaveText(
      `Paragraph 3`,
    );
  });

  test("with track changes on, copies and pastes a list that was added with track changes on, including the above linebreak", async ({
    page,
    deletionMarksVisibility,
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
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.enableTrackChanges();

    // place cursor at "Paragraph 1|"
    await editorPage.pressKeyMultiple("ArrowUp", 2, {
      waitForSelectionChange: true,
    });

    // input a new list
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("- ");
    await editorPage.insertText("Item 1");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 2");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 3");

    // the cursor is at "Item 3|"
    // so now we select the whole list plus the pilcrow at the end of "Paragraph 1"
    await editorPage.pressKeyMultiple("Shift+ArrowUp", 3, {
      waitForSelectionChange: true,
    });

    // copy selection
    await page.keyboard.press("ControlOrMeta+c");

    // reset selection to "Item 3"
    await editorPage.pressKey("ArrowRight", { waitForSelectionChange: true });

    // move cursor to "Paragraph 2|"
    await editorPage.pressKey("ArrowDown", { waitForSelectionChange: true });

    // paste
    await editorPage.pressKey("ControlOrMeta+v", {
      waitForSelectionChange: true,
    });

    // 3 original paragraphs + 6 paragraphs in two lists
    await expect(editorPage.editor.locator("p")).toHaveCount(9);
    await expect(editorPage.editor.locator("ul")).toHaveCount(2);
    await expect(editorPage.editor.locator("li")).toHaveCount(6);

    // verify the correct order of the elements (paragraph, list, paragraph, pasted list, paragraph)
    await expect(editorPage.editor.locator("> *").nth(0)).toHaveText(
      `Paragraph 1${PILCROW}`,
    );
    await expect(editorPage.editor.locator("> *").nth(1)).toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(2)).toHaveText(
      `Paragraph 2${PILCROW}`,
    );
    await expect(editorPage.editor.locator("> *").nth(3)).toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(4)).toHaveText(
      `Paragraph 3`,
    );
  });

  test("with track changes on, copies and pastes a list that was added with track changes on, without the above linebreak", async ({
    page,
    deletionMarksVisibility,
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
      ],
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await editorPage.focusEditor();
    await editorPage.enableTrackChanges();

    // place cursor at "Paragraph 1|"
    await editorPage.pressKeyMultiple("ArrowUp", 2, {
      waitForSelectionChange: true,
    });

    // input a new list
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("- ");
    await editorPage.insertText("Item 1");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 2");
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });
    await editorPage.insertText("Item 3");

    // the cursor is at "Item 3|"
    // so now we select the whole list plus the pilcrow at the end of "Paragraph 1"
    await editorPage.pressKeyMultiple("Shift+ArrowUp", 3, {
      waitForSelectionChange: true,
    });
    // exclude the linebreak (pilcrow)
    await editorPage.pressKey("Shift+ArrowRight", {
      waitForSelectionChange: true,
    });

    // copy selection
    await page.keyboard.press("ControlOrMeta+c");

    // reset selection to "Item 3"
    await editorPage.pressKey("ArrowRight", { waitForSelectionChange: true });

    // move cursor to "Paragraph 2|"
    await editorPage.pressKey("ArrowDown", { waitForSelectionChange: true });

    // new line
    await editorPage.pressKey("Enter", { waitForSelectionChange: true });

    // paste
    await editorPage.pressKey("ControlOrMeta+v", {
      waitForSelectionChange: true,
    });

    // 3 original paragraphs + 6 paragraphs in two lists
    await expect(editorPage.editor.locator("p")).toHaveCount(9);
    await expect(editorPage.editor.locator("ul")).toHaveCount(2);

    // right now this case doesn't work correctly, so expect an incorrect value
    // the reason is
    // pasting into a paragraph that just contains a ZWSP insertion mari (which is a second half of a split marker),
    // is treated by ProseMirror as pasting into a non-empty paragraph
    // so it doesn't replace the paragraph with the list item
    // it just updates it's contents, and the rest of list items are pasted normally below
    await expect(editorPage.editor.locator("li")).not.toHaveCount(6);
    await expect(editorPage.editor.locator("li")).toHaveCount(5);

    // verify the correct order of the elements (paragraph, list, paragraph, pasted list, paragraph)
    await expect(editorPage.editor.locator("> *").nth(0)).toHaveText(
      `Paragraph 1${PILCROW}`,
    );
    await expect(editorPage.editor.locator("> *").nth(1)).toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(2)).toHaveText(
      `Paragraph 2${PILCROW}`,
    );

    // expect incorrect values due to reasons above
    await expect(editorPage.editor.locator("> *").nth(3)).not.toHaveText(
      "Item 1Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(4)).not.toHaveText(
      `Paragraph 3`,
    );
    await expect(editorPage.editor.locator("> *").nth(3)).toHaveText("Item 1");
    await expect(editorPage.editor.locator("> *").nth(4)).toHaveText(
      "Item 2Item 3",
    );
    await expect(editorPage.editor.locator("> *").nth(5)).toHaveText(
      `Paragraph 3`,
    );
  });
});
