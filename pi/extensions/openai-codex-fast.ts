import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";

const STATUS_KEY = "openai-codex-fast";
const SERVICE_TIERS = { fast: "priority", ultrafast: "ultrafast" } as const;
type SpeedMode = "off" | keyof typeof SERVICE_TIERS;
const CONFIG_PATH = join(getPiAgentDir(), "csl", "openai-codex-fast.json");

export default function openAICodexFast(pi: ExtensionAPI) {
	pi.registerFlag("fast", {
		description: "Enable and persist OpenAI Codex Fast Mode for eligible Codex models",
		type: "boolean",
		default: false,
	});

	pi.registerFlag("ultrafast", {
		description: "Enable and persist OpenAI Codex Ultrafast Mode (higher usage)",
		type: "boolean",
		default: false,
	});

	let mode = loadConfig();

	pi.on("session_start", async (_event, ctx) => {
		const requestedMode = pi.getFlag("ultrafast") === true ? "ultrafast"
			: pi.getFlag("fast") === true ? "fast" : undefined;
		if (requestedMode) saveConfig(requestedMode);
		mode = requestedMode ?? loadConfig();
		updateDisplay(pi, ctx, mode);
	});

	pi.on("model_select", async (_event, ctx) => {
		updateDisplay(pi, ctx, mode);
	});

	pi.registerCommand("fast", {
		description: "Select Codex speed, or use /fast on|ultrafast|off|toggle|status",
		handler: async (args, ctx) => {
			let action = args.trim().toLowerCase();
			if (!action) {
				if (!ctx.hasUI) {
					ctx.ui.notify("Usage: /fast on|ultrafast|off|toggle|status", "warning");
					return;
				}
				const selected = await ctx.ui.select(`Codex speed (current: ${mode})`, ["ultrafast", "fast", "off"]);
				if (!selected) return;
				action = selected === "fast" ? "on" : selected;
			}
			let nextMode = mode;

			if (action === "on") {
				nextMode = "fast";
			} else if (action === "ultrafast") {
				nextMode = "ultrafast";
			} else if (action === "off") {
				nextMode = "off";
			} else if (action === "toggle") {
				nextMode = mode === "off" ? "fast" : "off";
			} else if (action !== "status") {
				ctx.ui.notify("Usage: /fast on|ultrafast|off|toggle|status", "warning");
				return;
			}

			if (action !== "status") {
				saveConfig(nextMode);
				mode = nextMode;
			}

			updateDisplay(pi, ctx, mode);
			ctx.ui.notify(formatStatus(ctx, mode), "info");
		},
	});

	pi.on("before_provider_request", (event, ctx) => {
		if (mode === "off" || !isEligibleCodexModel(ctx, mode)) return;
		if (!isRecord(event.payload)) return;

		return {
			...event.payload,
			service_tier: SERVICE_TIERS[mode],
		};
	});
}

function isEligibleCodexModel(ctx: ExtensionContext, mode: SpeedMode): boolean {
	if (ctx.model?.provider !== "openai-codex" || mode === "off") return false;
	const modelId = ctx.model.id;
	if (mode === "ultrafast") return modelId === "gpt-6-astra" || modelId === "gpt-6.1-sol";
	return /^gpt-5\.(4|5)(?:$|[-.])/.test(modelId) || isCurrentFastModel(modelId);
}

function isCurrentFastModel(modelId: string): boolean {
	return ["gpt-5.6", "gpt-6-astra", "gpt-6-sol", "gpt-6-luna", "gpt-6.1-sol", "gpt-6.1-terra"].includes(modelId);
}

function speedLabel(ctx: ExtensionContext, mode: SpeedMode): string {
	if (mode === "off") return "off (no tier override)";
	if (!isEligibleCodexModel(ctx, mode)) return `${mode} inactive (unsupported model; quota n/a)`;
	if (!ctx.model || !ctx.modelRegistry.isUsingOAuth(ctx.model)) return `${mode} requested (usage ?x; API billing)`;
	// Published Codex rates, not measured token counts or account entitlement.
	// https://learn.chatgpt.com/docs/agent-configuration/speed
	const quota = mode === "ultrafast" ? "quota 8x / credits 6x"
		: isCurrentFastModel(ctx.model.id) ? "quota 2.5x / credits 2x" : "quota ?x / credits ?x";
	return `${mode} requested (${quota})`;
}

function formatStatus(ctx: ExtensionContext, mode: SpeedMode): string {
	const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : "none";
	return `OpenAI Codex speed: ${speedLabel(ctx, mode)}; model: ${model}`;
}

function updateDisplay(pi: ExtensionAPI, ctx: ExtensionContext, mode: SpeedMode): void {
	ctx.ui.setStatus(STATUS_KEY, ctx.mode === "tui" || mode === "off" ? undefined : speedLabel(ctx, mode));

	if (ctx.mode !== "tui") return;
	if (mode === "off") {
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
				let rightSide = `${modelName}${thinking}`;
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
					truncateToWidth(theme.fg("dim", speedLabel(ctx, mode)), width),
					...(extraStatuses ? wrapTextWithAnsi(extraStatuses, width) : []),
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

function loadConfig(): SpeedMode {
	if (!existsSync(CONFIG_PATH)) return "off";

	try {
		const config: unknown = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
		if (!isRecord(config)) return "off";
		if (config.mode === "off" || config.mode === "fast" || config.mode === "ultrafast") return config.mode;
		if (config.mode === undefined && config.enabled === true) return "fast";
		return "off";
	} catch {
		return "off";
	}
}

function saveConfig(mode: SpeedMode): void {
	const tmpPath = `${CONFIG_PATH}.tmp`;
	mkdirSync(dirname(CONFIG_PATH), { recursive: true });
	writeFileSync(tmpPath, `${JSON.stringify({ mode }, null, 2)}\n`, "utf8");
	renameSync(tmpPath, CONFIG_PATH);
}

function getPiAgentDir(): string {
	return process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
