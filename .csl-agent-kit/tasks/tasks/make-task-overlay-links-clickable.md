# 让任务面板链接可点击

Status: Completed (2026-08-11 11:27)
Kind: Task

## Target
- [x] T1: Pi TUI 任务面板中的每个任务标题都链接到该索引项对应的绝对任务 Markdown 文件。
- [x] T2: 任务状态、进度、排序、刷新及非 TUI 输出行为保持不变。
- [x] T3: 聚焦自动化检查覆盖链接生成、特殊路径编码和既有任务面板行为。

## Scope

- 仅让 TUI 面板中的任务标题可点击；不增加鼠标事件系统、文件打开子进程或新依赖。
- 终端不支持 OSC 8 时继续显示原有纯文本；RPC 与 headless 模式不输出终端控制序列。

## Plan

1. 使用 Pi TUI 原生 OSC 8 helper 和 Node 文件 URL API生成任务链接。
2. 扩展现有聚焦测试，覆盖绝对链接、URL 编码和非 TUI 回退。
3. 运行聚焦测试、TypeScript 语法检查、任务校验和 diff 检查。

## Result

- T1: TUI 在 terminal capability 支持 hyperlink 时，使用 Pi TUI 原生 hyperlink() 与 pathToFileURL() 将 canonical 任务标题链接到绝对 Markdown 文件 URL。
- T2: 既有排序、进度、5 秒原位刷新和 timer 清理测试通过；无 hyperlink 终端保持纯文本，RPC 无 OSC 8，headless 不注册 widget。
- T3: 聚焦测试覆盖带空格 cwd 的 %20 文件 URL、OSC 8 内容、unsupported terminal 与 RPC 回退；Pi 测试 9/9、任务测试 26/26 通过。
- Review gate: Skipped — 用户未要求独立或对抗性审查。

## Verification

- Passed: npm run test:pi、npm run test:tasks、extension self-check、TypeScript/JavaScript syntax、Context validate、task validate 与 git diff --check 全部通过。
