import { type Mark, type MarkType, type Node } from "prosemirror-model";
import {
  type Command,
  type EditorState,
  TextSelection,
} from "prosemirror-state";
import { Transform } from "prosemirror-transform";
import { type EditorView } from "prosemirror-view";

import { findSuggestionMarkEnd } from "./findSuggestionMarkEnd.js";
import { suggestChangesKey } from "./plugin.js";
import { getSuggestionMarks } from "./utils.js";
import { type SuggestionId } from "./generateId.js";
import { ZWSP } from "./constants.js";
import { maybeRevertJoinMark } from "./features/joinOnDelete/index.js";
import {
  revertAllStructureSuggestions,
  revertStructureSuggestion,
} from "./features/wrapUnwrap/revert/index.js";
import {
  applyAllStructureSuggestions,
  applyStructureSuggestion,
} from "./features/wrapUnwrap/apply/index.js";

/**
 * Given a node and a transform, add a set of steps to the
 * transform that applies all marks of type markTypeToApply
 * and reverts all marks of type markTypeToRevert.
 *
 * If suggestionId is provided, will only add steps that impact
 * deletions, insertions, and modifications with that id.
 */
function applySuggestionsToTransform(
  node: Node,
  tr: Transform,
  markTypeToApply: MarkType,
  markTypeToRevert: MarkType,
  suggestionId?: SuggestionId,
  from?: number,
  to?: number,
) {
  const toApplyIsInSet =
    suggestionId === undefined
      ? (marks: readonly Mark[]) => markTypeToApply.isInSet(marks)
      : (marks: readonly Mark[]) => {
          const mark = markTypeToApply.isInSet(marks);
          return mark && mark.attrs["id"] === suggestionId ? mark : undefined;
        };

  const toRevertIsInSet =
    suggestionId === undefined
      ? (marks: readonly Mark[]) => markTypeToRevert.isInSet(marks)
      : (marks: readonly Mark[]) => {
          const mark = markTypeToRevert.isInSet(marks);
          return mark && mark.attrs["id"] === suggestionId ? mark : undefined;
        };

  const isToApply = toApplyIsInSet(node.marks);

  if (isToApply) {
    if (node.isInline) {
      tr.removeMark(0, node.nodeSize, markTypeToApply);
    } else {
      tr.removeNodeMark(0, markTypeToApply);
    }
  }
  const restoredStructureSuggestionIds = new Set<SuggestionId>();

  node.descendants((child, pos) => {
    if (from !== undefined && pos < from) {
      return true;
    }
    if (to !== undefined && pos > to) {
      return false;
    }
    const isToRevert = toRevertIsInSet(child.marks);
    const isToApply = toApplyIsInSet(child.marks);
    if (!isToRevert && !isToApply) {
      return true;
    }

    if (isToRevert) {
      const { pos: deletionFrom, deleted } = tr.mapping.mapResult(pos);
      if (deleted) return false;

      const deletionTo = findSuggestionMarkEnd(
        tr.doc.resolve(deletionFrom + child.nodeSize),
        markTypeToRevert,
      );
      // check if the previous and the next text part is a space
      // if so, we can delete the whole text part
      const prevChar = tr.doc.textBetween(
        deletionFrom - 1,
        deletionFrom,
        "x",
        "x",
      );
      const nextChar =
        // textBetween is fine with negative positions (??),
        // but it errors if passed a position greater than the
        // size of the doc
        deletionTo <= tr.doc.content.size
          ? tr.doc.textBetween(deletionTo, deletionTo + 1, "x", "x")
          : "";
      const addedRange = prevChar === " " && nextChar === " " ? 1 : 0;
      tr.deleteRange(deletionFrom, deletionTo + addedRange);
      return false;
    }

    const insertionFrom = tr.mapping.map(pos);
    const insertionTo = insertionFrom + child.nodeSize;
    if (child.isInline) {
      tr.removeMark(insertionFrom, insertionTo, markTypeToApply);
      const joinRevertResult = maybeRevertJoinMark(
        tr,
        insertionFrom,
        insertionTo,
        child,
        markTypeToApply,
      );
      // reverting a join mark may produce new structure marks that were serialized in the join metadata
      if (joinRevertResult)
        joinRevertResult.restoredStructureSuggestionIds.forEach((id) =>
          restoredStructureSuggestionIds.add(id),
        );
      if (!joinRevertResult && child.text === ZWSP) {
        tr.delete(insertionFrom, insertionTo);
      }
    } else {
      tr.removeNodeMark(insertionFrom, markTypeToApply);
    }
    return true;
  });
  return {
    restoredStructureSuggestionIds,
  };
}

