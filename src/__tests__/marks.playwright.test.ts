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
});
