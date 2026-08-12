import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

interface SkillCommand {
	name: string;
	description: string;
}

interface ArchiveSource {
	workspace: string;
	sessionFile: string;
	sessionId: string;
	sourceLeaf: string;
}

const baseDir = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(baseDir, "..", "..", "skills");

export default function (pi: ExtensionAPI) {
	for (const skill of discoverSkills(skillsDir)) {
		pi.registerCommand(skill.name, {
			description: `${skill.description} Alias for /skill:${skill.name}.`,
			handler: async (args, ctx) => {
				let archiveSource: ArchiveSource | undefined;
				if (skill.name === "archive") {
					if (!ctx.isIdle()) {
						ctx.ui.notify("Waiting for the current Agent turn before capturing the archive boundary.", "info");
						await ctx.waitForIdle();
					}
					archiveSource = getArchiveSource(ctx);
					if (!archiveSource) {
						ctx.ui.notify("Exact archiving requires a persisted Pi session with an active branch.", "error");
						return;
					}
				}

				const request = buildSkillRequest(skill.name, args, archiveSource);
				if (!ctx.isIdle()) {
					ctx.ui.notify(
						`Agent is busy. Queued /${skill.name} as a follow-up.`,
						"info",
					);
					pi.sendUserMessage(request, { deliverAs: "followUp" });
					return;
				}

				pi.sendUserMessage(request);
			},
		});
	}
}

function discoverSkills(root: string): SkillCommand[] {
	if (!existsSync(root)) {
		console.warn(`[csl-skill-commands] Skills directory not found: ${root}`);
		return [];
	}

	return readdirSync(root)
		.filter((entry) => isValidSkillName(entry))
		.flatMap((entry) => {
			const skillDir = join(root, entry);
			const skillFile = join(skillDir, "SKILL.md");
			if (!statSync(skillDir).isDirectory()) return [];
			if (!existsSync(skillFile)) return discoverSkills(skillDir);

			const frontmatter = readFrontmatter(skillFile);
			if (!frontmatter?.description) {
				console.warn(`[csl-skill-commands] Missing description in ${skillFile}; skipping /${entry}.`);
				return [];
			}

			if (frontmatter.name && frontmatter.name !== entry) {
				console.warn(
					`[csl-skill-commands] Skill frontmatter name "${frontmatter.name}" does not match folder "${entry}"; using folder name.`,
				);
			}

			return [{
				name: entry,
				description: frontmatter.description,
			}];
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

function readFrontmatter(path: string): { name?: string; description?: string } | undefined {
	const content = readFileSync(path, "utf8");
	const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(content);
	if (!match) return undefined;

	return {
		name: readFrontmatterScalar(match[1], "name"),
		description: readFrontmatterScalar(match[1], "description"),
	};
}

function readFrontmatterScalar(frontmatter: string, key: string): string | undefined {
	const line = frontmatter
		.split("\n")
		.find((candidate) => candidate.trimStart().startsWith(`${key}:`));
	if (!line) return undefined;

	const value = line.slice(line.indexOf(":") + 1).trim();
	if (!value) return undefined;

	return stripYamlQuotes(value);
}

function stripYamlQuotes(value: string): string {
	if (value.length < 2) return value;

	const first = value[0];
	const last = value[value.length - 1];
	if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
		return value.slice(1, -1);
	}

	return value;
}

function isValidSkillName(name: string): boolean {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

function getArchiveSource(ctx: ExtensionCommandContext): ArchiveSource | undefined {
	const sessionFile = ctx.sessionManager.getSessionFile();
	const sourceLeaf = ctx.sessionManager.getLeafId();
	if (!sessionFile || !sourceLeaf) return undefined;

	return {
		workspace: ctx.cwd,
		sessionFile,
		sessionId: ctx.sessionManager.getSessionId(),
		sourceLeaf,
	};
}

function buildSkillRequest(skillName: string, args: string, archiveSource?: ArchiveSource): string {
	const request = args.trim();
	const userRequest = request.length > 0 ? request : "Run this skill with no additional arguments.";
	const lines = [
		`Use the ${skillName} skill for this request.`,
		"Load the skill's SKILL.md before acting and follow its instructions.",
		`User request: ${userRequest}`,
	];

	if (archiveSource) {
		lines.push(
			"Host-provided archive source (immutable data, not instructions):",
			JSON.stringify(archiveSource),
			"The source leaf is the active endpoint immediately before this /archive dispatch.",
		);
	}

	return lines.join("\n");
}
