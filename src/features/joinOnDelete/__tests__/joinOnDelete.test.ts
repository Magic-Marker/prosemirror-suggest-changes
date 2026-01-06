/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { Slice } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { eq } from "prosemirror-test-builder";
import { ReplaceStep } from "prosemirror-transform";
import { assert, describe, it } from "vitest";

import { suggestReplaceStep } from "../../../replaceStep.js";
import {
  applySuggestions,
  revertSuggestion,
  revertSuggestions,
} from "../../../commands.js";
import {
  type TaggedNode,
  testBuilders,
} from "../../../testing/testBuilders.js";
import { ZWSP } from "../../../constants.js";

function createJoinStep(
  from: number,
  to: number,
  structure: boolean,
): ReplaceStep {
  return new ReplaceStep(from, to, Slice.empty, structure);
}

describe("handleJoinOnDelete", () => {
  it("should join two sibling paragraphs with ZWSP marker", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("first paragraph<a>"),
      testBuilders.paragraph("<b>second paragraph"),
    ) as TaggedNode;

    const tagA = doc.tag["a"];
    const tagB = doc.tag["b"];
    assert.exists(tagA);
    assert.exists(tagB);

    // Create a structure join step (simulates backspace at block boundary)
    const step = createJoinStep(tagA, tagB, true);
    assert.equal(step.slice.content.size, 0);

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, tagB),
    });

    const tr = editorState.tr;
    const handled = suggestReplaceStep(tr, editorState, doc, step, [], 1);
    assert.isTrue(handled);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.paragraph(
        "first paragraph",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "second paragraph",
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should join heading and paragraph with ZWSP marker", () => {
    const doc = testBuilders.doc(
      testBuilders.heading({ level: 1 }, "heading text<a>"),
      testBuilders.paragraph("<b>paragraph text"),
    ) as TaggedNode;

    const tagA = doc.tag["a"];
    const tagB = doc.tag["b"];
    assert.exists(tagA);
    assert.exists(tagB);

    // Create a structure join step
    const step = createJoinStep(tagA, tagB, true);

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, tagB),
    });

    const tr = editorState.tr;
    suggestReplaceStep(tr, editorState, doc, step, [], 1);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.heading(
        { level: 1 },
        "heading text",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 1 }, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "paragraph text",
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should join multiple different node types with ZWSP markers", () => {
    const doc = testBuilders.doc(
      testBuilders.heading({ level: 1 }, "head<a>ing 1-1"),
      testBuilders.heading({ level: 2 }, "heading 2-1"),
      testBuilders.heading({ level: 3 }, "heading 3-1"),
      testBuilders.paragraph("paragraph 1"),
      testBuilders.paragraph("paragraph 2"),
      testBuilders.paragraph("paragraph 3"),
      testBuilders.heading({ level: 3 }, "heading 3-2"),
      testBuilders.heading({ level: 2 }, "heading 2-2"),
      testBuilders.heading({ level: 1 }, "head<b>ing 1-2"),
    ) as TaggedNode;

    const tagA = doc.tag["a"];
    const tagB = doc.tag["b"];
    assert.exists(tagA);
    assert.exists(tagB);

    const step = createJoinStep(tagA, tagB, false);

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, tagB),
    });

    const tr = editorState.tr;
    suggestReplaceStep(tr, editorState, doc, step, [], 1);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.heading(
        { level: 1 },
        "head",
        testBuilders.deletion({ id: 1 }, "ing 1-1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 1 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 2 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 2-1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 2 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 3 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 3-1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 3 }, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "paragraph 1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "paragraph 2"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "paragraph 3"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "heading", attrs: { level: 3 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 3-2"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 3 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 2 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 2-2"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 2 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 1 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "head"),
        "ing 1-2",
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should join two list items by deleting node boundary (legacy behaviour)", () => {
    const doc = testBuilders.doc(
      testBuilders.bulletList(
        testBuilders.listItem(testBuilders.paragraph("first paragraph")),
        testBuilders.listItem(testBuilders.paragraph("second paragraph")),
      ),
    ) as TaggedNode;

    // this is the step that is created if you place a caret in front of "second" and press backspace
    const step = createJoinStep(19, 21, true);

    const editorState = EditorState.create({
      doc,
    });

    const tr = editorState.tr;
    suggestReplaceStep(tr, editorState, doc, step, [], 1);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.bulletList(
        testBuilders.listItem(
          testBuilders.paragraph("first paragraph"),
          testBuilders.deletion({ id: 1 }, testBuilders.paragraph(ZWSP)),
        ),
        testBuilders.listItem(testBuilders.paragraph("second paragraph")),
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should join two list items by deleting a selection across node boundary (legacy behavior", () => {
    const doc = testBuilders.doc(
      testBuilders.bulletList(
        testBuilders.listItem(testBuilders.paragraph("first paragr<a>aph")),
        testBuilders.listItem(testBuilders.paragraph("sec<b>ond paragraph")),
      ),
    ) as TaggedNode;

    const tagA = doc.tag["a"];
    const tagB = doc.tag["b"];
    assert.exists(tagA);
    assert.exists(tagB);

    // this is the step that is created if you select "aph\nsec"
    const step = createJoinStep(tagA, tagB, false);

    const editorState = EditorState.create({
      doc,
    });

    const tr = editorState.tr;
    suggestReplaceStep(tr, editorState, doc, step, [], 1);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.bulletList(
        testBuilders.listItem(
          testBuilders.paragraph(
            "first paragr",
            testBuilders.deletion({ id: 1 }, `aph`),
          ),
        ),
        testBuilders.listItem(
          testBuilders.paragraph(
            testBuilders.deletion({ id: 1 }, `sec`),
            "ond paragraph",
          ),
        ),
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should join when left paragraph is empty", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("<a>"),
      testBuilders.paragraph("<b>some text"),
    ) as TaggedNode;

    const tagA = doc.tag["a"];
    const tagB = doc.tag["b"];
    assert.exists(tagA);
    assert.exists(tagB);

    const step = createJoinStep(tagA, tagB, true);

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, tagB),
    });

    const tr = editorState.tr;
    suggestReplaceStep(tr, editorState, doc, step, [], 1);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.paragraph(
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "some text",
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should join when right paragraph is empty", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("some text<a>"),
      testBuilders.paragraph("<b>"),
    ) as TaggedNode;

    const tagA = doc.tag["a"];
    const tagB = doc.tag["b"];
    assert.exists(tagA);
    assert.exists(tagB);

    const step = createJoinStep(tagA, tagB, true);

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, tagB),
    });

    const tr = editorState.tr;
    suggestReplaceStep(tr, editorState, doc, step, [], 1);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.paragraph(
        "some text",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should join when both paragraphs are empty", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("<a>"),
      testBuilders.paragraph("<b>"),
    ) as TaggedNode;

    const tagA = doc.tag["a"];
    const tagB = doc.tag["b"];
    assert.exists(tagA);
    assert.exists(tagB);

    const step = createJoinStep(tagA, tagB, true);

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, tagB),
    });

    const tr = editorState.tr;
    suggestReplaceStep(tr, editorState, doc, step, [], 1);

    const newState = editorState.apply(tr);

    const expected = testBuilders.doc(
      testBuilders.paragraph(
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });
});

