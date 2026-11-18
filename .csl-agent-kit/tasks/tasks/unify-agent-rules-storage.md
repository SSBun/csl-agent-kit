# 统一 Agent Rules 存储目录

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-18 11:52) |
| Artifacts | [Artifacts](../artifacts/unify-agent-rules-storage/) |
| Kind | Task |

## Target
- [x] T1: 项目级 Agent Rules 的写入与加载统一使用 .csl-agent-kit，停止向 .agents 写入规则。
- [x] T2: 相关指引与实际行为一致，保留已有规则内容；其他组件的存储迁移不在本次范围。
- [x] T3: 盘点所有可发现的本机项目，将旧规则迁入各自 .csl-agent-kit/agent-rules.md；新旧并存时保留不同内容，验证后清理旧文件，报告覆盖限制。

## Plan

1. 核对注入器、宿主安装入口及项目规则清单。
2. 修正路径并核对加载顺序，保留迁移恢复材料后迁移全部发现的项目规则。
3. 验证内容、权限、旧路径清理与技能质量，记录结果和限制。

## Execution Log

### 001 — 目标及根因

用户确认统一规则路径，并明确将范围扩展到所有本机项目的规则迁移。指引已使用新路径，但 read-agent-rules.js 仍加载 .agents/agent-rules.md，形成运行时与指引不一致。初步发现 MyTwitter、iTermate、native-short-reader 三个旧规则文件；全主目录 find 超时，改为排除依赖、缓存和系统目录的分段盘点，覆盖尚待补齐。

### 002 — 迁移与验证

修正源码注入器和两个本机插件缓存中的旧项目路径，并修正 Claude 缓存的规则指引。项目规则仅改变存储位置，不修改正文；新路径均不存在，无合并冲突。迁移前保存三份规则和三份缓存修改的恢复副本，清单位于 [迁移目录](../../migrations/agent-rules-storage-20261118/manifest.json)。目标通过暂存文件加原子 no-replace 硬链接发布；校验摘要与权限后，经实际 Hook 加载验证再清理旧源。

仓库、Codex 缓存和 Claude 缓存分别调用 pi、codex、claude-code 的实际规则 Hook，三个项目共27个结果的内容及合并顺序匹配，见 [加载观察](../artifacts/unify-agent-rules-storage/evidence/loading-observations.json)。清理后再查目标、恢复副本摘要及权限，并重新读取实际项目规则；主目录盘点范围内无旧规则文件，见 [最终核对](../artifacts/unify-agent-rules-storage/evidence/final-verification.json)。未跟随目录符号链接，排除系统库、依赖、缓存、历史及恢复目录；照片图库权限拒绝，不能宣称这些位置没有项目。已挂载卷的顶层为应用安装镜像。

使用 skill-quality 检查全部五个修改的技能包，零失败；三份 agent-hooks 均有既有篇幅警告，规则包通过。源码、两个相关测试文件的语法及 git diff --check 核对；只更新现有测试夹具，不运行单元或项目测试。未直接验证真实新会话的模型输入或模型遵循；插件缓存将来被宿主重装时可能被替换，应随源码版本更新。

## Task Summary

**Agent Rules**：[技能组件](../../../skills/meta/agent-rules/)明确只写入与读取统一目录，不回退旧规则路径。三个本机项目的规则迁入各自统一目录，原文与权限保持一致。

**Agent Hooks**：[注入组件](../../../skills/meta/agent-hooks/)修正项目规则加载位置，本机 Codex 与 Claude 插件缓存同步该修正。

**验证与迁移材料**：[现有测试](../../../tests/)更新路径夹具并保留旧路径应忽略的断言；[迁移材料](../../migrations/agent-rules-storage-20261118/)保存清单及恢复副本。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 在现有读取器修正一个路径，未增加回退、双写或新运行时机制；迁移为任务专用操作。 | 无已知实质冗余。 |
| 稳定性 | A | 27个实际 Hook 结果匹配；三项目正文、权限及恢复副本一致；清理后再次加载与摘要核对通过。 | 未运行单元/项目测试或真实新 Agent 会话；缓存重装可能替换本机修正。 |
| 完整性 | A | 已完成扫描范围内全部3份旧项目规则迁移，源码和已发现缓存读写指引一致；最终核对无旧规则。 | 排除系统库、依赖、缓存和历史目录，不跟随目录符号链接，照片图库不可访问；不声称绝对覆盖所有存储位置。 |

## Result

- T1: 注入器及两份已发现的安装缓存统一读取 .csl-agent-kit/agent-rules.md；规则指引仅写新路径，无旧路径回退。
- T2: 27份实际Hook结果内容及三层顺序匹配，三项目正文、权限及恢复副本摘要一致，未迁移其他组件。
- T3: 主目录有边界盘点发现的3份旧规则全部迁移并清理，清理后读取通过且扫描无旧规则；扫描排除项与照片图库权限限制见final-verification.json。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 单一路径修正及三份无冲突规则的逐字节迁移，恢复材料完整，影响有界且可恢复。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/unify-agent-rules-storage/evidence/0f478857bfd176a28ff1aacd24ff7e1d7284a0313d0d0a744f1255af738223f8.json#0f478857bfd176a28ff1aacd24ff7e1d7284a0313d0d0a744f1255af738223f8
- Evidence: Execution Log 002、Self Assessment、manifest.json、loading-observations.json和final-verification.json。
- Result clarity: 用户已确认目录统一和所有可发现项目规则迁移；3个目标均不存在，无实质冲突。
- Bounded impact: 仅一个规则读取路径及对应指引与现有夹具；两份已发现宿主缓存作同样机械修正，三项目无内容修改。
- Low risk: 全部源有同权限恢复副本，原子no-replace发布且先加载验证后清旧文件；未改权限、信任或规则含义，可按清单恢复。
- Sufficient verification: 27份实际Hook输出匹配；清理后正文和权限校验及重新加载；五包质量检查无失败，语法和diff检查通过；未运行单元/项目测试。
- Task fingerprint: e8ab15993b48fbb1c72da9df795b9ae8135c96ed08e47e6998891eccbd540fcf

## Verification

- Passed: 最终扫描范围内旧文件为零，3份新文件和恢复副本摘要权限一致，3份缓存修正摘要匹配；受管理8文件快照锁定。覆盖限制和旧会话未实测已记录。
