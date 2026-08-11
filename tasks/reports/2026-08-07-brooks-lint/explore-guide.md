# brooks-lint 深度探索指南

- 对象：https://github.com/hyhmrright/brooks-lint
- 类型：软件项目
- 批准时间：2026-08-07 13:13 +08:00
- 调查快照：默认分支 commit `814174cd5b340bc0d8b0161b6d8288980428a44d`
- 报告语言：中文；代码、命令、符号和既有领域词保留原文

## 范围

- 当前默认分支的源码、配置、文档、测试、评测数据和发布记录。
- 必要时查阅相关工具的官方资料，用于说明领域位置和替代方案。
- 不安装或运行 brooks-lint，不修改目标仓库，不执行安全审计。
- 无法直接核验的书籍内容或效果声明标为“未独立验证”。

## 探索项

- [x] **`P01` 项目身份与状态** — [报告](report.md#key-facts)
  - 问题：brooks-lint 是什么、面向谁、当前版本和维护状态如何？
  - 证据：README、`package.json`、LICENSE、CHANGELOG、Git 历史及仓库元数据。
  - 完成：确认定位、版本、许可证、主要语言和调查快照。
  - 记录：README、package 和 changelog 一致标为 `1.4.3`，主体是 Node.js ES modules，MIT 许可；调查 commit 为 `814174c`。GitHub API 因未认证限流，未采用实时 stars/issues 元数据。

- [x] **`P02` 问题与价值主张** — [报告](report.md#summary)
  - 问题：它试图解决传统代码质量工具的什么不足？
  - 证据：README、网站文档、设计规格及项目介绍。
  - 完成：区分项目自述、可验证能力和营销性主张。
  - 记录：项目定位是补充而非替代传统 linter，用书籍衍生 rubric 让 Agent 更一致地发现架构漂移、知识重复和领域失真；“consistent/traceable/actionable”属于项目价值主张，后续以规则、解析器与 eval 证据分别核验。

- [x] **`P03` 知识与诊断模型** — [报告](report.md#key-facts)
  - 问题：十二本工程书籍如何映射到生产代码与测试代码的 decay risks？
  - 证据：`skills/_shared/source-coverage.md`、风险指南和各 Skill 文件。
  - 完成：建立“来源 → 风险维度 → 诊断规则”的可追踪关系。
  - 记录：`common.md` 索引 R1–R6，`decay-risks.md` 与 `test-decay-risks.md` 分别定义 6 个生产和 6 个测试风险；每项包含症状、书籍原则、严重度和 `What Not to Flag`。`source-coverage.md` 按 12 本书补充 encoded/do-not-ignore/do-not-over-flag 映射。

- [x] **`P04` 功能表面** — [报告](report.md#key-facts)
  - 问题：六个 Skill/命令分别解决什么问题，输入输出及边界是什么？
  - 证据：`brooks-review`、`audit`、`debt`、`test`、`health`、`sweep` 的 Skill 与命令定义。
  - 完成：给出功能矩阵，并明确重叠和差异。
  - 记录：六个原生 Skill 分别负责 PR、架构/上手、技术债、测试质量、四维健康汇总和带确认的自动修复；前五个主要报告，`sweep` 可改代码。`commands/` 只是读取对应 `SKILL.md` 的 Claude wrapper，不含第二套规则。

- [x] **`P05` 仓库与组件结构** — [报告](report.md#structure)
  - 问题：Skills、共享规则、commands、hooks、scripts、evals、插件 manifest 和 GitHub Action 如何分工？
  - 证据：目录内容、入口文件和引用关系。
  - 完成：形成组件职责图，并识别权威来源。
  - 记录：`skills/_shared/` 是风险、评分和报告契约权威；六个 mode `SKILL.md` 负责路由并加载各自 guide；commands 和 manifests 负责宿主发现；session hook 负责 Claude 短命令；scripts 负责 CI prompt assembly、模型调用、解析、SARIF、gate、history、eval 与校验。

- [x] **`P06` 端到端工作机制** — [报告](report.md#structure)
  - 问题：从安装、激活、读取代码，到生成 finding、评分和报告，流程如何运行？
  - 证据：安装脚本、hooks、Skill 指令、prompt assembly、report parser 和 CI scripts。
  - 完成：逐步追踪至少一条本地交互路径和一条 CI 路径。
  - 记录：交互路径由宿主发现 Skill、Agent 读取共享 rubric 和 mode guide、再自行检查仓库并生成 Markdown；CI 路径由 `ci-review.mjs` 读取 Git diff、拼接共享 prompt、单次调用 Anthropic、解析 Markdown，并可转 SARIF/执行 gate。无 diff 时 CI 只发送“full codebase scan”文字而不发送源码，实际上没有全库内容。

- [x] **`P07` Finding 与 Health Score 契约** — [报告](report.md#structure)
  - 问题：severity、`Symptom → Source → Consequence → Remedy` 和 0–100 分数如何定义、生成和解析？
  - 证据：共享指南、报告解析、CLI/CI 代码及样例输出。
  - 完成：区分确定性计算、模型判断和展示约定。
  - 记录：Finding 字段和 severity 门槛由 Markdown rubric 约束，实际发现与分级由模型判断；单模式从 100 按 strictness 扣分，health 再按 25/30/25/20 权重汇总。解析器确定性提取 finding，但 CI 直接信任模型报告里的 `Health Score` 数字，不重新计算。

- [x] **`P08` 引用可信度** — [报告](report.md#limitations)
  - 问题：书籍引用能否追溯、如何防止错误归因、哪些内容无法由仓库独立证明？
  - 证据：source coverage、规则文本、测试和贡献指南。
  - 完成：说明引用粒度、核验能力、例外和 false-positive 防护。
  - 记录：风险表通常引用书名与 principle/smell，少数含章节或页码；`source-coverage.md` 和 `What Not to Flag` 提供语义边界。仓库校验只证明 12 个书名、章节结构和风险数量一致，不核对书籍原文；贡献指南甚至允许新增 citation 无测试，因此归因准确性未被自动验证。

- [x] **`P09` 评测与效果声明** — [报告](report.md#limitations)
  - 问题：benchmark corpus、eval runner 和仓库公开结果如何产生？
  - 证据：`evals/`、benchmark/eval scripts、README 数字和 CI workflow。
  - 完成：复原评测方法，并判断公开数字是否可由仓库证据支持。
  - 记录：57-scenario suite 中 21 个是 no-risk false-positive case、2 个是 no-score case；structural runner 不调用模型，live runner 只按期望 risk code/score presence 分类。30-report frozen corpus 覆盖六模式、含 9 个 FP/tradeoff 样本和 56 个 truth codes，用于 parser/SARIF fidelity。README 的 `94% vs 16%` 三场景 head-to-head 没有原始对照输出，且同时称表格 illustrative 与 numbers reproducible，无法由当前 eval 资产复现。

- [x] **`P10` 分发与平台兼容** — [报告](report.md#context)
  - 问题：Claude Code、Codex、Cursor、Pi、GitHub Actions 等平台如何接入，能力是否一致？
  - 证据：manifests、安装脚本、平台文档和 composite action。
  - 完成：给出平台支持矩阵及降级差异。
  - 记录：Claude、Codex、Gemini 有专用 manifest/extension；通用 installer 将六个 Skill 与 `_shared` 平铺复制到 11 个命名目标或 neutral `agents` 目录。项目只声明 Claude/Gemini/Codex 经 maintainer 验证，另八个平台仅验证文件布局。GitHub Action 是独立 Anthropic CI 路径，能力不等同于有仓库工具的交互式 Agent。

- [x] **`P11` 质量与维护机制** — [报告](report.md#context)
  - 问题：项目如何验证自身 Skill、文档、版本引用和发布一致性？
  - 证据：tests、`validate-repo`、CI workflow、release Skill 和贡献规范。
  - 完成：确认自动检查范围及未覆盖区域。
  - 记录：CI 在 Node 20/22/24 运行 repository consistency、107 个 Node test、frozen parser benchmark 和 structural eval；validator 覆盖版本/描述同步、书籍与风险数量、guide 步骤、mode coverage、agent docs 与 hook 输出。CI 不运行付费 live model eval、引用原文核验或八个通用平台的端到端安装验证。

- [x] **`P12` 领域背景与替代方案** — [报告](report.md#context)
  - 问题：它与传统 linter、静态分析器、安全扫描器及 AI code review 工具有何差异？
  - 证据：brooks-lint 实现及相关工具的官方文档。
  - 完成：按确定性、语义深度、可追踪性、成本和误报风险比较，不做无证据排名。
  - 记录：ESLint 以 parser、AST 和规则验证 JavaScript 约束；CodeQL 以语言数据库和 QL 查询执行可重复的结构/数据流分析；GitHub Copilot code review 与 Code Quality 更接近 AI 审查，其中后者混合确定性 CodeQL 规则与 AI。brooks-lint 的差异是可移植的 Markdown Skill、固定十二书/十二风险 rubric 和强制 finding 链条，但不存在证据支持其在准确性上优于这些替代方案。

- [x] **`P13` 限制与开放问题** — [报告](report.md#limitations)
  - 问题：模型依赖、非确定性、评分可复现性、版权来源、上下文限制和安全边界有哪些缺口？
  - 证据：源码、文档、测试缺口及明确声明。
  - 完成：将已确认限制、合理推断和未知问题分开列出。
  - 记录：已确认缺口包括 CI 无 diff 时没有源码、CI `sweep` 无工具可写代码、score 直接取模型文本、live eval 不进入 CI 且只判 risk code/score presence、引用未与书籍原文自动核验、八个平台仅做布局验证；README 的 benchmark 表述存在内部冲突。推断：宿主工具与上下文差异会影响跨平台一致性。未知：真实项目误报/漏报率、模型/版本漂移影响及十二书归因准确率。

- [x] **`P14` 报告综合与覆盖检查** — [报告](report.md#sources)
  - 问题：所有调查项能否映射到用户指定的六个章节？
  - 证据：前述项目的结论与来源。
  - 完成：生成 `Summary`、`Key facts`、`How it works / Structure`、`Context`、`Open questions / Limitations`、`Sources`，并确保重要事实均有引用。
  - 记录：主报告已包含六个指定章节、事实/推断/未知/冲突标签、61 个实际查阅来源及 P01–P14 覆盖表；内部锚点与固定 commit 文件路径已通过确定性检查。
