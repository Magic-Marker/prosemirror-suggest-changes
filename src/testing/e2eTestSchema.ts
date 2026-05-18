import { Schema } from "prosemirror-model";
import { bulletList, listItem, orderedList } from "prosemirror-schema-list";
import { addSuggestionMarks } from "../schema.js";
import { marks, nodes as schemaNodes } from "prosemirror-schema-basic";
import { addIdAttr } from "../features/wrapUnwrap/addIdAttr.js";

export function createSchema(
  deletionMarksVisibility: "hidden" | "visible" = "visible",
) {
  const nodes = { ...schemaNodes };
  for (const [key, nodeSpec] of Object.entries(nodes)) {
    nodes[key as keyof typeof nodes] = addIdAttr(nodeSpec);
  }

  const listNodes = { orderedList, bulletList, listItem };
  for (const [key, nodeSpec] of Object.entries(listNodes)) {
    listNodes[key as keyof typeof listNodes] = addIdAttr(nodeSpec);
  }

  // Create schema with suggestion marks and list support
  const schema = new Schema({
    nodes: {
      ...nodes,
      doc: {
        ...nodes.doc,
        marks: "insertion deletion modification structure",
      },
      blockquote: {
        ...nodes.blockquote,
        group: "block",
        marks: "insertion deletion modification structure",
      },
      orderedList: {
        ...listNodes.orderedList,
        group: "block",
        content: "listItem+",
        marks: "insertion deletion modification structure",
      },
      bulletList: {
        ...listNodes.bulletList,
        group: "block",
        content: "listItem+",
        marks: "insertion deletion modification structure",
      },
      listItem: {
        ...listNodes.listItem,
        content: "paragraph block*",
        marks: "insertion deletion modification structure",
      },
      hardBreak: { ...nodes.hard_break },
    },
    marks: addSuggestionMarks(marks, {
      experimental_deletions: deletionMarksVisibility,
    }),
  });

  return schema;
}
