"use strict";

const fs = require("node:fs");
const store = require("./store.js");
const runtime = require("./runtime-files.js");

function validateEvent(event) {
  if (!event || event.schema !== "csl-memory-event/v1") store.fail("INVALID_EVENT", "Unsupported maintenance event schema");
  for (const field of ["workspace", "session", "eventKey"]) {
    if (typeof event[field] !== "string" || !event[field].trim() || event[field].length > 4000) store.fail("INVALID_EVENT", `Missing or invalid ${field}`);
  }
  if (event.task !== undefined && event.task !== null && (typeof event.task !== "string" || event.task.length > 200)) store.fail("INVALID_EVENT", "Invalid task ID");
  if (!Array.isArray(event.messages) || !event.messages.length || event.messages.length > 200) store.fail("INVALID_EVENT", "Event must contain 1..200 visible messages");
  for (const message of event.messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.text !== "string" || !message.text.trim()) store.fail("INVALID_EVENT", "Only non-empty visible user/assistant text is accepted");
  }
  if (Buffer.byteLength(JSON.stringify(event.messages)) > 128 * 1024) store.fail("EVENT_TOO_LARGE", "Conversation increment exceeds 128 KiB; split at message boundaries, never silently truncate");
}

function enqueue(input) {
  validateEvent(input);
  const workspace = fs.realpathSync(input.workspace);
  if (!fs.statSync(workspace).isDirectory()) store.fail("INVALID_EVENT", "Workspace is not a directory");
  const event = {
    schema: "csl-memory-event/v1", workspace, session: input.session, eventKey: input.eventKey,
    task: input.task || null, messages: input.messages.map(({ role, text }) => ({ role, text })),
  };
  const id = store.hash(JSON.stringify([workspace, event.session, event.eventKey]));
  const payloadHash = store.hash(JSON.stringify(event));
  const release = runtime.acquire(`event-locks/${id}.lock`);
  try {
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
  if (!event) store.fail("NOT_FOUND", "Maintenance event not found");
  const state = runtime.read(`jobs/${id}.json`);
  return { event, state: state || { id, status: "untracked", attempts: 0 } };
}

function all() {
  return runtime.names("events").map((name) => get(name.slice(0, -5))).sort((a, b) => a.event.created.localeCompare(b.event.created) || a.event.id.localeCompare(b.event.id));
}

function list({ offset = 0, limit = 20, workspace, session, task } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) store.fail("INVALID_PAGE", "Invalid event page");
  const root = workspace ? fs.realpathSync(workspace) : null;
  const matches = all().filter(({ event }) => (!root || event.workspace === root) && (!session || event.session === session) && (!task || event.task === task));
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
    if (!["failed", "interrupted"].includes(state.status)) store.fail("INVALID_STATE", "Only failed/interrupted events can be explicitly retried");
    update(id, { status: "queued", error: null });
    return { id, status: "queued" };
  } finally { release(); }
}

function reconcile() {
  for (const { event, state } of all()) {
    if (state.status === "untracked") {
      runtime.write(`jobs/${event.id}.json`, { schema: "csl-memory-job/v1", id: event.id, status: "queued", attempts: 0, updated: new Date().toISOString() });
    } else if (state.status === "running") {
      update(event.id, { status: "interrupted", error: "后台服务在处理期间退出；可能已有审计变更。检查后显式 retry，不自动重复模型请求。" });
    }
  }
}

module.exports = { enqueue, get, all, list, update, retry, reconcile };
