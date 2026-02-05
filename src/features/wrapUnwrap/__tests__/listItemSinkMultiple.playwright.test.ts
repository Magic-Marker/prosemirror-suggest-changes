import { expect, test } from "@playwright/test";
import { eq } from "prosemirror-test-builder";
import { schema } from "../../../testing/testBuilders.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { finalDocWithMarks, initialDoc } from "./listItemSinkMultiple.data.js";
import { ListItemSinkMultiplePage } from "./listItemSinkMultiple.page.js";

test.describe("sink multiple list items into nested list | [ReplaceAroundStep]", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test-fixtures/keyboard-test.html");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await page.waitForFunction(() => window.pmEditor !== undefined);
    await page.locator("#editor .ProseMirror").click();
  });

  test("should revert the sink by reverting a structure suggestion", async ({
    page,
  }) => {
    await setupDocFromJSON(page, finalDocWithMarks.toJSON());
    const currentDocJSON = await page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    const currentDoc = schema.nodeFromJSON(currentDocJSON);
    expect(eq(currentDoc, finalDocWithMarks)).toBeTruthy();

    await page.evaluate(() => {
      window.pmEditor.revertStructureSuggestion(1);
    });

    const finalDocJSON = await page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    const finalDoc = schema.nodeFromJSON(finalDocJSON);
    expect(eq(finalDoc, initialDoc)).toBeTruthy();
  });

  test("should revert 3 changes (initial state -> list item sink -> list item join -> paragraph join) in reverse order", async ({
    page,
  }) => {
    const listItemSinkMultiplePage = new ListItemSinkMultiplePage(page);

    await listItemSinkMultiplePage.setup();
    await listItemSinkMultiplePage.sinkMultipleListItems();
    await listItemSinkMultiplePage.joinListItems({ joinParagraphs: true });

    await listItemSinkMultiplePage.revertSuggestion(2);
    await listItemSinkMultiplePage.revertSuggestion(2, { structure: true });
    await listItemSinkMultiplePage.revertSuggestion(1, { structure: true });

    expect(await listItemSinkMultiplePage.getCurrentDocJSON()).toEqual(
      listItemSinkMultiplePage.getInitialDocJSON(),
    );
  });

  test("should revert 2 changes (list item sink -> list item join) in reverse order", async ({
    page,
  }) => {
    const listItemSinkMultiplePage = new ListItemSinkMultiplePage(page);

    await listItemSinkMultiplePage.setup();
    await listItemSinkMultiplePage.sinkMultipleListItems();
    await listItemSinkMultiplePage.joinListItems({ joinParagraphs: false });

    await listItemSinkMultiplePage.revertSuggestion(2, { structure: true });
    await listItemSinkMultiplePage.revertSuggestion(1, { structure: true });

    expect(await listItemSinkMultiplePage.getCurrentDocJSON()).toEqual(
      listItemSinkMultiplePage.getInitialDocJSON(),
    );
  });

  test("should revert 2 changes (initial state -> lift item sink -> list item join) in forward order", async ({
    page,
  }) => {
    const listItemSinkMultiplePage = new ListItemSinkMultiplePage(page);

    await listItemSinkMultiplePage.setup();
    await listItemSinkMultiplePage.sinkMultipleListItems();
    await listItemSinkMultiplePage.joinListItems({ joinParagraphs: false });

    const initialDocJSON = listItemSinkMultiplePage.getInitialDocJSON();

    await listItemSinkMultiplePage.revertSuggestion(1, { structure: true });
    expect(await listItemSinkMultiplePage.getCurrentDocJSON()).not.toEqual(
      initialDocJSON,
    );

    await listItemSinkMultiplePage.revertSuggestion(2, { structure: true });
    expect(await listItemSinkMultiplePage.getCurrentDocJSON()).toEqual(
      initialDocJSON,
    );
  });

  test("should revert 3 changes (initial state -> lift item sink -> list item join -> paragraph join) in 1-3-2 order", async ({
    page,
  }) => {
    const listItemSinkMultiplePage = new ListItemSinkMultiplePage(page);

    await listItemSinkMultiplePage.setup();
    await listItemSinkMultiplePage.sinkMultipleListItems();
    await listItemSinkMultiplePage.joinListItems({ joinParagraphs: true });

    const initialDocJSON = listItemSinkMultiplePage.getInitialDocJSON();

    await listItemSinkMultiplePage.revertSuggestion(1, { structure: true });
    expect(await listItemSinkMultiplePage.getCurrentDocJSON()).not.toEqual(
      initialDocJSON,
    );

    await listItemSinkMultiplePage.revertSuggestion(2);
    expect(await listItemSinkMultiplePage.getCurrentDocJSON()).not.toEqual(
      initialDocJSON,
    );

    await listItemSinkMultiplePage.revertSuggestion(2, { structure: true });
    expect(await listItemSinkMultiplePage.getCurrentDocJSON()).toEqual(
      initialDocJSON,
    );
  });
});
