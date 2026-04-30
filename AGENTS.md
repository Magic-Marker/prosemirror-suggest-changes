# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with
project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial
tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes,
simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it
work") require constant clarification.

## 5. Project-Specific Guidelines

### Working With The Demo Page To Explore, Test, And Debug

The Vite demo is usually served at `http://localhost:5173/`. Before starting it,
check whether it is already running, either by inspecting existing terminals or
by navigating to the local URL with MCP. If it is not running, start it with
`yarn demo`. When investigating editor behavior, prefer `@playwright/mcp`.

Use Playwright MCP because it is closest to the existing e2e test environment:
it gives reliable browser actions, accessibility snapshots, keyboard events, and
page evaluation in one place. Prefer it over Cursor browser tools for
ProseMirror state inspection, over Chrome DevTools MCP for routine editor
workflows, and over Playwright CLI/scripts unless the user explicitly asks for a
script or test.

The demo exposes `window.pmView` as a ProseMirror `EditorView` instance. Use it
through `browser_evaluate` for JSON-safe inspection and targeted setup, but
reproduce editor bugs with real keyboard and click interactions whenever
possible.

Useful MCP tools for editor debugging:

- `browser_evaluate`: inspect `window.pmView`, DOM subtrees, and JSON-safe
  state.
- `browser_snapshot`: find controls, refs/selectors, visible state, and optional
  bounding boxes.
- `browser_console_messages`: check runtime errors, warnings, and debug logs
  after a repro.

### Working With The Demo Editor

Use `browser_snapshot` to find controls and confirm visible editor state. Click
`.ProseMirror` or set a selection with `window.pmView` and call
`window.pmView.focus()` before sending keyboard input.

To focus a specific visible node, use `browser_click` with a CSS selector in the
`target` argument, for example `target: ".ProseMirror p:nth-child(3)"`. Be more
specific for nested structures, since list item paragraphs are not direct
siblings of top-level paragraphs.

Use `browser_type` with `target: ".ProseMirror"` and `slowly: true` when text
should pass through ProseMirror input rules character by character, such as
typing `- ` to start a list. Use `browser_press_key` for editor commands:
`Enter`, `Backspace`, `Delete`, `Tab`, `Shift+Tab`, arrow keys, and modifier
shortcuts. Use button clicks for UI actions such as `Apply all` and
`Revert all`.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer
rewrites due to overcomplication, and clarifying questions come before
implementation rather than after mistakes.
