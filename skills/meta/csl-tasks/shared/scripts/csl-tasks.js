#!/usr/bin/env node
"use strict";

const path = require("node:path");
const fs = require("node:fs");
const core = require("../lib/task-core.js");
const topics = require("../lib/topic-core.js");
const topicCli = require("../lib/topic-cli.js");

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
  snapshot <id> --file <workspace-relative-file> [--file ...]
  check-evidence <id> [--include-legacy]
  review-report <id> --input <feedback-file> --snapshot <identity> --outcome <outcome> --mode <actual-mode> [--run <identity>]
    recover an unindexed managed report with --existing-round <NN> instead
  assess-review <id> <R0|R1|R2> --reason <text> --snapshot <identity> --evidence <text>
    R1 also requires --clarity <text> --impact <text> --risk <text> --verification <text>
  review <id> <skipped|required|passed|approved> --evidence <text>
    passed may use --resolve-ledger --snapshot <reviewed-identity> after all findings resolve
  verify <id> <passed|failed> --evidence <text>
  complete <id>
  finalize <id> <R0|R1> --result "T1: observation" [--result ...] --reason <text> --snapshot <identity> --evidence <text> --final-verification <text>
    R1 also requires --clarity <text> --impact <text> --risk <text> --verification <text>
  topic <command> [arguments]

${topicCli.HELP}`;

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
    reviewAssessment: task.reviewAssessment || null,
    ...(Object.keys(task.recovery).length ? { recovery: task.recovery } : {}),
    ...(task.topic ? { topic: task.topic } : {}),
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
      case "topic":
        output = topicCli.run(workspace, args, takeOption);
        break;
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
        {
          const task = core.resumeTask(workspace, args[0]);
          output = { ...summary(task), ...(task.topic ? { topicFreshness: topics.freshness(workspace, task) } : {}) };
        }
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
      case "assess-review": {
        const [id, level] = args.splice(0, 2);
        const options = Object.fromEntries(["reason", "snapshot", "evidence", "clarity", "impact", "risk", "verification"]
          .map((key) => [key, takeOption(args, `--${key}`)]));
        if (!id || !level || args.length) throw new Error("assess-review needs a task id, R0|R1|R2, and assessment evidence options");
        output = summary(core.recordReviewAssessment(workspace, id, level, options));
        break;
      }
      case "snapshot": {
        const id = args.shift();
        const files = takeOption(args, "--file", { many: true });
        if (!id || !files.length || args.length) throw new Error("snapshot needs a task id and explicit --file paths");
        output = core.recordSnapshot(workspace, id, files);
        break;
      }
      case "check-evidence": {
        const id = args.shift();
        const includeLegacy = args.includes("--include-legacy");
        if (includeLegacy) args.splice(args.indexOf("--include-legacy"), 1);
        if (!id || args.length) throw new Error("check-evidence needs one task id");
        output = core.checkEvidence(workspace, id, { includeLegacy });
        break;
      }
      case "review-report": {
        const id = args.shift();
        const input = takeOption(args, "--input");
        const snapshot = takeOption(args, "--snapshot");
        const outcome = takeOption(args, "--outcome");
        const mode = takeOption(args, "--mode");
        const run = takeOption(args, "--run");
        const existingRound = takeOption(args, "--existing-round");
        if (!id || args.length || (existingRound ? input || snapshot || outcome || mode || run : !input || !snapshot || !outcome || !mode)) {
          throw new Error("review-report needs --input/--snapshot/--outcome/--mode, or only --existing-round");
        }
        output = core.recordReviewReport(workspace, id, existingRound ? { existingRound } : { feedback: fs.readFileSync(path.resolve(input), "utf8"), snapshot, outcome, mode, run });
        break;
      }
      case "review": {
        const [id, decision] = args.splice(0, 2);
        const evidence = takeOption(args, "--evidence");
        const snapshot = takeOption(args, "--snapshot");
        const resolveLedger = args.includes("--resolve-ledger");
        if (resolveLedger) args.splice(args.indexOf("--resolve-ledger"), 1);
        if (!id || !decision || args.length) throw new Error("review needs a task id, decision, and --evidence");
        output = summary(core.setReviewGate(workspace, id, decision, evidence, { resolveLedger, snapshot }));
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
      case "finalize": {
        const [id, level] = args.splice(0, 2);
        const options = Object.fromEntries(["reason", "snapshot", "evidence", "clarity", "impact", "risk", "verification"]
          .map((key) => [key, takeOption(args, `--${key}`)]));
        options.results = takeOption(args, "--result", { many: true });
        options.finalVerification = takeOption(args, "--final-verification");
        if (!id || !level || args.length) throw new Error("finalize needs a task id, R0|R1, per-Target --result, assessment options, and --final-verification");
        output = summary(core.finalizeTask(workspace, id, level, options));
        break;
      }
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
