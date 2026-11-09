# Git 底栏仅显示工作区是否干净

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-05 15:46) |
| Artifacts | [Artifacts](../artifacts/compact-git-clean-status/) |
| Kind | Task |

## Target
- [x] T1: Git底栏去掉文件数量，以绿色✓ git表示干净、黄色● git表示有改动，保留已有刷新和不可用时隐藏行为。

## Execution Log

用户明确要求仅区分工作区干净或有改动。仅修改全局扩展/Users/caishilin/.pi/agent/extensions/git-status-footer.ts的formatStatus，staged、modified、untracked任一非零显示黄色● git，否则绿色✓ git。保留已有读取、轮询与错误处理。未修改仓库文件或索引状态。

node --experimental-strip-types --check通过；源码核对三个改动来源、零值和不可用隐藏分支。未运行测试套件，当前会话需/reload。CLI不支持外部文件snapshot，已保留原文件完整副本于本任务artifacts，原件及副本SHA256均为125905eccad90bbdc17ec01de4aa2f09be03e94df4f11783921e233bae963146。

## Task Summary

**Git底栏**：[/Users/caishilin/.pi/agent/extensions/git-status-footer.ts](/Users/caishilin/.pi/agent/extensions/git-status-footer.ts) 仅显示有色的干净/有改动状态，不显示文件数量。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 单函数缩减为布尔条件与一个格式化返回值。 | 无。 |
| 稳定性 | A | 语法检查通过，原检测及刷新逻辑保持。 | 未运行测试或重载后界面检查。 |
| 完整性 | A | 覆盖已暂存、未暂存、未跟踪三种变化。 | 运行会话需/reload。 |

## Result

- T1: formatStatus只输出绿色✓ git或黄色● git，不含数量，三种改动任一非零均标记有改动。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 单函数纯展示简化。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/compact-git-clean-status/evidence/4d4a94cbf389d6e73a374a7bae58274bec54f62c1fad6710bc7bfff137a1a868.json#4d4a94cbf389d6e73a374a7bae58274bec54f62c1fad6710bc7bfff137a1a868
- Evidence: Execution Log记录语法检查、分支核对及外部原件与副本hash一致。
- Result clarity: 用户明确只需干净或有改动。
- Bounded impact: 仅全局Git底栏格式化，读取与刷新不变。
- Low risk: 只读状态显示，无Git写入操作。
- Sufficient verification: 语法检查通过；手工核对staged/modified/untracked判定；原件与快照副本SHA256一致。
- Task fingerprint: 5a6422a58385c91a507b17a3a5abc198ca9f80cb35c4181c9ee334156597edc3

## Verification

- Passed: 外部原件与副本hash一致，语法通过，数值文案已移除；未运行测试，需/reload生效。
