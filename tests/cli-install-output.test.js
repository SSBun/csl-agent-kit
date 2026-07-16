const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = require("node:fs");
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
  assert.match(plain, /✓ Codex skills symlinks\s+\d+ links planned/);
  assert.match(plain, /✓ Codex plugin hooks\s+8 commands planned/);
  assert.doesNotMatch(plain, /Cursor local plugin/);
  assert.doesNotMatch(plain, /Repo-local \.agents\/skills links/);
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

test("Codex skill install discovers nested Matt Pocock skills but excludes project-local workflows", () => {
  const result = run(["install", "--target", "codex-skills", "--dry-run", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const changes = JSON.parse(result.stdout).results[0].changes;
  const selectedNames = [
    "code-review",
    "domain-modeling",
    "grill-me",
    "grill-with-docs",
    "grilling",
    "handoff",
    "improve-codebase-architecture",
    "research",
    "resolving-merge-conflicts",
    "tdd",
    "teach",
    "ubiquitous-language",
    "writing-great-skills",
  ];
  const mattPocockChanges = changes.filter((change) => change.source.includes(path.join("skills", "mattpocock")));

  assert.deepEqual(mattPocockChanges.map((change) => path.basename(change.target)).sort(), selectedNames);
  assert.equal(changes.filter((change) => path.basename(change.target) === "grill-me").length, 1);
  assert.equal(changes.some((change) => path.basename(change.target) === "integrate-third-skills"), false);
});

test("third-party integration workflow is a tracked project-local skill", () => {
  const localSkills = path.join(root, ".agents", "skills");
  const localSkill = path.join(localSkills, "integrate-third-skills", "SKILL.md");

  assert.equal(lstatSync(localSkills).isSymbolicLink(), false);
  assert.equal(existsSync(localSkill), true);
  assert.equal(existsSync(path.join(root, "skills", "integrate-third-skills")), false);
  assert.match(readFileSync(localSkill, "utf8"), /metadata:\n  internal: true/);
});

test("vendored third-party skills retain their upstream source metadata", () => {
  const vendorRoot = path.join(root, "skills", "mattpocock");
  const expectedSources = {
    "code-review": "skills/engineering/code-review",
    "domain-modeling": "skills/engineering/domain-modeling",
    "grill-me": "skills/productivity/grill-me",
    "grill-with-docs": "skills/engineering/grill-with-docs",
    grilling: "skills/productivity/grilling",
    handoff: "skills/productivity/handoff",
    "improve-codebase-architecture": "skills/engineering/improve-codebase-architecture",
    research: "skills/engineering/research",
    "resolving-merge-conflicts": "skills/engineering/resolving-merge-conflicts",
    tdd: "skills/engineering/tdd",
    teach: "skills/productivity/teach",
    "ubiquitous-language": "skills/deprecated/ubiquitous-language",
    "writing-great-skills": "skills/productivity/writing-great-skills",
  };
  const leafNames = readdirSync(vendorRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(vendorRoot, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(leafNames, Object.keys(expectedSources).sort());
  for (const [name, sourcePath] of Object.entries(expectedSources)) {
    const metadata = JSON.parse(readFileSync(path.join(vendorRoot, name, ".repository.json"), "utf8"));
    assert.deepEqual(metadata, {
      repository: "https://github.com/mattpocock/skills",
      sourcePath,
      ref: "main",
      commit: "66898f60e8c744e269f8ce06c2b2b99ce7660d5f",
      license: "MIT",
      upstreamStatus: name === "ubiquitous-language" ? "deprecated" : "active",
    });
  }
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

test("invalid saved selection falls back to the Codex default checklist", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "csl-install-selection-"));
  const selectionFile = path.join(dataDir, "install-selection.json");
  try {
    writeFileSync(selectionFile, "not json\n");

    assert.equal(loadInstallSelection(selectionFile), null);
    assert.deepEqual(
      buildInstallChoices(loadInstallSelection(selectionFile))
        .filter((choice) => choice.selected)
        .map((choice) => choice.value),
      ["codex-skills", "codex-plugin"],
    );
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("repo-local skills links are not an install target", () => {
  const result = run(["install", "--target", "repo-link", "--dry-run"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown target: repo-link/);
  assert.doesNotMatch(result.stderr, /Valid targets: .*repo-link/);
});

test("an obsolete repo-local saved selection falls back to the Codex defaults", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "csl-install-selection-"));
  const selectionFile = path.join(dataDir, "install-selection.json");
  try {
    writeFileSync(selectionFile, `${JSON.stringify({ version: 1, selectedTargets: ["repo-link"] })}\n`);

    assert.equal(loadInstallSelection(selectionFile), null);
    assert.deepEqual(
      buildInstallChoices(loadInstallSelection(selectionFile))
        .filter((choice) => choice.selected)
        .map((choice) => choice.value),
      ["codex-skills", "codex-plugin"],
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
