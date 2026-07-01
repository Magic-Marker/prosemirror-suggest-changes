# Ensure Valid Selection

This context covers cursor and text-selection positions that suggestion markers
make unsafe for normal editing.

## Language

**Valid selection**: A ProseMirror text selection whose anchor and head can be
used for normal editing without placing the cursor on an **Invalid selection
position**. _Avoid_: safe cursor, allowed cursor position

**Invalid selection**: A ProseMirror text selection whose anchor or head is not
safe for normal editing because it is an **Invalid selection position**.
_Avoid_: bad cursor position, broken selection

**Invalid selection position**: A document position that cannot safely be used
as a text selection anchor or head because it is outside inline content or would
break suggestion-marker editing invariants. _Avoid_: bad cursor position, broken
selection

**Selection correction**: Replacing an invalid text selection with a nearby
**Valid selection** that preserves the user's visible navigation or editing
intent. _Avoid_: cursor rescue, selection fixup

**Destination textblock**: The textblock that browser-native selection movement
has entered before **Selection correction** runs. _Avoid_: same node, target
node
