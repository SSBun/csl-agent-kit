# CSL Agent Kit Skills 质量评分报告

**日期：** 2026-08-09
**范围：** 当前仓库实际存在的 35 个 leaf `SKILL.md`，包括 34 个共享 skills 和 1 个项目内部 skill。
**目的：** 说明每个 skill 的关键职责，并评估其作为 Agent 运行契约的实现质量。

## 评分口径

总分 100 分：

| 维度 | 分值 | 判断重点 |
|---|---:|---|
| 路由与边界 | 20 | 何时触发、何时不触发、与相邻 skills 的边界是否明确。 |
| 执行契约完整性 | 25 | 输入、步骤、状态、异常、停止条件和完成条件是否完整。 |
| 配套资产与工具 | 20 | references、templates、scripts、examples 等是否与复杂度匹配。 |
| 确定性验证 | 20 | 是否有 tests、evals、self-test、schema 或其他可观察证据。 |
| 可维护性与自包含性 | 15 | 是否最小、清晰、自包含，并避免脆弱的隐式依赖。 |

复杂 workflow 不会仅因超过 Yao 的 1000-token 初始加载建议预算而扣分；准确性与完整性优先。评分以静态契约和仓库内证据为主，不等同于所有外部依赖和真实宿主路径都已端到端验证。

## 总体结果

- Skills：35
- 平均分：83.5
- 最高分：97（`csl-task`）
- 最低分：57（`beautiful-mermaid`、`grill-with-docs`）

| 分数段 | 解释 | 数量 |
|---|---|---:|
| 90–100 | 优秀：边界、执行和验证体系完整 | 13 |
| 80–89 | 良好：主体可靠，存在局部证据或自包含性缺口 | 12 |
| 70–79 | 可用：主要流程清楚，但完成契约或验证偏弱 | 5 |
| 60–69 | 待加强：能工作，但多个关键边界依赖 Agent 自行推断 | 2 |
| 0–59 | 明显不足：薄 wrapper、运行入口或验证体系存在结构性缺口 | 3 |

## 项目自有 Skills

