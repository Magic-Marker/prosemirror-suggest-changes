# Wrap/Unwrap Structure Suggestions

This context covers tracked suggestions for configured structural context edits,
such as indenting, outdenting, wrapping, and unwrapping content inside lists or
blockquotes.

## Language

**Structure suggestion**: One semantic structural context change represented by
one or more **Structure mark** instances sharing the same suggestion ID.
_Avoid_: wrapper change, tree diff

**Structure mark**: A node-level mark representing either a `move` of the marked
node from one subtree to another, or an `add` when the marked node did not
previously exist in the document, with an effective role in the **Structure
suggestion**. _Avoid_: wrapper mark, list mark

**Primary Structure mark**: A **Structure mark** whose effective role is the
user-visible source for a **Structure suggestion**; role-less marks are primary.
_Avoid_: visible structure mark, main mark

**Supporting Structure mark**: A **Structure mark** whose effective role is
bookkeeping for collateral structural movement inside the same **Structure
suggestion**, not a user-visible review source. _Avoid_: hidden structure mark,
secondary mark

**Structural context path**: A configured contiguous parent-child ancestor path
of ProseMirror node type names whose nodes provide structural context but are
not **Structure mark** targets. _Avoid_: structure alias, wrapper path

**Structure add suggestion**: A provisional **Structure suggestion** for new
structure that can be moved freely until accepted and does not produce
**Structure move suggestion** instances while provisional. _Avoid_: inserted
list item, pending move

**Provisional add join cancellation**: A block join where any joined node
already has a **Structure add suggestion**; the join is performed, but no
separate **Block join suggestion** is created. _Avoid_: provisional join mark,
add deletion

**Split-derived content node**: A newly materialized content node whose text
came from splitting an accepted sibling, not a sibling that is still a
**Structure add suggestion**. _Avoid_: structure add, new list item

**Structure move suggestion**: A **Structure suggestion** for relocating
accepted content between **Parent chain** values when either chain is a direct
child of a configured **Structural context path**; **Inverse move** pairs
cancel, while non-cancelling moves can stack. _Avoid_: indent mark, outdent mark

**Parent chain**: The ordered ancestor chain that locates content within the
document structure, compared by stable parent node IDs. _Avoid_: document
position, DOM path

**Inverse move**: A pair of **Structure move suggestion** instances where each
move's source **Parent chain** equals the other move's destination **Parent
chain**. _Avoid_: undo mark, reverse mark
