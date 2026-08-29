#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const workspace = path.resolve(__dirname, "../..");
const canonicalSkill = path.join(workspace, "evals", "skills", "task-target-alignment-eval");
const discoveryLink = path.join(workspace, ".agents", "skills", "task-target-alignment-eval");
const failures = [];

for (const required of [
  path.join(workspace, "evals", "README.md"),
  path.join(workspace, "evals", "scripts", "README.md"),
  path.join(workspace, "evals", "scripts", "evaluate-task-target-alignment.js"),
  path.join(workspace, "evals", "task-target-alignment", "README.md"),
  path.join(workspace, "evals", "task-target-alignment", "cases.json"),
  path.join(canonicalSkill, "SKILL.md"),
]) {
  if (!fs.existsSync(required)) failures.push(`Missing ${path.relative(workspace, required)}`);
}

try {
  if (!fs.lstatSync(discoveryLink).isSymbolicLink()) {
    failures.push(".agents/skills/task-target-alignment-eval must be a symlink");
  } else if (fs.realpathSync(discoveryLink) !== fs.realpathSync(canonicalSkill)) {
    failures.push("Project discovery symlink does not resolve to the canonical eval Skill");
  }
} catch {
  failures.push("Missing .agents/skills/task-target-alignment-eval discovery symlink");
}

const manifest = JSON.parse(fs.readFileSync(path.join(workspace, "package.json"), "utf8"));
if ((manifest.files || []).some((entry) => entry === "evals" || entry.startsWith("evals/") || entry.startsWith(".agents/skills"))) {
  failures.push("Project evals must not be included in the npm publish file list");
}

const sharedSkills = path.join(workspace, "skills");
const pending = [sharedSkills];
while (pending.length > 0) {
  const directory = pending.pop();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      pending.push(child);
      continue;
    }
    if (entry.name !== "SKILL.md") continue;
    const source = fs.readFileSync(child, "utf8");
    if (/^name:\s*task-target-alignment-eval\s*$/m.test(source)) {
      failures.push(`Project eval Skill leaked into shared distribution: ${path.relative(workspace, child)}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    valid: true,
    canonicalSkill: path.relative(workspace, canonicalSkill),
    discoveryLink: path.relative(workspace, discoveryLink),
    cases: "evals/task-target-alignment/cases.json",
    evaluator: "evals/scripts/evaluate-task-target-alignment.js",
    published: false,
  }, null, 2));
}
