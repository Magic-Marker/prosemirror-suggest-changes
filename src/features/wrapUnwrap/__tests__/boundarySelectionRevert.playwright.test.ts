import { test, expect } from "../../../__tests__/playwrightBaseTest.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { EditorPage } from "../../../__tests__/playwrightPage.js";
import { eq } from "prosemirror-test-builder";
import type { Page } from "@playwright/test";

const listBoundaryDoc = {
  type: "doc",
  content: [
    {
      type: "orderedList",
      content: [1, 2, 3, 4, 5].map((index) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: `Item ${String(index)}` }],
          },
        ],
      })),
    },
  ],
};

const enterBoundaryDeleteStep = { stepType: "replace", from: 17, to: 27 };

const enterBoundarySplitStep = {
  stepType: "replace",
  from: 17,
  to: 17,
  slice: {
    content: [
      { type: "paragraph", attrs: { id: "node-4" } },
      { type: "paragraph", attrs: { id: "node-4" } },
    ],
    openStart: 1,
    openEnd: 1,
  },
  structure: true,
};

const enterAfterListBoundarySelectionSteps = [
  enterBoundaryDeleteStep,
  enterBoundarySplitStep,
];

async function setupListBoundaryDoc(page: Page) {
  await setupDocFromJSON(page, listBoundaryDoc);
  await page.evaluate(() => {
    window.pmEditor.setCursorToEnd();
  });
}

async function dispatchRawSteps(page: Page, steps: object[]) {
  await page.evaluate((steps) => {
    window.pmEditor.dispatchTransactionWithSteps(steps);
  }, steps);
}

async function expectRevertAllRestoresInitialDoc(
  editorPage: EditorPage,
  docJSON: object,
) {
  let docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
  expect(eq(docs.currentDoc, docs.expectedDoc)).not.toBeTruthy();

  await editorPage.revertAll();

  docs = await editorPage.getCurrentAndExpectedDoc(docJSON);
  expect(eq(docs.currentDoc, docs.expectedDoc)).toBeTruthy();
}

test.describe("Structure changes with boundary selections", () => {
  test("Revert all after pressing Enter on a list boundary selection", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupListBoundaryDoc(page);

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    // Move to Item 3, then select from the "Item| 3" boundary up to Item 2.
    await page.evaluate(() => {
      let item3Boundary: number | undefined;
      window.pmEditor.view.state.doc.descendants((node, pos) => {
        if (item3Boundary !== undefined || !node.isTextblock) return true;
        if (node.textContent !== "Item 3") return true;

        item3Boundary = pos + "Item".length + 1;
        return false;
      });

      if (item3Boundary === undefined) {
        throw new Error("Could not find Item 3");
      }

      window.pmEditor.setCursorToPosition(item3Boundary);
      window.pmEditor.view.focus();
    });

    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.up("Shift");

    await page.keyboard.press("Enter");

    await expectRevertAllRestoresInitialDoc(editorPage, docJSON);
  });

  test("Revert all after dispatching only the deletion half of list boundary Enter", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupListBoundaryDoc(page);

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    await dispatchRawSteps(page, [enterBoundaryDeleteStep]);

    await expectRevertAllRestoresInitialDoc(editorPage, docJSON);
  });

  test("Revert all after dispatching list boundary Enter steps separately", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupListBoundaryDoc(page);

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    await dispatchRawSteps(page, [enterBoundaryDeleteStep]);
    await dispatchRawSteps(page, [enterBoundarySplitStep]);

    await expectRevertAllRestoresInitialDoc(editorPage, docJSON);
  });

  test("Revert all after dispatching list boundary Enter steps together", async ({
    page,
    deletionMarksVisibility,
  }) => {
    await setupListBoundaryDoc(page);

    const editorPage = new EditorPage(page, deletionMarksVisibility);
    const docJSON = await editorPage.getDocJSON();

    await dispatchRawSteps(page, enterAfterListBoundarySelectionSteps);

    await expectRevertAllRestoresInitialDoc(editorPage, docJSON);
  });
});
