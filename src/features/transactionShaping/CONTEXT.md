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
that list item's paragraph. _Avoid_: list backspace hack, paragraph absorption
