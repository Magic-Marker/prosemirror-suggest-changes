import { TextSelection, type Transaction } from "prosemirror-state";
import { getSuggestionMarks } from "./utils.js";
import { Transform } from "prosemirror-transform";
import { ZWSP } from "./constants.js";
import { type SuggestionId } from "./generateId.js";

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[prependDeletionsWithZWSP]", ...args);
}

/**
 * When deletion marks are hidden, and we have a textblock with all of it's contents deleted,
 * the cursor is invisible inside that textblock
 * This function finds deletions that start at the node boundary
 * and prepends them with ZWSP deletion marks that are not hidden
 * so they act like anchors where the cursor become visible
 */
export function prependDeletionsWithZWSP(
  transaction: Transaction,
): Transaction {
  const { deletion } = getSuggestionMarks(transaction.doc.type.schema);

  let transform = new Transform(transaction.doc);

  transform.doc.descendants((node, pos) => {
    const mark = node.marks.find(
      (mark) => mark.type === deletion && mark.attrs["type"] === "anchor",
    );
    if (!node.isText || mark == null) return true;

    const mappedPos = transform.mapping.map(pos);

    transform.delete(mappedPos, mappedPos + node.nodeSize);

    return true;
  });

  transform.steps.forEach((step) => {
    transaction.step(step);
  });

  if (transform.steps.length > 0)
    trace(
      `added ${String(transform.steps.length)} remove zwsp steps to tr`,
      transform,
    );

  transform = new Transform(transaction.doc);

  transform.doc.descendants((node, pos) => {
    if (!node.inlineContent) return true;

    const mark = node.firstChild?.marks.find((mark) => mark.type === deletion);
    if (mark == null) return true;
    if (mark.attrs["type"] === "anchor") return true;

    const zwspNode = transform.doc.type.schema.text(ZWSP, [
      deletion.create({ type: "anchor", id: mark.attrs["id"] as SuggestionId }),
    ]);
    const mappedPos = transform.mapping.map(pos);

    transform.insert(mappedPos + 1, zwspNode);

    return true;
  });

  transform.steps.forEach((step) => {
    transaction.step(step);
  });

  if (transform.steps.length > 0)
    trace(
      `added ${String(transform.steps.length)} add zwsp steps to tr`,
      transform,
    );

  maybeIncludeAnchorDeletionInSelection(transaction);

  return transaction;
}

/**
 * After adding anchor deletions, we might have a situation when transaction selection, previously valid,
 * now became invalid, because selection is now located between "anchor deletion" and "normal deletion"
 * so check if that's the case and include the anchor deletion into selection
 */
function maybeIncludeAnchorDeletionInSelection(transaction: Transaction) {
  const { deletion } = getSuggestionMarks(transaction.doc.type.schema);
  // when selection starts exactly after an anchor deletion,
  // expand the left end of the selection to include the anchor deletion
  const selection = transaction.selection;
  if (selection instanceof TextSelection && !selection.empty) {
    const $from = transaction.doc.resolve(selection.from);
    const nodeBefore = $from.nodeBefore;
    const nodeAfter = $from.nodeAfter;
    const anchorMark = nodeBefore?.marks.find(
      (mark) => mark.type === deletion && mark.attrs["type"] === "anchor",
    );
    const deletionAfter = nodeAfter?.marks.find(
      (mark) => mark.type === deletion && mark.attrs["type"] !== "anchor",
    );
    if (
      nodeBefore?.isText &&
      nodeBefore.text === ZWSP &&
      anchorMark &&
      deletionAfter &&
      anchorMark.attrs["id"] === deletionAfter.attrs["id"]
    ) {
      const expandedFrom = selection.from - nodeBefore.nodeSize;
      const anchor =
        selection.anchor === selection.from ? expandedFrom : selection.anchor;
      const head =
        selection.head === selection.from ? expandedFrom : selection.head;
      transaction.setSelection(
        TextSelection.create(transaction.doc, anchor, head),
      );
    }
  }
}
