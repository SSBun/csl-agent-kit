# 让 /tasks 任务记录可点击

Status: Completed (2026-08-20 15:03)
Kind: Task

## Scope

- 仅改变 Pi `/tasks` 通知中的标题渲染；复用已有 canonical path 与 OSC 8 处理，不改变任务解析、排序、数量限制、widget、focus 或 RPC。

## Target
- [x] T1: Pi `/tasks` 输出中的 canonical task 标题在支持 OSC 8 的 TUI 中链接到对应任务 Markdown 文件。
- [x] T2: 不支持 hyperlink 的终端及非 canonical 路径继续显示纯文本，现有最近 20 条、分组、计数和进度格式保持不变。
- [x] T3: 聚焦的非测试验证确认链接 URL 正确、纯文本回退有效，且未改动无关工作区内容。

## Plan

1. 核对 Pi 通知渲染与现有 widget hyperlink 能力边界。
2. 在 `/tasks` 格式化边界复用现有 canonical task 链接逻辑。
3. 用非测试命令验证 OSC 8 URL、纯文本回退、20 条边界和差异。

## Result

- T1: 运行时 smoke check 在强制 hyperlink-capable TUI 下确认 /tasks 通知包含指向 canonical Markdown 绝对 file URL 的 OSC 8 标题链接。
- T2: 内置 --check 确认最近 20 条边界、纯文本回退和非 canonical 路径无 OSC 8；RPC smoke check 同样保持纯文本。
- T3: git diff --check 与 Context validate 通过；聚焦 diff 仅复用标题渲染并更新对应 README、Context 与 owning task 记录。
- Review gate: Skipped — 用户未要求 adversarial review、双 Agent Reviewer–Editor 或独立 Reviewer approval。

## Verification

- Passed: node pi/extensions/csl-task-overlay.ts --check、TUI/RPC 运行时 smoke check、Context validate 和 git diff --check 均通过。
