# 为 Codex 创建任务感知状态栏

| Field | Value |
| --- | --- |
| Status | In Progress (2026-10-14 17:32) |
| Kind | Task |

## Target

- [ ] T1: Codex TUI 的底部状态区域能持续显示当前 CSL Task 的身份、状态与可用进度信息，体验上对应 Pi 的 Task panel。
- [ ] T2: 该能力可从当前项目安装或启用，并附有可复现的配置说明。

## Scope

- Include a Codex-native status-line integration that reflects canonical CSL Task state.
- Do not silently substitute Codex thread state or `update_plan` progress for canonical Task state.
- Do not modify the user's global Codex configuration merely for verification.

## Plan

1. Confirm the supported Codex status-line and plugin extension boundaries.
2. Resolve whether to ship a supported built-in approximation or maintain a custom Codex build for exact canonical Task state.
3. Implement, document, and verify the selected integration path.

## Decisions

- Codex 0.162.1 accepts only built-in `tui.status_line` identifiers; plugins cannot register a custom footer renderer or file-backed item.
- The built-in `task-progress` item reports only the latest `update_plan` checklist count, not `tasks/tasks.md` state.
