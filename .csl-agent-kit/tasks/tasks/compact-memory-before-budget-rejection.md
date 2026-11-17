# 记忆超限时先压缩再更新

| Field | Value |
| --- | --- |
| Status | Blocked (2026-11-12 17:07) |
| Artifacts | [Artifacts](../artifacts/compact-memory-before-budget-rejection/) |
| Kind | Task |

## Target
- [x] T1: 普通记忆更新触及5000词上限时先压缩合并内容并继续更新，不因长度直接拒绝更新
- [x] T2: 压缩保留有效知识、必要条件与未变case日期；temp继续免词数预算

## Scope

调整普通记忆超词数后的保存与压缩流程，承接已确认的普通文件5000词、项目temp免词数预算要求。不批量改写真实记忆、不重试历史失败队列、不运行单元或项目测试，不创建worktree。底层读写、格式、日期、hash与文件数量校验保留。

## Plan

1. 完整保存超阈值更新并返回待压缩状态。
2. Memory Agent在当前批次继续压缩；无法保真收敛时保留更新并报告待处理。
3. 完成非测试验证和独立只读审查；后台空闲时安全重启，无法重启则明确记录加载限制。

## Execution Log

### 001 — 超阈值保存与压缩路径

用户确认超限先压缩且不得拒绝更新的目标。5000词改为压缩触发阈值：writer先完整保存并返回compaction.required；Memory Agent检查两级可写范围，超阈值时自动追加本批压缩提示并重新检查。尚未收敛时将待压缩列表写入Agent运行状态并保留成功更新，不再仅因正文词数使批次失败。CLI直接写入返回提示，由调用者继续压缩或报告待处理。项目temp排除压缩，消息日期、UTC窗口、hash、格式与底层安全限制不变。没有新模型、服务或队列。

### 002 — 允许的验证与加载状态

隔离临时库实测两级5503词更新均完整保存、返回compaction.required及待压缩列表；旧hash写入仍返回CONFLICT；以当前hash写回精炼内容后compaction为null、待压缩列表清空、索引published。相同长度项目temp不触发压缩，过期temp仍返回TEMP_DATE_RANGE。核对后删除临时库，未写真实记忆。该检查只验证存储与状态路径，不证明模型语义压缩效果。

store、agent、CLI及已有样例文件的node --check通过，git diff --check通过；agent-memory技能质量0失败，1792估算token篇幅警告保留。未运行单元测试、项目测试或真实模型端到端批次。安全重启返回SERVICE_BUSY，运行中的后台暂未加载新代码；不强停活动任务。

## Task Summary

**Memory运行时**（[bin/memory](../../../bin/memory/)）：词数超阈值完整保存并返回压缩提示，共享待压缩计算供两级范围使用；后台自动追加压缩处理并保留未收敛状态，CLI帮助同步。

**Memory技能与说明**（[agent-memory](../../../skills/meta/agent-memory/)及[Memory文档](../../../docs/memory.md)）：统一5000词压缩阈值、内容保真、失败保留及temp豁免规则，更新配套记录提示。

**已有校验样例**（[tests](../../../tests/)）：超阈值样例从拒绝写入改为完整保存并返回压缩提示；未运行测试。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 复用既有writer、同一模型会话、批次期限和后续维护；仅新增共享压缩状态及一次继续处理。 | 无新增服务、依赖或队列。 |
| 稳定性 | A | 隔离读写核对超阈值不丢内容、最新hash写回、冲突拒绝、temp豁免与日期边界；静态语法检查通过。 | 未运行测试或真实模型批次；语义保真依赖Agent遵循明确提示，无法收敛时保留完整更新。 |
| 完整性 | A | 源码和提示覆盖完整保存、自动压缩、未收敛待处理与temp排除。 | 后台重启被活动批次阻止，尚未证明运行中服务已加载；本次不清理历史失败。 |

## Result

- T1: 当前源码将5000词改为压缩阈值；隔离两级5503词完整保存并返回compaction.required，agent同批追加压缩并保留未收敛状态。真实模型批次未执行，运行中后台尚待安全重启。
- T2: 压缩提示明确保留有效知识、条件和未变日期；隔离读写核对temp不触发压缩、过期日期仍拒绝、旧hash仍CONFLICT。语义保真仅有规则约束，未以真实模型端到端核验。
- Review gate: Required — Task left In Review; rerun the applicable review after revisions
## Block

- Reason: 源码独立审查无阻断finding，报告已归档，check-evidence机械重核快照及报告通过；但再次安全重启仍返回SERVICE_BUSY，运行中的后台未加载新行为。本任务不能宣称部署完成。
- Unblock when: 后台active为空，安全重启成功并确认新实例运行；重新核对源码快照、既有审查及最终证据。真实模型保真仍为未执行的验证，不得冒称已验证。

## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Stale
- Reason: 涉及持久写入与模型后续压缩、部分成功和未收敛语义，需要独立核对数据保留及调用边界。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/compact-memory-before-budget-rejection/evidence/bb89b15d51b3d407c8a4e57d1fb5d1ee1876b0c8666f61071dc8af2c760440e3.json#bb89b15d51b3d407c8a4e57d1fb5d1ee1876b0c8666f61071dc8af2c760440e3
- Evidence: 本任务Execution Log 002及T1/T2 Result；隔离写入与静态检查，未运行真实模型或测试，后台SERVICE_BUSY。
- Task fingerprint: 0abce2ca3940da661480c1a898fbabdf0d3056bda913a0d31520cae3132b238a
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/compact-memory-before-budget-rejection/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/compact-memory-before-budget-rejection/evidence/bb89b15d51b3d407c8a4e57d1fb5d1ee1876b0c8666f61071dc8af2c760440e3.json#bb89b15d51b3d407c8a4e57d1fb5d1ee1876b0c8666f61071dc8af2c760440e3 | no blocking findings | 07afe6e484054ec05e26c66f3d66f908dddadc842c744d981dca9d508aa6f242 |
