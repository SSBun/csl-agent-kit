#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const TIMESTAMP_PATTERN = "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01]) (?:[01]\\d|2[0-3]):[0-5]\\d";
const STATE_PATTERN = "(?:Pending|In Progress|In Review|Completed|Blocked)";
const STATUS_PATTERN = `Status \\(${TIMESTAMP_PATTERN}\\): ${STATE_PATTERN}`;
const STATUS_LINE = new RegExp(`^${STATUS_PATTERN}$`);
const INDEX_ENTRY = new RegExp(`^- (.+) — (${STATUS_PATTERN}) — \\[[^\\]]+\\]\\(todo\\/([a-z0-9-]+\\.md)\\)$`);

function run(args, io = console) {
  if (args.length !== 1 || args[0] === "--help") {
    io.log("Usage: node check-task-index.js <tasks/todo/task-slug.md>");
    return args[0] === "--help" ? 0 : 2;
  }

  try {
    checkTaskIndex(args[0]);
    io.log(`${args[0]}: valid task index record`);
    return 0;
  } catch (error) {
    io.error(`${args[0]}: ${error.message}`);
    return 1;
  }
}

function checkTaskIndex(taskFile) {
  const absoluteTask = path.resolve(taskFile);
  const fileName = path.basename(absoluteTask);
  const todoDir = path.dirname(absoluteTask);
  const tasksDir = path.dirname(todoDir);
  if (path.basename(todoDir) !== "todo" || path.basename(tasksDir) !== "tasks" || !/^[a-z0-9-]+\.md$/.test(fileName)) {
    throw new Error("expected a tasks/todo/<task-slug>.md path");
  }

  const taskLines = fs.readFileSync(absoluteTask, "utf8").split(/\r?\n/);
  const title = taskLines.find((line) => line.startsWith("# "))?.slice(2);
  const status = taskLines.find((line) => STATUS_LINE.test(line));
  if (!title) throw new Error("canonical task is missing its title");
  if (!status) throw new Error("canonical task is missing a standard status line");

  const indexPath = path.join(tasksDir, "todo.md");
  const link = `(todo/${fileName})`;
  const entries = fs.readFileSync(indexPath, "utf8").split(/\r?\n/).filter((line) => line.includes(link));
  if (entries.length !== 1) throw new Error(`expected exactly one tasks/todo.md entry for ${fileName}`);

  const match = entries[0].match(INDEX_ENTRY);
  if (!match) throw new Error("task index entry does not match the standard format");
  if (match[1] !== title) throw new Error("task index title does not match the canonical task");
  if (match[2] !== status) throw new Error("task index status does not match the canonical task");
  if (match[3] !== fileName) throw new Error("task index link does not match the canonical task");
}

if (require.main === module) process.exit(run(process.argv.slice(2)));

module.exports = { checkTaskIndex, run };
