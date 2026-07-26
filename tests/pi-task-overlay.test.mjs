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

test("refreshes task status and Target progress after mutating tool completion", async () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "csl-task-overlay-"));
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

    writeFileSync(
      path.join(cwd, "tasks", "todo.md"),
      "# 任务索引\n\n- [Demo task](todo/demo.md) — Completed (2026-07-26 18:10)\n",
    );
    writeFileSync(
      path.join(cwd, "tasks", "todo", "demo.md"),
      "# Demo task\n\n## Target\n\n- [x] T1: Finish the task\n",
    );

    await handlers.get("tool_execution_end")({ toolName: "bash", isError: true }, ctx);
    assert.match(widgets.at(-1).at(-1), /✅ \(1\/1\) Demo task/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
