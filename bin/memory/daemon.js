"use strict";

const fs = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const runtime = require("./runtime-files.js");
const queue = require("./queue.js");
const store = require("./store.js");
const agent = require("./agent.js");
const models = require("./model-config.js");
const maintenance = require("./maintenance.js");
const migration = require("./migration.js");
const endpoints = require("./endpoint.js");
const library = require("./library.js");
const webAssets = require("./web-assets.js");

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(body));
}

async function body(request) {
  if (request.headers["content-type"]?.split(";")[0] !== "application/json") store.fail("INVALID_CONTENT_TYPE", "JSON is required");
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 256 * 1024) store.fail("TOO_LARGE", "Request exceeds 256 KiB");
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) store.fail("INVALID_INPUT", "JSON object required");
  return value;
}

function optionsFrom(params) {
  const scope = params.scope || "project";
  if (scope === "project" && (typeof params.workspace !== "string" || !params.workspace.trim())) store.fail("WORKSPACE_REQUIRED", "Project memory operations require an explicit workspace");
  return { scope, workspace: params.workspace || process.cwd() };
}

async function main() {
  let release;
  try { release = runtime.acquire("daemon.lock"); }
  catch (error) {
    // Only contention for the daemon's own lock means another instance owns it.
    if (error.code === "LOCKED") return;
    throw error;
  }
  const active = new Map();
  const manager = agent.createManager();
  let endpoint;
  let token;
  const started = new Date().toISOString();
  let interval;
  let stopping = false;
  let descriptor;
  let schedulerError = null;
  let maintenanceErrors = [];
  let nextMaintenanceCheck = 0;
  const server = http.createServer(async (request, response) => {
    try {
      const host = `127.0.0.1:${descriptor?.port}`;
      if (request.headers.host !== host || request.headers.origin && request.headers.origin !== `http://${host}`) return json(response, 403, { error: { code: "ORIGIN_DENIED", message: "Local same-origin requests only" } });
      const url = new URL(request.url, `http://${host}`);
      if (request.method === "GET" && webAssets.files.has(url.pathname)) {
        const asset = webAssets.files.get(url.pathname);
        response.writeHead(200, {
          "Content-Type": asset.endsWith("html") ? "text/html; charset=utf-8" : asset.endsWith("js") ? "text/javascript; charset=utf-8" : "text/css; charset=utf-8",
          "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
          "Content-Security-Policy": `default-src 'none'; script-src 'self'; style-src 'self' '${webAssets.styleHash}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
        });
        response.end(fs.readFileSync(asset));
        return;
      }
      const provided = Buffer.from(request.headers.authorization || "");
      const expected = Buffer.from(`Bearer ${token}`);
      if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return json(response, 401, { error: { code: "UNAUTHORIZED", message: "Open the authorized dashboard URL from memory dashboard" } });
      const params = Object.fromEntries(url.searchParams);
      if (request.method === "GET") {
        if (url.pathname === "/api/status") {
          let model;
          try { model = await models.resolveModel(); } catch (error) { model = { error: error.message }; }
          const jobs = queue.all();
          return json(response, 200, { running: true, protocol: store.STORE_VERSION, storagePolicy: "current-files-only/v1", pid: process.pid, started, model, agents: agent.states(), active: [...new Set([...active.values()].map(item => item.workspace))], activeBatches: [...active].map(([id, item]) => ({ id, workspace: item.workspace })), maxAgentsPerWorkspace: agent.MAX_AGENTS_PER_WORKSPACE, schedulerError, maintenanceErrors, counts: jobs.reduce((counts, { state }) => { counts[state.status] = (counts[state.status] || 0) + 1; return counts; }, {}) });
        }
        if (url.pathname === "/api/index") return json(response, 200, store.inspectIndex(optionsFrom(params)));
        if (url.pathname === "/api/agent-live") {
          if (typeof params.workspace !== "string" || !params.workspace.trim()) store.fail("WORKSPACE_REQUIRED", "Select a workspace to inspect its Memory Agent");
          return json(response, 200, manager.inspect(params.workspace, params.event ? runtime.jobId(params.event) : undefined));
        }
        if (url.pathname === "/api/agents") return json(response, 200, { items: agent.states() });
        if (url.pathname === "/api/memory-groups") return json(response, 200, library.groups(params));
        if (url.pathname === "/api/memories") return json(response, 200, library.list({ ...params, offset: Number(params.offset || 0), limit: Number(params.limit || 20) }));
        if (url.pathname === "/api/jobs") return json(response, 200, queue.list({ ...params, newestFirst: params.newestFirst === "true", offset: Number(params.offset || 0), limit: Number(params.limit || 20) }));
        if (url.pathname === "/api/job") return json(response, 200, queue.get(params.id));
        if (url.pathname === "/api/read") return json(response, 200, store.get(store.rootFor(optionsFrom(params)), params.id));
      }
      if (request.method === "POST") {
        const input = await body(request);
        if (url.pathname === "/api/retry") return json(response, 200, queue.retry(input.id));
        if (url.pathname === "/api/stop") {
          if (input.ifIdle && active.size) store.fail("SERVICE_BUSY", "Active maintenance batches must finish before an idle restart");
          json(response, 200, { stopping: true }); void stop(); return;
        }
      }
      json(response, 404, { error: { code: "NOT_FOUND", message: "Unknown endpoint" } });
    } catch (error) { json(response, 400, { error: { code: error.code || "MEMORY_ERROR", message: error.message } }); }
  });

  async function processJob(item) {
    const { event } = item;
    let unlock;
    try {
      unlock = runtime.acquire(`job-locks/${event.id}.lock`);
      const { state } = queue.get(event.id);
      if (!["queued", "failed", "interrupted"].includes(state.status)) return;
      if (state.attempts >= queue.MAX_ATTEMPTS) {
        queue.update(event.id, { status: "exhausted" });
        return;
      }
      const writable = migration.ensureWorkspace(event.workspace).filter(scope => scope.writable).map(scope => scope.scope);
      if (!writable.length || event.maintenance && !writable.includes(event.maintenance.scope)) {
        const error = "UPGRADE_REQUIRED: 此作用域保持只读，显式升级后再处理；未消耗模型尝试次数。";
        if (state.status !== "queued" || state.error !== error) queue.update(event.id, { status: "queued", error });
        return;
      }
      const effects = state.effects || [];
      queue.update(event.id, { status: "running", attempts: state.attempts + 1, error: null, started: new Date().toISOString() });
      const controller = active.get(event.id).controller;
      await manager.run(event, {
        signal: controller.signal,
        recordModel: (model) => queue.update(event.id, { model }),
        recordEffect: (effect) => {
          if (!effects.some(previous => previous.scope === effect.scope && previous.id === effect.id && previous.operation === effect.operation && previous.hash === effect.hash)) effects.push(effect);
          queue.update(event.id, { effects });
        },
      });
      queue.complete(event.id);
    } catch (error) {
      if (!unlock) { console.error("Cannot acquire job lock", event.id, error.message); return; }
      try {
        // Retirement can fail after the completed marker/receipt is durable.
        // Keep it completed so recovery never repeats a successful model call.
        const current = queue.get(event.id).state;
        if (current.status !== "completed") queue.update(event.id, { status: current.attempts >= queue.MAX_ATTEMPTS ? "exhausted" : stopping ? "interrupted" : "failed", error: `${error.code || "MEMORY_ERROR"}: ${error.message}` });
        else console.error("Cannot retire completed job", event.id, error.message);
      } catch (persistError) { console.error("Cannot persist job failure", event.id, persistError.message); }
    } finally {
      unlock?.();
      active.delete(event.id);
    }
  }

  function tick() {
    if (stopping) return;
    try {
      const items = queue.all();
      if (Date.now() >= nextMaintenanceCheck) {
        nextMaintenanceCheck = Date.now() + 60 * 1000;
        queue.compactCompleted();
        maintenanceErrors = maintenance.schedule(queue.all());
      }
      const dispatchErrors = [];
      // Conversation work takes precedence; each workspace runs independently.
      // Exhausted records remain inspectable without blocking later work.
      const ordered = [...items.filter(item => !item.event.maintenance), ...items.filter(item => item.event.maintenance)];
      for (const item of ordered) {
        const workspace = item.event.workspace;
        if (["completed", "exhausted"].includes(item.state.status)) continue;
        // A read-only or inaccessible scope must not reserve another workspace's turn.
        try {
          if (item.event.maintenance && !migration.ensure({ scope: item.event.maintenance.scope, workspace }).writable) continue;
        } catch (error) {
          dispatchErrors.push(`${workspace}: ${error.code || "MEMORY_ERROR"}: ${error.message}`);
          continue;
        }
        // Reserve each batch before dispatch, including while its session starts.
        if (!["queued", "failed", "interrupted"].includes(item.state.status) || active.has(item.event.id)) continue;
        if ([...active.values()].filter(item => item.workspace === workspace).length >= agent.MAX_AGENTS_PER_WORKSPACE) continue;
        active.set(item.event.id, { workspace, controller: new AbortController() });
        void processJob(item);
      }
      schedulerError = dispatchErrors.length ? dispatchErrors.join("\n") : null;
    } catch (error) { schedulerError = error.message; }
  }

  async function stop() {
    if (stopping) return;
    stopping = true;
    clearInterval(interval);
    for (const { controller } of active.values()) controller.abort();
    server.close();
    const wait = setInterval(() => {
      if (active.size) return;
      clearInterval(wait);
      manager.close();
      if (runtime.read("daemon.json")?.token === token) fs.unlinkSync(runtime.file("daemon.json"));
      release();
    }, 100);
  }

  try {
    endpoint = endpoints.resolve();
    token = endpoint.token;
    queue.reconcile();
    agent.reconcile();
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(endpoint.port, "127.0.0.1", resolve); });
    descriptor = { schema: "csl-memory-daemon/v1", protocol: store.STORE_VERSION, pid: process.pid, port: server.address().port, token, started };
    runtime.write("daemon.json", descriptor);
    runtime.write("startup-error.json", null);
    process.once("SIGTERM", () => { void stop(); });
    process.once("SIGINT", () => { void stop(); });
    interval = setInterval(tick, 1000);
    tick();
  } catch (error) {
    server.close();
    release();
    if (error.code === "EADDRINUSE") store.fail("DASHBOARD_PORT_IN_USE", `Memory Dashboard port ${endpoint.port} is already in use; release that port before starting. No fallback port was selected.`);
    throw error;
  }
}

if (require.main === module) main().catch((error) => {
  try { runtime.write("startup-error.json", { at: new Date().toISOString(), code: error.code || "MEMORY_ERROR", message: error.message }); } catch { /* stderr remains available. */ }
  console.error(error.code || "MEMORY_ERROR", error.message);
  process.exitCode = 1;
});

module.exports = { main };
