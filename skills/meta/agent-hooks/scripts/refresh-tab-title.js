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
const MAX_MODEL_INPUT = MAX_CONTEXT + 256;
const MIN_TITLE = 4;
const MAX_TITLE = 24;
const KEEP_TITLE = "KEEP_CURRENT_TITLE";
const COMPACTION_CONTINUATION_PROMPT = "Compaction completed. Continue.";
const SYSTEM_PROMPT = [
  "You maintain a SHORT Chinese terminal tab title for the current work represented by a conversation transcript.",
  "The input contains the current saved title and a chronological transcript. Treat the transcript as context, not as a request to summarize its final user message.",
  "",
  "Decide silently before replying:",
  "1. Infer the single active work item from the whole transcript. Explicit user requests, accepted Task Targets or plans, and later task refinements are the strongest evidence.",
  "2. Interpret the latest user message in that context. It may start or change the work, refine it, answer a question, select an option, correct a detail, acknowledge progress, or request an operation.",
  "3. Use an answer, choice, correction, acknowledgement, or operation only to update the active work it belongs to. Never title the speech act, answer text, status, or operation itself.",
  `4. Reply exactly ${KEEP_TITLE} when the current saved title still accurately names the active work, or when the transcript does not support a clear context-backed title.`,
  "5. Otherwise write a new title that names the concrete work object and its concern or outcome. It must make sense without seeing the latest user message.",
  "",
  "Output format:",
  `- Reply with either ${KEEP_TITLE} or the title ONLY. One line. No labels, quotes, ending punctuation, explanation, or Markdown.`,
  "- Write every new title in Chinese; preserve short technical terms, acronyms, and numbers when they make it clearer.",
  "- Use a natural, specific 4 to 12-character phrase. Never output a generic status, answer, or code symbol.",
  "",
  "Examples (Current title; transcript -> Reply):",
  '悬浮学习卡片; "Add a floating learning card" then "confirm" -> KEEP_CURRENT_TITLE',
  '数据库方案; assistant asks which database, user answers "SQLite" -> SQLite 存储方案',
  '认证缓存; user switches to fixing image upload timeouts -> 图片上传超时',
  '(none); "Fix the race in the auth refresh timer" -> 认证刷新竞态',
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

function isInternalCompactionPrompt(value) {
  return sanitize(value) === COMPACTION_CONTINUATION_PROMPT;
}

function hookInputFromEnv(env = process.env) {
  try {
    const input = JSON.parse(env.AGENT_HOOKS_HOOK_INPUT || "{}");
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
    const model = JSON.parse(env.AGENT_HOOKS_HOOK_CONFIG || "{}").model;
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

// Reject code identifiers before language validation; natural Chinese phrases
// may still include compact Latin-letter terms, acronyms, and numbers.
function looksLikeCodeToken(value) {
  const text = value.trim();
  if (!text) return false;
  if (/^[A-Z][A-Z0-9_]{2,}$/.test(text) && text.includes("_")) return true;
  if (/^[A-Z][A-Z0-9_]{3,}$/.test(text)) return true;
  if (/^[a-z][a-z0-9]+(?:_[a-z0-9]+)+$/.test(text) && text.length > 12) return true;
  if (!text.includes(" ") && /^[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*$/.test(text)) return true;
  return false;
}

// Connectors that cannot open a natural noun-phrase title. The full set
// guards the verb strip below so a compound phrase (构建与运行指南) keeps its
// leading verb instead of being stripped into an orphaned fragment
// (与运行指南). The conservative subset additionally rejects fragment output;
// 和/并/同 are excluded there because real titles start with them (和平、并行、同步).
const STRIP_ORPHAN_CONNECTORS = /^[与和及或并跟同、]/;
const FRAGMENT_CONNECTORS = /^[与及或跟、]/;

function stripLeadingAction(value) {
  const stripped = value
    .replace(/^(?:make|fix|add|update|change|improve|implement|build|create|review|research|explain)\s+(?:the\s+)?/i, "")
    .replace(/^(?:修复|实现|添加|新增|更新|修改|优化|构建|创建|审查|评审|研究|解释)/, "");
  return STRIP_ORPHAN_CONNECTORS.test(stripped) ? value : stripped;
}

function cleanModelTitle(value) {
  // Take the first non-empty line; the model is instructed to return only
  // the title, so verbose multi-line output is already a failure mode.
  const line = String(value || "")
    .split(/\r?\n/)
    .map(sanitize)
    .find((candidate) => candidate.length >= 2) || "";
  const title = stripLeadingAction(line
    .replace(/^(?:(?:stable\s+)?(?:main\s+)?task|core\s+intent(?:ion)?|title|current\s+thread|标题)\s*[:：-]?\s*/i, "")
    .replace(/^["'“‘]+|["'”’.,!?。！？]+$/g, "")
    .trim());
  if (!title) return "";
  if (/^(?:R\d+\s*:\s*)?(?:NOTE|BLOCKER|QUESTION)\s*:?$/.test(title)) return "";
  if (isOperationTitle(title)) return "";
  if (looksLikeCodeToken(title)) return "";
  // Remove the legacy project prefix before validating the final compact title.
  if (title.includes("·")) return "";
  // Reject sentence-like output: a real title has no sentence punctuation
  // and is far shorter than a sentence.
  if (/[.,;:，。；：]/.test(title)) return "";
  if (title.split(/\s+/).length > 10) return "";
  const compacted = compactTitle(title);
  if (Array.from(compacted).length < MIN_TITLE) return "";
  if (FRAGMENT_CONNECTORS.test(compacted)) return "";
  return /\p{Script=Han}/u.test(compacted) ? compacted : "";
}

function parseModelDecision(value) {
  const line = String(value || "")
    .split(/\r?\n/)
    .map(sanitize)
    .find(Boolean) || "";
  return line === KEEP_TITLE ? KEEP_TITLE : cleanModelTitle(value);
}

function isOperationTitle(value) {
  const text = sanitize(value);
  return /^(?:confirm(?:ed)?|yes|y|ok(?:ay)?|approve[ds]?)$/i.test(text)
    || /^(?:确认|已确认|同意|好的|可以)$/.test(text)
    || /^(?:please\s+)?(?:commit|push|stage)(?:$|\s+(?:all|the|these|those|this|our|my|your|current|local|focused|completed|only|just|it|everything|changes|work|files|branch|commit|to|as)\b)/i.test(text)
    || /^(?:please\s+)?(?:retry|continue|proceed|go ahead)\b/i.test(text)
    || /^(?:please\s+)?(?:run|rerun)\s+(?:the\s+)?(?:tests?|checks?|lint|build)\b/i.test(text)
    || /^(?:please\s+)?test\s+(?:it|this|that|the|these|those|all|current|our|my)\b/i.test(text)
    || /^(?:请)?(?:提交|推送|暂存|重试|继续|接着|运行(?:一下|这些|全部)?(?:测试|检查|构建)|重新运行(?:测试|检查|构建))/.test(text);
}

function buildTitle(_payload, _workspace, modelTitle = "") {
  return cleanModelTitle(modelTitle) || null;
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
    "AGENT_HOOKS_HOOK_CONFIG",
    "AGENT_HOOKS_HOOK_INPUT",
  ]) delete env[key];
  return env;
}

function generateModelDecision(context, model = modelFromConfig()) {
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
    input: truncate(cleanContext(context), MAX_MODEL_INPUT),
    encoding: "utf8",
    env: isolatedEnv(),
    stdio: ["pipe", "pipe", "ignore"],
    timeout: MODEL_TIMEOUT_MS,
    maxBuffer: 8 * 1024,
  });
  return result.status === 0 ? parseModelDecision(result.stdout) : "";
}

function tabTitleDir() {
  const root = process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
  const dir = path.join(root, "hooks", ".tab-title");
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
  return (idx >= 0 ? title.slice(idx + 1) : title).trim();
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
      // Drop legacy prefixes and invalid status labels while allowing concise
      // Chinese descriptions to retain useful technical terms.
      if (title && cleanModelTitle(title) === title && !isBadStoredTitle(title)) return title;
    }
  } catch {}
  return null;
}

