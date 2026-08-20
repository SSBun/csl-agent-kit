#!/usr/bin/env node
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawn, spawnSync } = require("node:child_process");

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const MODEL_TIMEOUT_MS = 20_000;
const MAX_PROMPT = 4_000;
const MAX_CONTEXT = 12_000;
const MAX_TITLE = 24;
const MAX_TITLE_WORDS = 7;
const SYSTEM_PROMPT = [
  "You write a SHORT terminal tab title naming what the user is currently working on. You are concise and human.",
  "",
  "Output format:",
  "- Reply with the title ONLY. One line. No labels, no quotes, no punctuation at the end, no Markdown.",
  "- The title is what a teammate would call this task in one breath.",
  "",
  "Constraints:",
  "- 2 to 5 words. Natural words, title case or lowercase — never ALL CAPS.",
  "- It must read like a real phrase a human wrote, not a code symbol. Bad: BUG_REPORT, refreshTabTitle, AUTH_REFRESH. Good: bug report, auth refresh.",
  "- Describe the THING being worked on (a feature, a file area, a concept), not an action or a status. Bad: fixed, approved, running, commit. Good: login cache, icon variants.",
  "- Match the user language: English in -> English out; Chinese in -> Chinese out.",
  "- Use the whole supplied conversation, with the newest messages carrying the most weight.",
  "- Always return the best current title. For a follow-up action such as commit, retry, or test, infer the underlying task from the surrounding conversation.",
  "",
  "Examples (Input -> Reply):",
  '"Add a login token cache layer" -> login token cache',
  '"Fix the race in the auth refresh timer" -> auth refresh race',
  '"Design four app icon candidates" -> app icon design',
  '"生成四款应用图标候选" -> 应用图标设计',
  '"Build a login token cache" then "commit these changes" -> login token cache',
  '"BUG_REPORT" -> bug report',
  '"TOAST_ON_TITLE_REFRESH" -> toast title bug',
].join("\n");

function truncate(value, limit) {
  const chars = Array.from(value);
  return chars.length <= limit ? value : `${chars.slice(0, limit - 1).join("")}…`;
}

