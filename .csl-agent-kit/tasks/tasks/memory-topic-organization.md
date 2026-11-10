# 设计按长期知识领域组织记忆主题

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-09 16:31) |
| Artifacts | [Artifacts](../artifacts/memory-topic-organization/) |
| Kind | Plan |

## Target
- [x] T1: 当前skills项目的有效记忆按跨任务宽主题重组，最多20片且每片最多1000词，所有正文仍为带日期case列表。
- [x] T2: 重组保留独有有效知识、条件、例外、来源和有效关联；重复与过程性描述得到提炼，原文保留于审计，用户级记忆不变。
- [x] T3: 展示实际最终主题、内容示例及前后变化，核对索引、写入审计与关联完整性。

## Scope

执行当前skills工作区项目记忆重组，不修改用户级记忆、其他项目、产品代码或Skill规范；保留既有元数据模式和历史审计。

## Decisions

用户明确要求按照上一轮宽主题约定重构当前skills项目记忆并查看最终效果。主题按本工作区长期关注对象与问题组织；以case为增量单位，跨任务复用，不按任务建片，不预设适用于所有工作区的分类。现有类型字段保持兼容，不在本次移除。摘要说明收录范围，正文保留日期、条件与来源；资料细节留原权威资料和审计，不复制报告。

## Plan

1. 核对当前全部项目正文、关联和写入保护，形成宽主题草稿及旧case到新case的归属清单。
2. 核对独有条件保留、正文预算及跨片引用，按先保存并回读、修正入链、再删除被替代片的顺序条件提交。
3. 检查最终项目与用户快照、审计和索引，独立只读审查重组内容，修复确认的问题后展示最终效果。

## Execution Log

### 001 — 现有库的组织问题

读取全部19个项目片和6个用户片正文。项目152项、每片166–979词；用户10项、每片24–89词。项目并非全是短小任务记录，但主题边界交叉且夹有过程材料：Memory召回片含Repo Map要求；Skill整合片含Hook适配/校验说明，并重复本机参考仓信息；索引对照片含单次实验的请求数、token、耗时和统计修正。Pi标题、任务面板、设置分片粒度偏细，运行片又混合后台恢复与界面状态。此前case格式转换未改变这种分组。

两级generation复查稳定，无.pending.json；本轮只用记忆作为组织样本，不把其中运行时或历史实验陈述视为新近核实的外部事实。拟讨论的推荐方向是按项目长期领域容纳跨任务case，先提炼可复用知识再归属；具体分桶与例外仍待用户讨论。

### 002 — 用户授权执行与当前基线

用户要求按已讨论约定重构当前skills项目记忆并查看最终效果；范围限定项目库，保留用户库、代码和全局技能规范。后台已先行更新宽主题要求与实验摘要，故本轮重新捕获19片、153个case、9270词的实际基线，而未沿用上轮152项。完整原始正文及sources保存于[基线](../artifacts/memory-topic-organization/evidence/baseline.json)。

### 003 — 实际宽主题重组

按case重分为项目定位与约定、记忆组织与检索、运行与数据管理、任务与协作、交互与使用体验、宿主与自动化、技能与流程生态、验证与变更保护。新片使用宽主题ID；旧19片经先保存回读、修正入链、再退役的流程成为墓碑，原文审计保留。30次条件提交均committed，过程最多20个有效片。153个旧case全部记录映射，其中4项Hook范围/路径/关键词/Authority转为溯源与发现信息；候选品牌名等未定过程信息保留原始审计，不进入长期正文。

### 004 — 主Agent核对

最终8片87项6042词，每片408–987词；日期采用原case日期，合并取参与项最新日期，不统一改成重组当天。用户级全部文件hash不变，索引published、pending=false、missingReferences=0。核对每个原片的首个本次审计beforeHash与基线一致，全部事务before/after及实际正文可回读。完整来源通过新片sources中的基线位置及旧hash追溯；原sources不截断或销毁。旧迁移/SOP related关系转换为运行/技能双向关系，原审查职责到Task关联在同一新主题内承接。检查不证明模型未来维护或所有语义等价，进入独立只读审查；不运行测试套件。

## Task Summary

**项目记忆库**（[目录](../../memory/)）将19个功能与任务相关片按case重组为8个跨任务宽主题，提炼重复和记录性材料，更新索引及关联，旧片保留为可追溯墓碑。

**重组证据**（[目录](../artifacts/memory-topic-organization/evidence/)）保存原始内容和来源、逐case映射、条件提交事务及最终结构核对结果，支持语义审查与恢复。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 仅通过既有条件写入/审计重组项目数据；8个宽主题替代19片，不增加运行时或分类系统。 | 无已知额外抽象；主题仍可随实际内容演化。 |
| 稳定性 | A | 原文审计、153项映射、用户hash不变、30次提交和最终关联检查均通过；先存后退役且未超20片。 | 结构映射不独立证明语义等价，仍需只读审查；无真实后续维护评测。 |
| 完整性 | A | 当前项目全部有效片已重组，来源和日期可追溯，可展示真实主题与case。 | 全局技能规范与其他工作区不属本次范围；交互主题987词，后续增长须按预算提炼或合理拆分。 |

## Result

- T1: 实际有效片19→8，153项→87项，9270词→6042词；正文408–987词，全部带日期扁平列表；索引published且无pending。见evidence/self-check.json及实际entries。
- T2: 153个旧case均映射至新case或元数据归档；原文/sources保留基线及本次审计before；用户级文件hash全相等，所有新片关联目标有效。来源和case日期已逐项自查；语义保留另交独立审查。
- T3: 8个新文件及index已实际生成；30次committed事务逐项核对，峰值20片，旧19片均为墓碑且可追溯；最终主题、词数及正文示例由实际文件交付，不是仅提案。
- Review gate: Passed — fresh只读Reviewer ddb3e1e0 完整对照19片基线与8片现文，未发现问题，反馈已登记round-01；主Agent补验63文件冻结快照和用户全部hash均无漂移。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 重组涉及全部项目记忆的语义提炼和来源迁移，需要独立检查条件、例外与归属是否丢失或改变。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-topic-organization/evidence/77c94a41184f2817d63dc6a2c79d5ee20caca986c306b95d3ca1ec7a2e36984b.json#77c94a41184f2817d63dc6a2c79d5ee20caca986c306b95d3ca1ec7a2e36984b
- Evidence: T1-T3与evidence/self-check.json；完整原始内容baseline.json、映射proposal.json和实际entries可访问。
- Task fingerprint: 642c3ace869c25536d0c1b61329426b777810b512c766bc13b7b4445749a1b6d

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-topic-organization/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-topic-organization/evidence/77c94a41184f2817d63dc6a2c79d5ee20caca986c306b95d3ca1ec7a2e36984b.json#77c94a41184f2817d63dc6a2c79d5ee20caca986c306b95d3ca1ec7a2e36984b | no blocking findings | 5ab731ade908ad65be0499f86fd09af194aa5b96977b2d4c3f1ed28ee985dfe8 |

## Verification

- Passed: 终态前check-evidence验证冻结快照及报告；重读8片hash/日期结构、索引published/count8/pending=false/missingReferences0及用户全部hash，全部一致。每片408–987词，原文审计及逐case映射可追溯；未运行测试或真实后续模型维护。
