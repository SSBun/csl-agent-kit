const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const script = path.join(root, ".agents/skills/integrate-third-skills/scripts/third-party-skills.js");

function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function runTool(args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
}

test("third-party skill status and diff compare the local copy with upstream", () => {
  const temp = mkdtempSync(path.join(tmpdir(), "csl-third-party-skills-"));
  try {
    const upstream = path.join(temp, "upstream");
    const remote = path.join(temp, "remote.git");
    const skillsRoot = path.join(temp, "kit", "skills");
    const localSkill = path.join(skillsRoot, "example-source", "example");

    git(["init", "--initial-branch=main", upstream], temp);
    git(["config", "user.email", "test@example.com"], upstream);
    git(["config", "user.name", "Test User"], upstream);
    mkdirSync(path.join(upstream, "skills", "example"), { recursive: true });
    mkdirSync(path.join(upstream, "skills", "unchanged"), { recursive: true });
    writeFileSync(path.join(upstream, "skills", "example", "SKILL.md"), "# upstream version 1\n");
    writeFileSync(path.join(upstream, "skills", "unchanged", "SKILL.md"), "# unchanged\n");
    git(["add", "."], upstream);
    git(["commit", "-m", "initial"], upstream);
    const importedCommit = git(["rev-parse", "HEAD"], upstream);

    git(["clone", "--bare", upstream, remote], temp);
    git(["remote", "add", "origin", remote], upstream);
    writeFileSync(path.join(upstream, "skills", "example", "SKILL.md"), "# upstream version 2\n");
    git(["commit", "-am", "upstream update"], upstream);
    const latestCommit = git(["rev-parse", "HEAD"], upstream);
    git(["push", "origin", "main"], upstream);
    git(["checkout", "-b", "changeset-release/main"], upstream);
    writeFileSync(path.join(upstream, "BRANCH.md"), "# unrelated branch\n");
    git(["add", "BRANCH.md"], upstream);
    git(["commit", "-m", "branch update"], upstream);
    git(["push", "origin", "changeset-release/main"], upstream);
    git(["checkout", "main"], upstream);

    mkdirSync(localSkill, { recursive: true });
    writeFileSync(path.join(localSkill, "SKILL.md"), "# local copy\n");
    writeFileSync(path.join(localSkill, ".repository.json"), `${JSON.stringify({
      repository: remote,
      sourcePath: "skills/example",
      ref: "main",
      commit: importedCommit,
      license: "MIT",
      upstreamStatus: "active",
    }, null, 2)}\n`);
    const unchangedSkill = path.join(skillsRoot, "example-source", "unchanged");
    mkdirSync(unchangedSkill, { recursive: true });
    writeFileSync(path.join(unchangedSkill, "SKILL.md"), "# unchanged\n");
    writeFileSync(path.join(unchangedSkill, ".repository.json"), `${JSON.stringify({
      repository: remote,
      sourcePath: "skills/unchanged",
      ref: "main",
      commit: importedCommit,
      license: "MIT",
      upstreamStatus: "active",
    }, null, 2)}\n`);

    const status = runTool(["status", "--skills-root", skillsRoot]);
    assert.equal(status.status, 0, status.stderr);
    assert.match(status.stdout, /example/);
    assert.match(status.stdout, /upstream changed/);
    assert.match(status.stdout, new RegExp(latestCommit.slice(0, 12)));
    assert.match(status.stdout, /example-source\/unchanged  skill unchanged/);

    const diff = runTool(["diff", "example", "--patch", "--skills-root", skillsRoot]);
    assert.equal(diff.status, 0, diff.stderr);
    assert.match(diff.stdout, /Upstream changes since import/);
    assert.match(diff.stdout, /Local difference from upstream/);
    assert.match(diff.stdout, /upstream version 2/);
    assert.match(diff.stdout, /local copy/);
    assert.doesNotMatch(diff.stdout, /\.repository\.json/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("third-party skill commands reject metadata paths outside the upstream repository", () => {
  const temp = mkdtempSync(path.join(tmpdir(), "csl-third-party-skills-"));
  try {
    const skill = path.join(temp, "skills", "example-source", "example");
    mkdirSync(skill, { recursive: true });
    writeFileSync(path.join(skill, "SKILL.md"), "# example\n");
    writeFileSync(path.join(skill, ".repository.json"), `${JSON.stringify({
      repository: "https://example.invalid/skills.git",
      sourcePath: "../outside",
      ref: "main",
      commit: "a".repeat(40),
      license: "MIT",
      upstreamStatus: "active",
    }, null, 2)}\n`);

    const result = runTool(["status", "--skills-root", path.join(temp, "skills")]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /sourcePath must stay inside its repository/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
