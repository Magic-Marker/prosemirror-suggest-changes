# Prefer Destination Textblock For Selection Correction

When browser-native selection movement enters a different textblock but lands on
an invalid selection position, correct the selection inside that destination
textblock before falling back to document-direction search. This preserves the
user's visible navigation intent for tracked empty paragraphs, where the raw
browser position can be before an insertion-marked zero-width space even though
the editable position is after it.

The alternative direction-only correction treated upward movement as a leftward
document-position change and could move the cursor into the previous textblock.
We also rejected key-specific ArrowUp/ArrowDown handling because mouse clicks
and platform-native selection movement can produce the same invalid destination
position, and rejected making that position valid because selection-position
validity is a separate editing invariant.
