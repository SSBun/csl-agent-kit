"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const agentHooks = require("../skills/meta/agent-hooks/scripts/agent-hooks.js");
const agentHooksRuntime = require("../skills/meta/agent-hooks/scripts/lib/runtime.js");
const agentHooksStore = require("../skills/meta/agent-hooks/scripts/lib/store.js");
const titleHook = require("../skills/meta/agent-hooks/scripts/refresh-tab-title.js");
const ruleValidator = require("../skills/meta/agent-hooks/scripts/validate-rules.js");
const codexProtocol = require("../skills/meta/agent-hooks/references/codex-protocol.json");
const sessionStartProtocols = require("../skills/meta/agent-hooks/references/session-start-protocols.json");

test("implements V1 three-valued collection and glob semantics", () => {
  const condition = {
    some: {
      path: "/changed_files",
      where: { path: "/path", op: "glob", value: "**/*.swift" },
    },
  };

  assert.equal(agentHooks.evaluateCondition(condition, { changed_files: null }).value, "unknown");
  assert.equal(agentHooks.evaluateCondition(condition, { changed_files: [] }).value, "false");
  assert.equal(agentHooks.evaluateCondition(condition, { changed_files: [{ path: "Foo.swift" }] }).value, "true");
  assert.equal(agentHooks.evaluateCondition(condition, { changed_files: [{ path: "Sources/Foo.swift" }] }).value, "true");
  assert.equal(agentHooks.evaluateCondition({ all: [] }, {}).value, "true");
  assert.equal(agentHooks.evaluateCondition({ all: [{ path: "/missing", op: "eq", value: 1 }, { path: "/value", op: "eq", value: 1 }] }, { value: 1 }).value, "unknown");
  assert.equal(agentHooks.evaluateCondition({ all: [{ path: "/missing", op: "eq", value: 1 }, { path: "/value", op: "eq", value: 2 }] }, { value: 1 }).value, "false");
  assert.equal(agentHooks.evaluateCondition({ path: "/a~1b/~0key", op: "eq", value: 3 }, { "a/b": { "~key": 3 } }).value, "true");
});

test("rejects unknown fields and non-segment double-star globs", () => {
  const parsed = agentHooks.parseMarkdown(`---
schema: agent-hooks/v1
event: after-tool
action: inject-prompt
enabled: true
unknown: true
when:
  path: /tool/name
  op: glob
  value: foo**bar
---
prompt
`);

  assert.equal(parsed.valid, false);
  assert.deepEqual(parsed.errors.map((error) => error.code), ["unknown-field", "glob-invalid"]);
});

test("validates optional single-line descriptions", () => {
  const valid = agentHooks.parseMarkdown("---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\ndescription: Load user context.\n---\nprompt\n");
  const multiline = agentHooks.parseMarkdown("---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\ndescription: |\n  first\n  second\n---\nprompt\n");
  const tooLong = agentHooks.parseMarkdown(`---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\ndescription: ${"x".repeat(161)}\n---\nprompt\n`);
  const unsafe = ["tab\tcell", "escape\u001b[31m", "next\u0085line", "next\u2028line", "next\u2029line"]
    .map((description) => agentHooks.parseMarkdown(`---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\ndescription: ${JSON.stringify(description)}\n---\nprompt\n`));

  assert.equal(valid.valid, true);
  assert.equal(valid.rule.description, "Load user context.");
  assert.deepEqual(multiline.errors.map((error) => error.code), ["description-format"]);
  assert.deepEqual(tooLong.errors.map((error) => error.code), ["description-length"]);
  assert.ok(unsafe.every((parsed) => parsed.errors.some((error) => error.code === "description-format")));
});

