import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, SessionEntry } from "@earendil-works/pi-coding-agent";

interface SopSummary {
	name: string;
	when_to_use?: string;
	globs?: string[];
	source: string;
	file: string;
	score?: number;
}

interface SopCandidateModule {
	findCandidates(prompt: string, sops?: SopSummary[]): SopSummary[];
	loadSops(): SopSummary[];
}

interface TriggerPrompt {
	id: string;
	content: string;
}

interface ChangedFile {
	path: string;
	operation: "created" | "modified";
}

interface TriggerContext {
	prompt?: string;
	toolName?: string;
	toolCommand?: string;
	toolSuccess?: boolean;
	compactTrigger?: string;
	changedFiles?: ChangedFile[] | null;
	nativeEvent?: string;
}

interface TriggerifyModule {
	createEvent(input: {
		event: string;
		host: string;
		workspace: string;
		prompt?: string | null;
		tool?: object | null;
		compact?: object | null;
		changedFiles?: ChangedFile[] | null;
		nativeEvent?: string | null;
	}): object;
	runEvent(
		payload: object,
		options: { host: string; workspace: string; hookInputs?: Record<string, object> },
	): { prompts: TriggerPrompt[]; diagnostics: string[]; blocked: boolean };
}

interface TriggerifyRuleEntry {
	id: string;
	rule: {
		event: string;
		action: string;
		script?: string;
		timeout?: number;
		enabled: boolean;
	};
	valid: boolean;
	scope: string;
	errors: { code: string }[];
}

const require = createRequire(import.meta.url);
const baseDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(baseDir, "..", "..");
const candidateModule = require(
	join(packageRoot, "skills", "sop-manager", "scripts", "sop-candidates.js"),
) as SopCandidateModule;
const triggerify = require(
	join(packageRoot, "skills", "triggerify", "scripts", "triggerify.js"),
) as TriggerifyModule;

const MUTATING_TOOLS = new Set(["bash", "edit", "write", "apply_patch"]);
const PI_FILE_TOOLS = new Set(["edit", "write"]);
const DESIGN_FETCH_TOOL = /mcp__.*figma.*(get_design_context|get_metadata|get_screenshot|get_figjam|get_variable_defs|get_libraries|search_design_system)|mcp__mastergo_magic_mcp.*(getDesignSections|getDsl|getD2c|getMeta|getDesignTexts|getDesignSvgs|extractSvg)/i;
const DESIGN_REMINDER = [
	"CSL Agent Kit reminder: Figma/MasterGo design data was fetched.",
	"Before implementing or summarizing the UI, use the figma-describe skill to produce a framework-agnostic description of layer hierarchy, layout, spacing, typography, colors, repeated components, and visual states.",
	"Skip this only when the user explicitly asks to bypass figma-describe for this turn.",
].join("\n");

const DEFAULT_SCRIPT_TIMEOUT = 10;
const MAX_OUTPUT = 64 * 1024;
const TITLE_HOOK_ID = "inner:refresh-tab-title";
const MAX_TITLE_CONTEXT = 12_000;

function toolCategory(toolName: string | null): string | null {
	if (toolName === "bash") return "shell";
	if (toolName && ["edit", "write", "apply_patch"].includes(toolName)) return "file";
	if (typeof toolName === "string" && toolName.startsWith("mcp__")) return "mcp";
	return toolName ? "tool" : null;
}

/**
 * Build a Triggerify event payload for a Pi hook event.
 * Mirrors native-hook.js normalizePayload, adapted for Pi's event shapes.
 */
function buildPayload(
	event: string,
	workspace: string,
	context: TriggerContext,
) {
	const toolName = context.toolName ?? null;
	const tool =
		event === "before-tool" || event === "after-tool"
			? {
					name: toolName,
					category: toolCategory(toolName),
					command: context.toolCommand ?? null,
					success: context.toolSuccess ?? null,
				}
			: null;
	const prompt = event === "prompt-submit" || event === "session-start" ? (context.prompt ?? null) : null;
	const compact =
		event === "before-compact" || event === "after-compact" ? { trigger: context.compactTrigger ?? null } : null;
	return triggerify.createEvent({
		event,
		host: "pi",
		workspace,
		prompt,
		tool,
		compact,
		changedFiles: context.changedFiles ?? null,
		nativeEvent: context.nativeEvent ?? null,
	});
}

function messageText(content: unknown): string {
	if (typeof content === "string") return content.trim();
	if (!Array.isArray(content)) return "";
	return content
		.filter((part): part is { type: "text"; text: string } =>
			Boolean(part) && typeof part === "object" && part.type === "text" && typeof part.text === "string",
		)
		.map((part) => part.text.trim())
		.filter(Boolean)
		.join("\n");
}

