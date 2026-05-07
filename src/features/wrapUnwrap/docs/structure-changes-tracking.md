# Structure Changes Tracking

Status: experimental, active hardening.

This document explains the implementation of Structure suggestions in
`src/features/wrapUnwrap`. It is meant to give a ProseMirror-proficient reader
enough context to debug the current behavior, harden it, or extend it without
breaking the core invariants.

## Problem

Text suggestions can be represented by retaining deleted content, marking
inserted content, and tracking mark/attr changes. Structural context edits are
different: indenting, outdenting, wrapping, unwrapping, and list input rules can
destroy and recreate wrapper nodes while the human-visible content node
survives.

ProseMirror steps are also not semantic enough for this feature. A list split,
indent, outdent, or blockquote wrap may arrive as `ReplaceStep` or
`ReplaceAroundStep` operations whose positions describe the mutation but do not
directly say "this paragraph moved from list item A to list item B" or "this
paragraph moved into a blockquote." This feature therefore compares document
structure before and after a transaction.

## Decision

Track structure edits by comparing stable node IDs and their materialized Parent
chains before and after a transaction.

The stable unit is the content/block node, not the structural context wrapper.
Structure marks are added to content nodes such as paragraphs or headings.
Configured Structural context path nodes are treated as structural context
because they are often created, split, merged, or removed during the edit.

## Scope

This is not a general-purpose tree diff. Consumers configure the structural
contexts they want to track with concrete ProseMirror node type names:

```ts
experimental_trackStructures: [
  ["orderedList", "listItem"],
  ["bulletList", "listItem"],
  ["blockquote"],
];
```

Each Structural context path is a contiguous parent-child ancestor path, not
loose node-type membership. The expected list shape is:

```text
ListNode -> listItem -> block content
```

For blockquotes, the context shape is:

```text
blockquote -> block content
```

Nested configured structural contexts are supported. Same-parent reordering is
not tracked yet.

## Core Algorithm

1. Ensure every non-text node has a stable unique ID.
2. Build materialized Parent chains for the before-doc and after-doc.
3. Ignore configured structural context nodes as Structure mark targets.
4. For stable content nodes present in both docs:
   - if the Parent chain changed, and either chain contains a configured
     contiguous Structural context path, create a `move` op.
5. For stable content nodes only present in the after-doc:
   - if the after Parent chain contains a configured contiguous Structural
     context path, create an `add` op.
6. Add Structure marks to the affected content nodes.
7. Applying removes Structure marks.
8. Reverting uses stored Parent chains to delete added nodes or move existing
   nodes back.

## File Map

- `structureChangesPlugin.ts`: transaction integration and structure diffing.
- `buildMaterializedPaths.ts`: builds node ID to Parent chain maps.
- `sameParentChain.ts`: compares Parent chains by ancestor IDs.
- `types.ts`: operation, Parent chain, and Structure mark attr types.
- `constants.ts`: structure tracking constants.
- `addIdAttr.ts`: helper for adding an `id` attr to schema node specs.
- `uniqueNodeIdsPlugin.ts`: demo/test ID-settling plugin and transform helper.
- `apply/applyStructureSuggestions.ts`: accepts Structure suggestions by
  removing Structure marks.
- `revert/revertStructureSuggestions.ts`: grouped Structure suggestion revert
  orchestration.
- `revert/revertMoveOp.ts`: reconstructs previous Parent chains for moved nodes.
- `revert/revertAddOp.ts`: deletes added nodes.
- `revert/deleteNodeUpwards.ts`: prunes now-empty ancestors after deletion.
- `__tests__/listStructure.playwright.test.ts`: user-level list behavior
  coverage.
- `__tests__/blockquoteStructure.playwright.test.ts`: user-level blockquote
  behavior coverage.

## Required Invariants

- Every non-text document descendant that participates in structure tracking
  must have a stable unique string `id` before structure detection runs. The
  document root itself is represented by a synthetic `DOC_NODE_ID` parent.
