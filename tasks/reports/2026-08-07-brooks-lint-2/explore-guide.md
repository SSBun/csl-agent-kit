# brooks-lint 修订版深度探索指南

- 对象：https://github.com/hyhmrright/brooks-lint
- 类型：软件项目
- 批准时间：2026-08-07 19:12 +08:00
- 调查快照：默认分支 commit `814174cd5b340bc0d8b0161b6d8288980428a44d`
- 报告语言：中文；代码、命令、符号和既有领域词保留原文

## 探索原则

- 先给出简洁准确的定义，再解释对象做什么、如何工作和如何实现。
- 复用首次探索已取得的仓库与官方资料；只有解释过程暴露真实证据缺口时才补充取证。
- 不评价项目好坏，不提出整改方案，不执行 review、audit 或开发。
- 限制、未知和来源冲突只用于说明认知边界，不组织成项目缺陷清单。
- 保留 `Summary`、`Key facts`、`How it works / Structure`、`Context`、`Open questions / Limitations` 和 `Sources` 六个指定章节。

## 范围与非目标

- 当前默认分支的源码、配置、文档、测试、评测数据和发布记录。
- 必要的相关工具官方资料，只用于解释领域位置。
- 不安装或运行 brooks-lint，不修改目标仓库，不执行安全审计。
- 不独立核验无法直接取得的完整书籍原文。

## 探索项

