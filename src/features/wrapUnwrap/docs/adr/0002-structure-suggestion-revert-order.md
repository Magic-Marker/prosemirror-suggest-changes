# Structure Suggestion Revert Order

Status: experimental, active hardening.

When rejecting changes, structure suggestions must be reverted before inline
suggestion cleanup, and structure marks must be reverted from the current
document in right-to-left order. This prevents nested provisional structure from
leaving empty wrappers behind and avoids relying on positions captured before
earlier revert steps changed the document.

## Context

A single user action can create multiple structure suggestions, and one
structure suggestion can contain multiple structure marks. Those marks may be in
ancestor/descendant relationships created by list input rules, indent, outdent,
wrap, and unwrap commands.

For example, creating a new list after a paragraph and then indenting the middle
item creates an outer provisional list item and a nested provisional list item.
If the outer move is reverted while the nested add still exists, ancestor
pruning must stop because the outer list item is not empty. Reverting the nested
add first lets the later outer revert remove the wrapper cleanly.

## Decision

Public reject/revert commands revert structure suggestions before normal
insertion, deletion, and modification marks. Structure revert changes document
shape, so inline cleanup should run against the document shape that remains
after structure changes have been rejected.

When reverting all structure suggestions in a document, do not collect all
suggestion IDs once and iterate them in document traversal order. Instead,
repeatedly find the rightmost remaining structure mark in the current document,
revert that mark's suggestion group, then search again in the updated document.

When reverting marks inside one structure suggestion, repeatedly find the
rightmost remaining mark for that suggestion ID in the current document, revert
it, then search again. For ancestor/descendant marks in the same subtree,
right-to-left order visits descendants before ancestors, which lets
`deleteNodeUpwards` prune wrappers after their children have been removed.

When reverting a specific structure suggestion, first check whether any of its
move marks no longer match their stored `to` parent chain. If so, look for a
structure mark on the same node whose `to` chain matches the current parent
chain and revert that suggestion first. This handles stacked moves on the same
content node without building a global dependency graph.

## Consequences

Right-to-left order is not the same as globally deepest-first order. A shallow
node in a later branch is visited before a deep node in an earlier branch. That
is acceptable because the required guarantee is local: descendants in the same
subtree are reverted before their ancestors.

Range revert can still be more limited than whole-document revert because range
boundaries are selected in the original document. Prefer scenario coverage for
whole-document reject-all behavior and focused tests for range behavior before
expanding this policy.

This is intentionally not a full topological sort. Cross-node dependencies that
cannot be discovered through current document position or same-node stacked move
marks need explicit tests before broadening the dependency model.