- Missing IDs should cause detection to bail rather than guess.
- Duplicate IDs must be fixed before diffing; otherwise node correlation is
  ambiguous. The primary `withSuggestChanges` integration can run the unique-ID
  transform before structure detection; the append-transaction plugin expects
  IDs to already be settled.
- Structure marks belong on stable content/block nodes beneath a configured
  Structural context path. `getOps` skips nodes whose type appears in a
  configured Structural context path.
- A Structure add suggestion is still provisional new structure. Moving it must
  not add Structure move suggestions until the add suggestion is accepted.
- Stored parent descriptors must remain sufficient to recreate missing ancestor
  wrappers and position the restored node near stable siblings.
- Public apply/revert commands must set `suggestChangesKey` meta with
  `{ skip: true }` so cleanup transactions are not tracked as new suggestions.

## End-To-End Flow

1. A user transaction changes the document while suggest changes is enabled.
2. In the primary `withSuggestChanges` integration, the dispatch wrapper uses
   `experimental_ensureUniqueNodeIds` to set IDs on newly created or duplicated
   nodes before structure diffing. The append-transaction plugin path only
   checks for missing IDs and bails when IDs are not settled.
3. `suggestStructureChanges(docBefore, docAfter, structuralContextPaths, generateId?)`
   builds materialized paths for both docs.
4. `getOps` compares paths by node ID and derives `move` or `add` operations.
5. All structure ops from that detection pass share one suggestion ID.
6. A transform over the after-doc updates `structure` node marks on affected
   content nodes. It usually adds marks, but it can also remove an Inverse move.
   The mark data stores the operation.
7. If structure detection handled the transaction, the normal text-suggestion
   transform is skipped for that transaction.
8. Applying a Structure suggestion removes the Structure marks.
9. Reverting a Structure suggestion uses the stored operation data to delete
   added nodes or move existing nodes back to their previous Parent chain.

## Materialized Paths

`buildMaterializedPaths(doc)` returns a map:

```ts
Map<string, { nodeType: string; chain: Parent[] }>;
```

The key is a node ID. The Parent chain is immediate-parent-first and eventually
ends in a special document parent:

