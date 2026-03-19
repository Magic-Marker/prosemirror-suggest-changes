import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { getSuggestionMarks } from "./utils.js";
import { type ResolvedPos } from "prosemirror-model";
import { ZWSP } from "./constants.js";

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[ensureSelectionPlugin]", ...args);
}

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
          trace("handleKeyDown newState =", newState);
          view.dispatch(view.state.tr.setMeta(ensureSelectionKey, newState));
        }
      },
    },

    appendTransaction(_transactions, oldState, newState) {
      const pluginState = ensureSelectionKey.getState(newState);

      if (!(newState.selection instanceof TextSelection)) {
        return null;
      }

      if (
        isPosValid(newState.selection.$anchor) &&
        isPosValid(newState.selection.$head)
      ) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (TRACE_ENABLED)
        console.groupCollapsed("[ensureSelectionPlugin]", "appendTransaction");

      trace("appendTransaction", "search for new valid $anchor...");
      let $newAnchor = getNewValidPos(
        newState.selection.$anchor,
        getDirection(
          oldState.selection.$anchor,
          newState.selection.$anchor,
          pluginState,
        ),
      );
      trace("appendTransaction", "new valid $anchor", $newAnchor?.pos, {
        $newAnchor,
      });

      trace("appendTransaction", "search for new valid $head...");
      let $newHead = getNewValidPos(
        newState.selection.$head,
        getDirection(
          oldState.selection.$head,
          newState.selection.$head,
          pluginState,
        ),
      );
      trace("appendTransaction", "new valid $head", $newHead?.pos, {
        $newHead,
      });

      $newAnchor = $newAnchor ?? newState.selection.$anchor;
      $newHead = $newHead ?? newState.selection.$head;

      const newSelection = new TextSelection($newAnchor, $newHead);

      if (
        newSelection.anchor === newState.selection.anchor &&
        newSelection.head === newState.selection.head
      ) {
        trace(
          "appendTransaction",
          "new selection is the same as old selection, skipping",
          {
            $newAnchor,
            $newHead,
            selection: newSelection,
          },
        );

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (TRACE_ENABLED) console.groupEnd();

        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (TRACE_ENABLED) console.groupEnd();

      trace(
        "appendTransaction",
        "setting new selection",
        $newAnchor.pos,
        $newHead.pos,
        {
          $newAnchor,
          $newHead,
          selection: newSelection,
        },
      );

      return newState.tr.setSelection(newSelection);
    },
  });
}

export function isEnsureSelectionEnabled() {
  return true;
}

function isPosValid($pos: ResolvedPos) {
  // text selection is only valid in nodes that allow inline content
  // https://github.com/ProseMirror/prosemirror-state/blob/1.4.4/src/selection.ts#L219
  if (!$pos.parent.inlineContent) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: not in inlineContent node",
      {
        $pos,
      },
    );
    return false;
  }

  const { deletion, insertion } = getSuggestionMarks($pos.doc.type.schema);

  const deletionBefore = deletion.isInSet($pos.nodeBefore?.marks ?? []);
  const deletionAfter = deletion.isInSet($pos.nodeAfter?.marks ?? []);

  const isAnchorBefore =
    deletionBefore && deletionBefore.attrs["type"] === "anchor";
  const isAnchorAfter =
    deletionAfter && deletionAfter.attrs["type"] === "anchor";

  if (isAnchorBefore && deletionAfter && !isAnchorAfter) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between deletion anchor and non-anchor deletion",
      { $pos },
    );
    return false;
  }

  if (deletionBefore && deletionAfter && !isAnchorBefore && !isAnchorAfter) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between two non-anchor deletions",
      { $pos },
    );
    return false;
  }

  if ($pos.nodeBefore == null && deletionAfter && !isAnchorAfter) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between node boundary and non-anchor deletion",
      { $pos },
    );
    return false;
  }

  if (deletionBefore && $pos.nodeAfter == null && !isAnchorBefore) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between non-anchor deletion and node boundary",
      { $pos },
    );
    return false;
  }

  if (deletionBefore && !isAnchorBefore && $pos.nodeAfter == null) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between non-anchor deletion and node boundary",
      { $pos },
    );
    return false;
  }

  if (deletionBefore && !isAnchorBefore) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between non-anchor deletion and anything",
      { $pos },
    );
    return false;
  }

  const insertionBefore = insertion.isInSet($pos.nodeBefore?.marks ?? []);
  const insertionAfter = insertion.isInSet($pos.nodeAfter?.marks ?? []);

  const ZWSP_REGEXP = new RegExp(ZWSP, "g");
  const isZWSPBefore =
    $pos.nodeBefore &&
    $pos.nodeBefore.textContent.replace(ZWSP_REGEXP, "") === "";
  const isZWSPAfter =
    $pos.nodeAfter &&
    $pos.nodeAfter.textContent.replace(ZWSP_REGEXP, "") === "";

  if (insertionBefore && insertionAfter && isZWSPBefore && isZWSPAfter) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between two ZWSP insertions",
      { $pos },
    );
    return false;
  }

  if (
    insertionBefore &&
    isZWSPBefore &&
    $pos.nodeAfter == null &&
    // a position like this:
    // <p><insertion>ZWSP</insertion>|</p>
    // because it means this paragraph was just created and it's empty
    $pos.parent.textContent.replace(ZWSP_REGEXP, "") !== ""
  ) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between ZWSP insertion and right node boundary",
      { $pos },
    );
    return false;
  }

  if (insertionAfter && isZWSPAfter && $pos.nodeBefore == null) {
    trace(
      "isPosValid",
      $pos.pos,
      "pos invalid",
      "reason: between ZWSP insertion and left node boundary",
      { $pos },
    );
    return false;
  }

  return true;
}

