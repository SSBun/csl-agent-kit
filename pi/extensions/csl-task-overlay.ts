/**
 * csl-task-overlay — Pi widget that surfaces workspace tasks.
 *
 * Renders a live panel above the editor from `<cwd>/tasks/tasks.md`. Task state
 * stays workspace-shared; a Pi custom entry stores only the current session's
 * focused task.
 *
 * Refresh triggers:
 *   - `session_start`: restore focus, paint, and start a five-second timer.
 *   - `session_tree`: restore focus after branch navigation.
 *   - `/tasks`: print the 20 most recent workspace tasks grouped by status.
 *   - `session_shutdown`: stop the refresh timer.
 *
 * Headless (`ctx.hasUI === false`): no widget is registered.
 *
 * Format parsed (per `task`):
 *   `- [Title](tasks/slug.md) — Status (YYYY-MM-DD HH:MM)`
 * Status words (English canonical + legacy Chinese):
 *   Pending / In Progress / In Review / Completed / Blocked / Cancelled
 *   待办 / 进行中 / 审查中 / 已完成 / 未标注
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Container, getCapabilities, hyperlink, Text, type TUI } from "@earendil-works/pi-tui";

const WIDGET_KEY = "csl-tasks";
const FOCUS_ENTRY_TYPE = "csl-task-focus";
const TASK_INDEX = join("tasks", "tasks.md");
const REFRESH_INTERVAL_MS = 5_000;

/** One parsed index entry. `progress` is filled lazily from the task file. */
interface TaskRow {
	title: string;
	status: Status;
	/** Index-relative path to the task file, e.g. `tasks/slug.md`. */
	path: string;
	/** Target step progress `done/total`, or undefined when the task has no Target. */
	progress?: string;
}

type Status = "pending" | "in_progress" | "in_review" | "completed" | "blocked" | "cancelled" | "aborted" | "unknown";

const STATUS_WORDS: Record<string, Status> = {
	// English canonical
	pending: "pending",
	"in progress": "in_progress",
	"in review": "in_review",
	completed: "completed",
	blocked: "blocked",
	cancelled: "cancelled",
	aborted: "aborted",
	deprecated: "aborted",
	// Legacy Chinese
	待办: "pending",
	进行中: "in_progress",
	审查中: "in_review",
	已完成: "completed",
	未标注: "unknown",
};

const GLYPH: Record<Status, string> = {
	pending: "⏳",
	in_progress: "🔄",
	in_review: "🔍",
	completed: "✅",
	blocked: "🚫",
	cancelled: "⏹️",
	aborted: "⛔",
	unknown: "❓",
};

/** How many recent tasks the widget shows. `tasks/tasks.md` is newest-first. */
const RECENT_LIMIT = 6;
/** How many recent tasks `/tasks` prints before grouping by status. */
const TASKS_COMMAND_LIMIT = 20;

/** Match `- [Title](path) — Status (...)`. Captures path for progress lookup. */
const INDEX_LINE = /^\s*-\s+\[(.+?)\]\(([^)]+)\)\s*[—-]\s*(.+?)\s*$/;
const CANONICAL_TASK_PATH = /^tasks\/([a-z0-9-]+)\.md$/;
const TASK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Parse a status tail like `In Progress (2026-07-25 11:30)` or `已完成（...）`
 * down to a canonical Status. Unknown tails resolve to `unknown`.
 */
function parseStatus(tail: string): Status {
	// Drop a trailing `(...)` or `（...）` timestamp, then trim.
	const head = tail.replace(/\s*[（(].*[)）]\s*$/, "").trim().toLowerCase();
	return STATUS_WORDS[head] ?? "unknown";
}

/**
 * Read and parse `<cwd>/tasks/tasks.md`. Returns [] when the file is missing or
 * unreadable — the overlay stays hidden. Synchronous and cheap: the index is a
 * flat list, not the task bodies. `path` is filled for later progress lookup.
 */
function loadTasks(cwd: string): TaskRow[] {
	let text: string;
	try {
		text = readFileSync(join(cwd, TASK_INDEX), "utf8");
	} catch {
		return [];
	}
	const rows: TaskRow[] = [];
	for (const line of text.split("\n")) {
		const match = INDEX_LINE.exec(line);
		if (!match) continue;
		rows.push({ title: match[1].trim(), path: match[2].trim(), status: parseStatus(match[3]) });
	}
	return rows;
}

