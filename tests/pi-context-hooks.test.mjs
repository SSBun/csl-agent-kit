import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import cslContextHooks, {
  buildTitleContext,
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
  const hooks = join(root, "hooks");
  mkdirSync(hooks, { recursive: true });
  writeFileSync(join(hooks, `${name}.md`), `---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\n${body}\n`);
}

function writeCaptureRule(root) {
  const hooks = join(root, "hooks");
  const scripts = join(root, "hooks", "scripts");
  mkdirSync(hooks, { recursive: true });
  mkdirSync(scripts, { recursive: true });
  writeFileSync(join(hooks, "capture.md"), `---
schema: agent-hooks/v1
event: after-tool
action: run-script
enabled: true
script: capture.js
---
`);
  writeFileSync(join(scripts, "capture.js"), `#!/usr/bin/env node
const fs = require("node:fs");
const payload = fs.readFileSync(0, "utf8");
fs.appendFileSync(process.env.AGENT_HOOKS_CAPTURE_PATH, payload);
`, { mode: 0o700 });
}

function capturedPayloads(file) {
  return readFileSync(file, "utf8").trim().split("\n").map(JSON.parse);
}

function fakePi() {
  const handlers = new Map();
  const commands = new Map();
  return {
    handlers,
    commands,
    api: {
      on: (name, handler) => handlers.set(name, handler),
      registerCommand: (name, command) => commands.set(name, command),
    },
  };
}

function fakeContext(cwd, entries = []) {
  return {
    cwd,
    sessionManager: { buildContextEntries: () => entries },
    ui: { notify() {} },
  };
}

test("builds bounded recent title context from user and assistant text only", () => {
  const context = buildTitleContext([
    { type: "message", message: { role: "user", content: `old-start ${"x".repeat(12_000)}` }, id: "old", parentId: null, timestamp: "" },
    {
      type: "message",
      message: {
        role: "assistant",
        content: [
          { type: "text", text: "Working on the authentication cache." },
          { type: "toolCall", name: "read", arguments: { path: "secret.txt" } },
        ],
      },
      id: "assistant",
      parentId: "old",
      timestamp: "",
    },
    {
      type: "message",
      message: { role: "toolResult", content: [{ type: "text", text: "private tool output" }] },
      id: "tool",
      parentId: "assistant",
      timestamp: "",
    },
    {
      type: "message",
      message: { role: "user", content: "Fix cache invalidation" },
      id: "latest",
      parentId: "tool",
      timestamp: "",
    },
  ], "commit these changes");

  assert.ok(Array.from(context).length <= 12_000);
  assert.match(context, /^\[older conversation omitted\]/);
  assert.match(context, /Assistant: Working on the authentication cache/);
  assert.match(context, /User: Fix cache invalidation/);
  assert.match(context, /User: commit these changes/);
  assert.doesNotMatch(context, /old-start|secret\.txt|private tool output|Tool:/);
});

test("reports manual title dispatch failures without starting timeout polling", async () => {
  const root = createFixture();
  mkdirSync(join(root, "triggerify"), { recursive: true });
  writeFileSync(join(root, "triggerify", "legacy.md"), "legacy\n");
  const previousHome = process.env.CSL_AGENT_KIT_HOME;
  const previousSetTimeout = globalThis.setTimeout;
  const notifications = [];
  let timeoutStarted = false;
  process.env.CSL_AGENT_KIT_HOME = root;
  globalThis.setTimeout = () => {
    timeoutStarted = true;
    return 0;
  };
  const { api, commands } = fakePi();
  const context = {
    ...fakeContext(root),
    ui: { notify: (message, level) => notifications.push({ message, level }) },
  };

  try {
    cslContextHooks(api);
    await commands.get("title").handler("", context);
    assert.equal(timeoutStarted, false);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].level, "error");
    assert.match(
      notifications[0].message,
      /^Tab title refresh failed: cannot migrate Agent Hooks: both .*triggerify and .*hooks contain data$/,
    );
  } finally {
    globalThis.setTimeout = previousSetTimeout;
    if (previousHome === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previousHome;
    rmSync(root, { recursive: true, force: true });
  }
});

test("formats Agent Hooks session prompts into Pi context", () => {
  const context = formatTriggerContext(
    [{ id: "global:directive-output", content: "Prefer concise reports." }],
    [],
    [],
  );
  assert.match(context, /Agent Hooks global:directive-output/);
  assert.match(context, /Prefer concise reports/);
});

