"use strict";

const crypto = require("node:crypto");
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS = new Set(["related", "requires", "supersedes"]);
const SCOPES = new Set(["user", "project"]);
const SCHEMA = "csl-memory-index/v3";
// Increment when emitted bytes or compilation semantics change.
const COMPILER_VERSION = 1;
const digest = value => crypto.createHash("sha256").update(value).digest("hex");
const characters = value => [...value].length;
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const markdown = value => value.replace(/[\\`*_[\]<>|]/g, "\\$&");

function fail(code, message, details) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function keys(value, allowed, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_RETRIEVAL", `${name} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail("INVALID_RETRIEVAL", `Unknown ${name} field: ${key}`);
}

function strings(value, name, length) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 64) fail("INVALID_RETRIEVAL", `${name} must contain at most 64 strings`);
  const result = value.map(item => {
    if (typeof item !== "string" || !item.trim() || /[\r\n\0]/.test(item) || characters(item) > length) fail("INVALID_RETRIEVAL", `Invalid ${name} value`);
    return item.trim().normalize("NFC");
  });
  if (new Set(result).size !== result.length) fail("INVALID_RETRIEVAL", `Duplicate ${name} values`);
  return result;
}

function validateRetrieval(value = {}, { scope, id } = {}) {
  keys(value, ["aliases", "situations", "topics", "links"], "retrieval");
  const aliases = strings(value.aliases, "aliases", 160);
  const situations = strings(value.situations, "situations", 400);
  const topics = strings(value.topics, "topics", 512).map(topic => {
    const parts = topic.split("/").map(part => part.trim());
    if (parts.length > 8 || parts.some(part => !part || part === "." || part === ".." || characters(part) > 80)) fail("INVALID_RETRIEVAL", "Topic must contain 1..8 nonempty semantic labels");
    return parts.join("/");
  });
  if (new Set(topics).size !== topics.length) fail("INVALID_RETRIEVAL", "Duplicate normalized topics");
  const links = value.links === undefined ? [] : value.links;
  if (!Array.isArray(links) || links.length > 128) fail("INVALID_RETRIEVAL", "links must contain at most 128 references");
  const seen = new Set();
  for (const link of links) {
    keys(link, ["kind", "scope", "id"], "link");
    if (!KINDS.has(link.kind) || !SCOPES.has(link.scope) || typeof link.id !== "string" || link.id.length > 100 || !ID.test(link.id)) fail("INVALID_RETRIEVAL", "Invalid typed chip reference");
    if (scope && link.kind === "supersedes" && link.scope !== scope) fail("INVALID_RETRIEVAL", "supersedes cannot cross scopes");
    if (scope === link.scope && id === link.id) fail("INVALID_RETRIEVAL", "A chip cannot reference itself");
    const key = JSON.stringify([link.kind, link.scope, link.id]);
    if (seen.has(key)) fail("INVALID_RETRIEVAL", "Duplicate chip reference");
    seen.add(key);
  }
  return { aliases, situations, topics, links: links.map(link => ({ kind: link.kind, scope: link.scope, id: link.id })) };
}

