import { expect, test } from "@playwright/test";
import { eq } from "prosemirror-test-builder";
import { schema } from "../../../testing/testBuilders.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import {
  finalDocWithMarks,
  initialDoc,
} from "./nestedListItemLiftToOuter.data.js";

test.describe("lift nested list item to outer list | [ReplaceAroundStep, ReplaceAroundStep]", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test-fixtures/keyboard-test.html");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await page.waitForFunction(() => window.pmEditor !== undefined);
    await page.locator("#editor .ProseMirror").click();
  });

  test("should revert the lift by reverting a structure suggestion", async ({
    page,
  }) => {
    await setupDocFromJSON(page, finalDocWithMarks.toJSON());
    const currentDocJSON = await page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    const currentDoc = schema.nodeFromJSON(currentDocJSON);
    expect(eq(currentDoc, finalDocWithMarks)).toBeTruthy();

    await page.evaluate(() => {
      window.pmEditor.revertStructureSuggestion(2);
    });

    const finalDocJSON = await page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    const finalDoc = schema.nodeFromJSON(finalDocJSON);
    expect(eq(finalDoc, initialDoc)).toBeTruthy();
  });
});
