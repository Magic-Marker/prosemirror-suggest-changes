import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { type Mark } from "prosemirror-model";
import { history, redo, undo } from "prosemirror-history";
import { baseKeymap, chainCommands, lift, wrapIn } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import {
  liftListItem,
  sinkListItem,
  splitListItem,
} from "prosemirror-schema-list";
import { withSuggestChanges } from "../src/withSuggestChanges.js";
import { suggestChanges, suggestChangesKey } from "../src/plugin.js";
import "prosemirror-view/style/prosemirror.css";
import {
  experimental_ensureSelection,
  experimental_stableNodeIds,
  revertSuggestions,
} from "../src/index.js";
import { type SuggestionId } from "../src/generateId.js";
import * as commands from "../src/commands.js";
import { generateNodeId } from "../src/features/wrapUnwrap/generateNodeId.js";
import { createSchema } from "../src/testing/e2eTestSchema.js";

const searchParams = new URLSearchParams(window.location.search);

let deletionMarksVisibility = searchParams.get("deletionMarksVisibility") as
  | "hidden"
  | "visible"
  | null;
deletionMarksVisibility ??= "visible";

console.log(
  "keyboard-test.ts",
  "deletion mark visibility",
  deletionMarksVisibility,
);

const schema = createSchema(deletionMarksVisibility);

// Transaction logging
const transactions: {
  steps: unknown[];
  selection: { from: number; to: number };
  docBefore: string;
  docAfter: string;
}[] = [];

// Create initial document
const doc = schema.nodeFromJSON({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "test paragraph" }],
    },
  ],
});

const enterCommand = baseKeymap["Enter"];

if (!enterCommand) {
  throw new Error("Missing enter command");
}
// Create editor state with list item support
let state = EditorState.create({
  doc,
  schema,
  plugins: [
    experimental_stableNodeIds(generateNodeId),
    keymap({
      ...baseKeymap,
      // Handle Enter key for list items
      Enter: chainCommands(
        splitListItem(schema.nodes.listItem),
        baseKeymap["Enter"] ?? (() => false),
      ),
      "Shift-Enter": enterCommand,
      "Mod-z": undo,
      "Mod-Shift-z": redo,
      "Mod-y": redo,
      // handle lift and sink for list items
      Tab: sinkListItem(schema.nodes.listItem),
      "Shift-Tab": liftListItem(schema.nodes.listItem),
      "Mod-u": wrapIn(schema.nodes.blockquote),
      "Mod-l": lift,
    }),
    history(),
    suggestChanges(),
    experimental_ensureSelection(),
  ],
});

// Enable suggest changes mode
state = state.apply(state.tr.setMeta(suggestChangesKey, { enabled: true }));

// Custom dispatch with logging
const dispatch = withSuggestChanges(
  function (this: EditorView, tr) {
    const docBefore = this.state.doc.textContent;
    const newState = this.state.apply(tr);

    transactions.push({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      steps: tr.steps.map((s) => s.toJSON()),
      selection: { from: tr.selection.from, to: tr.selection.to },
      docBefore,
      docAfter: newState.doc.textContent,
    });

    this.updateState(newState);

    // Update status display
    updateStatus();
  },
  undefined,
  {
    experimental_trackStructureChanges: true,
    experimental_generateNodeId: generateNodeId,
  },
);

// Create editor view
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const editorEl = document.getElementById("editor")!;
const view = new EditorView(editorEl, {
  state,
  attributes: {
    "data-testid": "main-editor",
  },
  dispatchTransaction: dispatch,
});

// Status display
function updateStatus() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const statusEl = document.getElementById("status")!;
  statusEl.textContent = [
    `Blocks: ${String(view.state.doc.childCount)}`,
    `Content: "${view.state.doc.textContent}"`,
    `Cursor: ${String(view.state.selection.from)}-${String(view.state.selection.to)}`,
    `Transactions: ${String(transactions.length)}`,
  ].join(" | ");
}

function renderButtons() {
  const revertAllButton = document.createElement("button");
  revertAllButton.appendChild(document.createTextNode("Revert all"));
  revertAllButton.addEventListener("click", () => {
    revertSuggestions(view.state, view.dispatch);
    view.focus();
  });
  const container = document.getElementById("buttons");
  if (!container) {
    throw new Error("Buttons container not found");
  }
  container.appendChild(revertAllButton);
}

// Initial status
updateStatus();

renderButtons();

