import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { getSuggestionMarks } from "./utils.js";
import { type ResolvedPos } from "prosemirror-model";
// import { ZWSP } from "./constants.js";

interface PluginState {
  handleKeyDown: {
    backspace: boolean;
    delete: boolean;
    arrowLeft: boolean;
    arrowRight: boolean;
  };
}

export const ensureSelectionKey = new PluginKey<PluginState>(
  "@handlewithcare/prosemirror-suggest-changes-ensure-selection",
);

export function ensureSelection() {
  return new Plugin<PluginState>({
    key: ensureSelectionKey,

    state: {
      apply(tr, state) {
        const newPluginState = tr.getMeta(ensureSelectionKey) as
          | PluginState
          | undefined;
        if (newPluginState) {
          return newPluginState;
        }
        return state;
      },
      init() {
        return {
          handleKeyDown: {
            backspace: false,
            delete: false,
            arrowLeft: false,
            arrowRight: false,
          },
        };
      },
    },

    props: {
      handleKeyDown(view, event) {
        const state = this.getState(view.state);
        if (!state) return;

        const newState = { ...state };

        newState.handleKeyDown.backspace = event.key === "Backspace";
        newState.handleKeyDown.delete = event.key === "Delete";
        newState.handleKeyDown.arrowLeft = event.key === "ArrowLeft";
        newState.handleKeyDown.arrowRight = event.key === "ArrowRight";

        if (
          newState.handleKeyDown.backspace !== state.handleKeyDown.backspace ||
          newState.handleKeyDown.delete !== state.handleKeyDown.delete ||
          newState.handleKeyDown.arrowLeft !== state.handleKeyDown.arrowLeft ||
          newState.handleKeyDown.arrowRight !== state.handleKeyDown.arrowRight
        ) {
          console.log("handleKeyDown newState =", newState);
          view.dispatch(view.state.tr.setMeta(ensureSelectionKey, newState));
        }
      },
    },

    appendTransaction(_transactions, oldState, newState) {
      const state = newState;

      if (!(state.selection instanceof TextSelection)) return null;
      if (!(oldState.selection instanceof TextSelection)) return null;

      const { $cursor } = state.selection;
      if ($cursor == null) return null;

      const $oldCursor = oldState.selection.$cursor;

      let dir: 1 | -1;

      if ($oldCursor != null) {
        dir = $cursor.pos > $oldCursor.pos ? 1 : -1;
      } else {
        const { $from, $to } = oldState.selection;
        const distToFrom = $cursor.pos - $from.pos;
        const distToTo = $to.pos - $cursor.pos;
        // if cursor ended up closer to the right side of the selection (to),
        // consider direction as 1 - "to the right"
        dir = distToTo <= distToFrom ? 1 : -1;
      }

      const pluginState = ensureSelectionKey.getState(newState);
      if (
        pluginState?.handleKeyDown.backspace ||
        pluginState?.handleKeyDown.arrowLeft
      ) {
        dir = -1;
      } else if (
        pluginState?.handleKeyDown.delete ||
        pluginState?.handleKeyDown.arrowRight
      ) {
        dir = 1;
      }

      if (!isValidPos($cursor, dir)) {
        console.groupCollapsed(
          "$cursor is not valid, find new $cursor",
          $cursor.pos,
          {
            dir,
            oldSelection: oldState.selection,
            $cursor,
          },
        );

        let $pos = $cursor;

        if (dir > 0) {
          $pos = findNextPos($pos, dir);
          if (!isValidPos($pos, dir)) {
            console.warn("failed to find next valid $cursor, trying prev");
            $pos = findPrevPos($pos, dir);
          }
        } else {
          $pos = findPrevPos($pos, dir);
          if (!isValidPos($pos, dir)) {
            console.warn("failed to find prev valid $cursor, trying next");
            $pos = findNextPos($pos, dir);
          }
        }

        if (!isValidPos($pos, dir)) {
          console.warn(
            "failed to find valid $cursor after all attempts",
            $pos.pos,
            "keeping the original $cursor",
            $cursor.pos,
            { $cursor, $pos },
          );
          console.groupEnd();
          console.log("final $cursor (unchanged)", $cursor);
          return null;
        }

        console.info("found new valid $cursor", $pos.pos, { $pos });
        console.groupEnd();

        console.log("final $cursor", $pos.pos, { $pos });
        return newState.tr.setSelection(
          TextSelection.create(newState.doc, $pos.pos, $pos.pos),
        );
      }

      return null;
    },
  });
}

export function isEnsureSelectionEnabled() {
  return true;
}

