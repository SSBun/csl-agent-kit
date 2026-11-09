# 编写 Memory 系统详细设计

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-02 16:45) |
| Artifacts | [Artifacts](../artifacts/write-memory-system-design/) |
| Kind | Task |

## Target
- [x] T1: 交付中文详细设计，完整映射既有16项需求与已确认的模型、作用域和授权决策
- [x] T2: 设计具体说明数据格式、检索与条件写入、队列和SDK会话、审批审计、故障恢复与迁移切换
- [x] T3: 明确区分已实现、已观察验证、待实现与待验证，不修改实现、真实记忆或激活状态
- [x] T4: 创建用户级与项目级分层记忆系统 Topic，登记详细设计文档并可导航到相关设计与实现任务

## Scope

只整理原会话已讨论的 Memory 设计、建立 Topic 和相关导航。不修改 Memory 实现、真实记忆、服务设置、激活状态或旧资料，不将实现任务标记为完成。保留其他工作区改动。

## Plan

1. 对照原会话详细设计、实现任务的16项要求及现有接口说明，形成有明确规范与历史证据边界的文档。
2. 建立 Topic，将详细设计登记为规范性资源；本设计任务采用维护关联，实现任务仅作为历史来源引用，保留其内容及状态。
3. 核对需求覆盖、链接、资源摘要与任务关联，记录自评和实际验证后完成本设计任务。

## Execution Log

### 001 — 恢复设计任务并确认 Topic 落盘范围

从会话 01a18bf0-3124-7458-ad67-c983d3a600b2 恢复用户最后请求：创建 Memory Topic，将已展示的详细设计落盘。原会话只输出聊天设计，最后因工具不可用未创建 Topic。当前会话已恢复工具并聚焦本任务；用户对完整 Task Target 回复 yes。范围仅为 Topic 与设计文档，不继续产品实施或激活。

### 002 — 核对来源与既有改动

实现记录仍有16项未验收 Target，记录了48条项目记忆导入及未完成的消费者切换、UI验证与独立审查；使用说明开头仍写迁移未执行，与该后续日志冲突。文档将明确历史观察的来源和时点，不把旧说明或聊天陈述当作本轮运行验证。工作区存在多项既有代码和数据改动，本任务不触碰。

### 003 — 设计与 Topic 落盘并核对边界

创建 layered-memory-system Topic，详细设计作为 normative 资源登记 SHA256；本任务以 maintenance 关联并采用最终规格，实现任务仅增加 history 导航，未更改其内容或状态。设计共14章，MEM-01—MEM-16逐一映射原T1—T16；使用现有expected对象形式替换聊天中的概念请求示例，保留索引完整版本/hash接口缺口，避免把generation视为完整文件hash。

结构核查确认14章、16条需求映射、7个已有资料/项目目录链接、合法JSON示例及规范摘要一致。另1个用户根链接仅表示默认设计位置；初次通用链接检查将尚不存在的用户目录当成资料链接失败，随后明确该位置的设计语义并按正确边界重检通过，没有创建用户数据目录。Topic check、task check、全局validate通过。git diff --check无诊断；未跟踪设计文件的no-index检查无空白诊断但返回差异码1，另以逐行检查确认无尾随空白。

1226个非本任务文件的路径/内容聚合SHA256保持e940e2d9483392df93d14704aeeddf851a60d280537209e87b7bcef95ae7929c，覆盖既有实现、项目数据、Context、Lessons及实施任务；未启动服务、调用模型、运行测试或修改用户数据。Context元数据索引和相关Packs已核对：本轮只新增共享要求及设计载体，无新的运行事实需要回写Context；validate有效，保留原有3处未索引章节警告，不批量清理历史。

## Task Summary

