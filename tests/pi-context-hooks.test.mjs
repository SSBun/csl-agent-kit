import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import cslContextHooks, {
  formatSystemContext,
  isDesignFetchTool,
  loadTips,
} from "../pi/extensions/csl-context-hooks.ts";

function writeTips(root, tips) {
  writeFileSync(join(root, "tips", "tips.json"), `${JSON.stringify({ version: 1, tips }, null, 2)}\n`);
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "csl-pi-context-"));
  mkdirSync(join(root, "tips"), { recursive: true });
  mkdirSync(join(root, "sops"), { recursive: true });
  writeTips(root, [
    { text: "Prefer concise reports.", keywords: ["report", "summary"] },
    { text: "Do not send optional commentary.", keywords: ["commentary"] },
  ]);
  writeFileSync(join(root, "sops", "deploy-production.md"), `---
name: deploy-production
description: Deploy the frobnicator production service.
when_to_use: Use when deploying frobnicator production services.
---

# Deploy Production
`);
  return root;
}

function fakePi() {
  const handlers = new Map();
  return {
    handlers,
    api: {
      on(name, handler) {
        handlers.set(name, handler);
      },
    },
  };
}

test("loads JSON tips and formats reusable Pi system context", () => {
  const root = createFixture();
  try {
    const tips = loadTips(root);
    assert.deepEqual(tips, [
      { text: "Prefer concise reports.", keywords: ["report", "summary"] },
      { text: "Do not send optional commentary.", keywords: ["commentary"] },
    ]);
    const context = formatSystemContext([tips[0]], [{
      name: "deploy-production",
      when_to_use: "Use when deploying production.",
      source: "user",
      file: join(root, "sops", "deploy-production.md"),
    }], []);
    assert.match(context, /### Confirmed user instructions \(follow unless higher-priority instructions conflict\)/);
    assert.doesNotMatch(context, /Before responding or using tools|These instructions were explicitly confirmed/);
    assert.match(context, /Prefer concise reports/);
    assert.match(context, /deploy-production/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("loads JSON tips from the configured file override", () => {
  const root = createFixture();
  const customRoot = mkdtempSync(join(tmpdir(), "csl-pi-custom-tips-"));
  const previousFile = process.env.CSL_AGENT_KIT_TIPS_FILE;
  try {
    const customFile = join(customRoot, "tips.json");
    writeFileSync(customFile, JSON.stringify({
      version: 1,
      tips: [{ text: "Custom tip.", keywords: ["custom"] }],
    }));
    process.env.CSL_AGENT_KIT_TIPS_FILE = customFile;

    assert.deepEqual(loadTips(root), [{ text: "Custom tip.", keywords: ["custom"] }]);
  } finally {
    if (previousFile === undefined) delete process.env.CSL_AGENT_KIT_TIPS_FILE;
    else process.env.CSL_AGENT_KIT_TIPS_FILE = previousFile;
    rmSync(root, { recursive: true, force: true });
    rmSync(customRoot, { recursive: true, force: true });
  }
});

test("injects only prompt-matched tips plus matching SOP candidates", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();
  const notifications = [];
  const ctx = { ui: { notify: (...args) => notifications.push(args) } };

  try {
    cslContextHooks(api);
    for (const event of ["session_start", "session_compact", "before_agent_start", "tool_call", "tool_result"]) {
      assert.equal(typeof handlers.get(event), "function", `missing ${event} handler`);
    }
    assert.equal(handlers.has("input"), false);

    await handlers.get("session_start")({}, ctx);
    const injected = await handlers.get("before_agent_start")({
      prompt: "deploy frobnicator production report",
      systemPrompt: "base prompt",
    }, ctx);

    assert.match(injected.systemPrompt, /base prompt/);
    assert.match(injected.systemPrompt, /Prefer concise reports/);
    assert.doesNotMatch(injected.systemPrompt, /Do not send optional commentary/);
    assert.match(injected.systemPrompt, /Likely SOP Candidates For This Prompt/);
    assert.match(injected.systemPrompt, /deploy-production/);

    await handlers.get("tool_call")({ toolName: "edit", input: {} }, ctx);
    assert.deepEqual(notifications, [["SOP reminder: deploy-production", "info"]]);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("does not inject an unmatched JSON tip into a Pi turn", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();

  try {
    cslContextHooks(api);
    const injected = await handlers.get("before_agent_start")({
      prompt: "deploy frobnicator production",
      systemPrompt: "base prompt",
    }, {});
    assert.doesNotMatch(injected.systemPrompt, /Prefer concise reports/);
    assert.doesNotMatch(injected.systemPrompt, /Do not send optional commentary/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("does not treat a stale wildcard tip as prompt-matched in Pi", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  writeTips(root, [{ text: "Apply this everywhere.", keywords: ["*"] }]);
  const { api, handlers } = fakePi();

  try {
    cslContextHooks(api);
    const injected = await handlers.get("before_agent_start")({
      prompt: "Any unrelated prompt.",
      systemPrompt: "base prompt",
    }, {});
    assert.doesNotMatch(injected.systemPrompt, /Apply this everywhere/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("reloads the latest matching JSON tips before every Pi agent turn", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();

  try {
    cslContextHooks(api);
    const first = await handlers.get("before_agent_start")({
      prompt: "write a report",
      systemPrompt: "base prompt",
    }, {});
    assert.match(first.systemPrompt, /Prefer concise reports/);

    writeTips(root, [{ text: "Show absolute file paths.", keywords: ["path"] }]);

    const second = await handlers.get("before_agent_start")({
      prompt: "show this path",
      systemPrompt: "base prompt",
    }, {});
    assert.match(second.systemPrompt, /Show absolute file paths/);
    assert.doesNotMatch(second.systemPrompt, /Prefer concise reports/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("keeps matching tips available when a user SOP has malformed frontmatter", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  writeFileSync(join(root, "sops", "malformed.md"), `---
name:
when_to_use: Use when handling malformed fixtures.
globs: "*.ts"
---

# Malformed
`);
  const { api, handlers } = fakePi();

  try {
    cslContextHooks(api);
    const injected = await handlers.get("before_agent_start")({
      prompt: "write a report",
      systemPrompt: "base prompt",
    }, {});
    assert.match(injected.systemPrompt, /Prefer concise reports/);
    assert.match(injected.systemPrompt, /malformed/);
    assert.match(injected.systemPrompt, /deploy-production/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("matches SOP candidates directly from the current agent prompt", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();

  try {
    cslContextHooks(api);
    assert.equal(handlers.has("input"), false);
    const matching = await handlers.get("before_agent_start")({
      prompt: "deploy frobnicator production",
      systemPrompt: "base prompt",
    }, {});
    const unrelated = await handlers.get("before_agent_start")({
      prompt: "summarize this note",
      systemPrompt: "base prompt",
    }, {});
    assert.match(matching.systemPrompt, /Likely SOP Candidates For This Prompt/);
    assert.doesNotMatch(unrelated.systemPrompt, /Likely SOP Candidates For This Prompt/);
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
  const alreadyPatched = await handlers.get("tool_result")({
    toolName: "mcp__figma__get_design_context",
    content: [{ type: "text", text: "CSL Agent Kit reminder" }],
    isError: false,
  }, {});

  assert.equal(patched.content.length, 2);
  assert.match(patched.content[1].text, /figma-describe/);
  assert.equal(failed, undefined);
  assert.equal(alreadyPatched, undefined);
});
