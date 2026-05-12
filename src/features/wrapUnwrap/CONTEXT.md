# Wrap/Unwrap Structure Suggestions

This context covers tracked suggestions for configured structural context edits,
such as indenting, outdenting, wrapping, and unwrapping content inside lists or
blockquotes.

## Language

**Structure suggestion**: One semantic structural context change represented by
one or more **Structure marks** sharing the same suggestion ID. _Avoid_: wrapper
change, tree diff

**Structure mark**: A node-level mark representing either a `move` of the marked
node from one subtree to another, or an `add` when the marked node did not
previously exist in the document. _Avoid_: wrapper mark, list mark

**Structural context path**: A configured contiguous parent-child ancestor path
of ProseMirror node type names whose nodes provide structural context but are
not **Structure mark** targets. _Avoid_: structure alias, wrapper path

**Structure add suggestion**: A provisional **Structure suggestion** for new
structure that can be moved freely until accepted and does not produce
**Structure move suggestions** while provisional. _Avoid_: inserted list item,
pending move

**Provisional add join cancellation**: A block join where either immediate
joined content node still has a **Structure add suggestion**; the join is
performed, but no separate join suggestion is created. _Avoid_: provisional join
mark, add deletion

**Split-derived content node**: A newly materialized content node whose text
came from splitting an accepted sibling, not a sibling that is still a
**Structure add suggestion**. _Avoid_: structure add, new list item

**Structure move suggestion**: A **Structure suggestion** for relocating
accepted content between **Parent chains** when either chain is inside a
configured **Structural context path**; **Inverse moves** cancel, while
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
- A **Structural context path** contains only structural context node types; the
  **Structure marks** belong on stable content descendants beneath that context.
- A **Structural context path** such as `orderedList -> listItem` represents a
  contiguous parent-child relationship, not aliases, schema groups, or loose
  node-type membership.
- Nested structural context nodes are skipped as mark targets; tracking descends
  until stable content descendants are found.
- A **Split-derived content node** is not a **Structure add suggestion**; normal
  text suggestion tracking owns the split transaction.
- A single **Structure suggestion** can mark multiple nodes when one semantic
  edit changes multiple stable content nodes, such as outdenting a middle list
  item and splitting the surrounding list.
- A **Structure suggestion** becomes accepted when its **Structure marks** are
  removed.
- A **Structure suggestion** becomes rejected when its structural change is
  undone: added structure is removed, and moved structure is restored to its
  previous location.
- **Provisional add join cancellation** keeps provisional structure edits from
  creating a second pending review artifact when the user immediately joins the
  added content away.

## Example dialogue

> **Dev:** "If I create a new list item and indent it twice before accepting,
> should we record those indents as moves?" **Domain expert:** "No. It is still
> a **Structure add suggestion**, so moving it is part of shaping the new
> structure until the add is accepted."
>
> **Dev:** "When a middle item is outdented and the list splits, is that one
> suggestion or two?" **Domain expert:** "It is one **Structure suggestion**
> with multiple **Structure marks**, because the user made one semantic edit."
>
> **Dev:** "If pressing Enter splits `HelloWorld` into `Hello` and `World`
> inside a list item, is `World` new structure?" **Domain expert:** "No. It is a
> **Split-derived content node**, so normal text suggestion tracking should own
> that split."
>
> **Dev:** "If an empty list item is still a Structure add suggestion and the
> user Backspaces it back into the previous item, do we keep a join suggestion?"
> **Domain expert:** "No. That is **Provisional add join cancellation**: perform
> the join and leave no extra pending suggestion."
>
> **Dev:** "If I wrap a paragraph in a blockquote, is the blockquote the
> suggestion target?" **Domain expert:** "No. The blockquote is part of the
> **Structural context path**; the paragraph receives the **Structure mark**."

## Flagged ambiguities

- "add mark" means **Structure add suggestion** here, not an inline insertion
  mark.
- "suggestion" and "mark" are distinct: a **Structure suggestion** is the
  semantic change group, while a **Structure mark** is the node-level marker in
  that group.
- "structure" may refer to configured structural context, runtime **Parent
  chains**, or **Structure marks** — resolved: use **Structural context path**
  for consumer configuration and **Parent chain** for runtime document location.
