"use strict";

const fs = require("node:fs");
const store = require("./store.js");
const recent = require("./recent.js");
const runtime = require("./runtime-files.js");

function validateEvent(event) {
  if (!event || event.schema !== "csl-memory-event/v1") store.fail("INVALID_EVENT", "Unsupported maintenance event schema");
  for (const field of ["workspace", "session", "eventKey"]) {
    if (typeof event[field] !== "string" || !event[field].trim() || event[field].length > 4000) store.fail("INVALID_EVENT", `Missing or invalid ${field}`);
  }
  if (event.task !== undefined && event.task !== null && (typeof event.task !== "string" || event.task.length > 200)) store.fail("INVALID_EVENT", "Invalid task ID");
  if (event.maintenance !== undefined) {
    const sweep = event.maintenance;
    if (!sweep || !["user", "project"].includes(sweep.scope) || !Array.isArray(sweep.ids) || !sweep.ids.length || sweep.ids.length > 8 || new Set(sweep.ids).size !== sweep.ids.length || sweep.ids.some(id => typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(id))) store.fail("INVALID_EVENT", "Invalid maintenance scope or candidates");
    if (!Array.isArray(event.messages) || event.messages.length) store.fail("INVALID_EVENT", "Maintenance events cannot impersonate conversation messages");
  } else if (!Array.isArray(event.messages) || !event.messages.length || event.messages.length > 200) store.fail("INVALID_EVENT", "Event must contain 1..200 visible messages");
  for (const message of event.messages) {
    if (message?.at !== undefined && !recent.day(message.at)) store.fail("INVALID_EVENT", "Message timestamp must be canonical UTC ISO time");
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.text !== "string" || !message.text.trim()) store.fail("INVALID_EVENT", "Only non-empty visible user/assistant text is accepted");
  }
  if (Buffer.byteLength(JSON.stringify(event.messages)) > 128 * 1024) store.fail("EVENT_TOO_LARGE", "Conversation increment exceeds 128 KiB; split at message boundaries, never silently truncate");
}

const MAX_ATTEMPTS = 2;
const RECEIPT_BRANCH = "csl-memory-receipt-branch/v1";
const RECEIPT_BYTES = 1024 * 1024;

function receiptLeaf(id) {
  let prefix = id.slice(0, 2);
  for (;;) {
    const values = runtime.read(`receipts/${prefix}.json`);
    if (values?.schema !== RECEIPT_BRANCH) return { prefix, values: values || {} };
    if (prefix.length >= id.length) store.fail("INVALID_RECEIPT", "Receipt branch exceeds event ID length");
    prefix = id.slice(0, prefix.length + 1);
  }
}

function receipt(id) { return receiptLeaf(id).values[id] || null; }

function writeReceipts(prefix, values) {
  if (Buffer.byteLength(`${JSON.stringify(values, null, 2)}\n`) <= RECEIPT_BYTES) {
    runtime.write(`receipts/${prefix}.json`, values);
    return;
  }
  // Publish all children before switching the parent to a branch. Readers of
  // the old leaf retain every old receipt; interrupted splits can be repeated.
  const children = new Map();
  for (const [id, digest] of Object.entries(values)) {
    const child = id.slice(0, prefix.length + 1);
    if (child.length <= prefix.length) store.fail("INVALID_RECEIPT", "Invalid event ID in receipt leaf");
    if (!children.has(child)) children.set(child, {});
    children.get(child)[id] = digest;
  }
  for (const [child, hashes] of children) writeReceipts(child, hashes);
  runtime.write(`receipts/${prefix}.json`, { schema: RECEIPT_BRANCH });
}

function registerWorkspace(workspace) {
  const file = `workspaces/${store.hash(workspace)}.json`;
  if (!runtime.read(file)) runtime.write(file, { workspace });
}

function knownWorkspaces() {
  return [...new Set([
    ...runtime.names("workspaces").map(name => runtime.read(`workspaces/${name}`).workspace),
    ...runtime.names("events").flatMap(name => {
      const event = runtime.read(`events/${name}`);
      return event ? [event.workspace] : [];
    }),
  ])].sort();
}

