# Centralized No-op Deletion/Insertion Cleanup

No-op deletion/insertion pairs can arise from mark toggles, but the same shape
can also appear after ordinary tracked text edits later become equivalent again.
Clean these pairs in one changed-range-scoped transaction pass instead of inside
individual mark-step handlers, so cleanup is tied to the resulting suggestion
shape rather than to the command that happened to create it.

The cleanup keeps the deletion-side content, removes its `deletion` mark, and
deletes the duplicate insertion-side content. It runs before deletion-anchor
insertion so transient no-op deletion marks do not get anchored by
`prependDeletionsWithZWSP`.
