import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import cslContextHooks, {
  formatSystemContext,
  isDesignFetchTool,
  loadConventions,
} from "../pi/extensions/csl-context-hooks.ts";

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "csl-pi-context-"));
  mkdirSync(join(root, "sops"), { recursive: true });
  writeFileSync(join(root, "standing-orders.md"), "# Standing Orders\n\n## Output\n\n- Prefer concise reports.\n");
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
  return { handlers, api: { on: (name, handler) => handlers.set(name, handler) } };
}

test("loads standing orders and formats their priority boundary", () => {
  const root = createFixture();
  try {
    const conventions = loadConventions(root);
    assert.match(conventions, /Prefer concise reports/);
    const context = formatSystemContext(conventions, [], []);
    assert.match(context, /higher-priority instructions or the user's more specific current request/);
    assert.match(context, /Prefer concise reports/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rebuilds Pi context from CSL_AGENT_KIT_HOME before every agent turn", async () => {
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

    writeFileSync(join(root, "standing-orders.md"), "# Standing Orders\n\n## Paths\n\n- Show absolute paths.\n");
    const second = await handlers.get("before_agent_start")({ prompt: "show a path", systemPrompt: "base prompt" }, {});
    assert.match(second.systemPrompt, /Show absolute paths/);
    assert.doesNotMatch(second.systemPrompt, /Prefer concise reports/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("Pi reports preserved legacy tips without treating them as standing orders", async () => {
  const root = mkdtempSync(join(tmpdir(), "csl-pi-legacy-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  mkdirSync(join(root, "tips"), { recursive: true });
  writeFileSync(join(root, "tips", "tips.json"), '{"version":1,"tips":[]}\n');
  const { api, handlers } = fakePi();
  try {
    cslContextHooks(api);
    const result = await handlers.get("before_agent_start")({ prompt: "hello", systemPrompt: "base" }, {});
    assert.match(result.systemPrompt, /Legacy tips detected/);
    assert.match(result.systemPrompt, /preserved and not promoted/);
    assert.doesNotMatch(result.systemPrompt, /Confirmed user standing orders/);

    writeFileSync(join(root, "standing-orders.md"), "# Standing Orders\n\n## Output\n\n- Keep answers concise.\n");
    const partialMigration = await handlers.get("before_agent_start")({ prompt: "hello", systemPrompt: "base" }, {});
    assert.match(partialMigration.systemPrompt, /Keep answers concise/);
    assert.match(partialMigration.systemPrompt, /Legacy tips detected/);
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
