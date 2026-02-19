import { expect, test as base } from "@playwright/test";
import { eq } from "prosemirror-test-builder";
import { schema } from "../../../testing/testBuilders.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import { finalDocWithMarks, initialDoc } from "./listItemSinkMultiple.data.js";
import { ListItemSinkMultiplePage } from "./listItemSinkMultiple.page.js";

// Extend basic test by providing a "listPage" fixture.

const test = base.extend<{ listPage: ListItemSinkMultiplePage }>({
  listPage: async ({ page }, use) => {
    const listPage = new ListItemSinkMultiplePage(page);
    await use(listPage);
  },
});

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
      window.pmEditor.revertSuggestion(1, { structure: true });
    });

    const finalDocJSON = await page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    const finalDoc = schema.nodeFromJSON(finalDocJSON);
    expect(eq(finalDoc, initialDoc)).toBeTruthy();
  });

  test.describe("should revert 2 changes (initial state -> nested list sink -> list item join)", () => {
    test.beforeEach(async ({ listPage }) => {
      await listPage.setup();
      await listPage.sinkNestedList();
      await listPage.joinListItemsInNestedList({
        joinParagraphs: false,
      });
    });

    test("should revert in forward order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in reverse order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });
  });

  test.describe("should revert 3 changes (initial state -> nested list sink -> list item join -> paragraph join)", () => {
    // the third suggestion has id=2 because it swallowed the second suggestion
    // so first revert of id=2 is reverting a third change
    // and second revert of id=2 is reverting a second change

    test.beforeEach(async ({ listPage }) => {
      await listPage.setup();
      await listPage.sinkNestedList();
      await listPage.joinListItemsInNestedList({
        joinParagraphs: true,
      });
    });

    test.skip("should revert in forward order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      // todo: this is not the forward order 1-2-3, but rather 1-3-2
      // the reason is that 3rd change (join) swallows one of the marks from the 2nd change
      // ideally trying to revert change 2 should detect that, and revert 3, then 2

      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: false });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in reverse order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(2, { structure: false });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in 1-3-2 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: false });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in 3-1-2 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(2, { structure: false });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test.skip("should revert in 2-3-1 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      // todo: reverting change #3 first here,
      // cannot revert change #2 first, because change #3 swallows a mark from change #2
      // reverting change #2 should probably detect that

      await listPage.revertSuggestion(2, { structure: false });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test.skip("should revert in 2-1-3 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      // todo: reverting change #3 first here,
      // cannot revert change #2 first, because change #3 swallows a mark from change #2
      // reverting change #2 should probably detect that

      await listPage.revertSuggestion(2, { structure: false });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });
  });

  test.describe("should revert 3 changes (initial state -> nested list sink -> middle nested list item lift)", () => {
    test.beforeEach(async ({ listPage }) => {
      await listPage.setup();
      await listPage.sinkNestedList();
      await listPage.liftMiddleItemOfNestedList();
    });

    test("should revert in forward order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      // when reverting the first change, it detects that it needs to also revert later changes #2 and #3
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in reverse order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(3, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in 1-3-2 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      // when reverting the first change, it detects that it needs to also revert later changes #2 and #3
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in 3-1-2 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(3, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      // reverting change #1 should detect that it needs to also revert change #2
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in 2-3-1 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      // reverting change #2 should detect that it needs to also revert change #3
      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });

    test("should revert in 2-1-3 order", async ({ listPage }) => {
      const initialDocJSON = listPage.getInitialDocJSON();

      await listPage.revertSuggestion(2, { structure: true });
      expect(await listPage.getCurrentDocJSON()).not.toEqual(initialDocJSON);
      // reverting change #1 should detect that it needs to also revert change #3
      await listPage.revertSuggestion(1, { structure: true });
      expect(await listPage.getCurrentDocJSON()).toEqual(initialDocJSON);
    });
  });
});