function revertModifications(node: Node, pos: number, tr: Transform) {
  const { modification } = getSuggestionMarks(node.type.schema);
  const existingMods = node.marks.filter((mark) => mark.type === modification);
  for (const mod of existingMods) {
    if (
      mod.attrs["type"] === "attr" &&
      typeof mod.attrs["attrName"] === "string"
    ) {
      tr.setNodeAttribute(
        pos,
        mod.attrs["attrName"],
        mod.attrs["previousValue"],
      );
    } else if (mod.attrs["type"] === "mark") {
      if (mod.attrs["previousValue"]) {
        tr.addNodeMark(
          0,
          node.type.schema.markFromJSON(mod.attrs["previousValue"]),
        );
      } else {
        tr.removeNodeMark(
          pos,
          node.type.schema.markFromJSON(mod.attrs["previousValue"]),
        );
      }
    } else if (mod.attrs["type"] === "nodeType") {
      tr.setNodeMarkup(
        pos,
        node.type.schema.nodes[mod.attrs["previousValue"] as string],
        null,
      );
    } else {
      throw new Error("Unknown modification type");
    }
  }
}

function modificationIsInSet(
  modification: MarkType,
  id: SuggestionId | undefined,
  marks: readonly Mark[],
) {
  const mark = modification.isInSet(marks);
  if (id === undefined) return mark;

  if (mark?.attrs["id"] === id) return mark;

  return undefined;
}

function applyModificationsToTransform(
  node: Node,
  tr: Transform,
  dir: number,
  suggestionId?: SuggestionId,
  from?: number,
  to?: number,
) {
  const { modification } = getSuggestionMarks(node.type.schema);

  const isModification = modificationIsInSet(
    modification,
    suggestionId,
    node.marks,
  );

  if (isModification) {
    let prevLength: number;
    do {
      // https://github.com/ProseMirror/prosemirror/issues/1525
      prevLength = tr.steps.length;
      tr.removeNodeMark(0, modification);
    } while (tr.steps.length > prevLength);
    if (dir < 0) {
      revertModifications(node, 0, tr);
    }
  }

  node.descendants((child, pos) => {
    if (from !== undefined && pos < from) {
      return true;
    }
    if (to !== undefined && pos > to) {
      return false;
    }
    const isModification = modificationIsInSet(
      modification,
      suggestionId,
      child.marks,
    );
    if (!isModification) {
      return true;
    }

    let prevLength: number;
    do {
      // https://github.com/ProseMirror/prosemirror/issues/1525
      prevLength = tr.steps.length;
      tr.removeNodeMark(pos, modification);
    } while (tr.steps.length > prevLength);

    if (dir < 0) {
      revertModifications(child, pos, tr);
    }
    return true;
  });
}

export function applySuggestionsToNode(node: Node) {
  const { deletion, insertion } = getSuggestionMarks(node.type.schema);

  // first, create a structure transform that applies all structure changes on the given node
  const structureTransform = applyAllStructureSuggestions(node);

  // then start a clear transform from the document where the structure changes are applied
  const suggestionsTransform = new Transform(structureTransform.doc);
  applySuggestionsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    insertion,
    deletion,
  );
  applyModificationsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    1,
  );

  // replay suggestion transform on top of the structure transform
  suggestionsTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  const secondStructureTransform = applyAllStructureSuggestions(
    structureTransform.doc,
  );
  secondStructureTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  return structureTransform.doc;
}

