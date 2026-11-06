"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const guard = require("../skills/dev/commit-guard/scripts/check-commit.js");
const runtime = require("../skills/meta/agent-hooks/scripts/lib/runtime.js");

const root = path.resolve(__dirname, "..");
const checker = path.join(root, "skills/dev/commit-guard/scripts/check-commit.js");
const entry = path.join(root, "skills/meta/agent-hooks/scripts/check-code-review-commit.js");
const hookId = "inner:code-inline-review-commit";
const marker = "@code" + "-review";
const notes = `// ${marker}:begin sample/main\n// Temporary explanation\n// ${marker}:end sample/main\n`;

// Tests in this file run serially because Git and hook discovery read process.env.
function fixture(t) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "commit-guard-test-")));
  const repo = path.join(directory, "repo with spaces");
  const data = path.join(directory, "data");
  fs.mkdirSync(repo);
  const keys = new Set([...Object.keys(process.env).filter((key) => key.startsWith("GIT_")),
    "GIT_CONFIG_GLOBAL", "GIT_CONFIG_SYSTEM", "GIT_CONFIG_NOSYSTEM", "GIT_ATTR_NOSYSTEM", "CSL_AGENT_KIT_HOME"]);
  const previous = new Map([...keys].map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, {
    GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_SYSTEM: os.devNull,
    GIT_CONFIG_NOSYSTEM: "1", GIT_ATTR_NOSYSTEM: "1", CSL_AGENT_KIT_HOME: data,
  });
  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  function git(args, input) {
    const result = spawnSync("git", args, { cwd: repo, input, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  }
  function write(name, content, stage = false) {
    const file = path.join(repo, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    if (stage) git(["add", "--", name]);
    return file;
  }
  git(["init", "--quiet"]);
  write("main.js", "const value = 1;\n", true);
  return { directory, repo, data, git, write };
}

function payload(repo, host = "pi", command = "git commit -m example") {
  return runtime.createEvent({ event: "before-tool", host, workspace: repo,
    tool: { category: "shell", command } });
}

function blocked(result, pattern) {
  assert.equal(result.blocked, true, JSON.stringify(result));
  assert.match(result.reason, pattern);
}

for (const [source, expected] of [
  ["git commit -m 'two words'", ["git", "commit", "-m", "two words"]],
  ['git -C "folder name" commit -m ""', ["git", "-C", "folder name", "commit", "-m", ""]],
  ["git commit -m 'literal $HOME; git commit'", ["git", "commit", "-m", "literal $HOME; git commit"]],
  ["git\\ commit", ["git commit"]],
  ['git commit -m "quote\\\"value"', ["git", "commit", "-m", 'quote"value']],
]) {
  test(`literal argv: ${source}`, () => assert.deepEqual(guard.literalWords(source), expected));
}

for (const source of ["git commit; echo done", "git commit\n", "git commit > out", "git commit $FLAGS",
  'git commit -m "$(id)"', "git commit `id`", "git commit *", "git commit -m 'unfinished", "git commit\\", "git \\\ncommit"]) {
  test(`reject shell syntax: ${JSON.stringify(source)}`, () => assert.throws(() => guard.literalWords(source)));
}

const rejected = [
  "git commit -a", "git commit --all", "git commit main.js", "git commit -- main.js",
  "git commit --interactive", "git commit --patch", "git commit --no-verify", "git commit --unknown",
  "git commit -m", "git -C", "git -c alias.c=commit c", "git c", "git merge branch",
  "git rebase main", "git cherry-pick abc", "git revert abc", "git am patch", "git stash",
  "git bisect run git commit -m x", "git add . && git commit -m x", "git commit -m x; echo done",
  "FLAG=1 git commit -m x", "if true; then git commit -m x; fi", "while false; do git commit; done",
  "env git commit -m x", "command git commit -m x", "sudo git commit -m x",
  "sh -c 'git commit -m x'", "bash -lc 'git commit -m x'", "eval 'git commit -m x'",
  "timeout 5 git commit -m x", "xargs git commit -m x", "env sh -c 'git commit -m x'",
  'echo "$(git commit -m x)"', "echo `git commit -m x`", ">out git commit -m x",
  "cat <<'EOF'\nexample\nEOF\ngit commit -m x",
  "cat <<EOF\n$(git commit -m x)\nEOF\n",
];
for (const command of rejected) {
  test(`deny unsupported invocation: ${JSON.stringify(command)}`, () => {
    const result = guard.checkCommand(command, os.tmpdir());
    blocked(result, /暂不支持|无法确定|拆分|缺少|不支持|独立执行/);
    assert.doesNotMatch(result.reason, /定位仓库失败/);
  });
}

for (const command of ["", "git status", "git diff --cached", "git --version", "git --help",
  "git push origin main", "echo 'git commit -m x'", "# git commit\necho ok",
  "cat <<'EOF'\ngit commit -m x\nEOF\n", "printf '%s' 'git commit' > output"]) {
  test(`allow non-commit or inert text: ${JSON.stringify(command)}`, () => {
    assert.deepEqual(guard.checkCommand(command, os.tmpdir()), { blocked: false });
  });
}

test("missing command is denied", () => blocked(guard.checkCommand(undefined, os.tmpdir()), /缺少 shell 命令/));

test("accept supported explicit-index commit options without executing a commit", (t) => {
  const { repo, git } = fixture(t);
  const index = fs.readFileSync(path.join(repo, ".git/index"));
  for (const command of ["git commit", "git commit -m message", "git commit -m 'git commit; $literal'",
    "git commit -mmessage", "git commit --message=message", "git commit -F message.txt",
    "git commit -Fmessage.txt", "git commit --file=message.txt", "git commit --amend --no-edit",
    "git commit --allow-empty --no-gpg-sign -s -q", "git commit -S --gpg-sign=key -m x",
    "git commit --author 'Example <example@invalid>' --date now --cleanup strip --trailer 'Key: value' -m x",
    `git -C "${repo}" --no-pager commit -m x`]) {
    assert.deepEqual(guard.checkCommand(command, repo), { blocked: false }, command);
  }
  assert.deepEqual(fs.readFileSync(path.join(repo, ".git/index")), index);
  assert.equal(git(["rev-list", "--all"]).trim(), "");
});

test("clean index permits working-tree and untracked notes without changing partial staging", (t) => {
  const { repo, write } = fixture(t);
  write("main.js", `${notes}const value = 2;\n`);
  write("untracked.js", notes);
  const before = fs.readFileSync(path.join(repo, ".git/index"));
  assert.deepEqual(guard.inspectIndex(repo), []);
  assert.deepEqual(guard.checkCommand("git commit -m x", repo), { blocked: false });
  assert.deepEqual(fs.readFileSync(path.join(repo, ".git/index")), before);
  assert.equal(fs.readFileSync(path.join(repo, "main.js"), "utf8"), `${notes}const value = 2;\n`);
  assert.equal(fs.readFileSync(path.join(repo, "untracked.js"), "utf8"), notes);
});

test("scan full staged files from subdirectories even if working files are clean", (t) => {
  const { repo, write } = fixture(t);
  const file = write("outside/note file.js", `const value = 1;\n${notes}`, true);
  write("outside/note file.js", "const value = 1;\n");
  const subdir = path.join(repo, "nested/deep");
  fs.mkdirSync(subdir, { recursive: true });
  assert.deepEqual(guard.inspectIndex(subdir), [{ path: file, line: 2 }, { path: file, line: 4 }]);
  blocked(guard.checkCommand("git commit -m x", subdir), /note file\.js/);
  blocked(guard.checkCommand(`git -C ../.. commit -m x`, subdir), /note file\.js/);
});

test("all reserved comment prefixes and damaged delimiters are blocked, including binary content", (t) => {
  const { repo, write } = fixture(t);
  const lines = ["//", "#", "--", ";", "/*", "<!--", "*"].map((prefix) => `  ${prefix} ${marker}:begin broken`);
  write("markers.txt", lines.join("\r\n") + `\r\n// ${marker}:end orphan\r\n`, true);
  write("binary.dat", Buffer.from(`\0binary\n// ${marker}:broken\n`), true);
  const hits = guard.inspectIndex(repo);
  assert.equal(hits.length, 9);
  assert.deepEqual(hits.filter((hit) => hit.path.endsWith("markers.txt")).map((hit) => hit.line), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(hits.some((hit) => hit.path.endsWith("binary.dat") && hit.line === 2));
});

test("ordinary comments and unrelated strings remain allowed", (t) => {
  const { repo, write } = fixture(t);
  write("ordinary.js", '// Normal explanation\nconst label = "business text";\nconst value = 1; // Preserve this comment\n', true);
  assert.deepEqual(guard.inspectIndex(repo), []);
});

for (const [name, content, line] of [
  ["literal.js", `const label = "${marker}:begin sample/main";\n`, 1],
  ["trailing.js", `const value = 1; // ${marker}:end orphan\n`, 1],
  ["example.json", JSON.stringify({ example: `${marker}:beg` }), 1],
  ["example.md", `# Example\nInline documentation: \`${marker}\`\n`, 2],
  ["plain.txt", `embedded-prefix${marker}suffix`, 1],
  ["binary.dat", Buffer.from(`\0binary payload ${marker}:end\0`), 1],
]) {
  test(`reserved substring anywhere blocks staged ${name}`, (t) => {
    const { repo, write } = fixture(t);
    const file = write(name, content, true);
    assert.deepEqual(guard.inspectIndex(repo), [{ path: file, line }]);
    blocked(guard.checkCommand("git commit -m x", repo), /审查标记/);
  });
}

test("marker protocol implementation and docs do not contain literal reserved content", (t) => {
  const { repo, git } = fixture(t);
  for (const skill of ["code-inline-review", "commit-guard"]) {
    fs.cpSync(path.join(root, "skills/dev", skill), path.join(repo, skill), { recursive: true });
  }
  git(["add", "--", "code-inline-review", "commit-guard"]);
  assert.deepEqual(guard.inspectIndex(repo), []);
});

test("cleanup keeps its original protocol and CRLF behavior after literal representation changes", () => {
  const { preview } = require("../skills/dev/code-inline-review/scripts/preview-clean.js");
  const source = `// Keep ordinary comment\r\n${notes.replace(/\n/g, "\r\n")}const value = 1;\r\n`;
  const cleaned = preview(source);
  assert.equal(cleaned.content, "// Keep ordinary comment\r\nconst value = 1;\r\n");
  assert.deepEqual(cleaned.ranges, [{ id: "sample/main", start: 2, end: 4 }]);
  assert.throws(() => preview(`// ${marker}:beg\n`), /残缺或格式不合法/);
});

test("report truncates locations but blocks every staged occurrence", (t) => {
  const { repo, write } = fixture(t);
  write("many.js", Array.from({ length: 35 }, () => `// ${marker}:broken\n`).join(""), true);
  assert.equal(guard.inspectIndex(repo).length, 35);
  const result = guard.checkCommand("git commit -m x", repo);
  blocked(result, /其余位置已省略/);
  assert.equal((result.reason.match(/many\.js"/g) || []).length, 30);
});

test("unmerged index is denied instead of treating it as a clean scan", (t) => {
  const { repo, git } = fixture(t);
  const blob = git(["hash-object", "-w", "--stdin"], "conflict\n").trim();
  git(["update-index", "--index-info"], `100644 ${blob} 1\tconflict.js\n100644 ${blob} 2\tconflict.js\n100644 ${blob} 3\tconflict.js\n`);
  blocked(guard.checkCommand("git commit -m x", repo), /暂存区仍有冲突/);
});

test("non-repository and missing Git executable fail closed", (t) => {
  const { directory, repo } = fixture(t);
  blocked(guard.checkCommand("git commit -m x", directory), /定位仓库失败/);
  blocked(guard.checkCommand(`"${path.join(directory, "missing/git")}" commit -m x`, repo), /无法启动/);
});

// Replace only the OS process boundary; no production injection API or real timeout is needed.
function guardWithSpawn(spawn) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(checker, "utf8"), {
    module, process,
    require(name) { return name === "node:child_process" ? { spawnSync: spawn } : require(name); },
  }, { filename: checker });
  return module.exports;
}

for (const [name, failed, expected] of [
  ["spawn error", { error: new Error("ENOENT") }, /超时、输出超限或无法启动/],
  ["timeout", { error: Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }) }, /超时、输出超限或无法启动/],
  ["output overflow", { error: Object.assign(new Error("overflow"), { code: "ENOBUFS" }) }, /超时、输出超限或无法启动/],
  ["signal", { signal: "SIGTERM" }, /超时、输出超限或无法启动/],
  ["Git failure", { status: 128, stderr: "broken index" }, /扫描暂存内容失败/],
  ["invalid scan output", { status: 0, stdout: "unparseable match" }, /无法解析位置/],
]) {
  test(`Git scan ${name} blocks commit`, () => {
    const checked = guardWithSpawn((executable, args, options) => {
      assert.equal(options.shell, false);
      assert.equal(options.env.GIT_OPTIONAL_LOCKS, "0");
      if (args[0] === "rev-parse") return { status: 0, stdout: os.tmpdir() + "\n" };
      if (args[0] === "ls-files") return { status: 0, stdout: "" };
      assert.equal(args[0], "grep");
      return failed;
    });
    blocked(checked.checkCommand("git commit -m x", os.tmpdir()), expected);
  });
}

test("thin entry preserves exports and stdin CLI behavior, including cwd overrides", (t) => {
  const { directory, repo, write } = fixture(t);
  assert.strictEqual(require(entry).checkCommand, guard.checkCommand);
  write("main.js", notes, true);
  for (const script of [checker, entry]) {
    for (const key of ["cwd", "workdir"]) {
      const event = payload(directory);
      event.native.payload = { tool_input: { [key]: path.relative(directory, repo) } };
      const result = spawnSync(process.execPath, [script], { input: JSON.stringify(event), encoding: "utf8" });
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /main\.js/);
      assert.equal(result.stdout, "");
    }
    const invalid = spawnSync(process.execPath, [script], { input: "{", encoding: "utf8" });
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /检查失败/);
    const ignored = spawnSync(process.execPath, [script], { input: JSON.stringify({ event: "after-tool" }), encoding: "utf8" });
    assert.equal(ignored.status, 0);
    assert.equal(ignored.stderr, "");
  }
});

