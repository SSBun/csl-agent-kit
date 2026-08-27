# 支持输入 1 确认 Task Target

Status: Completed (2026-08-26 15:20)
Kind: Task

## Scope

- 包含：保持通用确认提示，并将 `1`、`y` 作为不展示给用户的默认确认快捷输入。
- 不包含：改变 `TASK_GO`、目标修订或重新对齐语义。

## Target
- [x] T1: 用户输入 1 时可确认当前展示的 Task Target，且现有明确肯定回复仍保持有效。
- [x] T2: Task Target 提示不显式提及快捷输入，用户输入 1 或 y 时仍可确认，且现有明确肯定回复与 TASK_GO 行为保持有效。

## Plan

1. 恢复通用确认提示，并定义不展示的快捷确认输入。
2. 更新回归断言，覆盖通用提示、`1`、`y` 与现有确认路径。
3. 运行工作流和 skill 包验证，并同步受影响的 Context。

## Result

- T1: 共享协议现提示回复 `1`，并将去除首尾空白后精确为 `1` 定义为确认；其他明确肯定回复保持有效，且契约测试已覆盖。
- T2: 共享协议已恢复通用确认提示且不展示快捷键；去除首尾空白后精确为 `1` 或不区分大小写为 `y` 时隐式确认，其他明确肯定回复与 TASK_GO 保持有效。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 隐式确认契约断言、task core 9/9、Context validate/self-test、OpenAI quick_validate、语法与 diff 检查均通过；local quality gate 仅报告允许的 1000-token 初始加载预算超限。
