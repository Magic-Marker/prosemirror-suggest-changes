import { type Command } from "prosemirror-state";
import { suggestChangesKey } from "../../plugin.js";
import { getSuggestionMarks } from "../../utils.js";
import { type SuggestionId } from "../../generateId.js";
import { type Node, type Mark, Slice } from "prosemirror-model";
import { ReplaceAroundStep, type Transform } from "prosemirror-transform";

export function revertStructureSuggestion(suggestionId: SuggestionId): Command {
  return (state, dispatch) => {
    const { structure } = getSuggestionMarks(state.schema);
    const tr = state.tr;

    // find main suggestion from and to
    const { markFrom, markTo } = findStructureMarkGroupBySuggestionId(
      suggestionId,
      tr,
    );

    const from = getPosFromMark(markFrom.mark, markFrom.pos, markFrom.node);
    const to = getPosFromMark(markTo.mark, markTo.pos, markTo.node);

    if (from == null || to == null) {
      throw new Error(`Could not find all positions for suggestion`);
    }

    // find all other structure suggestions within from and to interval of the main suggestion
    const structureMarkGroups = new Set<SuggestionId>();
    structureMarkGroups.add(suggestionId);

    tr.doc.nodesBetween(from, to, (node) => {
      node.marks.forEach((mark) => {
        if (mark.type !== structure) return;

        const markData = mark.attrs["data"] as { value?: string } | null;
        if (!markData) return;

        const id = mark.attrs["id"] as SuggestionId;
        if (id === suggestionId) return;

        structureMarkGroups.add(id);
      });
    });

    // revert structure mark groups in decreasing order of their ids
    const markIds = Array.from(structureMarkGroups.values()).sort(
      (a, b) => Number(b) - Number(a),
    );

    markIds.forEach((id) => {
      const { markFrom, markTo, markGapFrom, markGapTo } =
        findStructureMarkGroupBySuggestionId(id, tr);
      revertStructureMarkGroup(markFrom, markTo, markGapFrom, markGapTo, tr);
    });

    if (!tr.steps.length) return false;

    tr.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(tr);

    return true;
  };
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
  return null;
}

function revertStructureMarkGroup(
  markFrom: { pos: number; node: Node; mark: Mark },
  markTo: { pos: number; node: Node; mark: Mark },
  markGapFrom: { pos: number; node: Node; mark: Mark },
  markGapTo: { pos: number; node: Node; mark: Mark },
  tr: Transform,
) {
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

  if (!markData || !markData.slice || markData.insert == null) {
    throw new Error(`Missing slice data for suggestion`);
  }

  const slice = Slice.fromJSON(tr.doc.type.schema, markData.slice);
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

  console.log("applying step", step.toJSON());

  tr.removeNodeMark(markFrom.pos, markFrom.mark);
  tr.removeNodeMark(markTo.pos, markTo.mark);
  tr.removeNodeMark(markGapFrom.pos, markGapFrom.mark);
  tr.removeNodeMark(markGapTo.pos, markGapTo.mark);

  tr.step(step);
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

  if (
    markFrom == null ||
    markTo == null ||
    markGapFrom == null ||
    markGapTo == null
  ) {
    throw new Error(
      `Could not find all marks for suggestion id ${suggestionId as string}`,
    );
  }

  return { markFrom, markTo, markGapFrom, markGapTo };
}
