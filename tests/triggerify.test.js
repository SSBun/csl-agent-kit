"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const triggerify = require("../skills/triggerify/scripts/triggerify.js");
const codexProtocol = require("../skills/triggerify/references/codex-protocol.json");
const sessionStartProtocols = require("../skills/triggerify/references/session-start-protocols.json");

test("implements V1 three-valued collection and glob semantics", () => {
  const condition = {
    some: {
      path: "/changed_files",
      where: { path: "/path", op: "glob", value: "**/*.swift" },
    },
  };

  assert.equal(triggerify.evaluateCondition(condition, { changed_files: null }).value, "unknown");
  assert.equal(triggerify.evaluateCondition(condition, { changed_files: [] }).value, "false");
  assert.equal(triggerify.evaluateCondition(condition, { changed_files: [{ path: "Foo.swift" }] }).value, "true");
  assert.equal(triggerify.evaluateCondition(condition, { changed_files: [{ path: "Sources/Foo.swift" }] }).value, "true");
  assert.equal(triggerify.evaluateCondition({ all: [] }, {}).value, "true");
  assert.equal(triggerify.evaluateCondition({ all: [{ path: "/missing", op: "eq", value: 1 }, { path: "/value", op: "eq", value: 1 }] }, { value: 1 }).value, "unknown");
  assert.equal(triggerify.evaluateCondition({ all: [{ path: "/missing", op: "eq", value: 1 }, { path: "/value", op: "eq", value: 2 }] }, { value: 1 }).value, "false");
  assert.equal(triggerify.evaluateCondition({ path: "/a~1b/~0key", op: "eq", value: 3 }, { "a/b": { "~key": 3 } }).value, "true");
});

