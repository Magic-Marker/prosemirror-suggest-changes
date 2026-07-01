import { type DOMOutputSpec, type NodeSpec } from "prosemirror-model";

export const addIdAttr = (nodeSpec: NodeSpec): NodeSpec => {
  const { toDOM, parseDOM } = nodeSpec;
  if (!toDOM || !parseDOM) {
    return nodeSpec;
  }

  const newNodeSpec: NodeSpec = {
    ...nodeSpec,
    attrs: {
      ...(nodeSpec.attrs ?? {}),
      id: { default: null },
    },
    toDOM(node) {
      const domOutputSpec = toDOM(node);
      if (!Array.isArray(domOutputSpec)) {
        console.warn(
          "addIdAttr",
          "domOutputSpec is not an array, id is not added",
          domOutputSpec,
        );
        return domOutputSpec;
      }

      const id = typeof node.attrs["id"] === "string" ? node.attrs["id"] : null;
      const attrs = domOutputSpec[1] as unknown;

      if (
        !Array.isArray(attrs) &&
        typeof attrs === "object" &&
        attrs !== null
      ) {
        const theRest = (domOutputSpec as unknown as []).slice(2);
        const result = [
          domOutputSpec[0],
          id ? { ...attrs, "data-id": id } : attrs,
          ...theRest,
        ];
        return result as unknown as DOMOutputSpec;
      }

      const theRest = (domOutputSpec as unknown as []).slice(1);
      const result = [
        domOutputSpec[0],
        id ? { "data-id": id } : {},
        ...theRest,
      ];
      return result as unknown as DOMOutputSpec;
    },
    parseDOM: [
      ...parseDOM.map((tagParseRule) => ({
        ...tagParseRule,
        getAttrs(dom: HTMLElement) {
          const id = dom.getAttribute("data-id");
          return tagParseRule.getAttrs
            ? { ...tagParseRule.getAttrs(dom), id }
            : { id };
        },
      })),
    ],
  };

  return newNodeSpec;
};