export function applySuggestionsToRange(doc: Node, from: number, to: number) {
  const { deletion, insertion } = getSuggestionMarks(doc.type.schema);

  // blockRange can only return null if a predicate is provided
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const nodeRange = doc.resolve(from).blockRange(doc.resolve(to))!;

  // create a structure transform that applies all structure changes on the given node range
  const structureTransform = applyAllStructureSuggestions(
    doc,
    nodeRange.start,
    nodeRange.end,
  );

  // then start a clear transform from the document where the structure changes are applied
  const suggestionsTransform = new Transform(structureTransform.doc);
  applySuggestionsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    insertion,
    deletion,
    undefined,
    nodeRange.start,
    nodeRange.end,
  );
  applyModificationsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    1,
    undefined,
    nodeRange.start,
    nodeRange.end,
  );

  // replay suggestion transform on top of the structure transform
  suggestionsTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  const secondStructureTransform = applyAllStructureSuggestions(
    structureTransform.doc,
    structureTransform.mapping.map(from),
    structureTransform.mapping.map(to),
  );
  secondStructureTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  return structureTransform.doc.slice(
    structureTransform.mapping.map(from),
    structureTransform.mapping.map(to),
  );
}

/**
 * Command that applies all tracked changes in a document.
 *
 * This means that all content within deletion marks will be deleted.
 * Insertion marks and modification marks will be removed, and their
 * contents left in the doc.
 */
export function applySuggestions(
  state: EditorState,
  dispatch?: EditorView["dispatch"],
) {
  const { deletion, insertion } = getSuggestionMarks(state.schema);

  // create a structure transform that applies all structure changes on the given document
  const structureTransform = applyAllStructureSuggestions(state.doc);

  // then start a clear transform from the document where the structure changes are applied
  const suggestionsTransform = new Transform(structureTransform.doc);
  applySuggestionsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    insertion,
    deletion,
  );
  applyModificationsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    1,
  );

  // replay suggestion transform on top of the structure transform
  suggestionsTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  const secondStructureTransform = applyAllStructureSuggestions(
    structureTransform.doc,
  );
  secondStructureTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  // apply the structure transform to the transaction
  const transaction = state.tr;
  structureTransform.steps.forEach((step) => {
    transaction.step(step);
  });

  if (!transaction.steps.length) return false;

  transaction.setMeta(suggestChangesKey, { skip: true });
  dispatch?.(transaction);

  return true;
}

/**
 * Command that applies all tracked changes in specified range.
 *
 * This means that all content within deletion marks will be deleted.
 * Insertion marks and modification marks will be removed, and their
 * contents left in the doc.
 */
export function applySuggestionsInRange(from?: number, to?: number): Command {
  return (state, dispatch) => {
    const { deletion, insertion } = getSuggestionMarks(state.schema);

    // create a structure transform that applies all structure changes on the given node range
    const structureTransform = applyAllStructureSuggestions(
      state.doc,
      from,
      to,
    );

    // then start a clear transform from the document where the structure changes are applied
    const suggestionsTransform = new Transform(structureTransform.doc);
    applySuggestionsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      insertion,
      deletion,
      undefined,
      from,
      to,
    );
    applyModificationsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      1,
      undefined,
      from,
      to,
    );

    // replay suggestion transform on top of the structure transform
    suggestionsTransform.steps.forEach((step) => {
      structureTransform.step(step);
    });

    const secondStructureTransform = applyAllStructureSuggestions(
      structureTransform.doc,
      from === undefined ? undefined : structureTransform.mapping.map(from),
      to === undefined ? undefined : structureTransform.mapping.map(to),
    );
    secondStructureTransform.steps.forEach((step) => {
      structureTransform.step(step);
    });

    // apply the structure transform to the transaction
    const transaction = state.tr;
    structureTransform.steps.forEach((step) => {
      transaction.step(step);
    });

    if (!transaction.steps.length) return false;

    transaction.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(transaction);

    return true;
  };
}

/**
 * Command that applies a given tracked change to a document.
 *
 * This means that all content within the deletion mark will be deleted.
 * The insertion mark and modification mark will be removed, and their
 * contents left in the doc.
 */
