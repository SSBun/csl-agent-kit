#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");

function comment(line) {
  const match = line.match(/^[ \t]*(\/\/|#|--|;|\/\*|<!--)[ \t]?(.*)$/);
  if (!match) return null;
  const prefix = match[1];
  let body = match[2];
  const suffix = prefix === "/*" ? "*/" : prefix === "<!--" ? "-->" : null;
  if (suffix) {
    if (!body.trimEnd().endsWith(suffix)) return null;
    body = body.trimEnd().slice(0, -suffix.length).trimEnd();
    if (body.includes(suffix) || body.includes(prefix)) return null;
  }
  return { prefix, body: body.trim() };
}

function preview(content) {
  const lines = content.match(/[^\n]*\n|[^\n]+$/g) || [];
  const ranges = [];
  const kept = [];
  let active = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/\r?\n$/, "");
    const parsed = comment(line);
    const marker = parsed?.body.match(/^@code\x2dreview:(begin|end) ([a-zA-Z0-9][a-zA-Z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*)$/);
    if (parsed?.body.includes("@code" + "-review") && !marker) throw new Error(`第 ${index + 1} 行审查标记残缺或格式不合法`);
    if (marker?.[1] === "begin") {
      if (active) throw new Error(`第 ${index + 1} 行出现嵌套审查块`);
      active = { id: marker[2], start: index + 1, prefix: parsed.prefix };
    } else if (marker?.[1] === "end") {
      if (!active || active.id !== marker[2] || active.prefix !== parsed.prefix) throw new Error(`第 ${index + 1} 行结束标记不匹配`);
      ranges.push({ id: active.id, start: active.start, end: index + 1 });
      active = null;
    } else if (active) {
      if (!parsed || parsed.prefix !== active.prefix) throw new Error(`第 ${index + 1} 行不是同类独立注释；拒绝删除可能的业务代码`);
    } else {
      kept.push(lines[index]);
    }
  }
  if (active) throw new Error(`第 ${active.start} 行开始的审查块未闭合`);
  return {
    sourceSha256: crypto.createHash("sha256").update(content).digest("hex"),
    ranges,
    content: kept.join(""),
  };
}

function main() {
  try {
    if (process.argv.length !== 3 || process.argv[2] === "--help") {
      process.stdout.write("用法：node preview-clean.js <file>\n只输出 JSON 预览，不修改文件或暂存区。\n");
      process.exitCode = process.argv[2] === "--help" ? 0 : 1;
      return;
    }
    const file = path.resolve(process.argv[2]);
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4 * 1024 * 1024) throw new Error("只支持 4 MiB 以内的普通 UTF-8 文件，不跟随符号链接");
    const bytes = fs.readFileSync(file);
    const content = bytes.toString("utf8");
    if (!Buffer.from(content).equals(bytes) || bytes.includes(0)) throw new Error("文件不是支持的 UTF-8 源码");
    process.stdout.write(`${JSON.stringify({ file, ...preview(content) }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

if (require.main === module) main();
module.exports = { preview };
