import { type Node } from "prosemirror-model";
import { type Locator, type Page } from "@playwright/test";
import { createSchema } from "../testing/e2eTestSchema.js";

export class EditorPage {
  readonly page: Page;
  readonly deletionMarksVisibility: "hidden" | "visible";

  private readonly selectors = {
    editor: '[data-testid="main-editor"]',
  };

  constructor(
    page: Page,
    deletionMarksVisibility: "hidden" | "visible" = "visible",
  ) {
    this.page = page;
    this.deletionMarksVisibility = deletionMarksVisibility;
  }

  get editor(): Locator {
    return this.page.locator(this.selectors.editor);
  }

  async getParagraphText(
    index: number,
    childIndexes?: number[],
  ): Promise<string> {
    return await this.page.evaluate(
      ({ index, childIndexes }) => {
        return window.pmEditor.getTextContentOfChildAtIndex(
          index,
          childIndexes,
        );
      },
      { index, childIndexes },
    );
  }

  getParagraphAt(index: number): Locator {
    return this.editor.locator("p").nth(index);
  }

  async getParagraphCount(): Promise<number> {
    return await this.editor.locator("p").count();
  }

  async getListItemCount(): Promise<number> {
    return await this.editor.locator("li").count();
  }

  async getProseMirrorMarkCount(name: string): Promise<number> {
    return await this.page.evaluate(
      ({ name }) => {
        return window.pmEditor.getProseMirrorMarkCount(name);
      },
      { name },
    );
  }

  async getProseMirrorMarksJSON(): Promise<unknown[]> {
    return await this.page.evaluate(() => {
      return window.pmEditor.getProseMirrorMarksJSON();
    });
  }

  async getProseMirrorSelection(): Promise<{ anchor: number; head: number }> {
    return await this.page.evaluate(() => {
      return window.pmEditor.getProseMirrorSelection();
    });
  }

  async getDOMTextContentOfChildAtIndex(index: number): Promise<string> {
    return await this.page.evaluate(
      ({ index }) => {
        return window.pmEditor.getDOMTextContentOfChildAtIndex(index);
      },
      { index },
    );
  }

  async getDocJSON(): Promise<object> {
    return await this.page.evaluate(() => {
      return window.pmEditor.getDocJSON();
    });
  }

  async getCurrentDoc(): Promise<Node> {
    const schema = createSchema(this.deletionMarksVisibility);
    const currentDocJSON = await this.getDocJSON();
    const currentDoc = schema.nodeFromJSON(currentDocJSON);
    return currentDoc;
  }

  async getCurrentAndExpectedDoc(expectedDocJSON: object) {
    const schema = createSchema(this.deletionMarksVisibility);
    // both docs should be created from the same schema instance,
    // otherwise the eq assertion from prosemirror-test-builders will be falsy
    const expectedDoc = schema.nodeFromJSON(expectedDocJSON);
    const currentDocJSON = await this.getDocJSON();
    const currentDoc = schema.nodeFromJSON(currentDocJSON);
    return { currentDoc, expectedDoc };
  }

  async revertSuggestion(suggestionId: number) {
    await this.doActionAndWaitForState(() =>
      this.page.evaluate(
        ({ suggestionId }) => {
          window.pmEditor.revertSuggestion(suggestionId);
        },
        { suggestionId },
      ),
    );
  }

  async revertAll() {
    await this.page.getByText("Revert all").click();
    await this.page.waitForTimeout(100);
  }

  async applyAll() {
    await this.page.getByText("Apply all").click();
    await this.page.waitForTimeout(100);
  }

  /**
   * Perform an action and wait for ProseMirror state to update.
   * Stores the current state reference before pressing, then polls until
   * editor.view.state is a different object (ProseMirror creates a new
   * immutable state on every transaction).
   */
  private async doActionAndWaitForState(
    action: () => Promise<void>,
    opts?: { waitForSelectionChange?: boolean },
  ): Promise<void> {
    await this.page.evaluate(() => {
      const state = window.pmEditor.view.state;
      window.pmEditor.__prevState = state;
      window.pmEditor.__prevAnchor = state.selection.anchor;
      window.pmEditor.__prevHead = state.selection.head;
    });

    await action();

    if (opts?.waitForSelectionChange) {
      // Wait for selection to actually change. If a transaction fires but
      // selection stays the same (e.g., cursor in hidden marks), retry the
      // keypress until the selection moves.
      const changed = await this.page
        .waitForFunction(
          () => {
            const state = window.pmEditor.view.state;
            if (state === window.pmEditor.__prevState) return false;
            return (
              state.selection.anchor !== window.pmEditor.__prevAnchor ||
              state.selection.head !== window.pmEditor.__prevHead
            );
          },
          this.selectors.editor,
          { timeout: 5000 },
        )
        .then(() => true)
        .catch(() => false);

      if (!changed) {
        // Selection didn't change — retry
        return this.doActionAndWaitForState(action, opts);
      }
    } else {
      await this.page.waitForFunction(() => {
        return window.pmEditor.view.state !== window.pmEditor.__prevState;
      });
    }
  }

  /**
   * Press a key and wait for ProseMirror state to update.
   * Stores the current state reference before pressing, then polls until
   * editor.view.state is a different object (ProseMirror creates a new
   * immutable state on every transaction).
   */
  async pressKey(
    key: string,
    opts?: { waitForSelectionChange?: boolean },
  ): Promise<void> {
    await this.doActionAndWaitForState(
      () => this.page.keyboard.press(key),
      opts,
    );
  }

  /**
   * Insert text and wait for ProseMirror state to update.
   * Stores the current state reference before pressing, then polls until
   * editor.view.state is a different object (ProseMirror creates a new
   * immutable state on every transaction).
   */
  async insertText(
    text: string,
    opts?: { waitForSelectionChange?: boolean },
  ): Promise<void> {
    await this.doActionAndWaitForState(
      () => this.page.keyboard.insertText(text),
      opts,
    );
  }

  /**
   * Press a key multiple times, waiting for editor state update after each press.
   */
  async pressKeyMultiple(
    key: string,
    count: number,
    opts?: { waitForSelectionChange?: boolean },
  ): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.pressKey(key, opts);
    }
  }

  async setNextNodeId(nextNodeId: number) {
    await this.page.evaluate((nextNodeId) => {
      window.pmEditor.setNextNodeId(nextNodeId);
    }, nextNodeId);
  }
}
