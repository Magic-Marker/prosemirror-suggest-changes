import { type MarkType, type Node } from "prosemirror-model";
import type { ZWSPWithPos } from "../types.js";
import { ZWSP } from "../types.js";
import type { SuggestionId } from "../../../generateId.js";
import { getNextZWSP, getPreviousZWSP } from "../utils/boundary.js";

export const getZWSPPairsInRange = (
  doc: Node,
  from: number,
  to: number,
  insertionMarkType: MarkType,
) => {
  const previousZWSP = getPreviousZWSP(doc, from, insertionMarkType);
  const nextZWSP = getNextZWSP(doc, to, insertionMarkType);
  const pairs: { left?: ZWSPWithPos; right?: ZWSPWithPos }[] = [];
  let currentEndingZWSP = previousZWSP;
  doc.nodesBetween(from, to, (node, pos, parent, index) => {
    // A split block is represented by matching insertion ZWSP anchors at the
    // end of the left block and the start of the right block. Pair only anchors
    // with the same suggestion ID so unrelated insertion marks are not joined.
    const insertionMarkId = insertionMarkType.isInSet(node.marks)?.attrs[
      "id"
    ] as SuggestionId | undefined;
    if (
      currentEndingZWSP &&
      index === 0 &&
      node.text?.[0] === ZWSP &&
      insertionMarkId &&
      currentEndingZWSP.id === insertionMarkId &&
      // Prevent self-pairing: don't pair a ZWSP with itself when both
      // the previousZWSP and the current node's ZWSP are at the same position
      currentEndingZWSP.pos !== pos
    ) {
      pairs.push({
        left: currentEndingZWSP,
        right: { pos, node, char: ZWSP, id: insertionMarkId },
      });
    }
    if (node.isText) {
      // Once real text is encountered, the previous ending anchor can no longer
      // describe the next block boundary.
      currentEndingZWSP = undefined;
    }
    const lastTextInParent = node.isText && parent?.childCount === index + 1;
    const lastCharInNode = node.text?.[node.text.length - 1];
    if (
      node.isText &&
      lastTextInParent &&
      lastCharInNode === ZWSP &&
      insertionMarkId
    ) {
      // unsure about nodesize -1
      currentEndingZWSP = {
        pos: pos + node.nodeSize - 1,
        node,
        char: ZWSP,
        id: insertionMarkId,
      };
    }
    return true;
  });
  if (currentEndingZWSP?.id && currentEndingZWSP.id === nextZWSP?.id) {
    pairs.push({ left: currentEndingZWSP, right: nextZWSP });
  }
  const usedFromBoundaryZWSP = pairs[0]?.left === previousZWSP;
  const usedToBoundaryZWSP = pairs[pairs.length - 1]?.right === nextZWSP;
  return {
    pairs,
    ZWSPAtFromBoundary: usedFromBoundaryZWSP ? previousZWSP : undefined,
    ZWSPAtToBoundary: usedToBoundaryZWSP ? nextZWSP : undefined,
  };
};
