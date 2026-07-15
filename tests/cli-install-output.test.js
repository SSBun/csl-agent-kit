const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "bin/csl-agent-kit.js");
const {
  buildInstallChoices,
  loadInstallSelection,
  saveInstallSelection,
} = require(cli);

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

test("Codex plugin install migrates legacy identities", () => {
  const result = run(["install", "--target", "codex-plugin", "--dry-run", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const commands = JSON.parse(result.stdout).results[0].changes.map((change) => change.command);
  assert.deepEqual(commands, [
    "codex plugin remove csl-agent-kit@csl-agent-market --json",
    "codex plugin remove csl@CSL --json",
    "codex plugin remove csl@csl --json",
    "codex plugin marketplace remove csl-agent-market --json",
    "codex plugin marketplace remove CSL --json",
    "codex plugin marketplace remove csl --json",
    `codex plugin marketplace add ${root} --json`,
    "codex plugin add csl-agent-kit@csl-agent-market --json",
  ]);
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

test("interactive checklist reuses the last confirmed selection", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "csl-install-selection-"));
  const selectionFile = path.join(dataDir, "install-selection.json");
  try {
    saveInstallSelection(["codex-plugin", "pi"], selectionFile);

    assert.deepEqual(loadInstallSelection(selectionFile), ["codex-plugin", "pi"]);
    assert.deepEqual(
      buildInstallChoices(loadInstallSelection(selectionFile))
        .filter((choice) => choice.selected)
        .map((choice) => choice.value),
      ["codex-plugin", "pi"],
    );
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("invalid saved selection falls back to the existing default checklist", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "csl-install-selection-"));
  const selectionFile = path.join(dataDir, "install-selection.json");
  try {
    writeFileSync(selectionFile, "not json\n");

    assert.equal(loadInstallSelection(selectionFile), null);
    assert.deepEqual(
      buildInstallChoices(loadInstallSelection(selectionFile))
        .filter((choice) => choice.selected)
        .map((choice) => choice.value),
      ["cursor", "codex-skills", "repo-link"],
    );
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("explicit target installs do not overwrite the saved interactive selection", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "csl-install-selection-"));
  const selectionFile = path.join(dataDir, "install-selection.json");
  try {
    writeFileSync(selectionFile, `${JSON.stringify({ version: 1, selectedTargets: ["cursor", "pi"] })}\n`);
    const result = run(["install", "--target", "codex-plugin", "--dry-run", "--json"], {
      CSL_AGENT_KIT_HOME: dataDir,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(selectionFile), true);
    assert.deepEqual(JSON.parse(readFileSync(selectionFile, "utf8")), {
      version: 1,
      selectedTargets: ["cursor", "pi"],
    });
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});
