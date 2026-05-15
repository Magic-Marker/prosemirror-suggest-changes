# Context Map

This repository has multiple bounded documentation contexts:

- `src/features/joinOnDelete/CONTEXT.md`: Block join suggestions created when
  deleting a block boundary physically joins accepted content.
- `src/features/wrapUnwrap/CONTEXT.md`: Structure suggestions for configured
  structural context edits such as indent, outdent, wrap, and unwrap.

Cross-context relationship:

- Wrap/unwrap owns **Structure suggestions** and **Structure add suggestions**.
- Join-on-delete owns **Block join suggestions**.
- **Provisional add join cancellation** is the shared rule: when a physical
  block join touches any node with a Structure add suggestion, the join happens
  but no separate Block join suggestion is created.
