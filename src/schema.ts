import { type MarkSpec } from "prosemirror-model";
import { type SuggestionId, suggestionIdValidate } from "./generateId.js";

export const deletion: MarkSpec = {
  inclusive: false,
  excludes: "insertion modification deletion",
  attrs: {
    id: { validate: suggestionIdValidate },
    type: { default: null, validate: "string|null" },
    data: { default: null },
  },
  toDOM(mark, inline) {
    return [
      "del",
      {
        "data-id": JSON.stringify(mark.attrs["id"]),
        "data-inline": String(inline),
        ...(!inline && { style: "display: block" }),
        "data-type": JSON.stringify(mark.attrs["type"]),
        "data-data": JSON.stringify(mark.attrs["data"]),
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "del",
      getAttrs(node) {
        if (!node.dataset["id"]) return false;
        return {
          id: JSON.parse(node.dataset["id"]) as SuggestionId,
          type: JSON.parse(node.dataset["type"] ?? "null") as string | null,
          data: JSON.parse(node.dataset["data"] ?? "null") as object | null,
        };
      },
    },
  ],
};

export const insertion: MarkSpec = {
  inclusive: false,
  excludes: "deletion modification insertion",
  attrs: {
    id: { validate: suggestionIdValidate },
  },
  toDOM(mark, inline) {
    return [
      "ins",
      {
        "data-id": JSON.stringify(mark.attrs["id"]),
        "data-inline": String(inline),
        ...(!inline && { style: "display: block" }),
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "ins",
      getAttrs(node) {
        if (!node.dataset["id"]) return false;
        return {
          id: JSON.parse(node.dataset["id"]) as SuggestionId,
        };
      },
    },
  ],
};

export const modification: MarkSpec = {
  inclusive: false,
  excludes: "deletion insertion",
  attrs: {
    id: { validate: suggestionIdValidate },
    type: { validate: "string" },
    attrName: { default: null, validate: "string|null" },
    previousValue: { default: null },
    newValue: { default: null },
  },
  toDOM(mark, inline) {
    return [
      inline ? "span" : "div",
      {
        "data-type": "modification",
        "data-id": JSON.stringify(mark.attrs["id"]),
        "data-mod-type": mark.attrs["type"] as string,
        "data-mod-prev-val": JSON.stringify(mark.attrs["previousValue"]),
        // TODO: Try to serialize marks with toJSON?
        "data-mod-new-val": JSON.stringify(mark.attrs["newValue"]),
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "span[data-type='modification']",
      getAttrs(node) {
        if (!node.dataset["id"]) return false;
        return {
          id: JSON.parse(node.dataset["id"]) as SuggestionId,
          type: node.dataset["modType"],
          previousValue: node.dataset["modPrevVal"],
          newValue: node.dataset["modNewVal"],
        };
      },
    },
    {
      tag: "div[data-type='modification']",
      getAttrs(node) {
        if (!node.dataset["id"]) return false;
        return {
          id: JSON.parse(node.dataset["id"]) as SuggestionId,
          type: node.dataset["modType"],
          previousValue: node.dataset["modPrevVal"],
        };
      },
    },
  ],
};

export const structure: MarkSpec = {
  inclusive: false,
  excludes: "deletion insertion modification",
  attrs: {
    id: { validate: suggestionIdValidate },
    data: { default: null },
  },
  toDOM(mark) {
    return [
      "div",
      {
        "data-type": "structure",
        "data-id": JSON.stringify(mark.attrs["id"]),
        "data-data": JSON.stringify(mark.attrs["data"]),
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "div[data-type='structure']",
      getAttrs(node) {
        if (!node.dataset["id"]) return false;
        return {
          id: JSON.parse(node.dataset["id"]) as SuggestionId,
          data: JSON.parse(node.dataset["data"] ?? "null") as object | null,
        };
      },
    },
  ],
};

/**
 * Add the deletion, insertion, and modification marks to
 * the provided MarkSpec map.
 */
export function addSuggestionMarks<Marks extends string>(
  marks: Record<Marks, MarkSpec>,
): Record<
  Marks | "deletion" | "insertion" | "modification" | "structure",
  MarkSpec
> {
  return {
    ...marks,
    deletion,
    insertion,
    modification,
    structure,
  };
}
