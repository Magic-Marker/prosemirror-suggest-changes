# Context Map

## Contexts

Context docs live under `src`.

- Wrap/Unwrap Structure Suggestions - tracked suggestions for configured
  structural context edits such as indent, outdent, wrap, and unwrap.
- Join On Delete Suggestions - tracked suggestions for physical block joins
  created by deleting a block boundary.
- Transaction Shaping - recognition of special compound editor transactions that
  should be expressed as existing suggestion concepts.
- Start-To-Start Textblock Deletion - single replace-step text-selection
  deletion shapes whose step boundaries differ from the user-visible deleted
  range.
- Ensure Valid Selection - cursor and text-selection positions that suggestion
  markers make unsafe for normal editing.
- Cleanup No-op Mark Pairs - detection and cleanup of deletion/insertion mark
  pairs that no longer represent a meaningful user-visible change.

## Relationships

- Wrap/unwrap owns the **Structure suggestion** and **Structure add suggestion**
  concepts.
- Join-on-delete owns the **Block join suggestion** concept.
- **Provisional add join cancellation** is the shared rule: when a physical
  block join touches any node with a Structure add suggestion, the join happens
  but no separate Block join suggestion is created.
- Transaction shaping may split a recognized compound transaction into existing
  Structure suggestion and Block join suggestion tracking paths; it does not
  introduce a separate suggestion type. When the recognized shape is one visible
  edit, those existing concepts may share one suggestion ID.
- Start-to-start textblock deletion is handled inside normal replace-step
  suggestion tracking; it does not inspect or rewrite whole transactions.
- Ensure-valid-selection runs after transactions and may rewrite invalid text
  selections without changing the document.
