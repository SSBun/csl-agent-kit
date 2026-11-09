# 删除用户指定的失效记忆积压批次

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 16:37) |
| Artifacts | [Artifacts](../artifacts/memory-discard-invalid-backlog/) |
| Kind | Task |

## Target
- [x] T1: 删除当前项目已确认的失败及等待输入，保留记忆和提交审计，恢复后台并核对结果

## Task Summary

按用户明确删除授权，空闲停止后台后删除当前项目54批失效输入及job文件；没有将丢弃标为成功提交，没有修改源码。保留记忆及审计，恢复服务。

## Self Assessment

| 维度 | 等级 | 证据与限制 |
| --- | --- | --- |
| 简洁性 | A | 直接限定ID删除临时队列，不增加清理框架 |
| 稳定性 | A | 停止后台、逐条锁和状态/hash校验；719个记忆及审计文件hash不变 |
| 完整性 | A | 1失败与53等待全部删除，释放150603字节；服务恢复，新周期可正常启动；未运行测试套件 |

## Result

- T1: 删除54批（失败1、等待53），150603字节；719个记忆和审计文件hash未变，删除后队列0，后台恢复后新周期正常启动
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 用户明确授权的限定临时队列清理，无源码修改
- Snapshot: artifacts/memory-discard-invalid-backlog/result.json，删除ID与计数记录
- Evidence: 停止后台及逐条状态/hash校验后删除，保留数据hash比较0变化
- Result clarity: 仅当前项目failed/queued快照
- Bounded impact: 限定54批输入及job
- Low risk: 用户明确放弃这些输入，已有提交全部保留
- Sufficient verification: 719个保护文件逐个hash核对及服务状态读取
- Task fingerprint: b80432fa88eedac8999367cd7bc6a164cc2ef2b78704bdd110d416b3b1c33eb4

## Verification

- Passed: 指定54批已删除；服务running=true，无schedulerError；新活动周期不属于已删除积压；未运行测试套件
