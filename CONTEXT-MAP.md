# Context Map

## Contexts

- [Wrap/Unwrap Structure Suggestions](./src/features/wrapUnwrap/CONTEXT.md) -
  tracked suggestions for configured structural context edits such as indent,
  outdent, wrap, and unwrap.
- [Join On Delete Suggestions](./src/features/joinOnDelete/CONTEXT.md) - tracked
  suggestions for physical block joins created by deleting a block boundary.
- [Transaction Shaping](./src/features/transactionShaping/CONTEXT.md) -
  recognition of special compound editor transactions that should be expressed
  as existing suggestion concepts.

## Relationships

- Wrap/unwrap owns **Structure suggestions** and **Structure add suggestions**.
- Join-on-delete owns **Block join suggestions**.
- **Provisional add join cancellation** is the shared rule: when a physical
  block join touches any node with a Structure add suggestion, the join happens
  but no separate Block join suggestion is created.
- Transaction shaping may split a recognized compound transaction into existing
  Structure suggestion and Block join suggestion tracking paths; it does not
  introduce a separate suggestion type.
