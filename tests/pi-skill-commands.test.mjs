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
    "workspace-capture-lessons",
    "workspace-maintain-context",
    "workspace-manage-task",
    "writing-great-skills",
  ];

  for (const name of selectedNames) assert.ok(commands.has(name), `missing /${name}`);
  assert.equal(commands.has("integrate-third-skills"), false);
  assert.equal(commands.has("mattpocock"), false);
  assert.equal(commands.has("workspace-workflow"), false);
  assert.match(commands.get("grilling").description, /Alias for \/skill:grilling/);
});
