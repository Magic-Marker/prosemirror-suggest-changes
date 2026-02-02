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

  async sinkMultipleListItems() {
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

  async joinListItems({
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

  async revertSuggestion(
    suggestionId: SuggestionId,
    opts?: { structure?: boolean },
  ) {
    if (opts?.structure) {
      await this.page.evaluate((suggestionId) => {
        window.pmEditor.revertStructureSuggestion(suggestionId);
      }, suggestionId);
    } else {
      await this.page.evaluate((suggestionId) => {
        window.pmEditor.revertSuggestion(suggestionId);
      }, suggestionId);
    }
  }

  async getCurrentDocJSON() {
    return await this.page.evaluate(() => window.pmEditor.getDocJSON());
  }

  getInitialDocJSON() {
    return initialDoc.toJSON() as object;
  }
}
