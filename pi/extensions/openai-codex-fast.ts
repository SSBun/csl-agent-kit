import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const STATUS_KEY = "openai-codex-fast";
const FAST_SERVICE_TIER = "priority";
const CONFIG_PATH = join(getPiAgentDir(), "csl", "openai-codex-fast.json");

interface FastModeConfig {
	enabled?: boolean;
}

export default function openAICodexFast(pi: ExtensionAPI) {
	pi.registerFlag("fast", {
		description: "Enable and persist OpenAI Codex Fast Mode for eligible Codex models",
		type: "boolean",
		default: false,
	});

	let enabled = loadConfig();

	pi.on("session_start", async (_event, ctx) => {
		if (pi.getFlag("fast") === true) {
			enabled = true;
			saveConfig(enabled);
		} else {
			enabled = loadConfig();
		}

		updateDisplay(pi, ctx, enabled);
	});

	pi.on("model_select", async (_event, ctx) => {
		updateDisplay(pi, ctx, enabled);
	});

	pi.registerCommand("fast", {
		description: "Persistently control OpenAI Codex Fast Mode: /fast on|off|toggle|status",
		handler: async (args, ctx) => {
			const action = args.trim().toLowerCase() || "toggle";
			let changed = false;

			if (action === "on") {
				enabled = true;
				changed = true;
			} else if (action === "off") {
				enabled = false;
				changed = true;
			} else if (action === "toggle") {
				enabled = !enabled;
				changed = true;
			} else if (action !== "status") {
				ctx.ui.notify("Usage: /fast on|off|toggle|status", "warning");
				return;
			}

			if (changed) {
				saveConfig(enabled);
			}

			updateDisplay(pi, ctx, enabled);
			ctx.ui.notify(formatStatus(ctx, enabled), "info");
		},
	});

	pi.on("before_provider_request", (event, ctx) => {
		if (!enabled || !isEligibleCodexModel(ctx)) return;
		if (!isRecord(event.payload)) return;

		return {
			...event.payload,
			service_tier: FAST_SERVICE_TIER,
		};
	});
}

function isEligibleCodexModel(ctx: ExtensionContext): boolean {
	const provider = ctx.model?.provider;
	const modelId = ctx.model?.id;

	return provider === "openai-codex" && isFastModeModel(modelId);
}

function isFastModeModel(modelId: string | undefined): boolean {
	if (!modelId) return false;
	return /^gpt-5\.(4|5)(?:$|[-.])/.test(modelId);
}

function formatStatus(ctx: ExtensionContext, enabled: boolean): string {
	const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : "none";
	const eligibility = isEligibleCodexModel(ctx) ? "eligible" : "not eligible";
	return `OpenAI Codex Fast Mode: ${enabled ? "on" : "off"} (${eligibility}; model: ${model})`;
}

