import type { EditorView } from "prosemirror-view";
import type { Mark } from "prosemirror-model";
import type { SuggestionId } from "../../../generateId.js";

declare global {
  interface Window {
    pmEditor: {
      view: EditorView;
      getState: () => {
        paragraphCount: number;
        blockCount: number;
        textContent: string;
        cursorFrom: number;
        cursorTo: number;
        marks: Mark[];
      };
      getDocJSON: () => object;
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
      getTransactions: () => {
        steps: unknown[];
        selection: { from: number; to: number };
        docBefore: string;
        docAfter: string;
      }[];
      clearTransactions: () => void;
      logState: () => void;
      replaceDoc: (doc: unknown) => void;
      getProseMirrorMarkCount: (name: string) => number;
      getProseMirrorMarksJSON: () => unknown[];
      getProseMirrorSelection: () => { anchor: number; head: number };
      getTextContentOfChildAtIndex: (
        index: number,
        childIndexes?: number[],
      ) => string;
      getDOMTextContentOfChildAtIndex: (index: number) => string;
      dispatchTransactionWithSteps: (stepJSONs: object[]) => void;
      setSuggestChangesEnabled: (enabled: boolean) => void;
      revertSuggestion: (
        suggestionId: SuggestionId,
        opts?: { structure: boolean },
      ) => void;
      revertStructureSuggestion: (suggestionId: SuggestionId) => void;
    };
  }
}

export {};
