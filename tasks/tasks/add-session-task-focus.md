# 按 Session 区分任务面板

Status: Completed (2026-08-11 12:54)
Kind: Task

## Target
- [x] T1: 每个 Pi session 独立持久化 focused task；Agent 可自动关联，用户可通过命令切换或清除。
- [x] T2: TUI 将当前 session 的关联任务置于 This Session，其余任务置于 Workspace，正式状态、进度和文件链接仍为工作区共享。
- [x] T3: 已完成关联保留到替换或清除；恢复 session、无关联、失效关联、RPC、headless 和既有刷新行为均有确定结果与聚焦测试。

## Scope

- Session 关联只写入 Pi session custom entry，不写入共享任务 Markdown 或工作区 sidecar。
- 自动关联使用 Pi custom tool 的 prompt guidance；不解析 shell 命令，不修改共享 task skills。
- 保持任务正式状态、Target 进度和完成门禁为工作区级事实。

## Plan

1. 在现有 overlay extension 中加入 session focus state、恢复逻辑、自动关联工具和手动命令。
2. 让 TUI 在存在有效关联时分组渲染，同时保持无关联及非 TUI 行为。
3. 扩展聚焦测试并运行 Pi、任务、Context、语法及 diff 校验。

## Result

- T1: npm run test:pi passed: csl_task_focus appends per-session custom entries, /csl-task-focus switches or clears them, and session_start restores independent focus.
- T2: Focused TUI tests passed: valid focus renders This Session and Workspace with shared status, Target progress, and existing OSC 8 task links preserved.
- T3: Focused mode tests passed for completion retention, session restoration, no focus, stale/cleared focus, RPC serialization, headless behavior, refresh, and timer cleanup.
- Review gate: Skipped — Independent review was not requested; proportionate focused and full-suite verification passed.

## Verification

- Passed: npm run test:all passed; extension self-check, Context/Lessons validation, Context self-test, task checks, and git diff --check passed.