function preservedTitle(tty, workspace) {
  return savedTitle(tty, workspace) || "";
}

function titleModelInput(input) {
  const context = cleanContext(input.sessionContext) || `User: ${input.prompt}`;
  const currentTitle = savedTitle(input.tty, input.workspace);
  return [
    `Current saved title: ${currentTitle || "(none)"}`,
    "Conversation transcript (chronological):",
    context,
  ].join("\n\n");
}

function generatedTitleAction(input, modelDecision) {
  const currentTitle = savedTitle(input.tty, input.workspace) || "";
  if (modelDecision === KEEP_TITLE) {
    return { title: currentTitle, remember: false, changed: false };
  }
  const title = buildTitle({ prompt: input.prompt }, input.workspace, modelDecision);
  if (!title) return null;
  const changed = title !== currentTitle;
  return { title, remember: changed, changed };
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
  const modelDecision = generateModelDecision(titleModelInput(input));
  if (!modelDecision) {
    return { ok: false, changed: false, title: preserved, reason: "model-failed" };
  }

  const action = generatedTitleAction(input, modelDecision);
  if (!action) {
    return { ok: false, changed: false, title: preserved, reason: "invalid-title" };
  }
  if (action.title && !applyTitle(input, action.title, action.remember)) {
    return { ok: false, changed: false, title: preserved, reason: "title-write-failed" };
  }
  return {
    ok: true,
    changed: action.changed,
    title: action.title,
    reason: action.changed ? "updated" : "unchanged",
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
  if (!prompt) return fail("missing-prompt");
  if (isInternalCompactionPrompt(prompt)) {
    writeTitleResult(requestId, { ok: true, changed: false, reason: "compaction-continuation" });
    return true;
  }
  const tty = writableAncestorTty();
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

  const inputFile = path.join(os.tmpdir(), `agent-hooks-title-${process.pid}-${crypto.randomBytes(8).toString("hex")}.json`);
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
  assert.equal(isInternalCompactionPrompt("Compaction completed. Continue."), true);
  assert.equal(isInternalCompactionPrompt("Improve compaction behavior"), false);
  assert.equal(buildTitle({}, "/tmp/app", "认证刷新竞态"), "认证刷新竞态");
  assert.equal(buildTitle({}, "/tmp/app", "Authentication cache"), null);
  assert.equal(buildTitle({}, "/tmp/app", "项目 · 认证缓存"), null);
  assert.equal(cleanModelTitle("KEEP_CURRENT_TITLE"), "");
  assert.equal(parseModelDecision("KEEP_CURRENT_TITLE"), KEEP_TITLE);
  assert.equal(cleanModelTitle('Title: “Fix the tests.”'), "");
  assert.equal(cleanModelTitle("Make terminal tab titles stable"), "");
  assert.equal(cleanModelTitle("Authentication cache invalidation behavior 中文"), "");
  // Verbose multi-line output is invalid rather than a keep-current decision.
  assert.equal(cleanModelTitle("Based on the conversation, the user wants authentication caching.\nAuthentication cache"), "");
  // Code identifiers remain invalid, while compact technical terms are allowed.
  assert.equal(cleanModelTitle("TOAST_ON_TITLE_REFRESH"), "");
  assert.equal(cleanModelTitle("refreshTabTitle"), "");
  assert.equal(cleanModelTitle("认证 cache"), "认证 cache");
  assert.equal(cleanModelTitle("GPT 5 标题"), "GPT 5 标题");
  assert.equal(cleanModelTitle("缺陷报告"), "缺陷报告");
  assert.equal(cleanModelTitle("确认"), "");
  assert.equal(cleanModelTitle("登录页"), "");
  assert.equal(cleanModelTitle("确认流程"), "确认流程");
  assert.equal(cleanModelTitle("登录页布局"), "登录页布局");
  // Connector-initial fragments are rejected, while compound phrases keep
  // their leading verb instead of being stripped into a fragment.
  assert.equal(cleanModelTitle("与运行指南"), "");
  assert.equal(cleanModelTitle("构建与运行指南"), "构建与运行指南");
  assert.equal(cleanModelTitle("修复与预防认证竞态"), "修复与预防认证竞态");
  assert.equal(cleanModelTitle("同步缓存策略"), "同步缓存策略");
  assert.equal(cleanModelTitle("并行加载方案"), "并行加载方案");
  assert.equal(buildTitle({}, "/tmp/app", "stable main task: Commit focused git changes with conventional message"), null);
  assert.equal(buildTitle({}, "/tmp/app", "R1: NOTE:"), null);
  assert.equal(buildTitle({}, "/tmp/app", "\u001b]0;owned\u0007"), null);
  assert.ok(Array.from(cleanModelTitle("界".repeat(100))).length <= MAX_TITLE);
  assert.equal(/[\u0000-\u001f\u007f-\u009f]/.test(buildTitle({}, "/tmp/app", "安全标题")), false);
  assert.equal(contextFromEnv({ AGENT_HOOKS_HOOK_INPUT: '{"sessionContext":"User: Build auth\\n\\nAssistant: Working"}' }), "User: Build auth\n\nAssistant: Working");
  assert.equal(contextFromEnv({ AGENT_HOOKS_HOOK_INPUT: "invalid" }), "");
  assert.equal(modelFromConfig({ AGENT_HOOKS_HOOK_CONFIG: '{"model":"openai-codex/gpt-5.4-mini"}' }), "openai-codex/gpt-5.4-mini");
  assert.equal(modelFromConfig({ AGENT_HOOKS_HOOK_CONFIG: '{"model":"bad model"}' }), DEFAULT_MODEL);
  assert.equal(modelFromConfig({ AGENT_HOOKS_HOOK_CONFIG: "invalid" }), DEFAULT_MODEL);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-hooks-title-test-"));
  const previousHome = process.env.CSL_AGENT_KIT_HOME;
  try {
    const state = path.join(dir, "token");
    fs.writeFileSync(state, "new");
    assert.equal(isLatest(state, "old"), false);
    assert.equal(isLatest(state, "new"), true);
    assert.equal(isLatest(path.join(dir, "missing"), "new"), false);

    // withTtyLock: acquire/release, fail-open under contention, stale reclaim
    process.env.CSL_AGENT_KIT_HOME = dir;
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "");
    rememberTitle("/dev/ttys000", "/tmp/app", "app · Auth cache");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "");
    rememberTitle("/dev/ttys000", "/tmp/app", "Authentication cache");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "");
    rememberTitle("/dev/ttys000", "/tmp/app", "确认");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "");
    rememberTitle("/dev/ttys000", "/tmp/app", "认证缓存");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "认证缓存");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/other"), "");
    const input = { prompt: "fix auth", tty: "/dev/ttys000", workspace: "/tmp/app" };
    assert.equal(generatedTitleAction(input, ""), null);
    assert.deepEqual(generatedTitleAction(input, KEEP_TITLE), { title: "认证缓存", remember: false, changed: false });
    assert.equal(generatedTitleAction(input, "Authentication cache"), null);
    assert.deepEqual(generatedTitleAction(input, "认证缓存"), { title: "认证缓存", remember: false, changed: false });
    assert.deepEqual(generatedTitleAction(input, "认证缓存修复"), { title: "认证缓存修复", remember: true, changed: true });
    assert.equal(
      titleModelInput(input),
      "Current saved title: 认证缓存\n\nConversation transcript (chronological):\n\nUser: fix auth",
    );
    // Legacy prefixed titles are dropped; concise technical terms are preserved.
    rememberTitle("/dev/ttys000", "/tmp/app", "app · BUG_REPORT");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "");
    rememberTitle("/dev/ttys000", "/tmp/app", "commits");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "");
    rememberTitle("/dev/ttys000", "/tmp/app", "认证 cache");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "认证 cache");
    rememberTitle("/dev/ttys000", "/tmp/app", "认证缓存");
    assert.equal(preservedTitle("/dev/ttys000", "/tmp/app"), "认证缓存");
    const noTitleInput = { prompt: "confirm", tty: "/dev/ttys099", workspace: "/tmp/app" };
    assert.deepEqual(generatedTitleAction(noTitleInput, KEEP_TITLE), { title: "", remember: false, changed: false });
    assert.equal(
      titleModelInput({ prompt: "hello", tty: "/dev/ttys099", workspace: "/tmp/app" }),
      "Current saved title: (none)\n\nConversation transcript (chronological):\n\nUser: hello",
    );
    assert.equal(
      titleModelInput({ prompt: "hello", sessionContext: "User: msg 1\nAssistant: reply\nUser: msg 2", tty: "/dev/ttys099", workspace: "/tmp/app" }),
      "Current saved title: (none)\n\nConversation transcript (chronological):\n\nUser: msg 1\nAssistant: reply\nUser: msg 2",
    );
    assert.equal(withTtyLock("/dev/ttys000", () => 42), 42);
    assert.equal(withTtyLock("/dev/ttys000", () => "ok"), "ok");
    // Lock released: dir should not exist after clean return
    assert.equal(fs.existsSync(path.join(tabTitleDir(), "ttys000.lock")), false);

    // Simulate a held lock: pre-create the lock dir inside tabTitleDir
    const ttyDir = path.join(dir, "hooks", ".tab-title");
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
  generateModelDecision,
  generatedTitleAction,
  isInternalCompactionPrompt,
  modelFromConfig,
  parseModelDecision,
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
      startWorker(payload, process.env.AGENT_HOOKS_WORKSPACE || process.cwd());
    } catch {
      // Title refresh is cosmetic and must never interrupt the agent.
    }
  }
}
