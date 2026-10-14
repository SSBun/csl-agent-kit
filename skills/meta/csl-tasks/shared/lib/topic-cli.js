"use strict";

const fs = require("node:fs");
const topics = require("./topic-core.js");
const core = require("./task-core.js");

const HELP = `Topic commands (under csl-tasks.js topic):
  list
  show <topic-id>
  create <topic-id> --title <title> --spec-json <file>
  update-spec <topic-id> --expected <topic-version> --spec-json <file>
  update-resources <topic-id> --expected <topic-version> --resources-json <file>
  activate|archive|restore <topic-id> --expected <topic-version>
    archive may name --owner-task <project:task-id|self:task-id> for its active maintenance task
  check <topic-id>
  rebuild-index
  task <task-id>
  attach <task-id> <project:topic-id|self:topic-id>
    --expected <task-version> --expected-topic <topic-version>
    --mode implementation|maintenance --applies <scope> --purpose <description>
    [--allow-cross-workspace]
  detach <task-id> --expected <task-version> [--allow-cross-workspace]
  adopt <task-id> --expected <task-version> --expected-topic <topic-version> --evidence <impact-analysis>
  repair <topic-id> <project:task-id|self:task-id> --expected <topic-version>
    --purpose <description> [--allow-cross-workspace]

show returns the full Topic and a version for optimistic writes; task returns the task version and freshness.
Spec JSON: {"scope":"...","spec":"...","decisions":"...","dependencies":[{"path":"repo-relative-file","sha256":"..."}]}
Resources JSON: [{"label":"...","target":"repo-relative-file or https://...","purpose":"...","kind":"reference"}]
Normative resources use kind normative and require sha256 of an existing local file; reference resources do not have sha256.
Topic state and maintenance mode do not grant execution authorization. Cross-workspace writes require separate user authorization.`;

function summary(workspace, topic) {
  return { id: topic.id, title: topic.title, state: topic.state, revision: topic.revision, version: topic.version, file: topic.file, spec: topic.spec, resources: topic.resources || [], resourcesDirectory: topics.safePath(workspace, `tasks/topics/${topic.id}/resources`), tasks: topics.members(workspace, topic), ...(Object.hasOwn(topic, "pendingAssociation") ? { pendingAssociation: topic.pendingAssociation } : {}) };
}

function run(workspace, input, takeOption) {
  const args = [...input];
  const command = args.shift();
  const allowCross = args.includes("--allow-cross-workspace");
  if (allowCross) args.splice(args.indexOf("--allow-cross-workspace"), 1);
  const expected = takeOption(args, "--expected");
  const expectedTopic = takeOption(args, "--expected-topic");
  const purpose = takeOption(args, "--purpose");
  const ownerTask = takeOption(args, "--owner-task");
  const applies = takeOption(args, "--applies");
  const mode = takeOption(args, "--mode");
  const evidence = takeOption(args, "--evidence");
  const title = takeOption(args, "--title");
  const specFile = takeOption(args, "--spec-json");
  const resourcesFile = takeOption(args, "--resources-json");
  const values = { expected, expectedTopic, purpose, ownerTask, applies, mode, evidence, title, specFile, resourcesFile, allowCross: allowCross || undefined };
  const allowed = {
    list: [], show: [], create: ["title", "specFile"], "update-spec": ["expected", "specFile"], "update-resources": ["expected", "resourcesFile"],
    activate: ["expected"], archive: ["expected", "ownerTask"], restore: ["expected"], check: [], "rebuild-index": [], task: [],
    attach: ["expected", "expectedTopic", "purpose", "applies", "mode", "allowCross"],
    detach: ["expected", "allowCross"], adopt: ["expected", "expectedTopic", "evidence"],
    repair: ["expected", "purpose", "allowCross"],
  };
  if (!Object.hasOwn(allowed, command)) throw new Error(`unknown topic command: ${command}\n${HELP}`);
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && !allowed[command].includes(key)) throw new Error(`unexpected topic option: ${key}`);
  }
  const count = ["list", "rebuild-index"].includes(command) ? 0 : ["attach", "repair"].includes(command) ? 2 : 1;
  if (args.length !== count) throw new Error(`${command} needs ${count} positional argument(s)`);
  const [id, reference] = args;
  const readSpec = () => {
    if (!specFile) throw new Error("--spec-json is required");
    return JSON.parse(fs.readFileSync(specFile, "utf8"));
  };
  const taskSummary = (task) => ({ id: task.id, version: topics.hash(task.text), topic: task.topic || null, pendingAssociation: topics.pendingTransaction(workspace, task.id) || null, freshness: topics.freshness(workspace, task) });
  switch (command) {
    case "list": return topics.listTopics(workspace).map((topic) => ({ id: topic.id, title: topic.title, state: topic.state, revision: topic.revision, version: topic.version }));
    case "show": return summary(workspace, topics.readTopic(workspace, id));
    case "create": return summary(workspace, topics.createTopic(workspace, id, title, readSpec()));
    case "update-spec": return summary(workspace, topics.updateSpec(workspace, id, expected, readSpec()));
    case "update-resources": {
      if (!resourcesFile) throw new Error("--resources-json is required");
      return summary(workspace, topics.updateResources(workspace, id, expected, JSON.parse(fs.readFileSync(resourcesFile, "utf8"))));
    }
    case "activate": {
      if (topics.readTopic(workspace, id).state !== "Draft") throw new Error("activate requires Draft; use restore for Archived");
      return summary(workspace, topics.setState(workspace, id, "Active", expected));
    }
    case "restore": {
      if (topics.readTopic(workspace, id).state !== "Archived") throw new Error("restore requires Archived");
      return summary(workspace, topics.setState(workspace, id, "Active", expected));
    }
    case "archive": return summary(workspace, topics.setState(workspace, id, "Archived", expected, ownerTask));
    case "check": return topics.check(workspace, id);
    case "rebuild-index": return topics.rebuildIndex(workspace);
    case "task": return taskSummary(core.readTask(workspace, id));
    case "attach": return taskSummary(topics.association(workspace, id, reference, { expectedTask: expected, expectedTopic, purpose, applies, mode, allowCross }));
    case "detach": return taskSummary(topics.association(workspace, id, undefined, { expectedTask: expected, allowCross }));
    case "adopt": return taskSummary(topics.adopt(workspace, id, { expectedTask: expected, expectedTopic, evidence }));
    case "repair": return summary(workspace, topics.repair(workspace, id, reference, { expectedTopic: expected, purpose, allowCross }));
  }
}

module.exports = { HELP, run };
