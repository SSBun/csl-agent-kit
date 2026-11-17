"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const store = require("./store.js");
const recent = require("./recent.js");
const modelConfig = require("./model-config.js");
const migration = require("./migration.js");
const runtime = require("./runtime-files.js");
const live = require("./live.js");
const MAX_AGENTS_PER_WORKSPACE = 10;
const SKILL = path.resolve(__dirname, "../../skills/meta/agent-memory/SKILL.md");
const SYSTEM_PROMPT = fs.readFileSync(path.join(path.dirname(SKILL), "references/recording-prompt.md"), "utf8");

function optionsFor(event, scope) {
  if (!["user", "project"].includes(scope)) store.fail("INVALID_SCOPE", "Scope must be user or project");
  return { workspace: event.workspace, scope };
}
function tools(context) {
  return [{
    name: "memory_read", label: "Read current memory", description: "读取当前记忆及完整文件hash；不存在返回hash:null。无历史读取。",
    parameters: { type: "object", properties: { scope: { type: "string", enum: ["user", "project"] }, id: { type: "string" } }, required: ["scope", "id"], additionalProperties: false },
    execute: async (_id, { scope, id }) => {
      if (!context.event || context.signal?.aborted) store.fail("INTERRUPTED", "No active maintenance batch");
      return { content: [{ type: "text", text: JSON.stringify(store.get(store.rootFor(optionsFor(context.event, scope)), id)) }] };
    },
  }, {
    name: "memory_apply", label: "Memory mutation", description: "当前内容条件写入。mutation JSON只含id、operation、expected:{hash}，put另含content:{title,summary,body}。正文为带日期case，不含来源、类型或历史字段；删除永久移除文件。普通正文超过5000词仍保存完整更新，返回compaction.required；随后重新读取并压缩合并，保留知识、条件和未变日期。",
    parameters: { type: "object", properties: { scope: { type: "string", enum: ["user", "project"] }, mutation: { type: "string" } }, required: ["scope", "mutation"], additionalProperties: false },
    execute: async (_id, { scope, mutation }) => {
      if (!context.event || context.signal?.aborted) store.fail("INTERRUPTED", "No active maintenance batch");
      if (!context.writableScopes.includes(scope) || context.event.maintenance && scope !== context.event.maintenance.scope) store.fail("INVALID_SCOPE", "This scope is read-only for this batch");
      const input = JSON.parse(mutation);
      if (scope === "project" && input.id === "temp" && input.operation === "put") {
        const current = store.get(store.rootFor(optionsFor(context.event, scope)), "temp");
        const existing = new Set(recent.matches(current) ? recent.filter(current.body).split("\n") : []);
        const dates = new Set((context.event.maintenance ? [] : context.event.messages).map(message => recent.day(message.at)).filter(Boolean));
        for (const line of String(input.content?.body || "").split("\n").filter(line => line.trim())) {
          if (!existing.has(line) && !dates.has(/^- \[(\d{4}-\d{2}-\d{2})\]/.exec(line)?.[1])) store.fail("TEMP_SOURCE_DATE", "New temporary cases require a dated message from this batch; do not renew old context");
        }
      }
      let applied;
      try { applied = store.mutate(optionsFor(context.event, scope), input); }
      catch (error) {
        if (!["CONFLICT", "LOCKED"].includes(error.code)) throw error;
        context.pendingWrites.set(`${scope}:${input.id}`, { scope, id: input.id, code: error.code });
        return { content: [{ type: "text", text: JSON.stringify({ status: "retry_required", code: error.code, scope, id: input.id, instruction: "其他Agent或写入方可能已改变内容。重新读取完整文件和最新hash，合并本批更新后重写；不能重放旧正文或删除未知活动锁。" }) }] };
      }
      context.pendingWrites.delete(`${scope}:${input.id}`);
      context.recordEffect({ scope, id: input.id, operation: input.operation, hash: applied.entry.hash });
      return { content: [{ type: "text", text: JSON.stringify(applied) }] };
    },
  }];
}
async function createMemorySession(event, recordEffect = () => {}) {
  const sdk = await import("@earendil-works/pi-coding-agent");
  if (!sdk.ModelRuntime) store.fail("SDK_UNSUPPORTED", "Memory requires Pi SDK >=1.4.0");
  const selection = await modelConfig.resolveModel();
  const modelRuntime = await sdk.ModelRuntime.create({ allowModelNetwork: false });
  if (modelRuntime.getError()) store.fail("MODEL_CONFIG_ERROR", modelRuntime.getError());
  const model = modelRuntime.getModel(selection.provider, selection.model);
  if (!model) store.fail("MODEL_NOT_FOUND", `Memory model is not registered: ${selection.provider}/${selection.model}`);
  const roots = Object.fromEntries(["user", "project"].map(scope => [scope, store.rootFor(optionsFor(event, scope))]));
  const resourceLoader = {
    getExtensions: () => ({ extensions: [], errors: [], runtime: sdk.createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }), getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }), getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => `${SYSTEM_PROMPT}\n\nMemory roots: ${JSON.stringify(roots)}\n\n${fs.readFileSync(SKILL, "utf8")}`,
    getSystemPromptSource: () => undefined, getAppendSystemPrompt: () => [], getAppendSystemPromptSources: () => [],
    extendResources: () => {}, reload: async () => {},
  };
  const context = { event: null, recordEffect, signal: null, writableScopes: [], pendingWrites: new Map() };
  const created = await sdk.createAgentSession({
    cwd: event.workspace, model, modelRuntime, resourceLoader,
    sessionManager: sdk.SessionManager.inMemory(event.workspace),
    settingsManager: sdk.SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false } }),
    tools: ["read", "grep", "find", "ls", "memory_read", "memory_apply"], customTools: tools(context), thinkingLevel: "medium",
  });
  if (created.modelFallbackMessage || created.session.model?.id !== selection.model || created.session.model?.provider !== selection.provider) {
    created.session.dispose(); store.fail("MODEL_MISMATCH", "SDK selected a different model; no fallback allowed");
  }
  return { session: created.session, selection, context, roots, batches: 0, id: crypto.randomUUID(), created: new Date().toISOString(), utcDay: recent.window().today };
}
function createManager() {
  const workers = new Map(), runningEvents = new Set();
  const statePath = (workspace, slot) => `agents/${store.hash(workspace)}${slot ? `-${slot}` : ""}.json`;
  const persist = (workspace, slot, changes) => runtime.write(statePath(workspace, slot), { ...(runtime.read(statePath(workspace, slot)) || {}), schema: "csl-memory-agent/v1", workspace, agent: slot + 1, ...changes, updated: new Date().toISOString() });
  function discard(slot) { slot.worker?.session.dispose(); slot.worker = null; }
  async function run(event, { recordEffect = () => {}, recordModel = () => {}, signal } = {}) {
    const workspace = fs.realpathSync(event.workspace), eventKey = `${workspace}:${event.id}`;
    if (runningEvents.has(eventKey)) store.fail("AGENT_BUSY", "This batch is already running");
    const pool = workers.get(workspace) || [];
    let slot = pool.find(item => !item.busy);
    if (!slot) {
      if (pool.length >= MAX_AGENTS_PER_WORKSPACE) store.fail("AGENT_BUSY", "Workspace already has ten active Memory Agents");
      slot = { index: pool.length, busy: false, worker: null };
      pool.push(slot); workers.set(workspace, pool);
    }
    slot.busy = true; runningEvents.add(eventKey);
    let worker = slot.worker, timer, unsubscribe, timedOut = false;
    const failures = [], abort = () => { if (worker) void worker.session.abort(); };
    try {
      live.start({ ...event, workspace }, runtime.read(`jobs/${runtime.jobId(event.id)}.json`)?.attempts || 0, slot.index + 1);
      persist(workspace, slot.index, { state: "starting", event: event.id, error: null, compaction: [] });
      const writableScopes = migration.ensureWorkspace(workspace).filter(s => s.writable).map(s => s.scope);
      if (!writableScopes.length || event.maintenance && !writableScopes.includes(event.maintenance.scope)) store.fail("UPGRADE_REQUIRED", "This memory scope requires an explicitly authorized upgrade");
      if (signal?.aborted) store.fail("INTERRUPTED", "Batch cancelled before dispatch");
      const selection = await modelConfig.resolveModel();
      if (worker && (worker.selection.provider !== selection.provider || worker.selection.model !== selection.model || worker.batches >= 32 || worker.utcDay !== recent.window().today || Buffer.byteLength(JSON.stringify(worker.session.messages)) > 256 * 1024)) { discard(slot); worker = null; }
      if (!worker) { worker = await createMemorySession({ ...event, workspace }); slot.worker = worker; }
      if (signal?.aborted) store.fail("INTERRUPTED", "Batch cancelled during session creation");
      Object.assign(worker.context, { event: { ...event, workspace }, signal, writableScopes, recordEffect: effect => { recordEffect(effect); live.record(workspace, "记忆写入", effect, event.id); } });
      worker.context.pendingWrites.clear();
      recordModel(worker.selection); live.record(workspace, "模型", { provider: worker.selection.provider, model: worker.selection.model }, event.id);
      persist(workspace, slot.index, { state: "running", sessionId: worker.id, model: worker.selection, created: worker.created, event: event.id, batches: worker.batches, error: null });
      unsubscribe = worker.session.subscribe(item => {
        live.observe(workspace, item, event.id);
        if (item.type === "tool_execution_end" && item.isError) {
          const text = (item.result?.content || []).filter(b => b.type === "text").map(b => b.text).join(" ");
          failures.push(`${item.toolName}: ${text.replace(/\bBearer\s+\S+/gi, "Bearer [redacted]").replace(/\bsk-[A-Za-z0-9_-]+/g, "[redacted-key]").slice(0, 500)}`);
        }
      });
      signal?.addEventListener("abort", abort, { once: true });
      timer = setTimeout(() => { timedOut = true; void worker.session.abort(); }, 5 * 60 * 1000);
      const pendingCompaction = () => writableScopes.filter(scope => !event.maintenance || scope === event.maintenance.scope)
        .flatMap(scope => store.compactionStatus(worker.roots[scope], scope).map(entry => ({ scope, ...entry })));
      const prompt = async text => {
        await worker.session.prompt(text, { expandPromptTemplates: false });
        if (timedOut) store.fail("MODEL_TIMEOUT", "Five-minute deadline exceeded; inspect current files before retry");
        if (signal?.aborted) store.fail("INTERRUPTED", "Memory processing cancelled");
        const last = [...worker.session.messages].reverse().find(message => message.role === "assistant");
        if (!last || last.stopReason !== "stop") {
          const detail = String(last?.errorMessage || "provider returned no diagnostic").replace(/\bBearer\s+\S+/gi, "Bearer [redacted]").replace(/\bsk-[A-Za-z0-9_-]+/g, "[redacted-key]").slice(0, 2000);
          store.fail("MODEL_FAILED", `Memory run did not finish: ${detail}`);
        }
      };
      const instruction = event.maintenance ? "执行指定scope周期复查，不是用户发言；候选仅为起点，超项目容量需检查完整索引。" : "处理会话增量，同时核对相关旧记忆，不仅新增。";
      await prompt(`${instruction}旧格式scope只读，不要升级；修改前重新读取当前内容。此前效果仅作提示，无历史恢复。普通正文5000词是压缩触发阈值，不是拒绝更新的条件；先保存完整更新，再读取最新hash压缩合并，不截断或丢失有效知识、条件和未变日期。\n${JSON.stringify({ utcWindow: recent.window(), writableScopes, projectBudget: store.budgetStatus(worker.roots.project), compaction: pendingCompaction(), maintenance: event.maintenance || null, previousEffects: runtime.read(`jobs/${runtime.jobId(event.id)}.json`)?.effects || [], messages: event.messages })}`);
      if (worker.context.pendingWrites.size) {
        await prompt(`以下并发写入尚未完成。重新读取当前完整文件和最新hash，重新判断并合并本批知识后写入；不要覆盖其他Agent的更新，不删除未知活动锁。即使确认无需新增，也以最新hash保存核对后的完整内容以完成本次写入。\n${JSON.stringify([...worker.context.pendingWrites.values()])}`);
      }
      let compaction = pendingCompaction();
      if (compaction.length) {
        await prompt(`以下普通记忆已保存但仍超过${store.BUDGETS.bodyWords}词。现在重新读取完整内容和最新hash，合并重复内容、精炼表达并写回；保留有效知识、独有条件、否定、例外及未变case日期。项目temp不参与词数压缩。不要删除待压缩文件、截断正文或跨scope转移以绕限。无法保真压缩时保留完整已保存更新，明确报告待压缩，不宣称已达标。\n${JSON.stringify({ compaction, utcWindow: recent.window() })}`);
        compaction = pendingCompaction();
      }
      if (worker.context.pendingWrites.size) store.fail("MEMORY_WRITE_UNRESOLVED", "Concurrent memory updates still need rereading and reconciliation", [...worker.context.pendingWrites.values()]);
      if (failures.length) store.fail("TOOL_FAILED", `Tool failures: ${[...new Set(failures)].join("; ")}; inspect current files`);
      if (writableScopes.includes("project") && (!event.maintenance || event.maintenance.scope === "project")) {
        const budget = store.budgetStatus(worker.roots.project);
        if (budget.overCapacity) store.fail("MEMORY_BUDGET_UNRESOLVED", "Project still exceeds file capacity", budget);
      }
      worker.batches++; persist(workspace, slot.index, { state: "idle", event: null, batches: worker.batches, lastEvent: event.id, compaction });
      live.finish(workspace, "completed", compaction.length ? "更新已保存；仍有正文待压缩。" : "本批处理完成。", event.id);
      return { model: worker.selection, compaction, summary: worker.session.getLastAssistantText() || "请读取当前记忆。" };
    } catch (error) {
      live.finish(workspace, signal?.aborted ? "interrupted" : "failed", error.message, event.id);
      persist(workspace, slot.index, { state: signal?.aborted ? "interrupted" : "failed", event: event.id, error: `${error.code || "MEMORY_ERROR"}: ${error.message}` });
      discard(slot); throw error;
    } finally {
      slot.busy = false; runningEvents.delete(eventKey); clearTimeout(timer); unsubscribe?.(); signal?.removeEventListener("abort", abort);
      if (worker) {
        Object.assign(worker.context, { event: null, signal: null, recordEffect: () => {}, writableScopes: [] });
        worker.context.pendingWrites.clear();
      }
    }
  }
  function close() {
    live.clear();
    for (const [workspace, pool] of workers) for (const slot of pool) {
      discard(slot); persist(workspace, slot.index, { state: "stopped", event: null });
    }
    workers.clear();
  }
  return { run, close, inspect: live.get };
}
function states() { return runtime.names("agents").map(name => runtime.read(`agents/${name}`)); }
function reconcile() {
  for (const name of runtime.names("agents")) {
    const state = runtime.read(`agents/${name}`);
    runtime.write(`agents/${name}`, { ...state, state: ["running", "starting"].includes(state.state) ? "interrupted" : "stopped", updated: new Date().toISOString() });
  }
}
module.exports = { MAX_AGENTS_PER_WORKSPACE, createMemorySession, createManager, states, reconcile };
