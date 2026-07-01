import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { type ResolvedPos } from "prosemirror-model";
import { getInvalidSelectionPositionReason } from "./selectionPosition.js";

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[ensureSelectionPlugin]", ...args);
}

interface PluginState {
  // this is populated on handleKeyDown event
  // so in appendTransaction we know if one of these keys was pressed
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

        // remember if one of the keys we care about was pressed
        // this is needed for appendTransaction

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

    appendTransaction(transactions, oldState, newState) {
      const pluginState = ensureSelectionKey.getState(newState);
      const isSelectionOnly = transactions.every((tr) => !tr.docChanged);

      if (!(newState.selection instanceof TextSelection)) {
        return null;
      }

      if (
        isPosValid(newState.selection.$anchor) &&
        isPosValid(newState.selection.$head)
      ) {
        // both selection positions are valid, no action needed
        return null;
      }

      // find new valid selection anchor and head

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (TRACE_ENABLED)
        console.groupCollapsed("[ensureSelectionPlugin]", "appendTransaction");

      trace("appendTransaction", "search for new valid $anchor...");
      let $newAnchor = getNewValidPos(
        oldState.selection.$anchor,
        newState.selection.$anchor,
        isSelectionOnly,
        pluginState,
      );
      trace("appendTransaction", "new valid $anchor", $newAnchor?.pos, {
        $newAnchor,
      });

      trace("appendTransaction", "search for new valid $head...");
      let $newHead = newState.selection.empty
        ? $newAnchor
        : getNewValidPos(
            oldState.selection.$head,
            newState.selection.$head,
            isSelectionOnly,
            pluginState,
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
        // new selection is the same as old selection, no action needed

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
  const invalidReason = getInvalidSelectionPositionReason($pos);

  if (invalidReason) {
    trace("isPosValid", $pos.pos, "pos invalid", `reason: ${invalidReason}`, {
      $pos,
    });
    return false;
  }

  return true;
}

function findNextValidPos($initialPos: ResolvedPos): ResolvedPos | null {
  let $pos = $initialPos;

  // to keep searching for the next valid pos,
  // we need a non-null nodeAfter so we can go right
  // or a non-root depth so we can go up
  while (!isPosValid($pos) && ($pos.nodeAfter != null || $pos.depth > 0)) {
    // first check if we can go into nodeAfter
    if ($pos.nodeAfter != null) {
      // if nodeAfter is inline, we can step into it and search for the valid pos inside
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

  // in order to be able to keep searching,
  // we need either a nodeBefore so we can go left,
  // or a non-root depth so we can go up
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
          // move pos to start of nodeBefore, add 1 to "enter" nodeBefore, then add local pos
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

/**
 * Given a ResolvedPos, find closest valid pos within the same parent
 *
 * @param $initialPos
 * @returns
 */
function findNearestValidPosInSameParent(
  $initialPos: ResolvedPos,
): ResolvedPos | null {
  if (!$initialPos.parent.inlineContent) return null;

  const start = $initialPos.start();
  const end = $initialPos.end();

  // take larger distance - either to the start or to the end of the parent node
  const maxDistance = Math.max($initialPos.pos - start, end - $initialPos.pos);

  // for each distance in range [0, maxDistance],
  // check if position within that distance from both sides is valid
  for (let distance = 0; distance <= maxDistance; distance++) {
    const nextPos = $initialPos.pos + distance;
    if (nextPos <= end) {
      const $nextPos = $initialPos.doc.resolve(nextPos);
      if (isPosValid($nextPos)) return $nextPos;
    }

    const prevPos = $initialPos.pos - distance;
    if (distance > 0 && prevPos >= start) {
      const $prevPos = $initialPos.doc.resolve(prevPos);
      if (isPosValid($prevPos)) return $prevPos;
    }
  }

  return null;
}

function getNewValidPosInSelectionDestinationParent(
  $oldPos: ResolvedPos,
  $newPos: ResolvedPos,
): ResolvedPos | null {
  if (isPosValid($newPos)) return null;
  if ($oldPos.parent === $newPos.parent) return null;
  if (!$newPos.parent.inlineContent) return null;

  // For selection-only transactions, keep the cursor inside the destination
  // textblock when possible. Jumping across block boundaries makes arrow-key
  // navigation feel like it skipped content.
  const $sameParentPos = findNearestValidPosInSameParent($newPos);
  trace(
    "getNewValidPosInSelectionDestinationParent",
    "$sameParentPos",
    $sameParentPos?.pos,
    { $oldPos, $newPos, $sameParentPos },
  );

  return $sameParentPos;
}

function getNewValidPosByDirection(
  $pos: ResolvedPos,
  dir: "left" | "right" | null,
) {
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

function getNewValidPos(
  $oldPos: ResolvedPos,
  $newPos: ResolvedPos,
  isSelectionOnly: boolean,
  pluginState?: PluginState,
) {
  const $sameParentPos = isSelectionOnly
    ? getNewValidPosInSelectionDestinationParent($oldPos, $newPos)
    : null;

  return (
    $sameParentPos ??
    getNewValidPosByDirection(
      $newPos,
      getDirection($oldPos, $newPos, pluginState),
    )
  );
}

function getDirection(
  $oldPos: ResolvedPos,
  $newPos: ResolvedPos,
  pluginState?: PluginState,
) {
  // Position movement does not always reveal user intent. Backspace can leave
  // the mapped selection at the same or unexpected position after suggestion
  // markers are inserted, so preserve the keydown direction and search left.
  if (pluginState?.handleKeyDown.backspace) return "left";

  if ($newPos.pos > $oldPos.pos) return "right";
  if ($newPos.pos < $oldPos.pos) return "left";

  return null;
}
