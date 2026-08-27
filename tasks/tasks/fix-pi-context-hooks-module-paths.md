# 修复 Pi Context Hooks 模块路径

Status: Completed (2026-08-20 10:58)
Kind: Task

## Target
- [x] T1: Pi Context Hooks 扩展能够从当前分类目录加载 SOP Manager 与 Triggerify 运行时模块，不再出现 MODULE_NOT_FOUND。
- [x] T2: Pi Context Hooks 聚焦测试与非历史旧路径扫描均通过。

## Plan

1. 复现扩展加载失败并核对当前技能目录边界。
2. 修正扩展中仍指向重组前目录的运行时模块路径。
3. 运行聚焦测试、旧路径扫描与任务记录校验。

## Result

- T1: 直接导入 pi/extensions/csl-context-hooks.ts 成功；6/6 Pi Context Hooks 测试通过，确认 SOP Manager 与 Triggerify 当前目录模块均可加载。
- T2: 30/30 Triggerify 测试通过；旧运行时路径扫描、JS 语法检查、Context 校验与 git diff --check 均通过。
- Review gate: Skipped — 用户未要求独立 adversarial review；已执行聚焦回归与扩展测试。

## Verification

- Passed: 扩展导入成功，Pi Context Hooks 6/6、Triggerify 30/30 通过；local quality gate 仅报告允许的既有 1000-token 初始加载预算超限。
