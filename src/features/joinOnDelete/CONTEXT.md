# Join On Delete Suggestions

This context covers tracked suggestions created when deleting a block boundary
physically joins accepted content while suggestion mode is enabled.

## Language

**Block join suggestion**: One semantic suggestion for a physical block join,
represented by a deletion-marked zero-width space at the visible text join
point. Accepting removes the marker and keeps the join. Rejecting removes the
marker and splits the joined nodes back apart. _Avoid_: deletion join marker,
join point mark

**Joined node pair**: The left and right nodes at one depth of a physical join,
serialized in a **Block join suggestion** so rejection can restore their type,
attrs, and marks. _Avoid_: left/right metadata

**Multi-depth block join**: A physical join that joins more than one node pair
as one action, such as joining two list items and their paragraphs. The current
maximum join depth is 2. _Avoid_: TipTap-only join

## Relationships

- A **Block join suggestion** stores one or more **Joined node pairs**.
- Joined node pairs are ordered child-first: the textblock pair comes before the
  outer block pair.
- A depth-1 join stores one pair; a **Multi-depth block join** may store
  multiple pairs up to the configured maximum depth.
- A legacy Block join suggestion may store only one `leftNode`/`rightNode` pair;
  consumers normalize that shape to one joined node pair before revert.
- If any joined node already has a Structure add suggestion, the physical join
  still happens but no Block join suggestion marker is created.
