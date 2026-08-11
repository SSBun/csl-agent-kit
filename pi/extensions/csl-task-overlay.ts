/**
 * csl-task-overlay — read-only Pi widget that surfaces workspace tasks.
 *
 * Renders a live panel above the editor from `<cwd>/tasks/tasks.md` so you can
 * see what the agent is working on, what is done, and what is queued. The task
 * index is the source of truth (see the `csl-task` skill); this
 * extension only reads and renders it — it never writes.
 *
 * Refresh triggers:
 *   - `session_start`: initial paint and start a five-second refresh timer.
 *   - `/csl-tasks` command: print the full list grouped by status.
 *   - `session_shutdown`: stop the refresh timer.
 *
 * Headless (`ctx.hasUI === false`): no widget, no side effects.
 *
 * Format parsed (per `csl-task`):
 *   `- [Title](tasks/slug.md) — Status (YYYY-MM-DD HH:MM)`
 * Status words (English canonical + legacy Chinese):
 *   Pending / In Progress / In Review / Completed / Blocked / Cancelled
 *   待办 / 进行中 / 审查中 / 已完成 / 未标注
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Container, Text, type TUI } from "@earendil-works/pi-tui";

const WIDGET_KEY = "csl-tasks";
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

/** Match `- [Title](path) — Status (...)`. Captures path for progress lookup. */
const INDEX_LINE = /^\s*-\s+\[(.+?)\]\(([^)]+)\)\s*[—-]\s*(.+?)\s*$/;

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
 * `## Target` section, which the `csl-task` contract defines as
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

/**
 * Render the widget body as a string array. Shows only the `RECENT_LIMIT`
 * newest tasks (tasks/tasks.md is newest-first), lazily reading each one's
 * Target checkbox progress from its task file.
 *
 * Layout:
 *   📋 Tasks (3/7)
 *   ├─ 🔄 Write the parser (2/5)
 *   ├─ ⏳ Add tests
 *   └─ ✅ Set up repo
 */
function renderRows(rows: TaskRow[], cwd: string): string[] {
	if (isEmpty(rows)) return [];

	const recent = rows.slice(0, RECENT_LIMIT).map((row) => ({
		...row,
		progress: loadProgress(cwd, row.path),
	}));
	const out: string[] = ["📋 Tasks"];

	// Order recent by status rank (active first), stable within each bucket.
	const rank: Record<Status, number> = {
		in_progress: 0,
		in_review: 1,
		pending: 2,
		blocked: 3,
		cancelled: 4,
		aborted: 5,
		completed: 6,
		unknown: 7,
	};
	const visible = [...recent]
		.map((row, i) => ({ row, i }))
		.sort((a, b) => rank[a.row.status] - rank[b.row.status] || a.i - b.i)
		.map((entry) => entry.row);

	visible.forEach((row, i) => {
		const prefix = i === visible.length - 1 ? "└─" : "├─";
		const tail = row.progress ? ` (${row.progress})` : "";
		out.push(`${prefix} ${GLYPH[row.status]}${tail} ${row.title}`);
	});

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
}

/**
 * Refresh the widget for `ctx`. TUI sessions register one custom component and
 * update it in place so Pi's insertion-ordered widget map keeps its position.
 */
function refresh(ctx: RefreshCtx, state: RefreshState): void {
	if (!ctx.hasUI) return;
	invalidateProgressCache(ctx.cwd);
	const rows = renderRows(loadTasks(ctx.cwd), ctx.cwd);

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

export default function cslTaskOverlay(pi: ExtensionAPI): void {
	let refreshTimer: ReturnType<typeof setInterval> | undefined;
	const refreshState: RefreshState = {};

	const stopRefreshTimer = () => {
		if (!refreshTimer) return;
		clearInterval(refreshTimer);
		refreshTimer = undefined;
	};

	pi.on("session_start", async (_event, ctx) => {
		stopRefreshTimer();
		refreshState.widget = undefined;
		if (!ctx.hasUI) return;

		const refreshCtx = ctx as RefreshCtx;
		refresh(refreshCtx, refreshState);
		refreshTimer = setInterval(() => refresh(refreshCtx, refreshState), REFRESH_INTERVAL_MS);
		refreshTimer.unref?.();
	});

	pi.on("session_shutdown", stopRefreshTimer);

	pi.registerCommand("csl-tasks", {
		description: "Print workspace tasks grouped by status (from tasks/tasks.md).",
		handler: async (_args, ctx) => {
			const rows = loadTasks(ctx.cwd);
			if (rows.length === 0) {
				ctx.ui.notify("No tasks in tasks/tasks.md.", "info");
				return;
			}
			const lines = formatGrouped(rows, ctx.cwd);
			ctx.ui.notify(lines.join("\n"), "info");
			// Also refresh the widget so the printed list and overlay stay in sync.
			refresh(ctx as RefreshCtx, refreshState);
		},
	});
}

/** Group rows by status for the `/csl-tasks` command output. */
function formatGrouped(rows: TaskRow[], cwd: string): string[] {
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
			out.push(`  ${GLYPH[status]}${tail} ${row.title}`);
		}
	}
	return out;
}

// ponytail: no test framework — one runnable self-check that fails if parsing
// or overflow drifts. Run with: node --import jiti pi/extensions/csl-task-overlay.ts --check
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
		console.log(`OK — parsed ${rows.length}, rendered ${rendered.length}; recent-capped render ${manyRendered.length}`);
	};
	check();
}
