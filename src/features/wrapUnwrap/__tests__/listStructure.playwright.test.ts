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
      await page.waitForTimeout(50);
    }

    // move to Item| 3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < " 3".length; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);
    }

    // select Item 3 and Item 2
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(50);
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // press shift+tab to outdent Item 3 and Item 2
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

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
      await page.waitForTimeout(50);
    }

    // press shift+tab to outdent Item 2.2
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

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
      await page.waitForTimeout(50);
    }

    // press shift+tab to outdent Item 1
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

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
      await page.waitForTimeout(50);
    }

    // move to Item| 2.3
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < " 2.3".length; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(50);
    }

    // select Item 2.3, Item 2.2, Item 2.1
    await page.keyboard.down("Shift");
    await page.waitForTimeout(50);
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(50);
    }
    await page.keyboard.up("Shift");
    await page.waitForTimeout(50);

    // press tab to indent Item 2.1, Item 2.2, Item 2.3
    await page.keyboard.press("Tab");
    await page.waitForTimeout(50);

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
      await page.waitForTimeout(50);
    }

    // press shift+tab to outdent Item 2
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

    // go down to Item 3
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(50);
    }

    // press shift+tab to outdent Item 3
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

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
      await page.waitForTimeout(50);
    }

    // press shift+tab to outdent Item 2.2
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

    // go down to Item 2.3
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(50);

    // press shift+tab to outdent Item 2.3
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

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
      await page.waitForTimeout(50);
    }

    // press shift+tab to outdent Item 2.2
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

    // go up to Item 2.1
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(50);

    // press shift+tab to outdent Item 2.1
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(50);

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });
});
