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

Track this transaction as one semantic suggestion represented by two existing
suggestion concepts rather than inventing new Block join metadata. Generate one
suggestion id for the shaped transaction and pass a fixed-id generator to both
tracking paths. Run Structure suggestion tracking on the prefix represented by
steps 1 and 2. For accepted content, the stable paragraph id produces a
Structure move suggestion with that shared id. For provisional Structure add
content, the move is absorbed by the existing Structure add suggestion and
remains a valid shaped prefix.

Then run normal suggestion tracking on step 3 using the same fixed id. For
accepted joined nodes, Join on Delete creates an ordinary Block join suggestion
with the shared id. The Block join metadata already serializes node marks, so
rejecting the Block join reveals the Structure move suggestion. Single
suggestion rejection prioritizes restored Structure suggestions with the same
id, so the shaped move and join reject as one semantic unit before any broader
restored-Structure cleanup runs. If any joined node still has a Structure add
suggestion, provisional add join cancellation applies: the physical join
happens, but no Block join suggestion is created.

This transaction shape is handled in a transaction shaping layer before the
normal Structure-vs-main tracking branch. If the shape is detected but Structure
tracking is unavailable, unique IDs cannot be settled, or prefix Structure
tracking does not handle the move, transaction shaping declines to handle it and
the existing branch runs unchanged.
