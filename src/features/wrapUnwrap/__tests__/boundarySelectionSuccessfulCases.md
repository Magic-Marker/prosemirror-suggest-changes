# Boundary Selection Cases That Round-Tripped

These are exploratory wrap/unwrap structure tracking cases tried while looking
for a failing `initial doc -> operations -> Revert all -> initial doc` scenario.
They succeeded, so future investigation should not start by repeating them
unless the behavior changes or we decide to promote them to regression tests.

All cases used real keyboard interactions in the Playwright demo editor and
ended with `Revert all` producing a document equal to the initial document.

## Top-Level Ordered List

Initial document unless noted otherwise:

```text
1. Item 1
2. Item 2
3. Item 3
4. Item 4
```

- Select adjacent items at a text boundary, indent with `Tab`, press
  `Backspace`, type replacement text, then `Revert all`.
- Select adjacent items at a text boundary, outdent from a nested list with
  `Shift+Tab`, press `Backspace`, type replacement text, then `Revert all`.
- Delete a boundary-spanning selection from the start of `Item 4` back toward
  `Item 2`, type replacement text, then `Revert all`.
- Indent a boundary selection, then create a new boundary selection from a
  following item across the moved items, press `Backspace`, type replacement
  text, then `Revert all`.
- Indent `Item 3` under `Item 2`, then indent `Item 2` under `Item 1`, then
  `Revert all`.
- Create a deeper dependency chain by indenting `Item 3` under `Item 2`,
  indenting `Item 4` under `Item 3`, then indenting `Item 2` under `Item 1`,
  then `Revert all`.
- Select `Item 2` and `Item 3` at a boundary, wrap with `ControlOrMeta+U`, press
  `Backspace`, type replacement text, then `Revert all`.
- Select `Item 1` and `Item 2` at a boundary, wrap with `ControlOrMeta+U`, press
  `Backspace`, type replacement text, then `Revert all`.
- A keyboard-navigated top-level list `Enter` case round-tripped during
  exploration, but the reduced exact-cursor case
  `Item| 3 -> Shift+ArrowUp -> Enter -> Revert all` is the failing repro and
  should not be treated as a successful case.

## Provisional List Items

Initial document:

```text
1. Item One
2. Item Two
```

- Press `Enter`, type `Draft A`, press `Enter`, type `Draft B`, select upward
  from the start of `Draft B` into `Draft A`, press `Backspace`, type
  replacement text, then `Revert all`.
- Press `Enter`, type `Draft A`, press `Enter`, type `Draft B`, select downward
  from `Draft A` into `Draft B`, press `Delete`, type replacement text, then
  `Revert all`.

## Nested Ordered List

Initial document:

```text
1. Item 1
2. Item 2
   1. Item 2.1
   2. Item 2.2
   3. Item 2.3
3. Item 3
```

- Select adjacent nested items at a text boundary, outdent with `Shift+Tab`,
  press `Backspace`, type replacement text, then `Revert all`.
- Select adjacent nested items at a text boundary, press `Enter`, type
  replacement text, then `Revert all`.

## Paragraphs And Blockquotes

Initial document:

```text
Paragraph One

Paragraph Two

Paragraph Three
```

- Select across paragraph starts with `Shift+ArrowUp`, wrap with
  `ControlOrMeta+U`, select a following boundary with `Shift+ArrowDown`, press
  `Backspace`, type replacement text, then `Revert all`.
- Select across paragraph starts with `Shift+ArrowUp`, wrap with
  `ControlOrMeta+U`, press `Delete`, type replacement text, then `Revert all`.

## No-Op Case

This was not a successful round-trip scenario; it made no document change:

- Select a boundary range that includes the first list item, then press `Tab`.
  The command is a valid no-op because the first list item cannot be indented
  under a previous sibling.
