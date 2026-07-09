# Cleanup No-op Mark Pairs

This context defines the language for identifying suggestion mark pairs that no
longer represent a meaningful user-visible change.

## Language

**Deletion/Insertion Mark Pair**: A `deletion` mark run immediately followed by
an `insertion` mark run in the same textblock, with the same suggestion id.
_Avoid_: mark pair

**No-op Deletion/Insertion Mark Pair**: A Deletion/Insertion Mark Pair whose
deletion and insertion runs have identical inline content after removing only
suggestion marks. Identical inline content means the same text and the same
non-suggestion marks with the same attributes. _Avoid_: stale suggestion,
redundant suggestion, cancellation, no-op mark pair
