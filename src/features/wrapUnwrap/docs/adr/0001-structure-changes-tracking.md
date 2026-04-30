# Structure Changes Tracking

Status: experimental, active hardening.

This document explains the design of structure-change suggestions in
`src/features/wrapUnwrap`. It is meant to give a ProseMirror-proficient reader
enough context to debug the current behavior, harden it, or extend it without
breaking the core invariants.

## Problem

Text suggestions can be represented by retaining deleted content, marking
inserted content, and tracking mark/attr changes. List structure edits are
different: indenting, outdenting, wrapping, unwrapping, and list input rules can
destroy and recreate wrapper nodes while the human-visible content node
survives.

ProseMirror steps are also not semantic enough for this feature. A list split,
indent, or outdent may arrive as `ReplaceStep` or `ReplaceAroundStep` operations
whose positions describe the mutation but do not directly say "this paragraph
moved from list item A to list item B." This feature therefore compares document
structure before and after a transaction.

## Decision

Track structure edits by comparing stable node IDs and their materialized parent
chains before and after a transaction.

The stable unit is the content/block node, not the list wrapper. Structure marks
are added to content nodes such as paragraphs or headings. List nodes and list
items are treated as structural context because they are often created, split,
merged, or removed during the edit.

## Scope

This is not a general-purpose tree diff. Today it tracks list-related structure
changes involving these node names:

- `orderedList`
- `bulletList`
- `listItem`

The expected list shape is:

```text
ListNode -> listItem -> block content
```

Nested lists are supported. Same-parent reordering is not tracked yet.

## File Map

- `structureChangesPlugin.ts`: transaction integration and structure diffing.
- `buildMaterializedPaths.ts`: builds node ID to parent-chain maps.
- `sameParentChain.ts`: compares parent chains by ancestor IDs.
- `types.ts`: operation, parent-chain, and structure mark attr types.
- `constants.ts`: structure tracking constants and list node names.
- `addIdAttr.ts`: helper for adding an `id` attr to schema node specs.
- `uniqueNodeIdsPlugin.ts`: demo/test ID-settling plugin and transform helper.
- `apply/applyStructureSuggestions.ts`: accepts structure suggestions by
  removing structure marks.
- `revert/revertStructureSuggestions.ts`: grouped structure suggestion revert
  orchestration.
- `revert/revertMoveOp.ts`: reconstructs previous parent chains for moved nodes.
- `revert/revertAddOp.ts`: deletes added nodes.
- `revert/deleteNodeUpwards.ts`: prunes now-empty ancestors after deletion.
- `__tests__/listStructure.playwright.test.ts`: user-level list behavior
  coverage.

## Required Invariants

- Every non-text node must have a stable unique string `id` before structure
  detection runs.
- Missing IDs should cause detection to bail rather than guess.
- Duplicate IDs must be fixed before diffing; otherwise node correlation is
  ambiguous.
- Structure marks belong on non-list content/block nodes. `getOps` skips nodes
  whose type is in `LIST_NODES`.
- A node with an unaccepted structure `add` mark is still provisional new
  structure. Moving it must not add structure `move` marks until the `add` mark
  is accepted.
- Stored parent descriptors must remain sufficient to recreate missing ancestor
  wrappers and position the restored node near stable siblings.
- Apply/revert cleanup transactions must set `suggestChangesKey` meta with
  `{ skip: true }` so they are not tracked as new suggestions.

## End-To-End Flow

1. A user transaction changes the document while suggest changes is enabled.
2. The integration path ensures IDs on newly created or duplicated nodes before
   structure diffing. In the dispatch wrapper, this is supplied through
   `experimental_ensureUniqueNodeIds`.
3. `suggestStructureChanges(docBefore, docAfter, generateId?)` builds
   materialized paths for both docs.
4. `getOps` compares paths by node ID and derives `move` or `add` operations.
5. All structure ops from that detection pass share one suggestion ID.
6. A transform over the after-doc adds `structure` node marks to affected
   content nodes. The mark data stores the operation.
7. If structure detection handled the transaction, the normal text-suggestion
   transform is skipped for that transaction.
