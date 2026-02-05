import { type Transaction, type Command } from "prosemirror-state";
import { suggestChangesKey } from "../../plugin.js";
import { getSuggestionMarks } from "../../utils.js";
import { type SuggestionId } from "../../generateId.js";
import { type Node, type Mark, Slice } from "prosemirror-model";
import {
  ReplaceAroundStep,
  ReplaceStep,
  type Transform,
} from "prosemirror-transform";

export function isStructureSuggestion(
  suggestionId: SuggestionId,
  tr: Transaction,
) {
  try {
    findStructureMarkGroupBySuggestionId(suggestionId, tr);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error: unknown) {
    return false;
  }
}

export function revertAllStructureSuggestions(doc: Node, tr: Transaction) {
  const { structure } = getSuggestionMarks(doc.type.schema);

  // find structure mark in the doc
  // if found, revert it, produce a new doc
  // find next structure mark in the new doc
  // easier than going nodesBetween on the original doc,
  //    and then mapping the position, figuring out if the node is present in the new doc or was deleted

  const findStructureMark = (doc: Node) => {
    let structureMark = null as Mark | null;
    doc.nodesBetween(0, doc.content.size, (node) => {
      structureMark = structureMark ?? structure.isInSet(node.marks) ?? null;
      return structureMark === null;
    });
    return structureMark;
  };

  let curDoc = doc;
  let structureMark = findStructureMark(doc);

  while (structureMark !== null) {
    const suggestionId = structureMark.attrs["id"] as SuggestionId;
    performStructureRevert(suggestionId, tr);
    curDoc = tr.doc;
    structureMark = findStructureMark(curDoc);
  }
}

export function revertStructureSuggestion(suggestionId: SuggestionId): Command {
  return (state, dispatch) => {
    const tr = state.tr;
    performStructureRevert(suggestionId, tr);
    if (!tr.steps.length) return false;
    tr.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(tr);
    return true;
  };
}

export function applyStructureSuggestion(suggestionId: SuggestionId): Command {
  return (state, dispatch) => {
    const tr = state.tr;
    performStructureRevert(suggestionId, tr, "apply");
    if (!tr.steps.length) return false;
    tr.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(tr);
    return true;
  };
}

export function revertStructureSuggestions(
  suggestionIds: SuggestionId[],
): Command {
  return (state, dispatch) => {
    const tr = state.tr;
    suggestionIds.forEach((suggestionId) => {
      performStructureRevert(suggestionId, tr);
    });
    if (!tr.steps.length) return false;
    tr.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(tr);
    return true;
  };
}

function performStructureRevert(
  suggestionId: SuggestionId,
  tr: Transform,
  direction: "apply" | "revert" = "revert",
) {
  console.groupCollapsed(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `performStructureRevert, suggestionId = ${suggestionId}`,
  );
  const { structure } = getSuggestionMarks(tr.doc.type.schema);

  // find main suggestion from and to
  const { markFrom, markTo, markGapFrom, markGapTo } =
    findStructureMarkGroupBySuggestionId(suggestionId, tr);

  const from = getPosFromMark(markFrom.mark, markFrom.pos, markFrom.node);
  const to = getPosFromMark(markTo.mark, markTo.pos, markTo.node);

  if (from == null || to == null) {
    throw new Error(`Could not find all positions for suggestion`);
  }

  // find all other structure suggestions within from and to interval of the main suggestion
  const structureMarkGroups = new Set<SuggestionId>();
  structureMarkGroups.add(suggestionId);

  if (markGapFrom != null) {
    const gapFrom = getPosFromMark(
      markGapFrom.mark,
      markGapFrom.pos,
      markGapFrom.node,
    );
    const gapTo = getPosFromMark(markGapTo.mark, markGapTo.pos, markGapTo.node);
    if (gapFrom == null || gapTo == null) {
      throw new Error(`Could not find all positions for suggestion`);
    }

    tr.doc.nodesBetween(from, to, (node, pos) => {
      node.marks.forEach((mark) => {
        if (mark.type !== structure) return;

        const markData = mark.attrs["data"] as { value?: string } | null;
        if (!markData) return;

        const id = mark.attrs["id"] as SuggestionId;
        if (id === suggestionId) return;

        const startsInGap = gapFrom <= pos && pos <= gapTo;
        const endsInGap =
          gapFrom <= pos + node.nodeSize && pos + node.nodeSize <= gapTo;
        if (startsInGap && endsInGap) {
          console.log(
            "ignored mark",
            { node, pos, end: pos + node.nodeSize, mark },
            " - starts and ends in gap",
            "from-gapFrom-gapTo-to",
            { from, gapFrom, gapTo, to },
          );
          return;
        }

        const startsInRange =
          (from <= pos && pos <= gapFrom) || (gapTo <= pos && pos <= to);
        const endsInRange =
          (from <= pos + node.nodeSize && pos + node.nodeSize <= gapFrom) ||
          (gapTo <= pos + node.nodeSize && pos + node.nodeSize <= to);

        if (!startsInRange && !endsInRange) {
          console.log(
            "ignored mark",
            { node, pos, end: pos + node.nodeSize, mark },
            " - does not start or end in range",
            "from-gapFrom-gapTo-to",
            { from, gapFrom, gapTo, to },
          );
          return;
        }

        console.log(
          "found nested structure mark",
          {
            id,
            node,
            pos,
            nodeStart: pos,
            nodeEnd: pos + node.nodeSize,
          },
          "from-gapFrom-gapTo-to",
          { from, gapFrom, gapTo, to },
        );

        structureMarkGroups.add(id);
      });
    });
  } else {
    tr.doc.nodesBetween(from, to, (node, pos) => {
      node.marks.forEach((mark) => {
        if (mark.type !== structure) return;

        const markData = mark.attrs["data"] as { value?: string } | null;
        if (!markData) return;

        const id = mark.attrs["id"] as SuggestionId;
        if (id === suggestionId) return;

        const startsInRange = from <= pos && pos <= to;
        const endsInRange =
          from <= pos + node.nodeSize && pos + node.nodeSize <= to;

        if (!startsInRange && !endsInRange) {
          console.log(
            "ignored mark",
            { node, pos, end: pos + node.nodeSize, mark },
            " - does not start or end in range",
            "from-to",
            { from, to },
          );
          return;
        }

        console.log(
          "found nested structure mark",
          {
            id,
            node,
            pos,
            nodeStart: pos,
            nodeEnd: pos + node.nodeSize,
          },
          "from-to",
          { from, to },
        );

        structureMarkGroups.add(id);
      });

      return true;
    });
  }

  // revert structure mark groups in decreasing order of their ids
  const markIds = Array.from(structureMarkGroups.values()).sort(
    (a, b) => Number(b) - Number(a),
  );

  markIds.forEach((id) => {
    const group = findStructureMarkGroupBySuggestionId(id, tr);
    if (direction === "apply") {
      applyStructureMarkGroup(group, tr);
    } else {
      revertStructureMarkGroup(group, tr);
    }
  });

  console.groupEnd();
}

