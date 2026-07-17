import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const addScript = join(root, "skills", "tips", "scripts", "tips-add.sh");
const candidateScript = join(root, "skills", "tips", "scripts", "tips-candidates.js");
const doctorScript = join(root, "skills", "tips", "scripts", "tips-doctor.sh");
const injectScript = join(root, "skills", "tips", "scripts", "tips-inject.sh");
const migrateScript = join(root, "skills", "tips", "scripts", "tips-migrate.sh");
const storeScript = join(root, "skills", "tips", "scripts", "tips-store.js");

function createDataDir() {
  return mkdtempSync(join(tmpdir(), "csl-tips-"));
}

function run(script, args, dataDir, extraEnv = {}) {
  return spawnSync(script, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CSL_AGENT_KIT_HOME: dataDir, ...extraEnv },
  });
}

function runAsync(script, args, dataDir) {
  return new Promise((resolveRun) => {
    const child = spawn(script, args, {
      cwd: root,
      env: { ...process.env, CSL_AGENT_KIT_HOME: dataDir },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolveRun({ status, stdout, stderr }));
  });
}

function writeJsonTips(dataDir, tips) {
  const tipsDir = join(dataDir, "tips");
  mkdirSync(tipsDir, { recursive: true });
  writeFileSync(join(tipsDir, "tips.json"), `${JSON.stringify({ version: 1, tips }, null, 2)}\n`);
}

function writeTips(dataDir, texts) {
  writeJsonTips(dataDir, texts.map((text) => ({ text, keywords: ["test"] })));
}

function writeLegacyTips(dataDir, tips) {
  const tipsDir = join(dataDir, "tips");
  mkdirSync(tipsDir, { recursive: true });
  writeFileSync(join(tipsDir, "tips.md"), ["# Tips", "", ...tips.map((tip) => `- ${tip}`), ""].join("\n"));
}

function readJsonTips(dataDir) {
  return JSON.parse(readFileSync(join(dataDir, "tips", "tips.json"), "utf8"));
}

function runCandidates(prompt, dataDir, extraEnv = {}) {
  return spawnSync(process.execPath, [candidateScript], {
    cwd: root,
    encoding: "utf8",
    input: JSON.stringify({ prompt }),
    env: { ...process.env, CSL_AGENT_KIT_HOME: dataDir, ...extraEnv },
  });
}

test("requires explicit confirmation before writing", () => {
  const dataDir = createDataDir();
  try {
    const result = run(addScript, ["--keywords", "answer", "Keep final answers concise."], dataDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /without --confirmed/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("requires keywords and writes a JSON tip within the text limit", () => {
  const dataDir = createDataDir();
  try {
    const missingKeywords = run(addScript, ["--confirmed", "Keep final answers concise."], dataDir);
    assert.equal(missingKeywords.status, 2);
    assert.match(missingKeywords.stderr, /--keywords/);

    const accepted = run(addScript, ["--confirmed", "--keywords", "answer,concise", "a".repeat(150)], dataDir);
    assert.equal(accepted.status, 0, accepted.stderr);
    assert.deepEqual(readJsonTips(dataDir).tips, [{ text: "a".repeat(150), keywords: ["answer", "concise"] }]);

    const rejected = run(addScript, ["--confirmed", "--keywords", "answer", "b".repeat(151)], dataDir);
    assert.equal(rejected.status, 2);
    assert.match(rejected.stderr, /150 characters or fewer/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("counts Unicode characters consistently in the C locale", () => {
  const dataDir = createDataDir();
  try {
    const accepted = run(
      addScript,
      ["--confirmed", "--keywords", "中文", "中".repeat(150)],
      dataDir,
      { LC_ALL: "C" },
    );
    assert.equal(accepted.status, 0, accepted.stderr);

    const rejected = run(
      addScript,
      ["--confirmed", "--keywords", "中文", "文".repeat(151)],
      dataDir,
      { LC_ALL: "C" },
    );
    assert.equal(rejected.status, 2);
    assert.match(rejected.stderr, /151 characters/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("rejects blank, multiline, duplicate, and malformed keyworded tips", () => {
  const dataDir = createDataDir();
  try {
    const blank = run(addScript, ["--confirmed", "--keywords", "answer", "   "], dataDir);
    assert.equal(blank.status, 2);
    assert.match(blank.stderr, /cannot be blank/);

    const multiline = run(addScript, ["--confirmed", "--keywords", "answer", "First line\nSecond line"], dataDir);
    assert.equal(multiline.status, 2);
    assert.match(multiline.stderr, /single line/);

    const emptyKeyword = run(addScript, ["--confirmed", "--keywords", "answer,,format", "Use plain text."], dataDir);
    assert.equal(emptyKeyword.status, 2);
    assert.match(emptyKeyword.stderr, /non-empty/);

    const wildcard = run(addScript, ["--confirmed", "--keywords", "*", "Apply this everywhere."], dataDir);
    assert.equal(wildcard.status, 2);
    assert.match(wildcard.stderr, /The "\*" keyword is not supported/);

    writeJsonTips(dataDir, [{ text: "Show absolute file paths.", keywords: ["path"] }]);
    const duplicate = run(addScript, ["--confirmed", "--keywords", "path", "Show absolute file paths."], dataDir);
    assert.equal(duplicate.status, 2);
    assert.match(duplicate.stderr, /already exists/);
    assert.doesNotMatch(duplicate.stderr, /timed out/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("rejects a twenty-first tip", () => {
  const dataDir = createDataDir();
  try {
    writeTips(dataDir, Array.from({ length: 20 }, (_, index) => `Saved tip ${index + 1}.`));
    const result = run(addScript, ["--confirmed", "--keywords", "more", "One more tip."], dataDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /20 tips/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("serializes concurrent JSON additions without exceeding the hard limit", async () => {
  const dataDir = createDataDir();
  try {
    const results = await Promise.all(
      Array.from(
        { length: 30 },
        (_, index) => runAsync(addScript, ["--confirmed", "--keywords", "concurrent", `Concurrent tip ${index + 1}.`], dataDir),
      ),
    );
    const saved = readJsonTips(dataDir);

    assert.equal(results.filter((result) => result.status === 0).length, 20);
    assert.equal(saved.tips.length, 20);
    assert.equal(new Set(saved.tips.map((tip) => tip.text)).size, 20);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("reuses a JSON lock file after its previous process exits", () => {
  const dataDir = createDataDir();
  const tipsDir = join(dataDir, "tips");
  const lockFile = join(tipsDir, "tips.json.lock");
  try {
    mkdirSync(tipsDir, { recursive: true });
    writeFileSync(lockFile, "stale contents\n");

    const result = run(addScript, ["--confirmed", "--keywords", "recover", "Recovered tip."], dataDir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readJsonTips(dataDir).tips[0].text, "Recovered tip.");
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("accepts exactly 20 tips and 2000 total tip characters", () => {
  const dataDir = createDataDir();
  try {
    const existing = Array.from(
      { length: 19 },
      (_, index) => `${String(index).padStart(2, "0")}${"x".repeat(97)}`,
    );
    writeTips(dataDir, existing);
    const result = run(addScript, ["--confirmed", "--keywords", "limit", "y".repeat(119)], dataDir);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("rejects additions that exceed 2000 total tip characters", () => {
  const dataDir = createDataDir();
  try {
    const existing = Array.from(
      { length: 19 },
      (_, index) => `${String(index).padStart(2, "0")}${"x".repeat(98)}`,
    );
    writeTips(dataDir, existing);
    const result = run(addScript, ["--confirmed", "--keywords", "limit", "y".repeat(101)], dataDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /2,000 total characters/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("renders a complete JSON tips preview on demand", () => {
  const dataDir = createDataDir();
  try {
    writeJsonTips(dataDir, [{ text: "Keep final answers concise.", keywords: ["answer"] }]);
    const result = run(injectScript, [], dataDir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Confirmed saved user instructions \(follow when applicable unless higher-priority instructions conflict\):/);
    assert.doesNotMatch(result.stdout, /Before responding or using tools|Loaded from/);
    assert.match(result.stdout, /Keep final answers concise/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("reads a JSON tips file from the configured file override", () => {
  const dataDir = createDataDir();
  const customDir = createDataDir();
  try {
    writeJsonTips(dataDir, [{ text: "Default tip.", keywords: ["default"] }]);
    writeJsonTips(customDir, [{ text: "Custom tip.", keywords: ["custom"] }]);
    const customFile = join(customDir, "tips", "tips.json");
    const result = run(injectScript, [], dataDir, { CSL_AGENT_KIT_TIPS_FILE: customFile });
    assert.match(result.stdout, /Custom tip/);
    assert.doesNotMatch(result.stdout, /Default tip/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(customDir, { recursive: true, force: true });
  }
});

test("injects only JSON tips whose keywords match the prompt", () => {
  const dataDir = createDataDir();
  try {
    writeJsonTips(dataDir, [
      { text: "修复前先说明根因。", keywords: ["修复", "bug"] },
      { text: "用 Typora 打开生成的 Markdown 文件。", keywords: ["Typora", "Markdown"] },
      { text: "不要发送可选的过程更新。", keywords: ["commentary"] },
    ]);

    const result = runCandidates("Please fix this BUG.", dataDir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Confirmed user instructions matching this prompt \(follow unless higher-priority instructions conflict\):/);
    assert.doesNotMatch(result.stdout, /Before responding or using tools|Loaded from|These instructions were explicitly confirmed/);
    assert.match(result.stdout, /修复前先说明根因/);
    assert.doesNotMatch(result.stdout, /不要发送可选的过程更新/);
    assert.doesNotMatch(result.stdout, /Typora/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("silently ignores a stale wildcard tip instead of matching every prompt", () => {
  const dataDir = createDataDir();
  try {
    writeJsonTips(dataDir, [{ text: "Apply this everywhere.", keywords: ["*"] }]);
    const result = runCandidates("Any unrelated prompt.", dataDir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("migrates a confirmed legacy tips file with its exact keyword mapping", () => {
  const dataDir = createDataDir();
  const legacyTips = ["Show absolute file paths.", "Use Typora for Markdown."];
  try {
    writeLegacyTips(dataDir, legacyTips);
    const legacyFile = join(dataDir, "tips", "tips.md");
    const sameFile = run(migrateScript, [
      "--confirmed",
      "--keywords-json",
      JSON.stringify({
        "Show absolute file paths.": ["path", "Markdown"],
        "Use Typora for Markdown.": ["Typora", "Markdown"],
      }),
      "--destination",
      legacyFile,
    ], dataDir);
    assert.equal(sameFile.status, 2);
    assert.match(sameFile.stderr, /must be different files/);

    const result = run(migrateScript, [
      "--confirmed",
      "--keywords-json",
      JSON.stringify({
        "Show absolute file paths.": ["path", "Markdown"],
        "Use Typora for Markdown.": ["Typora", "Markdown"],
      }),
    ], dataDir);

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(readJsonTips(dataDir).tips, [
      { text: "Show absolute file paths.", keywords: ["path", "Markdown"] },
      { text: "Use Typora for Markdown.", keywords: ["Typora", "Markdown"] },
    ]);
    assert.equal(existsSync(join(dataDir, "tips", "tips.md")), false);
    assert.equal(existsSync(join(dataDir, "tips", "tips.md.bak")), true);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("preserves legacy data when a migration violates the tip length limit", () => {
  const dataDir = createDataDir();
  const overlong = "x".repeat(151);
  try {
    writeLegacyTips(dataDir, [overlong]);
    const result = run(migrateScript, [
      "--confirmed",
      "--keywords-json",
      JSON.stringify({ [overlong]: ["limit"] }),
    ], dataDir);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /150 characters or fewer/);
    assert.equal(existsSync(join(dataDir, "tips", "tips.md")), true);
    assert.equal(existsSync(join(dataDir, "tips", "tips.json")), false);
    assert.equal(existsSync(join(dataDir, "tips", "tips.md.bak")), false);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("uses prompt-time tips candidates while preserving SOP candidates", () => {
  const document = JSON.parse(readFileSync(join(root, "hooks/hooks.json"), "utf8"));
  const sessionCommands = ["SessionStart", "PostCompact"].flatMap((eventName) => (document.hooks[eventName] || []))
    .flatMap((entry) => entry.hooks || [])
    .map((hook) => hook.command || "");
  const promptCommands = (document.hooks.UserPromptSubmit || [])
    .flatMap((entry) => entry.hooks || [])
    .map((hook) => hook.command || "");

  assert.equal(sessionCommands.some((command) => command.includes("tips-inject.sh")), false);
  assert.equal(promptCommands.some((command) => command.includes("tips-candidates.js")), true);
  assert.equal(promptCommands.some((command) => command.includes("sop-candidates.js")), true);
});

test("doctor reports JSON validation, preview, and candidate lifecycle coverage", () => {
  const dataDir = createDataDir();
  try {
    writeJsonTips(dataDir, [
      { text: "中".repeat(151), keywords: ["诊断"] },
      { text: "中".repeat(151), keywords: ["重复"] },
    ]);

    const invalid = run(doctorScript, [], dataDir, { LC_ALL: "C" });
    assert.equal(invalid.status, 0, invalid.stderr);
    assert.match(invalid.stdout, /150 characters per tip/);
    assert.match(invalid.stdout, /warning: overlong tips/);
    assert.match(invalid.stdout, /151 characters/);
    assert.match(invalid.stdout, /warning: duplicate tips/);
    assert.match(invalid.stdout, /warning: invalid tips data/);

    writeJsonTips(dataDir, [{ text: "Show absolute file paths.", keywords: ["path"] }]);
    const valid = run(doctorScript, [], dataDir);
    assert.match(valid.stdout, /hook_lifecycle: UserPromptSubmit=found/);
    assert.match(valid.stdout, /hook_lifecycle: SessionStart=not-used/);
    assert.match(valid.stdout, /pi_lifecycle: before_agent_start=found/);
    assert.match(valid.stdout, /Injection preview:/);
    assert.match(valid.stdout, /Confirmed saved user instructions/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("doctor finds candidate lifecycle files in an installed package without git metadata", () => {
  const fixture = createDataDir();
  const packageRoot = join(fixture, "package");
  const scriptsDir = join(packageRoot, "skills", "tips", "scripts");
  const copiedDoctor = join(scriptsDir, "tips-doctor.sh");
  try {
    mkdirSync(scriptsDir, { recursive: true });
    mkdirSync(join(packageRoot, "hooks"), { recursive: true });
    mkdirSync(join(packageRoot, "pi", "extensions"), { recursive: true });
    for (const script of [doctorScript, injectScript, storeScript, candidateScript]) {
      cpSync(script, join(scriptsDir, script.split("/").at(-1)));
    }
    const minifiedHooks = JSON.stringify(JSON.parse(readFileSync(join(root, "hooks", "hooks.json"), "utf8")));
    writeFileSync(join(packageRoot, "hooks", "hooks.json"), minifiedHooks);
    cpSync(join(root, "pi", "extensions", "csl-context-hooks.ts"), join(packageRoot, "pi", "extensions", "csl-context-hooks.ts"));
    chmodSync(copiedDoctor, 0o755);
    chmodSync(join(scriptsDir, "tips-inject.sh"), 0o755);

    const result = run(copiedDoctor, [], join(fixture, "data"));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /hook_lifecycle: UserPromptSubmit=found/);
    assert.match(result.stdout, /hook_lifecycle: SessionStart=not-used/);
    assert.match(result.stdout, /pi_lifecycle: before_agent_start=found/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
