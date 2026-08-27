import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

interface Preset {
	provider: string;
	model: string;
	thinkingLevel: ThinkingLevel;
}

const THINKING_LEVELS = new Set<ThinkingLevel>([
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max",
]);

export default function cslModelPresets(pi: ExtensionAPI) {
	let quickRun: { model: ExtensionContext["model"]; thinkingLevel: ThinkingLevel } | undefined;

	async function applyPreset(preset: Preset, ctx: ExtensionContext): Promise<boolean> {
		const model = ctx.modelRegistry.find(preset.provider, preset.model);
		if (!model) {
			ctx.ui.notify(`Model not found: ${preset.provider}/${preset.model}`, "error");
			return false;
		}
		if (!supportsThinkingLevel(model, preset.thinkingLevel)) {
			ctx.ui.notify(`${preset.provider}/${preset.model} does not support thinking:${preset.thinkingLevel}`, "error");
			return false;
		}
		if (!(await pi.setModel(model))) {
			ctx.ui.notify(`No credentials for ${preset.provider}/${preset.model}`, "error");
			return false;
		}

		pi.setThinkingLevel(preset.thinkingLevel);
		return true;
	}

	async function restoreQuickRun(ctx: ExtensionContext): Promise<void> {
		const previous = quickRun;
		quickRun = undefined;
		if (!previous) return;
		if (previous.model && !(await pi.setModel(previous.model))) {
			ctx.ui.notify("Quick task finished, but the previous model could not be restored.", "warning");
			return;
		}
		pi.setThinkingLevel(previous.thinkingLevel);
	}

	pi.registerCommand("preset", {
		description: "List presets or switch model and thinking level together",
		getArgumentCompletions: (prefix) => {
			try {
				const names = ["list", ...Object.keys(loadPresets())].filter((name) => name.startsWith(prefix));
				return names.length ? names.map((name) => ({ value: name, label: name })) : null;
			} catch {
				return null;
			}
		},
		handler: async (args, ctx) => {
			let presets: Record<string, Preset>;
			try {
				presets = loadPresets();
			} catch (error) {
				ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
				return;
			}

			let name = args.trim();
			if (!name) {
				if (!ctx.hasUI) {
					ctx.ui.notify(`Usage: /preset <list|${Object.keys(presets).join("|")}>`, "warning");
					return;
				}
				name = (await ctx.ui.select("Select model preset", Object.keys(presets))) ?? "";
				if (!name) return;
			}

			if (name === "list") {
				const list = Object.entries(presets)
					.map(([presetName, preset]) => `${presetName}: ${preset.provider}/${preset.model} · ${preset.thinkingLevel}`)
					.join("\n");
				ctx.ui.notify(list, "info");
				return;
			}

			const preset = presets[name];
			if (!preset) {
				ctx.ui.notify(`Unknown preset "${name}". Available: ${Object.keys(presets).join(", ")}`, "error");
				return;
			}

			if (await applyPreset(preset, ctx)) {
				ctx.ui.notify(`Preset "${name}": ${preset.provider}/${preset.model} · ${preset.thinkingLevel}`, "info");
			}
		},
	});

	pi.registerCommand("quick", {
		description: "Run one prompt with the quick model preset, then restore the current model",
		handler: async (args, ctx) => {
			const prompt = args.trim();
			if (!prompt) {
				ctx.ui.notify("Usage: /quick <prompt>", "warning");
				return;
			}
			if (!ctx.isIdle()) await ctx.waitForIdle();

			let preset: Preset | undefined;
			try {
				preset = loadPresets().quick;
			} catch (error) {
				ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
				return;
			}
			if (!preset) {
				ctx.ui.notify('Model preset "quick" is not defined.', "error");
				return;
			}

			const previous = { model: ctx.model, thinkingLevel: pi.getThinkingLevel() };
			if (!(await applyPreset(preset, ctx))) return;
			quickRun = previous;
			try {
				pi.sendUserMessage(prompt);
			} catch (error) {
				await restoreQuickRun(ctx);
				ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
			}
		},
	});

	pi.on("agent_settled", async (_event, ctx) => {
		await restoreQuickRun(ctx);
	});
}

function loadPresets(): Record<string, Preset> {
	const path = join(process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent"), "presets.json");
	let value: unknown;
	try {
		value = JSON.parse(readFileSync(path, "utf8"));
	} catch (error) {
		throw new Error(`Cannot load model presets from ${path}: ${error instanceof Error ? error.message : String(error)}`);
	}
	if (!isRecord(value) || Object.keys(value).length === 0) throw new Error(`No model presets defined in ${path}`);

	const presets: Record<string, Preset> = {};
	for (const [name, candidate] of Object.entries(value)) {
		if (
			!name.trim() ||
			!isRecord(candidate) ||
			typeof candidate.provider !== "string" ||
			!candidate.provider ||
			typeof candidate.model !== "string" ||
			!candidate.model ||
			typeof candidate.thinkingLevel !== "string" ||
			!THINKING_LEVELS.has(candidate.thinkingLevel as ThinkingLevel)
		) {
			throw new Error(`Invalid model preset "${name}" in ${path}`);
		}
		presets[name] = {
			provider: candidate.provider,
			model: candidate.model,
			thinkingLevel: candidate.thinkingLevel as ThinkingLevel,
		};
	}
	return presets;
}

function supportsThinkingLevel(
	model: { reasoning: boolean; thinkingLevelMap?: Partial<Record<ThinkingLevel, string | null>> },
	level: ThinkingLevel,
): boolean {
	if (!model.reasoning) return level === "off";
	const mapped = model.thinkingLevelMap?.[level];
	if (mapped === null) return false;
	if (level === "xhigh" || level === "max") return typeof mapped === "string";
	return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
