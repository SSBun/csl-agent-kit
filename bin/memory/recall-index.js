"use strict";

const crypto = require("node:crypto");
const SCHEMA = "csl-memory-index/v4";
const markdown = value => value.replace(/[\\`*_[\]<>|]/g, "\\$&");

function compile({ entries, scope }) {
  if (!["user", "project"].includes(scope)) throw new Error("Index scope must be user or project");
  const active = entries.filter(entry => entry.exists).sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(active.map(e => e.id)).size !== active.length) throw new Error("Duplicate memory IDs");
  const generation = crypto.createHash("sha256").update(JSON.stringify([SCHEMA, scope, active.map(e => [e.id, e.hash])])).digest("hex");
  const lines = ["---", `schema: ${SCHEMA}`, "formatVersion: 5", `scope: ${scope}`, `generation: ${generation}`, `count: ${active.length}`, "entries: entries", "---", "", `# ${scope === "user" ? "用户" : "项目"}记忆索引`, "", "索引只描述当前知识。先定位主题，再读取正文及适用条件；覆盖不足时搜索全部当前正文。写入前重新读取文件hash；索引过期时以entries中的实际文件为准。", ""];
  for (const entry of active) lines.push(`## [${markdown(entry.title)}](entries/${entry.id}.md)`, "", markdown(entry.summary), "", `sha256: ${entry.hash}`, "");
  return { generation, stats: { scope, count: active.length }, files: [{ file: "index.md", content: lines.join("\n") }] };
}

module.exports = { SCHEMA, compile };
