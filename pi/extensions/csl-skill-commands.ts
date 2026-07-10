import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface SkillCommand {
	name: string;
	description: string;
}

const baseDir = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(baseDir, "..", "..", "skills");

export default function (pi: ExtensionAPI) {
	for (const skill of discoverSkills(skillsDir)) {
		pi.registerCommand(skill.name, {
			description: `${skill.description} Alias for /skill:${skill.name}.`,
			handler: async (args, ctx) => {
				if (!ctx.isIdle()) {
					ctx.ui.notify(
						`Agent is busy. Queued /${skill.name} as a follow-up.`,
						"info",
					);
					pi.sendUserMessage(buildSkillRequest(skill.name, args), {
						deliverAs: "followUp",
					});
					return;
				}

				pi.sendUserMessage(buildSkillRequest(skill.name, args));
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
		.map((entry) => {
			const skillDir = join(root, entry);
			const skillFile = join(skillDir, "SKILL.md");
			if (!statSync(skillDir).isDirectory() || !existsSync(skillFile)) return undefined;

			const frontmatter = readFrontmatter(skillFile);
			if (!frontmatter?.description) {
				console.warn(`[csl-skill-commands] Missing description in ${skillFile}; skipping /${entry}.`);
				return undefined;
			}

			if (frontmatter.name && frontmatter.name !== entry) {
				console.warn(
					`[csl-skill-commands] Skill frontmatter name "${frontmatter.name}" does not match folder "${entry}"; using folder name.`,
				);
			}

			return {
				name: entry,
				description: frontmatter.description,
			};
		})
		.filter((skill): skill is SkillCommand => skill !== undefined)
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

function buildSkillRequest(skillName: string, args: string): string {
	const request = args.trim();
	const userRequest = request.length > 0 ? request : "Run this skill with no additional arguments.";

	return [
		`Use the ${skillName} skill for this request.`,
		"Load the skill's SKILL.md before acting and follow its instructions.",
		`User request: ${userRequest}`,
	].join("\n");
}
