# Configurable Structural Context Paths

Structure tracking uses consumer-provided Structural context paths made of
concrete ProseMirror node type names, such as `["orderedList", "listItem"]` or
`["blockquote"]`, instead of hardcoded list node names. The boolean
`experimental_trackStructureChanges` remains the explicit feature gate, and a
non-empty `experimental_trackStructures` config is required when that gate is
enabled.

Configured node names are not runtime-validated against the schema for now;
consumers are responsible for passing names that exist in their schema. Every
node type in a Structural context path is structural context only, never a
Structure mark target. Structure marks are placed on stable content descendants
beneath the configured context, descending through nested configured context
nodes when needed.

Structural context paths match as contiguous parent-child ancestor shapes, not
as loose node-type membership. For example, `["orderedList", "listItem"]`
matches content whose Parent chain contains `orderedList -> listItem` in that
order with no unrelated ancestor between those two path nodes. It does not mean
"any chain containing `orderedList` or `listItem`." Single-node paths such as
`["blockquote"]` match any content inside that node type. The flattened set of
configured node types is still used only to decide which nodes are structural
context nodes and therefore cannot receive Structure marks themselves.

This preserves the existing Structure suggestion model while making the tracked
structural contexts configurable. We are intentionally deferring semantic
aliases such as `"list"`, runtime schema validation, and configurable mark
targets until there is evidence that consumers need them.