```ts
{
  nodeId: DOC_NODE_ID,
  nodeType: DOC_NODE_ID,
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

`getOps(beforePaths, afterPaths, structuralContextPaths)` derives operations:

- Existing non-context node with different Parent chain, and a configured
  Structural context path in either old or new Parent chain: `move`.
- Non-context node that exists only in the after-doc and is inside a configured
  Structural context path: `add`.
- Node that exists only in the before-doc: ignored here; normal deletion
  tracking handles deleted content.
- Non-context node whose Parent chain IDs are unchanged: ignored, even if
  sibling order or index changed.

`sameParentChain` compares only Parent chain length and ancestor IDs. It
deliberately does not compare parent attrs, marks, sibling IDs, or indexes.

`addMarks` applies the local Structure add suggestion and Structure move
suggestion rules: provisional adds absorb later moves, Inverse moves on the same
node cancel, and non-cancelling moves can still stack. See
[`0002-provisional-adds-and-inverse-moves.md`](adr/0002-provisional-adds-and-inverse-moves.md).

## Structure Mark Data

A Structure mark is a node mark with attrs shaped like:

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

- `from`: the node's Parent chain before the edit.
- `to`: the node's Parent chain after the edit.

The `from` chain is used to reconstruct the old location.

## Applying Suggestions

Applying a Structure suggestion accepts the structure edit. It does not move
content. It removes matching `structure` marks. For range apply, the range
selects suggestion IDs, then each selected Structure suggestion is applied as a
whole group.

## Reverting Suggestions

Reverting a Structure suggestion uses the stored operation data to either delete
added nodes or move existing nodes back to their previous Parent chain.
Structure revert ordering is decision-owned by
[`0001-structure-suggestion-revert-order.md`](adr/0001-structure-suggestion-revert-order.md).
For range revert, the range selects suggestion IDs, then each selected Structure
suggestion is reverted as a whole group.

### Reverting `add`

`revertAddOp` deletes the marked node and calls `deleteNodeUpwards` to prune
ancestors that became empty.

### Reverting `move`

`revertMoveOp`:

1. Finds the deepest still-existing ancestor from the stored `from` chain.
2. Wraps the current node in the missing Parent chain with stored types, attrs,
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
  detection first when `experimental_trackStructureChanges`,
  `experimental_trackStructures`, and `experimental_ensureUniqueNodeIds` are
  provided. If structure detection handles the transaction, the normal
  suggestion transform is skipped for that transaction.
- `structureChangesPlugin`: an append-transaction plugin path that also compares
  old and new docs with the same `experimental_trackStructures` config, but is
  not the primary path for current hardening.

`suggestStructureChanges` returns `{ handled, transform }`. `handled` is based
on whether structure ops were detected, not whether the transform contains
steps. This distinction matters when every detected op is intentionally
suppressed, such as moving a node that still has a Structure add suggestion.
Inverse moves are also handled by structure tracking, but they remove an
existing mark and therefore can still produce transform steps.
`withSuggestChanges` uses `handled` to avoid falling back to normal text
suggestion tracking for a transaction structure tracking already understood.

Structure tracking should be skipped for transactions from history, collab, yjs
undo/redo, yjs change origin, or transactions carrying `suggestChangesKey` skip
meta.

## Why Not Use Step Interpretation?

Do not try to infer structural context semantics only from `ReplaceStep` or
`ReplaceAroundStep`. Those steps describe positional replacement mechanics, not
the semantic intent. Comparing materialized paths answers the question this
feature needs: "where was node X before, and where is node X now?"

## Why Not Mark Structural Context Nodes?

Structural context nodes are not stable across edits. ProseMirror commands may
split, join, remove, or recreate list wrappers, list items, and blockquotes. The
content node, identified by stable ID, is the thing a user experiences as "the
item that moved." Marking content nodes makes suggestions survive structural
churn.

## Extending The Feature

When adding support for another structural edit or node family, review all of
these areas together:

- Node ID coverage: every relevant non-text node must get stable unique IDs.
- Detection scope: add a Structural context path made of concrete ProseMirror
  node type names.
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
- Confirm at least one Parent chain contains a configured contiguous Structural
  context path.
- Inspect the added `structure` mark and validate it with
  `guardStructureMarkAttrs`.
- For failed reverts, inspect `op.from`, `op.to`, the current Parent chain, and
  whether the stored parent node types still exist in the schema.
- Check whether insertion chose right sibling, left sibling, or end-of-parent
  fallback.
- Verify `tr.mapping.map(pos)` is used before deleting the current moved node
  after insertion.
- Look for schema errors caused by recreating parents that no longer accept the
  child node.

## Current Limitations / Risks

- Experimental configured structural context tracking only; not a complete
  structural diff engine.
- Configured node names are not runtime-validated against the schema.
- Same-parent reorder is not tracked.
- Parent chain equality only compares ancestor IDs and chain length.
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
- multiple sequential Structure suggestions
- outdenting from a list into the root document
- wrapping and unwrapping content in blockquotes
- nested configured structural contexts, such as blockquote content containing
  lists
- creating bullet and ordered lists through input rules
- applying and reverting individual suggestions
- applying and reverting all suggestions
- missing IDs and duplicate IDs
- copied/pasted content and list-item splits
- stacked Structure marks on the same content node

When changing revert reconstruction, include tests where siblings are missing so
right-sibling, left-sibling, and end-of-parent placement paths are exercised.

Keep this package app-agnostic. Do not add consuming application details or
application-specific metadata assumptions here.
