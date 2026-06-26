# Transaction Shaping

This context covers recognized compound editor transactions that are rewritten
into existing tracked suggestion concepts before normal suggestion tracking.

## Language

**Transaction shaping**: Recognition of a known editor transaction shape and its
expression as existing suggestion concepts rather than a new suggestion type.
_Avoid_: transaction workaround, custom suggestion

**Special transaction shape**: A concrete multi-step editor transaction pattern
whose visible edit crosses existing suggestion-context boundaries. _Avoid_:
weird transaction, keymap quirk

**TipTap paragraph-into-list join**: A **Special transaction shape** where
Backspace moves a paragraph into the previous list item and then joins it with
that list item's paragraph; it is one visible edit expressed through existing
Structure suggestion and Block join suggestion concepts sharing one suggestion
ID. _Avoid_: list backspace hack, paragraph absorption

**ProseMirror split-after-selection-delete**: A **Special transaction shape**
where Enter over a non-empty text selection is emitted as a deletion step
followed by a structural split step; it is one visible edit expressed through
normal suggestion tracking rather than Structure suggestion tracking. _Avoid_:
boundary Enter hack, split false positive
