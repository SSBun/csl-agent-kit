"use strict";

// 隔离检查工具冲突反馈与Dashboard DOM绑定，不访问真实记忆或浏览器网络。
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), vm = require("node:vm");
const { createRequire } = require("node:module");
const store = require(path.resolve("bin/memory/store.js"));
const agentFile = path.resolve("bin/memory/agent.js"), localRequire = createRequire(agentFile);
const sandbox = { require: localRequire, module: { exports: {} }, __dirname: path.dirname(agentFile), Buffer, console, setTimeout, clearTimeout };
vm.runInNewContext(`${fs.readFileSync(agentFile, "utf8")}\nmodule.exports.inspectTools = tools;`, sandbox, { filename: agentFile });
const workspace = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "memory-conflict-inspect-")));
const options = { workspace, scope: "project" }, root = store.rootFor(options), effects = [], observations = [];
const date = new Date().toISOString().slice(0, 10);
const original = { title: "并发知识", summary: "隔离目录", body: `- [${date}] 原始知识。` };
const input = (hash, content) => ({ id: "topic", operation: "put", expected: { hash }, content });
const context = { event: { workspace, messages: [] }, writableScopes: ["project"], pendingWrites: new Map(), recordEffect: effect => effects.push(effect) };
const apply = sandbox.module.exports.inspectTools(context).find(tool => tool.name === "memory_apply");
const execute = async mutation => JSON.parse((await apply.execute("inspect", { scope: "project", mutation: JSON.stringify(mutation) })).content[0].text);
(async () => {
  try {
    const first = store.mutate(options, input(null, original));
    const concurrent = { ...original, body: `${original.body}\n- [${date}] 另一个Agent更新。` };
    const other = store.mutate(options, input(first.entry.hash, concurrent));
    const desired = { ...original, body: `${original.body}\n- [${date}] 本批更新。` };
    const conflict = await execute(input(first.entry.hash, desired));
    observations.push({ phase: "conflict", status: conflict.status, code: conflict.code, pending: context.pendingWrites.size, otherUpdatePreserved: store.get(root, "topic").body === concurrent.body, effects: effects.length });
    const merged = { ...original, body: `${concurrent.body}\n- [${date}] 本批更新。` };
    await execute(input(other.entry.hash, merged));
    observations.push({ phase: "reconcile", pending: context.pendingWrites.size, bothUpdatesPresent: store.get(root, "topic").body === merged.body, effects: effects.length });
    const latest = store.get(root, "topic");
    const locked = await store.withLock(root, () => execute(input(latest.hash, merged)));
    observations.push({ phase: "locked", status: locked.status, code: locked.code, pending: context.pendingWrites.size });
    await execute(input(latest.hash, merged));
    observations.push({ phase: "unlocked", pending: context.pendingWrites.size, index: store.inspectIndex(options).state });
  } finally { fs.rmSync(workspace, { recursive: true, force: true }); }
  class Element {
    constructor(tag) { this.tag = tag; this.textContent = ""; this.dataset = {}; this.children = []; this.options = []; this.handlers = {}; this.open = false; this.isConnected = true; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; this.options = children; }
    setAttribute() {}
    addEventListener(name, callback) { this.handlers[name] = callback; }
    showModal() { this.open = true; }
  }
  const elements = new Map(), requests = [];
  const get = id => { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); };
  const dashboardFile = path.resolve("bin/memory/web/dashboard.js");
  const source = fs.readFileSync(dashboardFile, "utf8").split('document.querySelectorAll("[data-route]").forEach(n => n.addEventListener')[0];
  const browser = {
    module: { exports: {} }, location: { hash: "#isolated-probe", search: "" }, sessionStorage: { setItem() {}, getItem() { return null; } }, history: { replaceState() {} },
    document: { hidden: false, getElementById: get, createElement: tag => new Element(tag) }, window: {}, URLSearchParams, AbortSignal,
    fetch: async route => { requests.push(route); return { ok: true, json: async () => ({ available: true, agent: 2, status: "running", attempt: 1, events: [{ at: "now", kind: "探针", text: "a2" }] }) }; },
  };
  vm.runInNewContext(`${source}\nmodule.exports = { renderStatus };`, browser, { filename: dashboardFile });
  browser.module.exports.renderStatus({ active: ["/workspace-a", "/workspace-b"], activeBatches: [{ id: "a1", workspace: "/workspace-a" }, { id: "a2", workspace: "/workspace-a" }, { id: "b1", workspace: "/workspace-b" }], maxAgentsPerWorkspace: 10, agents: [{ workspace: "/workspace-a", event: "a1", agent: 1, state: "running" }, { workspace: "/workspace-a", event: "a2", agent: 2, state: "running" }, { workspace: "/workspace-b", event: "b1", agent: 1, state: "running" }], counts: {}, started: new Date().toISOString(), pid: 0 });
  observations.push({ phase: "dashboard", activeAgentMetric: get("metric-active").textContent, workspaceMetric: get("overview-workspaces").textContent, processingRows: get("processing-agents").children.length, workspaceCounts: get("overview-agents").children.map(card => card.children[2].textContent) });
  await get("processing-agents").children[1].children[0].handlers.click();
  observations.push({ phase: "select-agent", request: requests.at(-1), liveState: get("agent-live-state").textContent, liveEvents: get("agent-live-events").textContent });
  console.log(JSON.stringify(observations, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
