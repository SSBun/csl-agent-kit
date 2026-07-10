const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "bin/csl-agent-kit.js");

function run(args, env = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

test("default install output is colorful and summarizes integrations without path noise", () => {
  const result = run(["install", "--yes", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\u001b\[32m✓\u001b\[0m/);
  assert.match(stripAnsi(result.stdout), /CSL Agent Kit · install preview/);
  const plain = stripAnsi(result.stdout);
  assert.match(plain, /✓ Cursor local plugin\s+1 link planned/);
  assert.match(plain, /✓ Codex skills symlinks\s+\d+ links planned/);
  assert.match(plain, /✓ Repo-local \.agents\/skills link\s+1 link planned/);
  assert.doesNotMatch(plain, /\/Users\//);
  assert.doesNotMatch(plain, /\.agents\/skills\/analyze-project/);
});

test("verbose install output includes underlying paths", () => {
  const result = run(["install", "--yes", "--dry-run", "--verbose"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Codex skills symlinks/);
  assert.match(result.stdout, /\.agents\/skills\/analyze-project/);
  assert.match(result.stdout, /skills\/analyze-project/);
});

test("--color forces ANSI colors for terminal output", () => {
  const result = run(["install", "--yes", "--dry-run", "--color"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\u001b\[32m✓\u001b\[0m/);
  assert.match(result.stdout, /\u001b\[1m\u001b\[36mCSL Agent Kit\u001b\[0m\u001b\[0m/);
});

test("--no-color keeps terminal output free of ANSI codes", () => {
  const result = run(["install", "--yes", "--dry-run", "--no-color"]);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});

test("NO_COLOR disables automatic colors", () => {
  const result = run(["install", "--yes", "--dry-run"], { NO_COLOR: "1" });

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});

test("JSON output remains valid and color-free when --color is passed", () => {
  const result = run(["install", "--yes", "--dry-run", "--json", "--color"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).ok, true);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});
