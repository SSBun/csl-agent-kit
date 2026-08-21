# 强化 workspace-lessons 防复发闭环

Status: Completed (2026-08-20 19:52)
Kind: Task

## Scope

- 包含：强化 `workspace-lessons` 的防复发定义、字段质量、准入边界、完成门禁与发现元数据，并补充聚焦契约断言。
- 排除：改变 `Trigger / Rule / Check` schema、修改查询脚本行为、批量迁移现有 Lessons 或写入 `tasks/lessons.md`。

## Target
- [x] T1: `workspace-lessons` 将 Lesson 明确定义为仍需 Agent 判断的最后一公里防复发控制，并约束 Trigger 可预先识别、Rule 阻断失败机制、Check 证明控制覆盖相关范围。
- [x] T2: 机械控制优先、Check 阻塞完成和复发后更新或替换的闭环写入主契约；既有 schema、查询、确认写入与 legacy 行为保持不变，适用的 skill package 校验通过。

## Decisions

- 保留现有 `Trigger / Rule / Check` schema、只读查询脚本、写入确认和 legacy 兼容；本次只强化语义契约与机械验证入口。
- 更强的机械控制通过其 owning task 使用或提出，Lesson 只记录仍需 Agent 判断的剩余行为。

## Plan

1. 对齐主 Skill 与发现元数据中的防复发语义和载体边界。
2. 用最小聚焦断言固定新增契约，不修改 parser 或数据格式。
3. 运行非测试型结构、Yao、resource-boundary 与差异校验并记录限制。

## Result

- T1: 主 SKILL 与两份 Agent metadata 已将 Lesson 收敛为防复发控制：新增 Admission Gate，收紧 Trigger/Rule/Check 语义，并以聚焦契约断言固定关键要求。
- T2: 机械控制优先、Check 阻塞完成和复发后修订闭环已写入主契约；parser、query cases 与 routing cases 无差异，Yao 除允许的 2667/1000 initial-load token 超限外通过。
- Review gate: Skipped — 用户未要求 adversarial review、双 Agent Reviewer–Editor 循环或独立 Reviewer 批准。

## Verification

- Passed: OpenAI quick validation、Yao syntax/lint/governance、13/13 routing、Node syntax、Lessons/Context validation 与 git diff --check 通过；仅保留允许的 Yao token-budget 超限，按用户规则未运行单元测试。
