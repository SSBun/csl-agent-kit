#!/usr/bin/env node
"use strict";

const path = require("node:path");
const core = require("../lib/task-core.js");

const HELP = `Usage: node csl-tasks.js [--workspace <dir>] <command> [arguments]

Commands:
  create <id> --title <title> --kind task|plan|queue --target "T1: ..." [--target ...]
  list [--json]
  show <id> [--json]
  validate [id]
  check <id|task-file>
  sync <id>
  status <id> <pending|in-progress|in-review|blocked|cancelled>
  cancel <id>
  resume <id>
  reopen <id>
  link <parent-id> <child-id>
  next <queue-id> [--json]
  result <id> <Tn> --evidence <text>
  review <id> <skipped|required|approved> --evidence <text>
  verify <id> <passed|failed> --evidence <text>
  complete <id>`;

function takeOption(args, name, { many = false } = {}) {
  const values = [];
  for (let index = 0; index < args.length;) {
    if (args[index] !== name) {
      index++;
      continue;
    }
    if (index + 1 >= args.length) throw new Error(`${name} needs a value`);
    values.push(args[index + 1]);
    args.splice(index, 2);
  }
  return many ? values : values.at(-1);
}

function summary(task) {
  return {
    id: task.id,
    title: task.title,
    kind: task.kind || "legacy",
    state: task.status.state,
    status: task.status.display,
    parent: task.parent || null,
    children: task.children.map(({ id }) => id),
  };
}

function run(argv, io = console) {
  const args = [...argv];
  if (args.includes("--help") || args.length === 0) {
    io.log(HELP);
    return args.length === 0 ? 2 : 0;
  }

  try {
    const workspace = path.resolve(takeOption(args, "--workspace") || process.cwd());
    const json = args.includes("--json");
    if (json) args.splice(args.indexOf("--json"), 1);
    const command = args.shift();
    let output;

    switch (command) {
      case "create": {
        const id = args.shift();
        const title = takeOption(args, "--title");
        const kind = takeOption(args, "--kind") || "task";
        const targets = takeOption(args, "--target", { many: true });
        if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
        output = summary(core.createTask(workspace, { id, title, kind, targets }));
        break;
      }
      case "list":
        if (args.length) throw new Error(`unexpected arguments: ${args.join(" ")}`);
        output = core.listTasks(workspace).map(summary);
        break;
      case "show": {
        const task = core.readTask(workspace, args[0]);
        if (args.length !== 1) throw new Error("show needs one task id");
        if (!json) {
          io.log(task.text.replace(/\s+$/, ""));
          return 0;
        }
        output = summary(task);
        break;
      }
      case "validate": {
        if (args.length > 1) throw new Error("validate accepts at most one task id");
        if (args[0]) core.checkTaskIndex(workspace, args[0]);
        const errors = core.validateWorkspace(workspace);
        if (errors.length) throw new Error(errors.join("; "));
        output = { valid: true };
        break;
      }
      case "check":
        if (args.length !== 1) throw new Error("check needs one task id or file");
        core.checkTaskIndex(workspace, args[0]);
        output = { valid: true };
        break;
      case "sync":
        if (args.length !== 1) throw new Error("sync needs one task id");
        output = summary(core.syncIndex(workspace, args[0]));
        break;
      case "status":
        if (args.length !== 2) throw new Error("status needs a task id and state");
        output = summary(core.setState(workspace, args[0], args[1]));
        break;
      case "cancel":
        if (args.length !== 1) throw new Error("cancel needs one task id");
        output = summary(core.cancelTask(workspace, args[0]));
        break;
      case "resume":
        if (args.length !== 1) throw new Error("resume needs one task id");
        output = summary(core.resumeTask(workspace, args[0]));
        break;
      case "reopen":
        if (args.length !== 1) throw new Error("reopen needs one task id");
        output = summary(core.reopenTask(workspace, args[0]));
        break;
      case "link":
        if (args.length !== 2) throw new Error("link needs parent and child ids");
        output = { parent: args[0], child: args[1] };
        core.linkChild(workspace, args[0], args[1]);
        break;
      case "next": {
        if (args.length !== 1) throw new Error("next needs one Queue task id");
        const task = core.nextChild(workspace, args[0]);
        if (!task) output = null;
        else if (!json) {
          io.log(task.id);
          return 0;
        } else output = summary(task);
        break;
      }
      case "result": {
        const [id, targetId] = args.splice(0, 2);
        const evidence = takeOption(args, "--evidence");
        if (!id || !targetId || args.length) throw new Error("result needs a task id, Target ID, and --evidence");
        output = summary(core.recordResult(workspace, id, targetId, evidence));
        break;
      }
      case "review": {
        const [id, decision] = args.splice(0, 2);
        const evidence = takeOption(args, "--evidence");
        if (!id || !decision || args.length) throw new Error("review needs a task id, decision, and --evidence");
        output = summary(core.setReviewGate(workspace, id, decision, evidence));
        break;
      }
      case "verify": {
        const [id, decision] = args.splice(0, 2);
        const evidence = takeOption(args, "--evidence");
        if (!id || !["passed", "failed"].includes(decision) || args.length) {
          throw new Error("verify needs a task id, passed|failed, and --evidence");
        }
        output = summary(core.recordVerification(workspace, id, decision === "passed", evidence));
        break;
      }
      case "complete":
        if (args.length !== 1) throw new Error("complete needs one task id");
        output = summary(core.completeTask(workspace, args[0]));
        break;
      default:
        throw new Error(`unknown command: ${command}`);
    }

    io.log(JSON.stringify(output, null, json ? 2 : 0));
    return 0;
  } catch (error) {
    io.error(`csl-tasks: ${error.message}`);
    return 1;
  }
}

if (require.main === module) process.exit(run(process.argv.slice(2)));

module.exports = { HELP, run };
