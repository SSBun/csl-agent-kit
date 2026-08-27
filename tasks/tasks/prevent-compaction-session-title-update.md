# 阻止压缩任务修改会话标题

Status: Completed (2026-08-27 11:49)
Kind: Task

## Scope

- 排除 Pi 原生压缩完成后注入的内部继续提示，不让它刷新终端标签标题。
- 保留真实用户任务的自动标题刷新、手动 `/title` 和其他 `prompt-submit` Hook 行为。

## Target
- [x] T1: 会话压缩任务不会触发会话标题变更。
- [x] T2: 真正有价值的会话任务仍可按既有机制更新会话标题。

## Plan

1. 在标题生成入口确定性识别原生压缩继续提示并短路。
2. 为实际坏提示与普通任务提示增加最小回归覆盖。
3. 执行允许的静态、隔离行为与一致性检查。

## Result

- T1: 隔离行为检查确认原生提示 Compaction completed. Continue. 在标题 worker 启动前返回 unchanged，且未创建或写入任何标题文件。
- T2: 隔离行为检查确认普通任务提示 Improve compaction behavior 仍可进入既有标题流程，操作型、元标签与 24 码点边界保持有效。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 脚本与回归文件语法、Hook 规则、隔离行为、Context 校验及相关 diff check 通过；Yao syntax/lint/governance 通过，仅有允许的既存初始加载预算 1463 > 1000；按用户规则未运行单元测试。
