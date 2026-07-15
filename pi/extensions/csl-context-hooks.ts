import { homedir } from "node:os";
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

interface Tip {
	text: string;
	keywords: string[];
}

interface SopCandidateModule {
	findCandidates(prompt: string, sops?: SopSummary[]): SopSummary[];
	loadSops(): SopSummary[];
}

interface TipsStoreModule {
	findCandidates(prompt: string, tips: Tip[]): Tip[];
	loadTips(tipsFile?: string): Tip[];
	resolveTipsFile(dataDir?: string): string;
}

const require = createRequire(import.meta.url);
const baseDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(baseDir, "..", "..");
const candidateModule = require(
	join(packageRoot, "skills", "sop-manager", "scripts", "sop-candidates.js"),
) as SopCandidateModule;
const tipsStore = require(
	join(packageRoot, "skills", "tips", "scripts", "tips-store.js"),
) as TipsStoreModule;

const MUTATING_TOOLS = new Set(["bash", "edit", "write", "apply_patch"]);
const DESIGN_FETCH_TOOL = /mcp__.*figma.*(get_design_context|get_metadata|get_screenshot|get_figjam|get_variable_defs|get_libraries|search_design_system)|mcp__mastergo_magic_mcp.*(getDesignSections|getDsl|getD2c|getMeta|getDesignTexts|getDesignSvgs|extractSvg)/i;
const DESIGN_REMINDER = [
	"CSL Agent Kit reminder: Figma/MasterGo design data was fetched.",
	"Before implementing or summarizing the UI, use the figma-describe skill to produce a framework-agnostic description of layer hierarchy, layout, spacing, typography, colors, repeated components, and visual states.",
	"Skip this only when the user explicitly asks to bypass figma-describe for this turn.",
].join("\n");

export default function cslContextHooks(pi: ExtensionAPI) {
	let tips: Tip[] = [];
	let sops: SopSummary[] = [];
	let activeCandidates: SopSummary[] = [];
	let toolReminderShown = false;

	const refresh = () => {
		try {
			tips = loadTips();
		} catch {
			tips = [];
		}
		try {
			sops = candidateModule.loadSops();
		} catch {
			sops = [];
		}
	};

	pi.on("session_start", async () => {
		refresh();
	});

	pi.on("session_compact", async () => {
		refresh();
	});

	pi.on("before_agent_start", async (event) => {
		refresh();
		const matchingTips = tipsStore.findCandidates(event.prompt, tips);
		try {
			activeCandidates = candidateModule.findCandidates(event.prompt, sops);
		} catch {
			activeCandidates = [];
		}
		toolReminderShown = false;

		const context = formatSystemContext(matchingTips, sops, activeCandidates);
		if (!context) return undefined;

		return {
			systemPrompt: `${event.systemPrompt}\n\n${context}`,
		};
	});

	pi.on("tool_call", async (event, ctx) => {
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
		if (event.isError || !isDesignFetchTool(event.toolName)) return undefined;
		if (event.content.some((item) => item.type === "text" && item.text.includes("CSL Agent Kit reminder"))) {
			return undefined;
		}

		return {
			content: [...event.content, { type: "text", text: DESIGN_REMINDER }],
		};
	});
}

export function loadTips(dataDir = getDataDir()): Tip[] {
	return tipsStore.loadTips(tipsStore.resolveTipsFile(dataDir));
}

export function formatSystemContext(
	tips: Tip[],
	sops: SopSummary[],
	candidates: SopSummary[],
): string {
	if (tips.length === 0 && sops.length === 0) return "";

	const sections = ["## CSL Agent Kit User Context"];
	if (tips.length > 0) {
		sections.push(
			"### Confirmed user instructions (follow unless higher-priority instructions conflict)",
			...tips.map((tip) => `- ${tip.text}`),
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

function getDataDir(): string {
	return process.env.CSL_AGENT_KIT_HOME || join(homedir(), ".csl-agent-kit");
}
