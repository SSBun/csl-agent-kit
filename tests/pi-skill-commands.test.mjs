import assert from "node:assert/strict";
import test from "node:test";

import cslSkillCommands from "../pi/extensions/csl-skill-commands.ts";

test("registers aliases for nested skills", () => {
  const commands = new Map();
  cslSkillCommands({
    registerCommand(name, command) {
      commands.set(name, command);
    },
  });

  const selectedNames = [
    "align",
    "code-review",
    "csl-task",
    "csl-task-auto",
    "csl-task-plan",
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
    "tldr",
    "workspace-lessons",
    "workspace-context",
    "writing-great-skills",
  ];

  for (const name of selectedNames) assert.ok(commands.has(name), `missing /${name}`);
  assert.equal(commands.has("integrate-third-skills"), false);
  assert.equal(commands.has("mattpocock"), false);
  assert.equal(commands.has("code-reviewer"), false);
  assert.equal(commands.has("deep-explore"), false);
  assert.equal(commands.has("same-page"), false);
  assert.equal(commands.has("workspace-workflow"), false);
  assert.equal(commands.has("csl-tasks"), false);
  assert.equal(commands.has("workspace-capture-lessons"), false);
  assert.equal(commands.has("workspace-manage-task"), false);
  assert.equal(commands.has("workspace-maintain-context"), false);
  assert.match(commands.get("grilling").description, /Alias for \/skill:grilling/);
});
