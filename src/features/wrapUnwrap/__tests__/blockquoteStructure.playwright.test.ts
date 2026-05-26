import { test, expect } from "../../../__tests__/playwrightBaseTest.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { eq } from "prosemirror-test-builder";
import { isStructureMark } from "../types.js";

const paragraphDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Paragraph One" }],
    },
  ],
};

const blockquoteDoc = {
  type: "doc",
  content: [
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Quote One" }],
        },
      ],
    },
  ],
};

test.describe("Structure changes in blockquotes", () => {
  test("Revert a single blockquote wrap", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, paragraphDoc);
    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    await page.keyboard.press("ControlOrMeta+U");

    let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

    await editorPage.revertAll();

    docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Apply a single blockquote wrap", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Quote One" }],
        },
      ],
    });
    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await page.keyboard.press("ControlOrMeta+U");

    await editorPage.applyAll();

    const docs = await editorPage.getCurrentAndExpectedDoc({
      type: "doc",
      content: [
        {
          type: "blockquote",
          attrs: { id: "node-2" },
          content: [
            {
              type: "paragraph",
              attrs: { id: "node-1" },
              content: [{ type: "text", text: "Quote One" }],
            },
          ],
        },
      ],
    });
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Unwrapping a previously wrapped paragraph cancels the inverse move", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, paragraphDoc);

    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    await page.keyboard.press("ControlOrMeta+U");
    await page.keyboard.press("ControlOrMeta+L");

    const docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("A new child node added to an existing blockquote with another node structure add mark", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, blockquoteDoc);
    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);

    await page.keyboard.press("Enter");

    const structureMarks = (await editorPage.getProseMirrorMarksJSON()).filter(
      isStructureMark,
    );
    expect(structureMarks).toHaveLength(1);
    expect(structureMarks[0]?.attrs.data.op.op).toBe("add");
  });

  test("Nesting blockquotes marks the paragraph, not the blockquotes, and can be reverted", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, paragraphDoc);
    await page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    await page.keyboard.press("ControlOrMeta+U");
    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(1);

    await page.keyboard.press("ControlOrMeta+U");
    expect(await editorPage.getProseMirrorMarkCount("structure")).toBe(2);

    const structureMarkNodeTypes = await page.evaluate(() => {
      const nodeTypes: string[] = [];
      const { structure } = window.pmEditor.view.state.schema.marks;
      window.pmEditor.view.state.doc.descendants((node) => {
        if (node.marks.some((mark) => mark.type === structure)) {
          nodeTypes.push(node.type.name);
        }
      });
      return nodeTypes;
    });
    expect(structureMarkNodeTypes).toEqual(["paragraph"]);

    await editorPage.revertAll();

    const docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });

  test("Revert an indented list item inside a blockquote", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupDocFromJSON(page, {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "orderedList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Quote item 1" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Quote item 2" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Quote item 3" }],
                    },
                  ],
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

    // Move from Quote item 3 to Quote item 2, then indent Quote item 2 under Quote item 1.
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Tab");

    const structureMarks = (await editorPage.getProseMirrorMarksJSON()).filter(
      isStructureMark,
    );
    expect(structureMarks).toHaveLength(1);
    expect(structureMarks[0]?.attrs.data.op.op).toBe("move");

    await editorPage.revertAll();

    const docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
    expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
  });
});