function compile({ entries, scope, budget = 4000 }) {
  if (!SCOPES.has(scope)) fail("INVALID_SCOPE", "Index compilation requires user or project scope");
  const active = entries.filter(entry => entry.exists).sort((a, b) => compare(a.id, b.id));
  const byId = new Map(active.map(entry => [entry.id, entry]));
  if (byId.size !== active.length) fail("INVALID_INDEX", "Duplicate active chip IDs");
  const retrieval = new Map(active.map(entry => [entry.id, validateRetrieval(entry.retrieval, { scope, id: entry.id })]));
  const generation = digest(JSON.stringify([SCHEMA, COMPILER_VERSION, budget, scope, entries.map(entry => [entry.id, entry.hash]).sort((a, b) => compare(a[0], b[0]))]));
  const base = `.indexes/${generation}`;
  const reverse = new Map();
  const diagnostics = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    const stack = [{ id, leave: false }];
    while (stack.length) {
      const next = stack.pop();
      if (next.leave) { visiting.delete(next.id); visited.add(next.id); continue; }
      if (visited.has(next.id)) continue;
      if (visiting.has(next.id)) fail("RELATION_CYCLE", "supersedes relationships must be acyclic", { id: next.id });
      visiting.add(next.id);
      stack.push({ id: next.id, leave: true });
      for (const link of retrieval.get(next.id).links) if (link.kind === "supersedes" && byId.has(link.id)) stack.push({ id: link.id, leave: false });
    }
  }
  for (const entry of active) {
    visit(entry.id);
    for (const link of retrieval.get(entry.id).links) {
      if (link.scope !== scope) {
        diagnostics.push({ id: entry.id, kind: link.kind, target: link, state: "cross-scope-recheck" });
      } else if (!byId.has(link.id)) {
        diagnostics.push({ id: entry.id, kind: link.kind, target: link, state: "missing-or-deleted" });
      } else if (link.kind === "supersedes") {
        if (!reverse.has(link.id)) reverse.set(link.id, []);
        reverse.get(link.id).push(entry.id);
      }
    }
  }
  if (scope === "project") {
    const stats = { scope, count: active.length, missingReferences: diagnostics.filter(item => item.state === "missing-or-deleted").length, crossScopeReferences: diagnostics.filter(item => item.state === "cross-scope-recheck").length };
    const fields = { ...stats, layout: "single", entries: "entries" };
    const header = `---\nschema: ${SCHEMA}\ngeneration: ${digest(`single-project/v1:${generation}`)}\n${Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n\n`;
    const lines = [header, "# 项目记忆索引", "", "本文件列出全部有效 chips 的摘要与正文链接，不生成卡片或主题索引文件。", "", "先读索引定位，再读正文核对条件、来源和 requires；线索不足时搜索 entries/ 中的正文与 retrieval。采信前重读 generation、检查 .pending.json、再重读 generation；变化时刷新候选和反向 supersedes。未解决的缺失引用或截断必须披露。", ""];
    for (const entry of active) {
      lines.push(`## [${markdown(entry.title)}](entries/${entry.id}.md)`, "", markdown(entry.summary), "", `id: ${entry.id}; revision: ${entry.revision}; sha256: ${entry.hash}`);
      if (reverse.has(entry.id)) lines.push(`完整替代者（须核对正文）：${reverse.get(entry.id).join(", ")}`);
      lines.push("");
    }
    return { generation: digest(`single-project/v1:${generation}`), stats, diagnostics, files: [{ file: "index.md", content: lines.join("\n") }] };
  }
  const topics = new Map();
  for (const entry of active) for (const topic of retrieval.get(entry.id).topics) {
    const parts = topic.split("/");
    for (let n = 1; n <= parts.length; n++) {
      const label = parts.slice(0, n).join("/");
      if (!topics.has(label)) topics.set(label, { label, id: digest(label), members: new Set() });
      topics.get(label).members.add(entry.id);
    }
  }
  const orderedTopics = [...topics.values()].sort((a, b) => compare(a.label, b.label));
  const topicIds = new Set(orderedTopics.map(topic => topic.id));
  if (topicIds.size !== orderedTopics.length) fail("TOPIC_COLLISION", "Topic identities collide");
  const childrenByTopic = new Map();
  for (const topic of orderedTopics) {
    const parent = topic.label.slice(0, topic.label.lastIndexOf("/"));
    if (!topic.label.includes("/")) continue;
    if (!childrenByTopic.has(parent)) childrenByTopic.set(parent, []);
    childrenByTopic.get(parent).push(topic);
  }
  const diagnosticsById = new Map();
  for (const diagnostic of diagnostics) {
    if (!diagnosticsById.has(diagnostic.id)) diagnosticsById.set(diagnostic.id, []);
    diagnosticsById.get(diagnostic.id).push(diagnostic);
  }
  const files = [];
  let basic = 0;
  const header = (schema, fields) => `---\nschema: ${schema}\ngeneration: ${generation}\n${Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n\n`;
  for (const entry of active) {
    const hints = retrieval.get(entry.id);
    const enhanced = hints.aliases.length || hints.situations.length;
    if (!enhanced) basic++;
    const lines = [header("csl-memory-card/v1", { scope, id: entry.id, revision: entry.revision, sourceHash: entry.hash, entrySchema: entry.schema, hints: enhanced ? "enhanced" : "basic" }), `# ${markdown(entry.title)}`, "", `覆盖摘要：${markdown(entry.summary)}`, `类型：${entry.type}`, "", `正文：[${entry.id}](../../../entries/${entry.id}.md)`, "", "发现线索不代替正文；采信前复查当前首页代际与pending，再核对条件、来源及关系。"];
    for (const [key, label] of [["aliases", "相关说法"], ["situations", "适用情境"], ["topics", "主题入口"]]) if (hints[key].length) lines.push("", `## ${label}`, ...hints[key].map(value => `- ${markdown(value)}`));
    if (hints.links.length) lines.push("", "## 关联知识", ...hints.links.map(link => `- ${link.kind}: ${link.scope}/${link.id}${link.scope === scope ? (byId.has(link.id) ? `；[候选卡片](${link.id}.md)` : "；目标缺失或已删除，不生成失效链接") : "；在另一作用域的当前卡片库核对"}`));
    if (reverse.has(entry.id)) lines.push("", "## 完整替代提示", "以下chip声明完整替代本条。必须读取替代者正文与依据，不凭更新时间判断：", ...reverse.get(entry.id).map(id => `- [${id}](${id}.md)`));
    const warnings = diagnosticsById.get(entry.id) || [];
    if (warnings.length) lines.push("", "## 关系核对状态", ...warnings.map(item => `- ${item.kind}: ${item.target.scope}/${item.target.id} — ${item.state}；未核对的requires不能忽略。`));
    files.push({ file: `${base}/cards/${entry.id}.md`, content: lines.join("\n") + "\n" });
  }
  for (const topic of orderedTopics) {
    const children = childrenByTopic.get(topic.label) || [];
    const lines = [header("csl-memory-topic/v1", { scope, title: topic.label, count: topic.members.size }), `# ${markdown(topic.label)}`, "", "主题不是完整检索范围；仍须搜索当前全卡片库。", "", ...children.map(child => `- 子主题：[${markdown(child.label)}](${child.id}.md)`), "", "## 相关卡片", ...[...topic.members].sort().map(id => { const entry = byId.get(id); return `- [${markdown(entry.title)}](../cards/${id}.md) — ${markdown(entry.summary)}`; })];
    files.push({ file: `${base}/topics/${topic.id}.md`, content: lines.join("\n") + "\n" });
  }
  files.push({ file: `${base}/topics.md`, content: header("csl-memory-topics/v1", { scope, count: topics.size }) + "# 完整主题目录\n\n分类不完整不影响卡片覆盖；可以搜索本目录或分段读取。\n\n" + orderedTopics.map(topic => `- [${markdown(topic.label)}](topics/${topic.id}.md) — ${topic.members.size}条`).join("\n") + "\n" });
  const stats = { scope, count: active.length, cardCount: active.length, basicCount: basic, unclassifiedCount: active.filter(entry => !retrieval.get(entry.id).topics.length).length, topicCount: topics.size, missingReferences: diagnostics.filter(item => item.state === "missing-or-deleted").length, crossScopeReferences: diagnostics.filter(item => item.state === "cross-scope-recheck").length };
  const overview = header(SCHEMA, { ...stats, cards: `${base}/cards`, topics: `${base}/topics.md`, manifest: `${base}/manifest.json` }) + `# 记忆总览\n\n这是导航，不是全部知识。完整卡片库覆盖全部${active.length}条有效chip，包括未分类及待增强记录。\n\n- 完整卡片目录：${base}/cards/\n- [完整主题目录](${base}/topics.md)\n- 权威正文目录：entries/\n\n使用普通grep/find显式搜索上述cards目录，隐藏目录默认扫描可能漏掉它；不要搜索全部历史代际。导航命中后仍搜索全库，决策前读正文、核对范围与关系。\n\n采信任何候选或报告未找到之前，重读首页generation并检查.pending.json；变化则刷新候选及反向替代关系，不能只核对旧正文hash。pending、断链、截断或必要依赖未核对时报告覆盖有限，不宣称不存在。\n`;
  const top = orderedTopics.filter(topic => !topic.label.includes("/")).map(topic => `- [${markdown(topic.label)}](${base}/topics/${topic.id}.md) — ${topic.members.size}条`).join("\n");
  const expanded = overview + "\n## 主题入口\n\n" + (top || "尚无主题；直接搜索完整卡片库。") + "\n";
  const content = characters(expanded) <= budget ? expanded : overview + "\n主题列表超出总览预算；请搜索完整主题目录，未丢弃主题或卡片。\n";
  if (characters(content) > budget) fail("INDEX_BUDGET", "Minimal overview exceeds its budget");
  files.unshift({ file: "index.md", content });
  const manifest = { schema: "csl-memory-manifest/v1", compilerVersion: COMPILER_VERSION, generation, ...stats, entries: active.map(entry => ({ id: entry.id, revision: entry.revision, hash: entry.hash, card: `cards/${entry.id}.md` })), diagnostics, files: files.map(file => ({ file: file.file, hash: digest(file.content) })) };
  files.push({ file: `${base}/manifest.json`, content: JSON.stringify(manifest, null, 2) + "\n" });
  return { generation, stats, diagnostics, files };
}

module.exports = { SCHEMA, validateRetrieval, compile };
