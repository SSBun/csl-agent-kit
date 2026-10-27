import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { resetCapabilitiesCache, setCapabilities, visibleWidth } from "@earendil-works/pi-tui";

const require = createRequire(import.meta.url);
const topics = require("../skills/meta/csl-tasks/shared/lib/topic-core.js");
const taskCore = require("../skills/meta/csl-tasks/shared/lib/task-core.js");
import cslTaskOverlay from "../pi/extensions/csl-task-overlay.ts";

function installFakeExtension() {
  const handlers = new Map();
  const commands = new Map();
  const tools = new Map();
  const entries = [];
  cslTaskOverlay({
    on(name, handler) {
      handlers.set(name, handler);
    },
    registerCommand(name, command) {
      commands.set(name, command);
    },
    registerTool(tool) {
      tools.set(tool.name, tool);
    },
    appendEntry(customType, data) {
      entries.push({ type: "custom", customType, data });
    },
  });
  return { handlers, commands, tools, entries };
}

test("topics stay horizontal, capped at five, with the bound topic first and highlighted", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl 主题 panel-"));
  const { handlers, tools, commands } = installFakeExtension();
  let widget;
  const ctx = {
    cwd, hasUI: true, mode: "tui",
    sessionManager: { getBranch: () => [] },
    ui: {
      setWidget(_key, content) {
        widget = typeof content === "function" ? content({ requestRender() {} }, {
          fg(token, text) { assert.equal(token, "accent"); return `\x1b[36m${text}\x1b[39m`; },
          bold(text) { return `\x1b[1m${text}\x1b[22m`; },
        }) : undefined;
      },
      notify() {},
    },
  };
  setCapabilities({ images: null, trueColor: true, hyperlinks: true });
  try {
    const spec = { scope: "Shared", spec: "FR-1: Example", decisions: "None", dependencies: [] };
    for (let i = 0; i < 7; i++) {
      topics.createTopic(cwd, `topic-${i}`, `主题 ${i}`, spec);
    }
    const archived = topics.createTopic(cwd, "archived", "Archived excluded", spec);
    topics.setState(cwd, archived.id, "Archived", archived.version);
    const task = taskCore.createTask(cwd, { id: "demo", title: "当前任务", kind: "task", targets: ["T1: Example"] });
    topics.association(cwd, "demo", "self:topic-0", {
      expectedTask: topics.hash(task.text), expectedTopic: topics.readTopic(cwd, "topic-0").version,
      mode: "implementation", applies: "FR-1", purpose: "Example",
    });
    const taskFile = path.join(cwd, "tasks/tasks/demo.md");
    writeFileSync(taskFile, `${readFileSync(taskFile, "utf8")}\n## Plan\n\n- Next action: Check the shared contract\n`);
    const before = readFileSync(taskFile, "utf8");
    const topicBefore = readFileSync(topics.readTopic(cwd, "topic-0").file, "utf8");
    await handlers.get("session_start")({}, ctx);
    await tools.get("task_focus").execute("focus", { taskId: "demo" }, undefined, undefined, ctx);
    const rendered = widget.render(120);
    assert.match(rendered[0], /This Session.*📁 Topics/);
    assert.ok(rendered[0].includes(`\x1b]8;;${pathToFileURL(path.join(cwd, "tasks/topics.md")).href}\x1b\\📁 Topics\x1b]8;;\x1b\\`));
    assert.ok(rendered.every(line => !line.includes("│")));
    const text = rendered.join("\n");
    assert.doesNotMatch(text, /Next action: Check the shared contract/);
    assert.equal((text.match(/主题 \d/g) ?? []).length, 5);
    assert.match(rendered[1], /├─ \x1b\[1m\x1b\[36m/);
    assert.ok(!text.includes("\x1b[7m"));
    assert.match(rendered[1], /主题 0/);
    assert.ok(text.includes(pathToFileURL(topics.readTopic(cwd, "topic-0").file).href));
    assert.ok(!text.includes(archived.title));
    for (const width of [0, 1, 2, 3, 8, 20, 40, 80, 120]) {
      const lines = widget.render(width);
      assert.ok(lines.every(line => visibleWidth(line) <= width), `overflow at ${width}`);
      assert.ok(lines.every(line => !line.includes("│")), `divider at ${width}`);
      if (width >= 40) assert.match(lines[0], /This Session.*Topics/, `stacked at ${width}`);
    }
    assert.equal(readFileSync(taskFile, "utf8"), before);
    assert.equal(readFileSync(topics.readTopic(cwd, "topic-0").file, "utf8"), topicBefore);
    await commands.get("task-focus").handler("clear", ctx);
    assert.ok(!widget.render(120).join("\n").includes("\x1b[1m"));
  } finally {
    await handlers.get("session_shutdown")({}, ctx);
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("task navigation stays compact and leaves recorded recovery details unchanged", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-recovery-"));
  const { handlers, tools, commands } = installFakeExtension();
  let widget;
  const messages = [];
  const ctx = {
    cwd, hasUI: true, mode: "tui", sessionManager: { getBranch: () => [] },
    ui: {
      setWidget(_key, content) { widget = typeof content === "function" ? content({ requestRender() {} }) : undefined; },
      notify(message) { messages.push(message); },
    },
  };
  setCapabilities({ images: null, trueColor: true, hyperlinks: false });
  try {
    mkdirSync(path.join(cwd, "tasks/tasks"), { recursive: true });
    const records = [
      ["demo", "进行中", "- Current artifacts: draft.md\n- Next action: Compare draft\n- Required input: Owner\x1b[31m examples\n"],
      ["blocked", "Blocked", "- Next action: Retry later\n\n## Block\n\n- Reason: Missing examples\n- Unblock when: Examples supplied\n"],
      ["cancelled", "Cancelled", "- Next action: Resume with owner\n"],
      ["done", "Completed", "- Next action: Completed hint must hide\n"],
      ["aborted", "Aborted", "- Next action: Aborted hint must hide\n"],
    ];
    const indexFile = path.join(cwd, "tasks/tasks.md");
    const index = `# Tasks\n\n${records.map(([id, status]) => `- [${id}](tasks/${id}.md) — ${status}`).join("\n")}\n- [Linked](tasks/linked.md) — Pending\n- [Outside](../outside.md) — Pending\n`;
    writeFileSync(indexFile, index);
    for (const [id, , notes] of records) writeFileSync(path.join(cwd, `tasks/tasks/${id}.md`), `# ${id}\n\n## Plan\n\n${notes}`);
    writeFileSync(path.join(cwd, "outside.md"), "# Outside\n\n## Plan\n\n- Next action: Private outside hint\n");
    symlinkSync(path.join(cwd, "outside.md"), path.join(cwd, "tasks/tasks/linked.md"));
    const taskFile = path.join(cwd, "tasks/tasks/demo.md"), before = readFileSync(taskFile, "utf8");
    await handlers.get("session_start")({}, ctx);
    let output = widget.render(200).join("\n");
    assert.doesNotMatch(output, /↳|Current artifacts|Next action|Required input|Block reason|Unblock when|hint must hide|Private outside hint/);
    await tools.get("task_focus").execute("focus", { taskId: "demo" }, undefined, undefined, ctx);
    output = widget.render(200).join("\n");
    assert.match(output, /This Session/);
    assert.match(output, /└─ 🔄 demo/);
    assert.doesNotMatch(output, /↳|Current artifacts|Next action|Required input|Block reason|Unblock when|Missing examples|Examples supplied|Resume with owner|\x1b/);
    assert.doesNotMatch(output.split("📁 Workspace")[1], /↳/);
    for (const width of [0, 1, 2, 3, 8, 20, 80]) assert.ok(widget.render(width).every((line) => visibleWidth(line) <= width), `overflow at ${width}`);
    await commands.get("tasks").handler("", ctx);
    assert.doesNotMatch(messages.at(-1), /↳|Current artifacts|Next action|Required input|Block reason|Unblock when|hint must hide|Private outside hint|\x1b/);
    assert.equal(readFileSync(taskFile, "utf8"), before);
    assert.equal(readFileSync(indexFile, "utf8"), index);
    writeFileSync(taskFile, before.replace("Compare draft", "Compare revised draft"));
    await commands.get("tasks").handler("", ctx);
    assert.equal(widget.render(200).join("\n"), output);
    await tools.get("task_focus").execute("blocked", { taskId: "blocked" }, undefined, undefined, ctx);
    output = widget.render(200).join("\n");
    assert.match(output, /└─ 🚫 blocked/);
    assert.doesNotMatch(output, /↳|Next action|Block reason|Unblock when|Missing examples|Examples supplied/);
    assert.doesNotMatch(output.split("📁 Workspace")[1], /↳/);
    await tools.get("task_focus").execute("cancelled", { taskId: "cancelled" }, undefined, undefined, ctx);
    assert.match(widget.render(200).join("\n"), /└─ ⏹️ cancelled/);
    assert.doesNotMatch(widget.render(200).join("\n"), /↳|Next action|Resume with owner/);
    await tools.get("task_focus").execute("linked", { taskId: "linked" }, undefined, undefined, ctx);
    assert.doesNotMatch(widget.render(200).join("\n"), /↳|Private outside hint/);
    await tools.get("task_focus").execute("done", { taskId: "done" }, undefined, undefined, ctx);
    assert.match(widget.render(200)[0], /This Session/);
    assert.match(widget.render(200)[1], /✅ done/);
    assert.doesNotMatch(widget.render(200).join("\n"), /↳|Completed hint must hide/);
    await tools.get("task_focus").execute("aborted", { taskId: "aborted" }, undefined, undefined, ctx);
    assert.doesNotMatch(widget.render(200).join("\n"), /↳|Aborted hint must hide/);
    await commands.get("task-focus").handler("clear", ctx);
    assert.doesNotMatch(widget.render(200).join("\n"), /This Session|↳/);
  } finally {
    await handlers.get("session_shutdown")({}, ctx);
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("topics render without tasks and without hyperlink support", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-topics-only-"));
  const { handlers } = installFakeExtension();
  let widget;
  const ctx = {
    cwd, hasUI: true, mode: "tui", sessionManager: { getBranch: () => [] },
    ui: { setWidget(_key, content) { widget = typeof content === "function" ? content({ requestRender() {} }) : undefined; }, notify() {} },
  };
  setCapabilities({ images: null, trueColor: true, hyperlinks: false });
  try {
    topics.createTopic(cwd, "only", "Only topic", { scope: "Shared", spec: "FR-1: Example", decisions: "None", dependencies: [] });
    await handlers.get("session_start")({}, ctx);
    const text = widget.render(80).join("\n");
    assert.match(text, /📁 Topics/);
    assert.match(text, /└─ Only topic/);
    assert.ok(!text.includes("│"));
    assert.match(text, /Only topic/);
    assert.ok(!text.includes("\x1b]8;"));
  } finally {
    await handlers.get("session_shutdown")({}, ctx);
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("updates one TUI component in place and clears session timers", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl task overlay-"));
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const timers = [];

  setCapabilities({ images: null, trueColor: true, hyperlinks: true });
  globalThis.setInterval = (callback, delay) => {
    const timer = {
      callback,
      delay,
      cleared: false,
      unreferenced: false,
      unref() {
        this.unreferenced = true;
      },
    };
    timers.push(timer);
    return timer;
  };
  globalThis.clearInterval = (timer) => {
    timer.cleared = true;
  };

  try {
    mkdirSync(path.join(cwd, "tasks", "tasks"), { recursive: true });
    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      "# 任务索引\n\n- [Demo task](tasks/demo.md) — In Progress (2026-07-26 18:09)\n",
    );
    writeFileSync(
      path.join(cwd, "tasks", "tasks", "demo.md"),
      "# Demo task\n\n## Target\n\n- [ ] T1: Finish the task\n",
    );

    const { handlers } = installFakeExtension();
    const registrations = [];
    let widget;
    let renderRequests = 0;
    const ctx = {
      cwd,
      hasUI: true,
      mode: "tui",
      sessionManager: { getBranch: () => [] },
      ui: {
        setWidget(_key, content) {
          registrations.push(content);
          widget = typeof content === "function"
            ? content({ requestRender: () => renderRequests++ })
            : undefined;
        },
        notify() {},
      },
    };

    await handlers.get("session_start")({}, ctx);
    assert.equal(typeof registrations[0], "function");
    assert.ok(widget.render(200)[0].includes(`\x1b]8;;${pathToFileURL(path.join(cwd, "tasks/tasks.md")).href}\x1b\\📋 Tasks\x1b]8;;\x1b\\`));
    const taskLine = widget.render(200).at(-1);
    const taskUrl = pathToFileURL(path.join(cwd, "tasks", "tasks", "demo.md")).href;
    assert.match(taskLine, /🔄 \(0\/1\)/);
    assert.ok(taskUrl.includes("%20"));
    assert.ok(taskLine.includes(`\x1b]8;;${taskUrl}\x1b\\Demo task\x1b]8;;\x1b\\`));
    assert.equal(timers[0].delay, 5_000);
    assert.equal(timers[0].unreferenced, true);

    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      "# 任务索引\n\n- [Demo task](tasks/demo.md) — Completed (2026-07-26 18:10)\n",
    );
    writeFileSync(
      path.join(cwd, "tasks", "tasks", "demo.md"),
      "# Demo task\n\n## Target\n\n- [x] T1: Finish the task\n",
    );

    const firstWidget = widget;
    timers[0].callback();
    assert.equal(registrations.length, 1);
    assert.equal(widget, firstWidget);
    assert.equal(renderRequests, 1);
    assert.match(widget.render(200).at(-1), /✅ \(1\/1\)/);

    writeFileSync(path.join(cwd, "tasks", "tasks.md"), "# 任务索引\n");
    timers[0].callback();
    assert.equal(registrations.length, 2);
    assert.equal(registrations.at(-1), undefined);
    assert.equal(widget, undefined);

    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      "# 任务索引\n\n- [Demo task](tasks/demo.md) — Completed (2026-07-26 18:10)\n",
    );
    timers[0].callback();
    assert.equal(registrations.length, 3);
    assert.equal(typeof registrations.at(-1), "function");
    assert.notEqual(widget, firstWidget);
    assert.match(widget.render(200).at(-1), /✅ \(1\/1\)/);

    await handlers.get("session_start")({}, ctx);
    assert.equal(timers[0].cleared, true);
    assert.equal(timers.length, 2);

    await handlers.get("session_shutdown")({}, ctx);
    assert.equal(timers[1].cleared, true);
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("keeps RPC widgets serializable and headless sessions inert", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-overlay-modes-"));
  setCapabilities({ images: null, trueColor: true, hyperlinks: true });
  try {
    mkdirSync(path.join(cwd, "tasks", "tasks"), { recursive: true });
    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      "# 任务索引\n\n- [Demo task](tasks/demo.md) — Pending (2026-07-26 18:09)\n",
    );
    writeFileSync(
      path.join(cwd, "tasks", "tasks", "demo.md"),
      "# Demo task\n\n## Target\n\n- [ ] T1: Finish the task\n",
    );

    const { handlers: rpcHandlers } = installFakeExtension();
    const rpcWidgets = [];
    const rpcCtx = {
      cwd,
      hasUI: true,
      mode: "rpc",
      sessionManager: {
        getBranch: () => [{ type: "custom", customType: "csl-task-focus", data: { taskId: "demo" } }],
      },
      ui: {
        setWidget(_key, content) {
          rpcWidgets.push(content);
        },
        notify() {},
      },
    };
    await rpcHandlers.get("session_start")({}, rpcCtx);
    assert.ok(Array.isArray(rpcWidgets[0]));
    assert.match(rpcWidgets[0].at(-1), /⏳ \(0\/1\) Demo task/);
    assert.doesNotMatch(rpcWidgets[0].at(-1), /\x1b]8;;/);
    await rpcHandlers.get("session_shutdown")({}, rpcCtx);

    const { handlers: headlessHandlers } = installFakeExtension();
    let setWidgetCalled = false;
    await headlessHandlers.get("session_start")({}, {
      cwd,
      hasUI: false,
      mode: "print",
      sessionManager: {
        getBranch: () => [{ type: "custom", customType: "csl-task-focus", data: { taskId: "demo" } }],
      },
      ui: {
        setWidget() {
          setWidgetCalled = true;
        },
        notify() {},
      },
    });
    assert.equal(setWidgetCalled, false);
  } finally {
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("keeps TUI task titles plain when the terminal lacks hyperlink support", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-overlay-plain-"));
  setCapabilities({ images: null, trueColor: true, hyperlinks: false });
  try {
    mkdirSync(path.join(cwd, "tasks", "tasks"), { recursive: true });
    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      "# 任务索引\n\n- [Demo task](tasks/demo.md) — Pending (2026-07-26 18:09)\n",
    );
    writeFileSync(path.join(cwd, "tasks", "tasks", "demo.md"), "# Demo task\n");

    const { handlers } = installFakeExtension();
    let widget;
    const ctx = {
      cwd,
      hasUI: true,
      mode: "tui",
      sessionManager: { getBranch: () => [] },
      ui: {
        setWidget(_key, content) {
          widget = typeof content === "function"
            ? content({ requestRender() {} })
            : undefined;
        },
        notify() {},
      },
    };

    await handlers.get("session_start")({}, ctx);
    assert.match(widget.render(200).at(-1), /⏳ Demo task/);
    assert.doesNotMatch(widget.render(200).at(-1), /\x1b]8;;/);
    await handlers.get("session_shutdown")({}, ctx);
  } finally {
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("persists session focus and keeps a completed task focused until changed or cleared", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-overlay-focus-"));
  setCapabilities({ images: null, trueColor: true, hyperlinks: false });
  try {
    mkdirSync(path.join(cwd, "tasks", "tasks"), { recursive: true });
    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      [
        "# 任务索引",
        "",
        "- [Other task](tasks/other.md) — Pending (2026-07-26 18:10)",
        "- [Demo task](tasks/demo.md) — In Progress (2026-07-26 18:09)",
        "",
      ].join("\n"),
    );
    writeFileSync(path.join(cwd, "tasks", "tasks", "other.md"), "# Other task\n");
    writeFileSync(
      path.join(cwd, "tasks", "tasks", "demo.md"),
      "# Demo task\n\n## Target\n\n- [ ] T1: Finish the task\n",
    );

    const { handlers, commands, tools, entries } = installFakeExtension();
    let widget;
    const ctx = {
      cwd,
      hasUI: true,
      mode: "tui",
      sessionManager: { getBranch: () => [] },
      ui: {
        setWidget(_key, content) {
          widget = typeof content === "function"
            ? content({ requestRender() {} })
            : undefined;
        },
        notify() {},
      },
    };

    await handlers.get("session_start")({}, ctx);
    assert.match(widget.render(200)[0], /📋 Tasks/);

    const focusTool = tools.get("task_focus");
    assert.equal(tools.has("csl_task_focus"), false);
    assert.equal(tools.has("task_target_confirm"), false);
    assert.match(focusTool.promptGuidelines[0], /task, task-plan, or task-queue/);
    assert.match(focusTool.promptGuidelines[0], /creates, resumes, reopens, or activates/);
    assert.doesNotMatch(focusTool.promptGuidelines[0], /csl-task/);
    await focusTool.execute("call-1", { taskId: "demo" }, undefined, undefined, ctx);
    assert.deepEqual(entries.at(-1), {
      type: "custom",
      customType: "csl-task-focus",
      data: { taskId: "demo" },
    });
    assert.match(widget.render(200)[0], /📋 This Session/);
    assert.match(widget.render(200)[1], /🔄 \(0\/1\) Demo task/);
    assert.match(widget.render(200)[2], /📁 Workspace/);
    assert.ok(!widget.render(200)[2].includes("\x1b]8;"));
    assert.match(widget.render(200)[3], /⏳ Other task/);

    setCapabilities({ images: null, trueColor: true, hyperlinks: true });
    await commands.get("tasks").handler("", ctx);
    assert.ok(widget.render(200)[2].includes(`\x1b]8;;${pathToFileURL(path.join(cwd, "tasks/tasks.md")).href}\x1b\\📁 Workspace\x1b]8;;\x1b\\`));
    setCapabilities({ images: null, trueColor: true, hyperlinks: false });
    await commands.get("tasks").handler("", ctx);

    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      [
        "# 任务索引",
        "",
        "- [Other task](tasks/other.md) — Pending (2026-07-26 18:10)",
        "- [Demo task](tasks/demo.md) — Completed (2026-07-26 18:11)",
        "",
      ].join("\n"),
    );
    writeFileSync(
      path.join(cwd, "tasks", "tasks", "demo.md"),
      "# Demo task\n\n## Target\n\n- [x] T1: Finish the task\n",
    );
    await commands.get("tasks").handler("", ctx);
    assert.match(widget.render(200)[0], /📋 This Session/);
    assert.match(widget.render(200)[1], /✅ \(1\/1\) Demo task/);

    await commands.get("task-focus").handler("other", ctx);
    assert.deepEqual(entries.at(-1).data, { taskId: "other" });
    assert.match(widget.render(200)[1], /⏳ Other task/);

    const focused = await focusTool.execute("call-read", {}, undefined, undefined, ctx);
    assert.match(focused.content[0].text, /Focused task: other/);
    assert.equal(focused.details.taskId, "other");

    const noFocus = await focusTool.execute("call-read-none", {}, undefined, undefined, { ...ctx, sessionManager: { getBranch: () => [] } });
    assert.match(noFocus.content[0].text, /Focused task: other/); // live mirror wins over a stale branch

    await commands.get("task-focus").handler("clear", ctx);
    assert.equal(commands.has("csl-task-focus"), false);
    assert.equal(commands.has("csl-tasks"), false);
    assert.deepEqual(entries.at(-1).data, { taskId: null });
    const cleared = await focusTool.execute("call-read-cleared", {}, undefined, undefined, ctx);
    assert.match(cleared.content[0].text, /No focused task/);
    assert.match(widget.render(200)[0], /📋 Tasks/);
    assert.ok(widget.render(200).every((line) => !line.includes("This Session")));

    await assert.rejects(
      focusTool.execute("call-2", { taskId: "missing" }, undefined, undefined, ctx),
      /Canonical task not found: missing/,
    );
    await handlers.get("session_shutdown")({}, ctx);
  } finally {
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("restores independent session focus and ignores stale or cleared entries", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-overlay-restore-"));
  setCapabilities({ images: null, trueColor: true, hyperlinks: false });
  try {
    mkdirSync(path.join(cwd, "tasks", "tasks"), { recursive: true });
    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      [
        "# 任务索引",
        "",
        "- [Demo task](tasks/demo.md) — In Progress (2026-07-26 18:10)",
        "- [Other task](tasks/other.md) — Pending (2026-07-26 18:09)",
        "",
      ].join("\n"),
    );
    writeFileSync(path.join(cwd, "tasks", "tasks", "demo.md"), "# Demo task\n");
    writeFileSync(path.join(cwd, "tasks", "tasks", "other.md"), "# Other task\n");

    const cases = [
      { taskId: "demo", expected: /Demo task/, grouped: true },
      { taskId: "other", expected: /Other task/, grouped: true },
      { taskId: "missing", expected: /📋 Tasks/, grouped: false },
      { taskId: null, expected: /📋 Tasks/, grouped: false },
    ];
    for (const fixture of cases) {
      const { handlers } = installFakeExtension();
      let widget;
      const ctx = {
        cwd,
        hasUI: true,
        mode: "tui",
        sessionManager: {
          getBranch: () => [{
            type: "custom",
            customType: "csl-task-focus",
            data: { taskId: fixture.taskId },
          }],
        },
        ui: {
          setWidget(_key, content) {
            widget = typeof content === "function"
              ? content({ requestRender() {} })
              : undefined;
          },
          notify() {},
        },
      };

      await handlers.get("session_start")({}, ctx);
      const lines = widget.render(200);
      assert.match(fixture.grouped ? lines[1] : lines[0], fixture.expected);
      assert.equal(lines.some((line) => line.includes("This Session")), fixture.grouped);
      await handlers.get("session_shutdown")({}, ctx);
    }
  } finally {
    resetCapabilitiesCache();
    rmSync(cwd, { recursive: true, force: true });
  }
});
