import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import cslSettings from "../pi/extensions/csl-settings.ts";
import { loadReviewSettings, resolveReviewSettings, saveReviewSettings } from "../pi/lib/csl-settings.ts";

const PARENT = { provider: "example", id: "parent", reasoning: true, thinkingLevelMap: { max: "max" } };
const OTHER = { provider: "other", id: "review", reasoning: true, thinkingLevelMap: { high: null } };

function fixture(initial) {
  const root = mkdtempSync(join(tmpdir(), "csl-settings-"));
  const path = join(root, "settings.json");
  if (initial !== undefined) writeFileSync(path, JSON.stringify(initial));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = root;
  const commands = new Map();
  const tools = new Map();
  const notifications = [];
  const choices = [];
  let thinking = "medium";
  cslSettings({
    registerCommand: (name, command) => commands.set(name, command),
    registerTool: (tool) => tools.set(tool.name, tool),
    getThinkingLevel: () => thinking,
  });
  const ctx = {
    mode: "tui",
    model: PARENT,
    modelRegistry: { getAvailable: () => [PARENT, OTHER] },
    ui: {
      notify: (...args) => notifications.push(args),
      select: async (title, items) => {
        const choice = choices.shift();
        return typeof choice === "function" ? choice(title, items) : choice;
      },
    },
  };
  return {
    path, ctx, choices, notifications,
    command: commands.get("csl-settings"),
    tool: tools.get("csl_review_config"),
    setThinking: (value) => { thinking = value; },
    read: () => tools.get("csl_review_config").execute("config", {}, undefined, undefined, ctx),
    cleanup() {
      if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
      else process.env.CSL_AGENT_KIT_HOME = previous;
      rmSync(root, { recursive: true, force: true });
    },
  };
}

const row = (index) => (_title, items) => items[index];

test("absent settings are read-only and inherit the live parent, not a carrier default", async () => {
  const f = fixture();
  try {
    assert.deepEqual(loadReviewSettings(f.path), {});
    assert.equal((await f.read()).details.launch.model, "example/parent:medium");
    f.ctx.model = OTHER;
    f.setThinking("low");
    assert.equal((await f.read()).details.launch.model, "other/review:low");
    assert.equal(existsSync(f.path), false);
    assert.match(f.tool.promptGuidelines.join("\n"), /each Reviewer runs.run\/runs.all child/);
    assert.match(f.tool.promptGuidelines.join("\n"), /resumed existing child retains its original contract/);
  } finally { f.cleanup(); }
});

test("model and thinking resolve independently; off is not inherit", async () => {
  const f = fixture({ review: { model: "other/review" } });
  try {
    assert.equal((await f.read()).details.launch.model, "other/review:medium");
    saveReviewSettings({ thinking: "off" }, f.path);
    const result = (await f.read()).details;
    assert.equal(result.launch.model, "example/parent:off");
    assert.deepEqual(result.sources, { model: "parent", thinking: "configured" });
    saveReviewSettings({ model: "other/review", thinking: "low" }, f.path);
    assert.equal((await f.read()).details.launch.model, "other/review:low");
    saveReviewSettings({}, f.path);
    assert.equal((await f.read()).details.launch.model, "example/parent:medium");
  } finally { f.cleanup(); }
});

test("saving preserves unrelated fields; clearing removes only review overrides", () => {
  const f = fixture({ future: { enabled: true }, review: { future: "kept", model: "other/review" } });
  try {
    saveReviewSettings({ thinking: "low" }, f.path);
    assert.deepEqual(JSON.parse(readFileSync(f.path, "utf8")), {
      future: { enabled: true }, review: { future: "kept", thinking: "low" },
    });
    saveReviewSettings({}, f.path);
    assert.deepEqual(JSON.parse(readFileSync(f.path, "utf8")), {
      future: { enabled: true }, review: { future: "kept" },
    });
  } finally { f.cleanup(); }
});