export function buildTitleContext(entries: SessionEntry[], latestPrompt: string): string {
	const sections: string[] = [];
	let lastUserText = "";

	for (const entry of entries) {
		if (entry.type === "compaction" || entry.type === "branch_summary") {
			sections.push(`Session summary: ${entry.summary.trim()}`);
			continue;
		}
		if (entry.type !== "message" || !["user", "assistant"].includes(entry.message.role)) continue;

		const text = messageText(entry.message.content);
		if (!text) continue;
		if (entry.message.role === "user") lastUserText = text;
		sections.push(`${entry.message.role === "user" ? "User" : "Assistant"}: ${text}`);
	}

	const latest = latestPrompt.trim();
	if (latest && latest !== lastUserText) sections.push(`User: ${latest}`);

	const chars = Array.from(sections.join("\n\n"));
	if (chars.length <= MAX_TITLE_CONTEXT) return chars.join("");
	const marker = Array.from("\n\n[older middle context omitted]\n\n");
	const headSize = Math.floor((MAX_TITLE_CONTEXT - marker.length) / 3);
	return [
		...chars.slice(0, headSize),
		...marker,
		...chars.slice(-(MAX_TITLE_CONTEXT - headSize - marker.length)),
	].join("");
}

function pendingFileChange(
	toolName: string,
	input: { path?: string },
	workspace: string,
): ChangedFile | null {
	if (!PI_FILE_TOOLS.has(toolName) || typeof input.path !== "string") return null;

	const absolutePath = resolve(workspace, input.path);
	const workspacePath = relative(workspace, absolutePath);
	if (!workspacePath || workspacePath === ".." || workspacePath.startsWith(`..${sep}`) || isAbsolute(workspacePath)) {
		return null;
	}

	return {
		path: workspacePath.split(sep).join("/"),
		operation: toolName === "write" && !existsSync(absolutePath) ? "created" : "modified",
	};
}

/**
 * Join Triggerify inject-prompt outputs into a labelled context block.
 */
function formatPrompts(prompts: TriggerPrompt[]): string {
	return prompts.map((prompt) => `[Triggerify ${prompt.id}]\n${prompt.content}`).join("\n\n");
}