function checkpointPath(scope, workspace) {
  return `maintenance-state/${scope === "user" ? "user" : store.hash(workspace)}.json`;
}

function checkpoint(scope, workspace) { return runtime.read(checkpointPath(scope, workspace)); }

function enqueue(input) {
  validateEvent(input);
  const workspace = fs.realpathSync(input.workspace);
  if (!fs.statSync(workspace).isDirectory()) store.fail("INVALID_EVENT", "Workspace is not a directory");
  const event = {
    schema: "csl-memory-event/v1", workspace, session: input.session, eventKey: input.eventKey,
    task: input.task || null, messages: input.messages.map(({ role, text, at }) => ({ role, text, ...(at ? { at } : {}) })),
    ...(input.maintenance ? { maintenance: { scope: input.maintenance.scope, ids: input.maintenance.ids } } : {}),
  };
  const id = store.hash(JSON.stringify([workspace, event.session, event.eventKey]));
  const payloadHash = store.hash(JSON.stringify(event));
  const release = runtime.acquire(`event-locks/${id}.lock`);
  try {
    registerWorkspace(workspace);
    const done = receipt(id);
    if (done) {
      if (done !== payloadHash) store.fail("EVENT_CONFLICT", "Same event key was submitted with different content");
      return { id, enqueued: true, duplicate: true, status: "completed" };
    }
    const existing = runtime.read(`events/${id}.json`);
    if (existing && existing.payloadHash !== payloadHash) store.fail("EVENT_CONFLICT", "Same event key was submitted with different content");
    if (!existing) runtime.write(`events/${id}.json`, { ...event, id, payloadHash, created: new Date().toISOString() });
    const state = runtime.read(`jobs/${id}.json`);
    if (!state) runtime.write(`jobs/${id}.json`, { schema: "csl-memory-job/v1", id, status: "queued", attempts: 0, updated: new Date().toISOString() });
    return { id, enqueued: true, duplicate: Boolean(existing), status: state?.status || "queued" };
  } finally { release(); }
}

function get(id) {
  runtime.jobId(id);
  const event = runtime.read(`events/${id}.json`);
  const state = runtime.read(`jobs/${id}.json`);
  if (event && state) return { event, state };
  const payloadHash = receipt(id);
  if (payloadHash) return { event: event || { id, payloadHash, messages: [] }, state: { id, status: "completed", retired: true } };
  if (!event) store.fail("NOT_FOUND", "Maintenance event not found");
  return { event, state: { id, status: "untracked", attempts: 0 } };
}

function all() {
  // A completed job may disappear between directory enumeration and reading.
  return runtime.names("events").flatMap(name => {
    const event = runtime.read(`events/${name}`);
    if (!event) return [];
    const state = runtime.read(`jobs/${name}`) || { id: event.id, status: receipt(event.id) ? "completed" : "untracked", attempts: 0 };
    return [{ event, state }];
  }).sort((a, b) => a.event.created.localeCompare(b.event.created) || a.event.id.localeCompare(b.event.id));
}

function list({ offset = 0, limit = 20, workspace, session, task, newestFirst = false } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) store.fail("INVALID_PAGE", "Invalid event page");
  const root = workspace ? fs.realpathSync(workspace) : null;
  const matches = all().filter(({ event, state }) => state.status !== "completed" && (!root || event.workspace === root) && (!session || event.session === session) && (!task || event.task === task));
  if (newestFirst) matches.reverse();
  return {
    total: matches.length, offset, limit, nextOffset: offset + limit < matches.length ? offset + limit : null,
    items: matches.slice(offset, offset + limit).map(({ event, state }) => ({ id: event.id, workspace: event.workspace, session: event.session, task: event.task, created: event.created, ...state })),
  };
}

function update(id, changes) {
  runtime.jobId(id);
  const current = runtime.read(`jobs/${id}.json`);
  if (!current) store.fail("NOT_FOUND", "Maintenance job not found");
  runtime.write(`jobs/${id}.json`, { ...current, ...changes, updated: new Date().toISOString() });
}

