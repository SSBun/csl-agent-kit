import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skill = readFileSync(join(root, "skills", "standing-orders", "SKILL.md"), "utf8");
const triggerCases = JSON.parse(readFileSync(join(root, "skills", "standing-orders", "evals", "trigger_cases.json"), "utf8"));
const semanticConfig = JSON.parse(readFileSync(join(root, "skills", "standing-orders", "evals", "semantic_config.json"), "utf8"));
const hooks = JSON.parse(readFileSync(join(root, "hooks", "hooks.json"), "utf8"));

function runHook(event, dataDir) {
  const command = hooks.hooks[event][0].hooks[0].command;
  return spawnSync("/bin/sh", ["-c", command], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CSL_AGENT_KIT_HOME: dataDir },
  });
}

test("defines confirmation, first-write, limits, conflicts, and priority safeguards", () => {
  assert.match(skill, /Wait for explicit confirmation before writing/);
  assert.match(skill, /If the file does not exist, create the parent directory and the complete initial file/);
  assert.match(skill, /15 entries/);
  assert.match(skill, /1,500 entry characters/);
  assert.match(skill, /duplicate and does not conflict/);
  assert.match(skill, /higher-priority instruction/);
});

test("routes explicit persistent preferences but not ordinary preference statements", () => {
  assert.ok(triggerCases.should_trigger.includes("Save this as a standing order: I prefer concise answers."));
  assert.ok(triggerCases.should_not_trigger.includes("I prefer concise answers."));
  assert.equal(semanticConfig.negative_concepts.current_turn_only.phrases.includes("i prefer"), false);
});

test("SessionStart and PostCompact hooks use the configured data directory", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "csl-standing-orders-"));
  try {
    writeFileSync(join(dataDir, "standing-orders.md"), "# Standing Orders\n\n## Output\n\n- Keep answers concise.\n");
    for (const event of ["SessionStart", "PostCompact"]) {
      const result = runHook(event, dataDir);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /higher-priority instructions or a more specific current request from the user/);
      assert.match(result.stdout, /Keep answers concise/);
    }
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test("hooks preserve legacy tips and emit an actionable migration notice", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "csl-legacy-tips-"));
  try {
    mkdirSync(join(dataDir, "tips"));
    writeFileSync(join(dataDir, "tips", "tips.json"), '{"version":1,"tips":[]}\n');
    const result = runHook("SessionStart", dataDir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Legacy tips detected/);
    assert.match(result.stdout, /preserved and not promoted/);
    assert.match(result.stdout, /standing-orders skill/);

    writeFileSync(join(dataDir, "standing-orders.md"), "# Standing Orders\n\n## Output\n\n- Keep answers concise.\n");
    const partialMigration = runHook("SessionStart", dataDir);
    assert.match(partialMigration.stdout, /Keep answers concise/);
    assert.match(partialMigration.stdout, /Legacy tips detected/);
  } finally {
    rmSync(dataDir, { recursive: true, force: true });
  }
});
