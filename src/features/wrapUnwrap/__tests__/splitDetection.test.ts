import { describe, expect, it } from "vitest";
import { type Node } from "prosemirror-model";

import { createSchema } from "../../../testing/e2eTestSchema.js";
import { suggestStructureChanges } from "../structureChangesPlugin.js";
import { type StructuralContextPath } from "../types.js";

const schema = createSchema();
const listStructures = [
  ["orderedList", "listItem"],
  ["bulletList", "listItem"],
] satisfies StructuralContextPath[];

function structureMarkCount(doc: Node) {
  let count = 0;
  doc.descendants((node) => {
    count += node.marks.filter((mark) => mark.type.name === "structure").length;
  });
  return count;
}

function structureAddMarkJSON(id = 1) {
  return {
    type: "structure",
    attrs: {
      id,
      data: { op: { op: "add" } },
    },
  };
}

describe("structural context direct child matching", () => {
  it("keeps a new paragraph directly under a list item as a Structure add", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "one" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "one" }],
                },
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(structureMarkCount(result.transform.doc)).toBe(1);

    const addedParagraph = result.transform.doc.child(0).child(0).child(1);
    const structureMark = addedParagraph.marks.find(
      (mark) => mark.type.name === "structure",
    );

    expect(addedParagraph.attrs["id"]).toBe("paragraph-2");
    expect(structureMark?.attrs["data"]).toEqual({
      op: { op: "add" },
      role: "primary",
    });
  });

  it("ignores a new hard break nested inside a paragraph under a list item", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "one" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [
                    { type: "text", text: "one" },
                    { type: "hardBreak", attrs: { id: "hard-break-1" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(false);
    expect(result.reason).toBeUndefined();
    expect(structureMarkCount(result.transform.doc)).toBe(0);
  });
});

describe("detect splits to hand off to the main plugin", () => {
  it("falls through when a new paragraph is split-derived inside an existing list item", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "HelloWorld" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "Hello" }],
                },
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                  content: [{ type: "text", text: "World" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(false);
    expect(result.reason).toBe("split-derived-add");
    expect(structureMarkCount(result.transform.doc)).toBe(0);
  });

  it("falls through when a new list item is split-derived from its previous sibling", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "test item" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "test " }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: { id: "item-2" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                  content: [{ type: "text", text: "item" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(false);
    expect(result.reason).toBe("split-derived-add");
    expect(structureMarkCount(result.transform.doc)).toBe(0);
  });

  it("keeps an empty new node as a Structure add suggestion", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "test item" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "test item" }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: { id: "item-2" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(structureMarkCount(result.transform.doc)).toBe(1);
  });

  it("does not match split-derived text from a non-adjacent previous sibling", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "abc" }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: { id: "item-2" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                  content: [{ type: "text", text: "middle" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  content: [{ type: "text", text: "a" }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: { id: "item-2" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                  content: [{ type: "text", text: "middle" }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: { id: "item-3" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-3" },
                  content: [{ type: "text", text: "bc" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(structureMarkCount(result.transform.doc)).toBe(1);
  });

  it("keeps a new paragraph as a Structure add when previous sibling was a Structure add", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  marks: [structureAddMarkJSON()],
                  content: [{ type: "text", text: "HelloWorld" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  marks: [structureAddMarkJSON()],
                  content: [{ type: "text", text: "Hello" }],
                },
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                  content: [{ type: "text", text: "World" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(structureMarkCount(result.transform.doc)).toBe(2);
  });

  it("keeps a new list item as a Structure add when previous sibling was a Structure add", () => {
    const before = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  marks: [structureAddMarkJSON()],
                  content: [{ type: "text", text: "test item" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const after = schema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "bulletList",
          attrs: { id: "list-1" },
          content: [
            {
              type: "listItem",
              attrs: { id: "item-1" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-1" },
                  marks: [structureAddMarkJSON()],
                  content: [{ type: "text", text: "test " }],
                },
              ],
            },
            {
              type: "listItem",
              attrs: { id: "item-2" },
              content: [
                {
                  type: "paragraph",
                  attrs: { id: "paragraph-2" },
                  content: [{ type: "text", text: "item" }],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = suggestStructureChanges(before, after, listStructures);

    expect(result.handled).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(structureMarkCount(result.transform.doc)).toBe(2);
  });
});
