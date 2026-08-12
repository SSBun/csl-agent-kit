#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { positionals, values } = parseArgs({
	allowPositionals: true,
	options: {
		from: { type: "string" },
		leaf: { type: "string" },
		limit: { type: "string", default: "200" },
		selection: { type: "string" },
		session: { type: "string" },
		title: { type: "string" },
		to: { type: "string" },
		workspace: { type: "string" },
	},
});

try {
	const command = positionals[0];
	if (!command || !["list", "show", "save"].includes(command)) {
		throw new Error("Usage: archive-session.mjs <list|show|save> --session <file> [options]");
	}

	const source = loadSource(required("session"), values.leaf);
	if (command === "list") {
		const limit = Number.parseInt(values.limit, 10);
		if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("--limit must be a positive integer");
		printJson({
			sessionId: source.sessionId,
			leafId: source.leafId,
			messages: source.messages.slice(-limit).map(({ id, role, timestamp, text }) => ({
				id,
				role,
				timestamp,
				preview: preview(text),
			})),
		});
	} else {
		const selected = selectRange(source.messages, required("from"), required("to"));
		if (command === "show") {
			printJson({ messages: selected });
		} else {
			const output = saveArchive({
				workspace: required("workspace"),
				title: required("title"),
				selection: required("selection"),
				sessionId: source.sessionId,
				messages: selected,
			});
			printJson({ path: output, count: selected.length, from: selected[0].id, to: selected.at(-1).id });
		}
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}

function required(name) {
	const value = values[name];
	if (typeof value !== "string" || value.length === 0) throw new Error(`Missing --${name}`);
	return value;
}

function loadSource(path, requestedLeaf) {
	const entries = readFileSync(resolve(path), "utf8")
		.split("\n")
		.filter(Boolean)
		.map((line, index) => {
			try {
				return JSON.parse(line);
			} catch {
				throw new Error(`Invalid session JSON on line ${index + 1}`);
			}
		});
	const header = entries.find(({ type }) => type === "session");
	if (!header?.id) throw new Error("Session header is missing an id");

	const byId = new Map(entries.filter(({ id }) => id).map((entry) => [entry.id, entry]));
	const leafId = requestedLeaf || entries.findLast(({ id }) => id)?.id;
	if (!leafId || !byId.has(leafId)) throw new Error(`Session leaf not found: ${leafId || "<empty>"}`);

	const branch = [];
	const visited = new Set();
	for (let entry = byId.get(leafId); entry; entry = entry.parentId ? byId.get(entry.parentId) : undefined) {
		if (visited.has(entry.id)) throw new Error("Session branch contains a cycle");
		visited.add(entry.id);
		branch.push(entry);
	}
	branch.reverse();

	return {
		sessionId: header.id,
		leafId,
		messages: branch.flatMap(toVisibleMessage),
	};
}

function toVisibleMessage(entry) {
	if (entry.type !== "message") return [];
	const role = entry.message?.role;
	if (role !== "user" && role !== "assistant") return [];

	const content = entry.message.content;
	const text = typeof content === "string"
		? content
		: Array.isArray(content)
			? content.filter(({ type }) => type === "text").map(({ text: blockText }) => blockText).join("")
			: "";
	if (text.length === 0) return [];

	return [{ id: entry.id, role, timestamp: entry.timestamp, text }];
}

function selectRange(messages, from, to) {
	const start = messages.findIndex(({ id }) => id === from);
	const end = messages.findIndex(({ id }) => id === to);
	if (start === -1) throw new Error(`Visible start message not found: ${from}`);
	if (end === -1) throw new Error(`Visible end message not found: ${to}`);
	if (start > end) throw new Error("--from must precede --to on the active branch");
	return messages.slice(start, end + 1);
}

function saveArchive({ workspace, title, selection, sessionId, messages }) {
	const now = new Date();
	const outputDir = join(resolve(workspace), "tasks", "conversations");
	mkdirSync(outputDir, { recursive: true });
	const stem = `${localTimestamp(now)}-${slugify(title)}`;
	const output = uniquePath(outputDir, stem);
	const body = [
		`# ${title}`,
		"",
		"> 历史对话记录：仅供追溯，不是权威任务状态、决策或实现指导。",
		"",
		`- 归档时间：${formatLocalTime(now)}`,
		`- Session：${sessionId}`,
		`- 选择说明：${selection.replaceAll("\n", " ")}`,
		`- 消息范围：${messages[0].id}…${messages.at(-1).id}`,
		"",
		"## 对话",
		"",
		...messages.flatMap(({ role, text }) => [
			`### ${role === "user" ? "User" : "Agent"}`,
			"",
			text,
			"",
		]),
	].join("\n");
	writeFileSync(output, body, { encoding: "utf8", flag: "wx" });
	return output;
}

function uniquePath(directory, stem) {
	for (let suffix = 1; ; suffix += 1) {
		const name = suffix === 1 ? `${stem}.md` : `${stem}-${suffix}.md`;
		const candidate = join(directory, name);
		if (!existsSync(candidate)) return candidate;
	}
}

function preview(text) {
	const compact = text.replaceAll(/\s+/g, " ").trim();
	return compact.length <= 160 ? compact : `${compact.slice(0, 157)}...`;
}

function slugify(value) {
	const slug = value.normalize("NFKC")
		.toLowerCase()
		.replaceAll(/[^\p{Letter}\p{Number}]+/gu, "-")
		.replaceAll(/^-|-$/g, "")
		.slice(0, 60)
		.replace(/-$/u, "");
	return slug || "conversation";
}

function localTimestamp(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function formatLocalTime(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value) {
	return String(value).padStart(2, "0");
}

function printJson(value) {
	console.log(JSON.stringify(value, null, 2));
}
