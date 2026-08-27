# 添加 Pi Task Target 确认界面

Status: Completed (2026-08-20 16:24)
Kind: Task

## Target
- [x] T1: 在交互式 Pi session 中，Agent 能展示包含当前 Task Target 的确认界面，并由用户通过一次确认操作批准后继续同一任务流程。
- [x] T2: 用户取消时 Agent 不继续实质工作；无 UI 模式保持文本确认回退，不破坏现有 task、task-plan 与 task-queue 门禁。
- [x] T3: Pi 扩展、任务 workflow 契约和相关文档或验证入口保持一致，并通过非测试类静态与结构校验。

## Plan

1. 在现有 Pi task overlay 扩展中新增 Task Target 确认工具，复用当前 session 的 task focus，并明确批准、取消和无 UI 返回值。
2. 让 task、task-plan、task-queue 及默认 dispatcher 在工具可用时优先使用确认界面，否则保留文本确认门。
3. 同步相关回归断言与 Context，运行 TypeScript、skill package、结构和格式校验；不运行测试套件。

## Result

- T1: pi/extensions/csl-task-overlay.ts 注册 sequential task_target_confirm；已聚焦 canonical task 时调用 ctx.ui.confirm 展示目标，confirmed 结果允许同一 Agent 流程继续。
- T2: 工具对 cancelled 返回停止指令，对无 UI 返回 unavailable 与准确 **Task Target:** 文本回退，并拒绝未聚焦或不存在的 task；三个 task workflow 均只在 confirmed 后继续。
- T3: README、Super Agent dispatcher、三个 task skills、Pi/Triggerify/task contract 断言和两个 Context Packs 已同步；Node 语法、git diff、task/context、local quality gate syntax/lint/governance 校验通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: git diff --check 与 Node TypeScript/JavaScript 语法检查通过；task/context 校验有效；三个 skill 仅有允许的 local quality gate initial-load budget 警告。按用户规则未运行测试套件。
