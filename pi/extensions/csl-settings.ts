import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
	loadReviewSettings, resolveReviewSettings, saveReviewSettings, settingsPath,
	THINKING_LEVELS, type ReviewSettings, type ThinkingLevel,
	resolveTaskMode, saveTaskMode, type TaskMode, type TaskModeScope,
} from "../lib/csl-settings.ts";

const INHERIT = "Inherit from parent";

function validateResolvedReview(settings: ReviewSettings, ctx: ExtensionContext, thinking: ThinkingLevel) {
	const resolved = resolveReviewSettings(settings, { model: ctx.model, thinking });
	const model = ctx.modelRegistry.getAvailable().find((item) => `${item.provider}/${item.id}` === resolved.model);
	if (!model) throw new Error(`Review model unavailable: ${resolved.model}. Check your login or /csl-settings.`);
	const level = resolved.thinking;
	const mapped = model.thinkingLevelMap?.[level];
	if ((!model.reasoning && level !== "off") || mapped === null
		|| ((level === "xhigh" || level === "max") && typeof mapped !== "string")) {
		throw new Error(`Review model ${resolved.model} does not support ${level}. Adjust /csl-settings; no automatic fallback is applied.`);
	}
	return resolved;
}

function taskModeOptions(ctx: ExtensionContext) {
	return { workspace: ctx.cwd, host: "pi", sessionId: ctx.sessionManager.getSessionId() };
}

export default function cslSettings(pi: ExtensionAPI) {
	pi.registerCommand("task-mode", {
		description: "Show task mode or set <session|project|global> <confirm|solo|inherit> (SOLO skips framework confirmations)",
		handler: async (args, ctx) => {
			try {
				const parts = args.trim().split(/\s+/).filter(Boolean);
				if (parts.length && !(parts.length === 1 && parts[0] === "show")) {
					if (parts.length !== 2) throw new Error("Usage: /task-mode [show | session|project|global confirm|solo|inherit]");
					saveTaskMode(parts[0] as TaskModeScope, parts[1] as TaskMode, taskModeOptions(ctx));
				}
				const state = resolveTaskMode(taskModeOptions(ctx));
				ctx.ui.notify(`Task mode: ${state.mode} (source: ${state.source}). Session: ${state.layers.session}; project: ${state.layers.project}; global: ${state.layers.global}. Applies on the next agent turn; host approvals and quality gates are unchanged.`, "info");
			} catch (error) {
				ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
			}
		},
	});

	pi.registerCommand("csl-settings", {
		description: "CSL Agent Kit settings",
		handler: async (_args, ctx) => {
			if (ctx.mode !== "tui") {
				ctx.ui.notify("/csl-settings requires Pi TUI. Saved settings still apply to non-interactive reviews.", "warning");
				return;
			}
			try {
				const path = settingsPath();
				for (;;) {
					const current = loadReviewSettings(path);
					const modelRow = `Review · Model: ${current.model ?? INHERIT}`;
					const thinkingRow = `Review · Thinking level: ${current.thinking ?? INHERIT}`;
					let modeLabel: string;
					try {
						const state = resolveTaskMode(taskModeOptions(ctx));
						modeLabel = `${state.mode} (${state.source})`;
					} catch { modeLabel = "Configuration error — use /task-mode to repair"; }
					const taskRow = `Task · Confirmation mode: ${modeLabel}`;
					const selected = await ctx.ui.select("CSL Agent Kit Settings (changes apply automatically)", [
						modelRow, thinkingRow, taskRow,
					]);
					if (!selected) return;
					if (selected === taskRow) {
						const scope = await ctx.ui.select("Task mode scope (session > project > global)", ["session", "project", "global"]);
						if (!scope) continue;
						const mode = await ctx.ui.select("Task mode: solo = SOLO (no framework confirmations; host approvals and quality gates remain)", ["inherit", "confirm", "solo"]);
						if (!mode) continue;
						try {
							saveTaskMode(scope as TaskModeScope, mode as TaskMode, taskModeOptions(ctx));
							const state = resolveTaskMode(taskModeOptions(ctx));
							ctx.ui.notify(`Task mode: ${state.mode} (source: ${state.source}); saved ${scope}: ${mode}. Applies on the next agent turn.`, "info");
						} catch (error) {
							ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
						}
						continue;
					}
					let value: string | undefined;
					let field: keyof ReviewSettings;
					if (selected === modelRow) {
						field = "model";
						const models = ctx.modelRegistry.getAvailable().map((model) => `${model.provider}/${model.id}`).sort();
						value = await ctx.ui.select("Review model", [INHERIT, ...models]);
					} else if (selected === thinkingRow) {
						field = "thinking";
						value = await ctx.ui.select("Review thinking level (off disables thinking)", [INHERIT, ...THINKING_LEVELS]);
					} else {
						continue;
					}
					if (value === undefined) continue;
					try {
						const next = loadReviewSettings(path);
						if (value === INHERIT) delete next[field];
						else if (field === "model") next.model = value;
						else next.thinking = value as ThinkingLevel;
						// Allow each override to be cleared even if the remaining combination is unavailable.
						// The read-only launch resolver still validates the final effective configuration.
						if (value !== INHERIT) validateResolvedReview(next, ctx, pi.getThinkingLevel());
						saveReviewSettings(next, path);
					} catch (error) {
						ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
					}
				}
			} catch (error) {
				ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
			}
		},
	});

	pi.registerTool({
		name: "csl_review_config",
		label: "CSL Review Config",
		description: "Resolve CSL Agent Kit review model and thinking from saved settings and the current parent session. Read-only; returns launch.model for the existing subagent tool, not a review or a child launch.",
		promptSnippet: "Resolve model and thinking overrides before launching a CSL reviewer.",
		promptGuidelines: [
			"Before launching a new CSL Agent Kit task-review or adversarial-review Reviewer on Pi, call csl_review_config and pass its exact launch.model to that reviewer's subagent launch. In workflowScript, put it on each Reviewer runs.run/runs.all child, not on the whole workflow (which would also override Editors). This applies to Reviewer roles even when using a differently named carrier.",
			"csl_review_config resolves each unset field from the current parent session, overriding carrier defaults such as reviewer thinking:high. Do not replace its result with a guessed model or a top-level subagent thinking parameter. Re-resolve after settings or parent model/thinking changes; a resumed existing child retains its original contract, so use a new child when changed configuration must apply.",
			"csl_review_config does not authorize delegation or replace readiness, fresh/read-only isolation, task alignment, or review gates. If resolution fails, stop before dispatch and report the error; do not silently use carrier defaults. Do not apply these overrides to Editors, other roles, or reviews outside CSL workflows.",
		],
		parameters: { type: "object", properties: {}, additionalProperties: false },
		async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
			const resolved = validateResolvedReview(loadReviewSettings(), ctx, pi.getThinkingLevel());
			return {
				content: [{ type: "text", text: JSON.stringify(resolved, null, 2) }],
				details: resolved,
			};
		},
	});
}
