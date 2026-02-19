import { expect, type Page } from "@playwright/test";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";
import {
  finalDocWithMarksJSON,
  initialDoc,
} from "./listItemSinkMultiple.data.js";
import { type SuggestionId } from "../../../generateId.js";

export class ListItemSinkMultiplePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setup() {
    await setupDocFromJSON(this.page, initialDoc.toJSON());
    expect(await this.getCurrentDocJSON()).toEqual(this.getInitialDocJSON());
  }

  /**
   * select Item 2.1, Item 2.2, Item 2.3 and press Tab to sink them once, creating a nested list
   */
  async sinkNestedList() {
    await this.page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    // go up to item 2.3
    for (let i = 0; i < 3; i++) {
      await this.page.keyboard.press("ArrowUp");
      await this.page.waitForTimeout(50);
    }

    // select items 2.3, 2.2, 2.1
    await this.page.keyboard.down("Shift");
    await this.page.waitForTimeout(50);
    for (let i = 0; i < 2; i++) {
      await this.page.keyboard.press("ArrowUp");
      await this.page.waitForTimeout(50);
    }
    await this.page.keyboard.up("Shift");
    await this.page.waitForTimeout(50);

    // sink selected items
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(50);

    const currentDocJSON = await this.page.evaluate(() =>
      window.pmEditor.getDocJSON(),
    );
    expect(JSON.stringify(currentDocJSON)).toBe(
      JSON.stringify(finalDocWithMarksJSON),
    );
  }

  /**
   * Go to the beginning of Item 2.3, join it with previous sibling Item 2.2 using Backspace
   * It will produce a single list item with two paragraphs inside
   *
   * @param joinParagraphs - if true, join the paragraphs of the joined list item with a second Backspace press
   */
  async joinListItemsInNestedList({
    joinParagraphs = false,
  }: {
    joinParagraphs?: boolean;
  }) {
    await this.page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    // go to item 2.3
    for (let i = 0; i < 3; i++) {
      await this.page.keyboard.press("ArrowUp");
      await this.page.waitForTimeout(50);
    }

    // go to the beginning of that item
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(50);

    // join the item with item 2.2
    await this.page.keyboard.press("Backspace");
    await this.page.waitForTimeout(50);

    // join the list item paragraphs too
    if (joinParagraphs) {
      await this.page.keyboard.press("Backspace");
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Go to Item 2.2 in a nested list and press Shift+Tab
   * This will split the outer list into two lists
   */
  async liftMiddleItemOfNestedList() {
    await this.page.evaluate(() => {
      window.pmEditor.setCursorToEnd();
    });

    // go to item 2.2
    for (let i = 0; i < 4; i++) {
      await this.page.keyboard.press("ArrowUp");
      await this.page.waitForTimeout(50);
    }

    // lift the item
    await this.page.keyboard.press("Shift+Tab");
    await this.page.waitForTimeout(50);
  }

  async revertSuggestion(
    suggestionId: SuggestionId,
    opts?: { structure: boolean },
  ) {
    await this.page.evaluate(
      ({ suggestionId, opts }) => {
        window.pmEditor.revertSuggestion(suggestionId, opts);
      },
      { suggestionId, opts },
    );
  }

  async getCurrentDocJSON() {
    return await this.page.evaluate(() => window.pmEditor.getDocJSON());
  }

  getInitialDocJSON() {
    return initialDoc.toJSON() as object;
  }
}
