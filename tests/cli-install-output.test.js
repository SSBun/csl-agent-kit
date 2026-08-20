const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } = require("node:fs");
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
const { loadSops } = require(path.join(root, "skills", "sop-manager", "scripts", "sop-candidates.js"));

function discoverProjectOwnedSkills(directory, relative = "skills") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];
    const child = path.join(directory, entry.name);
    const childRelative = path.join(relative, entry.name);
    if (existsSync(path.join(child, "SKILL.md"))) {
      return existsSync(path.join(child, ".repository.json")) ? [] : [`./${childRelative}`];
    }
    return discoverProjectOwnedSkills(child, childRelative);
  });
}

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

function createFakeCodex(directory) {
  const bin = path.join(directory, "bin");
  const executable = path.join(bin, "codex");
  mkdirSync(bin, { recursive: true });
  writeFileSync(executable, `#!/bin/sh
if [ "$1" = "--version" ]; then exit 0; fi
if [ "$FAIL_PLUGIN_ADD" = "1" ] && [ "$1" = "plugin" ] && [ "$2" = "add" ]; then
  echo "plugin add failed" >&2
  exit 9
fi
exit 0
`);
  chmodSync(executable, 0o755);
  return bin;
}

test("default install output is colorful and summarizes integrations without path noise", () => {
  const result = run(["install", "--yes", "--dry-run"], { NO_COLOR: undefined });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\u001b\[32m✓\u001b\[0m/);
  assert.match(stripAnsi(result.stdout), /CSL Agent Kit · install preview/);
  const plain = stripAnsi(result.stdout);
  assert.match(plain, /✓ Codex plugin\s+8 commands planned/);
  assert.doesNotMatch(plain, /Cursor local plugin/);
  assert.doesNotMatch(plain, /Codex skills symlinks/);
  assert.doesNotMatch(plain, /Repo-local \.agents\/skills links/);
  assert.doesNotMatch(plain, /\/Users\//);
  assert.doesNotMatch(plain, /\.agents\/skills\/analyze-project/);
});

test("Codex plugin install migrates legacy identities", () => {
  const result = run(["install", "--target", "codex-plugin", "--dry-run", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const commands = JSON.parse(result.stdout).results[0].changes
    .filter((change) => change.action === "command")
    .map((change) => change.command);
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
  const directory = mkdtempSync(path.join(tmpdir(), "csl-codex-cleanup-"));
  const home = path.join(directory, "home");
  const legacySkills = path.join(home, ".agents", "skills");
  mkdirSync(legacySkills, { recursive: true });
  symlinkSync(path.join(root, "skills", "analyze-project"), path.join(legacySkills, "analyze-project"));
  const result = run(["install", "--yes", "--dry-run", "--verbose"], { HOME: home });

  try {
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Codex plugin/);
    assert.match(result.stdout, /remove .*\.agents\/skills\/analyze-project → .*skills\/analyze-project \(dry run\)/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Codex plugin exports root skills and uses the root hook manifest", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, ".codex-plugin", "plugin.json"), "utf8"));
  const marketplace = JSON.parse(readFileSync(path.join(root, ".agents", "plugins", "marketplace.json"), "utf8"));
  const hooks = JSON.parse(readFileSync(path.join(root, "hooks", "hooks.json"), "utf8"));
  const commands = Object.values(hooks.hooks).flatMap((entries) => entries)
    .flatMap((entry) => entry.hooks || [])
    .map((hook) => hook.command || "");

  assert.equal(manifest.skills, "./skills/");
  assert.equal(Object.hasOwn(manifest, "hooks"), false);
  assert.equal(marketplace.plugins[0].source.path, "./");
  assert.equal(commands.some((command) => command.includes("PLUGIN_ROOT")), true);
  assert.equal(commands.some((command) => command.includes("CLAUDE_PLUGIN_ROOT")), true);
  assert.equal(commands.some((command) => command.includes(".agents/skills")), false);
  assert.equal(existsSync(path.join(root, ".codex-plugin", "hooks", "hooks.json")), false);
});

test("Claude plugin exports every project-owned leaf skill", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin", "plugin.json"), "utf8"));
  const expected = discoverProjectOwnedSkills(path.join(root, "skills")).sort();

  assert.deepEqual([...manifest.skills].sort(), expected);
});

test("does not ship the retired deep-explore skill", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin", "plugin.json"), "utf8"));

  assert.equal(existsSync(path.join(root, "skills", "deep-explore")), false);
  assert.equal(manifest.skills.includes("./skills/deep-explore"), false);
});

test("ships one canonical merged code-review skill", () => {
  const skillDir = path.join(root, "skills", "code-review");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const contract = JSON.parse(readFileSync(path.join(skillDir, "evals", "contract_cases.json"), "utf8"));
  const findingContract = contract.cases.find(({ id }) => id === "finding-contract");

  assert.equal(existsSync(path.join(root, "skills", "code-reviewer")), false);
  assert.equal(existsSync(path.join(root, "skills", "mattpocock", "code-review")), false);
  assert.match(skill, /^name: code-review$/m);
  for (const lens of ["Correctness", "security", "Spec", "Standards", "Tests", "Maintainability"]) {
    assert.ok(skill.includes(lens), `missing ${lens} review lens`);
  }
  assert.deepEqual(findingContract.expect.required_fields, ["lens", "file:line", "impact", "evidence", "fix"]);
});

test("root hook commands execute bundled resources from plugin root variables", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-hook-root-"));
  const pluginRoot = path.join(directory, "plugin");
  const claudePluginRoot = path.join(directory, "claude-plugin");
  const hookManifest = JSON.parse(readFileSync(path.join(root, "hooks", "hooks.json"), "utf8")).hooks;
  const hooks = hookManifest.SessionStart.flatMap((entry) => entry.hooks);
  const postCompactHooks = hookManifest.PostCompact.flatMap((entry) => entry.hooks);
  const hook = hooks.find(({ command }) => command.includes("sop-summaries.sh")).command;
  assert.ok(hookManifest.SessionStart.some(({ matcher }) => matcher.split("|").includes("compact")));
  assert.equal([...hooks, ...postCompactHooks].some(({ command }) => command.includes("workspace-workflow-gates.md")), false);
  assert.ok(hooks.some(({ command }) => command.includes("skills/meta/triggerify/scripts/triggerify.js")));
  try {
    for (const [fakeRoot, output] of [[pluginRoot, "plugin-root"], [claudePluginRoot, "claude-plugin-root"]]) {
      const script = path.join(fakeRoot, "skills", "sop-manager", "scripts", "sop-summaries.sh");
      mkdirSync(path.dirname(script), { recursive: true });
      writeFileSync(script, `#!/bin/sh\nprintf '%s\\n' '${output}'\n`);
      chmodSync(script, 0o755);
    }

    const pluginResult = spawnSync("/bin/sh", ["-c", hook], {
      encoding: "utf8",
      env: { ...process.env, HOME: path.join(directory, "home"), PLUGIN_ROOT: pluginRoot, CLAUDE_PLUGIN_ROOT: claudePluginRoot },
    });
    assert.equal(pluginResult.status, 0, pluginResult.stderr);
    assert.equal(pluginResult.stdout.trim(), "plugin-root");

    const claudeResult = spawnSync("/bin/sh", ["-c", hook], {
      encoding: "utf8",
      env: { ...process.env, HOME: path.join(directory, "home"), PLUGIN_ROOT: "", CLAUDE_PLUGIN_ROOT: claudePluginRoot },
    });
    assert.equal(claudeResult.status, 0, claudeResult.stderr);
    assert.equal(claudeResult.stdout.trim(), "claude-plugin-root");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("project SOPs override user and built-in SOPs in routing and summaries", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-project-sops-"));
  const workspace = path.join(directory, "workspace");
  const userSops = path.join(directory, "user-sops");
  const projectSops = path.join(workspace, ".agents", "sops");
  const summaryScript = path.join(root, "skills", "sop-manager", "scripts", "sop-summaries.sh");
  const sop = (name, whenToUse) => `---\nname: ${name}\ndescription: Test SOP.\nwhen_to_use: ${whenToUse}\n---\n`;

  mkdirSync(userSops, { recursive: true });
  mkdirSync(projectSops, { recursive: true });
  writeFileSync(path.join(userSops, "user-code-style.md"), sop("code-style", "Use the user code style SOP."));
  writeFileSync(path.join(userSops, "user-only.md"), sop("user-only", "Use the user-only SOP."));
  writeFileSync(path.join(projectSops, "project-code-style.md"), sop("code-style", "Use the project code style SOP."));
  writeFileSync(path.join(projectSops, "project-swift-api.md"), sop("swift-api-design", "Use the project Swift API SOP."));
  writeFileSync(path.join(projectSops, "project-only.md"), sop("project-only", "Use the project-only SOP."));

  try {
    const loaded = loadSops({ workspace, userSopDir: userSops });
    const byName = new Map(loaded.map((item) => [item.name, item]));
    assert.equal(byName.get("code-style").source, "project");
    assert.equal(byName.get("code-style").when_to_use, "Use the project code style SOP.");
    assert.equal(byName.get("user-only").source, "user");
    assert.equal(byName.get("swift-api-design").source, "project");
    assert.equal(byName.get("swift-api-design").when_to_use, "Use the project Swift API SOP.");

    const summary = spawnSync(summaryScript, [], {
      cwd: workspace,
      encoding: "utf8",
      env: { ...process.env, CSL_AGENT_KIT_SOPS_DIR: userSops },
    });
    assert.equal(summary.status, 0, summary.stderr);
    const codeStyleLines = summary.stdout.split("\n").filter((line) => line.startsWith("- code-style:"));
    assert.equal(codeStyleLines.length, 1);
    assert.match(codeStyleLines[0], /project code style SOP.*\(project:/);
    const swiftApiLines = summary.stdout.split("\n").filter((line) => line.startsWith("- swift-api-design:"));
    assert.equal(swiftApiLines.length, 1);
    assert.match(swiftApiLines[0], /project Swift API SOP.*\(project:/);
    assert.match(summary.stdout, /- user-only:.*\(user:/);
    assert.match(summary.stdout, /- project-only:.*\(project:/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
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
      upstreamStatus: "active",
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
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.results.map((item) => item.target), ["codex-plugin", "super-agent"]);
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
      ["codex-plugin", "super-agent"],
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

test("Codex skill symlinks are no longer an install target or help option", () => {
  const result = run(["install", "--target", "codex-skills", "--dry-run"]);
  const help = run(["install", "--help"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown target: codex-skills/);
  assert.doesNotMatch(result.stderr, /Valid targets: .*codex-skills/);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /codex-plugin/);
  assert.doesNotMatch(help.stdout, /codex-skills/);
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
      ["codex-plugin", "super-agent"],
    );
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("an obsolete Codex skills selection retains the valid plugin target", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "csl-install-selection-"));
  const selectionFile = path.join(dataDir, "install-selection.json");
  try {
    writeFileSync(selectionFile, `${JSON.stringify({ version: 1, selectedTargets: ["codex-skills", "codex-plugin"] })}\n`);

    assert.deepEqual(loadInstallSelection(selectionFile), ["codex-plugin"]);
    assert.deepEqual(
      buildInstallChoices(loadInstallSelection(selectionFile))
        .filter((choice) => choice.selected)
        .map((choice) => choice.value),
      ["codex-plugin"],
    );
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("Codex plugin cleanup dry-run reports owned links without mutating them", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-codex-cleanup-"));
  const home = path.join(directory, "home");
  const legacySkills = path.join(home, ".agents", "skills");
  const owned = path.join(legacySkills, "analyze-project");
  const stale = path.join(legacySkills, "removed-csl-skill");
  mkdirSync(legacySkills, { recursive: true });
  symlinkSync(path.join(root, "skills", "analyze-project"), owned);
  symlinkSync(path.join(root, "skills", "removed-csl-skill"), stale);

  try {
    const result = run(["install", "--target", "codex-plugin", "--dry-run", "--json"], { HOME: home });
    assert.equal(result.status, 0, result.stderr);
    const changes = JSON.parse(result.stdout).results[0].changes;
    assert.equal(changes.slice(0, 8).every((change) => change.action === "command"), true);
    assert.deepEqual(changes.slice(8).map((change) => ({
      action: change.action,
      target: path.basename(change.target),
      dryRun: change.dryRun,
    })), [
      { action: "remove", target: "analyze-project", dryRun: true },
      { action: "remove", target: "removed-csl-skill", dryRun: true },
    ]);
    assert.equal(lstatSync(owned).isSymbolicLink(), true);
    assert.equal(lstatSync(stale).isSymbolicLink(), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Codex plugin cleanup does not traverse a symlinked legacy skills directory", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-codex-cleanup-"));
  const home = path.join(directory, "home");
  const agentsDir = path.join(home, ".agents");
  const legacySkills = path.join(agentsDir, "skills");
  const externalSkills = path.join(directory, "external-skills");
  const child = path.join(externalSkills, "analyze-project");
  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(externalSkills);
  symlinkSync(path.join(root, "skills", "analyze-project"), child);
  symlinkSync(externalSkills, legacySkills);

  try {
    const result = run(["install", "--target", "codex-plugin", "--dry-run", "--json"], { HOME: home });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).results[0].changes.some((change) => change.action === "remove"), false);
    assert.equal(lstatSync(legacySkills).isSymbolicLink(), true);
    assert.equal(lstatSync(child).isSymbolicLink(), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Codex plugin cleanup removes only owned links and is idempotent", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-codex-cleanup-"));
  const home = path.join(directory, "home");
  const legacySkills = path.join(home, ".agents", "skills");
  const owned = path.join(legacySkills, "analyze-project");
  const resolvedOwned = path.join(legacySkills, "repo-map");
  const stale = path.join(legacySkills, "removed-csl-skill");
  const regular = path.join(legacySkills, "tips");
  const external = path.join(legacySkills, "release");
  const brokenExternal = path.join(legacySkills, "broken-external");
  const externalSource = path.join(directory, "external-release");
  const ownedAlias = path.join(directory, "repo-map-alias");
  const bin = createFakeCodex(directory);
  mkdirSync(legacySkills, { recursive: true });
  mkdirSync(regular);
  mkdirSync(externalSource);
  symlinkSync(path.join(root, "skills", "analyze-project"), owned);
  symlinkSync(path.join(root, "skills", "removed-csl-skill"), stale);
  symlinkSync(path.join(root, "skills", "repo-map"), ownedAlias);
  symlinkSync(ownedAlias, resolvedOwned);
  symlinkSync(externalSource, external);
  symlinkSync(path.join(directory, "missing-external"), brokenExternal);
  const env = { HOME: home, PATH: `${bin}${path.delimiter}${process.env.PATH}` };

  try {
    const first = run(["install", "--target", "codex-plugin", "--json"], env);
    assert.equal(first.status, 0, first.stderr);
    const changes = JSON.parse(first.stdout).results[0].changes;
    assert.equal(changes.slice(0, 8).every((change) => change.action === "command"), true);
    assert.deepEqual(changes.filter((change) => change.action === "remove")
      .map((change) => path.basename(change.target)), ["analyze-project", "removed-csl-skill", "repo-map"]);
    assert.equal(existsSync(owned), false);
    assert.equal(existsSync(resolvedOwned), false);
    assert.equal(existsSync(stale), false);
    assert.equal(lstatSync(regular).isDirectory(), true);
    assert.equal(lstatSync(external).isSymbolicLink(), true);
    assert.equal(lstatSync(brokenExternal).isSymbolicLink(), true);

    const second = run(["install", "--target", "codex-plugin", "--json"], env);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(JSON.parse(second.stdout).results[0].changes.some((change) => change.action === "remove"), false);
    assert.equal(lstatSync(regular).isDirectory(), true);
    assert.equal(lstatSync(external).isSymbolicLink(), true);
    assert.equal(lstatSync(brokenExternal).isSymbolicLink(), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Codex plugin add failure leaves owned legacy links untouched", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-codex-cleanup-"));
  const home = path.join(directory, "home");
  const stale = path.join(home, ".agents", "skills", "removed-csl-skill");
  const bin = createFakeCodex(directory);
  mkdirSync(path.dirname(stale), { recursive: true });
  symlinkSync(path.join(root, "skills", "removed-csl-skill"), stale);

  try {
    const result = run(["install", "--target", "codex-plugin", "--json"], {
      FAIL_PLUGIN_ADD: "1",
      HOME: home,
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    });
    assert.equal(result.status, 1);
    const pluginResult = JSON.parse(result.stdout).results[0];
    assert.equal(pluginResult.ok, false);
    assert.match(pluginResult.error, /codex plugin add .* failed: plugin add failed/);
    assert.equal(lstatSync(stale).isSymbolicLink(), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
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

test("super-agent always relinks instructions, backs up files, and keeps dry-run non-mutating", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-super-agent-"));
  const home = path.join(directory, "home");
  const source = path.join(root, "super-agent", "AGENTS.md");
  const codex = path.join(home, ".codex", "AGENTS.md");
  const claude = path.join(home, ".claude", "CLAUDE.md");
  const pi = path.join(home, ".pi", "agent", "AGENTS.md");
  const agents = path.join(home, ".agents", "AGENTS.md");
  const currentLegacyTarget = path.join(root, "references", "agents.md");
  const legacyTarget = path.join(root, "skills", "super-agent", "references", "AGENTS.md");
  const externalTarget = path.join(directory, "other", "references", "agents.md");
  mkdirSync(path.dirname(codex), { recursive: true });
  mkdirSync(path.dirname(claude), { recursive: true });
  mkdirSync(path.dirname(pi), { recursive: true });
  symlinkSync(currentLegacyTarget, codex);
  symlinkSync(legacyTarget, pi);

  try {
    const first = run(["install", "--target", "super-agent", "--json"], { HOME: home });
    assert.equal(first.status, 0, first.stderr);
    const byTarget = Object.fromEntries(
      JSON.parse(first.stdout).results[0].changes.map((change) => [change.target, change])
    );

    assert.equal(byTarget[codex].action, "symlink");
    assert.equal(byTarget[codex].relinked, true);
    assert.equal(lstatSync(codex).isSymbolicLink(), true);
    assert.equal(readlinkSync(codex), source);

    assert.equal(byTarget[claude].action, "symlink");
    assert.equal(lstatSync(claude).isSymbolicLink(), true);

    assert.equal(byTarget[pi].action, "symlink");
    assert.equal(byTarget[pi].relinked, true);

    assert.equal(byTarget[agents].action, "symlink");

    rmSync(claude);
    writeFileSync(claude, "overwrite me");
    rmSync(agents);
    mkdirSync(path.dirname(externalTarget), { recursive: true });
    writeFileSync(externalTarget, "external");
    symlinkSync(externalTarget, agents);
    const dryRun = run(["install", "--target", "super-agent", "--dry-run", "--json"], { HOME: home });
    const dryRunChanges = JSON.parse(dryRun.stdout).results[0].changes;
    const dryRunClaude = dryRunChanges.find((change) => change.target === claude);
    const dryRunAgent = dryRunChanges.find((change) => change.target === agents);
    assert.equal(dryRunClaude.action, "symlink");
    assert.match(dryRunClaude.backup, /\.backup-<ts>$/);
    assert.equal(dryRunAgent.action, "symlink");
    assert.equal(dryRunAgent.forced, true);
    assert.equal(dryRunAgent.dryRun, true);
    assert.equal(readFileSync(claude, "utf8"), "overwrite me");
    assert.equal(readlinkSync(agents), externalTarget);

    const defaultInstall = run(["install", "--target", "super-agent", "--json"], { HOME: home });
    const defaultChanges = JSON.parse(defaultInstall.stdout).results[0].changes;
    const forced = defaultChanges.find((change) => change.target === claude);
    const forcedAgent = defaultChanges.find((change) => change.target === agents);
    assert.equal(forced.action, "symlink");
    assert.match(forced.backup, /\.backup-/);
    assert.equal(lstatSync(claude).isSymbolicLink(), true);
    assert.equal(readFileSync(forced.backup, "utf8"), "overwrite me");
    assert.equal(forcedAgent.action, "symlink");
    assert.equal(forcedAgent.forced, true);
    assert.equal(readlinkSync(agents), source);

    const idempotent = run(["install", "--target", "super-agent", "--json"], { HOME: home });
    const codexAgain = JSON.parse(idempotent.stdout).results[0].changes.find((change) => change.target === codex);
    assert.equal(codexAgain.action, "unchanged");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
