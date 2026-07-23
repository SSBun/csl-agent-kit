import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import cslContextHooks, {
  formatSystemContext,
  isDesignFetchTool,
  loadTriggerifyPrompts,
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

function fakePi() {
  const handlers = new Map();
  return { handlers, api: { on: (name, handler) => handlers.set(name, handler) } };
}

test("loads Triggerify session prompts into Pi context", () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  try {
    const prompts = loadTriggerifyPrompts(root);
    const context = formatSystemContext(prompts, [], []);
    assert.match(context, /Triggerify global:directive-output/);
    assert.match(context, /Prefer concise reports/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("rebuilds Pi Triggerify context before every agent turn", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();
  try {
    cslContextHooks(api);
    for (const event of ["session_start", "session_compact", "before_agent_start", "tool_call", "tool_result"]) {
      assert.equal(typeof handlers.get(event), "function", `missing ${event} handler`);
    }
    await handlers.get("session_start")({}, {});
    await handlers.get("session_compact")({}, {});
    const first = await handlers.get("before_agent_start")({ prompt: "deploy frobnicator production", systemPrompt: "base prompt" }, {});
    assert.match(first.systemPrompt, /Prefer concise reports/);
    assert.match(first.systemPrompt, /deploy-production/);

    writeSessionPrompt(root, "directive-output", "Show absolute paths.");
    const second = await handlers.get("before_agent_start")({ prompt: "show a path", systemPrompt: "base prompt" }, {});
    assert.match(second.systemPrompt, /Show absolute paths/);
    assert.doesNotMatch(second.systemPrompt, /Prefer concise reports/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("adds figma-describe guidance only to successful matching Pi tool results", async () => {
  assert.equal(isDesignFetchTool("mcp__figma__get_design_context"), true);
  assert.equal(isDesignFetchTool("read"), false);
  const { api, handlers } = fakePi();
  cslContextHooks(api);
  const patched = await handlers.get("tool_result")({
    toolName: "mcp__figma__get_design_context",
    content: [{ type: "text", text: "design payload" }],
    isError: false,
  }, {});
  const failed = await handlers.get("tool_result")({
    toolName: "mcp__figma__get_design_context",
    content: [{ type: "text", text: "request failed" }],
    isError: true,
  }, {});
  assert.equal(patched.content.length, 2);
  assert.match(patched.content[1].text, /figma-describe/);
  assert.equal(failed, undefined);
});
