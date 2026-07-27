import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import cslContextHooks, {
  formatTriggerContext,
  isDesignFetchTool,
} from "../pi/extensions/csl-context-hooks.ts";

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "csl-pi-context-"));
  mkdirSync(join(root, "sops"), { recursive: true });
  writeSessionPrompt(root, "directive-output", "Prefer concise reports.");
  writeFileSync(join(root, "sops", "deploy-production.md"), `---
name: deploy-production
description: Deploy the frobnicator production service.
when_to_use: Use when deploying frobnicator production services.
---

# Deploy Production
`);
  return root;
}

function writeSessionPrompt(root, name, body) {
  const hooks = join(root, "triggerify", "hooks");
  mkdirSync(hooks, { recursive: true });
  writeFileSync(join(hooks, `${name}.md`), `---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\n${body}\n`);
}

function writeCaptureRule(root) {
  const hooks = join(root, "triggerify", "hooks");
  const scripts = join(root, "triggerify", "scripts");
  mkdirSync(hooks, { recursive: true });
  mkdirSync(scripts, { recursive: true });
  writeFileSync(join(hooks, "capture.md"), `---
schema: triggerify/v1
event: after-tool
action: run-script
enabled: true
script: capture.js
---
`);
  writeFileSync(join(scripts, "capture.js"), `#!/usr/bin/env node
const fs = require("node:fs");
const payload = fs.readFileSync(0, "utf8");
fs.appendFileSync(process.env.TRIGGERIFY_CAPTURE_PATH, payload);
`, { mode: 0o700 });
}

function capturedPayloads(file) {
  return readFileSync(file, "utf8").trim().split("\n").map(JSON.parse);
}

function fakePi() {
  const handlers = new Map();
  return { handlers, api: { on: (name, handler) => handlers.set(name, handler) } };
}

function fakeContext(cwd) {
  return { cwd, ui: { notify() {} } };
}

test("formats Triggerify session prompts into Pi context", () => {
  const context = formatTriggerContext(
    [{ id: "global:directive-output", content: "Prefer concise reports." }],
    [],
    [],
  );
  assert.match(context, /Triggerify global:directive-output/);
  assert.match(context, /Prefer concise reports/);
});

test("rebuilds Pi Triggerify context before every agent turn", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();
  const context = fakeContext(root);
  try {
    cslContextHooks(api);
    for (const event of ["session_start", "session_compact", "before_agent_start", "tool_call", "tool_execution_start", "tool_result"]) {
      assert.equal(typeof handlers.get(event), "function", `missing ${event} handler`);
    }
    await handlers.get("session_start")({}, context);
    await handlers.get("session_compact")({}, context);
    const first = await handlers.get("before_agent_start")({ prompt: "deploy frobnicator production", systemPrompt: "base prompt" }, context);
    assert.match(first.systemPrompt, /Prefer concise reports/);
    assert.match(first.systemPrompt, /deploy-production/);

    writeSessionPrompt(root, "directive-output", "Show absolute paths.");
    const second = await handlers.get("before_agent_start")({ prompt: "show a path", systemPrompt: "base prompt" }, context);
    assert.match(second.systemPrompt, /Show absolute paths/);
    assert.doesNotMatch(second.systemPrompt, /Prefer concise reports/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("maps Pi file tool results to Triggerify changed_files", async () => {
  const root = createFixture();
  const workspace = join(root, "workspace");
  const capture = join(root, "captured.jsonl");
  const existing = join(workspace, "tasks", "todo.md");
  const created = join(workspace, "tasks", "todo", "new.md");
  const outside = join(root, "outside.md");
  mkdirSync(join(workspace, "tasks", "todo"), { recursive: true });
  writeFileSync(existing, "existing\n");
  writeCaptureRule(root);

  const previousHome = process.env.CSL_AGENT_KIT_HOME;
  const previousCapture = process.env.TRIGGERIFY_CAPTURE_PATH;
  process.env.CSL_AGENT_KIT_HOME = root;
  process.env.TRIGGERIFY_CAPTURE_PATH = capture;
  const { api, handlers } = fakePi();
  const context = fakeContext(workspace);

  try {
    cslContextHooks(api);
    await handlers.get("tool_execution_start")({ toolCallId: "write", toolName: "write", args: { path: "tasks/todo/new.md" } }, context);
    await handlers.get("tool_execution_start")({ toolCallId: "edit", toolName: "edit", args: { path: existing } }, context);
    writeFileSync(created, "new\n");

    await handlers.get("tool_result")({ toolCallId: "edit", toolName: "edit", input: { path: existing }, content: [], isError: false }, context);
    await handlers.get("tool_result")({ toolCallId: "write", toolName: "write", input: { path: "tasks/todo/new.md" }, content: [], isError: false }, context);
    await handlers.get("tool_execution_start")({ toolCallId: "failed", toolName: "write", args: { path: "failed.md" } }, context);
    await handlers.get("tool_result")({ toolCallId: "failed", toolName: "write", input: { path: "failed.md" }, content: [], isError: true }, context);
    await handlers.get("tool_result")({ toolCallId: "bash", toolName: "bash", input: { command: "true" }, content: [], isError: false }, context);
    await handlers.get("tool_execution_start")({ toolCallId: "outside", toolName: "write", args: { path: outside } }, context);
    writeFileSync(outside, "outside\n");
    await handlers.get("tool_result")({ toolCallId: "outside", toolName: "write", input: { path: outside }, content: [], isError: false }, context);

    const payloads = capturedPayloads(capture);
    assert.deepEqual(payloads.map((payload) => payload.changed_files), [
      [{ path: "tasks/todo.md", operation: "modified" }],
      [{ path: "tasks/todo/new.md", operation: "created" }],
      [],
      null,
      [],
    ]);
    assert.deepEqual(payloads.map((payload) => payload.tool.success), [true, true, false, true, true]);
  } finally {
    if (previousHome === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previousHome;
    if (previousCapture === undefined) delete process.env.TRIGGERIFY_CAPTURE_PATH;
    else process.env.TRIGGERIFY_CAPTURE_PATH = previousCapture;
    rmSync(root, { recursive: true, force: true });
  }
});

test("adds figma-describe guidance only to successful matching Pi tool results", async () => {
  assert.equal(isDesignFetchTool("mcp__figma__get_design_context"), true);
  assert.equal(isDesignFetchTool("read"), false);
  const { api, handlers } = fakePi();
  const context = fakeContext(process.cwd());
  cslContextHooks(api);
  const patched = await handlers.get("tool_result")({
    toolCallId: "figma-success",
    toolName: "mcp__figma__get_design_context",
    input: {},
    content: [{ type: "text", text: "design payload" }],
    isError: false,
  }, context);
  const failed = await handlers.get("tool_result")({
    toolCallId: "figma-failure",
    toolName: "mcp__figma__get_design_context",
    input: {},
    content: [{ type: "text", text: "request failed" }],
    isError: true,
  }, context);
  assert.equal(patched.content.length, 2);
  assert.match(patched.content[1].text, /figma-describe/);
  assert.equal(failed, undefined);
});