function findNextValidPos($initialPos: ResolvedPos): ResolvedPos | null {
  let $pos = $initialPos;

  // to keep searching for the next valid pos we need non-null nodeAfter so we can go right or non-root depth so we can go up
  while (!isPosValid($pos) && ($pos.nodeAfter != null || $pos.depth > 0)) {
    // first check if we can go into nodeAfter
    if ($pos.nodeAfter != null) {
      // if nodeAfter is inline, we can step into it and search for the valid pos in it
      if ($pos.nodeAfter.isInline) {
        // nodeAfter is inline - move in by one
        $pos = $pos.doc.resolve($pos.pos + 1);
      } else {
        // nodeAfter is not inline - find starting position of the first inline descendant in nodeAfter
        let localStartPos = null as number | null;

        $pos.nodeAfter.descendants((child, pos) => {
          if (!child.isInline) return true;
          if (localStartPos !== null) return false;
          localStartPos = pos;
          return false;
        });

        if (localStartPos !== null) {
          // we have a local starting position of the first inline descendant - convert it to global position
          // +1 to "enter" the node, and add local pos
          $pos = $pos.doc.resolve($pos.pos + 1 + localStartPos);
        } else {
          // unable to find first inline descendant of nodeAfter - just skip nodeAfter altogether
          $pos = $pos.doc.resolve($pos.pos + $pos.nodeAfter.nodeSize);
        }
      }
    } else if ($pos.depth > 0) {
      // nodeAfter is null - go up
      $pos = $pos.doc.resolve($pos.after());
    }
  }

  return isPosValid($pos) ? $pos : null;
}

function findPreviousValidPos($initialPos: ResolvedPos): ResolvedPos | null {
  let $pos = $initialPos;

  // in order to be able to keep searching, we need either nodeBefore so we can go left, or non-root depth so we can go up
  while (!isPosValid($pos) && ($pos.nodeBefore != null || $pos.depth > 0)) {
    // first check if we can go into nodeBefore
    if ($pos.nodeBefore != null) {
      // if nodeBefore is inline, we can step into it and search for the valid pos in it
      if ($pos.nodeBefore.isInline) {
        // nodeBefore is inline - move in by one
        $pos = $pos.doc.resolve($pos.pos - 1);
      } else {
        // nodeBefore is not inline - find ending position of the last inline descendant in nodeBefore
        let localEndPos = null as number | null;

        $pos.nodeBefore.descendants((child, pos) => {
          if (!child.isInline) return true;
          localEndPos = pos + child.nodeSize;
          return false;
        });

        if (localEndPos !== null) {
          // we have a local ending position of the last inline descendant - convert it to global position
          // move pos to start of node before, add 1 to "enter" nodeBefore, then add local pos
          $pos = $pos.doc.resolve(
            $pos.pos - $pos.nodeBefore.nodeSize + 1 + localEndPos,
          );
        } else {
          // unable to find last inline descendant of nodeBefore - just skip nodeBefore altogether
          $pos = $pos.doc.resolve($pos.pos - $pos.nodeBefore.nodeSize);
        }
      }
    } else if ($pos.depth > 0) {
      // nodeBefore is null - go up
      $pos = $pos.doc.resolve($pos.before());
    }
  }

  return isPosValid($pos) ? $pos : null;
}

function getNewValidPos($pos: ResolvedPos, dir: "left" | "right" | null) {
  if (isPosValid($pos)) return $pos;

  trace("getNewValidPos for", $pos.pos, { $pos, dir });

  if (dir === "right") {
    const $nextValidPos = findNextValidPos($pos);
    trace("getNewValidPos", "$nextValidPos", $nextValidPos?.pos, {
      dir,
      $pos,
      $nextValidPos,
    });
    if ($nextValidPos != null) return $nextValidPos;
    const $prevValidPos = findPreviousValidPos($pos);
    trace("getNewValidPos", "$prevValidPos", $prevValidPos?.pos, {
      dir,
      $pos,
      $prevValidPos,
    });
    if ($prevValidPos != null) return $prevValidPos;
    return null;
  }

  if (dir === "left") {
    const $prevValidPos = findPreviousValidPos($pos);
    trace("getNewValidPos", "$prevValidPos", $prevValidPos?.pos, {
      dir,
      $pos,
      $prevValidPos,
    });
    if ($prevValidPos != null) return $prevValidPos;
    const $nextValidPos = findNextValidPos($pos);
    trace("getNewValidPos", "$nextValidPos", $nextValidPos?.pos, {
      dir,
      $pos,
      $nextValidPos,
    });
    if ($nextValidPos != null) return $nextValidPos;
    return null;
  }

  const $nextValidPos = findNextValidPos($pos);
  const $prevValidPos = findPreviousValidPos($pos);
  trace(
    "getNewValidPos",
    "$nextValidPos",
    $nextValidPos?.pos,
    "$prevValidPos",
    $prevValidPos?.pos,
    { dir, $pos, $nextValidPos, $prevValidPos },
  );

  if ($nextValidPos == null && $prevValidPos == null) {
    return null;
  }

  if ($nextValidPos == null) return $prevValidPos;
  if ($prevValidPos == null) return $nextValidPos;

  const nextDist = Math.abs($pos.pos - $nextValidPos.pos);
  const prevDist = Math.abs($pos.pos - $prevValidPos.pos);

  return nextDist <= prevDist ? $nextValidPos : $prevValidPos;
}

function getDirection(
  $oldPos: ResolvedPos,
  $newPos: ResolvedPos,
  pluginState?: PluginState,
) {
  if (pluginState?.handleKeyDown.backspace) return "left";

  if ($newPos.pos > $oldPos.pos) return "right";
  if ($newPos.pos < $oldPos.pos) return "left";

  return null;
}