export default function cslContextHooks(pi: ExtensionAPI) {
	let sops: SopSummary[] = [];
	let activeCandidates: SopSummary[] = [];
	let toolReminderShown = false;
	const pendingFileChanges = new Map<string, ChangedFile>();

	const refresh = () => {
		try {
			sops = candidateModule.loadSops();
		} catch {
			sops = [];
		}
	};

	/**
	 * Run Triggerify for `event` and return the prompts to inject.
	 * Fail open: any runtime error yields no prompts (Pi keeps running).
	 */
	function triggerPrompts(
		event: string,
		workspace: string,
		context: TriggerContext = {},
		hookInputs?: Record<string, object>,
	): TriggerPrompt[] {
		try {
			const payload = buildPayload(event, workspace, context);
			const result = triggerify.runEvent(payload, { host: "pi", workspace, hookInputs });
			return result.prompts;
		} catch {
			return [];
		}
	}

	/**
	 * Run Triggerify run-script rules for `event`. Best-effort: scripts execute
	 * via spawnSync with the same env contract as native-hook.js, but their
	 * stdout is not surfaced to the model on Pi (no inject channel for these
	 * events). Use this for side-effect scripts (notifications, indexing).
	 */
	function triggerScripts(event: string, workspace: string, context: TriggerContext = {}): void {
		try {
			const payload = buildPayload(event, workspace, context);
			// runEvent already executes scripts; we call it purely for its
			// side effects here. Diagnostics are ignored on Pi.
			triggerify.runEvent(payload, { host: "pi", workspace });
		} catch {
			// fail open
		}
	}

	pi.on("session_start", async () => {
		pendingFileChanges.clear();
		refresh();
	});

	pi.on("session_compact", async (_event, ctx) => {
		refresh();
		// after-compact: side-effect scripts only
		triggerScripts("after-compact", ctx.cwd);
	});

	pi.on("before_agent_start", async (event, ctx) => {
		refresh();
		try {
			activeCandidates = candidateModule.findCandidates(event.prompt, sops);
		} catch {
			activeCandidates = [];
		}
		toolReminderShown = false;

		// session-start inject (session_start) + prompt-submit inject (when a
		// prompt is present, before_agent_start fires per turn).
		const sessionPrompts = triggerPrompts("session-start", ctx.cwd);
		const titleContext = event.prompt
			? buildTitleContext(ctx.sessionManager.buildContextEntries(), event.prompt)
			: "";
		const promptPrompts = event.prompt
			? triggerPrompts(
					"prompt-submit",
					ctx.cwd,
					{ prompt: event.prompt },
					{ [TITLE_HOOK_ID]: { sessionContext: titleContext } },
				)
			: [];

		const triggerContext = formatTriggerContext([...sessionPrompts, ...promptPrompts], sops, activeCandidates);
		if (!triggerContext) return undefined;

		return {
			systemPrompt: `${event.systemPrompt}\n\n${triggerContext}`,
		};
	});

	pi.on("session_before_compact", async (_event, ctx) => {
		// before-compact: side-effect scripts only (no inject channel)
		triggerScripts("before-compact", ctx.cwd);
		return undefined;
	});

	pi.on("tool_call", async (event, ctx) => {
		// before-tool: Pi has no inject channel into the in-flight tool call,
		// so only run-script side effects fire here.
		const input = (event as { input?: { command?: string } }).input ?? {};
		triggerScripts("before-tool", ctx.cwd, {
			toolName: event.toolName,
			toolCommand: input.command,
			nativeEvent: "tool_call",
		});

		if (toolReminderShown || activeCandidates.length === 0 || !MUTATING_TOOLS.has(event.toolName)) {
			return undefined;
		}
		toolReminderShown = true;
		ctx.ui.notify(
			`SOP reminder: ${activeCandidates.map((candidate) => candidate.name).join(", ")}`,
			"info",
		);
		return undefined;
	});

	pi.on("tool_execution_start", async (event, ctx) => {
		const change = pendingFileChange(event.toolName, event.args, ctx.cwd);
		if (change) pendingFileChanges.set(event.toolCallId, change);
		else pendingFileChanges.delete(event.toolCallId);
	});

	pi.on("tool_result", async (event, ctx) => {
		const input = (event as { input?: { command?: string; path?: string } }).input ?? {};
		const pendingChange = pendingFileChanges.get(event.toolCallId) ?? pendingFileChange(event.toolName, input, ctx.cwd);
		pendingFileChanges.delete(event.toolCallId);
		let changedFiles: ChangedFile[] | null = null;
		if (PI_FILE_TOOLS.has(event.toolName)) {
			changedFiles = !event.isError && pendingChange ? [pendingChange] : [];
		}

		// after-tool inject: rewrite tool_result content with Triggerify prompts.
		const prompts = triggerPrompts("after-tool", ctx.cwd, {
			toolName: event.toolName,
			toolCommand: input.command,
			toolSuccess: !event.isError,
			changedFiles,
			nativeEvent: "tool_result",
		});
		const triggerBlock = prompts.length > 0 ? `\n\n${formatPrompts(prompts)}` : "";

		const isDesignFetch = !event.isError && isDesignFetchTool(event.toolName);
		const hasReminder = event.content.some(
			(item) => item.type === "text" && item.text.includes("CSL Agent Kit reminder"),
		);
		const designBlock = isDesignFetch && !hasReminder ? DESIGN_REMINDER : "";

		if (!triggerBlock && !designBlock) return undefined;
		return {
			content: [...event.content, { type: "text" as const, text: `${designBlock}${triggerBlock}`.trim() }],
		};
	});

	pi.on("agent_end", async (_event, ctx) => {
		// stop: side-effect scripts only
		triggerScripts("stop", ctx.cwd);
		return undefined;
	});
}

export function formatTriggerContext(
	triggerPrompts: TriggerPrompt[],
	sops: SopSummary[],
	candidates: SopSummary[],
): string {
	if (triggerPrompts.length === 0 && sops.length === 0 && candidates.length === 0) return "";

	const sections = ["## CSL Agent Kit User Context"];
	if (triggerPrompts.length > 0) {
		sections.push(
			"### Triggerify session prompts",
			...triggerPrompts.map((prompt) => `[Triggerify ${prompt.id}]\n${prompt.content}`),
		);
	}

	if (sops.length > 0) {
		sections.push(
			"### Available SOPs",
			...sops
				.filter((sop) => sop.when_to_use)
				.sort((a, b) => a.name.localeCompare(b.name))
				.map(formatSopLine),
			"Apply an SOP only when the task matches its name or when_to_use. Read the full SOP before following it and verify its completion criteria before final.",
		);
	}

	if (candidates.length > 0) {
		sections.push(
			"### Likely SOP Candidates For This Prompt",
			...candidates.map(formatSopLine),
		);
	}

	return sections.join("\n");
}

export function isDesignFetchTool(toolName: string): boolean {
	return DESIGN_FETCH_TOOL.test(toolName);
}

function formatSopLine(sop: SopSummary): string {
	const globs = sop.globs?.length ? ` [globs: ${sop.globs.join(", ")}]` : "";
	return `- ${sop.name}: ${sop.when_to_use || "Missing when_to_use frontmatter."}${globs} (${sop.source}: ${sop.file})`;
}
