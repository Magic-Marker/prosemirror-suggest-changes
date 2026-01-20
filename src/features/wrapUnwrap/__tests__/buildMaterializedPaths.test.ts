import { describe, expect, it } from "vitest";

import { createSchema } from "../../../testing/e2eTestSchema.js";
import { buildMaterializedPaths } from "../buildMaterializedPaths.js";
import { DOC_NODE_ID } from "../constants.js";

const schema = createSchema();

function getListDocJSON(includeHardBreak = false): object {
  return {
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
          {
            type: "listItem",
            attrs: { id: "item-2" },
            content: [
              {
                type: "paragraph",
                attrs: { id: "paragraph-2" },
                content: includeHardBreak
                  ? [
                      { type: "text", text: "two" },
                      { type: "hardBreak", attrs: { id: "hard-break-1" } },
                    ]
                  : [{ type: "text", text: "two" }],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("buildMaterializedPaths", () => {
  it("builds materialized paths", () => {
    const paths = buildMaterializedPaths(schema.nodeFromJSON(getListDocJSON()));

    expect(Object.fromEntries(paths.entries())).toMatchObject({
      "list-1": {
        nodeType: "bulletList",
        chain: [
          {
            nodeId: DOC_NODE_ID,
            nodeType: DOC_NODE_ID,
            nodeAttrs: {},
            nodeMarks: [],
            childSiblingIds: [null, null],
            childIndex: 0,
          },
        ],
      },
      "item-1": {
        nodeType: "listItem",
        chain: [
          {
            nodeId: "list-1",
            nodeType: "bulletList",
            nodeAttrs: { id: "list-1" },
            nodeMarks: [],
            childSiblingIds: [null, "item-2"],
            childIndex: 0,
          },
          {
            nodeId: DOC_NODE_ID,
            nodeType: DOC_NODE_ID,
            nodeAttrs: {},
            nodeMarks: [],
            childSiblingIds: [null, null],
            childIndex: 0,
          },
        ],
      },
      "paragraph-1": {
        nodeType: "paragraph",
        chain: [
          {
            nodeId: "item-1",
            nodeType: "listItem",
            nodeAttrs: { id: "item-1" },
            nodeMarks: [],
            childSiblingIds: [null, null],
            childIndex: 0,
          },
          {
            nodeId: "list-1",
            nodeType: "bulletList",
            nodeAttrs: { id: "list-1" },
            nodeMarks: [],
            childSiblingIds: [null, "item-2"],
            childIndex: 0,
          },
          {
            nodeId: DOC_NODE_ID,
            nodeType: DOC_NODE_ID,
            nodeAttrs: {},
            nodeMarks: [],
            childSiblingIds: [null, null],
            childIndex: 0,
          },
        ],
      },
      "item-2": {
        nodeType: "listItem",
        chain: [
          {
            nodeId: "list-1",
            nodeType: "bulletList",
            nodeAttrs: { id: "list-1" },
            nodeMarks: [],
            childSiblingIds: ["item-1", null],
            childIndex: 1,
          },
          {
            nodeId: DOC_NODE_ID,
            nodeType: DOC_NODE_ID,
            nodeAttrs: {},
            nodeMarks: [],
            childSiblingIds: [null, null],
            childIndex: 0,
          },
        ],
      },
      "paragraph-2": {
        nodeType: "paragraph",
        chain: [
          {
            nodeId: "item-2",
            nodeType: "listItem",
            nodeAttrs: { id: "item-2" },
            nodeMarks: [],
            childSiblingIds: [null, null],
            childIndex: 0,
          },
          {
            nodeId: "list-1",
            nodeType: "bulletList",
            nodeAttrs: { id: "list-1" },
            nodeMarks: [],
            childSiblingIds: ["item-1", null],
            childIndex: 1,
          },
          {
            nodeId: DOC_NODE_ID,
            nodeType: DOC_NODE_ID,
            nodeAttrs: {},
            nodeMarks: [],
            childSiblingIds: [null, null],
            childIndex: 0,
          },
        ],
      },
    });
  });

  it("skips inline nodes", () => {
    const paths = buildMaterializedPaths(
      schema.nodeFromJSON(getListDocJSON(true)),
    );

    expect(paths.has("hard-break-1")).toBe(false);
    expect([...paths.keys()]).toEqual([
      "list-1",
      "item-1",
      "paragraph-1",
      "item-2",
      "paragraph-2",
    ]);
  });
});
