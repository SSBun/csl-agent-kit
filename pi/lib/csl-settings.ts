import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export interface ReviewSettings {
	model?: string;
	thinking?: ThinkingLevel;
}
interface SettingsDocument extends Record<string, unknown> {
	review?: Record<string, unknown>;
}

export function settingsPath(): string {
	return join(process.env.CSL_AGENT_KIT_HOME || join(homedir(), ".csl-agent-kit"), "settings.json");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readDocument(path: string): SettingsDocument {
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
		throw error;
	}
	const value: unknown = JSON.parse(raw);
	if (!isRecord(value) || (value.review !== undefined && !isRecord(value.review))) {
		throw new Error(`Invalid CSL settings document: ${path}`);
	}
	return value as SettingsDocument;
}

function parseReview(value: Record<string, unknown> = {}): ReviewSettings {
	const result: ReviewSettings = {};
	if (value.model !== undefined && value.model !== null && value.model !== "") {
		if (typeof value.model !== "string" || !/^[^\s/:]+\/[^\s]+$/.test(value.model)
			|| /:(off|minimal|low|medium|high|xhigh|max)$/.test(value.model)) {
			throw new Error("review.model must be a provider/model ID without a thinking suffix");
		}
		result.model = value.model;
	}
	if (value.thinking !== undefined && value.thinking !== null && value.thinking !== "") {
		if (!THINKING_LEVELS.includes(value.thinking as ThinkingLevel)) {
			throw new Error("Invalid review.thinking level");
		}
		result.thinking = value.thinking as ThinkingLevel;
	}
	return result;
}

export function loadReviewSettings(path = settingsPath()): ReviewSettings {
	return parseReview(readDocument(path).review);
}

export function saveReviewSettings(settings: ReviewSettings, path = settingsPath()): void {
	const review = parseReview({ ...settings });
	// Re-read at save time: preserve unrelated settings added while the panel was open.
	const document = readDocument(path);
	const next = { ...document.review };
	delete next.model;
	delete next.thinking;
	Object.assign(next, review);
	if (Object.keys(next).length) document.review = next;
	else delete document.review;
	mkdirSync(dirname(path), { recursive: true });
	const temporary = `${path}.${randomUUID()}.tmp`;
	try {
		writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o600, flag: "wx" });
		renameSync(temporary, path);
	} finally {
		try { unlinkSync(temporary); } catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
		}
	}
}

export function resolveReviewSettings(
	settings: ReviewSettings,
	parent: { model?: { provider: string; id: string }; thinking: ThinkingLevel },
) {
	const model = settings.model || (parent.model && `${parent.model.provider}/${parent.model.id}`);
	if (!model) throw new Error("No parent model available; choose a review model in /csl-settings");
	const thinking = settings.thinking ?? parent.thinking;
	return {
		model,
		thinking,
		sources: { model: settings.model ? "configured" : "parent", thinking: settings.thinking ? "configured" : "parent" },
		// A model suffix is the public subagent launch override; top-level thinking is watchdog-only.
		launch: { model: `${model}:${thinking}` },
	};
}
