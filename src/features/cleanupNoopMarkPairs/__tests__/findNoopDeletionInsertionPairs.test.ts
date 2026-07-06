/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { assert, describe, it } from "vitest";

import {
  findNoopDeletionInsertionPairs,
  type Range,
  type SuggestionPair,
} from "../index.js";
import {
  type TaggedNode,
  testBuilders,
} from "../../../testing/testBuilders.js";

describe("findNoopDeletionInsertionPairs", () => {
  it("returns a pair for equal deletion/insertion text with no remaining marks", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, "foo"),
        testBuilders.insertion({ id: 1 }, "foo"),
        "<b>",
      ),
    ) as TaggedNode;

    assert.deepEqual(simplifyPairs(doc, rangeFromTags(doc)), [
      {
        id: 1,
        deletion: "foo",
        insertion: "foo",
      },
    ]);
  });

  it("returns a pair when equivalent content has different incidental text-node segmentation", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1, type: "first" }, "f"),
        testBuilders.deletion({ id: 1, type: "second" }, "oo"),
        testBuilders.insertion({ id: 1 }, "foo"),
        "<b>",
      ),
    ) as TaggedNode;

    assert.deepEqual(simplifyPairs(doc, rangeFromTags(doc)), [
      {
        id: 1,
        deletion: "foo",
        insertion: "foo",
      },
    ]);
  });

  it("returns a pair when equal text has the same non-suggestion mark boundaries", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, "fo"),
        testBuilders.deletion({ id: 1 }, testBuilders.strong("o")),
        testBuilders.insertion({ id: 1 }, "fo"),
        testBuilders.insertion({ id: 1 }, testBuilders.strong("o")),
        "<b>",
      ),
    ) as TaggedNode;

    assert.deepEqual(simplifyPairs(doc, rangeFromTags(doc)), [
      {
        id: 1,
        deletion: "foo",
        insertion: "foo",
      },
    ]);
  });

  it("ignores same text with different non-suggestion mark boundaries", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, "fo"),
        testBuilders.deletion({ id: 1 }, testBuilders.strong("o")),
        testBuilders.insertion({ id: 1 }, "f"),
        testBuilders.insertion({ id: 1 }, testBuilders.strong("oo")),
        "<b>",
      ),
    ) as TaggedNode;

    assert.deepEqual(simplifyPairs(doc, rangeFromTags(doc)), []);
  });

  it("ignores same text with different mark attrs", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion(
          { id: 1 },
          testBuilders.difficulty({ level: "beginner" }, "foo"),
        ),
        testBuilders.insertion(
          { id: 1 },
          testBuilders.difficulty({ level: "advanced" }, "foo"),
        ),
        "<b>",
      ),
    ) as TaggedNode;

    assert.deepEqual(simplifyPairs(doc, rangeFromTags(doc)), []);
  });

  it("ignores different text", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "<a>",
        testBuilders.deletion({ id: 1 }, "foo"),
        testBuilders.insertion({ id: 1 }, "bar"),
        "<b>",
      ),
    ) as TaggedNode;

    assert.deepEqual(simplifyPairs(doc, rangeFromTags(doc)), []);
  });

  it("preserves structural filters", () => {
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
        testBuilders.deletion({ id: 5 }, "qux"),
        "<split>",
        testBuilders.insertion({ id: 5 }, "qux"),
        "<b>",
      ),
    ) as TaggedNode;

    assert.deepEqual(
      simplifyPairs(doc, [
        { from: doc.tag["a"]!, to: doc.tag["split"]! },
        { from: doc.tag["split"]!, to: doc.tag["b"]! },
        { from: doc.tag["a"]!, to: doc.tag["b"]! },
      ]),
      [
        {
          id: 5,
          deletion: "qux",
          insertion: "qux",
        },
      ],
    );
  });
});

function simplifyPairs(doc: TaggedNode, ranges: Range[]) {
  return findNoopDeletionInsertionPairs(doc, ranges).map((pair) =>
    simplifyPair(doc, pair),
  );
}

function simplifyPair(doc: TaggedNode, pair: SuggestionPair) {
  return {
    id: pair.deletion.id,
    deletion: doc.textBetween(pair.deletion.from, pair.deletion.to),
    insertion: doc.textBetween(pair.insertion.from, pair.insertion.to),
  };
}

function rangeFromTags(doc: TaggedNode) {
  return [{ from: doc.tag["a"]!, to: doc.tag["b"]! }];
}