for (const host of ["pi", "codex", "claude-code"]) {
  test(`${host}: builtin hook allows clean index, blocks notes, preserves disable override`, (t) => {
    const { repo, data, write } = fixture(t);
    const run = () => runtime.runEvent(payload(repo, host), { onlyHooks: [hookId] });
    assert.equal(run().blocked, false);
    write("main.js", notes, true);
    const before = fs.readFileSync(path.join(repo, ".git/index"));
    blocked(run(), /审查标记/);
    assert.deepEqual(fs.readFileSync(path.join(repo, ".git/index")), before);
    assert.equal(fs.readFileSync(path.join(repo, "main.js"), "utf8"), notes);
    fs.mkdirSync(path.join(data, "hooks"), { recursive: true });
    const config = path.join(data, "hooks/config.json");
    fs.writeFileSync(config, JSON.stringify({ schema: "agent-hooks.config/v1", disabledHooks: [hookId] }));
    assert.equal(run().blocked, false);
    fs.writeFileSync(config, "{");
    blocked(run(), /配置无效/);
  });
}

test("missing checker module is blocked by run-script on-error policy", (t) => {
  const { repo, data } = fixture(t);
  const scripts = path.join(data, "hooks/scripts");
  fs.mkdirSync(scripts, { recursive: true });
  // Reuse the shipped rule and thin entry in an isolated scope with its dependency absent.
  fs.copyFileSync(entry, path.join(scripts, "check-code-review-commit.js"));
  fs.chmodSync(path.join(scripts, "check-code-review-commit.js"), 0o755);
  fs.copyFileSync(path.join(root, "skills/meta/agent-hooks/hooks/code-inline-review-commit.md"), path.join(data, "hooks/missing-checker.md"));
  for (const host of ["pi", "codex", "claude-code"]) {
    blocked(runtime.runEvent(payload(repo, host), { onlyHooks: ["global:missing-checker"] }), /MODULE_NOT_FOUND|Cannot find module/);
  }
});
