import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
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
const injectScript = join(root, "skills", "tips", "scripts", "tips-inject.sh");
const doctorScript = join(root, "skills", "tips", "scripts", "tips-doctor.sh");

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

function writeTips(dataDir, tips) {
  const tipsDir = join(dataDir, "tips");
  mkdirSync(tipsDir, { recursive: true });
  writeFileSync(join(tipsDir, "tips.md"), [
    "# Tips",
    "",
    "<!-- Short user preferences and commands. This file is injected into sessions by CSL Agent Kit hooks. -->",
    "",
    ...tips.map((tip) => `- ${tip}`),
    "",
  ].join("\n"));
}

test("requires explicit confirmation before writing", () => {
  const dataDir = createDataDir();
  try {
    const result = run(addScript, ["Keep final answers concise."], dataDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /without --confirmed/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("accepts 120 characters and rejects 121 characters", () => {
  const dataDir = createDataDir();
  try {
    const accepted = run(addScript, ["--confirmed", "a".repeat(120)], dataDir);
    assert.equal(accepted.status, 0, accepted.stderr);

    const rejected = run(addScript, ["--confirmed", "b".repeat(121)], dataDir);
    assert.equal(rejected.status, 2);
    assert.match(rejected.stderr, /120 characters or fewer/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("counts Unicode characters consistently in the C locale", () => {
  const dataDir = createDataDir();
  try {
    const accepted = run(
      addScript,
      ["--confirmed", "中".repeat(120)],
      dataDir,
      { LC_ALL: "C" },
    );
    assert.equal(accepted.status, 0, accepted.stderr);

    const rejected = run(
      addScript,
      ["--confirmed", "文".repeat(121)],
      dataDir,
      { LC_ALL: "C" },
    );
    assert.equal(rejected.status, 2);
    assert.match(rejected.stderr, /121 characters/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("rejects blank, multiline, and duplicate tips", () => {
  const dataDir = createDataDir();
  try {
    const blank = run(addScript, ["--confirmed", "   "], dataDir);
    assert.equal(blank.status, 2);
    assert.match(blank.stderr, /cannot be blank/);

    const multiline = run(addScript, ["--confirmed", "First line\nSecond line"], dataDir);
    assert.equal(multiline.status, 2);
    assert.match(multiline.stderr, /single line/);

    writeTips(dataDir, ["Show absolute file paths."]);
    const tipsFile = join(dataDir, "tips", "tips.md");
    writeFileSync(
      tipsFile,
      readFileSync(tipsFile, "utf8").replace("- Show absolute", "  - Show absolute"),
    );
    const duplicate = run(addScript, ["--confirmed", "Show absolute file paths."], dataDir);
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
    const result = run(addScript, ["--confirmed", "One more tip."], dataDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /20 tips/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("serializes concurrent additions without exceeding the hard limit", async () => {
  const dataDir = createDataDir();
  try {
    const results = await Promise.all(
      Array.from(
        { length: 30 },
        (_, index) => runAsync(addScript, ["--confirmed", `Concurrent tip ${index + 1}.`], dataDir),
      ),
    );
    const saved = readFileSync(join(dataDir, "tips", "tips.md"), "utf8");
    const tips = saved.split("\n").filter((line) => line.startsWith("- "));

    assert.equal(results.filter((result) => result.status === 0).length, 20);
    assert.equal(tips.length, 20);
    assert.equal(new Set(tips).size, 20);
    assert.equal(saved.match(/^# Tips$/gm)?.length, 1);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("reuses a lock file after its previous process exits", () => {
  const dataDir = createDataDir();
  const tipsDir = join(dataDir, "tips");
  const lockFile = join(tipsDir, "tips.md.lock");
  try {
    mkdirSync(tipsDir, { recursive: true });
    writeFileSync(lockFile, "stale contents\n");

    const result = run(addScript, ["--confirmed", "Recovered tip."], dataDir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(tipsDir, "tips.md"), "utf8").includes("Recovered tip."), true);
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
    const result = run(addScript, ["--confirmed", "y".repeat(119)], dataDir);
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
    const result = run(addScript, ["--confirmed", "y".repeat(101)], dataDir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /2,000 total characters/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("injects saved tips as confirmed mandatory instructions", () => {
  const dataDir = createDataDir();
  try {
    writeTips(dataDir, ["Keep final answers concise."]);
    const result = run(injectScript, [], dataDir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CONFIRMED PERSISTENT USER INSTRUCTIONS/);
    assert.match(result.stdout, /mandatory whenever applicable, not optional suggestions/);
    assert.match(result.stdout, /Before responding or using tools/);
    assert.match(result.stdout, /Keep final answers concise/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("injects tips from the configured file override", () => {
  const dataDir = createDataDir();
  const customDir = createDataDir();
  try {
    writeTips(dataDir, ["Default tip."]);
    writeTips(customDir, ["Custom tip."]);
    const customFile = join(customDir, "tips", "tips.md");
    const result = run(
      injectScript,
      [],
      dataDir,
      { CSL_AGENT_KIT_TIPS_FILE: customFile },
    );
    assert.match(result.stdout, /Custom tip/);
    assert.doesNotMatch(result.stdout, /Default tip/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(customDir, { recursive: true, force: true });
  }
});

test("doctor reports limits, malformed data, preview, and lifecycle coverage", () => {
  const dataDir = createDataDir();
  try {
    const duplicate = "中".repeat(121);
    writeTips(dataDir, [duplicate, duplicate]);
    const tipsFile = join(dataDir, "tips", "tips.md");
    writeFileSync(tipsFile, `${readFileSync(tipsFile, "utf8")}unexpected continuation\n`);

    const result = run(doctorScript, [], dataDir, { LC_ALL: "C" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /120 characters per tip/);
    assert.match(result.stdout, /warning: overlong tips/);
    assert.match(result.stdout, /121 characters/);
    assert.match(result.stdout, /warning: duplicate tips/);
    assert.match(result.stdout, /warning: malformed or multiline content/);
    assert.match(result.stdout, /hook_lifecycle: UserPromptSubmit=found/);
    assert.match(result.stdout, /pi_lifecycle: before_agent_start=found/);
    assert.match(result.stdout, /Injection preview:/);
    assert.match(result.stdout, /CONFIRMED PERSISTENT USER INSTRUCTIONS/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("doctor finds lifecycle files in an installed package without git metadata", () => {
  const fixture = createDataDir();
  const packageRoot = join(fixture, "package");
  const scriptsDir = join(packageRoot, "skills", "tips", "scripts");
  const copiedDoctor = join(scriptsDir, "tips-doctor.sh");
  try {
    mkdirSync(scriptsDir, { recursive: true });
    mkdirSync(join(packageRoot, "hooks"), { recursive: true });
    mkdirSync(join(packageRoot, ".codex-plugin", "hooks"), { recursive: true });
    mkdirSync(join(packageRoot, "pi", "extensions"), { recursive: true });
    cpSync(doctorScript, copiedDoctor);
    cpSync(injectScript, join(scriptsDir, "tips-inject.sh"));
    const minifiedHooks = JSON.stringify(
      JSON.parse(readFileSync(join(root, "hooks", "hooks.json"), "utf8")),
    );
    writeFileSync(join(packageRoot, "hooks", "hooks.json"), minifiedHooks);
    writeFileSync(join(packageRoot, ".codex-plugin", "hooks", "hooks.json"), minifiedHooks);
    cpSync(
      join(root, "pi", "extensions", "csl-context-hooks.ts"),
      join(packageRoot, "pi", "extensions", "csl-context-hooks.ts"),
    );
    chmodSync(copiedDoctor, 0o755);
    chmodSync(join(scriptsDir, "tips-inject.sh"), 0o755);

    const result = run(copiedDoctor, [], join(fixture, "data"));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /hook_lifecycle: UserPromptSubmit=found/);
    assert.match(result.stdout, /pi_lifecycle: before_agent_start=found/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