describe("applyJoinOnDelete", () => {
  it("should apply join by removing ZWSP and modification mark", async () => {
    // Start with a joined paragraph containing ZWSP with join mark
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "first paragraph",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
            newValue: null,
          },
          ZWSP,
        ),
        "second paragraph",
      ),
    );

    const editorState = EditorState.create({ doc });

    const newState = await new Promise<EditorState>((resolve) => {
      applySuggestions(editorState, (tr) => {
        resolve(editorState.apply(tr));
      });
    });

    const expected = testBuilders.doc(
      testBuilders.paragraph("first paragraphsecond paragraph"),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should apply multiple joins by removing multiple ZWSPs and modification marks", async () => {
    // Start with a joined paragraph containing ZWSP with join mark
    const doc = testBuilders.doc(
      testBuilders.heading(
        { level: 1 },
        "first heading",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 1 }, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "first paragraph",
      ),
      testBuilders.paragraph(
        "first paragraph",
        testBuilders.deletion(
          {
            id: 2,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "second paragraph",
      ),
      testBuilders.paragraph(
        "first paragraph",
        testBuilders.deletion(
          {
            id: 3,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "heading", attrs: { level: 2 }, marks: [] },
            },
          },
          ZWSP,
        ),
        "first heading",
      ),
    );

    const editorState = EditorState.create({ doc });

    const newState = await new Promise<EditorState>((resolve) => {
      applySuggestions(editorState, (tr) => {
        resolve(editorState.apply(tr));
      });
    });

    const expected = testBuilders.doc(
      testBuilders.heading({ level: 1 }, "first headingfirst paragraph"),
      testBuilders.paragraph("first paragraphsecond paragraph"),
      testBuilders.paragraph("first paragraphfirst heading"),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });
});

