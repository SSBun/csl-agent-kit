# CSL Task Overlay Pi Extension

Status: Completed (2026-07-26 16:20)

## Target

- [x] T1: `pi/extensions/csl-task-overlay.ts` exists, exports default factory, parses `tasks/todo.md` of `ctx.cwd` into task rows.
- [x] T2: Overlay widget renders above editor with heading `Tasks` and one line per task (status glyph + title + step progress).
- [x] T3: Overlay refreshes on `tool_execution_end` for write/edit/bash touching `tasks/todo.md` or `tasks/todo/*.md`; refreshes on `session_start`; auto-hides when list is empty.
- [x] T4: `/csl-tasks` slash command prints the full task list grouped by status.
- [x] T5: Headless (`ctx.hasUI === false`) registers nothing visible and stays side-effect-free.
- [x] T6: Extension loads without error under pi's jiti; follows existing `pi/extensions/*.ts` conventions.

## Plan

1. Write `csl-task-overlay.ts` with markdown index parser, status glyph map, overflow rules, widget render, and event hooks.
2. Run `node --check` on the file (the repo uses jiti TS loader at runtime; syntax check is the cheap gate).
3. Register the command and verify via reading the existing extension patterns.
4. Update this task file with result evidence.

## Result

- T1 ✓ `pi/extensions/csl-task-overlay.ts` written (≈300 LOC). Parses `<cwd>/tasks/todo.md` index lines via `/^\s*-\s+\[(.+?)\]\([^)]+\)\s*[—-]\s*(.+?)\s*$/`; maps English + legacy Chinese status words to a 6-state canonical Status.
- T2 ✓ Widget renders above editor under key `csl-tasks`. Heading `● Tasks (active/total)` (or `○` when no active). Rows: status glyph + title, tree prefixes (`├─`/`└─`). Active-first ordering (in_progress → in_review → pending → blocked → completed → unknown).
- T3 ✓ Refreshes on `session_start` and `tool_execution_end` (filtered to write/edit/bash touching `tasks/todo.md` or `tasks/todo/*.md`). Auto-hides (clears widget) when list is empty.
- T4 ✓ `/csl-tasks` command prints the full list grouped by status (`── In Progress ──` etc.), skipping empty groups, plus an active/total summary line.
- T5 ✓ Headless guarded by `ctx.hasUI`; no widget, no writes, no side effects.
- T6 ✓ Loads under pi's jiti (`LOAD OK — default export: function`, factory `cslTaskOverlay`). Auto-discovered via existing `package.json` `pi.extensions: ["./pi/extensions"]` — no settings.json change.

Self-check (pure logic, no pi types) passed: parses 165 real `tasks/todo.md` rows, maps legacy Chinese (`已完成`→completed, `未标注`→unknown), overflow caps at 12 rows with a `+N more (X completed, Y pending)` summary.

No `workspace-manage-task` contract change: extension is read-only, no session id written to task files (resolution per the agreed plan A: matching by `ctx.cwd`).

## Review

_Review gate: Skipped — pure read-only UI extension with no security/data/compatibility surface. Verified by: jiti load + pure-logic self-check (parse/render/overflow/empty) against real `tasks/todo.md`._
