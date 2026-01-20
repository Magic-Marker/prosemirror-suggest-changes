# Join On Delete Suggestions

This context covers tracked suggestions created when deleting a block boundary
physically joins accepted content while suggestion mode is enabled.

## Language

**Block join suggestion**: The tracked suggestion concept for a physical block
join, represented by a deletion-marked zero-width space at the visible text join
point. Accepting removes the marker and keeps the join. Rejecting removes the
marker and splits the joined nodes back apart. A **Special transaction shape**
may group a Block join suggestion with a related Structure suggestion by shared
suggestion ID. _Avoid_: deletion join marker, join point mark

**Joined node pair**: The left and right nodes at one depth of a physical join,
serialized in a **Block join suggestion** so rejection can restore their type,
attrs, and marks. _Avoid_: left/right metadata

**Multi-depth block join**: A physical join that joins more than one node pair
as one action, such as joining two list items and their paragraphs. The current
maximum join depth is 2. _Avoid_: TipTap-only join