function findNextPos($initialPos: ResolvedPos, dir: 1 | -1) {
  console.groupCollapsed(
    "finding next valid pos from $initialPos =",
    $initialPos,
  );

  let $pos = $initialPos;

  while (!isValidPos($pos, dir) && ($pos.nodeAfter != null || $pos.depth > 0)) {
    if ($pos.nodeAfter != null) {
      if ($pos.nodeAfter.isInline) {
        // nodeAfter is inline - move in by one
        $pos = $pos.doc.resolve($pos.pos + 1);
        console.log("nodeAfter is inline, move to end of it", $pos);
      } else {
        // nodeAfter is not inline - find first inline descendant in nodeAfter
        let localStartPos = null as number | null;
        $pos.nodeAfter.descendants((child, pos) => {
          if (!child.isInline) return true;
          if (localStartPos !== null) return false;
          localStartPos = pos;
          return false;
        });
        if (localStartPos !== null) {
          // we have a local position of a first inline descendant - convert it to global position
          // +1 to "enter" the node, and add local pos
          $pos = $pos.doc.resolve($pos.pos + 1 + localStartPos);
          console.log(
            "found first inline descendant, move to start of it",
            $pos,
          );
        } else {
          // unable to find first inline descendant of nodeAfter - just skip nodeAfter
          $pos = $pos.doc.resolve($pos.pos + $pos.nodeAfter.nodeSize);
          console.log(
            "unable to find first inline descendant, move to end of nodeAfter",
            $pos,
          );
        }
      }
    } else if ($pos.depth > 0) {
      // nodeAfter is null - go up
      $pos = $pos.doc.resolve($pos.after());
      console.log("nodeAfter is null, go up", $pos);
    }
  }

  if (isValidPos($pos, dir)) {
    console.log("found next valid $pos", $pos);
  } else {
    console.warn(
      "failed to find next valid $pos",
      $pos,
      "keep initial pos",
      $initialPos,
    );
  }

  console.groupEnd();

  return isValidPos($pos, dir) ? $pos : $initialPos;
}

function findPrevPos($initialPos: ResolvedPos, dir: 1 | -1) {
  console.groupCollapsed(
    "finding prev valid pos from $initialPos =",
    $initialPos,
  );

  let $pos = $initialPos;

  while (
    !isValidPos($pos, dir) &&
    ($pos.nodeBefore != null || $pos.depth > 0)
  ) {
    if ($pos.nodeBefore != null) {
      if ($pos.nodeBefore.isInline) {
        // nodeBefore is inline - move in by one
        $pos = $pos.doc.resolve($pos.pos - 1);
        console.log("nodeBefore is inline, move to start of it", $pos);
      } else {
        // nodeBefore is not inline - find last inline descendant in nodeBefore
        let localEndPos = null as number | null;
        $pos.nodeBefore.descendants((child, pos) => {
          if (!child.isInline) return true;
          localEndPos = pos + child.nodeSize;
          return false;
        });
        if (localEndPos !== null) {
          // we have a local position of a last inline descendant - convert it to global position
          // move pos to start of node before, add 1 to "enter" nodeBefore, then add local pos
          $pos = $pos.doc.resolve(
            $pos.pos - $pos.nodeBefore.nodeSize + 1 + localEndPos,
          );
          console.log("found last inline descendant, move to end of it", $pos);
        } else {
          // unable to find last inline descendant of nodeBefore - just skip nodeBefore
          $pos = $pos.doc.resolve($pos.pos - $pos.nodeBefore.nodeSize);
          console.log(
            "unable to find last inline descendant, move to start of nodeBefore",
            $pos,
          );
        }
      }
    } else if ($pos.depth > 0) {
      // nodeBefore is null - go up
      $pos = $pos.doc.resolve($pos.before());
      console.log("nodeBefore is null, go up", $pos);
    }
  }

  if (isValidPos($pos, dir)) {
    console.log("found prev valid $pos", $pos);
  } else {
    console.warn(
      "failed to find prev valid $pos",
      $pos,
      "keep initial pos",
      $initialPos,
    );
  }

  console.groupEnd();

  return isValidPos($pos, dir) ? $pos : $initialPos;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isValidPos($pos: ResolvedPos, _dir: 1 | -1) {
  // text selection is only valid in nodes that allow inline content
  // https://github.com/ProseMirror/prosemirror-state/blob/1.4.4/src/selection.ts#L219
  if (!$pos.parent.inlineContent) {
    console.warn("cursor invalid", "not in inlineContent node", $pos);
    return false;
  }

  const { deletion } = getSuggestionMarks($pos.doc.type.schema);

  //   moving right - zwsp is on the right - skip forward
  //   if (dir > 0 && $pos.nodeAfter?.text?.startsWith(ZWSP)) {
  //     console.warn(
  //       "cursor invalid",
  //       "moving right - zwsp is on the right - skip forward",
  //       $pos,
  //     );
  //     return false;
  //   }

  //   //   moving left - zwsp is on the left - skip backward
  //   if (dir < 0 && $pos.nodeBefore?.text?.startsWith(ZWSP)) {
  //     console.warn(
  //       "cursor invalid",
  //       "moving left - zwsp is on the left - skip backward",
  //       $pos,
  //     );
  //     return false;
  //   }

  const deletionBefore = deletion.isInSet($pos.nodeBefore?.marks ?? []);
  const deletionAfter = deletion.isInSet($pos.nodeAfter?.marks ?? []);

  // between two deletions
  if (deletionBefore && deletionAfter) {
    console.warn("cursor invalid", "between two deletions", $pos);
    return false;
  }

  // between a deletion and a node boundary
  if (deletionBefore && $pos.nodeAfter == null) {
    console.warn(
      "cursor invalid",
      "between a deletion and a node boundary",
      $pos,
    );
    return false;
  }

  // between a node boundary and a deletion, if deletion is not anchor
  if (
    $pos.nodeBefore == null &&
    deletionAfter &&
    deletionAfter.attrs["type"] !== "anchor"
  ) {
    console.warn(
      "cursor invalid",
      "between a node boundary and a deletion",
      $pos,
    );
    return false;
  }

  // deletion is on the left, non-deletion is on the right
  if (deletionBefore && $pos.nodeAfter != null && !deletionAfter) {
    console.warn(
      "cursor invalid",
      "deletion is on the left, non-deletion is on the right",
      $pos,
    );
    return false;
  }

  return true;
}
