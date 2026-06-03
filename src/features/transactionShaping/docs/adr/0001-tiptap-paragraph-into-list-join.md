# TipTap Paragraph Into List Join Transaction Shaping

TipTap's list keymap emits a three-step transaction when Backspace is pressed at
the start of a paragraph that immediately follows a list. The visible edit is
one operation: move the paragraph into the last list item and join it with that
item's paragraph. The transaction mechanics are more specific:

Step 1 deletes the standalone paragraph after the list:

```json
{ "stepType": "replace", "from": 42, "to": 60 }
```

After this step, the document contains only the list. The paragraph text is not
visible anywhere in the document.

Step 2 inserts the same paragraph into the last list item:

```json
{
  "stepType": "replace",
  "from": 40,
  "to": 40,
  "slice": {
    "content": [
      {
        "type": "paragraph",
        "attrs": {
          "id": "node-9",
          "textAlign": null
        },
        "content": [{ "type": "text", "text": "sample paragraph" }]
      }
    ]
  }
}
```

After this step, the last list item has two paragraphs: the original item
paragraph and the moved paragraph.

Step 3 joins those two paragraphs inside the last list item:

```json
{ "stepType": "replace", "from": 39, "to": 41, "structure": true }
```

After this step, the last list item has one paragraph containing both texts.

Track this transaction as two existing suggestion concepts rather than inventing
new Block join metadata. Run Structure suggestion tracking on the prefix
represented by steps 1 and 2, so the stable paragraph id produces a Structure
move suggestion. Then run normal suggestion tracking on step 3, so Join on
Delete creates an ordinary Block join suggestion. The Block join metadata
already serializes node marks, so rejecting the Block join reveals the Structure
move suggestion, and the normal second Structure rejection pass can move the
paragraph back after the list.

This transaction shape is handled in a transaction shaping layer before the
normal Structure-vs-main tracking branch. If the shape is detected but Structure
tracking is unavailable, unique IDs cannot be settled, or the prefix does not
produce a move Structure mark on the moved paragraph, transaction shaping
declines to handle it and the existing branch runs unchanged.
