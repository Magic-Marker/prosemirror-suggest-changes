When nodes are joined using backspace or delete, let the join happen normally,
but mark former node boundaries with deletion mark of type="join".

Save information about what nodes were at each side of the boundary before the
join.

Then on restore, use marks at join points to split the node and restore the node
markup at each side of the split.
