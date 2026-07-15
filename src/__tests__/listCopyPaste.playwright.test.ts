import { PILCROW } from "../constants.js";
import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("Copy paste in lists", () => {
  test("Copies a list that was inserted in track changes mode", async ({
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
});