8. Applying a structure suggestion removes the structure marks.
9. Reverting a structure suggestion uses the stored operation data to delete
   added nodes or move existing nodes back to their previous parent chain.

## Materialized Paths

`buildMaterializedPaths(doc)` returns a map:

```ts
Map<string, { nodeType: string; chain: Parent[] }>;
```

The key is a node ID. The chain is immediate-parent-first and eventually ends in
a special document parent:

```ts
{
  nodeId: "__doc__",
  nodeType: "__doc__",
  nodeAttrs: {},
  nodeMarks: [],
  childSiblingIds: [leftSiblingId, rightSiblingId],
  childIndex,
}
```

For real parents, each descriptor stores:

- parent node ID
- parent node type
- parent attrs
- parent marks serialized to JSON
- the child node's left and right sibling IDs in that parent
- the child index

Sibling IDs are primarily for stable revert placement. Raw indexes are stored
for future work and debugging, but index shifts alone are not treated as moves.

## Operation Detection

`getOps(beforePaths, afterPaths)` derives operations:

- Existing non-list node with different parent chain, and a list node in either
  old or new chain: `move`.
- Non-list node that exists only in the after-doc and is inside a list: `add`.
- Node that exists only in the before-doc: ignored here; normal deletion
  tracking handles deleted content.
- Non-list node whose parent-chain IDs are unchanged: ignored, even if sibling
  order or index changed.

`sameParentChain` compares only chain length and ancestor IDs. It deliberately
does not compare parent attrs, marks, sibling IDs, or indexes.

When `addMarks` sees a `move` op for a node that already carries a structure
`add` mark, it suppresses the new `move` mark. This mirrors insertion-mark
behavior: provisional new structure can be rearranged freely until accepted. If
the `add` suggestion is reverted, the node is deleted from its current location.
If the `add` suggestion is applied, the structure mark is removed and later
structure edits produce `move` marks normally.

## Structure Mark Data

A structure mark is a node mark with attrs shaped like:

```ts
{
  id: SuggestionId;
  data: {
    op: Op;
  }
}
```

Use `guardStructureMarkAttrs` before trusting mark attrs loaded from a document.

`AddOp` means the marked node did not exist before and should be deleted on
revert.

`MoveOp` stores:

- `from`: the node's parent chain before the edit.
- `to`: the node's parent chain after the edit.

The `from` chain is used to reconstruct the old location.

## Applying Suggestions

Applying a structure suggestion accepts the structure edit. It does not move
content. It removes all matching `structure` marks for the selected suggestion
group or range.

## Reverting Suggestions

Reverting a structure suggestion uses the stored operation data to either delete
added nodes or move existing nodes back to their previous parent chain.

### Reverting `add`

`revertAddOp` deletes the marked node and calls `deleteNodeUpwards` to prune
ancestors that became empty.

### Reverting `move`

`revertMoveOp`:

1. Finds the deepest still-existing ancestor from the stored `from` chain.
2. Wraps the current node in the missing parent chain with stored types, attrs,
   and marks.
3. Finds an insertion position in the surviving parent using the stored right
   sibling, then left sibling, then end-of-parent fallback.
4. Inserts or replaces with the reconstructed subtree.
5. Maps the original moved-node position through `tr.mapping`.
6. Deletes the moved node from its current location and prunes empty ancestors.

### Empty Ancestor Pruning

`deleteNodeUpwards` expands the deletion range upward while the parent has
exactly one child, namely the node being removed. This avoids leaving empty
`listItem` or list nodes that violate the schema.

## Integration

There are two integration paths:

- `withSuggestChanges`: the important experimental path. It can run structure
  detection first when `experimental_trackStructureChanges` and
  `experimental_ensureUniqueNodeIds` are provided. If structure detection
  handles the transaction, the normal suggestion transform is skipped for that
  transaction.
- `structureChangesPlugin`: an append-transaction plugin path that also compares
  old and new docs, but is not the primary path for current hardening.

