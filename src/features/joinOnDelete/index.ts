import {
  Mark,
  type Node,
  type Attrs,
  type MarkType,
  type ResolvedPos,
} from "prosemirror-model";
import { canJoin, Transform } from "prosemirror-transform";
import { ZWSP } from "../../constants.js";
import { type Transaction } from "prosemirror-state";
import { type SuggestionId } from "../../generateId.js";
import { getSuggestionMarks } from "../../utils.js";

interface JoinMarkAttrs {
  type: "join";
  data: {
    leftNode: { type: string; attrs: object; marks: object[] };
    rightNode: { type: string; attrs: object; marks: object[] };
  };
}

export function isJoinMarkAttrs(attrs: Attrs): attrs is JoinMarkAttrs {
  if (attrs["type"] !== "join") return false;
  if (attrs["data"] == null) return false;

  const data = attrs["data"] as Partial<JoinMarkAttrs["data"]>;
  if (data.leftNode == null || data.rightNode == null) return false;

  if (
    typeof data.leftNode.type !== "string" ||
    typeof data.rightNode.type !== "string"
  )
    return false;
  if (
    typeof data.leftNode.attrs !== "object" ||
    typeof data.rightNode.attrs !== "object"
  )
    return false;
  if (
    !Array.isArray(data.leftNode.marks) ||
    !Array.isArray(data.rightNode.marks)
  )
    return false;
  return true;
}

export function maybeRevertJoinMark(
  tr: Transform,
  from: number,
  to: number,
  node: Node,
  markType: MarkType,
) {
  const mark = node.marks.find((mark) => mark.type === markType);
  if (!mark || mark.attrs["type"] !== "join" || node.text !== ZWSP)
    return false;

  // this is a mark of type join
  // split the current node at this mark position
  // delete this mark together with its zwsp content
  // assign left and right node (after the split) properties from the mark's data
  tr.delete(from, to);
  tr.split(from);

  // insertionFrom is now at the end of the left node (but before the closing token)
  // after() will give us the position after the closing token (but before the next opening token) - exactly the split pos
  const $insertionFrom = tr.doc.resolve(from);
  const $splitPos = tr.doc.resolve($insertionFrom.after());

  const { attrs } = mark;

  if (!isJoinMarkAttrs(attrs) || !$splitPos.nodeBefore || !$splitPos.nodeAfter)
    return false;

  // restore left and right node type, attrs and marks, as they were before the join
  const { leftNode, rightNode } = attrs.data;

  const leftNodeType = tr.doc.type.schema.nodes[leftNode.type];
  const rightNodeType = tr.doc.type.schema.nodes[rightNode.type];

  const leftNodeMarks = leftNode.marks.map((markData) =>
    Mark.fromJSON(tr.doc.type.schema, markData),
  );
  const rightNodeMarks = rightNode.marks.map((markData) =>
    Mark.fromJSON(tr.doc.type.schema, markData),
  );

  if (!leftNodeType || !rightNodeType) return false;

  tr.setNodeMarkup(
    $splitPos.pos - $splitPos.nodeBefore.nodeSize,
    leftNodeType,
    leftNode.attrs,
    leftNodeMarks,
  );

  tr.setNodeMarkup(
    $splitPos.pos,
    rightNodeType,
    rightNode.attrs,
    rightNodeMarks,
  );

  return true;
}

/**
 * Remove ZWSP text nodes marked as deletions (except for type=join) from the given range
 */
export function removeZWSPDeletions(
  trackedTransaction: Transaction,
  from: number,
  to: number,
) {
  const transform = new Transform(trackedTransaction.doc);

  const $from = transform.doc.resolve(from);
  const $to = transform.doc.resolve(to);

  const blockRange = $from.blockRange($to);
  const doc = transform.doc;

  if (!blockRange) return transform;

  const { deletion } = getSuggestionMarks(transform.doc.type.schema);

  doc.nodesBetween(blockRange.start, blockRange.end, (node, pos) => {
    const joinMark = node.marks.find(
      (mark) => mark.type === deletion && mark.attrs["type"] === "join",
    );

    const isZWSPNode =
      node.isText &&
      node.text === ZWSP &&
      deletion.isInSet(node.marks) &&
      joinMark == null;

    if (!isZWSPNode) return true;

    const mappedPos = transform.mapping.map(pos);
    transform.delete(mappedPos, mappedPos + node.nodeSize);

    return true;
  });

  return transform;
}

/**
 * Join nodes in the given range,
 * add deletion marks of type="join" at the join points
 */