/**
 * Per-cwd cache of `taskFilePath → progress string | undefined`.
 * Reading the Target section of every visible task file on each repaint would
 * be wasteful; cache the result and invalidate on task-file writes.
 */
const progressCache = new Map<string, string | undefined>();

/** Drop progress cache entries whose source file lives under `<cwd>/tasks/`. */
function invalidateProgressCache(cwd: string): void {
	const root = join(cwd, "tasks");
	for (const key of progressCache.keys()) {
		if (key.startsWith(root)) progressCache.delete(key);
	}
}

/**
 * Match a markdown checkbox line: `- [x] ...` or `- [ ] ...`. Used only inside a
 * `## Target` section, which the `task` contract defines as
 * the single checkbox list with stable IDs (T1, T2, ...).
 */
const CHECKBOX = /^\s*-\s+\[([ xX])\]/;

/**
 * Read `<cwd>/<indexRelativePath>` and count Target checkboxes. Returns
 * `"done/total"` when the task has a Target with at least one checkbox, else
 * undefined (no progress to show). The index path is relative to the project
 * root (`tasks/slug.md`), so resolve under `tasks/`.
 */
function loadProgress(cwd: string, indexPath: string): string | undefined {
	const abs = join(cwd, "tasks", indexPath);
	if (progressCache.has(abs)) return progressCache.get(abs);
	let result: string | undefined;
	try {
		const text = readFileSync(abs, "utf8");
		let inTarget = false;
		let done = 0;
		let total = 0;
		for (const line of text.split("\n")) {
			const heading = /^##\s+(.+?)\s*$/.exec(line);
			if (heading) {
				inTarget = heading[1].toLowerCase() === "target";
				continue;
			}
			if (!inTarget) continue;
			const cb = CHECKBOX.exec(line);
			if (!cb) continue;
			total++;
			if (cb[1].toLowerCase() === "x") done++;
		}
		if (total > 0) result = `${done}/${total}`;
	} catch {
		result = undefined;
	}
	progressCache.set(abs, result);
	return result;
}

/** True when the task list is considered empty (no rows at all). */
function isEmpty(rows: TaskRow[]): boolean {
	return rows.length === 0;
}

/**
 * Count active tasks for the heading ratio. Completed, Cancelled, aborted, and
 * unknown records are excluded so paused or abandoned history does not inflate
 * the "active" number.
 */
function countActive(rows: TaskRow[]): number {
	return rows.filter(
		(row) => !["completed", "cancelled", "unknown", "aborted"].includes(row.status),
	).length;
}

const STATUS_RANK: Record<Status, number> = {
	in_progress: 0,
	in_review: 1,
	pending: 2,
	blocked: 3,
	cancelled: 4,
	aborted: 5,
	completed: 6,
	unknown: 7,
};

function taskIdForRow(row: TaskRow): string | undefined {
	return CANONICAL_TASK_PATH.exec(row.path)?.[1];
}

function renderTaskTitle(row: TaskRow, cwd: string, linkTitles: boolean): string {
	return linkTitles && taskIdForRow(row)
		? hyperlink(row.title, pathToFileURL(join(cwd, "tasks", row.path)).href)
		: row.title;
}

/** Add progress, sort active-first, and format one tree section. */
function renderTaskLines(rows: TaskRow[], cwd: string, linkTitles: boolean): string[] {
	const visible = rows
		.map((row, index) => ({ row: { ...row, progress: loadProgress(cwd, row.path) }, index }))
		.sort((a, b) => STATUS_RANK[a.row.status] - STATUS_RANK[b.row.status] || a.index - b.index)
		.map((entry) => entry.row);

	return visible.map((row, index) => {
		const prefix = index === visible.length - 1 ? "└─" : "├─";
		const tail = row.progress ? ` (${row.progress})` : "";
		return `${prefix} ${GLYPH[row.status]}${tail} ${renderTaskTitle(row, cwd, linkTitles)}`;
	});
}

/**
 * Render at most `RECENT_LIMIT` tasks. With a valid session focus, reserve the
 * first section for it and fill the remaining slots from the newest workspace
 * tasks. A stale focus falls back to the normal shared list.
 */
