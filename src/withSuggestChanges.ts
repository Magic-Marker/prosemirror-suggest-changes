import { type Node, type Schema } from "prosemirror-model";
import { type Transaction } from "prosemirror-state";
import { type Transform } from "prosemirror-transform";
import { type EditorView } from "prosemirror-view";
import { isSuggestChangesEnabled, suggestChangesKey } from "./plugin.js";
import { type SuggestionId } from "./generateId.js";
import { prependDeletionsWithZWSP } from "./prependDeletionsWithZWSP.js";
import {
  getRequiredStructuralContextPaths,
  suggestStructureChanges,
  type SuggestStructureChangesResult,
} from "./features/wrapUnwrap/structureChangesPlugin.js";
import { type StructuralContextPath } from "./features/wrapUnwrap/types.js";
import { handleSpecialTransactionShape } from "./features/transactionShaping/index.js";
import { transformToSuggestionTransaction } from "./transformToSuggestionTransaction.js";

export { transformToSuggestionTransaction } from "./transformToSuggestionTransaction.js";

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[withSuggestChanges]", ...args);
}

/**
 * A `dispatchTransaction` decorator. Wrap your existing `dispatchTransaction`
 * function with `withSuggestChanges`, or pass no arguments to use the default
 * implementation (`view.setState(view.state.apply(tr))`).
 *
 * The result is a `dispatchTransaction` function that will intercept
 * and modify incoming transactions when suggest changes is enabled.
 * These modified transactions will suggest changes instead of directly
 * applying them, e.g. by marking a range with the deletion mark rather
 * than removing it from the document.
 */
export function withSuggestChanges(
  dispatchTransaction?: EditorView["dispatch"],
  generateId?: (schema: Schema, doc?: Node) => SuggestionId,
  opts?: {
    experimental_trackStructureChanges?: boolean;
    experimental_trackStructures?: StructuralContextPath[];
    experimental_ensureUniqueNodeIds?: (
      transactions: Transaction[],
      oldDoc: Node,
      newDoc: Node,
    ) => Transform;
  },
): EditorView["dispatch"] {
  const dispatch =
    dispatchTransaction ??
    function (this: EditorView, tr: Transaction) {
      this.updateState(this.state.apply(tr));
    };

  return function dispatchTransaction(this: EditorView, tr: Transaction) {
    const ySyncMeta = (tr.getMeta("y-sync$") ?? {}) as {
      isUndoRedoOperation?: boolean;
      isChangeOrigin?: boolean;
    };

    const isEnabled =
      isSuggestChangesEnabled(this.state) &&
      !tr.getMeta("history$") &&
      !tr.getMeta("collab$") &&
      !ySyncMeta.isUndoRedoOperation &&
      !ySyncMeta.isChangeOrigin &&
      !("skip" in (tr.getMeta(suggestChangesKey) ?? {}));

    let transaction = tr;

    if (isEnabled) {
      let structureChangesResult: SuggestStructureChangesResult | null = null;
      const docBefore = transaction.docs[0];

      const structuralContextPaths = opts?.experimental_trackStructureChanges
        ? getRequiredStructuralContextPaths(opts.experimental_trackStructures)
        : null;
      const ensureUniqueNodeIds = opts?.experimental_ensureUniqueNodeIds;
      const shapedTransaction = transaction.docChanged
        ? handleSpecialTransactionShape({
            transaction,
            state: this.state,
            generateId,
            structuralContextPaths,
            ensureUniqueNodeIds,
          })
        : null;

      if (
        !shapedTransaction &&
        transaction.docChanged &&
        docBefore &&
        structuralContextPaths &&
        typeof ensureUniqueNodeIds === "function"
      ) {
        trace("trying to track structure changes first...");
        // after a transaction, some nodes may not yet have unique ids (they were just added, and the unique id plugin has not yet run)
        // this hook allows to "post-process" the transaction and add the missing ids
        // basically it allows to run the core logic of the unique ids plugin earlier
        const perfUid = performance.now();
        const uniqueNodeIdsTransform = ensureUniqueNodeIds(
          [transaction],
          docBefore,
          transaction.doc,
        );
        trace(
          "perf",
          "structure",
          "ensureUniqueNodsIds took",
          Number((performance.now() - perfUid).toFixed(2)),
          "ms",
        );
        const docAfter = uniqueNodeIdsTransform.doc;
        trace("unique node ids set", docAfter);

        // try running structure changes first
        // if handled, then ignore the main plugin
        // otherwise use the main plugin
        const perfStructure = performance.now();
        structureChangesResult = suggestStructureChanges(
          docBefore,
          docAfter,
          structuralContextPaths,
          generateId,
        );
        trace(
          "perf",
          "structure",
          "suggestStructureChanges took",
          Number((performance.now() - perfStructure).toFixed(2)),
          "ms",
        );
        trace(
          "structure changes transform completed",
          structureChangesResult.transform,
        );
        if (structureChangesResult.handled) {
          uniqueNodeIdsTransform.steps.forEach((step) => {
            transaction.step(step);
          });
          structureChangesResult.transform.steps.forEach((step) => {
            transaction.step(step);
          });
          trace(
            "applied unique id transform and structure changes transform to the transaction",
            transaction,
          );
        }
      }

      if (shapedTransaction) {
        transaction = shapedTransaction;
      } else if (
        transaction.docChanged &&
        structureChangesResult?.handled !== true
      ) {
        trace("running the main suggestions plugin...");
        const perfSuggestions = performance.now();
        transaction = transformToSuggestionTransaction(
          tr,
          this.state,
          generateId,
        );
        trace(
          "perf",
          "suggestions",
          "transformToSuggestionTransaction took",
          Number((performance.now() - perfSuggestions).toFixed(2)),
          "ms",
        );
        trace("main suggestions plugin completed", transaction);
      }
    }

    if (transaction.docChanged) {
      prependDeletionsWithZWSP(transaction);
    }

    dispatch.call(this, transaction);
  };
}
