# Structure Suggestions Revealed By Block Join Rejection

Rejecting a Block join suggestion can split joined content back into nodes whose
serialized metadata contains Structure marks. Those Structure marks become live
Structure suggestions again only after the Block join suggestion is rejected.

When restoring node markup from Block join suggestion metadata, preserve any
already-live Structure marks on the split nodes instead of treating serialized
marks as a complete replacement. Equivalent Structure marks are matched by
Structure operation: Structure add suggestions use the same suggestion id, and
Structure move suggestions use the same source and destination Parent chains.

All apply-all and revert-all commands must also handle Structure marks revealed
by Block join suggestion processing. Applying all suggestions runs a second
direction-matching Structure suggestion pass after normal suggestion cleanup.
Reverting all suggestions first rejects Block join suggestions as individual
units, including their restored Structure suggestions, then runs the generic
Structure suggestion cleanup for anything still left.

Block join suggestion rejection also rejects the Structure suggestions restored
from that join's serialized metadata. The restored Structure suggestion ids come
from the selected Block join suggestion metadata, not from a document diff after
the split. This keeps single-suggestion commands scoped: unrelated Structure
suggestions that were already live in the document remain untouched. Revert-all
uses the same per-join restored-Structure cleanup before falling back to broad
all-suggestion cleanup.

When a restored Structure suggestion has the same id as the rejected Block join
suggestion, reject that same-id Structure suggestion first. TipTap
paragraph-into-list transaction shaping deliberately gives the Structure move
and Block join the same suggestion id, because they are one visible edit.
Same-id restored Structure rejection lets that semantic unit reject before
broader cleanup considers older Structure suggestions that happened to be
serialized in the same Block join metadata. After the same-id pass, reject the
remaining restored Structure suggestion ids to preserve existing broad cleanup
behavior.

We rejected treating serialized Block join metadata as authoritative over the
current node marks, because sequential Block join rejections can materialize
Structure marks before an earlier join is restored. Overwriting those current
marks loses pending Structure suggestions. We also rejected using generic
right-to-left suggestion traversal as the primary fix, because traversal order
does not address stale serialized markup overwriting Structure marks that are
already live on a node.
