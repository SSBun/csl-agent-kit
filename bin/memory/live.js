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

function traceFor(workspace, event) {
  return [...traces.values()].filter(trace => trace.workspace === workspace && (!event || trace.event === event)).at(-1);
}

function start(event, attempt, agent = 1) {
  const key = `${event.workspace}\0${agent}`;
  const previous = traces.get(key);
  clearTimeout(previous?.timer);
  traces.set(key, {
    workspace: event.workspace, agent, event: event.id, session: text(event.session, 4096), task: event.task,
    attempt, status: "running", started: new Date().toISOString(),
    input: text(event.maintenance || event.messages, 32 * 1024),
    events: [], dropped: 0, bytes: 0, timer: null,
  });
}

function record(workspace, kind, value, event) {
  const trace = traceFor(workspace, event);
  if (!trace || trace.status !== "running") return;
  const item = { at: new Date().toISOString(), kind, text: text(value) };
  trace.events.push(item);
  trace.bytes += Buffer.byteLength(JSON.stringify(item));
  while (trace.events.length > MAX_EVENTS || trace.bytes > MAX_EVENT_BYTES) {
    trace.bytes -= Buffer.byteLength(JSON.stringify(trace.events.shift()));
    trace.dropped++;
  }
}

function observe(workspace, item, event) {
  if (item.type === "tool_execution_start") record(workspace, "工具调用", { tool: item.toolName, id: item.toolCallId, arguments: item.args }, event);
  if (item.type === "tool_execution_end") record(workspace, item.isError ? "工具错误" : "工具结果", {
    tool: item.toolName, id: item.toolCallId,
    text: (item.result?.content || []).filter(block => block.type === "text").map(block => block.text).join("\n"),
  }, event);
  if (item.type === "message_end" && item.message?.role === "assistant") {
    const visible = (item.message.content || []).filter(block => block.type === "text").map(block => block.text).join("\n");
    if (visible) record(workspace, "公开回复", visible, event);
  }
}

function finish(workspace, status, message, event) {
  const trace = traceFor(workspace, event);
  if (!trace) return;
  record(workspace, "结束", message || status, event);
  trace.status = status;
  trace.finished = new Date().toISOString();
  const key = `${workspace}\0${trace.agent}`;
  trace.timer = setTimeout(() => { if (traces.get(key) === trace) traces.delete(key); }, RETENTION_MS);
  trace.timer.unref();
}

function get(workspace, event) {
  const trace = traceFor(workspace, event);
  if (!trace) return { available: false, workspace };
  const { bytes, timer, ...visible } = trace;
  return { available: true, ...visible, retentionSeconds: RETENTION_MS / 1000 };
}

function clear() {
  for (const trace of traces.values()) clearTimeout(trace.timer);
  traces.clear();
}

module.exports = { start, record, observe, finish, get, clear };
