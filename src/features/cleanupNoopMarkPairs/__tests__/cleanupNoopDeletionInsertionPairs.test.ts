/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { EditorState } from "prosemirror-state";
import { eq } from "prosemirror-test-builder";
import { assert, describe, it } from "vitest";

import { cleanupNoopDeletionInsertionPairs, type Range } from "../index.js";
import {
  type TaggedNode,
  testBuilders,
} from "../../../testing/testBuilders.js";

describe("cleanupNoopDeletionInsertionPairs", () => {
  it("removes equal plain-text no-op pair, leaving one unmarked copy", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, "foo"),
        testBuilders.insertion({ id: 1 }, "foo"),
        "<b>",
      ),
    ) as TaggedNode;

    const result = cleanupDoc(doc, rangeFromTags(doc));

    assert(eq(result, testBuilders.doc(testBuilders.paragraph("foo"))));
  });

  it("removes no-op pair with matching non-suggestion marks, preserving those marks", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, testBuilders.strong("foo")),
        testBuilders.insertion({ id: 1 }, testBuilders.strong("foo")),
        "<b>",
      ),
    ) as TaggedNode;

    const result = cleanupDoc(doc, rangeFromTags(doc));

    assert(
      eq(
        result,
        testBuilders.doc(testBuilders.paragraph(testBuilders.strong("foo"))),
      ),
    );
  });

  it("removes multiple pairs in one transaction", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, "foo"),
        testBuilders.insertion({ id: 1 }, "foo"),
        " middle ",
        testBuilders.deletion({ id: 2 }, "bar"),
        testBuilders.insertion({ id: 2 }, "bar"),
        "<b>",
      ),
    ) as TaggedNode;

    const result = cleanupDoc(doc, rangeFromTags(doc));

    assert(
      eq(result, testBuilders.doc(testBuilders.paragraph("foo middle bar"))),
    );
  });

  it("ignores non-noop pair", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, "foo"),
        testBuilders.insertion({ id: 1 }, "bar"),
        "<b>",
      ),
    ) as TaggedNode;

    const result = cleanupDoc(doc, rangeFromTags(doc));

    assert(eq(result, doc));
  });

  it("ignores structurally invalid candidates", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.insertion({ id: 1 }, "foo"),
        testBuilders.deletion({ id: 1 }, "foo"),
        testBuilders.deletion({ id: 2 }, "bar"),
        testBuilders.insertion({ id: 3 }, "bar"),
        testBuilders.deletion({ id: 4 }, "baz"),
        " gap ",
        testBuilders.insertion({ id: 4 }, "baz"),
        "<b>",
      ),
    ) as TaggedNode;

    const result = cleanupDoc(doc, rangeFromTags(doc));

    assert(eq(result, doc));
  });
});

function cleanupDoc(doc: TaggedNode, ranges: Range[]) {
  const transaction = EditorState.create({ doc }).tr;
  cleanupNoopDeletionInsertionPairs(transaction, ranges);
  return transaction.doc;
}

function rangeFromTags(doc: TaggedNode) {
  return [{ from: doc.tag["a"]!, to: doc.tag["b"]! }];
}
