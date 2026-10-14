"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { modePaths, resolveTaskMode, saveTaskMode, taskModePrompt } = require("../skills/meta/csl-tasks/shared/lib/task-mode.js");

test("task-mode is a distributed Skill sharing the existing CLI", () => {
  const skill = fs.readFileSync(path.resolve("skills/meta/task-mode/SKILL.md"), "utf8");
  assert.match(skill, /name: task-mode/);
  assert.match(skill, /\.\.\/csl-tasks\/shared\/scripts\/task-mode\.js/);
  assert.match(skill, /project\/global only/);
  assert.match(skill, /Do not.*invent an ID/);
  const claude = JSON.parse(fs.readFileSync(path.resolve(".claude-plugin/plugin.json"), "utf8"));
  assert.ok(claude.skills.includes("./skills/meta/task-mode"));
  const codex = JSON.parse(fs.readFileSync(path.resolve(".codex-plugin/plugin.json"), "utf8"));
  assert.equal(codex.skills, "./skills/");
  assert.ok(fs.existsSync(path.join(codex.skills, "meta/task-mode/SKILL.md")));
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "task-mode-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = path.join(root, "config");
  const options = { workspace: root, host: "pi", sessionId: "session-a" };
  return {
    root, options,
    cleanup() {
      if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
      else process.env.CSL_AGENT_KIT_HOME = previous;
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test("persistent scopes, explicit confirm, inherit and identity isolation", () => {
  const f = fixture();
  try {
    assert.equal(resolveTaskMode(f.options).source, "default");
    assert.equal(fs.existsSync(process.env.CSL_AGENT_KIT_HOME), false);
    saveTaskMode("global", "solo", f.options);
    saveTaskMode("project", "confirm", f.options);
    saveTaskMode("session", "solo", f.options);
    assert.equal(resolveTaskMode({ ...f.options }).source, "session");
    assert.equal(resolveTaskMode({ ...f.options, sessionId: "new-session" }).mode, "confirm");
    assert.equal(resolveTaskMode({ ...f.options, host: "codex" }).source, "project");
    saveTaskMode("session", "inherit", f.options);
    assert.equal(resolveTaskMode(f.options).source, "project");
    saveTaskMode("project", "inherit", f.options);
    assert.equal(resolveTaskMode(f.options).source, "global");
    const other = path.join(f.root, "other");
    fs.mkdirSync(other);
    saveTaskMode("project", "confirm", f.options);
    assert.equal(resolveTaskMode({ ...f.options, workspace: other }).source, "global");
    const alias = path.join(f.root, "alias");
    fs.symlinkSync(f.root, alias, "dir");
    assert.equal(resolveTaskMode({ ...f.options, workspace: alias }).source, "project");
    assert.throws(() => saveTaskMode("session", "solo", { workspace: f.root }), /actual host/);
  } finally { f.cleanup(); }
});

test("preserves unrelated settings and refuses malformed documents; prompt fails closed", () => {
  const f = fixture();
  try {
    saveTaskMode("global", "confirm", f.options);
    const file = modePaths(f.options).global;
    fs.writeFileSync(file, JSON.stringify({ review: { thinking: "low" }, task: { future: true } }));
    saveTaskMode("global", "solo", f.options);
    saveTaskMode("global", "inherit", f.options);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { review: { thinking: "low" }, task: { future: true } });
    saveTaskMode("session", "solo", f.options);
    for (const raw of ["{", "[]", '{"task":[]}', '{"task":{"mode":"bogus"}}']) {
      fs.writeFileSync(file, raw);
      assert.throws(() => resolveTaskMode(f.options));
      assert.match(taskModePrompt(f.options), /Effective mode: confirm; source: configuration-error/);
      if (raw !== '{"task":{"mode":"bogus"}}') {
        assert.throws(() => saveTaskMode("global", "confirm", f.options));
        assert.equal(fs.readFileSync(file, "utf8"), raw);
      }
    }
    saveTaskMode("global", "confirm", f.options);
    assert.equal(resolveTaskMode(f.options).source, "session");
    assert.throws(() => saveTaskMode("global", "unlimited", f.options));
    assert.throws(() => saveTaskMode("unknown", "solo", f.options));
    assert.throws(() => saveTaskMode("global", "autonomous", f.options), /confirm, solo, or inherit/);
  } finally { f.cleanup(); }
});

test("legacy autonomous storage resolves to SOLO without modifying user files", () => {
  const f = fixture();
  try {
    saveTaskMode("project", "confirm", f.options);
    const file = modePaths(f.options).project;
    const legacy = '{"task":{"mode":"autonomous"},"future":true}\n';
    fs.writeFileSync(file, legacy);
    const state = resolveTaskMode(f.options);
    assert.equal(state.mode, "solo");
    assert.equal(state.layers.project, "solo");
    assert.equal(state.source, "project");
    assert.match(taskModePrompt(f.options), /framework or SOP safety-confirmation wording alone is not a reason to pause/);
    assert.equal(fs.readFileSync(file, "utf8"), legacy);
    saveTaskMode("project", "solo", f.options);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { task: { mode: "solo" }, future: true });
  } finally { f.cleanup(); }
});

test("SOLO contracts bypass grading and SOP-only pauses while keeping real boundaries", () => {
  const protocol = fs.readFileSync("skills/meta/csl-tasks/shared/protocols/task-target-alignment.md", "utf8");
  const sops = fs.readFileSync("skills/meta/agent-sops/SKILL.md", "utf8");
  assert.match(protocol, /Resolve the runtime mode \*\*before\*\* selecting any L0-L4 level/);
  assert.match(protocol, /Resolve mode first: if `solo`/);
  assert.match(protocol, /use `continue_solo`; do not select an L-level/);
  assert.match(protocol, /does not resume an old X batch/);
  assert.match(protocol, /duplicate-send prevention/);
  assert.match(protocol, /drafting-only does not authorize publishing/);
  assert.match(sops, /A generic SOP instruction to ask, even labeled safety, is not a user-requested pause/);
});

test("CLI persists between processes and contract hook resolves native session identity", () => {
  const f = fixture();
  try {
    const script = path.resolve("skills/meta/csl-tasks/shared/scripts/task-mode.js");
    const args = ["--workspace", f.root, "--host", "pi", "--session", f.options.sessionId];
    const saved = spawnSync(process.execPath, [script, "set", "session", "solo", ...args], { encoding: "utf8" });
    assert.equal(saved.status, 0, saved.stderr);
    const shown = spawnSync(process.execPath, [script, "show", ...args], { encoding: "utf8" });
    assert.equal(JSON.parse(shown.stdout).source, "session");
    const hook = spawnSync(process.execPath, [path.resolve("skills/meta/agent-hooks/scripts/read-csl-agent-kit-contract.js")], {
      encoding: "utf8", input: JSON.stringify({ session: { id: f.options.sessionId } }),
      env: { ...process.env, AGENT_HOOKS_EVENT: "session-start", AGENT_HOOKS_HOST: "pi", AGENT_HOOKS_WORKSPACE: f.root },
    });
    assert.equal(hook.status, 0, hook.stderr);
    assert.match(hook.stdout, /Effective mode: solo; source: session/);
    assert.match(hook.stdout, /SOLO: bypass the entire L0-L4 second-confirmation grading path/);
    assert.match(hook.stdout, /host\/tool approvals/);
    const invalid = spawnSync(process.execPath, [script, "set", "session", "solo", "--workspace", f.root], { encoding: "utf8" });
    assert.equal(invalid.status, 1);
  } finally { f.cleanup(); }
});
