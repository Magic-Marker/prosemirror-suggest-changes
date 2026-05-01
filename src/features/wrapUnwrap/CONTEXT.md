# Wrap/Unwrap Structure Suggestions

This context covers tracked suggestions for list structure edits, such as
indenting, outdenting, wrapping, and unwrapping list content.

## Language

**Structure suggestion**: One semantic list-structure change represented by one
or more **Structure marks** sharing the same suggestion ID. _Avoid_: wrapper
change, tree diff

**Structure mark**: A node-level mark representing either a `move` of the marked
node from one subtree to another, or an `add` when the marked node did not
previously exist in the document. _Avoid_: wrapper mark, list mark

**Structure add suggestion**: A provisional **Structure suggestion** for new
structure that can be moved freely until accepted and does not produce
**Structure move suggestions** while provisional. _Avoid_: inserted list item,
pending move

**Structure move suggestion**: A **Structure suggestion** for relocating
accepted structure between **Parent chains**; **Inverse moves** cancel, while
non-cancelling moves can stack. _Avoid_: indent mark, outdent mark

**Parent chain**: The ordered ancestor chain that locates content within the
document structure, compared by stable parent node IDs. _Avoid_: document
position, DOM path

**Inverse move**: A pair of **Structure move suggestions** where each move's
source **Parent chain** equals the other move's destination **Parent chain**.
_Avoid_: undo mark, reverse mark

## Relationships

- A **Structure suggestion** contains one or more **Structure marks** with the
  same suggestion ID.
- A single **Structure suggestion** can mark multiple nodes when one semantic
  edit changes multiple stable content nodes, such as outdenting a middle list
  item and splitting the surrounding list.
- A **Structure suggestion** becomes accepted when its **Structure marks** are
  removed.
- A **Structure suggestion** becomes rejected when its structural change is
  undone: added structure is removed, and moved structure is restored to its
  previous location.

## Example dialogue

> **Dev:** "If I create a new list item and indent it twice before accepting,
> should we record those indents as moves?" **Domain expert:** "No. It is still
> a **Structure add suggestion**, so moving it is part of shaping the new
> structure until the add is accepted."
>
> **Dev:** "When a middle item is outdented and the list splits, is that one
> suggestion or two?" **Domain expert:** "It is one **Structure suggestion**
> with multiple **Structure marks**, because the user made one semantic edit."

## Flagged ambiguities

- "add mark" means **Structure add suggestion** here, not an inline insertion
  mark.
- "suggestion" and "mark" are distinct: a **Structure suggestion** is the
  semantic change group, while a **Structure mark** is the node-level marker in
  that group.
