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

  async revertAll() {
    await this.page.getByText("Revert all").click();
    await this.page.waitForTimeout(100);
  }

  async applyAll() {
    await this.page.getByText("Apply all").click();
    await this.page.waitForTimeout(100);
  }
}
