# Provisional Adds And Inverse Moves

A Structure add suggestion absorbs later Structure move suggestions while it is
provisional, because moving provisional new structure is part of shaping the
addition before review. An Inverse move on the same content node cancels the
existing Structure mark instead of adding another mark, because the original
move no longer represents pending review work.

When a block join joins two immediate textblocks and either side is still
Structure-add-marked, the physical join still happens but no deletion join
marker is created. Joining away provisional added structure is cancellation of
that pending add, not a separate join suggestion.

When split-derived detection sees a candidate previous sibling whose subtree is
still Structure-add-marked in the before-doc, it does not treat the new node as
split-derived accepted content. Editing inside provisional new structure should
produce provisional Structure add suggestions until that structure is accepted.

This trades away full chronological edit history for clearer pending review work
in those two cases. It is not a global simplification or a dependency graph
across nodes: non-cancelling Structure move suggestions on the same node can
still stack.