function renderRows(rows: TaskRow[], cwd: string, linkTitles = false, focusedTaskId?: string): string[] {
	if (isEmpty(rows)) return [];

	const focused = focusedTaskId
		? rows.find((row) => taskIdForRow(row) === focusedTaskId)
		: undefined;
	if (!focused) {
		return ["📋 Tasks", ...renderTaskLines(rows.slice(0, RECENT_LIMIT), cwd, linkTitles)];
	}

	const workspace = rows
		.filter((row) => row !== focused)
		.slice(0, RECENT_LIMIT - 1);
	const out = ["📋 This Session", ...renderTaskLines([focused], cwd, linkTitles)];
	if (workspace.length > 0) {
		out.push("📁 Workspace", ...renderTaskLines(workspace, cwd, linkTitles));
	}
	return out;
}

class TaskWidget extends Container {
	private readonly requestRender: () => void;

	constructor(lines: string[], requestRender: () => void) {
		super();
		this.requestRender = requestRender;
		for (const line of lines) this.addChild(new Text(line, 1, 0));
	}

	setLines(lines: string[]): void {
		this.clear();
		for (const line of lines) this.addChild(new Text(line, 1, 0));
		this.requestRender();
	}
}

interface RefreshState {
	widget?: TaskWidget;
	focusedTaskId?: string;
}

/**
 * Refresh the widget for `ctx`. TUI sessions register one custom component and
 * update it in place so Pi's insertion-ordered widget map keeps its position.
 */
function refresh(ctx: RefreshCtx, state: RefreshState): void {
	if (!ctx.hasUI) return;
	invalidateProgressCache(ctx.cwd);
	const rows = renderRows(
		loadTasks(ctx.cwd),
		ctx.cwd,
		ctx.mode === "tui" && getCapabilities().hyperlinks,
		ctx.mode === "tui" ? state.focusedTaskId : undefined,
	);

	if (ctx.mode !== "tui") {
		ctx.ui.setWidget(WIDGET_KEY, rows.length > 0 ? rows : undefined, { placement: "aboveEditor" });
		return;
	}
	if (rows.length === 0) {
		state.widget = undefined;
		ctx.ui.setWidget(WIDGET_KEY, undefined, { placement: "aboveEditor" });
		return;
	}
	if (state.widget) {
		state.widget.setLines(rows);
		return;
	}
	ctx.ui.setWidget(
		WIDGET_KEY,
		(tui) => {
			const widget = new TaskWidget(rows, () => tui.requestRender());
			state.widget = widget;
			return widget;
		},
		{ placement: "aboveEditor" },
	);
}

// Re-declare the slice of ExtensionUIContext we use, to avoid importing the
// full type (keeps the file decoupled and the compile gate cheap).
interface ExtensionUIContext {
	setWidget(
		key: string,
		content: string[] | ((tui: TUI) => TaskWidget) | undefined,
		options?: { placement?: "aboveEditor" | "belowEditor" },
	): void;
	notify(message: string, type?: "info" | "warning" | "error"): void;
}

/** Minimal ctx shape refresh() needs. Matches ExtensionContext fields. */
interface RefreshCtx {
	ui: ExtensionUIContext;
	cwd: string;
	hasUI: boolean;
	mode: "tui" | "rpc" | "json" | "print";
}

interface FocusEntryData {
	taskId: string | null;
}

/** Read the latest focus entry on the active session branch. */
function restoreFocusedTask(entries: readonly unknown[]): string | undefined {
	for (let index = entries.length - 1; index >= 0; index--) {
		const entry = entries[index] as { type?: unknown; customType?: unknown; data?: unknown };
		if (entry.type !== "custom" || entry.customType !== FOCUS_ENTRY_TYPE) continue;
		const taskId = (entry.data as { taskId?: unknown } | undefined)?.taskId;
		return typeof taskId === "string" && TASK_ID.test(taskId) ? taskId : undefined;
	}
	return undefined;
}

