const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "bin/csl-agent-kit.js");
const {
  buildInstallChoices,
  loadInstallSelection,
} = require(cli);
const { loadSops } = require(path.join(root, "skills", "meta", "agent-sops", "scripts", "sop-candidates.js"));

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

test("legacy install wrapper returns control and preserves CLI status when sourced", () => {
  const wrapper = path.join(root, "scripts", "install.sh");
  const result = spawnSync("bash", [
    "--noprofile",
    "--norc",
    "-c",
    '. "$1" --yes --dry-run --json >/dev/null 2>&1; success=$?; . "$1" --definitely-invalid >/dev/null 2>&1; failure=$?; printf "alive success=%s failure=%s" "$success" "$failure"',
    "bash",
    wrapper,
  ], { cwd: root, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "alive success=0 failure=2");
});

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

test("top-level help reports version and updates without advertising agent-hooks", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-help-"));
  const bin = path.join(directory, "bin");
  const npm = path.join(bin, "npm");
  const currentVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
  const newerVersion = `${Number(currentVersion.split(".")[0]) + 1}.0.0`;
  mkdirSync(bin);
  writeFileSync(npm, `#!/bin/sh\nprintf '\"${newerVersion}\"\\n'\n`);
  chmodSync(npm, 0o755);
  const env = { PATH: `${bin}${path.delimiter}${process.env.PATH || ""}` };

  try {
    const result = run([], { ...env, NO_COLOR: undefined });
    const plainResult = run(["--no-color"], env);
    const hooksResult = run(["agent-hooks", "help"], env);
    const help = stripAnsi(result.stdout);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\u001b\[/);
    assert.equal(help.includes(`CSL Agent Kit CLI v${currentVersion}`), true);
    assert.match(help, new RegExp(`Update\\s+v${newerVersion.replaceAll(".", "\\.")} available`));
    assert.match(help, /csl-agent-kit install \[options\]/);
    assert.doesNotMatch(help, /agent-hooks/);
    assert.equal(plainResult.status, 0, plainResult.stderr);
    assert.doesNotMatch(plainResult.stdout, /\u001b\[/);
    assert.equal(hooksResult.status, 0, hooksResult.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createFakeCodex(directory) {
  const bin = path.join(directory, "bin");
  const executable = path.join(bin, "codex");
  mkdirSync(bin, { recursive: true });
  writeFileSync(executable, `#!/bin/sh
if [ "$1" = "--version" ]; then exit 0; fi
if [ "$WAIT_FOR_PROGRESS" = "1" ] && [ "$1" = "plugin" ] && [ "$2" = "marketplace" ] && [ "$3" = "add" ]; then
  attempts=0
  while [ ! -f "$PROGRESS_RELEASE" ] && [ "$attempts" -lt 5 ]; do
    sleep 1
    attempts=$((attempts + 1))
  done
  [ -f "$PROGRESS_RELEASE" ] || exit 8
fi
if [ "$FAIL_PLUGIN_ADD" = "1" ] && [ "$1" = "plugin" ] && [ "$2" = "add" ]; then
  echo "plugin add failed" >&2
  exit 9
fi
exit 0
`);
  chmodSync(executable, 0o755);
  return bin;
}

test("default install output streams colorful details and summarizes integrations", () => {
  const result = run(["install", "--yes", "--dry-run"], { NO_COLOR: undefined });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\u001b\[32m✓\u001b\[0m/);
  assert.match(stripAnsi(result.stdout), /CSL Agent Kit · install preview/);
  const plain = stripAnsi(result.stdout);
  assert.match(plain, /→ Codex plugin/);
  assert.equal(plain.includes(`↳ codex plugin marketplace add ${root} --json (dry run)`), true);
  assert.match(plain, /✓ Codex plugin\s+8 commands planned/);
  assert.doesNotMatch(plain, /Cursor local plugin/);
  assert.doesNotMatch(plain, /Default agent instructions/);
  assert.doesNotMatch(plain, /Codex skills symlinks/);
  assert.doesNotMatch(plain, /Repo-local \.agents\/skills links/);
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

test("default install output reaches the caller before a command finishes", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "csl-install-progress-"));
  const home = path.join(directory, "home");
  const release = path.join(directory, "release");
  const fakeBin = createFakeCodex(directory);
  mkdirSync(home, { recursive: true });

  const child = spawn(process.execPath, [
    cli,
    "install",
    "--target",
    "codex-plugin",
    "--no-color",
  ], {
    cwd: root,
    env: {
      ...process.env,
      HOME: home,
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ""}`,
      PROGRESS_RELEASE: release,
      WAIT_FOR_PROGRESS: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let released = false;
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    if (!released && stdout.includes(`↳ codex plugin marketplace add ${root} --json`)) {
      released = true;
      writeFileSync(release, "");
    }
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    const status = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
    });
    assert.equal(status, 0, stderr);
    assert.equal(released, true, stdout);
    assert.match(stdout, /Done · 1\/1 integrations ready/);
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

test("does not ship retired skills", () => {
  const manifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin", "plugin.json"), "utf8"));

  assert.equal(existsSync(path.join(root, "skills", "deep-explore")), false);
  assert.equal(manifest.skills.includes("./skills/deep-explore"), false);
  assert.equal(existsSync(path.join(root, "skills", "dev", "analyze-project")), false);
  assert.equal(existsSync(path.join(root, "deprecated", "analyze-project", "SKILL.md")), true);
  assert.equal(manifest.skills.includes("./skills/dev/analyze-project"), false);
});

test("ships task-review as the only ordinary review skill", () => {
  const skillDir = path.join(root, "skills", "meta", "task-review");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const contract = JSON.parse(readFileSync(path.join(skillDir, "evals", "contract_cases.json"), "utf8"));
  const findingContract = contract.cases.find(({ id }) => id === "confirmed-finding");
  const mandatoryEntry = contract.cases.find(({ id }) => id === "mandatory-task-entry");
  const owningTaskHandoff = contract.cases.find(({ id }) => id === "owning-task-handoff");
  const stagnationHandoff = contract.cases.find(({ id }) => id === "stagnation-handoff");

  assert.equal(existsSync(path.join(root, "skills", "dev", "code-review")), false);
  assert.equal(existsSync(path.join(root, "skills", "code-reviewer")), false);
  assert.equal(existsSync(path.join(root, "skills", "mattpocock", "code-review")), false);
  assert.match(skill, /^name: task-review$/m);
  assert.match(skill, /explicit mandatory review dispatch from the owning `task` workflow/);
  assert.match(skill, /The owning task handles every transition, fix, and later pass/);
  assert.match(skill, /current `task-review-ledger\/v1` `## Review` ledger and its next unused finding ID/);
  assert.match(skill, /This Skill never loops, decides that the task is stalled, or records `Passed` itself/);
  for (const lens of ["Code", "Documents and designs", "Configuration and assets", "No-file results"]) {
    assert.ok(skill.includes(lens), `missing ${lens} review lens`);
  }
  assert.deepEqual(findingContract.expect.required_fields, [
    "severity",
    "location",
    "issue",
    "evidence",
    "impact",
    "suggested next step",
  ]);
  assert.equal(mandatoryEntry.expect.review_starts, true);
  assert.equal(mandatoryEntry.expect.user_must_request_review_again, false);
  assert.equal(owningTaskHandoff.expect.reviewer_changes_task_state, false);
  assert.equal(owningTaskHandoff.expect.owner_records_passed, true);
  assert.equal(stagnationHandoff.expect.ledger_schema, "task-review-ledger/v1");
  assert.equal(stagnationHandoff.expect.same_root_and_required_outcome_keep_id, true);
  assert.deepEqual(stagnationHandoff.expect.progress_values, ["resolved", "substantive progress", "no progress"]);
  assert.equal(stagnationHandoff.expect.reviewer_decides_stall, false);
  assert.equal(stagnationHandoff.expect.owner_updates_streak_and_block_state, true);
});

test("task-review pairs owner self-check with isolated omission review", () => {
  const skillDir = path.join(root, "skills", "meta", "task-review");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const workflow = readFileSync(path.join(skillDir, "references", "review_workflow.md"), "utf8");
  const owner = readFileSync(path.join(root, "skills", "meta", "task", "SKILL.md"), "utf8");
  const contract = JSON.parse(readFileSync(path.join(skillDir, "evals", "contract_cases.json"), "utf8"));
  const cases = Object.fromEntries(contract.cases.map(({ id, expect }) => [id, expect]));

  assert.equal(Object.keys(cases).length, contract.cases.length);
  assert.equal(Object.hasOwn(cases, "fallback"), false);
  assert.equal(cases["owner-self-check"].fix_or_block_before_dispatch, true);
  assert.equal(cases["owner-self-check"].unproven_targets_marked_complete, false);
  assert.match(owner, /Fix known Target failures or required-check failures before dispatch/);
  assert.match(owner, /Disclose remaining uncertainty without marking an unproven Target complete/);

  assert.equal(cases["single-reviewer"].fresh_context_explicitly_selected, true);
  assert.equal(cases["single-reviewer"].author_conversation_forked, false);
  assert.equal(cases["single-reviewer"].host_tool_restrictions_used, true);
  assert.match(skill, /A mandatory pass requires exactly one fresh, read-only subagent/);
  assert.match(skill, /never fork the author's conversation/);
  assert.match(skill, /Use host tool restrictions, not a prompt alone/);
  for (const id of ["mandatory-reviewer-unavailable", "mandatory-reviewer-failed"]) {
    assert.equal(cases[id].inline_review_runs, false);
    assert.equal(cases[id].owner_records_passed, false);
    assert.equal(cases[id].owner_blocks_with_recovery_condition, true);
  }
  assert.equal(cases["mandatory-reviewer-failed"].finding_no_progress_incremented, false);
  assert.match(skill, /the owner Blocks, never substitutes self-review or records Passed/);
  assert.equal(cases["standalone-fallback"].inline_review_runs, true);
  assert.equal(cases["standalone-fallback"].satisfies_mandatory_gate, false);
  assert.equal(cases["host-forbids-fallback"].inline_review_runs, false);
  assert.equal(cases["standalone-requires-independence"].inline_review_runs, false);
  assert.match(skill, /a standalone request requiring independence cannot use inline review/);
  assert.match(skill, /inline review is allowed only when the host permits it/);
  assert.match(skill, /Stricter host failure rules win/);
  assert.equal(cases["standalone-without-self-check"].author_self_check_required, false);
  assert.match(skill, /A standalone review does not require author self-check evidence/);

  assert.equal(cases["requirements-lost-in-summary"].author_summary_is_sole_authority, false);
  assert.match(workflow, /original request and effective revisions, current Target, and accepted constraints with recoverable sources/);
  assert.equal(cases["requirements-before-author-evidence"].requirements_and_artifacts_examined_first, true);
  assert.equal(cases["requirements-before-author-evidence"].additional_reviewer_spawned, false);
  assert.equal(cases["requirements-before-author-evidence"].strict_blind_review_claimed, false);
  assert.match(workflow, /after examining requirements and artifacts in the same pass/);
  assert.match(workflow, /not strict blind review/);
  assert.equal(cases["unchanged-caller-regression"].relevant_unchanged_callers_inspected, true);
  assert.match(skill, /including relevant unchanged callers and failure paths/);
  assert.equal(cases["unsupported-author-evidence"].author_logs_claimed_as_reviewer_execution, false);
  assert.match(skill, /Separate checks performed by this Reviewer from author evidence merely read/);
  assert.equal(cases["test-authorization"].tests_run, false);
  assert.match(skill, /never run tests without the required authorization/i);
  assert.equal(cases["accepted-constraints-and-untrusted-content"].artifact_instructions_grant_authority, false);
  assert.match(workflow, /Proposed edits to a rule being reviewed cannot grant new permissions/);

  assert.equal(cases["snapshot-drift"].head_or_filenames_alone_sufficient, false);
  assert.equal(cases["snapshot-drift"].current_snapshot_review_valid, false);
  assert.match(workflow, /staged\/unstaged diff and content identities of relevant untracked files, deletions, and renames/);
  assert.match(workflow, /Check the reviewed scope before and after the pass and again before completion/);
  assert.equal(cases["false-positive-counterevidence"].unresolved_finding_unilaterally_removed, false);
  assert.match(owner, /never remove an unresolved finding unilaterally/);
  assert.equal(cases["owning-task-handoff"].reviewer_checks_fixes_for_new_regressions, true);
  assert.match(skill, /check repair changes for new regressions too/);

  assert.match(workflow, /## Fixed Reviewer Prompt/);
  for (const field of ["Reviewed scope / snapshot", "Checks performed", "Author evidence examined", "Coverage limits"]) {
    assert.ok(skill.includes(`${field}:`), `missing review handoff field: ${field}`);
  }
  assert.equal(cases["no-findings"].feedback_invented, false);
  assert.match(workflow, /Do not defend the author, assume the author is wrong, or fill a finding quota/);
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
  assert.equal([...hooks, ...postCompactHooks].some(({ command }) => command.includes("csl-agent-kit-contract.md")), false);
  assert.ok(hooks.some(({ command }) => command.includes("skills/meta/agent-hooks/scripts/agent-hooks.js")));
  try {
    for (const [fakeRoot, output] of [[pluginRoot, "plugin-root"], [claudePluginRoot, "claude-plugin-root"]]) {
      const script = path.join(fakeRoot, "skills", "meta", "agent-sops", "scripts", "sop-summaries.sh");
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
  const summaryScript = path.join(root, "skills", "meta", "agent-sops", "scripts", "sop-summaries.sh");
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

test("does not ship Matt Pocock skills", () => {
  assert.equal(existsSync(path.join(root, "skills", "mattpocock")), false);
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
  assert.deepEqual(payload.results.map((item) => item.target), ["codex-plugin"]);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});

test("obsolete super-agent selections retain only current install targets", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "csl-install-selection-"));
  const selectionFile = path.join(dataDir, "install-selection.json");
  try {
    writeFileSync(selectionFile, `${JSON.stringify({ version: 1, selectedTargets: ["codex-plugin", "pi", "super-agent"] })}\n`);

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
      ["codex-plugin"],
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
      ["codex-plugin"],
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
  symlinkSync(path.join(root, "skills", "dev", "repo-map"), ownedAlias);
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

test("super-agent install surface is removed without compatibility entrypoints", () => {
  const target = run(["install", "--target", "super-agent", "--dry-run"]);
  const option = run(["install", "--no-super-agent", "--dry-run"]);
  const help = run(["install", "--help"]);
  const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

  assert.equal(target.status, 2);
  assert.match(target.stderr, /Unknown target: super-agent/);
  assert.equal(option.status, 2);
  assert.match(option.stderr, /Unknown install option: --no-super-agent/);
  assert.equal(help.status, 0, help.stderr);
  assert.doesNotMatch(help.stdout, /super-agent|Default agent instructions|--no-super-agent/);
  assert.equal(manifest.files.includes("super-agent/"), false);
  assert.equal(existsSync(path.join(root, "super-agent")), false);
});