test("English panel applies each selection before returning, without save or cancel buttons", async () => {
  const f = fixture();
  try {
    assert.equal(f.command.description, "CSL Agent Kit settings");
    f.choices.push((title, items) => {
      assert.equal(title, "CSL Agent Kit Settings (changes apply automatically)");
      assert.deepEqual(items, ["Review · Model: Inherit from parent", "Review · Thinking level: Inherit from parent"]);
      return items[0];
    }, (title, items) => {
      assert.equal(title, "Review model");
      assert.equal(items[0], "Inherit from parent");
      return "other/review";
    }, (_title, items) => {
      assert.deepEqual(loadReviewSettings(f.path), { model: "other/review" });
      assert.equal(items[0], "Review · Model: other/review");
      return items[1];
    }, (title) => {
      assert.equal(title, "Review thinking level (off disables thinking)");
      return "low";
    }, (_title, items) => {
      assert.deepEqual(loadReviewSettings(f.path), { model: "other/review", thinking: "low" });
      assert.equal(items[1], "Review · Thinking level: low");
      return undefined;
    });
    await f.command.handler("", f.ctx);
    f.choices.push(row(0), "Inherit from parent", row(1), "Inherit from parent");
    await f.command.handler("", f.ctx);
    assert.deepEqual(loadReviewSettings(f.path), {});
    assert.equal((await f.read()).details.launch.model, "example/parent:medium");
    assert.deepEqual(f.notifications, []);
  } finally { f.cleanup(); }
});

test("exit retains applied changes; submenu escape does not write; non-TUI does not open the panel", async () => {
  const f = fixture({ review: { thinking: "low" } });
  try {
    f.choices.push(row(1), "high", undefined);
    await f.command.handler("", f.ctx);
    assert.deepEqual(loadReviewSettings(f.path), { thinking: "high" });
    const before = readFileSync(f.path, "utf8");
    f.choices.push(row(0), undefined, undefined);
    await f.command.handler("", f.ctx);
    assert.equal(readFileSync(f.path, "utf8"), before);
    for (const mode of ["rpc", "json", "print"]) {
      f.ctx.mode = mode;
      f.ctx.ui.select = () => { throw new Error("Must not open a TUI"); };
      await f.command.handler("", f.ctx);
      assert.equal(f.notifications.at(-1)[1], "warning");
      assert.equal((await f.read()).details.thinking, "high");
    }
  } finally { f.cleanup(); }
});

test("bad documents and invalid settings fail closed without overwriting the file", async () => {
  const f = fixture();
  try {
    for (const value of ["{", "[]", '{"review":[]}', '{"review":{"thinking":"ultra"}}', '{"review":{"model":"bare-id"}}', '{"review":{"model":"other/review:high"}}']) {
      writeFileSync(f.path, value);
      await assert.rejects(f.read());
      await f.command.handler("", f.ctx);
      assert.equal(readFileSync(f.path, "utf8"), value);
      assert.equal(f.notifications.at(-1)[1], "error");
    }
    writeFileSync(f.path, '{"review":{"model":"","thinking":null}}');
    assert.deepEqual(loadReviewSettings(f.path), {});
  } finally { f.cleanup(); }
});

test("missing models and unsupported effort do not silently fall back or clamp", async () => {
  const f = fixture();
  try {
    for (const settings of [
      { model: "other/missing" },
      { model: "other/review", thinking: "high" },
      { model: "other/review", thinking: "max" },
    ]) {
      saveReviewSettings(settings, f.path);
      await assert.rejects(f.read());
    }
    saveReviewSettings({}, f.path);
    f.ctx.model = undefined;
    await assert.rejects(f.read(), /No parent model/);
    assert.equal(resolveReviewSettings({ model: "other/review" }, { thinking: "low" }).launch.model, "other/review:low");
  } finally { f.cleanup(); }
});

test("failed validation retains applied values; clearing works with unavailable parent", async () => {
  const f = fixture();
  try {
    f.choices.push(row(0), "other/review", row(1), "high", (_title, items) => {
      assert.deepEqual(loadReviewSettings(f.path), { model: "other/review" });
      assert.equal(items[1], "Review · Thinking level: Inherit from parent");
      return items[1];
    }, "low");
    await f.command.handler("", f.ctx);
    assert.equal(f.notifications.length, 1);
    assert.equal(f.notifications[0][1], "error");
    assert.match(f.notifications[0][0], /does not support high/);
    assert.equal((await f.read()).details.launch.model, "other/review:low");
    f.ctx.modelRegistry.getAvailable = () => [];
    f.choices.push(row(0), "Inherit from parent", row(1), "Inherit from parent");
    await f.command.handler("", f.ctx);
    assert.deepEqual(loadReviewSettings(f.path), {});
    assert.equal(f.notifications.length, 1);
  } finally { f.cleanup(); }
});
