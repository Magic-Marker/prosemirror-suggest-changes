# Multi-Depth Block Join Suggestion Metadata

Block join suggestions already stored the nodes that existed on both sides of a
physical join so rejection could split joined content and restore node markup.
This ADR is about the metadata shape needed to represent joins at more than one
depth.

Current metadata uses child-first `leftNodes` and `rightNodes` arrays. The first
pair is the visible textblock pair; later pairs are structural parent pairs.
This replaced the legacy single-pair `leftNode` and `rightNode` fields, which
could only describe a depth-1 join.

Legacy documents may still contain one `leftNode` and one `rightNode`. Normalize
that shape to one-item arrays before revert so old documents remain rejectable,
but write current documents with the array shape.

The current maximum supported join depth is 2, which covers the TipTap list
behavior where Backspace joins both adjacent list-item paragraphs and their
parent list items. Reject metadata deeper than the configured maximum instead of
truncating it, because partial revert of unknown structure can create a document
that never existed.

When any joined node has a Structure add suggestion, perform the physical join
but do not create a Block join suggestion. Joining away provisional added
structure cancels that pending add rather than creating a second review
artifact.
