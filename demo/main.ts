import {
  remarkProseMirror,
  type RemarkProseMirrorOptions,
  toPmMark,
  toPmNode,
} from "@handlewithcare/remark-prosemirror";
import {
  baseKeymap,
  chainCommands,
  toggleMark,
  /* todo: check
  wrapIn,
  lift,
  */
} from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { inputRules, wrappingInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { EditorState, Plugin } from "prosemirror-state";
import {
  applySuggestions,
  enableSuggestChanges,
  isSuggestChangesEnabled,
  revertSuggestions,
  suggestChanges,
  toggleSuggestChanges,
  withSuggestChanges,
  experimental_ensureSelection,
  experimental_stableNodeIds,
  addSuggestionMarks,
  // experimental_structureChangesPlugin,
} from "../src/index.js";
import { EditorView } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import {
  bulletList,
  liftListItem,
  listItem,
  orderedList,
  sinkListItem,
  splitListItem,
} from "prosemirror-schema-list";
import "./main.css";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { Schema } from "prosemirror-model";
import { marks, nodes } from "prosemirror-schema-basic";
import { addIdAttr } from "../src/features/wrapUnwrapV2/addIdAttr.js";

export const schema = new Schema({
  nodes: {
    ...nodes,
    doc: { ...nodes.doc, marks: "insertion deletion modification structure" },
    image: addIdAttr({ ...nodes.image, group: "block", inline: false }),
    paragraph: addIdAttr(nodes.paragraph),
    blockquote: addIdAttr({
      ...nodes.blockquote,
      group: "block",
      marks: "insertion deletion modification structure",
    }),
    orderedList: addIdAttr({
      ...orderedList,
      group: "block",
      content: "listItem+",
      marks: "insertion deletion modification structure",
    }),
    bulletList: addIdAttr({
      ...bulletList,
      group: "block",
      content: "listItem+",
      marks: "insertion deletion modification structure",
    }),
    listItem: addIdAttr({
      ...listItem,
      content: "block+",
      marks: "insertion deletion modification structure",
    }),
  },
  marks: addSuggestionMarks(marks, {
    experimental_deletions: "visible",
  }),
});

const remarkProseMirrorOptions: RemarkProseMirrorOptions = {
  schema,
  handlers: {
    paragraph: toPmNode(schema.nodes.paragraph),
    heading: toPmNode(schema.nodes.heading, (node) => ({
      level: node.depth,
    })),
    code(node) {
      return schema.nodes.codeBlock.create({}, schema.text(node.value));
    },
    image: toPmNode(schema.nodes.image, (node) => ({
      url: node.url,
    })),
    list: toPmNode(schema.nodes.bulletList),
    listItem: toPmNode(schema.nodes.listItem),
    emphasis: toPmMark(schema.marks.em),
    strong: toPmMark(schema.marks.strong),
    inlineCode(node) {
      return schema.text(node.value, [schema.marks.code.create()]);
    },
    link: toPmMark(schema.marks.link, (node) => ({
      url: node.url,
    })),
    thematicBreak: toPmNode(schema.nodes.paragraph),
  },
};

const content = `
Hello world

Paragraph 1

Paragraph 2

- Item 1
- Item 2
- Item 3
- Item 4
- Item 5

Paragraph 3

Paragraph 4

Lorem Ipsum
`;

const doc = await unified()
  .use(remarkParse)
  .use(remarkProseMirror, remarkProseMirrorOptions)
  .process(content)
  .then(({ result }) => result);

const enterCommand = baseKeymap["Enter"];

if (!enterCommand) {
  throw new Error("Missing enter command");
}
const editorState = EditorState.create({
  schema,
  doc,
  plugins: [
    experimental_stableNodeIds(),
    keymap({
      ...baseKeymap,
      Enter: chainCommands(splitListItem(schema.nodes.listItem), enterCommand),
      "Shift-Enter": enterCommand,
      Tab: sinkListItem(schema.nodes.listItem),
      "Shift-Tab": liftListItem(schema.nodes.listItem),
      "Mod-i": toggleMark(schema.marks.em),
      "Mod-b": toggleMark(schema.marks.strong),
      "Mod-Shift-c": toggleMark(schema.marks.code),
      "Mod-z": undo,
      "Mod-Shift-z": redo,
      "Mod-y": redo,
    }),
    inputRules({
      rules: [
        wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bulletList),
        wrappingInputRule(/^\s*([0-9]+\.)\s$/, schema.nodes.orderedList),
      ],
    }),
    history(),
    suggestChanges(),
    // experimental_structureChangesPlugin(),
    experimental_ensureSelection(),
  ],
});

const suggestChangesUiPlugin = new Plugin({
  view(view) {
    const toggleButton = document.createElement("button");
    toggleButton.appendChild(document.createTextNode("Enable suggestions"));
    toggleButton.addEventListener("click", () => {
      toggleSuggestChanges(view.state, view.dispatch);
      view.focus();
    });

    const applyAllButton = document.createElement("button");
    applyAllButton.appendChild(document.createTextNode("Apply all"));
    applyAllButton.addEventListener("click", () => {
      applySuggestions(view.state, view.dispatch);
      view.focus();
    });

    const revertAllButton = document.createElement("button");
    revertAllButton.appendChild(document.createTextNode("Revert all"));
    revertAllButton.addEventListener("click", () => {
      revertSuggestions(view.state, view.dispatch);
      view.focus();
    });

    const commandsContainer = document.createElement("div");
    commandsContainer.append(applyAllButton, revertAllButton);

    const container = document.createElement("div");
    container.classList.add("menu");
    container.append(toggleButton, commandsContainer);

    view.dom.parentElement?.prepend(container);

    return {
      update() {
        if (isSuggestChangesEnabled(view.state)) {
          toggleButton.replaceChildren(
            document.createTextNode("Disable suggestions"),
          );
        } else {
          toggleButton.replaceChildren(
            document.createTextNode("Enable suggestions"),
          );
        }
      },
      destroy() {
        container.remove();
      },
    };
  },
});
const plugins = [suggestChangesUiPlugin];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const editorEl = document.getElementById("editor")!;

const view = new EditorView(editorEl, {
  state: editorState,
  plugins,
  dispatchTransaction: withSuggestChanges(),
});

enableSuggestChanges(view.state, view.dispatch);