function sanitize(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[#>*_`~\-\s]+/, "")
    .trim();
}

function cleanContext(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hookInputFromEnv(env = process.env) {
  try {
    const input = JSON.parse(env.TRIGGERIFY_HOOK_INPUT || "{}");
    return input && typeof input === "object" && !Array.isArray(input) ? input : {};
  } catch {
    return {};
  }
}

function contextFromEnv(env = process.env) {
  return truncate(cleanContext(hookInputFromEnv(env).sessionContext), MAX_CONTEXT);
}

function requestIdFromEnv(env = process.env) {
  const requestId = hookInputFromEnv(env).requestId;
  return typeof requestId === "string" && /^[A-Za-z0-9-]{1,100}$/.test(requestId) ? requestId : "";
}

function modelFromConfig(env = process.env) {
  try {
    const model = JSON.parse(env.TRIGGERIFY_HOOK_CONFIG || "{}").model;
    return typeof model === "string"
      && model.length <= 200
      && /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(model)
      ? model
      : DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

function compactTitle(value) {
  let title = value;
  while (Array.from(title).length > MAX_TITLE && title.includes(" ")) {
    title = title.replace(/\s+\S+$/, "");
  }
  return Array.from(title).slice(0, MAX_TITLE).join("");
}

// A code-like token: ALL_CAPS_UNDERSCORES, camelCase identifiers, or
// snake_case identifiers that are not natural phrases. These leak from
// code/messages and must never become tab titles.
function looksLikeCodeToken(value) {
  const text = value.trim();
  if (!text) return false;
  // ALL_CAPS_UNDERSCORES with at least one underscore, or 4+ all-caps chars.
  if (/^[A-Z][A-Z0-9_]{2,}$/.test(text) && text.includes("_")) return true;
  if (/^[A-Z][A-Z0-9_]{3,}$/.test(text)) return true;
  // snake_case identifier (lower_word_word) longer than a natural phrase.
  if (/^[a-z][a-z0-9]+(?:_[a-z0-9]+)+$/.test(text) && text.length > 12) return true;
  // camelCase identifier (single token, no spaces, mixed case).
  if (!text.includes(" ") && /^[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*$/.test(text)) return true;
  return false;
}

function cleanModelTitle(value) {
  // Take the first non-empty line; the model is instructed to return only
  // the title, so verbose multi-line output is already a failure mode.
  const line = String(value || "")
    .split(/\r?\n/)
    .map(sanitize)
    .find((candidate) => candidate.length >= 2) || "";
  const title = line
    .replace(/^(?:(?:stable\s+)?(?:main\s+)?task|core\s+intent(?:ion)?|title|current\s+thread|标题)\s*[:：-]?\s*/i, "")
    .replace(/^["'“‘]+|["'”’.,!?。！？]+$/g, "")
    .replace(/^(?:make|fix|add|update|change|improve|implement|build|create|review|research|explain)\s+(?:the\s+)?/i, "")
    .replace(/^(?:修复|实现|添加|新增|更新|修改|优化|构建|创建|审查|评审|研究|解释)/, "")
    .trim();
  if (!title) return "";
  if (/^(?:R\d+\s*:\s*)?(?:NOTE|BLOCKER|QUESTION)\s*:?$/.test(title)) return "";
  if (isOperationTitle(title)) return "";
  // Reject code-like tokens: ALL_CAPS_UNDERSCORES, camelCase, snake_case ids.
  if (looksLikeCodeToken(title)) return "";
  // Reject sentence-like output: a real title has no sentence punctuation
  // and is far shorter than a sentence. buildTitle enforces the final
  // word budget; here we only reject obvious verbose failures.
  if (/[.,;:，。；：]/.test(title)) return "";
  if (title.split(/\s+/).length > 10) return "";
  return compactTitle(title);
}

function isOperationTitle(value) {
  const text = sanitize(value);
  return /^(?:please\s+)?(?:commit|push|stage)(?:$|\s+(?:all|the|these|those|this|our|my|your|current|local|focused|completed|only|just|it|everything|changes|work|files|branch|commit|to|as)\b)/i.test(text)
    || /^(?:please\s+)?(?:retry|continue|proceed|go ahead)\b/i.test(text)
    || /^(?:please\s+)?(?:run|rerun)\s+(?:the\s+)?(?:tests?|checks?|lint|build)\b/i.test(text)
    || /^(?:please\s+)?test\s+(?:it|this|that|the|these|those|all|current|our|my)\b/i.test(text)
    || /^(?:请)?(?:提交|推送|暂存|重试|继续|接着|运行(?:一下|这些|全部)?(?:测试|检查|构建)|重新运行(?:测试|检查|构建))/.test(text);
}

function projectTitle(workspace) {
  return sanitize(path.basename(workspace || "")) || "Pi";
}

function buildTitle(_payload, workspace, modelTitle = "") {
  const title = cleanModelTitle(modelTitle);
  if (!title) return null;
  const project = projectTitle(workspace);
  const projectWords = project.split(/\s+/).length;
  const intent = title.split(/\s+/).slice(0, Math.max(1, MAX_TITLE_WORDS - projectWords)).join(" ");
  return `${project} · ${intent}`;
}

function parentInfo(pid) {
  const output = execFileSync("ps", ["-o", "tty=", "-o", "ppid=", "-p", String(pid)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (!output) return null;
  const fields = output.split(/\s+/);
  const ppid = Number(fields.pop());
  return { tty: fields.join(" "), ppid: Number.isInteger(ppid) ? ppid : 0 };
}

function writableAncestorTty(startPid = process.ppid) {
  let pid = startPid;
  for (let depth = 0; pid > 1 && depth < 16; depth += 1) {
    let info;
    try {
      info = parentInfo(pid);
    } catch {
      return null;
    }
    if (!info) return null;

    const tty = info.tty;
    if (tty && tty !== "??" && /^[A-Za-z0-9._/-]+$/.test(tty)) {
      const device = tty.startsWith("/dev/") ? tty : `/dev/${tty}`;
      try {
        fs.accessSync(device, fs.constants.W_OK);
        return device;
      } catch {
        // Keep walking: a higher ancestor may own the visible terminal.
      }
    }
    pid = info.ppid;
  }
  return null;
}

function isolatedEnv() {
  const env = { ...process.env };
  for (const key of [
    "PI_MODEL",
    "PI_PROVIDER",
    "PI_REASONING_LEVEL",
    "PI_SESSION_FILE",
    "PI_SESSION_ID",
    "PI_SUBAGENT_PARENT_SESSION",
    "TRIGGERIFY_HOOK_CONFIG",
    "TRIGGERIFY_HOOK_INPUT",
  ]) delete env[key];
  return env;
}

function generateModelTitle(context, model = modelFromConfig()) {
  const result = spawnSync("pi", [
    "--print",
    "--model", model,
    "--thinking", "off",
    "--no-session",
    "--no-tools",
    "--no-extensions",
    "--no-skills",
    "--no-context-files",
    "--system-prompt", SYSTEM_PROMPT,
  ], {
    input: truncate(cleanContext(context), MAX_CONTEXT),
    encoding: "utf8",
    env: isolatedEnv(),
    stdio: ["pipe", "pipe", "ignore"],
    timeout: MODEL_TIMEOUT_MS,
    maxBuffer: 8 * 1024,
  });
  return result.status === 0 ? cleanModelTitle(result.stdout) : "";
}

function tabTitleDir() {
  const root = process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
  const dir = path.join(root, "triggerify", ".tab-title");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

function stateFile(tty) {
  return path.join(tabTitleDir(), `${path.basename(tty)}.token`);
}

function titleFile(tty) {
  return path.join(tabTitleDir(), `${path.basename(tty)}.title.json`);
}

function titleResultFile(requestId) {
  if (!/^[A-Za-z0-9-]{1,100}$/.test(requestId)) throw new Error("invalid title request id");
  return path.join(tabTitleDir(), `${requestId}.result.json`);
}

function writeTitleResult(requestId, result) {
  if (!requestId) return;
  try {
    const file = titleResultFile(requestId);
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(result)}\n`, { mode: 0o600, flag: "wx" });
    fs.renameSync(temporary, file);
  } catch {
    // Status reporting must never affect the cosmetic title operation.
  }
}

function rememberTitle(tty, workspace, title) {
  fs.writeFileSync(titleFile(tty), JSON.stringify({ workspace, title }), { mode: 0o600 });
}

// Status/action words that leaked into stored titles before filtering existed.
const BAD_TITLE_WORDS = new Set([
  "approved", "completed", "running", "fixed", "done", "ok", "success", "fail", "failed",
  "commit", "commits", "push", "stage", "retry", "test", "tests", "note", "blocker", "question",
]);

function storedIntent(title) {
  if (!title) return "";
  const idx = title.indexOf("·");
  return idx >= 0 ? title.slice(idx + 1).trim() : "";
}

function isBadStoredTitle(title) {
  const intent = storedIntent(title);
  if (!intent) return false;
  if (looksLikeCodeToken(intent)) return true;
  if (BAD_TITLE_WORDS.has(intent.toLowerCase())) return true;
  return false;
}

function savedTitle(tty, workspace) {
  try {
    const saved = JSON.parse(fs.readFileSync(titleFile(tty), "utf8"));
    if (saved.workspace === workspace) {
      const title = sanitize(saved.title);
      // Drop legacy stored titles that contain code tokens or bare status words;
      // they predate the current filters and would otherwise be preserved forever.
      if (title && !isBadStoredTitle(title)) return title;
    }
  } catch {}
  return null;
}

function preservedTitle(tty, workspace) {
  return savedTitle(tty, workspace) || projectTitle(workspace);
}

function titleModelInput(input) {
  return cleanContext(input.sessionContext) || `User: ${input.prompt}`;
}

function generatedTitleAction(input, modelTitle) {
  const title = buildTitle({ prompt: input.prompt }, input.workspace, modelTitle);
  if (!title) return null;
  return { title, remember: title !== savedTitle(input.tty, input.workspace) };
}

const LOCK_TIMEOUT_MS = 50; // bound acquisition; fail-open if contended
const LOCK_STALE_MS = 10_000; // a critical section is sub-millisecond

// Per-TTY mutex via atomic mkdir. Serializes token publication (startWorker)
// with the latest-token-check + OSC write (runWorker), closing the TOCTOU
// window where an older worker could overwrite a newer title. The mkdir
// primitive is atomic on all supported platforms; no flock/O_EXCL needed.
// Fail-open: if the lock cannot be acquired within LOCK_TIMEOUT_MS, return
// undefined so the caller skips gracefully.
function withTtyLock(tty, fn) {
  const lock = path.join(tabTitleDir(), `${path.basename(tty)}.lock`);
  const sleep = new Int32Array(new SharedArrayBuffer(4));
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  // Acquire: atomic mkdir is the mutex primitive. Retry with backoff until
  // timeout; reclaim objectively stale locks left by crashed holders.
  let acquired = false;
  while (!acquired && Date.now() < deadline) {
    try {
      fs.mkdirSync(lock, { mode: 0o700 });
      acquired = true;
    } catch (e) {
      if (e.code !== "EEXIST") return undefined; // unexpected — fail-open
      try {
        const { mtimeMs } = fs.statSync(lock);
        if (Date.now() - mtimeMs > LOCK_STALE_MS) {
          fs.rmSync(lock, { recursive: true, force: true });
        }
      } catch {
        return undefined;
      }
      if (!acquired) Atomics.wait(sleep, 0, 0, 5);
    }
  }
  if (!acquired) return undefined;

  try {
    return fn();
  } finally {
    try { fs.rmSync(lock, { recursive: true, force: true }); } catch {}
  }
}

function writeTitle(tty, title) {
  if (!/^\/dev\/[A-Za-z0-9._-]+$/.test(tty)) return false;
  fs.accessSync(tty, fs.constants.W_OK);
  fs.writeFileSync(tty, `\u001b]0;${title}\u0007`);
  return true;
}

function isLatest(state, token) {
  try {
    return fs.readFileSync(state, "utf8") === token;
  } catch {
    return false;
  }
}

function applyTitle(input, title, remember = false) {
  const result = withTtyLock(input.tty, () => {
    if (!isLatest(input.state, input.token)) return false;
    if (remember) rememberTitle(input.tty, input.workspace, title);
    return writeTitle(input.tty, title);
  });
  return result === true;
}

function runWorker(input) {
  const preserved = preservedTitle(input.tty, input.workspace);
  const modelTitle = generateModelTitle(titleModelInput(input));
  if (!modelTitle) {
    return { ok: false, changed: false, title: preserved, reason: "model-failed" };
  }

  const action = generatedTitleAction(input, modelTitle);
  if (!action) {
    return { ok: false, changed: false, title: preserved, reason: "invalid-title" };
  }
  if (!applyTitle(input, action.title, action.remember)) {
    return { ok: false, changed: false, title: preserved, reason: "title-write-failed" };
  }
  return {
    ok: true,
    changed: action.title !== preserved,
    title: action.title,
    reason: action.title === preserved ? "unchanged" : "updated",
  };
}

function startWorker(payload, workspace) {
  const requestId = requestIdFromEnv();
  const fail = (reason) => {
    writeTitleResult(requestId, { ok: false, changed: false, reason });
    return false;
  };
  const prompt = truncate(sanitize(payload?.prompt), MAX_PROMPT);
  const sessionContext = contextFromEnv();
  const tty = writableAncestorTty();
  if (!prompt) return fail("missing-prompt");
  if (!tty) return fail("no-writable-tty");

  const token = crypto.randomUUID();
  const state = stateFile(tty);
  let published;
  try {
    published = withTtyLock(tty, () => {
      fs.writeFileSync(state, token, { mode: 0o600 });
      return true;
    });
  } catch {
    return fail("state-write-failed");
  }
  if (published !== true) return fail("state-write-failed");

  const inputFile = path.join(os.tmpdir(), `triggerify-title-${process.pid}-${crypto.randomBytes(8).toString("hex")}.json`);
  let descriptor;
  try {
    fs.writeFileSync(inputFile, JSON.stringify({ prompt, sessionContext, workspace, tty, state, token, requestId }), { mode: 0o600, flag: "wx" });
    descriptor = fs.openSync(inputFile, "r");
    fs.unlinkSync(inputFile);
    const child = spawn(process.execPath, [__filename, "--worker"], {
      detached: true,
      env: process.env,
      stdio: [descriptor, "ignore", "ignore"],
    });
    child.unref();
    return true;
  } catch {
    return fail("worker-start-failed");
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    try { fs.unlinkSync(inputFile); } catch {}
  }
}

function selfTest() {
  assert.equal(buildTitle({ prompt: "Add a cache" }, "/tmp/my-project"), null);
  assert.equal(buildTitle({}, "/tmp/app", "Auth refresh race"), "app · Auth refresh race");
  assert.equal(buildTitle({}, "/tmp/app", "a b c d e f g h i"), "app · a b c d e f");
  assert.equal(cleanModelTitle("KEEP_CURRENT_TITLE"), "");
  assert.equal(cleanModelTitle('Title: “Fix the tests.”'), "tests");
  assert.equal(cleanModelTitle("Make terminal tab titles stable"), "terminal tab titles");
  // Verbose multi-line output is invalid rather than a keep-current decision.
  assert.equal(cleanModelTitle("Based on the conversation, the user wants authentication caching.\nAuthentication cache"), "");
  // Code-like tokens that slip through verbatim must never become titles.
  assert.equal(cleanModelTitle("TOAST_ON_TITLE_REFRESH"), "");
  assert.equal(cleanModelTitle("refreshTabTitle"), "");
  // The model is now taught to humanize ALL_CAPS input; verify that output.
  assert.equal(cleanModelTitle("bug report"), "bug report");
  assert.equal(buildTitle({}, "/tmp/app", "stable main task: Commit focused git changes with conventional message"), null);
  assert.equal(buildTitle({}, "/tmp/app", "R1: NOTE:"), null);
  assert.equal(buildTitle({}, "/tmp/app", "\u001b]0;owned\u0007"), null);
  assert.ok(Array.from(cleanModelTitle("界".repeat(100))).length <= MAX_TITLE);
  assert.equal(/[\u0000-\u001f\u007f-\u009f]/.test(buildTitle({}, "/tmp/app", "safe")), false);
  assert.equal(contextFromEnv({ TRIGGERIFY_HOOK_INPUT: '{"sessionContext":"User: Build auth\\n\\nAssistant: Working"}' }), "User: Build auth\n\nAssistant: Working");
  assert.equal(contextFromEnv({ TRIGGERIFY_HOOK_INPUT: "invalid" }), "");
  assert.equal(modelFromConfig({ TRIGGERIFY_HOOK_CONFIG: '{"model":"openai-codex/gpt-5.4-mini"}' }), "openai-codex/gpt-5.4-mini");
  assert.equal(modelFromConfig({ TRIGGERIFY_HOOK_CONFIG: '{"model":"bad model"}' }), DEFAULT_MODEL);
  assert.equal(modelFromConfig({ TRIGGERIFY_HOOK_CONFIG: "invalid" }), DEFAULT_MODEL);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "triggerify-title-test-"));
  const previousHome = process.env.CSL_AGENT_KIT_HOME;
  try {
    const state = path.join(dir, "token");
    fs.writeFileSync(state, "new");
    assert.equal(isLatest(state, "old"), false);
    assert.equal(isLatest(state, "new"), true);
    assert.equal(isLatest(path.join(dir, "missing"), "new"), false);

    // withTtyLock: acquire/release, fail-open under contention, stale reclaim
    process.env.CSL_AGENT_KIT_HOME = dir;
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "app");
    rememberTitle("/dev/ttys000", "/tmp/app", "app · Auth cache");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "app · Auth cache");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/other"), "other");
    const input = { prompt: "fix auth", tty: "/dev/ttys000", workspace: "/tmp/app" };
    assert.equal(generatedTitleAction(input, ""), null);
    assert.equal(generatedTitleAction(input, "KEEP_CURRENT_TITLE"), null);
    assert.deepEqual(generatedTitleAction(input, "Auth cache"), { title: "app · Auth cache", remember: false });
    assert.equal(titleModelInput(input), "User: fix auth");
    // Legacy stored titles containing code tokens or bare status words are dropped.
    rememberTitle("/dev/ttys000", "/tmp/app", "app · BUG_REPORT");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "app");
    rememberTitle("/dev/ttys000", "/tmp/app", "app · commits");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "app");
    rememberTitle("/dev/ttys000", "/tmp/app", "app · Auth cache");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "app · Auth cache");
    assert.equal(titleModelInput({ prompt: "hello", tty: "/dev/ttys099", workspace: "/tmp/app" }), "User: hello");
    assert.equal(titleModelInput({ prompt: "hello", sessionContext: "User: msg 1\nAssistant: reply\nUser: msg 2", tty: "/dev/ttys099", workspace: "/tmp/app" }), "User: msg 1\nAssistant: reply\nUser: msg 2");
    assert.equal(withTtyLock("/dev/ttys000", () => 42), 42);
    assert.equal(withTtyLock("/dev/ttys000", () => "ok"), "ok");
    // Lock released: dir should not exist after clean return
    assert.equal(fs.existsSync(path.join(tabTitleDir(), "ttys000.lock")), false);

    // Simulate a held lock: pre-create the lock dir inside tabTitleDir
    const ttyDir = path.join(dir, "triggerify", ".tab-title");
    fs.mkdirSync(path.join(ttyDir, "ttys001.lock"));
    assert.equal(withTtyLock("/dev/ttys001", () => "should-not-run"), undefined);

    // Simulate a stale lock: set mtime far in the past, should be reclaimed
    const stale = path.join(ttyDir, "ttys002.lock");
    fs.mkdirSync(stale);
    const oldTime = new Date(Date.now() - (LOCK_STALE_MS + 5000));
    fs.utimesSync(stale, oldTime, oldTime);
    assert.equal(withTtyLock("/dev/ttys002", () => "reclaimed"), "reclaimed");

  } finally {
    if (previousHome === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previousHome;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

module.exports = {
  buildTitle,
  cleanModelTitle,
  contextFromEnv,
  generateModelTitle,
  generatedTitleAction,
  modelFromConfig,
  preservedTitle,
  rememberTitle,
  requestIdFromEnv,
  runWorker,
  sanitize,
  titleModelInput,
  titleResultFile,
  startWorker,
  truncate,
  writableAncestorTty,
};

if (require.main === module) {
  if (process.argv[2] === "--self-test") {
    selfTest();
  } else if (process.argv[2] === "--worker") {
    let input;
    try {
      input = JSON.parse(fs.readFileSync(0, "utf8"));
      const result = runWorker(input);
      writeTitleResult(input.requestId, result);
    } catch {
      if (input?.requestId) writeTitleResult(input.requestId, { ok: false, changed: false, reason: "worker-error" });
      // Title refresh is cosmetic and must never interrupt the agent.
    }
  } else {
    try {
      const payload = JSON.parse(fs.readFileSync(0, "utf8"));
      startWorker(payload, process.env.TRIGGERIFY_WORKSPACE || process.cwd());
    } catch {
      // Title refresh is cosmetic and must never interrupt the agent.
    }
  }
}
