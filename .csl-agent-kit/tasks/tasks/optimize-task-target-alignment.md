# 优化 Task Target 对齐并移除 TASK_GO

Status: Completed (2026-08-27 12:12)
Kind: Task

## Scope

- 包含共享 Task Target 协议、三个 task-family workflow、默认 Agent 契约、路由评测、Context，以及全局 Pi commit prompt 中旧 marker 生产入口。
- 保留 canonical task 激活、已展示 Target 的隐式 `1`/`y` 确认、discovery realignment、独立安全确认与完成门禁；不保留 marker 兼容路径或 fast mode。

## Target
- [x] T1: 用户已明确授权且候选 Task Target 没有实质差异时，task、task-plan 与 task-queue 无需额外文本确认即可继续；存在歧义或实质差异时仍会澄清或确认。
- [x] T2: TASK_GO 从当前 Task Target 运行时契约、公开描述、验证契约与 Context 中完全移除，且 canonical task、重新对齐、安全边界和完成门禁保持有效。

## Plan

1. 用当前完整用户授权的双向语义等价检查替代默认重复确认，并统一首次对齐、用户修订与 discovery realignment。
2. 同步所有当前生产者、消费者、规则、评测与 Context，删除旧 marker 入口且不留兼容路径。
3. 运行静态、路由、Context、local quality gate、资源边界与差异验证，记录当前结果后完成任务。

## Result

- T1: 共享协议、三个 task-family workflow 与两套默认规则已统一为双向语义等价对齐：等价 Target 直接继续，歧义或实质差异才澄清或确认，用户明确修订与 Agent/discovery 变化分别处理。
- T2: 当前 runtime、公开 skill 描述、Context 与 Pi prompt producer 已移除 TASK_GO 支持；聚焦搜索仅保留 tests/task-files.test.mjs 的三条显式负断言，并保留 canonical task、realignment、独立安全确认及完成门禁。
- Review gate: Skipped — 用户要求 deliberate 综合讨论，但未要求 adversarial-review、Reviewer–Editor 循环或独立 Reviewer 批准。

## Verification

- Passed: JSON 解析、Node 语法、Context validate/show、规则 heading 结构、聚焦 diff check、四组 routing eval（均 precision/recall 1.0）与三个 quick_validate 均通过；local quality gate/资源检查仅报告允许的 1000-token 初始加载预算超限；按当前请求约束未运行项目测试。
