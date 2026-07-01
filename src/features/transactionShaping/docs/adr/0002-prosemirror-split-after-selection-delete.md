# ProseMirror Split After Selection Delete Transaction Shaping

ProseMirror's base Enter command can emit a two-step transaction when Enter is
pressed over a non-empty text selection: first delete the selected content, then
perform a structural split at the deletion start. When the selection crosses
list-item textblock boundaries, the structural split can look like a Structure
add candidate even though the visible edit is deletion plus split. Route this
recognized transaction shape through normal suggestion tracking as a whole, so
the deleted content receives deletion marks and the split receives ordinary
split-derived insertion marks.

This deliberately avoids disabling Structure add suggestions globally. Structure
add remains the representation for newly materialized content nodes inside
tracked structural contexts when they are not recognized as split-derived. It
also avoids broad before/after text-content inspection; the detector is limited
to the exact delete-step plus structural-split step shape, with both deletion
endpoints inside textblock parents and the split slice carrying the duplicated
stable node id produced by ProseMirror's split.