function retry(id) {
  const release = runtime.acquire(`job-locks/${runtime.jobId(id)}.lock`);
  try {
    const { state } = get(id);
    if (!["failed", "interrupted"].includes(state.status)) store.fail("INVALID_STATE", "Only failed/interrupted events can be retried");
    if (state.attempts >= MAX_ATTEMPTS) store.fail("ATTEMPTS_EXHAUSTED", "This event has already used its two processing attempts");
    update(id, { status: "queued", error: null });
    return { id, status: "queued" };
  } finally { release(); }
}

// Persist only replay hashes and the latest sweep cursor before removing input.
// These are coordination state, not a second history of model processing.
function retire(id) {
  const release = runtime.acquire(`event-locks/${runtime.jobId(id)}.lock`);
  try {
    const event = runtime.read(`events/${id}.json`);
    if (!event) return false;
    const state = runtime.read(`jobs/${id}.json`);
    if (state?.status !== "completed" && !receipt(id)) return false;
    registerWorkspace(event.workspace);
    const shard = id.slice(0, 2);
    const unlockReceipt = runtime.acquire(`receipt-locks/${shard}.lock`);
    try {
      const { prefix, values } = receiptLeaf(id);
      if (values[id] && values[id] !== event.payloadHash) store.fail("EVENT_CONFLICT", "Completed event receipt differs from queued payload");
      if (!values[id]) writeReceipts(prefix, { ...values, [id]: event.payloadHash });
    } finally { unlockReceipt(); }
    if (event.maintenance) {
      const target = checkpointPath(event.maintenance.scope, event.workspace);
      const unlockCursor = runtime.acquire(`${target}.lock`);
      try {
        const current = runtime.read(target);
        const completed = state?.completed || event.created;
        if (!current || completed > current.completed || completed === current.completed && event.id > current.id) {
          runtime.write(target, { id: event.id, completed, cursor: event.maintenance.ids.at(-1) });
        }
      } finally { unlockCursor(); }
    }
    // Delete the job first. If interrupted here, the durable receipt prevents
    // the remaining event from being treated as untracked and replayed.
    fs.rmSync(runtime.file(`jobs/${id}.json`), { force: true });
    fs.unlinkSync(runtime.file(`events/${id}.json`));
    return true;
  } finally { release(); }
}

function complete(id) {
  update(id, { status: "completed", completed: new Date().toISOString() });
  return retire(id);
}

function compactCompleted({ dryRun = false } = {}) {
  let count = 0, bytes = 0;
  for (const { event, state } of all()) {
    if (state.status !== "completed") continue;
    const unlock = runtime.acquire(`job-locks/${event.id}.lock`);
    try {
      if (get(event.id).state.status !== "completed") continue;
      let size = 0;
      for (const dir of ["events", "jobs"]) {
        try { size += fs.statSync(runtime.file(`${dir}/${event.id}.json`)).size; }
        catch (error) { if (error.code !== "ENOENT") throw error; }
      }
      if (dryRun || retire(event.id)) { count++; bytes += size; }
    } finally { unlock(); }
  }
  return { count, bytes, dryRun };
}

function reconcile() {
  for (const { event, state } of all()) {
    if (state.status === "untracked") {
      runtime.write(`jobs/${event.id}.json`, { schema: "csl-memory-job/v1", id: event.id, status: "queued", attempts: 0, updated: new Date().toISOString() });
    } else if (["queued", "running", "failed", "interrupted"].includes(state.status) && state.attempts >= MAX_ATTEMPTS) {
      update(event.id, { status: "exhausted", error: state.error || "处理次数已达两次；保留记录并继续后续批次。" });
    } else if (state.status === "running") {
      update(event.id, { status: "interrupted", error: "后台服务在处理期间退出；当前文件可能已改变。下次处理重读当前知识并参考effects，累计最多两次尝试。" });
    }
  }
  compactCompleted();
}

module.exports = { MAX_ATTEMPTS, enqueue, get, all, list, update, retry, complete, compactCompleted, reconcile, knownWorkspaces, checkpoint };