export default function cslTaskOverlay(pi: ExtensionAPI): void {
	let refreshTimer: ReturnType<typeof setInterval> | undefined;
	const refreshState: RefreshState = {};

	const stopRefreshTimer = () => {
		if (!refreshTimer) return;
		clearInterval(refreshTimer);
		refreshTimer = undefined;
	};

	const setFocusedTask = (taskId: string | undefined, ctx: RefreshCtx) => {
		refreshState.focusedTaskId = taskId;
		pi.appendEntry<FocusEntryData>(FOCUS_ENTRY_TYPE, { taskId: taskId ?? null });
		refresh(ctx, refreshState);
	};

	pi.registerTool({
		name: "task_focus",
		label: "Task Focus",
		description: "Associate this Pi session with one canonical workspace task.",
		promptSnippet: "Focus this Pi session on a canonical task.",
		promptGuidelines: [
			"After task, task-plan, or task-queue creates, resumes, reopens, or activates a canonical task for this session, call task_focus with that task ID.",
		],
		parameters: {
			type: "object",
			required: ["taskId"],
			properties: {
				taskId: {
					type: "string",
					description: "Canonical task ID without the .md suffix",
					pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
				},
			},
		},
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const taskId = params.taskId.trim();
			if (!TASK_ID.test(taskId) || !loadTasks(ctx.cwd).some((row) => taskId === taskIdForRow(row))) {
				throw new Error(`Canonical task not found: ${taskId}`);
			}
			setFocusedTask(taskId, ctx as RefreshCtx);
			return {
				content: [{ type: "text", text: `Focused this session on task: ${taskId}` }],
				details: { taskId },
			};
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		stopRefreshTimer();
		refreshState.widget = undefined;
		refreshState.focusedTaskId = restoreFocusedTask(ctx.sessionManager.getBranch());
		if (!ctx.hasUI) return;

		const refreshCtx = ctx as RefreshCtx;
		refresh(refreshCtx, refreshState);
		refreshTimer = setInterval(() => refresh(refreshCtx, refreshState), REFRESH_INTERVAL_MS);
		refreshTimer.unref?.();
	});

	pi.on("session_tree", async (_event, ctx) => {
		refreshState.focusedTaskId = restoreFocusedTask(ctx.sessionManager.getBranch());
		refresh(ctx as RefreshCtx, refreshState);
	});

	pi.on("session_shutdown", stopRefreshTimer);

	pi.registerCommand("task-focus", {
		description: "Focus this session on a task ID, or clear the current focus.",
		handler: async (args, ctx) => {
			const taskId = args.trim();
			if (taskId === "clear") {
				setFocusedTask(undefined, ctx as RefreshCtx);
				ctx.ui.notify("Cleared this session's task focus.", "info");
				return;
			}
			if (!TASK_ID.test(taskId)) {
				ctx.ui.notify("Usage: /task-focus <task-id|clear>", "warning");
				return;
			}
			if (!loadTasks(ctx.cwd).some((row) => taskId === taskIdForRow(row))) {
				ctx.ui.notify(`Canonical task not found: ${taskId}`, "warning");
				return;
			}
			setFocusedTask(taskId, ctx as RefreshCtx);
			ctx.ui.notify(`Focused this session on task: ${taskId}`, "info");
		},
	});

	pi.registerCommand("tasks", {
		description: "Print the 20 most recent workspace tasks grouped by status.",
		handler: async (_args, ctx) => {
			const rows = loadTasks(ctx.cwd).slice(0, TASKS_COMMAND_LIMIT);
			if (rows.length === 0) {
				ctx.ui.notify("No tasks in tasks/tasks.md.", "info");
				return;
			}
			const lines = formatGrouped(rows, ctx.cwd, ctx.mode === "tui" && getCapabilities().hyperlinks);
			ctx.ui.notify(lines.join("\n"), "info");
			// Also refresh the widget so the printed list and overlay stay in sync.
			refresh(ctx as RefreshCtx, refreshState);
		},
	});
}

/** Group the already-limited rows for the `/tasks` command output. */
function formatGrouped(rows: TaskRow[], cwd: string, linkTitles = false): string[] {
	const groups: Record<Status, TaskRow[]> = {
		in_progress: [],
		in_review: [],
		pending: [],
		blocked: [],
		cancelled: [],
		aborted: [],
		completed: [],
		unknown: [],
	};
	for (const row of rows) groups[row.status].push(row);

	const out: string[] = [];
	const counts = `${countActive(rows)}/${rows.length} active · ${groups.completed.length} completed`;
	out.push(counts);

	const sectionTitle: Record<Status, string> = {
		in_progress: "In Progress",
		in_review: "In Review",
		pending: "Pending",
		blocked: "Blocked",
		cancelled: "Cancelled",
		aborted: "Aborted",
		completed: "Completed",
		unknown: "Untriaged",
	};
	const order: Status[] = ["in_progress", "in_review", "pending", "blocked", "cancelled", "aborted", "completed", "unknown"];
	for (const status of order) {
		const group = groups[status];
		if (group.length === 0) continue;
		out.push(`── ${sectionTitle[status]} ──`);
		for (const row of group) {
			const progress = loadProgress(cwd, row.path);
			const tail = progress ? ` (${progress})` : "";
			out.push(`  ${GLYPH[status]}${tail} ${renderTaskTitle(row, cwd, linkTitles)}`);
		}
	}
	return out;
}

