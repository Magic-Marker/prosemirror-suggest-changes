import { type NodeSpec } from "prosemirror-model";

export const addIdAttr = (nodeSpec: NodeSpec): NodeSpec => {
  const parseDOM = nodeSpec.parseDOM;
  const tag = parseDOM?.[0]?.tag;
  if (!tag) {
    throw new Error(`Tag not found for node spec: ${JSON.stringify(nodeSpec)}`);
  }
  return {
    ...nodeSpec,
    attrs: {
      ...(nodeSpec.attrs ?? {}),
      id: { default: null },
    },
    toDOM(node) {
      const id = typeof node.attrs["id"] === "string" ? node.attrs["id"] : null;
      return [tag, id ? { "data-id": id } : {}, 0];
    },
    parseDOM: [
      {
        tag,
        getAttrs(dom: Node | string) {
          if (!(dom instanceof Element)) return { id: null };
          const id = dom.getAttribute("data-id");
          return { id };
        },
      },
    ],
  };
};