export function applySuggestion(
  suggestionId: SuggestionId,
  from?: number,
  to?: number,
): Command {
  return (state, dispatch) => {
    const { deletion, insertion } = getSuggestionMarks(state.schema);

    // create a structure transform that applies the given structure change on the given node
    const structureTransform = applyStructureSuggestion(
      state.doc,
      suggestionId,
    );

    // then start a clear transform from the document where the structure changes are applied
    const suggestionsTransform = new Transform(structureTransform.doc);
    applySuggestionsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      insertion,
      deletion,
      suggestionId,
      from,
      to,
    );
    applyModificationsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      1,
      undefined,
      from,
      to,
    );

    // replay suggestion transform on top of the structure transform
    suggestionsTransform.steps.forEach((step) => {
      structureTransform.step(step);
    });

    // apply the structure transform to the transaction
    const transaction = state.tr;
    structureTransform.steps.forEach((step) => {
      transaction.step(step);
    });

    if (!transaction.steps.length) return false;

    transaction.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(transaction);

    return true;
  };
}

/**
 * Command that reverts all tracked changes in a document.
 *
 * This means that all content within insertion marks will be deleted.
 * Deletion marks will be removed, and their contents left in the doc.
 * Modifications tracked in modification marks will be reverted.
 */
export function revertSuggestions(
  state: EditorState,
  dispatch?: EditorView["dispatch"],
) {
  const { deletion, insertion } = getSuggestionMarks(state.schema);

  // create a structure transform that reverts all structure changes on the given document
  const structureTransform = revertAllStructureSuggestions(state.doc);

  // then start a clear transform from the document where the structure changes are reverted
  const suggestionsTransform = new Transform(structureTransform.doc);
  applySuggestionsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    deletion,
    insertion,
  );
  applyModificationsToTransform(
    suggestionsTransform.doc,
    suggestionsTransform,
    -1,
  );
  // replay suggestion transform on top of the structure transform
  suggestionsTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  const secondStructureTransform = revertAllStructureSuggestions(
    structureTransform.doc,
  );
  secondStructureTransform.steps.forEach((step) => {
    structureTransform.step(step);
  });

  // apply the structure transform to the transaction
  const transaction = state.tr;
  structureTransform.steps.forEach((step) => {
    transaction.step(step);
  });

  if (!transaction.steps.length) return false;

  transaction.setMeta(suggestChangesKey, { skip: true });
  dispatch?.(transaction);

  return true;
}

/**
 * Command that reverts all tracked changes in specified range.
 *
 * This means that all content within insertion marks will be deleted.
 * Deletion marks will be removed, and their contents left in the doc.
 * Modifications tracked in modification marks will be reverted.
 */
export function revertSuggestionsInRange(from?: number, to?: number): Command {
  return (state, dispatch) => {
    const { deletion, insertion } = getSuggestionMarks(state.schema);

    // create a structure transform that reverts all structure changes on the given node range
    const structureTransform = revertAllStructureSuggestions(
      state.doc,
      from,
      to,
    );

    // then start a clear transform from the document where the structure changes are reverted
    const suggestionsTransform = new Transform(structureTransform.doc);
    applySuggestionsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      deletion,
      insertion,
      undefined,
      from,
      to,
    );
    applyModificationsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      -1,
      undefined,
      from,
      to,
    );

    // replay suggestion transform on top of the structure transform
    suggestionsTransform.steps.forEach((step) => {
      structureTransform.step(step);
    });

    const secondStructureTransform = revertAllStructureSuggestions(
      structureTransform.doc,
      from === undefined ? undefined : structureTransform.mapping.map(from),
      to === undefined ? undefined : structureTransform.mapping.map(to),
    );
    secondStructureTransform.steps.forEach((step) => {
      structureTransform.step(step);
    });

    // apply the structure transform to the transaction
    const transaction = state.tr;
    structureTransform.steps.forEach((step) => {
      transaction.step(step);
    });

    if (!transaction.steps.length) return false;

    transaction.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(transaction);

    return true;
  };
}

