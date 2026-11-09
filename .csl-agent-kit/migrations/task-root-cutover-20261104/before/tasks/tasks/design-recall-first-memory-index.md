# 探索召回优先的 Memory 索引设计

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 15:32) |
| Artifacts | [Artifacts](../artifacts/design-recall-first-memory-index/) |
| Kind | Task |

## Scope

用户明确要求根据已讨论方向交付新版架构设计文档，继续当前设计任务。本轮创建独立设计文档并核对当前代码与试跑证据，不修改运行代码、现有Topic规范或真实记忆，不运行模型实验/项目测试。文档区分已确定原则、拟议实现和待验证假设；后续实施另行对齐。

## Decisions

- 首要目标是找回当前任务所需的知识及适用条件，读取成本次之；不把加载全部记忆当作召回率的替代指标。
- 用户确认同一份记忆允许多个检索入口，不限于单个目录分支；入口共同指向同一权威正文，不复制知识或制造多份有效版本。用户随后认可检索卡片方向，并要求按薄总览、主题索引和完整卡片库的讨论形成架构文档；具体字段、发布一致性和检索停止协议在文档中作为拟议实现，不冒称已验证。
- 沿用Markdown权威、普通文件工具、动态主题、两级作用域；不加入必需数据库或向量服务。
- 现有试跑只能支持当前模型自主read行为下的成本观察，不能证明困难语义任务的召回质量或分页普遍最优。

## Plan

1. 核对现有store、Memory Agent、Pi bridge、迁移与面板边界，以及先导实验的证据适用范围。
2. 撰写[新版架构文档](../artifacts/design-recall-first-memory-index/specs/2026-11-03-recall-first-memory-architecture.md)，覆盖chip/card/topic数据契约、普通工具检索、一致性/失败、自动维护、迁移与验证。
3. 核对用户约束、路径引用、架构内部一致性及与现状的差异；完成R2独立只读文档审查及必要修正。
4. 交付文档并保留后续实现授权边界，不据设计宣称召回性能已改善。

## Execution Log

### 001 — 进入召回优先设计讨论

用户要求brainstorming新索引，以记忆检索率为主。已加载brainstorming并核对当前源码：索引仍按字符预算切页，没有基于内容的路由层。准备讨论的初步推荐是完整可搜索目录加精简主题导航、允许多个发现入口；这是待讨论方案而非已接受产品变更。任何静态索引或关键词搜索均不能保证任意语义查询零遗漏。

### 002 — 架构文档交付与主Agent核对

用户明确要求根据前述讨论优化设计并形成新架构文档；本轮按文档交付执行，不改代码、正式Topic或真实记忆。已核对当前store严格schema校验、分页和事务恢复，migration version=2与Pi首页注入路径，并对照现有Memory说明与先导试跑结果。

文档含14章，区分当前实现、已讨论原则、拟议schema与待验证假设。芯片沿用entry身份，检索元数据作为正文同版本的权威输入，卡片/主题/总览确定性派生；未分类及待增强条目不失去发现入口。覆盖普通工具双路径发现、正文条件与替代关系核对、覆盖不足时降级、代际发布与恢复、版本迁移及召回验收。显式说明任意语义零遗漏不可保证，不能把完整卡片数量或先导全成功当性能证明。

主Agent逐Target核对：T1对应第3—5章；T2对应第6—13章；T3对应第1、7、9—11章及状态声明。结构检查通过14个连续一级章节、6个实际本地来源链接均存在、代码围栏配对；git diff --check通过。只运行文档结构检查，不运行项目测试或模型实验。复杂架构提案采用R2独立只读审查，具体实现仍需后续授权与验证。

### 003 — TR-1关系新鲜度修正

独立Reviewer发现仅新增替代者时旧chip正文hash不变，原稿只对缺失结论强制复查generation，已命中的旧结论仍可能被采信。主Agent按该合法时序核对，确认问题成立。已在第5.2节区分正文身份与派生关系代际，第6.4/7.3节将采信前pending/generation复查扩展到所有结论，刷新反向替代和必要依赖；pending下无法核实替代状态时不得采信。第12.1节增加旧正文不变的替代时序及连续变化降级案例。显式保留无锁最终观察后仍可写入的边界，不宣称与外部动作原子一致。

已保存round-01原始反馈；当前TR-1有实质文档修正，仍等待fresh复核。只改设计稿及所属任务，无代码/数据变化。原结构检查和三维自评范围仍适用，具体稳定性依据更新为上述双身份复查；没有执行拟议时序测试。

