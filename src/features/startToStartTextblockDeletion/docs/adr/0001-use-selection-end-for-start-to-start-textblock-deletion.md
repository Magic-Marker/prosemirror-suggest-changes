# Use Selection End For Start-To-Start Textblock Deletion

`prosemirror-transform` 1.12.0 changed `deleteRange` to handle deletions from
the beginning of one textblock to the beginning of another by deleting the
selected textblocks entirely. That changed Backspace-over-selection transactions
from an open replace step ending at the right textblock start to an empty
replace step whose `to` position is before the right textblock.

That broke suggestion tracking because using the normalized `step.to` made the
deleted range exactly match whole block boundaries, so `suggestReplaceStep`
misclassified the edit as a node-level deletion and skipped the expected inline
deletion marks plus Block join suggestion.

For this shape, track the semantic deletion range with `selection.to` rather
than `step.to`. `step.to` points before the right textblock node, so it
describes the normalized structural deletion. `selection.to` points at the start
of the right textblock's text content, which is the user-visible end of the
selected range and the boundary needed to create the expected inline deletion
marks and Block join suggestion.
