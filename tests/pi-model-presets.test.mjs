import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import cslModelPresets from "../pi/extensions/csl-model-presets.ts";

const FLASH = {
  provider: "deepseek",
  id: "deepseek-v4-flash",
  reasoning: true,
  thinkingLevelMap: { low: "low", high: "high", max: "max" },
};
const SOL = {
  provider: "openai-codex",
  id: "gpt-5.6-sol",
  reasoning: true,
  thinkingLevelMap: { minimal: "low", xhigh: "xhigh", max: "max" },
};

function createFixture(config, models = [FLASH, SOL], setModelResult = true) {
  const agentDir = mkdtempSync(join(tmpdir(), "csl-model-presets-"));
  writeFileSync(join(agentDir, "presets.json"), `${JSON.stringify(config, null, 2)}\n`);
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;

  let command;
  let selectedModel;
  let thinkingLevel = "off";
  const notifications = [];
  const selections = [];
  cslModelPresets({
    registerCommand(name, value) {
      assert.equal(name, "preset");
      command = value;
    },
    async setModel(model) {
      selectedModel = model;
      return setModelResult;
    },
    getThinkingLevel() {
      return thinkingLevel;
    },
    setThinkingLevel(level) {
      thinkingLevel = level;
    },
  });

  const context = {
    hasUI: true,
    modelRegistry: { find: (provider, model) => models.find((item) => item.provider === provider && item.id === model) },
    ui: {
      notify: (...args) => notifications.push(args),
      select: async (title, items) => {
        selections.push({ title, items });
        return items[0];
      },
    },
  };

  return {
    agentDir,
    command,
    context,
    notifications,
    selections,
    state: () => ({ selectedModel, thinkingLevel }),
    cleanup() {
      if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
      else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
      rmSync(agentDir, { recursive: true, force: true });
    },
  };
}

const PRESETS = {
  "flash-max": { provider: "deepseek", model: "deepseek-v4-flash", thinkingLevel: "max" },
  "sol-xhigh": { provider: "openai-codex", model: "gpt-5.6-sol", thinkingLevel: "xhigh" },
};

test("selects a preset and reloads configuration for every command", async () => {
  const fixture = createFixture(PRESETS);
  try {
    await fixture.command.handler("", fixture.context);
    assert.deepEqual(fixture.selections[0].items, ["flash-max", "sol-xhigh"]);
    assert.deepEqual(fixture.state(), { selectedModel: FLASH, thinkingLevel: "max" });

    writeFileSync(join(fixture.agentDir, "presets.json"), `${JSON.stringify({
      "flash-max": PRESETS["sol-xhigh"],
    })}\n`);
    await fixture.command.handler("flash-max", fixture.context);
    assert.deepEqual(fixture.state(), { selectedModel: SOL, thinkingLevel: "xhigh" });
    assert.equal(fixture.notifications.at(-1)[1], "info");
  } finally {
    fixture.cleanup();
  }
});

test("lists presets without changing model or thinking level", async () => {
  const fixture = createFixture(PRESETS);
  try {
    assert.deepEqual(fixture.command.getArgumentCompletions("l"), [{ value: "list", label: "list" }]);
    await fixture.command.handler("list", fixture.context);
    assert.deepEqual(fixture.state(), { selectedModel: undefined, thinkingLevel: "off" });
    assert.deepEqual(fixture.notifications, [[
      "flash-max: deepseek/deepseek-v4-flash · max\nsol-xhigh: openai-codex/gpt-5.6-sol · xhigh",
      "info",
    ]]);
  } finally {
    fixture.cleanup();
  }
});

test("rejects invalid, missing, unsupported, and unauthenticated presets before success", async () => {
  const cases = [
    [{ broken: { provider: "deepseek", model: "deepseek-v4-flash", thinkingLevel: "ultra" } }, [], true, "broken"],
    [PRESETS, [FLASH, SOL], true, "unknown"],
    [{ missing: { provider: "deepseek", model: "not-found", thinkingLevel: "max" } }, [], true, "missing"],
    [
      { unsupported: { provider: "openai-codex", model: "gpt-5.6-sol", thinkingLevel: "high" } },
      [{ ...SOL, thinkingLevelMap: { high: null, xhigh: "xhigh" } }],
      true,
      "unsupported",
    ],
    [{ locked: PRESETS["sol-xhigh"] }, [SOL], false, "locked"],
  ];

  for (const [config, models, setModelResult, name] of cases) {
    const fixture = createFixture(config, models, setModelResult);
    try {
      await fixture.command.handler(name, fixture.context);
      assert.equal(fixture.notifications.at(-1)[1], "error");
      assert.notEqual(fixture.state().thinkingLevel, "xhigh");
    } finally {
      fixture.cleanup();
    }
  }
});