## Task Summary

新增任务所属架构设计稿，说明召回优先的chip/card/topic职责、普通文件读取协议、派生一致性、失败降级、自动维护、升级回退和分层验收；保持现有运行时、数据与正式Topic规范不变。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用entry身份、CAS/审计及代际机制；从同一元数据生成发现入口，无数据库或新读取服务。 | 多入口元数据和全量重建增加成本，需实施后测量。 |
| 稳定性 | A | 明确单一权威、正文与关系双身份、采信前代际复查、pending、跨级非原子、旧writer及恢复边界；TR-1修正补充了旧正文不变时的替代关系核对。 | 仅设计，迁移/恢复/召回未由本轮执行验证。 |
| 完整性 | A | 覆盖T1—T3所需架构、读取、维护、兼容迁移与验收，显式标注假设。 | 不授予实施或新实验权限；阈值与规模在实验前冻结。 |

## Target
- [x] T1: 交付基于当前Memory系统的召回优先架构文档，明确chip、检索卡片、薄总览、主题索引、全库覆盖及多入口机制。
- [x] T2: 文档明确普通工具检索/扩展/停止协议、条件和纠正关系、写入一致性、失效降级、迁移方案及召回优先验收，区分现状、拟议与已验证证据。
- [x] T3: 保留Markdown权威、两级作用域、动态主题、自动维护、审计恢复与条件写入，不引入必需数据库或向量服务；仅交付文档，不修改产品或真实数据、不运行新实验。

## Result

- T1: 设计稿第3—5章定义chip沿用entry、卡片完整覆盖、薄总览、动态主题及多入口；第2章对照现状与试跑证据。
- T3: 文档保留Markdown、两级作用域、动态主题、自动维护及条件写入；本轮只新增设计稿和更新所属任务，未改运行代码、正式Topic或真实记忆，未运行实验/项目测试。
- T2: 第6—13章覆盖检索/停止/一致性/迁移/验收。TR-1修正扩展所有候选采信前pending/generation核对，区分正文hash和反向关系身份，加入仅新增替代者的时序验收；保留无锁检查后的并发边界。14章及6来源链接检查通过；未运行拟议行为测试。
- Review gate: Passed — fresh独立Reviewer e68f9d01确认TR-1在设计层面resolved且无新发现；主Agent重核快照verified，正文hash为aa9c2fe3af6060d8a075b006a154c6600e6f0c2137904b97acc9875033cef663。仅文档审查，不宣称运行效果已验证。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 架构提案TR-1修正后需fresh独立复核正文与派生关系双身份及全文一致性。
- Snapshot: snapshot:tasks/artifacts/design-recall-first-memory-index/evidence/873bae6efa4327ce0a185de26418b27edc1414e93dbcd61347fc8fafb3990d1d.json#873bae6efa4327ce0a185de26418b27edc1414e93dbcd61347fc8fafb3990d1d
- Evidence: Execution Log003、更新T2 Result及Self Assessment；章节/链接/新增时序核对通过。
- Task fingerprint: c61d5a5e1c6d466144ac4f7bbe653ad7e718d2637762e9dcee739bc4f27e2e96
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/design-recall-first-memory-index/reviews/round-01.md) | snapshot:tasks/artifacts/design-recall-first-memory-index/evidence/ecf059f049e5edfb04e97ffd0f551867bfc6b9c62f8a79883d5b69501b23d7d8.json#ecf059f049e5edfb04e97ffd0f551867bfc6b9c62f8a79883d5b69501b23d7d8 | findings | c4f4bb4cd2b110abdd564d897a21834a7614813c7f122c781162435279f8d7a3 |
| 02 | [Round 02](../artifacts/design-recall-first-memory-index/reviews/round-02.md) | snapshot:tasks/artifacts/design-recall-first-memory-index/evidence/873bae6efa4327ce0a185de26418b27edc1414e93dbcd61347fc8fafb3990d1d.json#873bae6efa4327ce0a185de26418b27edc1414e93dbcd61347fc8fafb3990d1d | no blocking findings | e5a633fd505b163fe1b1cccd89e0ae8bd479b467ff8dd3b36acd40b806a7f075 |

## Verification

- Passed: 最终check-evidence确认设计稿快照与两份审查报告verified，git diff --check通过；TR-1经独立复审resolved。T1-T3文档覆盖与Self Assessment仍适用，未修改运行代码/真实记忆或执行测试实验，运行效果仍待后续实施验证。
