# 合并低风险 Task 收尾操作

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-22 20:46) |
| Artifacts | [Artifacts](../artifacts/task-finalize-low-risk/) |
| Kind | Task |
| Parent | optimize-task-workflow |

## Plan

1. 复用现有证据、分级与完成校验，提供 R0/R1 一次收尾入口，失败不留下部分完成状态。
2. 更新 CLI 指引，以已有 Result 引用减少重复叙述；保留逐目标证据、四项 R1 依据和最终核对。
3. 执行相关回归、Skill 质量检查及当前内容独立审查，再完成本项。

## Target
- [x] T1: R0/R1 可通过合并入口完成收尾，缺项或失败不留下部分完成状态。
- [x] T2: 保留风险依据、逐目标证据、最终验证和既有 Required 义务，减少重复证据叙述。

## Task Summary

**Task 共享核心与 CLI**：[csl-tasks](../../skills/meta/csl-tasks/) 为 R0/R1 增加 `finalize`，复用既有状态与证据校验，在一次锁定写入中更新任务和索引；已有独立审查义务继续走正常流程。

**Task 规范与说明**：[task](../../skills/meta/task/) 与 [README](../../README.md) 说明一次收尾的证据输入、最终检查和失败边界，允许引用 Result 以减少重复叙述。

**回归定义**：[tests](../../tests/) 覆盖合法收尾、缺失证据、审查义务、快照漂移与异常回滚，保持旧入口兼容。

## Result

- T1: R0/R1一次提交及原有门槛回归通过；TR-1修复为预备新内容和原件副本、索引先于终态任务提交，持续ENOSPC、恢复失败保留副本、提交后清理及锁清理故障均有回归。组合136/136通过，见 ../artifacts/task-finalize-low-risk/evidence/regression-fixed.log；两个已核实的基线文档断言明确排除。
- T2: 复用原分级与终态校验；逐目标证据、R1四项依据和最终观察缺失均拒绝，Required不能跳过。文档允许引用Result并明确非跨文件崩溃事务。task质量0失败、9278估算tokens长度warning；diff check通过。
- Review gate: Passed — round-02 TR-1 resolved，无新阻塞项，独立复跑66/66；采用本次用户接受的隔离例外
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 新增终态入口并重构跨文件写入与恢复，需要独立检查故障边界
- Snapshot: snapshot:tasks/artifacts/task-finalize-low-risk/evidence/57ba7aecfad1c4686a21905dc5b36383031a8fd60a0fb75c8fdd840d5881855d.json#57ba7aecfad1c4686a21905dc5b36383031a8fd60a0fb75c8fdd840d5881855d
- Evidence: Result T1/T2；regression-fixed.log 136/136；Skill质量0失败与长度warning，静态检查通过
- Task fingerprint: 12ef8ad22fd1613ba7c770d33056a46bb03b5ec7c665dba5e558925e9b6619e1
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/task-finalize-low-risk/reviews/round-01.md) | snapshot:tasks/artifacts/task-finalize-low-risk/evidence/1d30fbacddbffba1a033bc8eee45bf25ea8031431462d5bd1bb3f77a332ef18b.json#1d30fbacddbffba1a033bc8eee45bf25ea8031431462d5bd1bb3f77a332ef18b | findings | 833b199fcb649dd64bffb99d70355df6fc2217e0bcc38a79a7388d94f19b72ed |
| 02 | [Round 02](../artifacts/task-finalize-low-risk/reviews/round-02.md) | snapshot:tasks/artifacts/task-finalize-low-risk/evidence/57ba7aecfad1c4686a21905dc5b36383031a8fd60a0fb75c8fdd840d5881855d.json#57ba7aecfad1c4686a21905dc5b36383031a8fd60a0fb75c8fdd840d5881855d | no blocking findings | 1e9c42ff7708de64f61721047a74dbc1735505e4d4ff0944de2ee4df6cd49d7e |

## Verification

- Passed: 最终快照仍匹配、2份报告摘要与对应关系通过，组合136/136和独立66/66，T1/T2满足；恢复被系统拒绝时保留副本，不承诺崩溃事务。
