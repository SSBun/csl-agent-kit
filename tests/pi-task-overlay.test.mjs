import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import cslTaskOverlay from "../pi/extensions/csl-task-overlay.ts";

function installFakeExtension() {
  const handlers = new Map();
  const widgets = [];
  cslTaskOverlay({
    on(name, handler) {
      handlers.set(name, handler);
    },
    registerCommand() {},
  });
  return { handlers, widgets };
}

test("polls task content every five seconds and clears session timers", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-overlay-"));
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const timers = [];

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
    mkdirSync(path.join(cwd, "tasks", "todo"), { recursive: true });
    writeFileSync(
      path.join(cwd, "tasks", "todo.md"),
      "# 任务索引\n\n- [Demo task](todo/demo.md) — In Progress (2026-07-26 18:09)\n",
    );
    writeFileSync(
      path.join(cwd, "tasks", "todo", "demo.md"),
      "# Demo task\n\n## Target\n\n- [ ] T1: Finish the task\n",
    );

    const { handlers, widgets } = installFakeExtension();
    const ctx = {
      cwd,
      hasUI: true,
      ui: {
        setWidget(_key, content) {
          widgets.push(content);
        },
        notify() {},
      },
    };

    await handlers.get("session_start")({}, ctx);
    assert.match(widgets.at(-1).at(-1), /🔄 \(0\/1\) Demo task/);
    assert.equal(timers[0].delay, 5_000);
    assert.equal(timers[0].unreferenced, true);

    writeFileSync(
      path.join(cwd, "tasks", "todo.md"),
      "# 任务索引\n\n- [Demo task](todo/demo.md) — Completed (2026-07-26 18:10)\n",
    );
    writeFileSync(
      path.join(cwd, "tasks", "todo", "demo.md"),
      "# Demo task\n\n## Target\n\n- [x] T1: Finish the task\n",
    );

    timers[0].callback();
    assert.match(widgets.at(-1).at(-1), /✅ \(1\/1\) Demo task/);

    await handlers.get("session_start")({}, ctx);
    assert.equal(timers[0].cleared, true);
    assert.equal(timers.length, 2);

    await handlers.get("session_shutdown")({}, ctx);
    assert.equal(timers[1].cleared, true);
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
    rmSync(cwd, { recursive: true, force: true });
  }
});