test("rejects unknown fields and non-segment double-star globs", () => {
  const parsed = triggerify.parseMarkdown(`---
schema: triggerify/v1
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
  const valid = triggerify.parseMarkdown("---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\ndescription: Load user context.\n---\nprompt\n");
  const multiline = triggerify.parseMarkdown("---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\ndescription: |\n  first\n  second\n---\nprompt\n");
  const tooLong = triggerify.parseMarkdown(`---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\ndescription: ${"x".repeat(161)}\n---\nprompt\n`);
  const unsafe = ["tab\tcell", "escape\u001b[31m", "next\u0085line", "next\u2028line", "next\u2029line"]
    .map((description) => triggerify.parseMarkdown(`---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\ndescription: ${JSON.stringify(description)}\n---\nprompt\n`));

  assert.equal(valid.valid, true);
  assert.equal(valid.rule.description, "Load user context.");
  assert.deepEqual(multiline.errors.map((error) => error.code), ["description-format"]);
  assert.deepEqual(tooLong.errors.map((error) => error.code), ["description-length"]);
  assert.ok(unsafe.every((parsed) => parsed.errors.some((error) => error.code === "description-format")));
});

test("CLI create, update, show, and list preserve descriptions", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-description-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };

  try {
    assert.equal(triggerify.runCli(["create", "context", "--scope", "global", "--event", "session-start", "--action", "inject-prompt", "--description", "Load user context.", "--body", "prompt"], io), 0);
    output.length = 0;
    assert.equal(triggerify.runCli(["list", "--scope", "global"], io), 0);
    assert.match(output[0], /^ID\tDESCRIPTION\t/);
    assert.match(output[1], /global:context\tLoad user context\./);

    output.length = 0;
    assert.equal(triggerify.runCli(["show", "global:context", "--json"], io), 0);
    assert.equal(JSON.parse(output.pop()).description, "Load user context.");

    assert.equal(triggerify.runCli(["update", "global:context", "--description", "Load current user context."], io), 0);
    output.length = 0;
    assert.equal(triggerify.runCli(["show", "global:context", "--json"], io), 0);
    assert.equal(JSON.parse(output.pop()).description, "Load current user context.");

    assert.equal(triggerify.runCli(["update", "global:context", "--clear-description"], io), 0);
    output.length = 0;
    assert.equal(triggerify.runCli(["show", "global:context", "--json"], io), 0);
    assert.equal(JSON.parse(output.pop()).description, null);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("CLI creates local project rules and delete preserves scripts", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-"));
  const scripts = path.join(workspace, ".csl-agent-kit", "triggerify", "scripts");
  const script = path.join(scripts, "check.local.sh");
  fs.mkdirSync(scripts, { recursive: true });
  fs.writeFileSync(script, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };

  try {
    assert.equal(triggerify.runCli(["create", "check", "--workspace", workspace, "--event", "before-tool", "--action", "run-script", "--script", "check.local.sh"], io), 0);
    assert.equal(fs.existsSync(path.join(workspace, ".csl-agent-kit", "triggerify", "hooks", "check.local.md")), true);
    assert.match(fs.readFileSync(path.join(workspace, ".gitignore"), "utf8"), /hooks\/\*\.local\.md/);
    assert.equal(triggerify.runCli(["delete", "project:check", "--workspace", workspace], io), 0);
    assert.equal(fs.existsSync(script), true);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("normalizes unknown changed files instead of guessing from tool input", () => {
  const payload = triggerify.normalizePayload({
    hook_event_name: "PostToolUse",
    session_id: "session",
    tool_name: "apply_patch",
    tool_input: { command: "*** Update File: Sources/App.swift" },
  }, "codex", "after-tool", "/workspace");

  assert.equal(payload.changed_files, null);
  assert.equal(payload.tool.category, "file");
});

test("normalizes all ten Codex events into complete golden payloads", () => {
  for (const [nativeEvent, fixture] of Object.entries(codexProtocol.events)) {
    const payload = triggerify.normalizePayload({ hook_event_name: nativeEvent, session_id: "s", ...fixture.native }, "codex", fixture.event, "/workspace");
    assert.equal(payload.event, fixture.event);
    assert.deepEqual(Object.keys(payload), ["schema", "event", "host", "workspace", "session", "prompt", "tool", "permission", "compact", "subagent", "stop", "changed_files", "native"]);
    assert.deepEqual(triggerify.CODEX_CAPABILITIES[fixture.event], fixture.capability);
    for (const [field, expected] of Object.entries(fixture.expected)) assert.deepEqual(payload[field], expected);
  }
});

test("supports verified session-start prompt injection on Claude Code and Pi", () => {
  for (const [host, fixture] of Object.entries(sessionStartProtocols.supported_hosts)) {
    assert.deepEqual(triggerify.HOST_CAPABILITIES[host][fixture.triggerify_event], fixture.capability);
  }
  assert.equal(triggerify.HOST_CAPABILITIES.cursor, undefined);
});

test("project list does not parse untrusted rule content and invalid rules remain recoverable", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-trust-"));
  const hooks = path.join(workspace, ".csl-agent-kit", "triggerify", "hooks");
  const hook = path.join(hooks, "broken.local.md");
  const replacement = path.join(workspace, "replacement.md");
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(hook, "---\nschema: triggerify/v1\nenabled: true\nunknown: true\n---\nbroken\n");
  fs.writeFileSync(replacement, "---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\nenabled: false\n---\nfixed\n");

  try {
    assert.equal(triggerify.runCli(["list", "--scope", "project", "--workspace", workspace, "--json"], io), 0);
    const listed = JSON.parse(output.pop());
    assert.equal(listed[0].validation, "unavailable");
    assert.equal(listed[0].event, null);
    assert.equal(triggerify.runCli(["disable", "project:broken", "--workspace", workspace], io), 0);
    assert.match(fs.readFileSync(hook, "utf8"), /enabled: false/);
    assert.equal(triggerify.runCli(["update", "project:broken", "--workspace", workspace, "--from", replacement], io), 0);
    assert.match(fs.readFileSync(hook, "utf8"), /event: session-start/);
    fs.writeFileSync(hook, "not frontmatter\n");
    assert.equal(triggerify.runCli(["disable", "project:broken", "--workspace", workspace], io), 0);
    assert.match(fs.readFileSync(hook, "utf8"), /^<!-- triggerify:disabled -->/);
    assert.equal(triggerify.runCli(["show", "project:broken", "--workspace", workspace, "--json"], io), 1);
    assert.equal(JSON.parse(output.pop()).configured, "disabled");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("marks same-scope shared/local IDs invalid without choosing a winner", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-conflict-"));
  const hooks = path.join(workspace, ".csl-agent-kit", "triggerify", "hooks");
  const source = "---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nprompt\n";
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "same.md"), source);
  fs.writeFileSync(path.join(hooks, "same.local.md"), source);
  try {
    assert.equal(triggerify.runCli(["list", "--scope", "project", "--workspace", workspace, "--json"], io), 0);
    const listed = JSON.parse(output.pop());
    assert.equal(listed.length, 2);
    assert.ok(listed.every((item) => item.validation === "invalid" && item.reasons.includes("id-conflict")));
    assert.equal(triggerify.runCli(["disable", "project:same", "--workspace", workspace], io), 0);
    assert.match(fs.readFileSync(path.join(hooks, "same.md"), "utf8"), /enabled: false/);
    assert.match(fs.readFileSync(path.join(hooks, "same.local.md"), "utf8"), /enabled: false/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("rejects executable files without shebang and local create refuses gitignore symlinks", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-safety-"));
  const scripts = path.join(workspace, ".csl-agent-kit", "triggerify", "scripts");
  const script = path.join(scripts, "bad.local.sh");
  const outside = path.join(workspace, "outside-ignore");
  const output = [];
  const io = { log: (line) => output.push(line), error: (line) => output.push(line) };
  fs.mkdirSync(scripts, { recursive: true });
  fs.writeFileSync(script, "exit 0\n", { mode: 0o700 });

  try {
    assert.equal(triggerify.runCli(["create", "bad", "--workspace", workspace, "--event", "before-tool", "--action", "run-script", "--script", "bad.local.sh"], io), 2);
    fs.writeFileSync(script, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    fs.writeFileSync(outside, "keep\n");
    fs.symlinkSync(outside, path.join(workspace, ".gitignore"));
    assert.equal(triggerify.runCli(["create", "bad", "--workspace", workspace, "--event", "before-tool", "--action", "run-script", "--script", "bad.local.sh"], io), 2);
    assert.equal(fs.readFileSync(outside, "utf8"), "keep\n");
    assert.equal(fs.existsSync(path.join(workspace, ".csl-agent-kit", "triggerify", "hooks", "bad.local.md")), false);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("bounds regex execution and event runtime while preserving block short-circuit order", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-runtime-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "triggerify", "scripts");
  const hooks = path.join(data, "triggerify", "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "alpha.sh"), "#!/bin/sh\nprintf alpha >&2\nexit 2\n", { mode: 0o700 });
  fs.writeFileSync(path.join(scripts, "zed.sh"), "#!/bin/sh\nprintf zed >&2\nexit 2\n", { mode: 0o700 });
  for (const name of ["alpha", "zed"]) fs.writeFileSync(path.join(hooks, `${name}.md`), `---\nschema: triggerify/v1\nevent: before-tool\naction: run-script\nenabled: true\nscript: ${name}.sh\n---\n`);

  try {
    const started = Date.now();
    assert.equal(triggerify.safeRegexTest("git\\s+commit", "git commit"), true);
    assert.equal(triggerify.safeRegexTest("(a+)+$", `${"a".repeat(2048)}!`), undefined);
    assert.ok(Date.now() - started < 1000);
    const payload = triggerify.normalizePayload({ hook_event_name: "PreToolUse", session_id: "s", tool_name: "Bash", tool_input: { command: "git commit" } }, "codex", "before-tool", data);
    const result = triggerify.runEvent(payload, { host: "codex", workspace: data, eventBudgetMs: 2000 });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "alpha");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("maps script success, failure, timeout, signal, post-event exit two, and symlink escape", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-exits-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "triggerify", "scripts");
  const hooks = path.join(data, "triggerify", "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  const payload = (event) => triggerify.normalizePayload({ hook_event_name: event === "before-tool" ? "PreToolUse" : "PostToolUse", session_id: "s", tool_name: "Bash" }, "codex", event, data);
  const writeRule = (name, event, script) => fs.writeFileSync(path.join(hooks, `${name}.md`), `---\nschema: triggerify/v1\nevent: ${event}\naction: run-script\nenabled: true\nscript: ${script}\n---\n`);

  try {
    const cases = [
      ["success", "#!/bin/sh\nexit 0\n", "before-tool", false, []],
      ["failure", "#!/bin/sh\nexit 3\n", "before-tool", false, ["global:failure:runtime-error"]],
      ["signal", "#!/bin/sh\nkill -TERM $$\n", "before-tool", false, ["global:signal:runtime-error"]],
      ["spawn", "#!/no/such/triggerify-interpreter\n", "before-tool", false, ["global:spawn:runtime-error"]],
      ["post-block", "#!/bin/sh\nexit 2\n", "after-tool", false, ["global:post-block:block-unsupported"]],
    ];
    for (const [name, source, event, blocked, diagnostics] of cases) {
      for (const file of fs.readdirSync(hooks)) fs.unlinkSync(path.join(hooks, file));
      fs.writeFileSync(path.join(scripts, `${name}.sh`), source, { mode: 0o700 });
      writeRule(name, event, `${name}.sh`);
      const result = triggerify.runEvent(payload(event), { host: "codex", workspace: data, eventBudgetMs: 2000 });
      assert.equal(result.blocked, blocked);
      assert.deepEqual(result.diagnostics, diagnostics);
    }

    for (const file of fs.readdirSync(hooks)) fs.unlinkSync(path.join(hooks, file));
    fs.writeFileSync(path.join(scripts, "timeout.js"), "#!/usr/bin/env node\nsetTimeout(() => {}, 2000);\n", { mode: 0o700 });
    writeRule("timeout", "before-tool", "timeout.js");
    const timed = triggerify.runEvent(payload("before-tool"), { host: "codex", workspace: data, eventBudgetMs: 100 });
    assert.equal(timed.blocked, false);
    assert.deepEqual(timed.diagnostics, ["global:timeout:runtime-error"]);

    for (const file of fs.readdirSync(hooks)) fs.unlinkSync(path.join(hooks, file));
    const outside = path.join(data, "outside.sh");
    fs.writeFileSync(outside, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    fs.symlinkSync(outside, path.join(scripts, "escape.sh"));
    writeRule("escape", "before-tool", "escape.sh");
    const escaped = triggerify.runEvent(payload("before-tool"), { host: "codex", workspace: data });
    assert.equal(escaped.blocked, false);
    assert.deepEqual(escaped.diagnostics, ["global:escape:script-escape"]);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("runs the Swift changed-file and commit-command RFC examples end to end", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-examples-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "triggerify", "scripts");
  const hooks = path.join(data, "triggerify", "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "probe.sh"), "#!/bin/sh\nexit 2\n", { mode: 0o700 });
  fs.writeFileSync(path.join(hooks, "commit.md"), "---\nschema: triggerify/v1\nevent: before-tool\naction: run-script\nenabled: true\nscript: probe.sh\nwhen:\n  all:\n    - path: /tool/category\n      op: eq\n      value: shell\n    - path: /tool/command\n      op: regex\n      value: '(^|[;&|]\\s*)git\\s+commit(?:\\s|$)'\n---\n");
  fs.writeFileSync(path.join(hooks, "swift.md"), "---\nschema: triggerify/v1\nevent: after-tool\naction: run-script\nenabled: true\nscript: probe.sh\nwhen:\n  some:\n    path: /changed_files\n    where:\n      all:\n        - path: /operation\n          op: in\n          value: [created, modified]\n        - path: /path\n          op: glob\n          value: '**/*.swift'\n---\n");
  try {
    const commit = triggerify.normalizePayload({ hook_event_name: "PreToolUse", session_id: "s", tool_name: "Bash", tool_input: { command: "git commit -m test" } }, "codex", "before-tool", data);
    assert.equal(triggerify.runEvent(commit, { host: "codex", workspace: data, eventBudgetMs: 2000 }).blocked, true);
    const swift = triggerify.normalizePayload({ hook_event_name: "PostToolUse", session_id: "s", tool_name: "apply_patch" }, "codex", "after-tool", data);
    swift.changed_files = [{ path: "Sources/App.swift", operation: "modified" }];
    assert.deepEqual(triggerify.runEvent(swift, { host: "codex", workspace: data, eventBudgetMs: 2000 }).diagnostics, ["global:swift:block-unsupported"]);
    swift.changed_files = null;
    assert.deepEqual(triggerify.runEvent(swift, { host: "codex", workspace: data, eventBudgetMs: 2000 }).diagnostics, ["global:swift:condition-unknown"]);
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("dispatch injects prompt context once and suppresses duplicate diagnostics per session", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-dispatch-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const hooks = path.join(data, "triggerify", "hooks");
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "context.md"), "---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nLoad context.\n");
  fs.writeFileSync(path.join(hooks, "invalid.md"), "not frontmatter\n");
  const makeIo = () => {
    const output = { stdout: "", stderr: "" };
    return { output, io: { stdout: { write: (value) => { output.stdout += value; } }, stderr: { write: (value) => { output.stderr += value; } } } };
  };

  try {
    const native = JSON.stringify({ hook_event_name: "SessionStart", session_id: "same-session", cwd: data });
    const first = makeIo();
    assert.equal(triggerify.dispatch(native, { PLUGIN_ROOT: "/plugin" }, first.io), 0);
    assert.match(first.output.stdout, /Load context/);
    assert.match(first.output.stderr, /frontmatter-invalid/);
    const second = makeIo();
    assert.equal(triggerify.dispatch(native, { PLUGIN_ROOT: "/plugin" }, second.io), 0);
    assert.equal(second.output.stderr, "");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("dispatch injects global session prompts for Claude Code", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-claude-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const hooks = path.join(data, "triggerify", "hooks");
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "directive.md"), "---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nPersistent directive.\n");
  const output = { stdout: "", stderr: "" };
  const io = {
    stdout: { write: (value) => { output.stdout += value; } },
    stderr: { write: (value) => { output.stderr += value; } },
  };

  try {
    const native = JSON.stringify({ hook_event_name: "SessionStart", session_id: "claude", cwd: data });
    assert.equal(triggerify.dispatch(native, { CLAUDE_PLUGIN_ROOT: "/plugin" }, io), 0);
    assert.match(output.stdout, /Persistent directive/);
    assert.equal(output.stderr, "");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});

test("dispatch maps PermissionRequest and PreCompact blocks to native JSON", { concurrency: false }, () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-native-block-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const scripts = path.join(data, "triggerify", "scripts");
  const hooks = path.join(data, "triggerify", "hooks");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(scripts, "deny.sh"), "#!/bin/sh\nprintf denied >&2\nexit 2\n", { mode: 0o700 });
  const capture = () => {
    const output = { stdout: "", stderr: "" };
    return { output, io: { stdout: { write: (value) => { output.stdout += value; } }, stderr: { write: (value) => { output.stderr += value; } } } };
  };
  try {
    for (const [nativeEvent, event] of [["PermissionRequest", "permission-request"], ["PreCompact", "before-compact"]]) {
      for (const file of fs.readdirSync(hooks)) fs.unlinkSync(path.join(hooks, file));
      fs.writeFileSync(path.join(hooks, `${event}.md`), `---\nschema: triggerify/v1\nevent: ${event}\naction: run-script\nenabled: true\nscript: deny.sh\n---\n`);
      const captured = capture();
      assert.equal(triggerify.dispatch(JSON.stringify({ hook_event_name: nativeEvent, session_id: nativeEvent, cwd: data }), { PLUGIN_ROOT: "/plugin" }, captured.io), 0);
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
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-budget-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = data;
  const hooks = path.join(data, "triggerify", "hooks");
  fs.mkdirSync(hooks, { recursive: true });
  fs.writeFileSync(path.join(hooks, "context.md"), "---\nschema: triggerify/v1\nevent: session-start\naction: inject-prompt\nenabled: true\n---\nprompt\n");
  try {
    const payload = triggerify.normalizePayload({ hook_event_name: "SessionStart", session_id: "s" }, "codex", "session-start", data);
    assert.deepEqual(triggerify.runEvent(payload, { host: "codex", workspace: data, eventBudgetMs: -1 }).diagnostics, ["global:event-budget-exhausted"]);
    const condition = { some: { path: "/items", where: { path: "/value", op: "eq", value: true } } };
    assert.equal(triggerify.evaluateCondition(condition, { items: Array.from({ length: 100000 }, () => ({ value: false })) }, Date.now() - 1).value, "unknown");
  } finally {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(data, { recursive: true, force: true });
  }
});
