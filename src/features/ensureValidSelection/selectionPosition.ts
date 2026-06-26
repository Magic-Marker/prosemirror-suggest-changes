import { type ResolvedPos } from "prosemirror-model";
import { ZWSP } from "../../constants.js";
import { getSuggestionMarks } from "../../utils.js";

export type InvalidSelectionPositionReason =
  | "not-in-inline-content"
  | "between-deletion-anchor-and-non-anchor-deletion"
  | "between-two-non-anchor-deletions"
  | "between-node-boundary-and-non-anchor-deletion"
  | "between-non-anchor-deletion-and-node-boundary"
  | "between-non-anchor-deletion-and-anything"
  | "between-two-zwsp-insertions"
  | "between-zwsp-insertion-and-right-node-boundary"
  | "between-zwsp-insertion-and-left-node-boundary";

export function getInvalidSelectionPositionReason(
  $pos: ResolvedPos,
): InvalidSelectionPositionReason | null {
  // Text selection is only valid in nodes that allow inline content.
  // https://github.com/ProseMirror/prosemirror-state/blob/1.4.4/src/selection.ts#L219
  if (!$pos.parent.inlineContent) {
    return "not-in-inline-content";
  }

  const { deletion, insertion } = getSuggestionMarks($pos.doc.type.schema);

  const deletionBefore = deletion.isInSet($pos.nodeBefore?.marks ?? []);
  const deletionAfter = deletion.isInSet($pos.nodeAfter?.marks ?? []);

  const isAnchorBefore =
    deletionBefore && deletionBefore.attrs["type"] === "anchor";
  const isAnchorAfter =
    deletionAfter && deletionAfter.attrs["type"] === "anchor";

  if (isAnchorBefore && deletionAfter && !isAnchorAfter) {
    return "between-deletion-anchor-and-non-anchor-deletion";
  }

  if (deletionBefore && deletionAfter && !isAnchorBefore && !isAnchorAfter) {
    return "between-two-non-anchor-deletions";
  }

  if ($pos.nodeBefore == null && deletionAfter && !isAnchorAfter) {
    return "between-node-boundary-and-non-anchor-deletion";
  }

  if (deletionBefore && $pos.nodeAfter == null && !isAnchorBefore) {
    return "between-non-anchor-deletion-and-node-boundary";
  }

  if (deletionBefore && !isAnchorBefore && $pos.nodeAfter == null) {
    return "between-non-anchor-deletion-and-node-boundary";
  }

  if (deletionBefore && !isAnchorBefore) {
    return "between-non-anchor-deletion-and-anything";
  }

  const insertionBefore = insertion.isInSet($pos.nodeBefore?.marks ?? []);
  const insertionAfter = insertion.isInSet($pos.nodeAfter?.marks ?? []);

  const ZWSP_REGEXP = new RegExp(ZWSP, "g");
  const isZWSPBefore =
    $pos.nodeBefore &&
    $pos.nodeBefore.isText &&
    $pos.nodeBefore.textContent.replace(ZWSP_REGEXP, "") === "";
  const isZWSPAfter =
    $pos.nodeAfter &&
    $pos.nodeAfter.isText &&
    $pos.nodeAfter.textContent.replace(ZWSP_REGEXP, "") === "";

  if (insertionBefore && insertionAfter && isZWSPBefore && isZWSPAfter) {
    return "between-two-zwsp-insertions";
  }

  if (
    insertionBefore &&
    isZWSPBefore &&
    $pos.nodeAfter == null &&
    // A trailing inserted ZWSP is invalid only when it is acting as a boundary
    // marker beside real content. In an otherwise empty paragraph it is the
    // only editable anchor, so the cursor must be allowed there.
    $pos.parent.textContent.replace(ZWSP_REGEXP, "") !== ""
  ) {
    return "between-zwsp-insertion-and-right-node-boundary";
  }

  if (insertionAfter && isZWSPAfter && $pos.nodeBefore == null) {
    return "between-zwsp-insertion-and-left-node-boundary";
  }

  return null;
}
