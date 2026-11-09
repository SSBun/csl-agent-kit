# 精简 Task 常驻契约重复细节

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-22 21:05) |
| Artifacts | [Artifacts](../artifacts/task-contract-dedup/) |
| Kind | Task |
| Parent | optimize-task-workflow |

## Target
- [x] T1: 常驻 Contract 移除详细规则重复，保留稳定触发、顺序、停止边界和权威协议入口。
- [x] T2: Task、Queue、Plan 与审查流程完整一致，现有确认策略和质量保障保持不变。

## Plan

1. 精简常驻Contract中重复的格式与计数细节，保留稳定路由、执行和停止边界。
2. 对照Task/Review/Target/Grading权威章节核对每条移除细节仍有归属，更新契约检查。
3. 检查集成、质量与当前范围独立审查，保持并行Context改动。

## Task Summary

**常驻契约**：[agent-hooks](../../skills/meta/agent-hooks/) 将确认模式与Review记录细节交还权威协议，保留稳定路由与停止门槛；独立分析和后续执行规划的路由更明确。

**契约核对**：[tests](../../tests/) 将详细ledger/分级断言指向Task与Grading，保持注入路由和稳定gate检查；[README](../../README.md) 说明权威分工。

## Result

- T1: 常驻Contract从17274缩至15577bytes（-9.8%）；重复模式/ledger/assessment细节映射见evidence/authority-map.md，各权威原文仍在；并行Context区块逐字节不变。
- T2: Task/Queue/Plan及Review权威与稳定gate对照通过，组合回归191/191（evidence/integration.log）。排除已核实旧maintenance断言及整组Hook预算失败案例；后者当前/HEAD隔离均通过，日志保留。agent-hooks质量0失败1621tokens长度warning，diff check通过；不声称真实Agent行为回放或全仓全绿。
- Review gate: Passed — round-01独立复核无阻塞项，9项检查与前后快照匹配；按本次用户接受的隔离例外执行
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 常驻跨宿主路由及门槛规则去重，需独立核对语义保留与权威分工
- Snapshot: snapshot:tasks/artifacts/task-contract-dedup/evidence/d9170575cdb53e7cab2a4aa6318eb3edd60f4a4da5f328c3aeb93a21287de292.json#d9170575cdb53e7cab2a4aa6318eb3edd60f4a4da5f328c3aeb93a21287de292
- Evidence: Result T1/T2及authority-map、integration日志、已披露检查例外
- Task fingerprint: 7989d207a986ba39648fd37adeb501357615a21ca3a3051a2ba538ce1fe6d9a1

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/task-contract-dedup/reviews/round-01.md) | snapshot:tasks/artifacts/task-contract-dedup/evidence/d9170575cdb53e7cab2a4aa6318eb3edd60f4a4da5f328c3aeb93a21287de292.json#d9170575cdb53e7cab2a4aa6318eb3edd60f4a4da5f328c3aeb93a21287de292 | no blocking findings | a111f94f101625dafce0559edf23baaa506dd5169ab94cf714765c18bfc93ced |

## Verification

- Passed: 最终源和18文件快照仍匹配，报告digest与归属通过，独立核对9/9及组合191/191支持T1/T2；保留两项已披露检查例外、长度warning与非真实行为回放边界。