test("rebuilds Pi Agent Hooks context before every agent turn", async () => {
  const root = createFixture();
  writeFileSync(join(root, "agent-rules.md"), "- User Agent Rule.\n");
  mkdirSync(join(root, ".agents"), { recursive: true });
  writeFileSync(join(root, ".agents", "agent-rules.md"), "- Project Agent Rule.\n");
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
    assert.match(first.systemPrompt, /full absolute path/);
    assert.match(first.systemPrompt, /User Agent Rule/);
    assert.match(first.systemPrompt, /Project Agent Rule/);
    assert.ok(first.systemPrompt.indexOf("full absolute path") < first.systemPrompt.indexOf("User Agent Rule"));
    assert.ok(first.systemPrompt.indexOf("User Agent Rule") < first.systemPrompt.indexOf("Project Agent Rule"));
    assert.match(first.systemPrompt, /deploy-production/);
    assert.match(first.systemPrompt, /CSL AGENT KIT CONTRACT ACTIVE/);
    assert.match(first.systemPrompt, /Use Task workflows automatically for every eligible request/);
    assert.match(first.systemPrompt, /activate and focus its owning record before task-direct exploration or requested deliverable changes/);
    assert.match(first.systemPrompt, /apply every relevant Lesson/);
    assert.doesNotMatch(first.systemPrompt, /Task Target Alignment Protocol/);

    writeSessionPrompt(root, "directive-output", "Show absolute paths.");
    const second = await handlers.get("before_agent_start")({ prompt: "show a path", systemPrompt: "base prompt" }, context);
    assert.match(second.systemPrompt, /Show absolute paths/);
    assert.match(second.systemPrompt, /full absolute path/);
    assert.match(second.systemPrompt, /User Agent Rule/);
    assert.match(second.systemPrompt, /Project Agent Rule/);
    assert.doesNotMatch(second.systemPrompt, /Prefer concise reports/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("loads project SOPs from the active Pi workspace", async () => {
  const root = createFixture();
  const workspace = join(root, "workspace");
  const projectSops = join(workspace, ".agents", "sops");
  mkdirSync(projectSops, { recursive: true });
  writeFileSync(join(projectSops, "verify-project.md"), `---
name: verify-project
description: Verify this project.
when_to_use: Use when verifying this project.
---
`);

  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();
  const context = fakeContext(workspace);
  try {
    cslContextHooks(api);
    await handlers.get("session_start")({}, context);
    const result = await handlers.get("before_agent_start")({ prompt: "verify this project", systemPrompt: "base prompt" }, context);
    assert.match(result.systemPrompt, /verify-project/);
    assert.match(result.systemPrompt, /\(project: .*\.agents\/sops\/verify-project\.md\)/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("maps Pi file tool results to Agent Hooks changed_files", async () => {
  const root = createFixture();
  const workspace = join(root, "workspace");
  const capture = join(root, "captured.jsonl");
  const existing = join(workspace, "tasks", "tasks.md");
  const created = join(workspace, "tasks", "tasks", "new.md");
  const outside = join(root, "outside.md");
  mkdirSync(join(workspace, "tasks", "tasks"), { recursive: true });
  writeFileSync(existing, "existing\n");
  writeCaptureRule(root);

  const previousHome = process.env.CSL_AGENT_KIT_HOME;
  const previousCapture = process.env.AGENT_HOOKS_CAPTURE_PATH;
  process.env.CSL_AGENT_KIT_HOME = root;
  process.env.AGENT_HOOKS_CAPTURE_PATH = capture;
  const { api, handlers } = fakePi();
  const context = fakeContext(workspace);

  try {
    cslContextHooks(api);
    await handlers.get("tool_execution_start")({ toolCallId: "write", toolName: "write", args: { path: "tasks/tasks/new.md" } }, context);
    await handlers.get("tool_execution_start")({ toolCallId: "edit", toolName: "edit", args: { path: existing } }, context);
    writeFileSync(created, "new\n");

    await handlers.get("tool_result")({ toolCallId: "edit", toolName: "edit", input: { path: existing }, content: [], isError: false }, context);
    await handlers.get("tool_result")({ toolCallId: "write", toolName: "write", input: { path: "tasks/tasks/new.md" }, content: [], isError: false }, context);
    await handlers.get("tool_execution_start")({ toolCallId: "failed", toolName: "write", args: { path: "failed.md" } }, context);
    await handlers.get("tool_result")({ toolCallId: "failed", toolName: "write", input: { path: "failed.md" }, content: [], isError: true }, context);
    await handlers.get("tool_result")({ toolCallId: "bash", toolName: "bash", input: { command: "true" }, content: [], isError: false }, context);
    await handlers.get("tool_execution_start")({ toolCallId: "outside", toolName: "write", args: { path: outside } }, context);
    writeFileSync(outside, "outside\n");
    await handlers.get("tool_result")({ toolCallId: "outside", toolName: "write", input: { path: outside }, content: [], isError: false }, context);

    const payloads = capturedPayloads(capture);
    assert.deepEqual(payloads.map((payload) => payload.changed_files), [
      [{ path: "tasks/tasks.md", operation: "modified" }],
      [{ path: "tasks/tasks/new.md", operation: "created" }],
      [],
      null,
      [],
    ]);
    assert.deepEqual(payloads.map((payload) => payload.tool.success), [true, true, false, true, true]);
  } finally {
    if (previousHome === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previousHome;
    if (previousCapture === undefined) delete process.env.AGENT_HOOKS_CAPTURE_PATH;
    else process.env.AGENT_HOOKS_CAPTURE_PATH = previousCapture;
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
