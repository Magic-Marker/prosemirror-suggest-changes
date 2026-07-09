import { test, expect } from "./playwrightBaseTest.js";
import { setupDocFromJSON } from "./playwrightHelpers.js";
import { EditorPage } from "./playwrightPage.js";

test.describe("Behavior around adding and removing marks", () => {
  test("should be able to make text bold in a single paragraph and unbold", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    await editorPage.enableTrackChanges();

    await expect(editorPage.editor.locator("strong")).toHaveCount(0);
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);

    // move to "Hello wo|rld"
    await editorPage.pressKeyMultiple("ArrowLeft", 3);

    // select "lo wo"
    await editorPage.pressKeyMultiple("Shift+ArrowLeft", "lo wo".length);

    // make bold
    await editorPage.pressKey("ControlOrMeta+b");

    await expect(editorPage.editor.locator("strong")).toHaveCount(1);
    await expect(editorPage.editor.locator("strong")).toHaveText("lo wo");

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(1);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(1);

    // unbold
    await editorPage.pressKey("ControlOrMeta+b");

    await expect(editorPage.editor.locator("strong")).toHaveCount(0);
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
  });

  test("should be able to make text bold in multiple paragraphs and unbold", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Foo bar" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    await editorPage.enableTrackChanges();

    await expect(editorPage.editor.locator("strong")).toHaveCount(0);
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);

    // move to "Hello| world"
    await editorPage.pressKeyMultiple("ArrowLeft", " world".length);

    // select up to "bar" in the above paragraph
    await editorPage.pressKeyMultiple("Shift+ArrowLeft", "bar Hello".length);

    // make bold
    await editorPage.pressKey("ControlOrMeta+b");

    await expect(editorPage.editor.locator("strong")).toHaveCount(2);
    await expect(editorPage.editor.locator("strong")).toHaveText([
      "bar",
      "Hello",
    ]);

    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(2);
    // one additional deletion mark - the deletion "anchor" mark in front of "Hello"
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(3);

    // unbold
    await editorPage.pressKey("ControlOrMeta+b");

    await expect(editorPage.editor.locator("strong")).toHaveCount(0);
    expect(await editorPage.getProseMirrorMarkCount("insertion")).toBe(0);
    expect(await editorPage.getProseMirrorMarkCount("deletion")).toBe(0);
  });

  test("should have the cursor at the correct position after making a whole textblock bold", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    await editorPage.enableTrackChanges();

    // move to "|Hello world"
    await editorPage.pressKey("Home", { waitForSelectionChange: true });

    // select "Hello world"
    await editorPage.pressKey("Shift+ArrowDown", {
      waitForSelectionChange: true,
    });

    // make bold
    await editorPage.pressKey("ControlOrMeta+b");

    // collapse selection to the left
    await editorPage.pressKey("ArrowLeft", { waitForSelectionChange: true });

    // insert some text to verify the cursor position
    await editorPage.insertText("FOO");

    await expect(editorPage.getParagraphAt(0)).toHaveText(
      "Hello worldFOOHello world",
    );
  });

  test("should have the cursor at the correct position after making part of a textblock bold", async ({
    page,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page);
    await editorPage.enableTrackChanges();

    // move to "|Hello world"
    await editorPage.pressKey("Home", { waitForSelectionChange: true });

    // move to "H|ello world"
    await editorPage.pressKey("ArrowRight", { waitForSelectionChange: true });

    // select "ello world"
    await editorPage.pressKey("Shift+ArrowDown", {
      waitForSelectionChange: true,
    });

    // make bold
    await editorPage.pressKey("ControlOrMeta+b");

    // collapse selection to the left
    await editorPage.pressKey("ArrowLeft", { waitForSelectionChange: true });

    // insert some text to verify the cursor position
    await editorPage.insertText("FOO");

    await expect(editorPage.getParagraphAt(0)).toHaveText(
      "Hello worldFOOello world",
    );
  });
});
