# Structure Mark Roles Design

## Context

Structure suggestions currently mark every stable content node whose parent
chain changes across a configured structural context. This preserves revert
correctness, but it can expose implementation details to users.

For example, outdenting a middle list item splits the original list into two
lists. The outdented item is the user-visible change, but the items below it
also receive Structure marks because their parent list wrapper was recreated.
That is technically accurate, but product users expect only the outdented item
to look changed.

## Goals

- Visually mark only the item the user semantically changed.
- Keep collateral Structure marks available for apply/revert bookkeeping.
- Preserve current apply/revert behavior by suggestion ID.
- Keep existing documents compatible: role-less Structure marks are visible.
- Keep the first implementation small and scoped to Structure suggestions.

## Non-Goals

- Do not change review-control grouping in Marker.
- Do not change demo debugging controls to hide supporting marks.
- Do not move supporting operations into the primary mark.
- Do not redesign the tree-diff or Structure suggestion model.

## Structure Mark Role

Add optional role metadata to Structure mark data:

```ts
type StructureMarkRole = "primary" | "supporting";

type StructureMarkData = {
  op: Op;
  role?: StructureMarkRole;
};
```

Role-less marks are treated as `primary`.

`primary` means the mark represents the user-visible structural change.
`supporting` means the mark exists to preserve apply/revert correctness for
collateral wrapper movement, but should not receive product-visible Structure
styling.

## DOM Projection

`schema.ts` should project the effective role into the Structure mark DOM:

```html
<div data-type="structure" data-role="primary">
```

Role-less or unknown role values should render as `data-role="primary"`.
Supporting marks should render as `data-role="supporting"`.

Product CSS can then style only primary Structure marks:

```css
div[data-type="structure"][data-role="primary"] {
  /* visible structure styling */
}
```

Supporting marks must not be hidden with `display: none`, because the mark wraps
real document content. They simply should not receive visible change styling.

## Classification

Classification happens after Structure operations are detected for one
suggestion and before Structure marks are added to the document.

Rules:

- `add` operations are always `primary`.
- `move` operations are `primary` when the content node crosses a configured
  structural context boundary.
- `move` operations are `supporting` when all are true:
  - the same suggestion group contains at least one primary boundary move;
  - the move keeps the same configured structural context depth;
  - the move keeps the same innermost content-owning structural parent, such as
    the same `listItem` ID;
  - an outer structural wrapper changed, such as a list node being split or
    recreated.
- Uncertain cases default to `primary`.

The classifier should be conservative. It should only hide moves that look like
collateral wrapper recreation around a real primary structural edit.

### Middle Outdent Example

Before:

```text
orderedList
  listItem -> paragraph("Item One")
  listItem -> paragraph("Item Two")
  listItem -> paragraph("Item Three")
  listItem -> paragraph("Item Four")
  listItem -> paragraph("Item Five")
```

After outdenting `Item Three`:

```text
orderedList
  listItem -> paragraph("Item One")
  listItem -> paragraph("Item Two")
paragraph("Item Three")
orderedList
  listItem -> paragraph("Item Four")
  listItem -> paragraph("Item Five")
```

Roles:

- `Item Three`: `primary`, because it leaves the list structural context.
- `Item Four`: `supporting`, because it remains inside the same list item and
  list depth, but its outer list wrapper was recreated.
- `Item Five`: `supporting`, for the same reason as `Item Four`.

All three marks keep the same suggestion ID.

## Apply And Revert Behavior

Apply/revert behavior remains suggestion-ID based. Applying or reverting the
visible primary suggestion handles primary and supporting marks together.

Directly reverting an individual supporting mark may remain possible in demo or
debug tooling. Product review UI should not create actions from supporting
marks, but Marker already groups review controls by suggestion ID, so control
cardinality does not need to change.

## Verification

Implementation should first prove it does not disturb existing behavior by
running the full unit and e2e suite unchanged.

Add at most one focused e2e assertion around the existing middle-outdent path:

- outdenting `Item Three` still creates three Structure marks;
- exactly one mark is primary or role-less-visible;
- exactly two marks are `supporting`;
- the existing revert-all assertion still restores the original list.

Do not add a broad new e2e matrix initially. Add unit classifier coverage later
only if the implementation shape proves hard to trust without it.
