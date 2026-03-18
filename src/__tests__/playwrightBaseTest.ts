import { test as base, expect } from "@playwright/test";

export interface TestOptions {
  deletionMarksVisibility: "hidden" | "visible";
}

export const test = base.extend<TestOptions>({
  deletionMarksVisibility: ["visible", { option: true }],

  // Override default "page" fixture.
  page: async ({ page, deletionMarksVisibility }, use) => {
    // This code runs before every test.

    const searchParams = new URLSearchParams({ deletionMarksVisibility });
    // Navigate to the test page
    await page.goto(
      `/test-fixtures/keyboard-test.html?${searchParams.toString()}`,
    );
    // Wait for the editor to be initialized
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    await page.waitForFunction(() => window.pmEditor !== undefined);
    // Focus the editor
    await page.locator("#editor .ProseMirror").click();
    console.log("✅ Base test fixture", "editor loaded and ready", {
      deletionMarksVisibility,
    });

    // Now run the test
    await use(page);

    // This code runs after every test.
  },
});

export { expect };
