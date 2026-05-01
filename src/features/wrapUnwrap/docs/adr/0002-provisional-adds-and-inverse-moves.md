# Provisional Adds And Inverse Moves

A Structure add suggestion absorbs later Structure move suggestions while it is
provisional, because moving provisional new structure is part of shaping the
addition before review. An Inverse move on the same content node cancels the
existing Structure mark instead of adding another mark, because the original
move no longer represents pending review work.

This trades away full chronological edit history for clearer pending review work
in those two cases. It is not a global simplification or a dependency graph
across nodes: non-cancelling Structure move suggestions on the same node can
still stack.