**Memory Topic 与设计资料**：["/Users/caishilin/Desktop/personal/skills/tasks/topics"](file:///Users/caishilin/Desktop/personal/skills/tasks/topics) 新建分层Memory主题、规范性详细设计及CLI生成的版本快照，建立主题导航、设计任务维护关联与原实施任务历史引用。文档覆盖16项要求、架构协议、授权、恢复及迁移验收，并隔离历史观察与目标规范；未修改运行实现或真实记忆。

## Self Assessment

| Dimension | Score | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 改动最小性 | 5 | 仅Topic、设计、所属任务及对应导航；1226个范围外文件聚合摘要不变。 | 不涵盖外部进程并发变更或未纳入仓库枚举的文件；本任务没有执行外部写操作。 |
| 稳定性 | 4 | 原16项要求逐项对照，模型/授权边界保留，历史证据单列；Topic关联与摘要有效。 | 设计中的运行可靠性尚待实施验证，不能由文字及结构检查证明。 |
| 目标对齐 | 5 | 14章完整覆盖既有设计，16行需求映射，Topic资源和两项任务导航均存在。 | 原实施任务仍未完成，本任务未扩大为继续实施。 |
| 验证充分性 | 4 | 原记录/会话与相关接口源码对照，章节、JSON、链接、摘要、关联、任务验证和保留范围检查通过。 | 未运行单元测试、模型、浏览器或故障注入；本次是文档转换与导航验证。 |
| 完成信心 | 4 | 本设计任务全部验收条件有证据，最终规格已采用，现有实现未变。 | 仅对设计落盘负责；历史运行结果未重验，复杂实现与授权机制须后续任务验收。 |

## Topic

- Schema: task-topic/v1
- Reference: self:layered-memory-system
- Repository: local
- Revision: c2f27f9b2d418a039bac118c14e86aba2ac966a6934ac0e0cdf617c6fe32fa4f
- Applies: 设计文档与Topic维护；不实施Memory运行行为
- Mode: maintenance

## Topic Adoption

- Evidence: 采用最终设计及规范资源摘要；仅明确默认用户目录为设计位置而非存在性证明，未改变16项需求、授权边界或任何运行行为。

## Result

- T1: 详细设计第14章MEM-01至MEM-16与原实施T1至T16逐项对照；结构核查16行一一映射。user/project、四类元数据、Pi默认模型优先级及明确用户审批均保留。
- T2: 详细设计14章覆盖存储版本、索引检索、CAS、多文件恢复、提案、队列、SDK会话、后台、Pi接入、Web与迁移切换；JSON示例解析通过，expected对象和索引generation已对照Store源码及CLI说明。
- T3: 文档定位及第13章隔离历史观察和目标规范，明确未重验运行链路；1226个范围外文件聚合SHA256=e940e2d9483392df93d14704aeeddf851a60d280537209e87b7bcef95ae7929c与写入前一致，实施任务与项目数据未变。未运行测试、模型、迁移或激活。
- T4: Topic layered-memory-system为Active；详细设计normative SHA256=5cbbd5f899123e049fb3a3d574da8bc5373361143c3efe9501e579a867e9d28f匹配；本任务maintenance绑定已采用当前revision，原实施任务为history。topic check无错误或referenceWarnings，7个资料/项目链接有效，默认用户根单独标明仅设计位置。
- Review gate: Skipped — 当前R1四项依据成立：既有设计转写与导航，无产品行为变更，需求/来源对照及结构和保留范围核查充分；没有显式或既有独立审查义务。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 将既有会话设计和已确认需求转换为可导航的Topic文档，无产品逻辑或运行授权变更。
- Snapshot: snapshot:tasks/artifacts/write-memory-system-design/evidence/1651c6158634ea4527cdf36b3c222387885cde3ddf493fbb8df57639deeda645.json#1651c6158634ea4527cdf36b3c222387885cde3ddf493fbb8df57639deeda645
- Evidence: Result T1-T4、Execution Log 003及Self Assessment；文档、Topic和来源由9文件快照固定。
- Result clarity: 用户确认只创建Topic并保存原详细设计；16项要求逐项映射，无待用户决策阻止文档落盘。
- Bounded impact: 仅文档与导航，直接消费者为Topic和Task CLI；check、规范摘要和maintenance绑定均有效，原实施任务仅history引用。
- Low risk: 未改变安全、授权、数据和运行行为；原设计中的高风险实施边界仅原样记载，未发布或激活。文档变更可恢复。
- Sufficient verification: 14章/16项映射、7个资料链接、JSON与空白检查、Topic关系及hash、任务validate通过；1226个非本任务文件摘要保持不变。运行测试不属于文档验收且未执行。
- Task fingerprint: 8468d7836cf12be53d801f1b990f413f3fdd583a815f10b15ae045e970932094

## Verification

- Passed: 终检check-evidence确认9文件快照无漂移；topic check关系与最终revision一致；重验设计SHA256、14章/16行映射、资料链接、JSON、空白及1226文件保留摘要均通过。自评5/4/5/4/4与最终证据一致；没有执行运行测试。
