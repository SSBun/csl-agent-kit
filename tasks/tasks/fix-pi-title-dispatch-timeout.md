# 修复 Pi 标题派发超时

Status: Completed (2026-08-26 17:34)
Kind: Task
Parent: fix-local-hook-config-issues

## Scope

- 修复手动 `/title` 的派发失败反馈。
- 保留自动刷新失败时静默跳过、派发成功后的结果监听及现有标题生成行为。

## Target
- [x] T1: /title 在 Agent Hooks 派发失败时立即显示原始可操作错误，且不启动结果超时监听。
- [x] T2: Agent Hooks 派发成功时，手动与自动标题刷新行为保持不变。

## Plan

1. 定位手动与自动刷新共享派发路径中的错误吞没点。
2. 让手动刷新在派发失败时立即反馈，同时保持其他调用方现状。
3. 增加回归覆盖并执行允许的静态与行为检查。

## Result

- T1: 手动 /title 派发回调现同步显示捕获到的原始异常，并以 dispatchFailed 阻止 watchTitleResult；已加入迁移冲突回归用例验证不启动计时器。
- T2: 自动调用未传错误回调，仍由 triggerPrompts 捕获异常并返回空 prompts；手动成功路径仍调用原有 watchTitleResult。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: TypeScript strip-types 语法检查、测试文件语法检查、Pi 扩展导入 smoke check、Context 校验及 git diff --check 均通过；按当前请求约束未运行单元测试。
