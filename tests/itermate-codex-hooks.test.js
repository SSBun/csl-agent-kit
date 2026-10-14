"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const hooks = require("../skills/meta/agent-hooks/scripts/agent-hooks.js");
const { report, EVENTS } = require("../skills/meta/agent-hooks/scripts/itermate-codex-status.js");
const root = path.resolve(__dirname, "..");
const cli = path.join(root, "skills/meta/agent-hooks/scripts/agent-hooks.js");

function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "itermate-hooks-"));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const directory = path.join(home, "Library/Application Support/iTermate/integrations");
  fs.mkdirSync(directory, { recursive: true });
  return { home, directory };
}

function enable(directory) {
  fs.writeFileSync(path.join(directory, "codex-agent-hooks.json"), JSON.stringify({
    schema: "itermate.codex-agent-hooks/v1", enabled: true,
  }));
}

function payload(event, host = "codex", extra = {}) {
  return hooks.normalizePayload({
    hook_event_name: EVENTS[event][0], session_id: "codex-session", turn_id: "turn-1",
    cwd: root, ...extra,
  }, host, event, root);
}

test("Codex-only terminal events are nonblocking script capabilities", () => {
  for (const event of ["interrupt", "session-end"]) {
    assert.deepEqual(hooks.CODEX_CAPABILITIES[event], { inject: false, script: true, block: false });
    assert.equal(hooks.HOST_CAPABILITIES.pi[event], undefined);
    assert.equal(hooks.HOST_CAPABILITIES["claude-code"][event], undefined);
    const rule = fs.readFileSync(path.join(root, `skills/meta/agent-hooks/hooks/itermate-codex-${event}.md`), "utf8");
    assert.equal(hooks.parseMarkdown(rule, "fixture", "inner").valid, true);
  }
});

test("Codex manifest adds terminal dispatcher without changing shared registration", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".codex-plugin/plugin.json")));
  assert.deepEqual(manifest.hooks, ["./hooks/hooks.json", "./hooks/codex-lifecycle.json"]);
  const shared = JSON.parse(fs.readFileSync(path.join(root, "hooks/hooks.json"))).hooks;
  const terminal = JSON.parse(fs.readFileSync(path.join(root, "hooks/codex-lifecycle.json"))).hooks;
  assert.deepEqual(Object.keys(terminal).sort(), ["Interrupt", "SessionEnd"]);
  assert.equal(shared.Interrupt, undefined);
  assert.equal(shared.SessionEnd, undefined);
  for (const groups of Object.values(terminal)) {
    assert.equal(groups.length, 1);
    assert.equal(groups[0].hooks.length, 1);
    assert.equal(groups[0].hooks[0].timeout, 3);
    assert.match(groups[0].hooks[0].command, /agent-hooks\.js.*dispatch/);
  }
});

test("all status timings use host-filtered bundled rules", () => {
  for (const event of Object.keys(EVENTS)) {
    const rule = hooks.parseMarkdown(fs.readFileSync(path.join(root,
      `skills/meta/agent-hooks/hooks/itermate-codex-${event}.md`), "utf8"), "fixture", "inner");
    assert.equal(rule.valid, true);
    assert.equal(rule.rule.event, event);
    assert.equal(rule.rule.script, "itermate-codex-status.js");
    assert.equal(hooks.evaluateCondition(rule.rule.when, payload(event)).value, "true");
    assert.equal(hooks.evaluateCondition(rule.rule.when, payload(event, "pi")).value, "false");
  }
});

test("reporting requires iTermate opt-in and is a no-op on other hosts", (t) => {
  const { home, directory } = fixture(t);
  const spawn = () => { throw new Error("must not spawn"); };
  assert.equal(report(payload("prompt-submit"), { home, spawn }), 0);
  enable(directory);
  assert.equal(report(payload("prompt-submit", "pi"), { home, spawn }), 0);
  assert.equal(report(payload("prompt-submit", "claude-code"), { home, spawn }), 0);
  const mismatched = payload("prompt-submit");
  mismatched.native.payload.session_id = "other";
  assert.equal(report(mismatched, { home, spawn }), 0);
});

test("forward native event unchanged, including turn and compact source", (t) => {
  const { home, directory } = fixture(t);
  enable(directory);
  for (const event of Object.keys(EVENTS)) {
    let called = 0;
    const input = payload(event, "codex", { source: "compact" });
    assert.equal(report(input, { home, spawn(executable, args, options) {
      called++;
      assert.equal(executable, path.join(directory, "iTermate-status.py"));
      assert.deepEqual(args, ["agent", EVENTS[event][1]]);
      assert.deepEqual(JSON.parse(options.input), input.native.payload);
      assert.equal(options.shell, false);
      return { status: 0 };
    } }), 0);
    assert.equal(called, 1);
  }
});

test("reporter failure is diagnostic, never a blocking exit code", (t) => {
  const { home, directory } = fixture(t);
  enable(directory);
  for (const result of [{ status: 2 }, { status: null, signal: "SIGTERM" }, { error: new Error("missing") }]) {
    assert.equal(report(payload("stop"), { home, spawn: () => result }), 1);
  }
});

test("native dispatcher reaches opted-in reporter for Interrupt and SessionEnd", (t) => {
  const { home, directory } = fixture(t);
  enable(directory);
  const data = path.join(home, "kit");
  fs.mkdirSync(path.join(data, "hooks"), { recursive: true });
  fs.writeFileSync(path.join(data, "hooks/config.json"), JSON.stringify({
    schema: "agent-hooks.config/v1", disabledHooks: ["inner:agent-rules", "inner:csl-agent-kit-contract", "inner:refresh-tab-title"],
  }));
  const capture = path.join(home, "captured.json");
  fs.writeFileSync(path.join(directory, "iTermate-status.py"),
    `#!/usr/bin/env node\nrequire('fs').writeFileSync(${JSON.stringify(capture)}, JSON.stringify({args:process.argv.slice(2),native:JSON.parse(require('fs').readFileSync(0,'utf8'))}));\n`, { mode: 0o700 });
  for (const event of ["interrupt", "session-end"]) {
    const native = payload(event).native.payload;
    const result = spawnSync(process.execPath, [cli, "dispatch"], {
      input: JSON.stringify(native), encoding: "utf8",
      env: { ...process.env, HOME: home, CSL_AGENT_KIT_HOME: data, PLUGIN_ROOT: root },
    });
    assert.equal(result.status, 0, result.stderr);
    const observed = JSON.parse(fs.readFileSync(capture, "utf8"));
    assert.deepEqual(observed.native, native);
    assert.deepEqual(observed.args, ["agent", EVENTS[event][1]]);
    assert.equal(result.stdout, "");
  }
});
