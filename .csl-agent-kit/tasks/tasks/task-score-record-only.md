# 自评评分仅保留在任务文件中

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 11:50) |
| Artifacts | [Artifacts](../artifacts/task-score-record-only) |
| Kind | Task |

## Target
- [x] T1: 用户回复默认不展示自评等级，仅在用户明确要求时展示；任务文件继续记录完整自评、依据与局限
- [x] T2: 重要验证结果、风险和未完成事项继续说明，自评及质量门禁不变

## Scope

只调整评分展示规则，同步 Task、Queue 与注入契约，不改变三维 S/A/B/C 自评机制或质量门禁，不修改历史任务。旧记录的“五维”描述更新为当前自评机制，不恢复旧评分结构。

## Plan

1. 同步三个展示规则来源并补充明确请求评分的行为案例。
2. 检查规则一致性及每个修改包的 Skill Quality，不运行单元测试。

## Execution Log

### 001 — 用户确认展示边界

用户确认默认不在回复中展示评分，评分保留任务文件；重要验证结果、风险和未完成事项继续披露。检索发现 Task、Queue 和注入契约各有强制展示条款，需要一起调整，避免单一入口仍要求输出。已有任务未完成，沿用同一记录。

### 002 — 同步规则与静态检查

Task、Queue 与注入契约均改为默认不展示等级，明确请求时才展示；验证、风险、局限与未完成事项仍须说明。补充明确请求、进展/阻塞、普通完成与Queue的展示案例。检索 skills 未再发现原来的三处强制展示文本。三个修改包的 Skill Quality 均无失败，接受上下文预算警告（Task约13051 tokens、Queue约2934、agent-hooks约1881）及Task长文件警告；此次不以精简上下文为由删除必要协议。JSON解析成功（25案例），git diff --check通过。未运行单元测试或模型行为回放，静态案例不证明真实Agent执行。

## Task Summary

**Task** — ["/Users/caishilin/Desktop/personal/skills/skills/meta/task"](../../../skills/meta/task)：评分默认仅保留任务文件，明确请求才展示，补充对应行为案例。

**Task Queue** — ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-queue"](../../../skills/meta/task-queue)：父子评分统一遵循Task展示策略。

**Agent Hooks 契约** — ["/Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks"](../../../skills/meta/agent-hooks)：同步注入提示的展示要求，保留风险和验证披露。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 只调整三个既有入口的展示条款与对应案例，无新增机制。 | 无已知多余变更。 |
| 稳定性 | A | 自评记录、质量门禁和披露要求不变；三包静态质量检查无失败，旧强制展示文本已消除。 | 未执行模型回放；现有上下文预算警告保留，不能保证所有会话即时遵循新提示。 |
| 完整性 | S | 已覆盖普通回复、完成交付、Queue及明确请求评分的例外；保留验证和风险说明。 | 已加载旧提示的其他会话需重新加载；本次只承诺规则更改，不声称已验证跨会话行为。 |

## Result

- T1: Task、Queue和注入契约均规定默认隐藏自评等级，仅明确请求时展示；完整自评仍保留任务记录。普通完成、明确请求、进展阻塞、Queue的案例已同步。
- T2: 三处条款均继续要求说明重要验证结果、风险、局限及未完成事项；未修改自评算法、生命周期或质量门禁。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 只修改评分展示策略及静态案例，不改变权限、任务门禁或运行时代码
- Snapshot: snapshot:tasks/artifacts/task-score-record-only/evidence/98ec25ea7fb89d0bf28d5fb58297570416d6627ef69ed280bf343bea322468d2.json#98ec25ea7fb89d0bf28d5fb58297570416d6627ef69ed280bf343bea322468d2
- Evidence: 执行日志002；三包质量检查无失败、25案例JSON可解析、三处展示文本核对一致
- Result clarity: 用户明确确认默认隐藏、明确请求才展示且保留自评与披露
- Bounded impact: 限定三个既有提示入口与对应案例，无运行时代码变更
- Low risk: 仅回复展示变化，不取消风险说明、审核或验收，可直接回退条款
- Sufficient verification: 逐条核对三个入口、检索旧强制文本、三个Skill Quality和JSON解析、diff检查；未运行测试或模型回放
- Task fingerprint: 2feed0dbbf7f3f179abba2eacd1a72f5cc21463e8f15f655241949b7a3ff9e8f

## Verification

- Passed: 最终再次核对三个入口及明确请求/进展案例，git diff --check通过，当前快照及自评依据不变；保留上下文预算警告和模型行为未回放限制。
