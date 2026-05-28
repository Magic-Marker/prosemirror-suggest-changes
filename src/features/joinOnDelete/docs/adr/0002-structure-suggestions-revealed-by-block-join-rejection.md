# Structure Suggestions Revealed By Block Join Rejection

Rejecting a Block join suggestion can split joined content back into nodes whose
serialized metadata contains Structure marks. Those Structure marks become live
Structure suggestions again only after the Block join suggestion is rejected.

When restoring node markup from Block join suggestion metadata, preserve any
already-live Structure marks on the split nodes instead of treating serialized
marks as a complete replacement. Equivalent Structure marks are matched by
Structure operation: Structure add suggestions use the same suggestion id, and
Structure move suggestions use the same source and destination Parent chains.

All apply-all and revert-all commands run a second direction-matching Structure
suggestion pass after normal suggestion cleanup. Applying all suggestions removes
Structure marks revealed by Block join suggestion processing; reverting all
suggestions rejects Structure marks revealed by Block join suggestion processing.

This keeps single-suggestion commands scoped to the requested suggestion. A
single Block join suggestion rejection may reveal Structure suggestions, but it
does not automatically apply or reject unrelated Structure suggestion ids.

We rejected treating serialized Block join metadata as authoritative over the
current node marks, because sequential Block join rejections can materialize
Structure marks before an earlier join is restored. Overwriting those current
marks loses pending Structure suggestions. We also rejected using generic
right-to-left suggestion traversal as the primary fix, because traversal order
does not address stale serialized markup overwriting Structure marks that are
already live on a node.
