# CSL Task Overlay Pi Extension

Status: Completed (2026-07-27 20:24)

## Target

- [x] T1: `pi/extensions/csl-task-overlay.ts` exists, exports default factory, parses `tasks/todo.md` of `ctx.cwd` into task rows.
- [x] T2: Overlay widget renders above editor with heading `Tasks` and one line per task (status glyph + title + step progress).
- [x] T3: Overlay refreshes on `session_start` and auto-hides when the task list is empty.
- [x] T4: `/csl-tasks` slash command prints the full task list grouped by status.
- [x] T5: Headless (`ctx.hasUI === false`) registers nothing visible and stays side-effect-free.
- [x] T6: Extension loads without error under pi's jiti; follows existing `pi/extensions/*.ts` conventions.
- [x] T7: UI sessions refresh task index and Target progress every 5 seconds, while session shutdown reliably releases the refresh timer.

## Plan

1. Replace tool-completion refreshes with a session-scoped 5-second refresh timer while preserving initial and command-driven refreshes.
2. Add deterministic regression coverage for timer cadence, external task changes, and shutdown cleanup.
3. Run the focused Pi extension checks and record the result.

## Result

- T1 ✓ `pi/extensions/csl-task-overlay.ts` written (≈300 LOC). Parses `<cwd>/tasks/todo.md` index lines via `/^\s*-\s+\[(.+?)\]\([^)]+\)\s*[—-]\s*(.+?)\s*$/`; maps English + legacy Chinese status words to a 6-state canonical Status.
- T2 ✓ Widget renders above editor under key `csl-tasks`. Heading `● Tasks (active/total)` (or `○` when no active). Rows: status glyph + title, tree prefixes (`├─`/`└─`). Active-first ordering (in_progress → in_review → pending → blocked → completed → unknown).
- T3 ✓ `session_start` still performs an immediate refresh, and `refresh()` clears the widget when the task list is empty.
- T4 ✓ `/csl-tasks` command prints the full list grouped by status (`── In Progress ──` etc.), skipping empty groups, plus an active/total summary line.
- T5 ✓ Headless guarded by `ctx.hasUI`; no widget, no writes, no side effects.
- T6 ✓ Loads under pi's jiti (`LOAD OK — default export: function`, factory `cslTaskOverlay`). Auto-discovered via existing `package.json` `pi.extensions: ["./pi/extensions"]` — no settings.json change.
- T7 ✓ `session_start` starts one unreferenced 5-second timer after clearing any prior timer; each tick invalidates Target progress before repainting, and `session_shutdown` clears it. `npm run test:pi` passed all 6 tests, including deterministic external-file refresh, duplicate-start cleanup, and shutdown cleanup coverage.

Self-check (pure logic, no pi types) passed: parses 165 real `tasks/todo.md` rows, maps legacy Chinese (`已完成`→completed, `未标注`→unknown), overflow caps at 12 rows with a `+N more (X completed, Y pending)` summary.

No `workspace-manage-task` contract change: extension is read-only, no session id written to task files (resolution per the agreed plan A: matching by `ctx.cwd`).

## Review

_Review gate: Skipped — the change remains a read-only UI lifecycle update with deterministic timer cadence, refresh, and cleanup coverage; focused self-check and all Pi tests passed._
