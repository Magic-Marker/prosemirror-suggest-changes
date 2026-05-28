import {
  Mark,
  type Node,
  type Attrs,
  type MarkType,
  type ResolvedPos,
  type Schema,
} from "prosemirror-model";
import { canJoin, Transform } from "prosemirror-transform";
import { ZWSP } from "../../constants.js";
import { type Transaction } from "prosemirror-state";
import { type SuggestionId } from "../../generateId.js";
import { getSuggestionMarks } from "../../utils.js";
import { areEquivalentStructureMarks } from "../wrapUnwrap/areEquivalentStructureMarks.js";
import { guardStructureMarkAttrs } from "../wrapUnwrap/types.js";

// Block join suggestion metadata/revert currently supports the depth TipTap uses
// when Backspace joins both list-item paragraphs and their parent list items.
const MAX_BLOCK_JOIN_DEPTH = 2;

interface SerializedJoinNode {
  type: string;
  attrs: object;
  marks: object[];
}

interface JoinMarkAttrs {
  type: "join";
  data: {
    // Legacy shape from single-depth Block join suggestions.
    leftNode?: SerializedJoinNode;
    rightNode?: SerializedJoinNode;
    // Current child-first shape for multi-depth Block join suggestions.
    leftNodes?: SerializedJoinNode[];
    rightNodes?: SerializedJoinNode[];
  };
}

interface JoinPair {
  leftNode: Node;
  rightNode: Node;
}

interface JoinCandidate {
  joinPos: number;
  leftNodes: Node[];
  rightNodes: Node[];
}

function isSerializedJoinNode(node: unknown): node is SerializedJoinNode {
  if (node === null || typeof node !== "object") return false;

  const data = node as Record<keyof SerializedJoinNode, unknown>;
  return (
    typeof data.type === "string" &&
    typeof data.attrs === "object" &&
    data.attrs !== null &&
    Array.isArray(data.marks)
  );
}

function normalizeJoinNodes(attrs: Attrs) {
  if (attrs["type"] !== "join") return false;
  if (attrs["data"] == null) return false;

  const data = attrs["data"] as Partial<JoinMarkAttrs["data"]>;

  // Normalize legacy metadata so revert can use the same array path.
  const leftNodes = data.leftNodes ?? (data.leftNode ? [data.leftNode] : null);
  const rightNodes =
    data.rightNodes ?? (data.rightNode ? [data.rightNode] : null);

  if (!Array.isArray(leftNodes) || !Array.isArray(rightNodes)) return false;
  if (leftNodes.length === 0 || leftNodes.length !== rightNodes.length)
    return false;

  // Reject unsupported depths instead of partially reverting unknown structure.
  if (leftNodes.length > MAX_BLOCK_JOIN_DEPTH) return false;

  if (!leftNodes.every(isSerializedJoinNode)) return false;
  if (!rightNodes.every(isSerializedJoinNode)) return false;

  return { leftNodes, rightNodes };
}

export function isJoinMarkAttrs(attrs: Attrs): attrs is JoinMarkAttrs {
  return normalizeJoinNodes(attrs) !== false;
}

function serializeJoinNode(node: Node): SerializedJoinNode {
  return {
    type: node.type.name,
    attrs: node.attrs,
    marks: node.marks.map((mark) => mark.toJSON() as object),
  };
}

function marksFromJSON(schema: Schema, markData: object[]) {
  return markData.map((markData) => Mark.fromJSON(schema, markData));
}

// when we revert a block join deletion mark, we restore nodes on both sides of the mark using leftNodes rightNodes metadata
// but existing left and right nodes may have structure marks that we need to preserve
function mergeSerializedMarksWithCurrentStructureMarks(
  tr: Transform,
  pos: number,
  serializedMarks: Mark[],
) {
  const currentNode = tr.doc.nodeAt(pos);
  if (!currentNode) return serializedMarks;

  const { structure } = getSuggestionMarks(tr.doc.type.schema);
  const mergedMarks = [...serializedMarks];

  for (const currentMark of currentNode.marks) {
    if (currentMark.type !== structure) continue;

    const alreadyIncluded = mergedMarks.some(
      (mark) =>
        mark.type === structure &&
        areEquivalentStructureMarks(mark, currentMark),
    );

    if (!alreadyIncluded) {
      mergedMarks.push(currentMark);
    }
  }

  return mergedMarks;
}

