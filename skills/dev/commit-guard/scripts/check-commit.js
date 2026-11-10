#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Match the reserved substring anywhere, even without comment syntax or a valid pair.
const MARKER_PATTERN = "@code" + "-review";
const NON_COMMIT_COMMANDS = new Set([
  "add", "status", "diff", "log", "show", "restore", "reset", "checkout", "switch",
  "branch", "tag", "fetch", "push", "remote", "config", "rev-parse", "rev-list",
  "ls-files", "ls-tree", "cat-file", "grep", "check-ignore", "check-attr", "blame",
  "reflog", "init", "clone", "rm", "mv", "clean", "worktree", "help",
]);
const SHELL_WRAPPERS = new Set(["env", "command", "sudo", "exec", "time", "nice", "nohup", "timeout", "setsid", "xargs", "builtin", "sh", "bash", "zsh", "eval"]);
const VALUE_OPTIONS = new Set(["-m", "--message", "-F", "--file", "--author", "--date", "--cleanup", "--trailer"]);
const FLAG_OPTIONS = new Set(["--amend", "--no-edit", "--allow-empty", "--allow-empty-message", "-s", "--signoff", "-v", "--verbose", "-q", "--quiet", "--no-gpg-sign", "--reset-author"]);

function denied(reason) {
  return { blocked: true, reason: `${reason}\n未执行提交，也未修改工作区或暂存区。请修复后重试；如需 Agent 清理，请明确要求清理审查说明。` };
}

// Deliberately accepts a literal argv, not a general-purpose shell program.
function literalWords(command) {
  const words = [];
  let value = "";
  let quote = null;
  let started = false;
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else value += ch;
      continue;
    }
    if (ch === "$" || ch === "`") throw new Error("不支持变量展开或命令替换");
    if (ch === "\\") {
      const next = command[++i];
      if (next === undefined || next === "\n" || next === "\r") throw new Error("不支持续行或残缺转义");
      if (quote === '"' && !['"', "\\", "$", "`"].includes(next)) value += "\\";
      value += next;
      started = true;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      else value += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; started = true; continue; }
    if (/[\n\r;&|<>(){}*?\[\]~#]/.test(ch)) throw new Error("请将提交独立执行，不使用组合命令、重定向或 shell 展开");
    if (/[ \t]/.test(ch)) {
      if (started) words.push(value);
      value = "";
      started = false;
    } else { value += ch; started = true; }
  }
  if (quote) throw new Error("引号未闭合");
  if (started) words.push(value);
  return words;
}

function gitResult(executable, cwd, args) {
  const result = spawnSync(executable, args, {
    cwd, encoding: "utf8", timeout: 8000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LC_ALL: "C" },
    shell: false,
  });
  if (result.error || result.signal) throw new Error("Git 检查超时、输出超限或无法启动");
  return result;
}

function requireSuccess(result, operation) {
  if (result.status !== 0) throw new Error(`${operation}失败：${String(result.stderr || "Git 返回错误").trim().slice(0, 500)}`);
  return result.stdout;
}

function inspectIndex(cwd, executable = "git") {
  const root = requireSuccess(gitResult(executable, cwd, ["rev-parse", "--show-toplevel"]), "定位仓库").trim();
  const unmerged = requireSuccess(gitResult(executable, root, ["ls-files", "--unmerged", "-z"]), "读取冲突状态");
  if (unmerged) throw new Error("暂存区仍有冲突，无法确定提交内容");
  // Read complete staged blobs outside the root-owned runtime data directory.
  // -a prevents binary attributes/content from silently hiding a marker.
  const result = gitResult(executable, root, ["grep", "--cached", "--full-name", "--no-color", "-n", "-z", "-a", "-F", "-o", "-e", MARKER_PATTERN, "--", ":(top,glob)**", ":(top,exclude,glob).csl-agent-kit/**"]);
  if (result.status === 1) return [];
  requireSuccess(result, "扫描暂存内容");
  const locations = [];
  const record = /([^\0]+)\0([0-9]+)\0[^\n]*(?:\n|$)/g;
  for (const match of result.stdout.matchAll(record)) {
    locations.push({ path: path.join(root, match[1]), line: Number(match[2]) });
  }
  if (locations.length === 0) throw new Error("Git 扫描发现标记，但无法解析位置");
  return locations;
}

