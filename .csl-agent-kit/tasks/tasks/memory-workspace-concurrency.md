# 工作区独立并行与最多两次处理

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-05 17:05) |
| Artifacts | [Artifacts](../artifacts/memory-workspace-concurrency/) |
| Kind | Task |

## Target
- [x] T1: 不限制跨工作区并行，同工作区串行
- [x] T2: 每批最多两次尝试，耗尽标记并继续后续记录，界面及文档同步

## Scope

用户要求："remove this limitation, and every records should be processed twice at most then mark it and process other records"。取消跨workspace最多2个并行的限制；同workspace维持串行。两次指首次加一次重试，包含中断及历史attempts，成功不重复处理。耗尽记录保留标记、错误和已有effects，不能手动重置上限。

## Execution Log

实现取消active.size上限，按workspace独立调度；失败/中断可自动进入剩余一次尝试，执行前及重启协调均检查累计上限；exhausted跳过且保留部分提交入口。显式retry也不能绕过上限。周期失败耗尽后按候选末尾和既有24小时冷却继续，不伪造成功游标。Dashboard及Pi异常计数包含新状态，CLI与Memory契约同步。

隔离运行实际daemon/queue/store，使用替代模型执行器，不调用真实模型：最多6个workspace同时执行，同workspace重叠0；永久失败2次后exhausted，下一记录已执行；瞬时失败第二次成功；历史达到2次的failed/queued均0新调用；中断/崩溃遗留各再执行1次后累计2；部分真实committed审计保留且重试读到effects；手动重试拒绝；reconcile不重置耗尽。周期耗尽后立即新增0，24小时后从a推进b，成功checkpoint仍null。观察脚本与输出位于本任务artifacts。

源码均为此前已存在的未跟踪文件，不能将整份文件视为本次新建。审查范围为并发、重试上限、耗尽调度/展示和对应说明；库浏览等其他功能不属于本次改动。实际后台激活留待独立审查后执行，不把隔离结果当成生产部署。JS语法检查通过，skill-quality无failure但3361token预算warning；没有执行测试套件或新模型实验。

## Task Summary

Memory后台取消跨工作区并发上限，并将每事件处理限制为累计两次；队列耗尽标记不会阻塞下一条输入，周期复查保留冷却与进度。Dashboard、Pi状态计数、CLI和Memory文档同步新语义。

## Self Assessment

| 维度 | 等级 | 证据与限制 |
| --- | --- | --- |
| 简洁性 | A | 复用attempts与workspace锁，新增单个终态，不引入队列框架或配置 |
| 稳定性 | A | 实际隔离daemon覆盖6工作区并发、两次上限、重启、部分写入及周期冷却；条件写入与锁不变 | 模型执行器为替身，未跑测试套件；实际激活以最终Verification为准 |
| 完整性 | A | 两项Target有隔离证据；UI/CLI/文档同步，旧attempts不重置 | Pi进程需重启加载状态计数修改；耗尽原文保留供查看，不计为成功提交 |

## Result

- T1: 隔离实际daemon观察maxActive=6，同workspace重叠0；模型执行器替身，不调用模型。
- T2: 永久失败仅2次后exhausted且following执行；瞬时失败第二次成功；旧已2次记录无新调用；中断累计2；effects及真实部分提交保留；周期24h后推进下一候选，不冒充成功。见artifacts/observe.cjs与observation.json；生产激活尚待审查后执行。
- Review gate: Passed — fresh复查TR-1/TR-2均resolved，无新发现；审查后check-evidence通过
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 首轮文档矛盾修复，复核两项发现和当前实现
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-workspace-concurrency/evidence/8b3ec968ee96a2b678a43a7126496814778b3dd7b276a29eeaa6cf0db12fd94a.json#8b3ec968ee96a2b678a43a7126496814778b3dd7b276a29eeaa6cf0db12fd94a
- Evidence: 原隔离观察仍适用，代码未变；TR-1文档两处修正，首轮check-evidence通过
- Task fingerprint: a0a2dbcc64becd243229e9f07a12e090e24b0af8115fb3f5cc6c2a253a27e6a3
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-workspace-concurrency/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-workspace-concurrency/evidence/2f248512ce3a25d597c05bf74a8b881bf9079a4e31fd0386f00e033a51bf1425.json#2f248512ce3a25d597c05bf74a8b881bf9079a4e31fd0386f00e033a51bf1425 | findings | f7f981bca53abb871e560d23795a3d45a1b61c77403985dfb20490f169416306 |
| 02 | [Round 02](../artifacts/memory-workspace-concurrency/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-workspace-concurrency/evidence/8b3ec968ee96a2b678a43a7126496814778b3dd7b276a29eeaa6cf0db12fd94a.json#8b3ec968ee96a2b678a43a7126496814778b3dd7b276a29eeaa6cf0db12fd94a | no blocking findings | 9b9995778cc37892c017b49af099123f481aef8dfb554dc51dd5abfe63d154b9 |

## Verification

- Passed: 13文件快照与两份独立报告核验通过，TR-1/TR-2已解决；实际后台通过ifIdle重启为PID11109，启动后原失败的两个workspace并行处理，running2/queued25、无schedulerError及maintenanceErrors、运行中attempts>2为0，生产记录见artifacts/memory-workspace-concurrency/production.json。隔离实际daemon已验证6并行/同workspace重叠0、累计两次、耗尽后续推进和部分提交保留；Self Assessment仍适用。Pi需重启加载计数更新；未跑套件/全量TS检查，skill-quality无failure但3361tokenwarning。
