#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { parseMarkdown } = require("./lib/rule.js");

function run(args, io = console) {
  let options;
  try {
    options = parseArguments(args);
  } catch (error) {
    io.error(`Error: ${error.message}`);
    return 2;
  }

  if (options.help) {
    io.log("Usage: node scripts/validate-rules.js [--scope global|project] <file.md>...");
    return 0;
  }

  let failed = false;
  for (const file of options.files) {
    if (path.extname(file) !== ".md") {
      io.error(`${file}: [file-extension] expected a .md trigger file`);
      failed = true;
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (error) {
      io.error(`${file}: [file-unreadable] ${error.message}`);
      failed = true;
      continue;
    }

    const parsed = parseMarkdown(content, file, options.scope);
    if (parsed.valid) {
      io.log(`${file}: valid`);
      continue;
    }
    for (const error of parsed.errors) io.error(`[${error.code}] ${error.message}`);
    failed = true;
  }
  return failed ? 1 : 0;
}

function parseArguments(args) {
  const options = { scope: "project", files: [], help: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") {
      options.help = true;
      continue;
    }
    if (argument === "--scope") {
      options.scope = args[index + 1];
      index += 1;
      if (!["global", "project"].includes(options.scope)) throw new Error("--scope must be global or project");
      continue;
    }
    if (argument.startsWith("--")) throw new Error(`unknown option: ${argument}`);
    options.files.push(argument);
  }
  if (!options.help && options.files.length === 0) throw new Error("at least one trigger Markdown file is required");
  return options;
}

if (require.main === module) process.exit(run(process.argv.slice(2)));

module.exports = { run };