/**
 * Command that reverts a given tracked change in a document.
 *
 * This means that all content within the insertion mark will be deleted.
 * The deletion mark will be removed, and their contents left in the doc.
 * Modifications tracked in modification marks will be reverted.
 */
export function revertSuggestion(
  suggestionId: SuggestionId,
  from?: number,
  to?: number,
): Command {
  return (state, dispatch) => {
    const { deletion, insertion } = getSuggestionMarks(state.schema);

    // create a structure transform that reverts the given structure change on the given node
    const structureTransform = revertStructureSuggestion(
      state.doc,
      suggestionId,
    );

    // then start a clear transform from the document where the structure changes are reverted
    const suggestionsTransform = new Transform(structureTransform.doc);
    const { restoredStructureSuggestionIds } = applySuggestionsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      deletion,
      insertion,
      suggestionId,
      from,
      to,
    );
    applyModificationsToTransform(
      suggestionsTransform.doc,
      suggestionsTransform,
      -1,
      undefined,
      from,
      to,
    );

    // replay suggestion transform on top of the structure transform
    suggestionsTransform.steps.forEach((step) => {
      structureTransform.step(step);
    });
    restoredStructureSuggestionIds.forEach((suggestionId) => {
      const restoredStructureTransform = revertStructureSuggestion(
        structureTransform.doc,
        suggestionId,
      );
      restoredStructureTransform.steps.forEach((step) => {
        structureTransform.step(step);
      });
    });

    // apply the structure transform to the transaction
    const transaction = state.tr;
    structureTransform.steps.forEach((step) => {
      transaction.step(step);
    });

    if (!transaction.steps.length) return false;

    transaction.setMeta(suggestChangesKey, { skip: true });
    dispatch?.(transaction);

    return true;
  };
}

/**
 * Command that updates the selection to cover an existing change.
 */
export function selectSuggestion(suggestionId: SuggestionId): Command {
  return (state, dispatch) => {
    const { deletion, insertion, modification } = getSuggestionMarks(
      state.schema,
    );

    let changeStart = null as number | null;
    let changeEnd = null as number | null;
    state.doc.descendants((node, pos) => {
      const mark = node.marks.find(
        (mark) =>
          mark.type === insertion ||
          mark.type === deletion ||
          mark.type === modification,
      );
      if (mark?.attrs["id"] !== suggestionId) return true;
      if (changeStart === null) {
        changeStart = pos;
        changeEnd = pos + node.nodeSize;
        return false;
      }
      changeEnd = pos + node.nodeSize;
      return false;
    });
    if (changeStart === null || changeEnd === null) {
      return false;
    }
    if (!dispatch) return true;

    dispatch(
      state.tr
        .setSelection(
          TextSelection.create(
            state.doc,
            changeStart as unknown as number,
            changeEnd as unknown as number,
          ),
        )
        .scrollIntoView(),
    );
    return true;
  };
}

/** Command that enables suggest changes */
export function enableSuggestChanges(
  state: EditorState,
  dispatch?: EditorView["dispatch"],
) {
  if (!suggestChangesKey.getState(state)) return false;
  if (!dispatch) return true;

  dispatch(state.tr.setMeta(suggestChangesKey, { skip: true, enabled: true }));
  return true;
}

/** Command that disables suggest changes */
export function disableSuggestChanges(
  state: EditorState,
  dispatch?: EditorView["dispatch"],
) {
  if (!suggestChangesKey.getState(state)) return false;
  if (!dispatch) return true;

  dispatch(state.tr.setMeta(suggestChangesKey, { skip: true, enabled: false }));
  return true;
}

/** Command that toggles suggest changes on or off */
export function toggleSuggestChanges(
  state: EditorState,
  dispatch?: EditorView["dispatch"],
) {
  const pluginState = suggestChangesKey.getState(state);
  if (!pluginState) return false;
  if (!dispatch) return true;

  dispatch(
    state.tr.setMeta(suggestChangesKey, {
      skip: true,
      enabled: !pluginState.enabled,
    }),
  );
  return true;
}
