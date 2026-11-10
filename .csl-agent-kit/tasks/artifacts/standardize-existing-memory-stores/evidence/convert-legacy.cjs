"use strict";
// 本次授权转换的执行工具；仅在内存中构造替代正文，不保留正文副本。
const path = require("node:path");
const kit = "/Users/caishilin/Desktop/personal/skills";
const store = require(path.join(kit, "bin/memory/store.js"));
const migration = require(path.join(kit, "bin/memory/migration.js"));
const YAML = require(path.join(kit, "node_modules/yaml"));
const [workspace, action] = process.argv.slice(2);
if (!workspace || !["preview", "apply-updated-date"].includes(action)) throw new Error("需要工作区与preview/apply-updated-date参数");
const options = { scope: "project", workspace }, root = store.rootFor(options);
const rows = store.entries(root).filter(e => e.exists);
const prepared = [];
function convert(body, fallback) {
  const result = [];
  let pending = [];
  const flush = () => { if (pending.length) result.push(`- [${fallback}] ${pending.join("；")}`); pending = []; };
  for (const original of body.split(/\r?\n/)) {
    const line = original.trim();
    if (!line) { flush(); continue; }
    if (/^- \[\d{4}-\d{2}-\d{2}\] /.test(line)) { flush(); result.push(line); continue; }
    const headingDate = /^#+\s+(\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.+)$/.exec(line);
    if (headingDate) { flush(); result.push(`- [${headingDate[1]}] ${headingDate[2]}`); continue; }
    const heading = /^#+\s+(.+)$/.exec(line);
    if (heading && /^(Check|Trigger|Rule|Project Core|Purpose|Global Vocabulary|System Map|Global Invariants|Workflows)$/i.test(heading[1])) continue;
    if (/^- Keywords:/.test(line)) continue;
    pending.push((heading ? heading[1] : line.replace(/^-\s+/, "")).replace(/^Scope:/, "适用范围：").replace(/^Paths:/, "实现入口：").replace(/^Authority:/, "权威入口：").replace(/^Recheck:/, "复查条件："));
  }
  flush();
  return result.join("\n");
}
for (const entry of rows) {
  const content = { title: entry.title, summary: entry.summary, body: entry.body };
  try { store.validateContent(content, "project", true, entry.id); continue; }
  catch (error) { if (error.code !== "MEMORY_CASE_FORMAT") throw error; }
  const raw = store.readOptional(store.safePath(root, `entries/${entry.id}.md`));
  if (store.hash(raw) !== entry.hash) throw new Error("读取期间文件变化");
  const metadata = YAML.parse(/^---\n([\s\S]*?)\n---/.exec(raw)[1]);
  if (typeof metadata.updated !== "string" || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(metadata.updated)) throw new Error("没有可用的旧updated UTC时间");
  const date = new Date(metadata.updated);
  if (!Number.isFinite(date.getTime())) throw new Error("旧updated无效");
  content.body = convert(content.body, date.toISOString().slice(0, 10));
  store.validateContent(content, "project", true, entry.id);
  prepared.push({ id: entry.id, operation: "put", expected: { hash: entry.hash }, content });
}
if (action === "apply-updated-date") {
  migration.upgrade({ ...options, prepared });
  for (const before of rows) {
    const expected = prepared.find(p => p.id === before.id)?.content || before;
    const actual = store.get(root, before.id);
    for (const key of ["title", "summary", "body"]) if (actual[key] !== expected[key]) throw new Error("转换回读不一致");
  }
}
console.log(JSON.stringify({ workspace, active: rows.length, converted: prepared.length, action, state: store.inspectIndex(options).state }));