- [x] **`P01` 简洁准确的定义** — [报告](report.md#summary)
  - 问题：brooks-lint 究竟是什么，又不是什么？
  - 证据：README、package、Skill manifests、核心入口。
  - 完成：用一段话准确说明其产品形态、运行主体和基本边界。
  - 记录：确认它是以 Markdown Skills 为核心、由宿主 Agent 执行的 AI 代码审查知识与流程包；Node/shell 代码提供安装和 CI 外壳，它不是自行解析源码的传统静态分析器。

- [x] **`P02` 目的、用户与使用场景** — [报告](report.md#summary)
  - 问题：它解决什么需求，面向谁，在什么情况下使用？
  - 证据：项目介绍、getting-started、各 mode 定义。
  - 完成：说明核心用途、目标用户和典型使用场景。
  - 记录：其目标是为使用 coding Agent 的开发者提供固定、可引用的工程设计 rubric；典型场景包括 PR review、架构理解、技术债、测试质量、综合健康视图和经确认的 sweep。

- [x] **`P03` 核心概念与心智模型** — [报告](report.md#key-facts)
  - 问题：十二本书、R/T risks、findings、severity、Health Score 如何关联？
  - 证据：`source-coverage`、共享 risk 定义和报告契约。
  - 完成：形成读者理解后续机制所需的最小概念模型。
  - 记录：十二本书提供原则来源，原则被整理为 R1–R6 生产风险和 T1–T6 测试风险；mode 选择检查范围，模型据此生成带 severity 的 finding，finding 再按 strictness 进入 Health Score。

- [x] **`P04` 功能与模式** — [报告](report.md#key-facts)
  - 问题：六种 mode 分别做什么，其输入、输出和适用场景是什么？
  - 证据：六个 `SKILL.md` 与 mode guides。
  - 完成：给出清晰的功能地图，而不是质量评价。
  - 记录：`review`、`audit`、`debt`、`test`、`health`、`sweep` 分别面向变更、架构、债务、测试、综合视图和修复循环；前五个以解释性报告为主，`sweep` 需要宿主工具与用户确认才能改代码。

- [x] **`P05` 产品形态与运行环境** — [报告](report.md#structure)
  - 问题：它为什么主要由 Markdown Skills、宿主 Agent 和辅助脚本组成？
  - 证据：仓库结构、plugin manifests、hooks、scripts。
  - 完成：解释它与独立 CLI、静态分析器和普通 prompt 的区别。
  - 记录：Markdown 承载可移植的诊断知识和流程，宿主 Agent 提供仓库读取与推理能力，脚本补足安装、CI、解析和门禁；这种分层让同一 rubric 能在多个 Agent 中使用。

- [x] **`P06` 总体架构** — [报告](report.md#structure)
  - 问题：共享规则、mode skills、commands、hooks、scripts、evals 和宿主之间如何协作？
  - 证据：目录、入口文件和引用关系。
  - 完成：提供组件职责表和小型 ASCII 架构图。
  - 记录：`_shared` 定义知识与报告契约，mode Skills 选择流程，commands/manifests/hooks 负责发现，宿主执行交互分析，scripts 提供 CI 与确定性后处理，evals/tests 保护结构和解析行为。

- [x] **`P07` 交互式工作流程** — [报告](report.md#structure)
  - 问题：用户发起请求后，宿主如何发现 Skill、读取代码、诊断并生成报告？
  - 证据：Skill 路由、共享框架、mode guides。
  - 完成：逐步追踪一条完整交互路径。
  - 记录：宿主先按意图发现 mode Skill，再读取 `_shared` 与专用 guide，使用自身工具确定 scope 和读取代码，按 risk rubric 形成 finding、分数与 Markdown；history、triage 或 sweep 是随后条件步骤。

- [x] **`P08` CI 工作流程** — [报告](report.md#structure)
  - 问题：GitHub Action 如何获得 diff、组装 prompt、调用模型并生成 JSON、SARIF 和 gate？
  - 证据：action、`assemble-prompt`、`ci-review`、parser、gate。
  - 完成：逐步追踪一条完整 CI 路径。
  - 记录：Action 安装 SDK 并调用 `ci-review.mjs`；脚本选择 git diff、拼装共享规则与 mode guide、单次请求 Anthropic，再由 parser/SARIF/gate 把 Markdown 转成机器输出、PR comment 和质量门禁。

- [x] **`P09` 实现结构源码走读** — [报告](report.md#structure)
  - 问题：关键文件和模块分别实现哪一部分行为？
  - 证据：核心 scripts、shared guides、mode guides 和 manifests。
  - 完成：建立“行为 → 实现文件 → 数据/控制流”的映射。
  - 记录：风险语义位于 `_shared/*.md`，mode 行为位于各 `SKILL.md` 和 guide；`assemble-prompt` 组合指令，`ci-review` 负责模型调用，`report-parse`、SARIF、gate、history 分别处理输出、平台格式、门禁与趋势。

- [x] **`P10` 配置、评分与输出契约** — [报告](report.md#structure)
  - 问题：配置如何影响诊断，findings 如何形成，分数如何计算和解析？
  - 证据：`common.md`、health guide、parser、history、gate。
  - 完成：区分模型判断、确定性计算和最终输出格式。
  - 记录：`.brooks-lint.yaml` 可控制 risk、severity、ignore、focus 和 strictness；模型判断 finding 与 severity，扣分公式和 health 权重定义在 guides 中，parser 和 gate 再从 Markdown 提取结构化结果。

- [x] **`P11` 端到端示例** — [报告](report.md#structure)
  - 问题：一次具体 review 从输入到报告会经历什么？
  - 证据：真实 mode 流程、eval 样本与输出模板。
  - 完成：提供一条不虚构运行结果的说明性流程示例。
  - 记录：以 PR review 为例，输入 diff 后依次经过 scope detection、R/T rubric 检查、Iron Law finding、strictness 扣分和 Markdown 输出；CI 再可将同一报告解析为 JSON/SARIF 并执行 gate。

- [x] **`P12` 安装、分发与集成** — [报告](report.md#context)
  - 问题：不同 Agent 和 GitHub Actions 如何安装、发现和调用它？
  - 证据：installer、platform docs、manifests、action example。
  - 完成：说明接入方式、平台角色和能力差异。
  - 记录：Claude、Codex、Gemini 使用专用 manifest/extension，其他 Agent 依赖标准 Skill 目录与通用 installer；GitHub Action 是独立的 Anthropic API 集成，能力不同于有仓库工具的交互宿主。

- [x] **`P13` 领域位置与相邻工具** — [报告](report.md#context)
  - 问题：它与 linter、CodeQL、AI code review 等工具分别承担什么角色？
  - 证据：brooks-lint 实现及相关工具官方资料。
  - 完成：解释它在工具链中的位置，不做优劣排名。
  - 记录：ESLint 与 CodeQL 以 parser/database/query 执行可编码规则，Copilot review 与 Code Quality 使用 AI 或混合分析；brooks-lint 位于 Agent rubric 层，重点解释跨文件设计与测试风险并补充传统工具。

- [x] **`P14` 证据边界与报告综合** — [报告](report.md#limitations)
  - 问题：现有来源能够确认什么，哪些仍属于项目声明、推断、未知或来源冲突？
  - 证据：前述全部来源。
  - 完成：六个指定章节均存在；定义、用途、工作原理与实现先于认知边界；重要事实均有引用；覆盖表完整。
  - 记录：源码、配置、tests 和 scripts 足以解释项目结构与机制；真实模型准确率、跨宿主稳定性和部分书籍归因仍超出仓库证据，README 的 benchmark 与确定性表述保留为项目声明或来源冲突。