| Skill | 关键职责摘要 | 分数 | 评分依据 |
|---|---|---:|---|
| `integrate-third-skills`<br>["/Users/caishilin/Desktop/personal/skills/.agents/skills/integrate-third-skills/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/.agents/skills/integrate-third-skills/SKILL.md) | 将选定第三方 skills vendor 到本仓库，并维护可追踪、可更新的上游来源 metadata。 | **94** | 仓库内使用边界、安全限制、来源 metadata、上游比较和路径逃逸测试完善。 |
| `adversarial-review`<br>["/Users/caishilin/Desktop/personal/skills/skills/adversarial-review/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/adversarial-review/SKILL.md) | 在用户明确要求时运行 fail-closed Reviewer–Editor 循环，修复并独立验收交付物。 | **96** | 状态机、角色隔离、finding ledger、停止条件和最终报告契约完整。 |
| `analyze-project`<br>["/Users/caishilin/Desktop/personal/skills/skills/analyze-project/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/SKILL.md) | 基于源码证据生成项目/组件地图，或生成带认知检验的项目学习指南。 | **93** | develop/learn 路由、证据门和原子写入严格；learn 模式特例略密集。 |
| `beautiful-mermaid`<br>["/Users/caishilin/Desktop/personal/skills/skills/beautiful-mermaid/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/beautiful-mermaid/SKILL.md) | 将 Mermaid 图渲染为主题化、适合展示的 SVG 图表。 | **57** | 使用说明直观，但运行路径依赖全局 npm 解析，且缺少渲染回归验证。 |
| `brainstorming`<br>["/Users/caishilin/Desktop/personal/skills/skills/brainstorming/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/brainstorming/SKILL.md) | 在编码前澄清用户意图、需求边界和可选设计方案。 | **74** | 路由和逐步确认流程合理，但缺少明确完成条件和可重复验证资产。 |
| `code-reviewer`<br>["/Users/caishilin/Desktop/personal/skills/skills/code-reviewer/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/code-reviewer/SKILL.md) | 从缺陷、安全、清晰度和可维护性角度审查 PR、MR 或代码 diff。 | **80** | 审查范围、严重级别和引用要求明确；缺少输出合同与回归夹具。 |
| `create-app-icon`<br>["/Users/caishilin/Desktop/personal/skills/skills/create-app-icon/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/create-app-icon/SKILL.md) | 分析产品、平台和品牌，生成 App 图标概念及可用于图像模型的精炼 prompt。 | **68** | 候选概念和 prompt 模板可用，但路由排除项和平台规格验证不足。 |
| `csl-task-auto`<br>["/Users/caishilin/Desktop/personal/skills/skills/csl-tasks/csl-task-auto/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/csl-tasks/csl-task-auto/SKILL.md) | 将多任务 outcome 分解为有序父子任务，串行执行并完成最终集成门禁。 | **95** | 多任务边界、顺序游标、停止条件和集成验证清楚，并有共享 core 测试。 |
| `csl-task-plan`<br>["/Users/caishilin/Desktop/personal/skills/skills/csl-tasks/csl-task-plan/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/csl-tasks/csl-task-plan/SKILL.md) | 研究并形成 implementation-ready canonical task plan，但不修改目标交付物。 | **93** | planning-only 边界、决策交接和 Target 契约清楚；计划专属测试稍少。 |
| `csl-task`<br>["/Users/caishilin/Desktop/personal/skills/skills/csl-tasks/csl-task/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/csl-tasks/csl-task/SKILL.md) | 创建和维护单个 canonical task 的状态、目标、证据、验证与完成生命周期。 | **97** | 所有权、状态迁移、Result、Review、Verification 和唯一完成路径均有确定性保障。 |
| `deep-explore`<br>["/Users/caishilin/Desktop/personal/skills/skills/deep-explore/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/deep-explore/SKILL.md) | 先让用户批准探索指南，再按批准范围完成多维度取证并生成报告。 | **94** | 审批边界、逐项覆盖、报告结构和三类指南完整，整体合同略长。 |
| `deliberate`<br>["/Users/caishilin/Desktop/personal/skills/skills/deliberate/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/deliberate/SKILL.md) | 通过 Synthesizer–Challenger 循环对问题、决策或计划进行多视角综合推演。 | **92** | 角色、状态包、收敛和持久化清楚；部分依赖其他 skill 的 dispatch reference。 |
| `figma-describe`<br>["/Users/caishilin/Desktop/personal/skills/skills/figma-describe/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/figma-describe/SKILL.md) | 解析 Figma URL，并输出 UI 图层和组件结构的文本描述。 | **76** | MCP 降级和输出格式清楚；缺少 URL、截断回退和输出结构测试。 |
| `release`<br>["/Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md) | 将发布请求路由到匹配的 release SOP，检查 readiness 并收集确认项。 | **78** | 路由器边界明确，但匹配失败之外的异常处理和完成证据较少。 |
| `repo-map`<br>["/Users/caishilin/Desktop/personal/skills/skills/repo-map/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/repo-map/SKILL.md) | 为未知仓库或模块生成轻量组件地图和项目术语表，支持后续定向探索。 | **88** | 定向建图、停止条件和四类项目示例清楚；缺少自动结构校验。 |
| `same-page`<br>["/Users/caishilin/Desktop/personal/skills/skills/same-page/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/same-page/SKILL.md) | 以证据、置信度和 ASCII 图重新解释并验证此前的 Assistant 结论。 | **89** | 逐项证据和收尾要求完整，但质量主要依赖 Agent 人工遵循。 |
| `simple-rules`<br>["/Users/caishilin/Desktop/personal/skills/skills/simple-rules/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/simple-rules/SKILL.md) | 管理跨会话无条件注入的轻量全局规则和约定。 | **84** | 与 Triggerify、项目规则的边界清楚；去重、原子写入与格式验证缺少包内测试。 |
| `sop-manager`<br>["/Users/caishilin/Desktop/personal/skills/skills/sop-manager/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/sop-manager/SKILL.md) | 发现、创建、检查和执行项目或用户 SOP、runbook 与 procedure。 | **90** | 路由、覆盖优先级、创建流程、安全确认、模板和内置 SOP 较完整。 |
| `test-triage`<br>["/Users/caishilin/Desktop/personal/skills/skills/test-triage/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/test-triage/SKILL.md) | 复现、定位并修复测试、CI、崩溃、异常、超时和 flaky failure。 | **91** | 从复现到根因、最小修复和回归验证形成完整闭环。 |
| `triggerify`<br>["/Users/caishilin/Desktop/personal/skills/skills/triggerify/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/triggerify/SKILL.md) | 管理跨宿主持久 hook 规则，在生命周期事件中注入 prompt 或执行脚本。 | **93** | 宿主边界、安全失败策略、CLI、runtime、validator、hooks 和测试覆盖强。 |
| `venom-cli`<br>["/Users/caishilin/Desktop/personal/skills/skills/venom-cli/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/venom-cli/SKILL.md) | 通过 venom-cli 管理知乎 iOS 组件依赖、切换、集成、构建和检查。 | **82** | 安装确认、路径解析和 build/make 决策清楚；失败恢复和完成证据较弱。 |
| `workspace-lessons`<br>["/Users/caishilin/Desktop/personal/skills/skills/workspace-workflow/workspace-lessons/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/workspace-workflow/workspace-lessons/SKILL.md) | 查询并应用 workspace correction lessons，并在确认后维护可复用防错规则。 | **96** | 查询门、冲突、Check、写入确认、回滚、legacy parser 和 evals 完整。 |
| `workspace-context`<br>["/Users/caishilin/Desktop/personal/skills/skills/workspace-workflow/workspace-context/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/workspace-workflow/workspace-context/SKILL.md) | 加载 Project Core、检索任务相关 Context Packs，并维护 dispatch-ready 项目模型。 | **96** | Core/Pack schema、Authority、检索、迁移、降级、CLI 和 tests 完整。 |

## Vendored Matt Pocock Skills

| Skill | 关键职责摘要 | 分数 | 评分依据 |
|---|---|---:|---|
| `code-review`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/code-review/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/code-review/SKILL.md) | 从 Standards 与 Spec 两条轴并行审查固定点以来的代码改动。 | **87** | 双轴审查、diff 前置验证和结果聚合完整，但依赖包外 issue/setup 与 Agent 能力。 |
| `domain-modeling`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/domain-modeling/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/domain-modeling/SKILL.md) | 建立项目 ubiquitous language、domain model，并记录相关架构决策。 | **84** | Context/ADR 格式和冲突处理清楚；缺少确定性产物校验。 |
| `grill-me`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/grill-me/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/grill-me/SKILL.md) | 将用户请求转交给 grilling，通过持续追问打磨计划或设计。 | **58** | 极薄委托层，缺少独立的输入、输出、失败和验收契约。 |
| `grill-with-docs`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/grill-with-docs/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/grill-with-docs/SKILL.md) | 在 grilling 过程中同步形成 glossary 和 ADR 等 domain 文档。 | **57** | 组合意图清楚，但未规定两个子流程如何协调、产出和验证。 |
| `grilling`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/grilling/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/grilling/SKILL.md) | 逐题追问并压力测试用户的计划、决定或想法。 | **78** | 逐问、事实先查和决策归属清楚；结束条件缺少可观察证据。 |
| `handoff`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/handoff/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/handoff/SKILL.md) | 将当前对话压缩为可由另一个 Agent 接续的 handoff 文档。 | **74** | 去重、脱敏和参数用途存在，但文件命名、固定结构和写后验证不足。 |
| `improve-codebase-architecture`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/improve-codebase-architecture/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/improve-codebase-architecture/SKILL.md) | 扫描架构深化机会，生成 HTML 报告，并对用户选择的机会继续 grilling。 | **82** | 分阶段合同和 HTML 模板完整；存在包外依赖且没有 HTML 产物校验。 |
| `research`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/research/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/research/SKILL.md) | 使用高可信一手来源调查问题，并将带引用的结果写成仓库内 Markdown。 | **67** | 来源与引用原则合理；范围、文件命名、失败处理和完成证据不足。 |
| `resolving-merge-conflicts`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/resolving-merge-conflicts/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/resolving-merge-conflicts/SKILL.md) | 调查并解决进行中的 Git merge/rebase 冲突，然后恢复原流程。 | **81** | 从状态调查到继续 rebase 较完整，但无法安全判断时的停止边界不足。 |
| `tdd`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/tdd/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/tdd/SKILL.md) | 按 red–green–refactor 方式测试先行地实现功能或修复缺陷。 | **85** | 测试 seam、纵切和反模式完整；未强制保存每轮 red/green 证据。 |
| `teach`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/teach/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/teach/SKILL.md) | 在当前 workspace 中构建并执行长期、结构化的概念或技能教学。 | **84** | 教学格式丰富且较自洽，但范围大、模板和自动校验不足。 |
| `writing-great-skills`<br>["/Users/caishilin/Desktop/personal/skills/skills/mattpocock/writing-great-skills/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/mattpocock/writing-great-skills/SKILL.md) | 提供编写和编辑高质量 Agent skills 的术语、原则和信息组织参考。 | **89** | 术语和信息层级高度自洽；作为编辑参考缺少可执行审计工具。 |

## 优先改进顺序

1. **`beautiful-mermaid`：** 建立可复现的运行入口，并增加一个最小 Mermaid → SVG 回归测试。
2. **`grill-me` 与 `grill-with-docs`：** 删除无独立价值的 wrapper，或补齐组合流程、失败行为和验收契约。
3. **`research`：** 补充目标文件命名、引用可追溯性检查、失败处理和完成证据。
4. **`create-app-icon`：** 增加平台规格 checklist、路由排除项和最终 prompt 完整性检查。
5. **`brainstorming` 与 `handoff`：** 增加可观察的结束条件和最小写后验证。

## 结论

CSL Agent Kit 的核心 workflow skills 已形成明显强于普通 prompt collection 的契约体系，尤其是 CSL Tasks、Workspace Context、Workspace Lessons、Adversarial Review 和深度分析流程。当前主要薄弱点集中在两类：一类是缺少确定性验证的单用途工具，另一类是只负责转交其他 skill、却没有独立协调契约的薄 wrapper。后续优化应优先修复最低分项，而不是继续扩展高分 workflow 的功能范围。