`suggestStructureChanges` returns `{ handled, transform }`. `handled` is based
on whether structure ops were detected, not whether the transform contains
steps. This distinction matters when every detected op is intentionally
suppressed, such as moving a node that still has a structure `add` mark.
`withSuggestChanges` uses `handled` to avoid falling back to normal text
suggestion tracking for a transaction structure tracking already understood.

Structure tracking should be skipped for transactions from history, collab, yjs
undo/redo, yjs change origin, or transactions carrying `suggestChangesKey` skip
meta.

## Why Not Use Step Interpretation?

Do not try to infer list semantics only from `ReplaceStep` or
`ReplaceAroundStep`. Those steps describe positional replacement mechanics, not
the semantic intent. Comparing materialized paths answers the question this
feature needs: "where was node X before, and where is node X now?"

## Why Not Mark List Wrappers?

List wrappers and list items are not stable across edits. ProseMirror list
commands may split, join, remove, or recreate them. The content node, identified
by stable ID, is the thing a user experiences as "the item that moved." Marking
content nodes makes suggestions survive structural churn.

## Extending The Feature

When adding support for another structural edit or node family, review all of
these areas together:

- Node ID coverage: every relevant non-text node must get stable unique IDs.
- Detection scope: update `LIST_NODES` or introduce a more general structure
  classifier.
- Schema assumptions: define the expected parent/child shape and invalid
  intermediate states.
- Mark target: choose the stable node that survives the structural edit.
- Operation data: store enough information to revert without relying on fragile
  positions.
- Revert reconstruction: ensure missing ancestors can be recreated with attrs
  and marks.
- Insertion placement: prefer stable sibling IDs over raw indexes.
- Apply/revert commands: preserve skip meta.
- Tests: cover user-level commands, not only low-level transforms.

For same-parent reorder support, do not compare raw child indexes directly and
call it done. Indexes shift when siblings are inserted or deleted. Use relative
ordering of surviving sibling IDs or another stable ordering model.

## Debugging Checklist

When structure tracking does not behave as expected:

- Confirm suggest changes mode is enabled and the transaction is not skipped by
  history/collab/yjs/skip meta.
- Confirm all relevant nodes have unique string `id` attrs before
  `suggestStructureChanges` runs.
- Inspect `buildMaterializedPaths` output for the moved node in both docs.
- Check whether `sameParentChain` returns true; if so, detection will not create
  a move.
- Confirm at least one parent chain contains a node from `LIST_NODES`.
- Inspect the added `structure` mark and validate it with
  `guardStructureMarkAttrs`.
- For failed reverts, inspect `op.from`, `op.to`, the current parent chain, and
  whether the stored parent node types still exist in the schema.
- Check whether insertion chose right sibling, left sibling, or end-of-parent
  fallback.
- Verify `tr.mapping.map(pos)` is used before deleting the current moved node
  after insertion.
- Look for schema errors caused by recreating parents that no longer accept the
  child node.

## Current Limitations / Risks

- Experimental list-structure tracking only; not a complete structural diff
  engine.
- Only `orderedList`, `bulletList`, and `listItem` are recognized as structure
  nodes.
- Same-parent reorder is not tracked.
- Parent-chain equality only compares ancestor IDs and chain length.
- Schema-invalid reconstruction can throw or fail a ProseMirror step.
- Revert can be lossy if stored parent node types, attrs, or marks no longer
  exist or no longer accept the child being restored.
- Structure marks are node marks. Integrations that only handle inline mark
  steps will miss them.
- The implementation currently contains verbose tracing and console logging;
  consider noise and performance when hardening production paths.

## Test Guidance

Prefer scenario tests around user-observable behavior:

- single indent and outdent
- top, middle, and last list items
- nested list outdent
- multi-item indent and outdent
- multiple sequential structure suggestions
- outdenting from a list into the root document
- creating bullet and ordered lists through input rules
- applying and reverting individual suggestions
- applying and reverting all suggestions
- missing IDs and duplicate IDs
- copied/pasted content and list-item splits
- stacked structure marks on the same content node

When changing revert reconstruction, include tests where siblings are missing so
right-sibling, left-sibling, and end-of-parent placement paths are exercised.

Keep this package app-agnostic. Do not add consuming application details or
application-specific metadata assumptions here.