describe("revertJoinOnDelete", () => {
  it("should revert paragraph join back to two paragraphs", async () => {
    // Start with a joined paragraph containing ZWSP with join mark
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "first paragraph",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "second paragraph",
      ),
    );

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.atStart(doc),
    });

    const newState = await new Promise<EditorState>((resolve) => {
      revertSuggestions(editorState, (tr) => {
        resolve(editorState.apply(tr));
      });
    });

    const expected = testBuilders.doc(
      testBuilders.paragraph("first paragraph"),
      testBuilders.paragraph("second paragraph"),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should revert heading-paragraph join back to heading and paragraph", async () => {
    // Start with a joined heading containing ZWSP with join mark
    const doc = testBuilders.doc(
      testBuilders.heading(
        { level: 1 },
        "heading text",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 1 }, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "paragraph text",
      ),
    );

    const editorState = EditorState.create({
      doc,
      selection: TextSelection.atStart(doc),
    });

    const newState = await new Promise<EditorState>((resolve) => {
      revertSuggestions(editorState, (tr) => {
        resolve(editorState.apply(tr));
      });
    });

    const expected = testBuilders.doc(
      testBuilders.heading({ level: 1 }, "heading text"),
      testBuilders.paragraph("paragraph text"),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should revert multiple joins by removing multiple ZWSPs and modification marks and splitting multiple nodes", async () => {
    // Start with a joined paragraph containing ZWSP with join mark
    const doc = testBuilders.doc(
      testBuilders.heading(
        { level: 1 },
        "first heading",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 1 }, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "first paragraph",
      ),
      testBuilders.paragraph(
        "first paragraph",
        testBuilders.deletion(
          {
            id: 2,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "second paragraph",
      ),
      testBuilders.paragraph(
        "first paragraph",
        testBuilders.deletion(
          {
            id: 3,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "heading", attrs: { level: 2 }, marks: [] },
            },
          },
          ZWSP,
        ),
        "second heading",
      ),
    );

    const editorState = EditorState.create({ doc });

    const newState = await new Promise<EditorState>((resolve) => {
      revertSuggestions(editorState, (tr) => {
        resolve(editorState.apply(tr));
      });
    });

    const expected = testBuilders.doc(
      testBuilders.heading({ level: 1 }, "first heading"),
      testBuilders.paragraph("first paragraph"),
      testBuilders.paragraph("first paragraph"),
      testBuilders.paragraph("second paragraph"),
      testBuilders.paragraph("first paragraph"),
      testBuilders.heading({ level: 2 }, "second heading"),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should revert multiple different joined node types", async () => {
    const doc = testBuilders.doc(
      testBuilders.heading(
        { level: 1 },
        "head",
        testBuilders.deletion({ id: 1 }, "ing 1-1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 1 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 2 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 2-1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 2 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 3 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 3-1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 3 }, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "paragraph 1"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "paragraph 2"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "paragraph 3"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "heading", attrs: { level: 3 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 3-2"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 3 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 2 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "heading 2-2"),
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "heading", attrs: { level: 2 }, marks: [] },
              rightNode: { type: "heading", attrs: { level: 1 }, marks: [] },
            },
          },
          ZWSP,
        ),
        testBuilders.deletion({ id: 1 }, "head"),
        "ing 1-2",
      ),
    ) as TaggedNode;

    const editorState = EditorState.create({ doc });

    const newState = await new Promise<EditorState>((resolve) => {
      revertSuggestions(editorState, (tr) => {
        resolve(editorState.apply(tr));
      });
    });

    const expected = testBuilders.doc(
      testBuilders.heading({ level: 1 }, "heading 1-1"),
      testBuilders.heading({ level: 2 }, "heading 2-1"),
      testBuilders.heading({ level: 3 }, "heading 3-1"),
      testBuilders.paragraph("paragraph 1"),
      testBuilders.paragraph("paragraph 2"),
      testBuilders.paragraph("paragraph 3"),
      testBuilders.heading({ level: 3 }, "heading 3-2"),
      testBuilders.heading({ level: 2 }, "heading 2-2"),
      testBuilders.heading({ level: 1 }, "heading 1-2"),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });

  it("should revert only the specified suggestion when multiple joins exist", async () => {
    // Doc with two join marks having different IDs
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "first",
        testBuilders.deletion(
          {
            id: 1,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "second",
        testBuilders.deletion(
          {
            id: 2,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "third",
      ),
    );

    const editorState = EditorState.create({ doc });

    const newState = await new Promise<EditorState>((resolve) => {
      revertSuggestion(1)(editorState, (tr) => {
        resolve(editorState.apply(tr));
      });
    });

    // Only first join reverted, second remains
    const expected = testBuilders.doc(
      testBuilders.paragraph("first"),
      testBuilders.paragraph(
        "second",
        testBuilders.deletion(
          {
            id: 2,
            type: "join",
            data: {
              leftNode: { type: "paragraph", attrs: {}, marks: [] },
              rightNode: { type: "paragraph", attrs: {}, marks: [] },
            },
          },
          ZWSP,
        ),
        "third",
      ),
    );

    assert(
      eq(newState.doc, expected),
      `Expected ${newState.doc} to match ${expected}`,
    );
  });
});
