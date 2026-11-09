"use strict";

// Process-local inspection only: never serialize SDK messages or thinking.
const traces = new Map();
const MAX_EVENTS = 100;
const MAX_EVENT_BYTES = 192 * 1024;
const RETENTION_MS = 2 * 60 * 1000;

function text(value, limit = 16 * 1024) {
  let result = (typeof value === "string" ? value : JSON.stringify(value, null, 2) || "")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]+/g, "[redacted-key]");
  if (Buffer.byteLength(result) <= limit) return result;
  result = Buffer.from(result).subarray(0, limit - 64).toString("utf8");
  return `${result}\n…[内容已截断]`;
}

function start(event, attempt) {
  const previous = traces.get(event.workspace);
  clearTimeout(previous?.timer);
  traces.set(event.workspace, {
    workspace: event.workspace, event: event.id, session: text(event.session, 4096), task: event.task,
    attempt, status: "running", started: new Date().toISOString(),
    input: text(event.maintenance || event.messages, 32 * 1024),
    events: [], dropped: 0, bytes: 0, timer: null,
  });
}

function record(workspace, kind, value) {
  const trace = traces.get(workspace);
  if (!trace || trace.status !== "running") return;
  const item = { at: new Date().toISOString(), kind, text: text(value) };
  trace.events.push(item);
  trace.bytes += Buffer.byteLength(JSON.stringify(item));
  while (trace.events.length > MAX_EVENTS || trace.bytes > MAX_EVENT_BYTES) {
    trace.bytes -= Buffer.byteLength(JSON.stringify(trace.events.shift()));
    trace.dropped++;
  }
}

function observe(workspace, item) {
  if (item.type === "tool_execution_start") record(workspace, "工具调用", { tool: item.toolName, id: item.toolCallId, arguments: item.args });
  if (item.type === "tool_execution_end") record(workspace, item.isError ? "工具错误" : "工具结果", {
    tool: item.toolName, id: item.toolCallId,
    text: (item.result?.content || []).filter(block => block.type === "text").map(block => block.text).join("\n"),
  });
  if (item.type === "message_end" && item.message?.role === "assistant") {
    const visible = (item.message.content || []).filter(block => block.type === "text").map(block => block.text).join("\n");
    if (visible) record(workspace, "公开回复", visible);
  }
}

function finish(workspace, status, message) {
  const trace = traces.get(workspace);
  if (!trace) return;
  record(workspace, "结束", message || status);
  trace.status = status;
  trace.finished = new Date().toISOString();
  trace.timer = setTimeout(() => { if (traces.get(workspace) === trace) traces.delete(workspace); }, RETENTION_MS);
  trace.timer.unref();
}

function get(workspace) {
  const trace = traces.get(workspace);
  if (!trace) return { available: false, workspace };
  const { bytes, timer, ...visible } = trace;
  return { available: true, ...visible, retentionSeconds: RETENTION_MS / 1000 };
}

function clear() {
  for (const trace of traces.values()) clearTimeout(trace.timer);
  traces.clear();
}

module.exports = { start, record, observe, finish, get, clear };
