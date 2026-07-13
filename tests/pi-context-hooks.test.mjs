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

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "csl-pi-context-"));
  mkdirSync(join(root, "tips"), { recursive: true });
  mkdirSync(join(root, "sops"), { recursive: true });
  writeFileSync(join(root, "tips", "tips.md"), [
    "# Tips",
    "",
    "<!-- ignored -->",
    "- Prefer concise reports.",
  ].join("\n"));
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

test("loads tips and formats reusable Pi system context", () => {
  const root = createFixture();
  try {
    const tips = loadTips(root);
    assert.equal(tips, "- Prefer concise reports.");
    const context = formatSystemContext(tips, [{
      name: "deploy-production",
      when_to_use: "Use when deploying production.",
      source: "user",
      file: join(root, "sops", "deploy-production.md"),
    }], []);
    assert.match(context, /CONFIRMED PERSISTENT USER INSTRUCTIONS/);
    assert.match(context, /mandatory whenever applicable, not optional suggestions/);
    assert.match(context, /Before responding or using tools/);
    assert.match(context, /deploy-production/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("loads tips from the configured file override", () => {
  const root = createFixture();
  const customRoot = mkdtempSync(join(tmpdir(), "csl-pi-custom-tips-"));
  const previousFile = process.env.CSL_AGENT_KIT_TIPS_FILE;
  try {
    mkdirSync(customRoot, { recursive: true });
    const customFile = join(customRoot, "tips.md");
    writeFileSync(customFile, "# Tips\n\n- Custom tip.\n");
    process.env.CSL_AGENT_KIT_TIPS_FILE = customFile;

    assert.equal(loadTips(root), "- Custom tip.");
  } finally {
    if (previousFile === undefined) delete process.env.CSL_AGENT_KIT_TIPS_FILE;
    else process.env.CSL_AGENT_KIT_TIPS_FILE = previousFile;
    rmSync(root, { recursive: true, force: true });
    rmSync(customRoot, { recursive: true, force: true });
  }
});

test("registers Pi lifecycle hooks and injects tips plus matching SOP candidates", async () => {
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
      prompt: "deploy frobnicator production",
      systemPrompt: "base prompt",
    }, ctx);

    assert.match(injected.systemPrompt, /base prompt/);
    assert.match(injected.systemPrompt, /Prefer concise reports/);
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

test("reloads the latest complete tips before every Pi agent turn", async () => {
  const root = createFixture();
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const { api, handlers } = fakePi();

  try {
    cslContextHooks(api);
    const first = await handlers.get("before_agent_start")({
      prompt: "first turn",
      systemPrompt: "base prompt",
    }, {});
    assert.match(first.systemPrompt, /Prefer concise reports/);

    writeFileSync(join(root, "tips", "tips.md"), [
      "# Tips",
      "",
      "- Show absolute file paths.",
    ].join("\n"));

    const second = await handlers.get("before_agent_start")({
      prompt: "second turn",
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

test("keeps tips available when a user SOP has malformed frontmatter", async () => {
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
      prompt: "an unrelated request",
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
