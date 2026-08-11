import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import cslTaskOverlay from "../pi/extensions/csl-task-overlay.ts";

function installFakeExtension() {
  const handlers = new Map();
  cslTaskOverlay({
    on(name, handler) {
      handlers.set(name, handler);
    },
    registerCommand() {},
  });
  return handlers;
}

test("updates one TUI component in place and clears session timers", { concurrency: false }, async () => {
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
    mkdirSync(path.join(cwd, "tasks", "tasks"), { recursive: true });
    writeFileSync(
      path.join(cwd, "tasks", "tasks.md"),
      "# 任务索引\n\n- [Demo task](tasks/demo.md) — In Progress (2026-07-26 18:09)\n",
    );
    writeFileSync(
      path.join(cwd, "tasks", "tasks", "demo.md"),
      "# Demo task\n\n## Target\n\n- [ ] T1: Finish the task\n",
    );

    const handlers = installFakeExtension();
    const registrations = [];
    let widget;
    let renderRequests = 0;
    const ctx = {
      cwd,
      hasUI: true,
      mode: "tui",
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
    assert.match(widget.render(200).at(-1), /🔄 \(0\/1\) Demo task/);
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
    assert.match(widget.render(200).at(-1), /✅ \(1\/1\) Demo task/);

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
    assert.match(widget.render(200).at(-1), /✅ \(1\/1\) Demo task/);

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

test("keeps RPC widgets serializable and headless sessions inert", { concurrency: false }, async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-overlay-modes-"));
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

    const rpcHandlers = installFakeExtension();
    const rpcWidgets = [];
    const rpcCtx = {
      cwd,
      hasUI: true,
      mode: "rpc",
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
    await rpcHandlers.get("session_shutdown")({}, rpcCtx);

    const headlessHandlers = installFakeExtension();
    let setWidgetCalled = false;
    await headlessHandlers.get("session_start")({}, {
      cwd,
      hasUI: false,
      mode: "print",
      ui: {
        setWidget() {
          setWidgetCalled = true;
        },
        notify() {},
      },
    });
    assert.equal(setWidgetCalled, false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