function getPosFromMark(mark: Mark, pos: number, node: Node) {
  const markData = mark.attrs["data"] as { position?: string } | null;
  if (!markData) return null;
  if (markData.position === "start") {
    return pos;
  }
  if (markData.position === "end") {
    return pos + node.nodeSize;
  }
  if (markData.position === "innerStart") {
    return pos + 1;
  }
  if (markData.position === "innerEnd") {
    return pos + node.nodeSize - 1;
  }
  return null;
}

export function applyStructureMarkGroup(
  group:
    | {
        type: "replaceAround";
        markFrom: { pos: number; node: Node; mark: Mark };
        markTo: { pos: number; node: Node; mark: Mark };
        markGapFrom: { pos: number; node: Node; mark: Mark };
        markGapTo: { pos: number; node: Node; mark: Mark };
      }
    | {
        type: "replace";
        markFrom: { pos: number; node: Node; mark: Mark };
        markTo: { pos: number; node: Node; mark: Mark };
      },
  tr: Transform,
) {
  console.groupCollapsed(
    "apply structure group, id = ",
    group.markFrom.mark.attrs["id"],
  );
  console.log({ group });

  if (group.type === "replace") {
    const { markFrom, markTo } = group;
    tr.removeNodeMark(markFrom.pos, markFrom.mark);
    tr.removeNodeMark(markTo.pos, markTo.mark);
    console.groupEnd();
    return;
  }

  const { markFrom, markTo, markGapFrom, markGapTo } = group;
  tr.removeNodeMark(markFrom.pos, markFrom.mark);
  tr.removeNodeMark(markTo.pos, markTo.mark);
  tr.removeNodeMark(markGapFrom.pos, markGapFrom.mark);
  tr.removeNodeMark(markGapTo.pos, markGapTo.mark);
  console.groupEnd();
}

