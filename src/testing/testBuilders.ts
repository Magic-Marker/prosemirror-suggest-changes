import { Schema, type Node } from "prosemirror-model";
import {
  type MarkBuilder,
  type NodeBuilder,
  builders,
} from "prosemirror-test-builder";
import { nodes as schemaNodes, marks } from "prosemirror-schema-basic";
import { bulletList, listItem, orderedList } from "prosemirror-schema-list";
import { addSuggestionMarks } from "../schema.js";
import { difficulty } from "./difficultyMark.js";
// import { addIdAttr } from "../features/wrapUnwrapV2/addIdAttr.js";

const nodes = { ...schemaNodes };
// unit tests will fail because nodes will have an attribute id: null that is not expected
// so we don't add id attribute to nodes for now for unit tests
// it's probably not even necessary, or maybe two separate vitest projects are needed
// for (const [key, nodeSpec] of Object.entries(nodes)) {
//   nodes[key as keyof typeof nodes] = addIdAttr(nodeSpec, key);
// }

export const schema = new Schema({
  nodes: {
    ...nodes,
    image: { ...nodes.image, group: "block", inline: false },
    doc: {
      ...nodes.doc,
      marks: "difficulty insertion deletion modification structure",
    },
    blockquote: {
      ...nodes.blockquote,
      group: "block",
      marks: "difficulty insertion deletion modification structure",
    },
    orderedList: {
      ...orderedList,
      group: "block",
      content: "listItem+",
      marks: "difficulty insertion deletion modification structure",
    },
    bulletList: {
      ...bulletList,
      group: "block",
      content: "listItem+",
      marks: "difficulty insertion deletion modification structure",
    },
    listItem: {
      ...listItem,
      content: "paragraph block*",
      marks: "difficulty insertion deletion modification structure",
    },
  },
  marks: { ...addSuggestionMarks(marks), difficulty },
});

export const testBuilders = builders(schema) as {
  [NodeTypeName in keyof (typeof schema)["nodes"]]: NodeBuilder;
} & {
  [MarkTypeName in keyof (typeof schema)["marks"]]: MarkBuilder;
} & { schema: typeof schema };

export type TaggedNode = Node & {
  flat: Node;
  tag: Record<string, number>;
};