test("validates one or more trigger Markdown files with shared V1 parsing", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-validator-"));
  const valid = path.join(directory, "valid.md");
  const invalid = path.join(directory, "invalid.md");
  fs.writeFileSync(valid, "---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\n---\nprompt\n");
  fs.writeFileSync(invalid, "---\nschema: agent-hooks/v1\nevent: session-start\nevent: after-tool\naction: inject-prompt\n---\nprompt\n");
  const output = [];
  const errors = [];
  const io = { log: (line) => output.push(line), error: (line) => errors.push(line) };

  try {
    assert.equal(ruleValidator.run([valid], io), 0);
    assert.match(output.pop(), /valid\.md: valid$/);
    assert.equal(ruleValidator.run([valid, invalid], io), 1);
    assert.match(errors.pop(), /\[yaml-invalid\]/);
    assert.equal(ruleValidator.run([], io), 2);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI create, update, show, and list preserve descriptions", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-description-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };

  try {
    assert.equal(agentHooks.runCli(["create", "context", "--scope", "global", "--event", "session-start", "--action", "inject-prompt", "--description", "Load user context.", "--body", "prompt"], io), 0);
    output.length = 0;
    assert.equal(agentHooks.runCli(["list", "--scope", "global"], io), 0);
    assert.match(output[0], /^ID\tDESCRIPTION\t/);
    assert.match(output[1], /global:context\tLoad user context\./);

    output.length = 0;
    assert.equal(agentHooks.runCli(["show", "global:context", "--json"], io), 0);
    assert.equal(JSON.parse(output.pop()).description, "Load user context.");

    assert.equal(agentHooks.runCli(["update", "global:context", "--description", "Load current user context."], io), 0);
    output.length = 0;
    assert.equal(agentHooks.runCli(["show", "global:context", "--json"], io), 0);
    assert.equal(JSON.parse(output.pop()).description, "Load current user context.");

    assert.equal(agentHooks.runCli(["update", "global:context", "--clear-description"], io), 0);
    output.length = 0;
    assert.equal(agentHooks.runCli(["show", "global:context", "--json"], io), 0);
    assert.equal(JSON.parse(output.pop()).description, null);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("migrates legacy global and project Hook data to new paths and protocols", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-migration-"));
  const workspace = path.join(data, "workspace");
  const globalLegacy = path.join(data, "triggerify");
  const projectLegacy = path.join(workspace, ".csl-agent-kit", "triggerify");
  const previous = process.env.CSL_AGENT_KIT_HOME;
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };

  fs.mkdirSync(path.join(globalLegacy, "hooks"), { recursive: true });
  fs.mkdirSync(path.join(globalLegacy, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(globalLegacy, "hooks", "global.md"), "---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\n---\nprompt\n");
  fs.writeFileSync(path.join(globalLegacy, "scripts", "probe.js"), "#!/usr/bin/env node\nprocess.stdout.write(process.env.TRIGGERIFY_WORKSPACE || '');\n", { mode: 0o700 });
  fs.writeFileSync(path.join(globalLegacy, "config.json"), '{"schema":"triggerify.config/v1","disabledHooks":[]}\n');
  fs.mkdirSync(path.join(projectLegacy, "hooks"), { recursive: true });
  fs.mkdirSync(path.join(projectLegacy, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(projectLegacy, "hooks", "project.local.md"), "---\nschema: triggerify/v1\nevent: before-tool\naction: run-script\nscript: project.local.js\n---\n");
  fs.writeFileSync(path.join(projectLegacy, "scripts", "project.local.js"), "#!/usr/bin/env node\nprocess.exit(process.env.TRIGGERIFY_SCOPE ? 0 : 1);\n", { mode: 0o700 });
  fs.writeFileSync(path.join(workspace, ".gitignore"), ".csl-agent-kit/triggerify/hooks/*.local.md\n.csl-agent-kit/triggerify/scripts/*.local.*\n");
  process.env.CSL_AGENT_KIT_HOME = data;

  try {
    assert.equal(agentHooks.runCli(["list", "--scope", "all", "--workspace", workspace, "--json"], io), 0);
    const globalRoot = path.join(data, "hooks");
    const projectRoot = path.join(workspace, ".agents", "hooks");
    assert.equal(fs.existsSync(globalLegacy), false);
    assert.equal(fs.existsSync(projectLegacy), false);
    assert.match(fs.readFileSync(path.join(globalRoot, "global.md"), "utf8"), /schema: agent-hooks\/v1/);
    assert.match(fs.readFileSync(path.join(globalRoot, "scripts", "probe.js"), "utf8"), /AGENT_HOOKS_WORKSPACE/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(globalRoot, "config.json"), "utf8")).schema, "agent-hooks.config/v1");
    assert.match(fs.readFileSync(path.join(projectRoot, "project.local.md"), "utf8"), /schema: agent-hooks\/v1/);
    assert.match(fs.readFileSync(path.join(projectRoot, "scripts", "project.local.js"), "utf8"), /AGENT_HOOKS_SCOPE/);
    const ignored = fs.readFileSync(path.join(workspace, ".gitignore"), "utf8");
    assert.match(ignored, /\.agents\/hooks\/\*\.local\.md/);
    assert.doesNotMatch(ignored, /triggerify/);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("CLI creates local project rules and delete preserves scripts", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-"));
  const scripts = path.join(workspace, ".agents", "hooks", "scripts");
  const script = path.join(scripts, "check.local.sh");
  fs.mkdirSync(scripts, { recursive: true });
  fs.writeFileSync(script, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };

  try {
    assert.equal(agentHooks.runCli(["create", "check", "--workspace", workspace, "--event", "before-tool", "--action", "run-script", "--script", "check.local.sh"], io), 0);
    assert.equal(fs.existsSync(path.join(workspace, ".agents", "hooks", "check.local.md")), true);
    assert.match(fs.readFileSync(path.join(workspace, ".gitignore"), "utf8"), /hooks\/\*\.local\.md/);
    assert.equal(agentHooks.runCli(["delete", "project:check", "--workspace", workspace], io), 0);
    assert.equal(fs.existsSync(script), true);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("normalizes unknown changed files instead of guessing from tool input", () => {
  const payload = agentHooks.normalizePayload({
    hook_event_name: "PostToolUse",
    session_id: "session",
    tool_name: "apply_patch",
    tool_input: { command: "*** Update File: Sources/App.swift" },
  }, "codex", "after-tool", "/workspace");

  assert.equal(payload.changed_files, null);
  assert.equal(payload.tool.category, "file");
});

test("creates host-neutral standard events for external adapters", () => {
  const payload = agentHooks.createEvent({
    event: "after-tool",
    host: "pi",
    workspace: "/workspace",
    sessionId: "session",
    tool: { name: "write", category: "file", command: null, success: true },
    changedFiles: [{ path: "tasks/tasks.md", operation: "modified" }],
    nativeEvent: "tool_execution_end",
  });

  assert.equal(payload.host.name, "pi");
  assert.deepEqual(payload.changed_files, [{ path: "tasks/tasks.md", operation: "modified" }]);
  assert.equal(payload.native.event, "tool_execution_end");
});

test("normalizes all ten Codex events into complete golden payloads", () => {
  for (const [nativeEvent, fixture] of Object.entries(codexProtocol.events)) {
    const payload = agentHooks.normalizePayload({ hook_event_name: nativeEvent, session_id: "s", ...fixture.native }, "codex", fixture.event, "/workspace");
    assert.equal(payload.event, fixture.event);
    assert.deepEqual(Object.keys(payload), ["schema", "event", "host", "workspace", "session", "prompt", "tool", "permission", "compact", "subagent", "stop", "changed_files", "native"]);
    assert.deepEqual(agentHooks.CODEX_CAPABILITIES[fixture.event], fixture.capability);
    for (const [field, expected] of Object.entries(fixture.expected)) assert.deepEqual(payload[field], expected);
  }
});

test("supports verified session-start prompt injection on Claude Code and Pi", () => {
  for (const [host, fixture] of Object.entries(sessionStartProtocols.supported_hosts)) {
    assert.deepEqual(agentHooks.HOST_CAPABILITIES[host][fixture.agent_hooks_event], fixture.capability);
  }
  assert.equal(agentHooks.HOST_CAPABILITIES.cursor, undefined);
});

test("project list does not parse untrusted rule content and invalid rules remain recoverable", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-trust-"));
  const hooks = path.join(workspace, ".agents", "hooks");
  const hook = path.join(hooks, "broken.local.md");
  const replacement = path.join(workspace, "replacement.md");
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(hook, "---\nschema: agent-hooks/v1\nenabled: true\nunknown: true\n---\nbroken\n");
  fs.writeFileSync(replacement, "---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\nenabled: false\n---\nfixed\n");

  try {
    assert.equal(agentHooks.runCli(["list", "--scope", "project", "--workspace", workspace, "--json"], io), 0);
    const listed = JSON.parse(output.pop());
    assert.equal(listed[0].validation, "unavailable");
    assert.equal(listed[0].event, null);
    assert.equal(agentHooks.runCli(["disable", "project:broken", "--workspace", workspace], io), 0);
    assert.match(fs.readFileSync(hook, "utf8"), /enabled: false/);
    assert.equal(agentHooks.runCli(["update", "project:broken", "--workspace", workspace, "--from", replacement], io), 0);
    assert.match(fs.readFileSync(hook, "utf8"), /event: session-start/);
    fs.writeFileSync(hook, "not frontmatter\n");
    assert.equal(agentHooks.runCli(["disable", "project:broken", "--workspace", workspace], io), 0);
    assert.match(fs.readFileSync(hook, "utf8"), /^<!-- agent-hooks:disabled -->/);
    assert.equal(agentHooks.runCli(["show", "project:broken", "--workspace", workspace, "--json"], io), 1);
    assert.equal(JSON.parse(output.pop()).configured, "disabled");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("marks same-scope shared/local IDs invalid without choosing a winner", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-conflict-"));
  const hooks = path.join(workspace, ".agents", "hooks");
  const source = "---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nprompt\n";
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "same.md"), source);
  fs.writeFileSync(path.join(hooks, "same.local.md"), source);
  try {
    assert.equal(agentHooks.runCli(["list", "--scope", "project", "--workspace", workspace, "--json"], io), 0);
    const listed = JSON.parse(output.pop());
    assert.equal(listed.length, 2);
    assert.ok(listed.every((item) => item.validation === "invalid" && item.reasons.includes("id-conflict")));
    assert.equal(agentHooks.runCli(["disable", "project:same", "--workspace", workspace], io), 0);
    assert.match(fs.readFileSync(path.join(hooks, "same.md"), "utf8"), /enabled: false/);
    assert.match(fs.readFileSync(path.join(hooks, "same.local.md"), "utf8"), /enabled: false/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("rejects executable files without shebang and local create refuses gitignore symlinks", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-safety-"));
  const scripts = path.join(workspace, ".agents", "hooks", "scripts");
  const script = path.join(scripts, "bad.local.sh");
  const outside = path.join(workspace, "outside-ignore");
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };
  fs.mkdirSync(scripts, { recursive: true });
  fs.writeFileSync(script, "exit 0\n", { mode: 0o700 });

  try {
    assert.equal(agentHooks.runCli(["create", "bad", "--workspace", workspace, "--event", "before-tool", "--action", "run-script", "--script", "bad.local.sh"], io), 2);
    fs.writeFileSync(script, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    fs.writeFileSync(outside, "keep\n");
    fs.symlinkSync(outside, path.join(workspace, ".gitignore"));
    assert.equal(agentHooks.runCli(["create", "bad", "--workspace", workspace, "--event", "before-tool", "--action", "run-script", "--script", "bad.local.sh"], io), 2);
    assert.equal(fs.readFileSync(outside, "utf8"), "keep\n");
    assert.equal(fs.existsSync(path.join(workspace, ".agents", "hooks", "bad.local.md")), false);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("bounds regex execution and event runtime while preserving block short-circuit order", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-runtime-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "hooks", "scripts");
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "alpha.sh"), "#!/bin/sh\nprintf alpha >&2\nexit 2\n", { mode: 0o700 });
  fs.writeFileSync(path.join(scripts, "zed.sh"), "#!/bin/sh\nprintf zed >&2\nexit 2\n", { mode: 0o700 });
  for (const name of ["alpha", "zed"]) fs.writeFileSync(path.join(hooks, `${name}.md`), `---\nschema: agent-hooks/v1\nevent: before-tool\naction: run-script\nenabled: true\nscript: ${name}.sh\n---\n`);

  try {
    const started = Date.now();
    assert.equal(agentHooks.safeRegexTest("git\\s+commit", "git commit"), true);
    assert.equal(agentHooks.safeRegexTest("(a+)+$", `${"a".repeat(2048)}!`), undefined);
    assert.ok(Date.now() - started < 1000);
    const payload = agentHooks.normalizePayload({ hook_event_name: "PreToolUse", session_id: "s", tool_name: "Bash", tool_input: { command: "git commit" } }, "codex", "before-tool", data);
    const result = agentHooks.runEvent(payload, { host: "codex", workspace: data, eventBudgetMs: 2000 });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "alpha");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("maps script success, failure, timeout, signal, post-event exit two, and symlink escape", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-exits-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "hooks", "scripts");
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  const payload = (event) => agentHooks.normalizePayload({ hook_event_name: event === "before-tool" ? "PreToolUse" : "PostToolUse", session_id: "s", tool_name: "Bash" }, "codex", event, data);
  const writeRule = (name, event, script) => fs.writeFileSync(path.join(hooks, `${name}.md`), `---\nschema: agent-hooks/v1\nevent: ${event}\naction: run-script\nenabled: true\nscript: ${script}\n---\n`);

  try {
    const cases = [
      ["success", "#!/bin/sh\nexit 0\n", "before-tool", false, []],
      ["failure", "#!/bin/sh\nexit 3\n", "before-tool", false, ["global:failure:runtime-error"]],
      ["signal", "#!/bin/sh\nkill -TERM $$\n", "before-tool", false, ["global:signal:runtime-error"]],
      ["spawn", "#!/no/such/agent-hooks-interpreter\n", "before-tool", false, ["global:spawn:runtime-error"]],
      ["post-block", "#!/bin/sh\nexit 2\n", "after-tool", false, ["global:post-block:block-unsupported"]],
    ];
    for (const [name, source, event, blocked, diagnostics] of cases) {
      for (const file of fs.readdirSync(hooks).filter((file) => file.endsWith(".md"))) fs.unlinkSync(path.join(hooks, file));
      fs.writeFileSync(path.join(scripts, `${name}.sh`), source, { mode: 0o700 });
      writeRule(name, event, `${name}.sh`);
      const result = agentHooks.runEvent(payload(event), { host: "codex", workspace: data, eventBudgetMs: 2000 });
      assert.equal(result.blocked, blocked);
      assert.deepEqual(result.diagnostics, diagnostics);
    }

    for (const file of fs.readdirSync(hooks).filter((file) => file.endsWith(".md"))) fs.unlinkSync(path.join(hooks, file));
    fs.writeFileSync(path.join(scripts, "timeout.js"), "#!/usr/bin/env node\nsetTimeout(() => {}, 2000);\n", { mode: 0o700 });
    writeRule("timeout", "before-tool", "timeout.js");
    const timed = agentHooks.runEvent(payload("before-tool"), { host: "codex", workspace: data, eventBudgetMs: 100 });
    assert.equal(timed.blocked, false);
    assert.deepEqual(timed.diagnostics, ["global:timeout:runtime-error"]);

    for (const file of fs.readdirSync(hooks).filter((file) => file.endsWith(".md"))) fs.unlinkSync(path.join(hooks, file));
    const outside = path.join(data, "outside.sh");
    fs.writeFileSync(outside, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    fs.symlinkSync(outside, path.join(scripts, "escape.sh"));
    writeRule("escape", "before-tool", "escape.sh");
    const escaped = agentHooks.runEvent(payload("before-tool"), { host: "codex", workspace: data });
    assert.equal(escaped.blocked, false);
    assert.deepEqual(escaped.diagnostics, ["global:escape:script-escape"]);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("runs the Swift changed-file and commit-command RFC examples end to end", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-examples-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "hooks", "scripts");
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "probe.sh"), "#!/bin/sh\nexit 2\n", { mode: 0o700 });
  fs.writeFileSync(path.join(hooks, "commit.md"), "---\nschema: agent-hooks/v1\nevent: before-tool\naction: run-script\nenabled: true\nscript: probe.sh\nwhen:\n  all:\n    - path: /tool/category\n      op: eq\n      value: shell\n    - path: /tool/command\n      op: regex\n      value: '(^|[;&|]\\s*)git\\s+commit(?:\\s|$)'\n---\n");
  fs.writeFileSync(path.join(hooks, "swift.md"), "---\nschema: agent-hooks/v1\nevent: after-tool\naction: run-script\nenabled: true\nscript: probe.sh\nwhen:\n  some:\n    path: /changed_files\n    where:\n      all:\n        - path: /operation\n          op: in\n          value: [created, modified]\n        - path: /path\n          op: glob\n          value: '**/*.swift'\n---\n");
  try {
    const commit = agentHooks.normalizePayload({ hook_event_name: "PreToolUse", session_id: "s", tool_name: "Bash", tool_input: { command: "git commit -m test" } }, "codex", "before-tool", data);
    assert.equal(agentHooks.runEvent(commit, { host: "codex", workspace: data, eventBudgetMs: 2000 }).blocked, true);
    const swift = agentHooks.normalizePayload({ hook_event_name: "PostToolUse", session_id: "s", tool_name: "apply_patch" }, "codex", "after-tool", data);
    swift.changed_files = [{ path: "Sources/App.swift", operation: "modified" }];
    assert.deepEqual(agentHooks.runEvent(swift, { host: "codex", workspace: data, eventBudgetMs: 2000 }).diagnostics, ["global:swift:block-unsupported"]);
    swift.changed_files = null;
    assert.deepEqual(agentHooks.runEvent(swift, { host: "codex", workspace: data, eventBudgetMs: 2000 }).diagnostics, ["global:swift:condition-unknown"]);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("dispatch injects prompt context once and suppresses duplicate diagnostics per session", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-dispatch-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "context.md"), "---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nLoad context.\n");
  fs.writeFileSync(path.join(hooks, "invalid.md"), "not frontmatter\n");
  const makeIo = () => {
    const output = { stdout: "", stderr: "" };
    return { output, io: { stdout: { write: (value) => { output.stdout += value; } }, stderr: { write: (value) => { output.stderr += value; } } } };
  };

  try {
    const native = JSON.stringify({ hook_event_name: "SessionStart", session_id: "same-session", cwd: data });
    const first = makeIo();
    assert.equal(agentHooks.dispatch(native, { PLUGIN_ROOT: "/plugin" }, first.io), 0);
    assert.match(first.output.stdout, /Load context/);
    assert.match(first.output.stderr, /frontmatter-invalid/);
    const second = makeIo();
    assert.equal(agentHooks.dispatch(native, { PLUGIN_ROOT: "/plugin" }, second.io), 0);
    assert.equal(second.output.stderr, "");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("dispatch injects global session prompts for Claude Code", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-claude-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "directive.md"), "---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nPersistent directive.\n");
  const output = { stdout: "", stderr: "" };
  const io = {
    stdout: { write: (value) => { output.stdout += value; } },
    stderr: { write: (value) => { output.stderr += value; } },
  };

  try {
    const native = JSON.stringify({ hook_event_name: "SessionStart", session_id: "claude", cwd: data });
    assert.equal(agentHooks.dispatch(native, { CLAUDE_PLUGIN_ROOT: "/plugin" }, io), 0);
    assert.match(output.stdout, /Persistent directive/);
    assert.equal(output.stderr, "");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("dispatch maps PermissionRequest and PreCompact blocks to native JSON", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-native-block-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "hooks", "scripts");
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "deny.sh"), "#!/bin/sh\nprintf denied >&2\nexit 2\n", { mode: 0o700 });
  const capture = () => {
    const output = { stdout: "", stderr: "" };
    return { output, io: { stdout: { write: (value) => { output.stdout += value; } }, stderr: { write: (value) => { output.stderr += value; } } } };
  };
  try {
    for (const [nativeEvent, event] of [["PermissionRequest", "permission-request"], ["PreCompact", "before-compact"]]) {
      for (const file of fs.readdirSync(hooks).filter((file) => file.endsWith(".md"))) fs.unlinkSync(path.join(hooks, file));
      fs.writeFileSync(path.join(hooks, `${event}.md`), `---\nschema: agent-hooks/v1\nevent: ${event}\naction: run-script\nenabled: true\nscript: deny.sh\n---\n`);
      const captured = capture();
      assert.equal(agentHooks.dispatch(JSON.stringify({ hook_event_name: nativeEvent, session_id: nativeEvent, cwd: data }), { PLUGIN_ROOT: "/plugin" }, captured.io), 0);
      const response = JSON.parse(captured.output.stdout);
      if (nativeEvent === "PermissionRequest") assert.equal(response.hookSpecificOutput.decision.behavior, "deny");
      else assert.equal(response.continue, false);
      assert.equal(captured.output.stderr, "");
    }
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("event deadline covers discovery and stops expired collection evaluation", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-budget-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "context.md"), "---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nprompt\n");
  try {
    const payload = agentHooks.normalizePayload({ hook_event_name: "SessionStart", session_id: "s" }, "codex", "session-start", data);
    assert.deepEqual(agentHooks.runEvent(payload, { host: "codex", workspace: data, eventBudgetMs: -1 }).diagnostics, ["global:event-budget-exhausted"]);
    const condition = { some: { path: "/items", where: { path: "/value", op: "eq", value: true } } };
    assert.equal(agentHooks.evaluateCondition(condition, { items: Array.from({ length: 100000 }, () => ({ value: false })) }, Date.now() - 1).value, "unknown");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("run-script inject-output surfaces stdout as a prompt on session-start", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-inject-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "hooks", "scripts");
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "emit.js"), "#!/usr/bin/env node\nprocess.stdout.write('dynamic context');\n", { mode: 0o700 });
  fs.writeFileSync(path.join(hooks, "emit.md"), "---\nschema: agent-hooks/v1\nevent: session-start\naction: run-script\nenabled: true\nscript: emit.js\ninject-output: true\n---\n");
  try {
    const payload = agentHooks.normalizePayload({ hook_event_name: "SessionStart", session_id: "s" }, "pi", "session-start", data);
    const result = agentHooks.runEvent(payload, { host: "pi", workspace: data });
    assert.deepEqual(result.diagnostics, []);
    const prompt = result.prompts.find((item) => item.id === "global:emit");
    assert.ok(prompt);
    assert.equal(prompt.content, "dynamic context");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("run-script without inject-output keeps stdout out of prompts", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-no-inject-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "hooks", "scripts");
  const hooks = path.join(data, "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "emit.js"), "#!/usr/bin/env node\nprocess.stdout.write('ignored');\n", { mode: 0o700 });
  fs.writeFileSync(path.join(hooks, "emit.md"), "---\nschema: agent-hooks/v1\nevent: session-start\naction: run-script\nenabled: true\nscript: emit.js\n---\n");
  try {
    const payload = agentHooks.normalizePayload({ hook_event_name: "SessionStart", session_id: "s" }, "pi", "session-start", data);
    const result = agentHooks.runEvent(payload, { host: "pi", workspace: data });
    assert.deepEqual(result.diagnostics, []);
    assert.equal(result.prompts.some((item) => item.id === "global:emit"), false);
    assert.equal(result.prompts.some((item) => item.content.includes("ignored")), false);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("inject-output is validated as boolean and rejected on inject-prompt", () => {
  const valid = agentHooks.parseMarkdown("---\nschema: agent-hooks/v1\nevent: session-start\naction: run-script\nscript: s.js\ninject-output: true\n---\n");
  const wrongType = agentHooks.parseMarkdown("---\nschema: agent-hooks/v1\nevent: session-start\naction: run-script\nscript: s.js\ninject-output: yes\n---\n");
  const onInject = agentHooks.parseMarkdown("---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\ninject-output: true\n---\nbody\n");
  assert.equal(valid.valid, true);
  assert.equal(valid.rule["inject-output"], true);
  assert.deepEqual(wrongType.errors.map((error) => error.code), ["inject-output-type"]);
  assert.deepEqual(onInject.errors.map((error) => error.code), ["inject-output-unexpected"]);
});

test("inner scope injects built-in, user, and project agent-rules.md in order", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-inner-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  const builtInRule = "display every local file or directory reference as its full absolute path";
  process.env.CSL_AGENT_KIT_HOME = data;
  try {
    // Built-in rules require no user or project file and reach every supported session host.
    for (const host of ["codex", "claude-code", "pi"]) {
      const payload = agentHooks.createEvent({ event: "session-start", host, workspace: data });
      const result = agentHooks.runEvent(payload, { host, workspace: data });
      const prompt = result.prompts.find((item) => item.id === "inner:agent-rules");
      assert.ok(prompt, `expected inner:agent-rules prompt for ${host}`);
      assert.match(prompt.content, /^## Agent Rules\n/);
      assert.ok(prompt.content.includes(builtInRule));
      assert.match(prompt.content, /absolute `file:\/\/` URL/);
    }

    const cursorPayload = agentHooks.createEvent({ event: "session-start", host: "cursor", workspace: data });
    const cursor = agentHooks.runEvent(cursorPayload, { host: "cursor", workspace: data });
    assert.equal(cursor.prompts.length, 0);
    assert.ok(cursor.diagnostics.includes("capability-unsupported"));

    // Only agent-rules.md is a user source; the legacy name is ignored.
    fs.writeFileSync(path.join(data, "simple-rules.md"), "- legacy rule\n");
    let payload = agentHooks.createEvent({ event: "session-start", host: "pi", workspace: data });
    let result = agentHooks.runEvent(payload, { host: "pi", workspace: data });
    let prompt = result.prompts.find((item) => item.id === "inner:agent-rules");
    assert.doesNotMatch(prompt.content, /legacy rule/);

    const userFile = path.join(data, "agent-rules.md");
    const userRules = "- user rule one\n- user rule two\n";
    const projectFile = path.join(data, ".agents", "agent-rules.md");
    const projectRules = "- project rule\n";
    fs.writeFileSync(userFile, userRules);
    fs.mkdirSync(path.dirname(projectFile), { recursive: true });
    fs.writeFileSync(projectFile, projectRules);

    payload = agentHooks.createEvent({ event: "session-start", host: "pi", workspace: data });
    result = agentHooks.runEvent(payload, { host: "pi", workspace: data });
    prompt = result.prompts.find((item) => item.id === "inner:agent-rules");
    const builtInIndex = prompt.content.indexOf(builtInRule);
    const userIndex = prompt.content.indexOf("user rule one");
    const projectIndex = prompt.content.indexOf("project rule");
    assert.ok(builtInIndex >= 0 && builtInIndex < userIndex && userIndex < projectIndex);
    assert.equal(fs.readFileSync(userFile, "utf8"), userRules);
    assert.equal(fs.readFileSync(projectFile, "utf8"), projectRules);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("inner workspace workflow gates inject the CSL Agent Kit contract on supported session starts", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-workspace-gates-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const io = { log() {}, error() {} };
  try {
    for (const host of ["codex", "claude-code", "pi"]) {
      const payload = agentHooks.createEvent({ event: "session-start", host, workspace: data });
      const result = agentHooks.runEvent(payload, { host, workspace: data });
      const prompt = result.prompts.find((item) => item.id === "inner:workspace-workflow-gates");
      assert.ok(prompt, `expected CSL Agent Kit contract for ${host}`);
      assert.match(prompt.content, /^CSL AGENT KIT CONTRACT ACTIVE/);
      assert.match(prompt.content, /Existing user rules and the current explicit request take precedence/);
      assert.match(prompt.content, /Before any user-requested file creation, modification, move, rename, or deletion/);
      assert.match(prompt.content, /task-lifecycle writes .* are the bootstrap exception/);
      assert.match(prompt.content, /align a concise Task Target with the user/);
      assert.match(prompt.content, /consult only the Context relevant to the current outcome/);
      assert.match(prompt.content, /apply every relevant Lesson/);
      assert.match(prompt.content, /Implement the minimum solution/);
      assert.doesNotMatch(prompt.content, /Task Target Alignment Protocol/);
      assert.doesNotMatch(prompt.content, /task_focus/);
      assert.doesNotMatch(prompt.content, /\$(?:task|task-plan|task-queue|task-context|task-lessons)/);
    }

    assert.equal(agentHooks.runCli(["disable", "inner:workspace-workflow-gates"], io), 0);
    const payload = agentHooks.createEvent({ event: "session-start", host: "pi", workspace: data });
    assert.equal(
      agentHooks.runEvent(payload, { host: "pi", workspace: data }).prompts.some((item) => item.id === "inner:workspace-workflow-gates"),
      false,
    );
    assert.equal(agentHooks.runCli(["enable", "inner:workspace-workflow-gates"], io), 0);

    const cursorPayload = agentHooks.createEvent({ event: "session-start", host: "cursor", workspace: data });
    const cursor = agentHooks.runEvent(cursorPayload, { host: "cursor", workspace: data });
    assert.equal(cursor.prompts.length, 0);
    assert.ok(cursor.diagnostics.includes("capability-unsupported"));
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("inner hooks default enabled and persist user disable/enable state", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-inner-config-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const output = [];
  const errors = [];
  const io = { log: (line) => output.push(line), error: (line) => errors.push(line) };

  try {
    assert.equal(agentHooks.runCli(["show", "inner:agent-rules", "--host", "pi", "--json"], io), 0);
    let status = JSON.parse(output.pop());
    assert.equal(status.default, "enabled");
    assert.equal(status.override, "none");
    assert.equal(status.configured, "enabled");
    assert.equal(status.effective, "active");

    assert.equal(agentHooks.runCli(["disable", "inner:agent-rules"], io), 0);
    const configFile = path.join(data, "hooks", "config.json");
    assert.deepEqual(JSON.parse(fs.readFileSync(configFile, "utf8")), {
      schema: "agent-hooks.config/v1",
      disabledHooks: ["inner:agent-rules"],
    });
    assert.equal(fs.statSync(configFile).mode & 0o777, 0o600);

    assert.equal(agentHooks.runCli(["list", "--scope", "inner", "--host", "pi", "--json"], io), 0);
    const inner = JSON.parse(output.pop());
    status = inner.find((item) => item.id === "inner:agent-rules");
    assert.equal(status.override, "disabled");
    assert.equal(status.configured, "disabled");
    assert.equal(status.effective, "inactive");
    assert.ok(status.reasons.includes("inner-disabled-by-user"));
    const titleStatus = inner.find((item) => item.id === "inner:refresh-tab-title");
    assert.equal(titleStatus.configured, "enabled");
    assert.equal(titleStatus.validation, "valid");
    assert.equal(titleStatus.effective, "active");

    fs.writeFileSync(path.join(data, "agent-rules.md"), "- enabled again\n");
    let payload = agentHooks.createEvent({ event: "session-start", host: "pi", workspace: data });
    assert.equal(agentHooks.runEvent(payload, { host: "pi", workspace: data }).prompts.some((item) => item.id === "inner:agent-rules"), false);

    assert.equal(agentHooks.runCli(["enable", "inner:agent-rules"], io), 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(configFile, "utf8")).disabledHooks, []);
    payload = agentHooks.createEvent({ event: "session-start", host: "pi", workspace: data });
    assert.equal(agentHooks.runEvent(payload, { host: "pi", workspace: data }).prompts.some((item) => item.id === "inner:agent-rules"), true);

    const hookSettings = { "inner:refresh-tab-title": { model: "openai-codex/gpt-5.4-mini" } };
    fs.writeFileSync(configFile, `${JSON.stringify({ schema: "agent-hooks.config/v1", disabledHooks: [], hookSettings })}\n`);
    assert.equal(agentHooks.runCli(["disable", "inner:agent-rules"], io), 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(configFile, "utf8")).hookSettings, hookSettings);
    assert.deepEqual(
      agentHooksStore.discover("inner", data).find((entry) => entry.id === "inner:refresh-tab-title").hookConfig,
      hookSettings["inner:refresh-tab-title"],
    );
    assert.equal(agentHooks.runCli(["enable", "inner:agent-rules"], io), 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(configFile, "utf8")).hookSettings, hookSettings);

    const hooks = path.join(data, "hooks");
    fs.mkdirSync(hooks, { recursive: true });
    fs.writeFileSync(path.join(hooks, "global.md"), "---\nschema: agent-hooks/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nglobal survives\n");
    fs.writeFileSync(configFile, "{ invalid\n");
    const invalid = agentHooks.runEvent(payload, { host: "pi", workspace: data });
    assert.ok(invalid.prompts.some((item) => item.id === "global:global"));
    assert.ok(invalid.diagnostics.includes("inner:config-invalid"));
    assert.equal(invalid.prompts.some((item) => item.id === "inner:agent-rules"), false);

    assert.equal(agentHooks.runCli(["show", "inner:agent-rules", "--host", "pi", "--json"], io), 1);
    status = JSON.parse(output.pop());
    assert.equal(status.override, "invalid");
    assert.equal(status.configured, "unavailable");
    assert.equal(status.effective, "inactive");
    assert.ok(status.reasons.includes("inner-config-invalid"));
    assert.equal(agentHooks.runCli(["disable", "inner:agent-rules"], io), 2);
    assert.ok(errors.pop().includes("invalid inner hook config"));
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("runtime passes only the current hook settings and adapter input without changing the event payload", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-hook-config-"));
  const scripts = path.join(workspace, ".agents", "hooks", "scripts");
  fs.mkdirSync(scripts, { recursive: true });
  fs.writeFileSync(path.join(scripts, "emit-config.js"), `#!/usr/bin/env node
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
process.stdout.write(JSON.stringify({
  config: JSON.parse(process.env.AGENT_HOOKS_HOOK_CONFIG),
  hookInput: JSON.parse(process.env.AGENT_HOOKS_HOOK_INPUT),
  hookId: process.env.AGENT_HOOKS_HOOK_ID,
  prompt: payload.prompt,
}));
`, { mode: 0o700 });

  try {
    const entry = {
      id: "project:emit-config",
      scope: "project",
      hookConfig: { model: "openai-codex/gpt-5.4-mini" },
      rule: { action: "run-script", script: "emit-config.js", timeout: 5 },
    };
    const payload = agentHooks.createEvent({ event: "prompt-submit", host: "pi", workspace, prompt: "original prompt" });
    const hookInput = { sessionContext: "User: original task\n\nAssistant: working" };
    const result = agentHooksRuntime.executeScript(entry, payload, workspace, 5_000, hookInput);
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {
      config: entry.hookConfig,
      hookInput,
      hookId: entry.id,
      prompt: "original prompt",
    });
    assert.equal(titleHook.contextFromEnv({ AGENT_HOOKS_HOOK_INPUT: JSON.stringify(hookInput) }), hookInput.sessionContext);
    assert.equal(titleHook.contextFromEnv({ AGENT_HOOKS_HOOK_INPUT: "invalid" }), "");
    assert.equal(titleHook.modelFromConfig({ AGENT_HOOKS_HOOK_CONFIG: JSON.stringify(entry.hookConfig) }), "openai-codex/gpt-5.4-mini");
    assert.equal(titleHook.modelFromConfig({ AGENT_HOOKS_HOOK_CONFIG: "{}" }), "deepseek/deepseek-v4-flash");
    assert.equal(titleHook.modelFromConfig({ AGENT_HOOKS_HOOK_CONFIG: '{"model":"bad model"}' }), "deepseek/deepseek-v4-flash");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("title hook publishes a manual refresh failure result", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-title-result-"));
  const script = path.join(__dirname, "../skills/meta/agent-hooks/scripts/refresh-tab-title.js");
  const requestId = "manual-request";
  try {
    const result = spawnSync(process.execPath, [script], {
      input: JSON.stringify({ prompt: "", workspace: data }),
      encoding: "utf8",
      env: {
        ...process.env,
        CSL_AGENT_KIT_HOME: data,
        AGENT_HOOKS_HOOK_INPUT: JSON.stringify({ requestId }),
      },
    });
    assert.equal(result.status, 0);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(data, "hooks", ".tab-title", `${requestId}.result.json`), "utf8")),
      { ok: false, changed: false, reason: "missing-prompt" },
    );
  } finally {
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("title hook ignores internal compaction continuation prompts", () => {
  assert.equal(titleHook.isInternalCompactionPrompt("Compaction completed. Continue."), true);
  assert.equal(titleHook.isInternalCompactionPrompt("Improve compaction behavior"), false);
});

test("title hook requires Chinese core-intent titles while allowing technical terms", () => {
  assert.equal(titleHook.cleanModelTitle("KEEP_CURRENT_TITLE"), "");
  assert.equal(titleHook.cleanModelTitle("Commit these changes"), "");
  assert.equal(titleHook.cleanModelTitle("Run the tests again"), "");
  assert.equal(titleHook.buildTitle({}, "/tmp/app", ""), null);
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "简洁会话标题"), "简洁会话标题");
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "Concise tab titles"), null);
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "Authentication cache invalidation behavior 中文"), null);
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "项目 · 会话标题"), null);
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "stable main task: Commit focused git changes with conventional message"), null);
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "R1: NOTE:"), null);
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "认证 cache"), "认证 cache");
  assert.equal(titleHook.buildTitle({}, "/tmp/app", "GPT 5 标题"), "GPT 5 标题");
  assert.ok(Array.from(titleHook.cleanModelTitle("界".repeat(100))).length <= 24);

  const home = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-saved-title-"));
  const previousHome = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = home;
  try {
    assert.equal(titleHook.preservedTitle("/dev/ttys999", "/tmp/app"), "");
    titleHook.rememberTitle("/dev/ttys999", "/tmp/app", "app · Concise tab titles");
    assert.equal(titleHook.preservedTitle("/dev/ttys999", "/tmp/app"), "");
    titleHook.rememberTitle("/dev/ttys999", "/tmp/app", "Concise tab titles");
    assert.equal(titleHook.preservedTitle("/dev/ttys999", "/tmp/app"), "");
    titleHook.rememberTitle("/dev/ttys999", "/tmp/app", "简洁会话标题");
    assert.equal(titleHook.preservedTitle("/dev/ttys999", "/tmp/app"), "简洁会话标题");
    titleHook.rememberTitle("/dev/ttys999", "/tmp/app", "认证 cache");
    assert.equal(titleHook.preservedTitle("/dev/ttys999", "/tmp/app"), "认证 cache");
    assert.equal(titleHook.preservedTitle("/dev/ttys999", "/tmp/other"), "");
    const input = { prompt: "fix title", tty: "/dev/ttys999", workspace: "/tmp/app" };
    assert.equal(titleHook.generatedTitleAction(input, ""), null);
    assert.equal(titleHook.generatedTitleAction(input, "KEEP_CURRENT_TITLE"), null);
    assert.equal(titleHook.generatedTitleAction(input, "Concise tab titles"), null);
    assert.deepEqual(titleHook.generatedTitleAction(input, "认证 cache"), {
      title: "认证 cache",
      remember: false,
    });
    assert.equal(titleHook.titleModelInput(input), "User: fix title");
    assert.equal(
      titleHook.titleModelInput({ ...input, sessionContext: "User: Build auth\nAssistant: Working\nUser: commit" }),
      "User: Build auth\nAssistant: Working\nUser: commit",
    );
  } finally {
    if (previousHome === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previousHome;
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("CLI keeps inner hook source immutable", () => {
  const errors = [];
  const io = { log() {}, error: (message) => errors.push(message) };
  const cases = [
    ["create", "x", "--event", "session-start", "--action", "inject-prompt", "--scope", "inner"],
    ["update", "inner:agent-rules", "--description", "x"],
    ["delete", "inner:agent-rules"],
  ];
  for (const argv of cases) {
    errors.length = 0;
    const code = agentHooks.runCli(argv, io);
    assert.equal(code, 2, `expected exit 2 for ${argv[0]}`);
    assert.ok(errors.some((message) => /read-only/.test(message)), `expected read-only error for ${argv[0]}, got ${errors.join("; ")}`);
  }
});
