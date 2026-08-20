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
    "archive",
    "task-review",
    "task",
    "task-plan",
    "task-queue",
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
  assert.equal(commands.has("code-review"), false);
  assert.equal(commands.has("code-reviewer"), false);
  assert.equal(commands.has("deep-explore"), false);
  assert.equal(commands.has("same-page"), false);
  assert.equal(commands.has("workspace-workflow"), false);
  assert.equal(commands.has("csl-task"), false);
  assert.equal(commands.has("csl-task-plan"), false);
  assert.equal(commands.has("csl-task-auto"), false);
  assert.equal(commands.has("csl-tasks"), false);
  assert.equal(commands.has("workspace-capture-lessons"), false);
  assert.equal(commands.has("workspace-manage-task"), false);
  assert.equal(commands.has("workspace-maintain-context"), false);
  assert.match(commands.get("grilling").description, /Alias for \/skill:grilling/);
});

test("passes the pre-dispatch Pi branch boundary to archive", async () => {
  const commands = new Map();
  const messages = [];
  cslSkillCommands({
    registerCommand(name, command) {
      commands.set(name, command);
    },
    sendUserMessage(message, options) {
      messages.push({ message, options });
    },
  });

  await commands.get("archive").handler('"the task focus discussion"', {
    cwd: "/workspace",
    isIdle: () => true,
    sessionManager: {
      getLeafId: () => "leaf-before-archive",
      getSessionFile: () => "/sessions/current.jsonl",
      getSessionId: () => "session-id",
    },
    ui: { notify: assert.fail },
  });

  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /User request: "the task focus discussion"/);
  assert.match(messages[0].message, /"sourceLeaf":"leaf-before-archive"/);
  assert.ok(messages[0].message.includes('"sessionFile":"/sessions/current.jsonl"'));
  assert.match(messages[0].message, /immediately before this \/archive dispatch/);
});

test("waits for an active turn before capturing the archive boundary", async () => {
  const commands = new Map();
  const messages = [];
  const notifications = [];
  let idle = false;
  let leaf = "leaf-before-wait";
  cslSkillCommands({
    registerCommand(name, command) {
      commands.set(name, command);
    },
    sendUserMessage(message) {
      messages.push(message);
    },
  });

  await commands.get("archive").handler("the active discussion", {
    cwd: "/workspace",
    isIdle: () => idle,
    waitForIdle: async () => {
      idle = true;
      leaf = "leaf-after-wait";
    },
    sessionManager: {
      getLeafId: () => leaf,
      getSessionFile: () => "/sessions/current.jsonl",
      getSessionId: () => "session-id",
    },
    ui: { notify: (...args) => notifications.push(args) },
  });

  assert.deepEqual(notifications, [[
    "Waiting for the current Agent turn before capturing the archive boundary.",
    "info",
  ]]);
  assert.match(messages[0], /"sourceLeaf":"leaf-after-wait"/);
});

test("refuses archive when the Pi session is not persisted", async () => {
  const commands = new Map();
  const notifications = [];
  cslSkillCommands({
    registerCommand(name, command) {
      commands.set(name, command);
    },
    sendUserMessage: assert.fail,
  });

  await commands.get("archive").handler("this discussion", {
    cwd: "/workspace",
    isIdle: () => true,
    sessionManager: {
      getLeafId: () => "leaf",
      getSessionFile: () => undefined,
      getSessionId: () => "session-id",
    },
    ui: { notify: (...args) => notifications.push(args) },
  });

  assert.deepEqual(notifications, [[
    "Exact archiving requires a persisted Pi session with an active branch.",
    "error",
  ]]);
});