function visibleGitInvocation(command, depth = 0) {
  if (depth > 32) return /\bgit\b/.test(command);
  // Locate executable positions without executing shell syntax. Here-document
  // data is skipped through its delimiter; scanning resumes after the body.
  let token = "";
  let quote = null;
  let executable = true;
  let wrapper = false;
  let found = false;
  let redirectTarget = false;
  const documents = [];
  const flush = () => {
    if (!token) return;
    if (redirectTarget) { redirectTarget = false; token = ""; return; }
    const name = path.basename(token);
    if ((executable || wrapper) && name === "git" || wrapper && /\bgit\b/.test(token)) found = true;
    if (["if", "then", "else", "elif", "do", "while", "until", "coproc", "!"].includes(token) || /^[A-Za-z_][A-Za-z_0-9]*=/.test(token) && executable) {
      executable = true;
    } else {
      if (executable) wrapper = SHELL_WRAPPERS.has(name);
      executable = false;
    }
    token = "";
  };
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    if (quote) {
      if (quote === '"' && (ch === "`" || ch === "$" && command[i + 1] === "(")) {
        if (visibleGitInvocation(command.slice(i + (ch === "`" ? 1 : 2)), depth + 1)) return true;
      }
      if (ch === quote) quote = null;
      else if (ch === "\\" && quote === '"') {
        const next = command[++i];
        if (next !== "\n") token += next || "";
      }
      else token += ch;
      continue;
    }
    if (ch === "`" || ch === "$" && command[i + 1] === "(") {
      if (visibleGitInvocation(command.slice(i + (ch === "`" ? 1 : 2)), depth + 1)) return true;
    }
    if (ch === "$" && ["'", '"'].includes(command[i + 1])) continue;
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === "\\") {
      const next = command[++i];
      if (next !== "\n") token += next || "";
      continue;
    }
    if (ch === "#" && !token) {
      while (i + 1 < command.length && command[i + 1] !== "\n") i += 1;
      continue;
    }
    if (ch === "<" && command[i + 1] === "<") {
      flush();
      const match = command.slice(i).match(/^<<(-?)[ \t]*(?:'([^'\n]+)'|"([^"\n]+)"|([A-Za-z_][A-Za-z_0-9]*))(?=[ \t\r\n;&|]|$)/);
      if (!match) return found || /\bgit\b/.test(command);
      documents.push({ delimiter: match[2] || match[3] || match[4], tabs: match[1] === "-", expands: Boolean(match[4]) });
      i += match[0].length - 1;
      continue;
    }
    if (ch === ">" || ch === "<") {
      if (executable && /^\d+$/.test(token)) token = "";
      flush();
      redirectTarget = true;
      while ([">", "<", "&", "|"].includes(command[i + 1])) i += 1;
      continue;
    }
    if (/[;&|\n(){}]/.test(ch)) { flush(); executable = true; wrapper = false; redirectTarget = false; }
    else if (/[ \t\r]/.test(ch)) flush();
    else token += ch;
    if (ch === "\n" && documents.length) {
      for (const document of documents) {
        let closed = false;
        while (i + 1 < command.length) {
          const start = i + 1;
          const newline = command.indexOf("\n", start);
          const end = newline === -1 ? command.length : newline;
          const line = command.slice(start, end);
          i = end;
          if ((document.tabs ? line.replace(/^\t+/, "") : line) === document.delimiter) { closed = true; break; }
          if (document.expands && /[$`]/.test(line) && /\bgit\b/.test(line)) found = true;
        }
        if (!closed) return found || /\bgit\b/.test(command);
      }
      documents.length = 0;
    }
  }
  flush();
  return found;
}

function checkCommand(command, workspace) {
  if (typeof command !== "string") return denied("缺少 shell 命令，无法检查提交入口。");
  // This guard covers visible Git invocations, not arbitrary scripts that hide
  // Git calls. Do not evaluate shell text to discover what it would execute.
  let words;
  try { words = literalWords(command); } catch (error) {
    return visibleGitInvocation(command) ? denied(error.message) : { blocked: false };
  }
  const executable = words.shift();
  if (!executable || path.basename(executable) !== "git") {
    const name = path.basename(executable || "");
    const wrapper = SHELL_WRAPPERS.has(name);
    return visibleGitInvocation(command) || wrapper && words.some((word) => /\bgit\b/.test(word))
      ? denied("Git 操作必须直接调用 git；请拆分 env、shell 包装和提交，使用 git -C 指定仓库。")
      : { blocked: false };
  }
  let cwd = workspace;
  while (words[0]?.startsWith("-")) {
    const option = words.shift();
    if (option === "-C") {
      const directory = words.shift();
      if (directory === undefined) return denied("git -C 缺少目录。");
      cwd = path.resolve(cwd, directory || ".");
    } else if (option === "--no-pager") continue;
    else if (["--version", "--help"].includes(option) && words.length === 0) return { blocked: false };
    else return denied(`暂不支持 Git 全局选项 ${option}；请使用直接的 git -C <仓库> commit。`);
  }
  const subcommand = words.shift();
  if (!subcommand || NON_COMMIT_COMMANDS.has(subcommand)) return { blocked: false };
  if (subcommand !== "commit") return denied(`无法确定 git ${subcommand} 是否产生提交；别名及 merge/rebase/cherry-pick/revert/am/stash 等入口不自动放行。请使用可检查的显式暂存与 git commit 流程。`);
  for (let i = 0; i < words.length; i += 1) {
    const option = words[i];
    if (FLAG_OPTIONS.has(option) || option === "-S" || option.startsWith("--gpg-sign=")) continue;
    if (VALUE_OPTIONS.has(option)) {
      if (words[++i] === undefined) return denied(`${option} 缺少参数。`);
      continue;
    }
    if ([...VALUE_OPTIONS].some((name) => name.startsWith("--") && option.startsWith(`${name}=`))) continue;
    if (/^-[mF].+/.test(option)) continue;
    return denied(`暂不支持提交参数 ${option}。请先单独暂存，再使用 git commit -m 或 -F；不要使用 -a、路径、交互暂存、--no-verify 或组合命令。`);
  }
  try {
    const locations = inspectIndex(cwd, executable);
    if (locations.length) {
      const visible = locations.slice(0, 30).map((item) => `${JSON.stringify(item.path)}:${item.line}`).join("\n");
      return denied(`提交内容包含 code-review 审查标记（任意位置，含残缺说明块）：\n${visible}${locations.length > 30 ? "\n其余位置已省略。" : ""}`);
    }
    return { blocked: false };
  } catch (error) { return denied(`无法完成提交内容检查：${error.message}`); }
}

function main() {
  try {
    const payload = JSON.parse(fs.readFileSync(0, "utf8"));
    if (payload.event !== "before-tool" || payload.tool?.category !== "shell") return;
    const input = payload.native?.payload?.tool_input;
    const workspace = path.resolve(payload.workspace?.root || process.cwd(), input?.workdir || input?.cwd || ".");
    const result = checkCommand(payload.tool.command, workspace);
    if (result.blocked) { process.stderr.write(`${result.reason}\n`); process.exitCode = 2; }
  } catch (error) {
    process.stderr.write(`审查块检查失败，提交未获放行：${error.message}\n`);
    process.exitCode = 2;
  }
}

if (require.main === module) main();
module.exports = { main, checkCommand, inspectIndex, literalWords, MARKER_PATTERN };
