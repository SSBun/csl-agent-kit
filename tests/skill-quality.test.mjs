import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "skills", "meta", "skill-quality", "scripts", "check.js");

function fixture(t) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "skill-quality-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function writeSkill(directory, name, { body = "Validate this package.", description = "Validate this Agent Skill package." } = {}) {
  const skill = path.join(directory, name);
  mkdirSync(skill, { recursive: true });
  writeFileSync(path.join(skill, "SKILL.md"), `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\n${body}\n`, "utf8");
  return skill;
}

function run(...args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

function jsonResult(...args) {
  const result = run(...args, "--json");
  return { ...result, report: JSON.parse(result.stdout) };
}

test("valid package passes without optional host metadata", (t) => {
  const directory = fixture(t);
  const valid = writeSkill(directory, "valid-skill");
  const passed = jsonResult(valid);
  assert.equal(passed.status, 0, passed.stderr);
  assert.equal(passed.report.status, "pass");
});

test("frontmatter and structured resource errors fail with exit code 2", (t) => {
  const directory = fixture(t);
  const skill = writeSkill(directory, "broken-skill", { body: "Use evals/ for fixtures." });
  writeFileSync(path.join(skill, "SKILL.md"), "---\nname: wrong-name\ndescription: Broken skill.\nextra: true\n---\n", "utf8");
  mkdirSync(path.join(skill, "evals"));
  writeFileSync(path.join(skill, "evals", "broken.json"), "{", "utf8");

  const result = jsonResult(skill);
  assert.equal(result.status, 2);
  const codes = new Set(result.report.packages[0].failures.map(({ code }) => code));
  assert.ok(codes.has("name-directory-mismatch"));
  assert.ok(codes.has("unexpected-frontmatter-key"));
  assert.ok(codes.has("invalid-structured-file"));
});

test("context budget is a non-blocking warning", (t) => {
  const directory = fixture(t);
  const skill = writeSkill(directory, "large-skill", { body: "required workflow guidance ".repeat(220) });
  const result = jsonResult(skill);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.status, "warning");
  assert.ok(result.report.packages[0].warnings.some(({ code }) => code === "context-budget"));
});

test("configured routing fixtures pass or fail deterministically", (t) => {
  const directory = fixture(t);
  const skill = writeSkill(directory, "routing-skill", {
    body: "Use evals/trigger_cases.json and evals/semantic_config.json.",
    description: "Validate the skill package with a deterministic gate.",
  });
  const evals = path.join(skill, "evals");
  mkdirSync(evals);
  writeFileSync(path.join(evals, "semantic_config.json"), JSON.stringify({
    fallback_positive_concepts: ["skill_validation"],
    positive_concepts: { skill_validation: { weight: 1, phrases: ["validate the skill package"] } },
    negative_concepts: { runtime_test: { weight: 0.7, exclusive: true, phrases: ["project tests"] } },
  }), "utf8");
  const casesFile = path.join(evals, "trigger_cases.json");
  writeFileSync(casesFile, JSON.stringify({
    recommended_threshold: 0.5,
    should_trigger: ["Validate the skill package."],
    should_not_trigger: ["Run project tests."],
    near_neighbor: ["Review source code."],
  }), "utf8");

  const passed = jsonResult(skill);
  assert.equal(passed.status, 0, passed.stderr);
  assert.equal(passed.report.packages[0].stats.routing.misfires, 0);

  writeFileSync(casesFile, JSON.stringify({
    recommended_threshold: 0.5,
    should_trigger: ["Unrelated request."],
    should_not_trigger: [],
    near_neighbor: [],
  }), "utf8");
  const failed = jsonResult(skill);
  assert.equal(failed.status, 2);
  assert.ok(failed.report.packages[0].failures.some(({ code }) => code === "routing-misfire"));
});

test("all mode discovers shared and project-local packages", (t) => {
  const workspace = fixture(t);
  writeSkill(path.join(workspace, "skills", "meta"), "shared-skill");
  writeSkill(path.join(workspace, ".agents", "skills"), "local-skill");
  const result = jsonResult("--all", "--workspace", workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.summary.pass, 2);
  assert.deepEqual(result.report.packages.map(({ name }) => name).sort(), ["local-skill", "shared-skill"]);
});

test("current maintenance contracts use the built-in gate", () => {
  const files = [
    "AGENTS.md",
    "skills/meta/task/SKILL.md",
    "skills/meta/task-context/SKILL.md",
    "skills/meta/task-lessons/SKILL.md",
    "skills/meta/task-review/SKILL.md",
    ".agents/skills/integrate-third-skills/SKILL.md",
  ];
  for (const file of files) {
    const content = readFileSync(path.join(root, file), "utf8");
    assert.match(content, /skill-quality/);
  }
});

test("human output uses color by default and honors --no-color", (t) => {
  const directory = fixture(t);
  const skill = writeSkill(directory, "color-skill");
  const colored = run(skill);
  assert.equal(colored.status, 0, colored.stderr);
  assert.match(colored.stdout, /\u001b\[/);

  const plain = run(skill, "--no-color");
  assert.equal(plain.status, 0, plain.stderr);
  assert.doesNotMatch(plain.stdout, /\u001b\[/);
  assert.match(plain.stdout, /^PASS /);
});
