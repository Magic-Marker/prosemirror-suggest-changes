import { type Locator, type Page } from "@playwright/test";

export class EditorPage {
  readonly page: Page;

  private readonly selectors = {
    editor: '[data-testid="main-editor"]',
  };

  constructor(page: Page) {
    this.page = page;
  }

  get editor(): Locator {
    return this.page.locator(this.selectors.editor);
  }

  async getParagraphText(index: number): Promise<string> {
    return await this.page.evaluate(
      ({ index }) => {
        return window.pmEditor.getTextContentOfChildAtIndex(index);
      },
      { index },
    );
  }

  async getParagraphCount(): Promise<number> {
    return await this.editor.locator("p").count();
  }

  async getProseMirrorMarkCount(name: string): Promise<number> {
    return await this.page.evaluate(
      ({ name }) => {
        return window.pmEditor.getProseMirrorMarkCount(name);
      },
      { name },
    );
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
}