export function joinNodesAndMarkJoinPoints(
  trackedTransaction: Transaction,
  from: number,
  to: number,
  markId: SuggestionId,
) {
  const transform = new Transform(trackedTransaction.doc);

  const $from = transform.doc.resolve(from);
  const $to = transform.doc.resolve(to);

  const blockRange = $from.blockRange($to);
  const doc = transform.doc;

  if (!blockRange) return transform;

  const { deletion } = getSuggestionMarks(transform.doc.type.schema);

  doc.nodesBetween(blockRange.start, blockRange.end, (node, pos) => {
    if (node.isInline) return false;

    const endOfNode = pos + node.nodeSize;
    // make sure the node ends within the range
    if (endOfNode >= blockRange.$to.pos) return false;

    const $endOfNode = doc.resolve(endOfNode);
    // make sure we are between two nodes
    if (!$endOfNode.nodeBefore || !$endOfNode.nodeAfter) return false;

    const mappedEndOfNode = transform.mapping.map(endOfNode);
    const $mappedEndOfNode = transform.doc.resolve(mappedEndOfNode);

    if (
      !canJoin(transform.doc, mappedEndOfNode) ||
      !$mappedEndOfNode.nodeBefore ||
      !$mappedEndOfNode.nodeAfter
    ) {
      return true;
    }

    const leftNode = {
      type: $endOfNode.nodeBefore.type.name,
      attrs: $endOfNode.nodeBefore.attrs,
      marks: $endOfNode.nodeBefore.marks.map((mark) => mark.toJSON() as object),
    };

    const rightNode = {
      type: $endOfNode.nodeAfter.type.name,
      attrs: $endOfNode.nodeAfter.attrs,
      marks: $endOfNode.nodeAfter.marks.map((mark) => mark.toJSON() as object),
    };

    transform.join(mappedEndOfNode);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const joinStep = transform.steps[transform.steps.length - 1]!;
    const joinPos = joinStep.getMap().map(mappedEndOfNode);

    transform.insert(joinPos, transform.doc.type.schema.text(ZWSP));
    transform.addMark(
      joinPos,
      joinPos + 1,
      deletion.create({
        id: markId,
        type: "join",
        data: { leftNode, rightNode },
      }),
    );

    return false;
  });

  return transform;
}

/**
 * Find ZWSP nodes marked as insertions and deletions with the same mark id
 * Delete them from the given range
 */
export function collapseZWSPNodes(
  trackedTransaction: Transaction,
  from: number,
  to: number,
) {
  const transform = new Transform(trackedTransaction.doc);

  const $from = transform.doc.resolve(from);
  const $to = transform.doc.resolve(to);

  const blockRange = $from.blockRange($to);

  if (!blockRange) return transform;

  const { insertion } = getSuggestionMarks(transform.doc.type.schema);

  let joinPos: number | null = null as number | null;
  let insertionPos: number | null = null as number | null;
  let insertionPairPos: number | null = null as number | null;

  transform.doc.nodesBetween(blockRange.start, blockRange.end, (node, pos) => {
    const { deletion } = getSuggestionMarks(transform.doc.type.schema);

    const joinZWSP = node.marks.find(
      (mark) => mark.type === deletion && mark.attrs["type"] === "join",
    );
    if (joinZWSP && joinPos === null) joinPos = pos;

    const insertionZWSP = node.marks.find((mark) => mark.type === insertion);
    if (insertionZWSP && insertionPos !== null && insertionPairPos === null)
      insertionPairPos = pos;
    if (insertionZWSP && insertionPos === null) insertionPos = pos;

    return joinPos == null || insertionPos == null || insertionPairPos == null;
  });

  if (joinPos !== null && insertionPos !== null && insertionPairPos !== null) {
    const between = transform.doc.textBetween(
      joinPos,
      insertionPairPos + 1,
      "__BLOCK__",
      "__LEAF__",
    );

    if (between === `${ZWSP}${ZWSP}__BLOCK__${ZWSP}`) {
      // delete only if there is no real content in between the join and insertion zwsp marks
      const toDelete = [joinPos, insertionPos, insertionPairPos];
      for (const pos of toDelete) {
        const mappedPos = transform.mapping.map(pos);
        transform.delete(mappedPos, mappedPos + 1);
      }
    }
  }

  return transform;
}

export function findJoinMark(pos: ResolvedPos) {
  if (!pos.nodeAfter) return null;
  const { deletion } = getSuggestionMarks(pos.doc.type.schema);
  return (
    pos.nodeAfter.marks.find(
      (mark) => mark.type === deletion && mark.attrs["type"] === "join",
    ) ?? null
  );
}
