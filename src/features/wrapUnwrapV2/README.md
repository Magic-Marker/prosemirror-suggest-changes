# ProseMirror Structure Changes Tracking

A ProseMirror plugin that detects structural changes to list hierarchies and
stores revertible operations as node marks — enabling suggestion mode for
structural edits like wrapping, outdenting, and moving items between lists.

## Prerequisites

- All block nodes must have stable, unique string IDs via an `id` attribute.
- Lists must follow `ListNode → ListItemNode → ContentNode[]` structure.
- List item children must be block nodes, not text.
- Nested lists are supported.

## Core Idea

The plugin compares two document snapshots (before and after a transaction
batch) and determines what happened to each content node by comparing its
**materialized path** — its full ancestor chain from immediate parent up to the
document root.

Marks are placed on **content nodes** (paragraphs, headings), not on lists or
list items. Content nodes are the invariant — they survive wrapping and
unwrapping. Lists and list items are created and destroyed around them, making
them unsuitable as mark targets.

Each `Parent` entry in the chain stores the parent's ID, type, attrs, marks,
sibling IDs, and child index — enough to recreate the parent node during
reversal and place the child at the correct position.

## Detection

On every `appendTransaction`, the plugin builds materialized paths for the
before-doc and after-doc, then cross-references them:

- **Node in both, chain changed, list involved** → `move` op. Stores the
  before-chain.
- **Node only in after-doc, list involved** → `add` op. No positional data.
- **Node only in before-doc** → deleted, no action.

Chain equality means same length and matching node IDs at every level. Sibling
or index changes alone don't count as a move — this avoids false positives from
index compaction when a neighbor is removed.

All ops from the same transaction share a suggestion ID for grouped revert.

## Reversal

### Reverting `move`

1. Walk the stored before-chain top-down, verifying each ancestor exists **in
   the correct parent** (not just anywhere in the doc). Stop at the first
   mismatch — that's the deepest surviving ancestor.
2. Recreate missing ancestors below the survivor using stored type/attrs/marks.
3. Insert the reconstructed subtree into the survivor, positioned using stored
   sibling IDs (right sibling first, then left, then end of parent as fallback).
4. Delete the content node from its current location and prune empty ancestors
   upward.

### Reverting `add`

Delete the node and prune empty ancestors.

### Empty ancestor pruning

After deletion, walk upward. At each level, if the parent has exactly one child
(the one being removed), expand the deletion to include that parent. This avoids
leaving behind empty list items or lists, and sidesteps ProseMirror's schema
constraint that list items must have content.

## Performance

### Mark application (runs in `appendTransaction`)

Materialized path construction, operation derivation, and mark application are
each O(N) where N is total non-text nodes. Chain comparison at each node is O(D)
for nesting depth D (practically ≤ 10). **Effectively O(N).** Skipped entirely
when `docChanged` is false.

### Suggestion revert (explicit user action)

**O(M × N)** where M is marks in the group. The dominant cost is rebuilding the
node-to-children map and rescanning for the next mark after each individual
revert. Negligible for typical documents; cacheable if needed for large docs
with many grouped marks.

## Known Limitations

- **No reorder detection.** Same-list reordering is not tracked yet. The data is
  stored (sibling IDs and indices), but detection requires comparing relative
  order of surviving peers, not raw indices. Planned.

- **No topological sorting of reverts.** Marks are reverted in document order.
  If mark A depends on mark B recreating a needed ancestor first, A's revert
  fails gracefully. Future improvement: build a dependency graph and
  topologically sort before reverting.

- **Schema violations fail silently.** If a stored node type no longer accepts
  the child being inserted (e.g., a list changed type), the ProseMirror step
  fails and no rollback is attempted.

## Design Decisions

**Materialized paths over step interpretation.** ProseMirror's `ReplaceStep` and
`ReplaceAroundStep` encode positional mutations, not semantic intent. A list
split is a single `ReplaceStep` that's hard to decompose into "item X was
outdented." Comparing ancestor chains gives direct semantic answers.

**Materialized paths over JSON tree diffing.** Early design explored diffing
list subtrees with jsondiffpatch. Abandoned because patch paths require
interpretation to determine affected content nodes, cross-list moves appear as
unrelated remove/add patches needing correlation, and map comparison answers
"where was node X" directly.

**Sibling IDs over indices for positioning.** Indices shift when neighbors
change. Sibling IDs are stable. Index is stored alongside for future reorder
detection but unused during revert.

**Insert-then-delete during move revert.** Inserting first keeps the original
findable via position mapping. Deleting first would invalidate all positions.