// Expose API to window for Playwright access
declare global {
  interface Window {
    pmEditor: {
      view: EditorView;
      getState: () => {
        blockCount: number;
        paragraphCount: number; // Kept for backward compatibility
        textContent: string;
        cursorFrom: number;
        cursorTo: number;
        marks: Mark[];
      };
      getDocJSON: () => object;
      replaceDoc: (docJSON: unknown) => void;
      getCursorInfo: () => {
        from: number;
        to: number;
        empty: boolean;
        parentOffset: number;
        depth: number;
      };
      setCursorToEnd: () => void;
      setCursorToPosition: (pos: number) => void;
      setCursorToEndOfBlock: (blockIndex: number) => void;
      getTransactions: () => typeof transactions;
      clearTransactions: () => void;
      logState: () => void;
      getProseMirrorMarkCount: (name: string) => number;
      getProseMirrorSelection: () => { anchor: number; head: number };
      getTextContentOfChildAtIndex: (index: number) => string;
      getDOMTextContentOfChildAtIndex: (index: number) => string;
      revertSuggestion: (
        suggestionId: SuggestionId,
        opts?: { structure: boolean },
      ) => void;
      revertStructureSuggestion: (suggestionId: SuggestionId) => void;
    };
  }
}

window.pmEditor = {
  view,

  getState() {
    const marks: Mark[] = [];
    view.state.doc.nodesBetween(0, view.state.doc.content.size, (node) => {
      marks.push(...node.marks);
    });
    return {
      blockCount: view.state.doc.childCount,
      paragraphCount: view.state.doc.childCount, // Kept for backward compatibility
      textContent: view.state.doc.textContent,
      cursorFrom: view.state.selection.from,
      cursorTo: view.state.selection.to,
      marks,
    };
  },

  replaceDoc(docJSON: unknown) {
    const schema = view.state.schema;
    const doc = schema.nodeFromJSON(docJSON);

    // Create a completely new state with the new document
    const newState = EditorState.create({
      doc,
      schema,
      plugins: view.state.plugins,
    });

    // Enable suggest changes mode
    const enabledState = newState.apply(
      newState.tr.setMeta(suggestChangesKey, { enabled: true }),
    );

    view.updateState(enabledState);
  },

  getDocJSON() {
    return view.state.doc.toJSON() as object;
  },

  getCursorInfo() {
    const { from, to, empty } = view.state.selection;
    const $from = view.state.doc.resolve(from);
    return {
      from,
      to,
      empty,
      parentOffset: $from.parentOffset,
      depth: $from.depth,
    };
  },

  setCursorToEnd() {
    const endPos = view.state.doc.content.size - 1;
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.near(view.state.doc.resolve(endPos)),
      ),
    );
  },

  setCursorToPosition(pos: number) {
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.near(view.state.doc.resolve(pos)),
      ),
    );
  },

  setCursorToEndOfBlock(blockIndex: number) {
    const doc = view.state.doc;
    if (blockIndex < 0 || blockIndex >= doc.childCount) {
      throw new Error(`Invalid block index: ${String(blockIndex)}`);
    }

    let pos = 0;
    for (let i = 0; i < blockIndex; i++) {
      pos += doc.child(i).nodeSize;
    }
    // Position at end of the block (before the closing boundary)
    pos += doc.child(blockIndex).content.size;

    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.near(view.state.doc.resolve(pos)),
      ),
    );
  },

  getTransactions() {
    return transactions;
  },

  clearTransactions() {
    transactions.length = 0;
  },

  logState() {
    console.log("=== Editor State ===");
    console.log("Blocks:", view.state.doc.childCount);
    console.log("Content:", view.state.doc.textContent);
    console.log(
      "Cursor:",
      view.state.selection.from,
      "-",
      view.state.selection.to,
    );
    console.log("Doc JSON:", view.state.doc.toJSON());
    console.log("===================");
  },

  getProseMirrorMarkCount(name: string) {
    const marks: Mark[] = [];
    view.state.doc.nodesBetween(0, view.state.doc.content.size, (node) => {
      marks.push(...node.marks);
    });
    return marks.filter((mark) => mark.type.name === name).length;
  },

  getProseMirrorSelection() {
    return view.state.selection.toJSON() as { anchor: number; head: number };
  },

  getTextContentOfChildAtIndex(index: number) {
    return view.state.doc.child(index).textContent;
  },

  getDOMTextContentOfChildAtIndex(index: number) {
    return view.dom.childNodes[index].textContent ?? "";
  },

  revertSuggestion(suggestionId: SuggestionId) {
    const command = commands.revertSuggestion(
      suggestionId,
      undefined,
      undefined,
    );
    command(view.state, view.dispatch);
  },

  revertStructureSuggestion(suggestionId: SuggestionId) {
    const command = commands.revertSuggestion(
      suggestionId,
      undefined,
      undefined,
    );
    command(view.state, view.dispatch);
  },
};

// Log initial state
console.log("Editor initialized");
window.pmEditor.logState();
