import {
  remarkProseMirror,
  type RemarkProseMirrorOptions,
  toPmMark,
  toPmNode,
} from "@handlewithcare/remark-prosemirror";
import { baseKeymap, chainCommands, toggleMark } from "prosemirror-commands";
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
} from "../src/index.js";
import { EditorView } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import {
  liftListItem,
  sinkListItem,
  splitListItem,
} from "prosemirror-schema-list";
import "./main.css";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { schema } from "../src/testing/testBuilders.js";

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

const content = `# This is the \`@handlewithcare/prosemirror-suggest-changes\` demo editor!

Suggestions are enabled to start, so start typing and see how it works! Here are
some use cases to try out:

- Inserting and deleting plain text
- Inserting new paragraphs, and deleting across existing paragraph boundaries
- Using undo and redo (cmd/ctrl+z and cmd/ctrl+shift+z)
- Applying and reverting all suggestions

You can also use the button above the editor to disable suggestions.
`;

const doc = await unified()
  .use(remarkParse)
  .use(remarkProseMirror, remarkProseMirrorOptions)
  .process(content)
  .then(({ result }) => result);

const editorState = EditorState.create({
  schema,
  doc,
  plugins: [
    inputRules({
      rules: [
        wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bulletList),
        wrappingInputRule(/^\s*([0-9]+\.)\s$/, schema.nodes.orderedList),
      ],
    }),
    history(),
    suggestChanges(),
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

const enterCommand = baseKeymap["Enter"];

if (!enterCommand) {
  throw new Error("Missing enter command");
}
const plugins = [
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
  suggestChangesUiPlugin,
];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const editorEl = document.getElementById("editor")!;

const view = new EditorView(editorEl, {
  state: editorState,
  plugins,
  dispatchTransaction: withSuggestChanges(),
});

enableSuggestChanges(view.state, view.dispatch);