function restoreNodeMarkup(
  tr: Transform,
  pos: number,
  node: SerializedJoinNode,
) {
  const nodeType = tr.doc.type.schema.nodes[node.type];
  if (!nodeType) return false;

  const marks = mergeSerializedMarksWithCurrentStructureMarks(
    tr,
    pos,
    marksFromJSON(tr.doc.type.schema, node.marks),
  );

  tr.setNodeMarkup(pos, nodeType, node.attrs, marks);
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

  const joinNodes = normalizeJoinNodes(mark.attrs);
  if (!joinNodes) return false;

  for (const node of [...joinNodes.leftNodes, ...joinNodes.rightNodes]) {
    const nodeType = tr.doc.type.schema.nodes[node.type];
    if (!nodeType) return false;

    try {
      marksFromJSON(tr.doc.type.schema, node.marks);
    } catch {
      return false;
    }
  }

  // Reverting a join marker removes its ZWSP anchor, splits at that position,
  // and restores markup because ProseMirror split creates nodes with defaults.
  const joinDepth = joinNodes.leftNodes.length;
  tr.delete(from, to);
  tr.split(from, joinDepth);

  const $splitFrom = tr.doc.resolve(from);
  const baseDepth = $splitFrom.depth;
  let rightPos = $splitFrom.after(baseDepth - joinDepth + 1);

  // Metadata is stored child-first, but markup must be restored outer-first so
  // positions inside the newly split structure remain addressable.
  for (let index = joinDepth - 1; index >= 0; index -= 1) {
    const leftNode = joinNodes.leftNodes[index];
    const rightNode = joinNodes.rightNodes[index];
    if (!leftNode || !rightNode) return false;

    const leftPos = $splitFrom.before(baseDepth - index);

    if (
      !restoreNodeMarkup(tr, leftPos, leftNode) ||
      !restoreNodeMarkup(tr, rightPos, rightNode)
    ) {
      return false;
    }

    // Each deeper right node starts one position inside the right node restored before it.
    rightPos += 1;
  }

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
    if (endOfNode >= blockRange.$to.pos) return true;

    // List-item joins can start between non-textblock nodes; expand inward to
    // capture the visible textblock pair and its structural parent pair.
    const joinCandidate = getJoinCandidateAtBoundary(
      doc,
      endOfNode,
      from,
      to,
      MAX_BLOCK_JOIN_DEPTH,
    );

    if (!joinCandidate) return true;

    const mappedJoinPos = transform.mapping.map(joinCandidate.joinPos);

    if (
      !canApplyJoinCandidate(
        transform.doc,
        mappedJoinPos,
        joinCandidate.leftNodes.length,
      )
    ) {
      return true;
    }

    const shouldSuppressJoinMark = [
      ...joinCandidate.leftNodes,
      ...joinCandidate.rightNodes,
    ].some((node) => hasStructureAddMark(node));

    transform.join(mappedJoinPos, joinCandidate.leftNodes.length);

    // Joining provisional structure cancels its pending add instead of creating
    // a second review artifact for the same user action.
    if (shouldSuppressJoinMark) return false;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const joinStep = transform.steps[transform.steps.length - 1]!;
    const joinPos = joinStep.getMap().map(mappedJoinPos);

    transform.insert(joinPos, transform.doc.type.schema.text(ZWSP));
    transform.addMark(
      joinPos,
      joinPos + 1,
      deletion.create({
        id: markId,
        type: "join",
        data: {
          leftNodes: joinCandidate.leftNodes.map(serializeJoinNode),
          rightNodes: joinCandidate.rightNodes.map(serializeJoinNode),
        },
      }),
    );

    return false;
  });

  return transform;
}

function getJoinCandidateAtBoundary(
  doc: Node,
  boundaryPos: number,
  from: number,
  to: number,
  maxJoinDepth: number,
): JoinCandidate | null {
  const $boundary = doc.resolve(boundaryPos);
  const leftNode = $boundary.nodeBefore;
  const rightNode = $boundary.nodeAfter;

  // Multi-depth list joins can begin between structural nodes, not just textblocks.
  if (!leftNode || !rightNode) return null;
  if (leftNode.isInline || rightNode.isInline) return null;

  if (!canJoin(doc, boundaryPos)) return null;

  const pairs: JoinPair[] = [{ leftNode, rightNode }];

  for (let expandBy = 1; pairs.length < maxJoinDepth; expandBy += 1) {
    const left = boundaryPos - expandBy;
    const right = boundaryPos + expandBy;

    if (left < from || right > to) break;

    const $left = doc.resolve(left);
    const $right = doc.resolve(right);

    // Once text is adjacent, there is no deeper block pair to capture.
    if ($left.nodeBefore?.isText || $right.nodeAfter?.isText) break;

    if (
      $left.nodeAfter === null &&
      $left.nodeBefore &&
      !$left.nodeBefore.isInline &&
      $right.nodeBefore === null &&
      $right.nodeAfter &&
      !$right.nodeAfter.isInline
    ) {
      pairs.push({
        leftNode: $left.nodeBefore,
        rightNode: $right.nodeAfter,
      });
      continue;
    }

    break;
  }

  // canJoin only checks the boundary; the temporary transform verifies depth.
  if (!canApplyJoinCandidate(doc, boundaryPos, pairs.length)) return null;

  return {
    joinPos: boundaryPos,
    leftNodes: pairs.map((pair) => pair.leftNode).reverse(),
    rightNodes: pairs.map((pair) => pair.rightNode).reverse(),
  };
}

function canApplyJoinCandidate(doc: Node, joinPos: number, depth: number) {
  if (!canJoin(doc, joinPos)) return false;

  try {
    new Transform(doc).join(joinPos, depth);
    return true;
  } catch {
    return false;
  }
}

function hasStructureAddMark(node: Node) {
  const { structure } = getSuggestionMarks(node.type.schema);

  return node.marks.some((mark) => {
    if (mark.type !== structure) return false;
    if (!guardStructureMarkAttrs(mark.attrs)) return false;

    return mark.attrs.data.op.op === "add";
  });
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