// ponytail: no test framework — one runnable self-check that fails if parsing
// or overflow drifts. Run with: node pi/extensions/csl-task-overlay.ts --check
if (process.argv.includes("--check")) {
	const check = () => {
		const sample = [
			"- [Active task](tasks/a.md) — In Progress (2026-07-26 12:00)",
			"- [Done](tasks/b.md) — Completed (2026-07-25 10:00)",
			"- [Legacy](tasks/c.md) — 已完成（2026-07-21）",
			"- [Untriaged](tasks/d.md) — 未标注",
			"- not a task line",
			"",
		].join("\n");
		// Inline re-parse via the same regex to avoid exporting loadTasks.
		const rows: TaskRow[] = [];
		for (const line of sample.split("\n")) {
			const m = INDEX_LINE.exec(line);
			if (!m) continue;
			rows.push({ title: m[1].trim(), path: m[2].trim(), status: parseStatus(m[3]) });
		}
		const assert = (cond: boolean, msg: string) => {
			if (!cond) {
				console.error(`FAIL: ${msg}`);
				process.exit(1);
			}
		};
		assert(rows.length === 4, `expected 4 rows, got ${rows.length}`);
		assert(rows[0].status === "in_progress", `row0 status ${rows[0].status}`);
		assert(rows[1].status === "completed", `row1 status ${rows[1].status}`);
		assert(rows[2].status === "completed", `legacy 已完成 should map to completed, got ${rows[2].status}`);
		assert(rows[3].status === "unknown", `未标注 should map to unknown, got ${rows[3].status}`);
		// Aborted + deprecated alias.
		assert(parseStatus("Aborted (2026-07-26 16:30)") === "aborted", "Aborted should map to aborted");
		assert(parseStatus("Deprecated (2026-07-26 16:30)") === "aborted", "Deprecated should alias to aborted");
		const rendered = renderRows(rows, "/nonexistent-cwd");
		assert(rendered[0] === "📋 Tasks", `heading mismatch: ${rendered[0]}`);
		assert(rendered.length === 5, `expected heading + 4 rows, got ${rendered.length}`);
		// Recent limit: 30 tasks render heading + RECENT_LIMIT rows only.
		const many: TaskRow[] = Array.from({ length: 30 }, (_, i) => ({
			title: `t${i}`,
			path: `tasks/t${i}.md`,
			status: i < 5 ? ("in_progress" as Status) : ("completed" as Status),
		}));
		const manyRendered = renderRows(many, "/nonexistent-cwd");
		assert(manyRendered.length === RECENT_LIMIT + 1, `recent should cap at ${RECENT_LIMIT} rows + heading, got ${manyRendered.length}`);
		const commandRows = many.slice(0, TASKS_COMMAND_LIMIT);
		const commandRendered = formatGrouped(commandRows, "/nonexistent-cwd");
		assert(commandRendered.some((line) => line.includes("t19")), "task 20 should remain visible");
		assert(!commandRendered.some((line) => line.includes("t20")), "task 21 should be hidden");
		const linkedCommand = formatGrouped(commandRows, "/workspace root", true);
		const taskUrl = pathToFileURL(join("/workspace root", "tasks", "tasks/t0.md")).href;
		assert(linkedCommand.some((line) => line.includes(`\x1b]8;;${taskUrl}\x1b\\t0`)), "canonical title should link to its file URL");
		assert(!commandRendered.some((line) => line.includes("\x1b]8;;")), "plain fallback should not contain OSC 8");
		const nonCanonical = formatGrouped([{ title: "other", path: "other.md", status: "pending" }], "/workspace root", true);
		assert(!nonCanonical.some((line) => line.includes("\x1b]8;;")), "non-canonical title should remain plain");
		console.log(`OK — parsed ${rows.length}; widget ${manyRendered.length}; command capped at ${TASKS_COMMAND_LIMIT}; links verified`);
	};
	check();
}
