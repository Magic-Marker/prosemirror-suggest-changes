import { type Node } from "prosemirror-model";
import { EditorState, NodeSelection, TextSelection } from "prosemirror-state";
import { assert, describe, it } from "vitest";
import { ZWSP } from "../../constants.js";
import { type TaggedNode, testBuilders } from "../../testing/testBuilders.js";
import { ensureSelection } from "./ensureSelectionPlugin.js";

function createState(doc: Node, selection: TextSelection) {
  return EditorState.create({
    doc,
    selection,
    plugins: [ensureSelection()],
  });
}

function applyTextSelection(state: EditorState, anchor: number, head = anchor) {
  const selection = TextSelection.create(state.doc, anchor, head);
  const transaction = state.tr.setSelection(selection);
  return state.apply(transaction);
}

function assertTextSelection(
  state: EditorState,
  anchor: number,
  head = anchor,
) {
  assert(state.selection instanceof TextSelection);
  assert.equal(state.selection.anchor, anchor);
  assert.equal(state.selection.head, head);
}

function getTag(doc: TaggedNode, tag: string) {
  const pos = doc.tag[tag];
  assert(pos !== undefined, `Expected tag "${tag}" to exist`);
  return pos;
}

describe("ensureSelection", () => {
  it("leaves valid text selections unchanged", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("one<from>"),
      testBuilders.paragraph("two<to>"),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "from")),
    );

    const nextState = applyTextSelection(state, getTag(doc, "to"));

    assertTextSelection(nextState, getTag(doc, "to"));
  });

  it("ignores non-text selections", () => {
    const doc = testBuilders.doc(
      testBuilders.image({ src: "https://example.com/image.png" }),
      testBuilders.paragraph("after<cursor>"),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "cursor")),
    );

    const nextState = state.apply(
      state.tr.setSelection(NodeSelection.create(doc, 0)),
    );

    assert(nextState.selection instanceof NodeSelection);
    assert.equal(nextState.selection.anchor, 0);
  });

  it("prefers a valid position in the destination textblock for selection-only movement", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("Item 2<old>"),
      testBuilders.paragraph(
        testBuilders.insertion({ id: 1 }, "<invalid>" + ZWSP + "<valid>"),
      ),
      testBuilders.paragraph(testBuilders.insertion({ id: 1 }, ZWSP), "Item 3"),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "old")),
    );

    const nextState = applyTextSelection(state, getTag(doc, "invalid"));

    assertTextSelection(nextState, getTag(doc, "valid"));
  });

  it("uses direction fallback when the transaction changes the document", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("<markStart>A<expected><markEnd>"),
      testBuilders.paragraph(
        testBuilders.insertion({ id: 1 }, "<invalid>" + ZWSP + "<sameParent>"),
      ),
      testBuilders.paragraph(
        testBuilders.insertion({ id: 1 }, ZWSP),
        "<old>Item 3",
      ),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "old")),
    );

    const transaction = state.tr;
    transaction.addMark(
      getTag(doc, "markStart"),
      getTag(doc, "markEnd"),
      testBuilders.schema.marks.strong.create(),
    );
    transaction.setSelection(
      TextSelection.create(transaction.doc, getTag(doc, "invalid")),
    );
    const nextState = state.apply(transaction);

    assertTextSelection(nextState, getTag(doc, "expected"));
  });

  it("uses direction fallback for invalid positions in the same textblock", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "A",
        testBuilders.deletion({ id: 1 }, "<expected>B<invalid>"),
        "C<old>",
      ),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "old")),
    );

    const nextState = applyTextSelection(state, getTag(doc, "invalid"));

    assertTextSelection(nextState, getTag(doc, "expected"));
  });

  it("keeps deletion anchor and non-anchor deletion positions continuous", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        testBuilders.deletion(
          { id: 1, type: "anchor" },
          "<expected>" + ZWSP + "<invalid>",
        ),
        testBuilders.deletion({ id: 1 }, "deleted"),
        "visible<old>",
      ),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "old")),
    );

    const nextState = applyTextSelection(state, getTag(doc, "invalid"));

    assertTextSelection(nextState, getTag(doc, "expected"));
  });

  it("moves hidden-deletion-style boundary positions to visible content", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("before<old>"),
      testBuilders.paragraph(
        testBuilders.deletion({ id: 1 }, "<invalid>deleted"),
        "v<expected>isible",
      ),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "old")),
    );

    const nextState = applyTextSelection(state, getTag(doc, "invalid"));

    assertTextSelection(nextState, getTag(doc, "expected"));
  });

  it("keeps paired split marker positions attached to textblock boundaries", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph("before<old>"),
      testBuilders.paragraph(
        "content<expected>",
        testBuilders.insertion({ id: 1 }, ZWSP + "<invalid>"),
      ),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "old")),
    );

    const nextState = applyTextSelection(state, getTag(doc, "invalid"));

    assertTextSelection(nextState, getTag(doc, "expected"));
  });

  it("moves positions between adjacent insertion ZWSPs to a valid neighbor", () => {
    const doc = testBuilders.doc(
      testBuilders.paragraph(
        "before<old>",
        testBuilders.insertion(
          { id: 1 },
          "<expected>" + ZWSP + "<invalid>" + ZWSP,
        ),
        "<valid>after",
      ),
    ) as TaggedNode;
    const state = createState(
      doc,
      TextSelection.create(doc, getTag(doc, "old")),
    );

    const nextState = applyTextSelection(state, getTag(doc, "invalid"));

    assertTextSelection(nextState, getTag(doc, "valid"));
  });
});