function updateDisplay(pi: ExtensionAPI, ctx: ExtensionContext, enabled: boolean): void {
	ctx.ui.setStatus(STATUS_KEY, ctx.mode === "tui" ? undefined : enabled ? "fast" : undefined);

	if (ctx.mode !== "tui") return;
	if (!enabled) {
		ctx.ui.setFooter(undefined);
		return;
	}

	ctx.ui.setFooter((tui, theme, footerData) => {
		const unsubscribe = footerData.onBranchChange(() => tui.requestRender());

		return {
			dispose: unsubscribe,
			invalidate() {},
			render(width: number): string[] {
				const entries = ctx.sessionManager.getEntries();
				let totalInput = 0;
				let totalOutput = 0;
				let totalCacheRead = 0;
				let totalCacheWrite = 0;
				let totalCost = 0;
				let latestCacheHitRate: number | undefined;

				for (const entry of entries) {
					if (entry.type !== "message" || entry.message.role !== "assistant") continue;
					const usage = entry.message.usage;
					totalInput += usage.input;
					totalOutput += usage.output;
					totalCacheRead += usage.cacheRead;
					totalCacheWrite += usage.cacheWrite;
					totalCost += usage.cost.total;

					const latestPromptTokens = usage.input + usage.cacheRead + usage.cacheWrite;
					latestCacheHitRate = latestPromptTokens > 0 ? (usage.cacheRead / latestPromptTokens) * 100 : undefined;
				}

				let cwd = compactHome(ctx.sessionManager.getCwd());
				const branch = footerData.getGitBranch();
				if (branch) cwd = `${cwd} (${branch})`;
				const sessionName = ctx.sessionManager.getSessionName();
				if (sessionName) cwd = `${cwd} • ${sessionName}`;

				const statsParts: string[] = [];
				if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
				if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
				if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
				if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);
				if ((totalCacheRead > 0 || totalCacheWrite > 0) && latestCacheHitRate !== undefined) {
					statsParts.push(`CH${latestCacheHitRate.toFixed(1)}%`);
				}
				if (totalCost || (ctx.model && ctx.modelRegistry.isUsingOAuth(ctx.model))) {
					const subscription = ctx.model && ctx.modelRegistry.isUsingOAuth(ctx.model) ? " (sub)" : "";
					statsParts.push(`$${totalCost.toFixed(3)}${subscription}`);
				}

				const contextUsage = ctx.getContextUsage();
				const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
				if (contextWindow) {
					const percent = contextUsage?.percent;
					const value = percent === null || percent === undefined ? "?" : percent.toFixed(1);
					statsParts.push(`${value}%/${formatTokens(contextWindow)} (auto)`);
				}

				const modelName = ctx.model?.id || "no-model";
				const thinking = piThinkingLevelLabel(pi, ctx);
				let rightSide = `${modelName}${thinking} • fast`;
				if (footerData.getAvailableProviderCount() > 1 && ctx.model) {
					const withProvider = `(${ctx.model.provider}) ${rightSide}`;
					if (visibleWidth(withProvider) < Math.floor(width / 2)) rightSide = withProvider;
				}

				const left = statsParts.join(" ");
				const statsLine = joinFooterSides(left, rightSide, width);
				const extraStatuses = Array.from(footerData.getExtensionStatuses().entries())
					.filter(([key]) => key !== STATUS_KEY)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([, text]) => sanitizeStatusText(text))
					.filter(Boolean)
					.join(" ");

				return [
					truncateToWidth(theme.fg("dim", cwd), width),
					theme.fg("dim", statsLine),
					...(extraStatuses ? [truncateToWidth(extraStatuses, width)] : []),
				];
			},
		};
	});
}

function piThinkingLevelLabel(pi: ExtensionAPI, ctx: ExtensionContext): string {
	if (!ctx.model?.reasoning) return "";
	const level = pi.getThinkingLevel();
	return level === "off" ? " • thinking off" : ` • ${level}`;
}

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

function joinFooterSides(left: string, right: string, width: number): string {
	const leftWidth = visibleWidth(left);
	const rightWidth = visibleWidth(right);
	const availableRightWidth = width - leftWidth - 2;
	const visibleRight = availableRightWidth > 0 ? truncateToWidth(right, availableRightWidth) : "";
	const padding = " ".repeat(Math.max(2, width - leftWidth - visibleWidth(visibleRight)));
	return truncateToWidth(`${left}${padding}${visibleRight}`, width);
}

function compactHome(path: string): string {
	const home = homedir();
	return path === home ? "~" : path.startsWith(`${home}/`) ? `~/${path.slice(home.length + 1)}` : path;
}

function sanitizeStatusText(text: string): string {
	return text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();
}

function visibleWidth(text: string): number {
	return stripAnsi(text).length;
}

function truncateToWidth(text: string, width: number): string {
	if (visibleWidth(text) <= width) return text;
	if (width <= 1) return "";
	return `${stripAnsi(text).slice(0, width - 1)}…`;
}

function stripAnsi(text: string): string {
	return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function loadConfig(): boolean {
	if (!existsSync(CONFIG_PATH)) return false;

	try {
		const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as FastModeConfig;
		return config.enabled === true;
	} catch {
		return false;
	}
}

function saveConfig(enabled: boolean): void {
	const tmpPath = `${CONFIG_PATH}.tmp`;
	mkdirSync(dirname(CONFIG_PATH), { recursive: true });
	writeFileSync(tmpPath, `${JSON.stringify({ enabled }, null, 2)}\n`, "utf8");
	renameSync(tmpPath, CONFIG_PATH);
}

function getPiAgentDir(): string {
	return process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
