import { test, expect } from "../../../__tests__/playwrightBaseTest.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { eq } from "prosemirror-test-builder";
import { type Attrs } from "prosemirror-model";
import { guardStructureMarkAttrs, type StructureMarkAttrs } from "../types.js";

interface StructureMark {
  type: "structure";
  attrs: StructureMarkAttrs;
}

function isStructureMark(mark: unknown): mark is StructureMark {
  if (mark === null || typeof mark !== "object") return false;
  if (!("type" in mark) || mark.type !== "structure") return false;
  if (!("attrs" in mark)) return false;
  return guardStructureMarkAttrs(mark.attrs as Attrs);
}

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

    // press tab to indent Item 2
    await page.keyboard.press("Tab");

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
    }

    // press shift+tab to outdent Item Three
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert a multi outdent (two middle items)", async ({
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 5" }],
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

    // go up to Item 3
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("ArrowUp");
    }

    // move to Item| 3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < " 3".length; i++) {
      await page.keyboard.press("ArrowLeft");
    }

    // select Item 3 and Item 2
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.up("Shift");

    // press shift+tab to outdent Item 3 and Item 2
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert a single outdent from a nested list (middle item)", async ({
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
                {
                  type: "orderedList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.1" }],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.2" }],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.3" }],
                        },
                      ],
                    },
                  ],
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

    // go up to Item 2.2
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("ArrowUp");
    }

    // press shift+tab to outdent Item 2.2
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert a single outdent (top item)", async ({
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

    // go up to Item 1
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowUp");
    }

    // press shift+tab to outdent Item 1
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert a multi indent (three middle items)", async ({
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
                  content: [{ type: "text", text: "Item 2.1" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 2.2" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 2.3" }],
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 5" }],
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

    // go up to Item 2.3
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowUp");
    }

    // move to Item| 2.3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < " 2.3".length; i++) {
      await page.keyboard.press("ArrowLeft");
    }

    // select Item 2.3, Item 2.2, Item 2.1
    await page.keyboard.down("Shift");
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("ArrowUp");
    }
    await page.keyboard.up("Shift");

    // press tab to indent Item 2.1, Item 2.2, Item 2.3
    await page.keyboard.press("Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert multiple single outdents from a top level list into the root document (two items)", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        // top level list: Item 1, Item 2, Item 3, Item 4, Item 5
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
                // nested list under Item 2: Item 2.1, Item 2.3, Item 2.4
                {
                  type: "orderedList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.1" }],
                        },
                        // nested list under Item 2.1: Item 2.2
                        {
                          type: "orderedList",
                          content: [
                            {
                              type: "listItem",
                              content: [
                                {
                                  type: "paragraph",
                                  content: [{ type: "text", text: "Item 2.2" }],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.3" }],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.4" }],
                        },
                      ],
                    },
                  ],
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 5" }],
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

    // go up to Item 2
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press("ArrowUp");
    }

    // press shift+tab to outdent Item 2
    await page.keyboard.press("Shift+Tab");

    // go down to Item 3
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
    }

    // press shift+tab to outdent Item 3
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert multiple single outdents from a nested list into the top level list (two items from the same nested list)", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        // top level list: Item 1, Item 2, Item 3, Item 4, Item 5
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
                // nested list under Item 2: Item 2.1, Item 2.2, Item 2.3, Item 2.4
                {
                  type: "orderedList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.1" }],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.2" }],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.3" }],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.4" }],
                        },
                      ],
                    },
                  ],
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 5" }],
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

    // go up to Item 2.2
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowUp");
    }

    // press shift+tab to outdent Item 2.2
    await page.keyboard.press("Shift+Tab");

    // go down to Item 2.3
    await page.keyboard.press("ArrowDown");

    // press shift+tab to outdent Item 2.3
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert multiple single outdents from a nested list into the top level list (two items from different nested lists)", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        // top level list: Item 1, Item 2, Item 3, Item 4, Item 5
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
                // nested list under Item 2: Item 2.1, Item 2.3, Item 2.4
                {
                  type: "orderedList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.1" }],
                        },
                        // nested list under Item 2.1: Item 2.2
                        {
                          type: "orderedList",
                          content: [
                            {
                              type: "listItem",
                              content: [
                                {
                                  type: "paragraph",
                                  content: [{ type: "text", text: "Item 2.2" }],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.3" }],
                        },
                      ],
                    },
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Item 2.4" }],
                        },
                      ],
                    },
                  ],
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
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 5" }],
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

    // go up to Item 2.2
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowUp");
    }

    // press shift+tab to outdent Item 2.2
    await page.keyboard.press("Shift+Tab");

    // go up to Item 2.1
    await page.keyboard.press("ArrowUp");

    // press shift+tab to outdent Item 2.1
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Create a bullet list with an input rule after a paragraph split, and revert", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Item One" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Item Two" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    expect(await editorPage.editor.locator("ul").count()).toBe(0);

    // press Enter to create a new Paragraph
    await page.keyboard.press("Enter");

    // create a new bullet list
    await page.keyboard.type("- ");

    expect(await editorPage.editor.locator("ul").count()).toBe(1);

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Create an ordered list with an input rule after a paragraph split, and revert", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Item One" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Item Two" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    expect(await editorPage.editor.locator("ol").count()).toBe(0);

    // press Enter to create a new Paragraph
    await page.keyboard.press("Enter");

    // create a new ordered list
    await page.keyboard.type("1. ");

    expect(await editorPage.editor.locator("ol").count()).toBe(1);

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Moving an add-marked list item does not add a move mark", async ({
    page,
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
          ],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    // press Enter to create a new list item
    await page.keyboard.press("Enter");

    // press shift+tab to outdent the new item
    await page.keyboard.press("Shift+Tab");

    const structureMarks = (
      await page.evaluate(() => window.pmEditor.getProseMirrorMarksJSON())
    ).filter(isStructureMark);

    expect(structureMarks).toHaveLength(1);
    expect(structureMarks[0]?.attrs.data.op.op).toBe("add");
  });

  test("Moving an accepted add-marked list item creates a move mark", async ({
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
          ],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    // press Enter to create a new list item
    await page.keyboard.press("Enter");

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    await editorPage.applyAll();

    // press shift+tab to outdent the accepted item
    await page.keyboard.press("Shift+Tab");

    const structureMarks = (
      await page.evaluate(() => window.pmEditor.getProseMirrorMarksJSON())
    ).filter(isStructureMark);

    expect(structureMarks).toHaveLength(1);
    expect(structureMarks[0]?.attrs.data.op.op).toBe("move");
  });

  test("Revert a moved add-marked list item", async ({
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
          ],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    // press Enter to create a new list item
    await page.keyboard.press("Enter");

    // press shift+tab to outdent the new item
    await page.keyboard.press("Shift+Tab");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Create a list using an input rule, indent a middle item to create a nested list, and revert", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Item One" }],
        },
      ],
    });

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    expect(await editorPage.editor.locator("ul").count()).toBe(0);

    // press Enter to create a new Paragraph
    await page.keyboard.press("Enter");

    // create a new list
    await page.keyboard.type("- ");

    expect(await editorPage.editor.locator("ul").count()).toBe(1);
    expect(await editorPage.editor.locator("li").count()).toBe(1);

    // fill Item 1
    await page.keyboard.type("Item 1");

    // create Item 2
    await page.keyboard.press("Enter");
    await page.keyboard.type("Item 2");

    // create Item 3
    await page.keyboard.press("Enter");
    await page.keyboard.type("Item 3");

    expect(await editorPage.editor.locator("ul").count()).toBe(1);
    expect(await editorPage.editor.locator("li").count()).toBe(3);

    // indent Item 2
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Tab");

    expect(await editorPage.editor.locator("ul").count()).toBe(2);
    expect(await editorPage.editor.locator("li").count()).toBe(3);

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });
});
