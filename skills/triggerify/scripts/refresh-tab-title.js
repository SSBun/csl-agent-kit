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
const MAX_SUMMARY = 56;
const MAX_TITLE = 72;
const KEEP_TITLE = "KEEP_CURRENT_TITLE";
const SYSTEM_PROMPT = [
  "Classify the latest user's main requested action.",
  `Return exactly ${KEEP_TITLE} when that action is only an acknowledgement, continuation, retry, commit, push, or test run for existing work.`,
  "Do not keep the title when the main action creates, changes, fixes, optimizes, researches, or explains a concrete subject, even if the request mentions routine operations.",
  "Otherwise return only a concise terminal tab title, 2-6 words, without quotes, Markdown, or ending punctuation.",
  "Preserve the task language exactly: English task means English title; Chinese task means Chinese title.",
].join(" ");

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

function cleanModelTitle(value) {
  const line = String(value || "")
    .split(/\r?\n/)
    .map(sanitize)
    .find(Boolean) || "";
  return truncate(
    line
      .replace(/^(?:title|标题)\s*[:：]\s*/i, "")
      .replace(/^["'“‘]+|["'”’.,!?。！？]+$/g, "")
      .trim(),
    MAX_SUMMARY,
  );
}

function buildTitle(payload, workspace, modelTitle = "") {
  if (modelTitle === KEEP_TITLE) return null;
  const project = sanitize(path.basename(workspace || "")) || "Pi";
  const summary = cleanModelTitle(modelTitle) || truncate(sanitize(payload?.prompt), MAX_SUMMARY);
  return truncate(summary ? `${project} · ${summary}` : project, MAX_TITLE);
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
  ]) delete env[key];
  return env;
}

function generateModelTitle(prompt, model = modelFromConfig()) {
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
    input: truncate(sanitize(prompt), MAX_PROMPT),
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

function runWorker(input) {
  const title = buildTitle({ prompt: input.prompt }, input.workspace, generateModelTitle(input.prompt));
  if (title === null) return true;
  const result = withTtyLock(input.tty, () => {
    if (!isLatest(input.state, input.token)) return false;
    return writeTitle(input.tty, title);
  });
  return result === true;
}

function startWorker(payload, workspace) {
  const prompt = truncate(sanitize(payload?.prompt), MAX_PROMPT);
  const tty = writableAncestorTty();
  if (!prompt || !tty) return false;

  const token = crypto.randomUUID();
  const state = stateFile(tty);
  const published = withTtyLock(tty, () => {
    fs.writeFileSync(state, token, { mode: 0o600 });
    return true;
  });
  if (published !== true) return false;

  const inputFile = path.join(os.tmpdir(), `triggerify-title-${process.pid}-${crypto.randomBytes(8).toString("hex")}.json`);
  let descriptor;
  try {
    fs.writeFileSync(inputFile, JSON.stringify({ prompt, workspace, tty, state, token }), { mode: 0o600, flag: "wx" });
    descriptor = fs.openSync(inputFile, "r");
    fs.unlinkSync(inputFile);
    const child = spawn(process.execPath, [__filename, "--worker"], {
      detached: true,
      env: process.env,
      stdio: [descriptor, "ignore", "ignore"],
    });
    child.unref();
    return true;
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    try { fs.unlinkSync(inputFile); } catch {}
  }
}

function selfTest() {
  assert.equal(buildTitle({ prompt: "Add a cache" }, "/tmp/my-project"), "my-project · Add a cache");
  assert.equal(buildTitle({ prompt: "fallback" }, "/tmp/app", "Auth Refresh Race Fix"), "app · Auth Refresh Race Fix");
  assert.equal(buildTitle({ prompt: "commit these changes" }, "/tmp/app", KEEP_TITLE), null);
  assert.equal(cleanModelTitle(KEEP_TITLE), KEEP_TITLE);
  assert.equal(cleanModelTitle('Title: “Fix the tests.”'), "Fix the tests");
  assert.equal(buildTitle({ prompt: "\u001b]0;owned\u0007" }, "/tmp/app"), "app · ]0;owned");
  assert.ok(Array.from(buildTitle({ prompt: "界".repeat(100) }, "/tmp/app")).length <= MAX_TITLE);
  assert.equal(/[\u0000-\u001f\u007f-\u009f]/.test(buildTitle({ prompt: "safe" }, "/tmp/app")), false);
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
  generateModelTitle,
  modelFromConfig,
  sanitize,
  startWorker,
  truncate,
  writableAncestorTty,
};

if (require.main === module) {
  if (process.argv[2] === "--self-test") {
    selfTest();
  } else if (process.argv[2] === "--worker") {
    try {
      runWorker(JSON.parse(fs.readFileSync(0, "utf8")));
    } catch {
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
