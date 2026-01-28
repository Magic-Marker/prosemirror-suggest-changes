import { expect, test } from "@playwright/test";
import { eq } from "prosemirror-test-builder";
import { testBuilders, schema } from "../../../testing/testBuilders.js";
import { setupDocFromJSON } from "../../../__tests__/playwrightHelpers.js";

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
    const finalDocWithMarks = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.paragraph("Hello World"),
              ),
            ),
          ),
        ),
      ),
    );
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
    const initialDoc = testBuilders.doc(testBuilders.paragraph("Hello World"));
    expect(eq(finalDoc, initialDoc)).toBeTruthy();
  });
});