function revertStructureMarkGroup(
  group:
    | {
        type: "replaceAround";
        markFrom: { pos: number; node: Node; mark: Mark };
        markTo: { pos: number; node: Node; mark: Mark };
        markGapFrom: { pos: number; node: Node; mark: Mark };
        markGapTo: { pos: number; node: Node; mark: Mark };
      }
    | {
        type: "replace";
        markFrom: { pos: number; node: Node; mark: Mark };
        markTo: { pos: number; node: Node; mark: Mark };
      },
  tr: Transform,
) {
  console.groupCollapsed(
    "revert structure group, id = ",
    group.markFrom.mark.attrs["id"],
  );
  console.log({ group });

  if (group.type === "replace") {
    const { markFrom, markTo } = group;
    // extract positions from, to, gapFrom and gapTo from marks
    // the positions are either the mark's start, or the mark's end
    const from = getPosFromMark(markFrom.mark, markFrom.pos, markFrom.node);

    const to = getPosFromMark(markTo.mark, markTo.pos, markTo.node);

    if (from === null || to === null) {
      throw new Error(`Could not find all positions for suggestion`);
    }

    // extract the rest of the data required to reconstruct the step: slice, and structure
    // any of those 2 marks can be used for that, this data is identical in all of them
    const mark = markFrom.mark;
    const markData = mark.attrs["data"] as {
      slice?: object;
      structure?: boolean;
    } | null;

    if (!markData) {
      throw new Error(`Missing mark data for suggestion`);
    }

    const slice = markData.slice
      ? Slice.fromJSON(tr.doc.type.schema, markData.slice)
      : Slice.empty;
    const isStepStructural = markData.structure ?? false;

    // reconstruct the step
    // this is the inverse step of the step that created this change
    const step = new ReplaceStep(from, to, slice, isStepStructural);
    console.log({ step });

    tr.removeNodeMark(markFrom.pos, markFrom.mark);
    tr.removeNodeMark(markTo.pos, markTo.mark);

    tr.step(step);

    console.groupEnd();

    return;
  }

  const { markFrom, markTo, markGapFrom, markGapTo } = group;
  // extract positions from, to, gapFrom and gapTo from marks
  // the positions are either the mark's start, or the mark's end
  const from = getPosFromMark(markFrom.mark, markFrom.pos, markFrom.node);

  const to = getPosFromMark(markTo.mark, markTo.pos, markTo.node);

  const gapFrom = getPosFromMark(
    markGapFrom.mark,
    markGapFrom.pos,
    markGapFrom.node,
  );

  const gapTo = getPosFromMark(markGapTo.mark, markGapTo.pos, markGapTo.node);

  if (from === null || to === null || gapFrom === null || gapTo === null) {
    throw new Error(`Could not find all positions for suggestion`);
  }

  // extract the rest of the data required to reconstruct the step: insert, slice, and structure
  // any of those 4 marks can be used for that, this data is identical in all of them
  const mark = markGapFrom.mark;
  const markData = mark.attrs["data"] as {
    slice?: object;
    insert?: number;
    structure?: boolean;
  } | null;

  if (markData?.insert == null) {
    throw new Error(`Missing insert for suggestion`);
  }

  const slice = markData.slice
    ? Slice.fromJSON(tr.doc.type.schema, markData.slice)
    : Slice.empty;
  const insert = markData.insert;
  const isStepStructural = markData.structure ?? false;

  // reconstruct the step
  // this is the inverse step of the step that created this change
  const step = new ReplaceAroundStep(
    from,
    to,
    gapFrom,
    gapTo,
    slice,
    insert,
    isStepStructural,
  );
  console.log({ step });

  tr.removeNodeMark(markFrom.pos, markFrom.mark);
  tr.removeNodeMark(markTo.pos, markTo.mark);
  tr.removeNodeMark(markGapFrom.pos, markGapFrom.mark);
  tr.removeNodeMark(markGapTo.pos, markGapTo.mark);

  tr.step(step);

  console.groupEnd();
}

function findStructureMarkGroupBySuggestionId(
  suggestionId: SuggestionId,
  tr: Transform,
) {
  const { structure } = getSuggestionMarks(tr.doc.type.schema);

  let markFrom = null as { pos: number; node: Node; mark: Mark } | null;
  let markTo = null as { pos: number; node: Node; mark: Mark } | null;
  let markGapFrom = null as { pos: number; node: Node; mark: Mark } | null;
  let markGapTo = null as { pos: number; node: Node; mark: Mark } | null;

  // using suggestionId, find 4 marks: from, to, gapFrom and gapTo
  tr.doc.nodesBetween(0, tr.doc.content.size, (node, pos) => {
    node.marks.forEach((mark) => {
      if (mark.type !== structure) return;
      if (mark.attrs["id"] !== suggestionId) return;

      const markData = mark.attrs["data"] as { value?: string } | null;
      if (!markData) return;

      if (markData.value === "from") {
        markFrom = { pos, node, mark };
      }

      if (markData.value === "to") {
        markTo = { pos, node, mark };
      }

      if (markData.value === "gapFrom") {
        markGapFrom = { pos, node, mark };
      }

      if (markData.value === "gapTo") {
        markGapTo = { pos, node, mark };
      }
    });

    return (
      markFrom == null ||
      markTo == null ||
      markGapFrom == null ||
      markGapTo == null
    );
  });

  if (markFrom == null || markTo == null) {
    throw new Error(
      `Could not find all marks for suggestion id ${suggestionId as string}`,
    );
  }

  const type = (markFrom.mark.attrs["data"] as { type?: string } | null)?.type;

  if (type === "replace") {
    return { type: "replace" as const, markFrom, markTo };
  }

  if (markGapFrom == null || markGapTo == null) {
    throw new Error(
      `Could not find all gap marks for replace around suggestion id ${suggestionId as string}`,
    );
  }

  return {
    type: "replaceAround" as const,
    markFrom,
    markTo,
    markGapFrom,
    markGapTo,
  };
}
