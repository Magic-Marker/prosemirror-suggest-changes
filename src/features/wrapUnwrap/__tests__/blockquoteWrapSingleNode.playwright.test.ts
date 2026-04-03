import { expect, test } from "@playwright/test";
import { eq } from "prosemirror-test-builder";
import { schema } from "../../../testing/testBuilders.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import {
  finalDocWithMarks,
  initialDoc,
} from "./blockquoteWrapSingleNode.data.js";

test.describe("wrap a single node with a blockquote | [ReplaceAroundStep]", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto("/test-fixtures/keyboard-test.html");

    // Wait for the editor to be initialized
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await page.waitForFunction(() => window.pmEditor !== undefined);

    // Focus the editor
    await page.locator("#editor .ProseMirror").click();
  });

  test("should revert the wrap of a paragraph in a blockquote by reverting a structure suggestion", async ({
    page,
  }) => {
    // set up doc with marks
    await setupDocFromJSON(page, finalDocWithMarks.toJSON());
    const currentDocJSON = await page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    const currentDoc = schema.nodeFromJSON(currentDocJSON);
    expect(eq(currentDoc, finalDocWithMarks)).toBeTruthy();

    // revert structure suggestion
    await page.evaluate(() => {
      window.pmEditor.revertStructureSuggestion(1);
    });

    // grab final doc
    const finalDocJSON = await page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    const finalDoc = schema.nodeFromJSON(finalDocJSON);

    // verify that the final doc is reverted to some initial doc
    expect(eq(finalDoc, initialDoc)).toBeTruthy();
  });
});
