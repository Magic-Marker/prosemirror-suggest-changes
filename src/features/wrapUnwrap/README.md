# Structure Suggestion Tracking & Reversal

## Purpose

Track structural changes (wrap/unwrap in blockquotes, list item lift/sink) in
ProseMirror as "suggestions" that can be reverted later, without losing the
ability to reconstruct the original document state.

---

## Why Marks on Nodes?

**The Problem**: Document positions are ephemeral. A position like `from: 10`
becomes invalid after any edit before it.

**The Solution**: Anchor positions to **actual nodes** in the document using
marks. To recover a position:

1. Find the marked node (which moves with document edits)
2. Compute position from node's current `pos` + the `position` attribute:
   - `position: "start"` → use `pos`
   - `position: "end"` → use `pos + node.nodeSize`

This way, positions are **self-healing** — they remain valid as long as the
marked nodes exist.

**Why "start" vs "end"?** Because the 4 positions of a `ReplaceAroundStep` don't
always align with node boundaries in the same way. The mark must be placed on a
node that **exists in the final document**, and the position must be derivable
from that node's boundaries.

---

## Mark Structure

### For `ReplaceAroundStep` (4 marks)

Each mark contains:

| Field       | Purpose                                                 |
| ----------- | ------------------------------------------------------- |
| `id`        | Suggestion ID (groups marks together)                   |
| `value`     | `"from"` \| `"to"` \| `"gapFrom"` \| `"gapTo"`          |
| `position`  | `"start"` \| `"end"` (how to derive position from node) |
| `type`      | `"replaceAround"`                                       |
| `slice`     | JSON of the slice for the **inverse** step              |
| `insert`    | Where gap content goes in the slice                     |
| `structure` | Boolean flag for structural step                        |

### For `ReplaceStep` (2 marks)

Only `from` and `to` marks are needed (no gap positions).

| Field       | Purpose                                    |
| ----------- | ------------------------------------------ |
| `id`        | Suggestion ID                              |
| `value`     | `"from"` \| `"to"`                         |
| `position`  | `"start"` \| `"end"`                       |
| `type`      | `"replace"`                                |
| `slice`     | JSON of the slice for the **inverse** step |
| `structure` | Boolean flag                               |

### Mark Nesting

Marks are nested around content in the document:

```javascript
doc(
  structure[from, position:start](
    structure[to, position:end](
      blockquote(
        structure[gapFrom, position:start](
          structure[gapTo, position:end](
            paragraph("Hello World")
          ))))))
```

When traversing with `nodesBetween`, we find each marked node and compute
positions from it.

---

## How Reversal Works

The `revertStructureSuggestion(suggestionId)` command:

```
1. FIND the main suggestion's marks
   └── findStructureMarkGroupBySuggestionId(suggestionId)
       └── Scan document for marks with matching ID
       └── Collect: markFrom, markTo, [markGapFrom, markGapTo]

2. FIND nested suggestions within the range
   └── nodesBetween(from, to) to find all structure marks
   └── Collect all unique suggestion IDs

3. SORT by decreasing ID (revert newest first)
   └── [3, 2, 1] — important for nested changes!

4. For EACH suggestion, REVERT:
   └── Compute positions: getPosFromMark(mark, pos, node)
   └── Deserialize slice from JSON
   └── Reconstruct inverse step:
       - ReplaceAroundStep(from, to, gapFrom, gapTo, slice, insert, structure)
       - or ReplaceStep(from, to, slice, structure)
   └── Remove the marks
   └── Apply the step
```

**Why reverse order?** If step 1 created structure A, and step 2 modified within
A, you must undo step 2 before step 1, otherwise positions break.

---

## How Tests Work

Each test file has 3 data structures:

```typescript
// 1. Initial document state (before any changes)
const initialState = doc(paragraph("Hello World"));

// 2. Final state (after applying steps, NO marks)
const finalState = doc(blockquote(paragraph("Hello World")));

// 3. Final state WITH structure marks embedded
//    (manually constructed to simulate what forward tracking would produce)
const finalStateWithMarks = doc(
  structure({ id: 1, data: { value: "from", position: "start", ... } },
    structure({ id: 1, data: { value: "to", position: "end", ... } },
      blockquote(
        structure({ id: 1, data: { value: "gapFrom", ... } },
          structure({ id: 1, data: { value: "gapTo", ... } },
            paragraph("Hello World")
          )))))
);

// The steps that transform initial → final
const steps = [{ stepType: "replaceAround", from: 0, to: 13, ... }];

// The inverse steps that transform final → initial
const inverseSteps = [{ stepType: "replaceAround", from: 0, to: 15, ... }];
```

Three test cases per scenario:

```typescript
// Test 1: Forward transformation works
it("applies steps correctly", () => {
  assertDocumentChanged(initialState, finalState, applySteps(steps));
});

// Test 2: Inverse steps work (sanity check)
it("applies inverse steps correctly", () => {
  assertDocumentChanged(
    finalState,
    initialState,
    applySteps(inverseSteps.reverse()),
  );
});

// Test 3: THE MAIN TEST - revert from marks works
it("reverts via structure suggestion", () => {
  assertDocumentChanged(
    finalStateWithMarks,
    initialState,
    revertStructureSuggestion(1),
  );
});
```

---

## What's Missing: Forward Tracking

The code that would:

1. Intercept `ReplaceAroundStep` / `ReplaceStep` in suggest-changes mode
2. Apply the step to get the new document
3. Compute the inverse step
4. Place structure marks on appropriate nodes with:
   - Position encoding (which node, start vs end)
   - Inverse step data (slice, insert, structure flag)

Currently `suggestReplaceAroundStep` in `replaceAroundStep.ts` converts
structural operations to `ReplaceStep` and uses insertion/deletion marks
instead, losing the structural information needed for proper reversal.

---

## Additional Notes

### Offset Fields

The marks contain offset fields (`gapFromOffset`, `fromOffset`, `toOffset`,
`gapToOffset`) and a `debug` object with computed inverse positions. These are
present in test data but **not currently used** by the revert code — positions
are computed purely from node position + `position` field.
