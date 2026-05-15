# Block Join Suggestion Metadata

Block join suggestions store the nodes that existed on both sides of the
physical join so rejection can split the joined content and restore node type,
attrs, and marks.

Use child-first `leftNodes` and `rightNodes` arrays for current metadata. The
first pair is the visible textblock pair; later pairs are structural parent
pairs. This matches the order needed by revert: split by metadata length, then
restore markup from outer pair back down to the inner pair.

Legacy documents may still contain one `leftNode` and one `rightNode`. Normalize
that shape to one-item arrays before revert so old documents remain rejectable.

The current maximum supported join depth is 2, which covers the TipTap list
behavior where Backspace joins both adjacent list-item paragraphs and their
parent list items. Reject metadata deeper than the configured maximum instead of
truncating it, because partial revert of unknown structure can create a document
that never existed.

When any joined node has a Structure add suggestion, perform the physical join
but do not create a Block join suggestion. Joining away provisional added
structure cancels that pending add rather than creating a second review
artifact.
