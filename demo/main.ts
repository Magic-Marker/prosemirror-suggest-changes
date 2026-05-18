import {
  remarkProseMirror,
  type RemarkProseMirrorOptions,
  toPmMark,
  toPmNode,
} from "@handlewithcare/remark-prosemirror";
import {
  baseKeymap,
  chainCommands,
  exitCode,
  lift,
  toggleMark,
  wrapIn,
} from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { EditorState, Plugin, type Transaction } from "prosemirror-state";
import { type Mark, type Node } from "prosemirror-model";
import {
  applySuggestions,
  enableSuggestChanges,
  isSuggestChangesEnabled,
  revertSuggestions,
  suggestChanges,
  toggleSuggestChanges,
  withSuggestChanges,
  experimental_ensureSelection,
  addSuggestionMarks,
  suggestChangesKey,
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
import { marks, nodes as schemaNodes } from "prosemirror-schema-basic";
import { addIdAttr } from "../src/features/wrapUnwrap/addIdAttr.js";
import {
  ensureUniqueNodeIds,
  uniqueNodeIdsPlugin,
} from "../src/features/wrapUnwrap/uniqueNodeIdsPlugin.js";
import { getSuggestionMarks } from "../src/utils.js";
import { Step, Transform } from "prosemirror-transform";
import { revertStructureMark } from "../src/features/wrapUnwrap/revert/revertStructureSuggestions.js";
import { listInputRules } from "../src/listInputRules.js";

// stable node ids for demo
let nodeId = 0;
const generateUniqueNodeId = () => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `node-${nodeId++}`;
};

const nodes = { ...schemaNodes };
for (const [key, nodeSpec] of Object.entries(nodes)) {
  nodes[key] = addIdAttr(nodeSpec);
}

const listNodes = { orderedList, bulletList, listItem };
for (const [key, nodeSpec] of Object.entries(listNodes)) {
  listNodes[key] = addIdAttr(nodeSpec);
}

export const schema = new Schema({
  nodes: {
    ...nodes,
    doc: { ...nodes.doc, marks: "insertion deletion modification structure" },
    image: { ...nodes.image, group: "block", inline: false },
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
    list: toPmNode(schema.nodes.orderedList),
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

const content = `- Item 0
- Item 1
- Item 2
- Item 3
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

// add a hard break on Mod+Enter
// https://code.haverbeke.berlin/prosemirror/prosemirror-example-setup/src/tag/1.2.3/src/keymap.ts#L76
const hardBreakCommand = chainCommands(exitCode, (state, dispatch) => {
  if (dispatch)
    dispatch(
      state.tr
        .replaceSelectionWith(schema.nodes.hardBreak.create())
        .scrollIntoView(),
    );
  return true;
});

const editorState = EditorState.create({
  schema,
  doc,
  plugins: [
    uniqueNodeIdsPlugin({
      attributeName: "id",
      generateID: generateUniqueNodeId,
    }),
    keymap({
      ...baseKeymap,
      Enter: chainCommands(splitListItem(schema.nodes.listItem), enterCommand),
      "Shift-Enter": enterCommand,
      "Mod-Enter": hardBreakCommand,
      Tab: sinkListItem(schema.nodes.listItem),
      "Shift-Tab": liftListItem(schema.nodes.listItem),
      "Mod-i": toggleMark(schema.marks.em),
      "Mod-b": toggleMark(schema.marks.strong),
      "Mod-Shift-c": toggleMark(schema.marks.code),
      "Mod-z": undo,
      "Mod-Shift-z": redo,
      "Mod-y": redo,
      "Mod-u": wrapIn(schema.nodes.blockquote),
      "Mod-l": lift,
    }),
    inputRules({
      rules: [
        ...listInputRules(schema.nodes.bulletList, schema.nodes.orderedList),
      ],
    }),
    history(),
    suggestChanges(),
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
  dispatchTransaction: withSuggestChanges(
    function (this: EditorView, tr: Transaction) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const view = this;
      const { structure } = getSuggestionMarks(this.state.schema);

      const newState = this.state.apply(tr);

      const structureMarks: { node: Node; mark: Mark; pos: number }[] = [];
      newState.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          if (mark.type === structure) structureMarks.push({ node, mark, pos });
        });
        return true;
      });
      console.log("structureMarks", structureMarks);

      setTimeout(() => {
        const elements: HTMLElement[] = [];
        structureMarks.forEach((mark) => {
          const element = document.createElement("button");
          element.addEventListener("click", () => {
            const transform = new Transform(view.state.doc);
            revertStructureMark(transform, mark.mark, mark.pos);
            const tr = view.state.tr;
            transform.steps.forEach((step) => tr.step(step));
            tr.setMeta(suggestChangesKey, { skip: true });
            view.dispatch(tr);
          });
          element.textContent = `Revert structure mark id="${mark.mark.attrs["id"] as string}" on node ${mark.node.toString()}`;
          elements.push(element);
        });
        console.log("elements", elements);

        const container = document.createElement("div");
        container.id = "structure-marks";
        container.append(...elements);

        const parent = view.dom.parentElement;
        const existing = parent?.querySelector("#structure-marks");
        if (existing) parent?.removeChild(existing);
        parent?.append(container);
      }, 0);

      this.updateState(newState);
    },
    undefined,
    {
      experimental_trackStructureChanges: true,
      experimental_trackStructures: [
        ["orderedList", "listItem"],
        ["bulletList", "listItem"],
        ["blockquote"],
      ],
      experimental_ensureUniqueNodeIds: (
        transactions: Transaction[],
        oldDoc: Node,
        newDoc: Node,
      ) =>
        ensureUniqueNodeIds(transactions, oldDoc, newDoc, {
          attributeName: "id",
          generateID: generateUniqueNodeId,
        }),
    },
  ),
});

enableSuggestChanges(view.state, view.dispatch);

declare global {
  interface Window {
    pmView: EditorView;
    dispatchTransactionWithSteps: (stepJSONs: object[]) => void;
  }
}

window.pmView = view;

window.dispatchTransactionWithSteps = (stepJSONs: object[]) => {
  const steps = stepJSONs.map((stepJSON) => Step.fromJSON(schema, stepJSON));
  const tr = view.state.tr;
  steps.forEach((step) => tr.step(step));
  view.dispatch(tr);
};
