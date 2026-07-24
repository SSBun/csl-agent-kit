import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

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

interface TriggerifyModule {
	runEvent(
		payload: object,
		options: { host: string; workspace: string },
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
const DESIGN_FETCH_TOOL = /mcp__.*figma.*(get_design_context|get_metadata|get_screenshot|get_figjam|get_variable_defs|get_libraries|search_design_system)|mcp__mastergo_magic_mcp.*(getDesignSections|getDsl|getD2c|getMeta|getDesignTexts|getDesignSvgs|extractSvg)/i;
const DESIGN_REMINDER = [
	"CSL Agent Kit reminder: Figma/MasterGo design data was fetched.",
	"Before implementing or summarizing the UI, use the figma-describe skill to produce a framework-agnostic description of layer hierarchy, layout, spacing, typography, colors, repeated components, and visual states.",
	"Skip this only when the user explicitly asks to bypass figma-describe for this turn.",
].join("\n");

const DEFAULT_SCRIPT_TIMEOUT = 10;
const MAX_OUTPUT = 64 * 1024;

function toolCategory(toolName: string): string | null {
	if (toolName === "bash") return "shell";
	if (["edit", "write", "apply_patch"].includes(toolName)) return "file";
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
	context: {
		prompt?: string;
		toolName?: string;
		toolCommand?: string;
		compactTrigger?: string;
	},
) {
	const toolName = context.toolName ?? null;
	const tool =
		event === "before-tool" || event === "after-tool"
			? {
					name: toolName,
					category: toolCategory(toolName),
					command: context.toolCommand ?? null,
					success: null,
				}
			: null;
	const prompt = event === "prompt-submit" || event === "session-start" ? (context.prompt ?? null) : null;
	const compact =
		event === "before-compact" || event === "after-compact" ? { trigger: context.compactTrigger ?? null } : null;
	return {
		schema: "triggerify.event/v1",
		event,
		host: { name: "pi", version: null },
		workspace: { root: workspace, trusted: null },
		session: { id: null },
		prompt,
		tool,
		permission: null,
		compact,
		subagent: null,
		stop: null,
		changed_files: null,
		native: { event: null, payload: {} },
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

	const refresh = () => {
		try {
			sops = candidateModule.loadSops();
		} catch {
			sops = [];
		}
	};

	const workspace = () => process.cwd();

	/**
	 * Run Triggerify for `event` and return the prompts to inject.
	 * Fail open: any runtime error yields no prompts (Pi keeps running).
	 */
	function triggerPrompts(
		event: string,
		context: { prompt?: string; toolName?: string; toolCommand?: string; compactTrigger?: string } = {},
	): TriggerPrompt[] {
		try {
			const payload = buildPayload(event, workspace(), context);
			const result = triggerify.runEvent(payload, { host: "pi", workspace: workspace() });
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
	function triggerScripts(
		event: string,
		context: { prompt?: string; toolName?: string; toolCommand?: string; compactTrigger?: string } = {},
	): void {
		try {
			const payload = buildPayload(event, workspace(), context);
			// runEvent already executes scripts; we call it purely for its
			// side effects here. Diagnostics are ignored on Pi.
			triggerify.runEvent(payload, { host: "pi", workspace: workspace() });
		} catch {
			// fail open
		}
	}

	pi.on("session_start", async () => {
		refresh();
	});

	pi.on("session_compact", async () => {
		refresh();
		// after-compact: side-effect scripts only
		triggerScripts("after-compact");
	});

	pi.on("before_agent_start", async (event) => {
		refresh();
		try {
			activeCandidates = candidateModule.findCandidates(event.prompt, sops);
		} catch {
			activeCandidates = [];
		}
		toolReminderShown = false;

		// session-start inject (session_start) + prompt-submit inject (when a
		// prompt is present, before_agent_start fires per turn).
		const sessionPrompts = triggerPrompts("session-start");
		const promptPrompts = event.prompt ? triggerPrompts("prompt-submit", { prompt: event.prompt }) : [];

		const triggerContext = formatTriggerContext([...sessionPrompts, ...promptPrompts], sops, activeCandidates);
		if (!triggerContext) return undefined;

		return {
			systemPrompt: `${event.systemPrompt}\n\n${triggerContext}`,
		};
	});

	pi.on("session_before_compact", async () => {
		// before-compact: side-effect scripts only (no inject channel)
		triggerScripts("before-compact");
		return undefined;
	});

	pi.on("tool_call", async (event, ctx) => {
		// before-tool: Pi has no inject channel into the in-flight tool call,
		// so only run-script side effects fire here.
		const input = (event as { input?: { command?: string } }).input;
		triggerScripts("before-tool", {
			toolName: event.toolName,
			toolCommand: input?.command,
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

	pi.on("tool_result", async (event) => {
		// after-tool inject: rewrite tool_result content with Triggerify prompts.
		const prompts = triggerPrompts("after-tool", {
			toolName: event.toolName,
			toolCommand: undefined,
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

	pi.on("agent_end", async () => {
		// stop: side-effect scripts only
		triggerScripts("stop");
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
