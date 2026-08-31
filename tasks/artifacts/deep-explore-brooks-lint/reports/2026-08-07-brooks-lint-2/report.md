# brooks-lint 深度探索报告（修订版）

> **调查快照**：2026-08-07；仓库默认分支 commit `814174cd5b340bc0d8b0161b6d8288980428a44d`（2026-08-04，release `1.4.3`）。本报告复用首次探索取得的源码、配置、测试、评测资产与官方对照资料；未安装或运行 brooks-lint，也未独立核验十二本书的完整原文。[R01][R02][R03]
>
> **证据标签**：`[确认]` 表示源码、配置或一手资料直接支持；`[项目自述]` 表示项目自己的定位或效果声明；`[推断]` 表示基于实现事实的解释；`[未知]` 表示来源无法回答；`[冲突]` 表示第一方来源或契约之间存在张力。

<a id="summary"></a>
## 1. Summary

**准确定义：**brooks-lint 是一套开源、以 Markdown 为主要载体的 AI 代码审查 Agent Skills。它把十二本软件工程书中的原则整理成风险分类、诊断步骤、报告格式与评分规则，再由 Claude Code、Codex、Gemini、Pi 等具备仓库工具的宿主 Agent 读取代码并执行分析；它本身不是一个通过 AST 或编译器直接分析源码的传统 linter。[R02][R08][R09][R12][R25][R26][R28]

它的用途是给通用 coding Agent 一套稳定的审查心智模型：不仅指出代码现象，还要求说明来源原则、后果和具体 remedy。项目提供六种工作模式，覆盖 PR、架构、技术债、测试、综合健康和完整 sweep，并用 Node/shell 脚本补充安装、GitHub Actions、报告解析、SARIF、质量门禁、趋势记录和评测。[R08][R12][R13][R14][R15][R16][R17][R33]

| 项目 | 定义 |
|---|---|
| 核心资产 | Markdown Skills、共享风险知识、mode guides |
| 实际分析者 | 宿主 Agent 或 CI 中调用的 Anthropic 模型 |
| 主要输入 | 用户意图、仓库文件、git diff、可选 `.brooks-lint.yaml` |
| 主要输出 | 带来源链的 findings、Health Score、Markdown；CI 可附 JSON/SARIF |
| 适用对象 | 使用 AI coding Agent 进行代码理解与审查的开发者和团队 |
| 非目标 | 替代 ESLint、CodeQL、编译器或测试覆盖率工具 |

[R02][R08][R33][R39][R40]

<a id="key-facts"></a>
## 2. Key facts

### 2.1 核心心智模型

brooks-lint 的知识链可以简化为：

```text
12 本工程书籍
    ↓ 提炼原则、smells、例外与 trade-offs
12 类 decay risks（R1–R6 + T1–T6）
    ↓ mode 选择检查范围与步骤
模型读取代码并形成 finding
    ↓ Iron Law 固定解释结构
Symptom → Source → Consequence → Remedy
    ↓ severity + strictness
Health Score / Dashboard / Markdown / SARIF
```

[R08][R09][R10][R11][R23][R40]

十二本来源是 *The Mythical Man-Month*、*Code Complete*、*Refactoring*、*Clean Architecture*、*The Pragmatic Programmer*、*Domain-Driven Design*、*A Philosophy of Software Design*、*Software Engineering at Google*、*xUnit Test Patterns*、*The Art of Unit Testing*、*Working Effectively with Legacy Code* 和 *How Google Tests Software*。`source-coverage.md` 为每本书记录已经编码的内容、不能忽略的内容和不应过度报告的内容。[R09]

### 2.2 风险分类

| 生产代码 | 诊断对象 | 测试代码 | 诊断对象 |
|---|---|---|---|
| R1 Cognitive Overload | 理解代码所需的认知负担 | T1 Test Obscurity | 测试意图是否清楚 |
| R2 Change Propagation | 一次变化影响多少不相关位置 | T2 Test Brittleness | 测试是否过度依赖实现细节 |
| R3 Knowledge Duplication | 同一决策是否重复表达 | T3 Test Duplication | 测试知识是否重复维护 |
| R4 Accidental Complexity | 实现是否比问题本身更复杂 | T4 Mock Abuse | mock 是否替代了真实行为 |
| R5 Dependency Disorder | 依赖方向与边界是否稳定 | T5 Coverage Illusion | coverage 是否掩盖行为缺口 |
| R6 Domain Model Distortion | 代码是否忠实表达领域 | T6 Architecture Mismatch | 测试结构是否对应系统结构 |

每一类风险都有 diagnostic question、symptoms、书籍来源、severity guidance 和 `What Not to Flag`，因此它既描述“何时报告”，也描述“何时不要报告”。[R10][R11]

### 2.3 六种工作模式

| Mode | 主要输入 | 它做什么 | 主要输出 |
|---|---|---|---|
| `review` | staged、unstaged 或 branch diff | 检查变更中的生产与测试风险 | PR findings、Health Score |
| `audit` | 项目或模块 | 建立依赖图并解释架构结构 | Mermaid graph、架构 findings；onboarding 变体不评分 |
| `debt` | 全项目或增量模块 | 用六类生产风险组织技术债 | findings、Pain × Spread 优先级 |
| `test` | 测试文件及关联代码 | 建立 suite map 并检查 T1–T6 | 测试质量报告 |
| `health` | 项目与可用 diff | 组合 PR、架构、债务、测试四维结果 | Dashboard、Composite Score |
| `sweep` | 全项目 | 扫描、分组，并在交互宿主中经同意后修复和复扫 | 报告；有工具时可产生代码变更 |

[R12][R13][R14][R15][R16][R17][R18][R19][R20][R21][R22][R23][R24]

### 2.4 评分与评测

- 单模式从 100 分开始；`strict / balanced / legacy-friendly` 对 Critical、Warning、Suggestion 分别扣 `20/8/2`、`15/5/1`、`8/3/1`，最低为 0。[R08]
- Health Dashboard 按 PR 25%、Architecture 30%、Debt 25%、Test 20% 加权；无 PR diff 时把 25% 按剩余权重比例重新分配。[R23]
- 仓库包含 57 个结构化场景：`review 29 / test 14 / audit 6 / debt 4 / health 2 / sweep 2`；21 个场景要求不产生 risk code，2 个场景要求不输出 Health Score。[R43][R44][R46]
- 另有 30 份冻结的六模式报告、9 个 `isFP` 样本和 56 个 truth risk codes，用于验证 parser 与 SARIF 是否忠实读取模型报告。[R45][R47]
- CI 在 Node 20、22、24 上运行 repository validation、Node tests、parser benchmark 和 structural eval；当前单一 test 文件包含 107 个 `test(...)` 声明。[R48][R49][R56]

<a id="structure"></a>
## 3. How it works / Structure

### 3.1 总体架构

```text
                         ┌──────────────────────────────┐
                         │       Host coding Agent      │
                         │ Claude / Codex / Gemini / Pi │
                         └──────────────┬───────────────┘
                                        │ discovers and reads
             ┌──────────────────────────▼──────────────────────────┐
             │                  Mode Skills                       │
             │ review · audit · debt · test · health · sweep     │
             └──────────────┬──────────────────────┬──────────────┘
                            │                      │
                ┌───────────▼──────────┐  ┌────────▼─────────────┐
                │ skills/_shared/      │  │ mode-specific guides │
                │ risks · sources ·    │  │ steps · graphs ·     │
                │ report · scoring     │  │ caps · fix workflow  │
                └───────────┬──────────┘  └────────┬─────────────┘
                            └────────────┬──────────┘
                                         │ findings/report
       ┌─────────────────────────────────▼────────────────────────────────┐
       │ scripts/: prompt · API · parser · SARIF · gates · history · eval │
       └─────────────────────────────────┬────────────────────────────────┘
                                         │
                               GitHub Actions / CI
```

[R08][R09][R10][R11][R12][R38][R39][R40]

### 3.2 组件如何实现各项能力

| 能力 | 主要实现位置 | 实现方式 |
|---|---|---|
| 风险知识 | `skills/_shared/source-coverage.md`、`decay-risks.md`、`test-decay-risks.md` | Markdown 定义原则、症状、severity 与不过度报告的边界 |
| 报告与评分契约 | `skills/_shared/common.md` | 定义 Iron Law、scope、config、模板、扣分和 history |
| 模式选择 | 六个 `skills/brooks-*/SKILL.md` | 用 skill description 路由用户意图，再加载专用 guide |
| 模式流程 | `pr-review-guide.md` 等七个 guides | 定义每种分析的步骤、范围、finding caps、图和修复流程 |
| 宿主发现 | plugin manifests、`gemini-extension.json`、commands、hooks | 把 Skills 和短命令暴露给不同 Agent |
| 通用安装 | `scripts/install.sh` | 把六个 Skill 与 `_shared` 平铺复制到目标平台目录 |
| CI prompt | `scripts/assemble-prompt.mjs` | 把共享规则和 mode guide 合成 system prompt |
| CI 模型调用 | `scripts/ci-review.mjs` | 选择 diff，单次调用 Anthropic Messages API，返回 Markdown |
| 结构化输出 | `report-parse.mjs`、`sarif.mjs` | 从报告提取 finding 并转换为 JSON/SARIF |
| 门禁与趋势 | `ci-gate.mjs`、`history.mjs` | 按 score/severity/regression 失败并计算历史趋势 |
| 维护验证 | `validate-repo.mjs`、tests、evals、workflow | 检查版本、风险数、guide、manifest、parser 和场景结构 |

[R08][R18][R25][R28][R29][R32][R38][R39][R40][R41][R42][R48]

### 3.3 交互式路径

1. **发现 mode**：用户提出“review this PR”“audit the architecture”等意图，宿主通过 Skill description 或命令 wrapper 选择对应 `SKILL.md`。[R12][R13][R54]
2. **加载知识**：mode Skill 要求读取 `common.md`、`source-coverage.md`、生产或测试风险表，以及自己的 guide。[R08][R09][R10][R11]
3. **读取配置**：宿主尝试读取 `.brooks-lint.yaml`；`disable`、`focus`、`severity`、`ignore`、`strictness` 和 sweep 设置会改变检查范围与评分。[R08]
4. **确定 scope**：PR review 依次选择 staged diff、unstaged diff、`main...HEAD`；其他 mode 默认项目、模块或测试文件。[R08]
5. **检查代码**：宿主 Agent 使用自己的 read/search/git 工具取得代码上下文，对照风险问题、症状和 `What Not to Flag` 做判断。[R10][R11]
6. **形成 finding**：每个 finding 按 Iron Law 写出 `Symptom → Source → Consequence → Remedy`，再赋予 severity。[R08]
7. **计算和输出**：按 strictness 扣分，生成 mode-specific Markdown；health 还组合四个维度。[R08][R23]
8. **条件步骤**：评分后可以记录 history；交互会话可 triage findings；用户明确要求时，sweep 才进入编辑、测试、回滚与复扫。[R08][R24][R42]

### 3.4 CI 路径

1. Composite Action 安装 Node 20 与项目固定的 Anthropic SDK，并调用 `ci-review.mjs`。[R03][R33]
2. `ci-review.mjs` 依次读取 staged、unstaged、`main...HEAD` diff；找到后把 diff 放入 user message。[R39]
3. `assemble-prompt.mjs` 组合共享框架、来源覆盖、风险表和 mode guide。[R38]
4. 脚本使用用户指定或默认的 `claude-sonnet-4-6` 发起一次 Messages API 请求，最大输出 4096 tokens。[R33][R39]
5. 模型返回 Markdown；parser 提取 findings，score 由 `ci-review.mjs` 从 `Health Score` 文本中提取。[R39][R40]
6. Action 可发布 PR comment、上传 SARIF，并按最低分、finding severity 或相对历史分数的 regression 执行 gate。[R33][R41]

这条 CI 路径没有交互宿主的仓库读取和编辑工具。因此它分析收到的 diff；当没有 diff 时，代码只发送“full codebase scan”的 scope 文本，没有附带项目源码。Action 虽接受 `sweep` mode，但该模式在 CI 中只能生成文本，不能执行交互式 sweep 的编辑和复扫步骤。[R24][R33][R39]

### 3.5 配置、判断与确定性计算的边界

```text
.brooks-lint.yaml
      ↓ filters / overrides
risk rubric + source coverage + mode guide
      ↓ LLM judgment
findings + severity + explanation
      ↓ deterministic rules described in Markdown
score / weighted dashboard
      ↓ parser and CI scripts
JSON / SARIF / gates / trend
```

模型负责理解代码、判断是否构成 finding、选择 severity 并生成理由；扣分公式、dashboard 权重、parser、SARIF 和 gate 是可被代码或明确算术重复执行的外层机制。当前 CI 直接读取模型报告中的 score，而不是从解析后的 severity 重新计算。[R08][R23][R39][R40][R41]

### 3.6 一次 PR review 的说明性示例

以下只说明真实控制流，不声称实际运行结果：

1. 开发者在 Agent 中请求 review 当前 staged changes。
2. `brooks-review` 加载共享框架、生产风险、测试风险与 PR guide。
3. 宿主读取 diff，按 changed files 建立 scope，并补充必要的调用方或测试上下文。
4. 若观察到一个业务规则被复制到多个位置，模型可以按 R3 Knowledge Duplication 形成 finding；若 guard 是清晰且必要的，则 `What Not to Flag` 应阻止误报。
5. Finding 使用 Iron Law 四字段解释现象、来源原则、后果和 remedy。
6. 所有 findings 按 severity 扣分，生成 Markdown Summary。
7. 若同一路径在 CI 中运行，Markdown 再被解析成 JSON/SARIF，并进入 PR comment 与 gates。

[R08][R10][R11][R18][R33][R39][R40]

<a id="context"></a>
## 4. Context

### 4.1 安装与集成方式

- **Claude Code、Codex CLI、Gemini CLI**：仓库提供专用 plugin/extension metadata；Claude 还通过 SessionStart hook 生成短命令 wrapper。[R25][R26][R27][R28][R29][R30][R31]
- **通用 Agent Skills 宿主**：`install.sh` 支持 OpenCode、Cursor、Windsurf、Antigravity、Pi、Kiro、Copilot、Factory Droid、Gemini、Codex、Claude 和中立 `agents` 目录，把 Skill 与 `_shared` 平铺安装。[R32][R35][R36][R37]
- **GitHub Actions**：独立于交互宿主，需要 `ANTHROPIC_API_KEY`；它把 diff 发送给 Anthropic，并可输出 comment、SARIF 与 gates。[R33][R34][R53]
- **平台验证状态**：README 声明 Claude Code、Gemini CLI、Codex CLI 经维护者验证；另外八个平台依据官方 Skill 规范和 installer layout 验证，但未全部做维护者端到端运行。[R02]

### 4.2 与相邻工具的关系

| 工具类别 | 工作方式 | 它主要解释什么 | 与 brooks-lint 的关系 |
|---|---|---|---|
| ESLint | parser 生成 AST，rules 检查约束 | JavaScript/TypeScript 的语法、风格和已编码反模式 | brooks-lint 不替代 rule engine，而补充跨文件设计语义 |
| CodeQL | 构建语言数据库，运行 QL queries | 安全、variant analysis、AST/type/data/control flow | brooks-lint 不建数据库，依赖 LLM 与仓库上下文理解 |
| Copilot code review | AI 收集项目上下文并给出 PR 建议 | 多语言代码问题和 suggested fixes | 同属 AI review；brooks-lint 提供固定书籍 rubric 与开放 Skill 文件 |
| GitHub Code Quality | CodeQL rules + AI analysis + coverage/gates | 已知 anti-pattern、AI quality finding 与平台治理 | 是规则与 AI 混合平台；brooks-lint 更偏可移植 Agent workflow |

ESLint 官方把 parser、AST、rules、plugins 和 configuration 定义为核心概念；CodeQL 把分析分为建库、执行查询和解释结果三步。[E01][E04] GitHub Copilot code review 可收集完整项目上下文并建议修复，官方同时要求用人工 review 补充，因为 AI 可能漏报、误报或 hallucinate。[E02][E03] GitHub Code Quality 则明确组合确定性 CodeQL 规则与 AI analysis，并集成 coverage 和 ruleset gate。[E05]

### 4.3 项目演进与维护结构

当前实现已经形成“Markdown 知识层 + 多宿主分发层 + CI/解析层 + 验证层”。CHANGELOG 和历史设计资料记录了从早期设计到 v1.4 的模式、风险分类、SARIF、strictness、history 和多平台支持演进。[R05][R07] Release Skill、`version-refs.mjs` 与 `validate-repo.mjs` 负责让 package version、manifests、README、CHANGELOG、风险数量、guide 和 hook 输出保持同步。[R48][R51][R52]

<a id="limitations"></a>
## 5. Open questions / Limitations

本节描述**现有证据能够与不能够确立什么**，不是对项目列缺陷或提出整改。

### 5.1 现有来源能够确认的边界

- **[确认]** 源码与配置足以确认 Skill 组成、风险 taxonomy、prompt assembly、CI 调用、parser、SARIF、gates、history 和 eval runner 的实现方式。[R08][R38][R39][R40][R41][R42][R43][R45]
- **[确认]** Frozen corpus 能证明 parser 对这 30 份报告的读取一致性；它不直接证明模型 finding 的业务正确性。[R45][R47]
- **[确认]** 57-scenario live runner 能检查期望 risk code 和 score 是否出现；它没有独立语义 judge 来验证完整 finding 的事实与理由。[R44][R46]
- **[项目自述]** README 的 `94% vs 16%` 是独立三场景 head-to-head 结果；仓库没有保存对应的原始 paired outputs 与完整重放资产，因此本报告不把它转换为独立验证结论。[R02][R50]
- **[未知]** 各 R/T 风险在真实、跨语言、跨规模项目上的 precision、recall、severity 一致率与跨模型方差，现有资料没有系统实验。[R44][R46]
- **[未知]** 十二本书的所有 principle/smell 映射是否经过统一版本、章节和页码核验；仓库提供可追踪表，但不包含书籍全文。[R09][R10][R11][R50]

### 5.2 第一方来源中的张力

- **[冲突] Benchmark 表述**：README 把 `94% vs 16%` 表格称为 “illustrative”，相邻文字又使用 “deterministic” 和 “reproduce locally”；后续说明则明确只有 parser numbers 可精确复现，live measurements 会变化。CONTRIBUTING 说明 94% 属于另一个三场景比较。[R02][R50]
- **[冲突] Health Score 确定性**：`health-guide.md` 要求同一 codebase 两次运行一致，但 finding 与 severity 由单次模型调用产生，CI 又直接读取模型输出的 score。确定性要求描述的是目标契约，当前机制没有独立引擎强制整份 dashboard 一致。[R23][R39]
- **[冲突] `sweep` 的同名能力**：交互式 guide 的 sweep 包含确认、编辑、测试、回滚和复扫；GitHub Action 暴露同名 mode，但其单次无工具模型调用只能生成报告。两个入口共享 rubric，但执行能力不同。[R24][R33][R39]

### 5.3 使用者需要自行确认的外部边界

- GitHub Action 会把 diff 发往 Anthropic；是否适合私有代码取决于使用者的数据政策。[R33][R53]
- `curl | bash` 安装形式会联网 clone 并复制文件；Security 文档同时提供先审阅脚本或使用 repo-local 形式的选择。[R32][R53]
- 未认证 GitHub API 在调查时触发 rate limit，因此 stars、open issues、contributors 等易变指标没有进入本报告。[R55]

<a id="sources"></a>
## 6. Sources

### 6.1 目标仓库：固定 commit `814174c`

- **[R01] Commit snapshot** — 固定调查 revision、提交时间和 release commit。
- **[R02] README** — 项目定义、功能、benchmark、安装平台和验证状态。
- **[R03] `package.json`** — 版本、ESM、scripts、包元数据和 Anthropic SDK 版本。
- **[R04] LICENSE** — MIT 许可。
- **[R05] CHANGELOG** — v1.4.3 与历史功能演进。
- **[R06] `docs/getting-started.md`** — 通用安装、调用与平台入门。
- **[R07] 历史 v3 design spec** — 早期设计语境。
- **[R08] `_shared/common.md`** — Iron Law、config、scope、报告、评分、history 与 triage。
- **[R09] `_shared/source-coverage.md`** — 十二本书及 coverage/trade-off 映射。
- **[R10] `_shared/decay-risks.md`** — R1–R6 canonical 定义。
- **[R11] `_shared/test-decay-risks.md`** — T1–T6 canonical 定义。
- **[R12] `brooks-review/SKILL.md`** — PR review 路由。
- **[R13] `brooks-audit/SKILL.md`** — architecture/onboarding 路由。
- **[R14] `brooks-debt/SKILL.md`** — tech debt 路由。
- **[R15] `brooks-test/SKILL.md`** — test quality 路由。
- **[R16] `brooks-health/SKILL.md`** — dashboard 路由。
- **[R17] `brooks-sweep/SKILL.md`** — full sweep 路由与交互式修复边界。
- **[R18] `pr-review-guide.md`** — diff 分析步骤。
- **[R19] `architecture-guide.md`** — 架构 audit 与依赖图流程。
- **[R20] `onboarding-guide.md`** — codebase tour 变体。
- **[R21] `debt-guide.md`** — debt 流程与 Pain × Spread。
- **[R22] `test-guide.md`** — suite map 与测试风险流程。
- **[R23] `health-guide.md`** — 四维权重、finding cap 和分数要求。
- **[R24] `sweep-guide.md`** — 确认、修复、测试、回滚和复扫。
- **[R25] Claude plugin manifest** — Claude Code 注册。
- **[R26] Codex plugin manifest** — Codex 分发元数据。
- **[R27] Claude marketplace manifest** — marketplace 包装。
- **[R28] Gemini extension manifest** — Gemini CLI 注册。
- **[R29] `hooks/hooks.json`** — SessionStart hook 注册。
- **[R30] `hooks/session-start.mjs`** — Claude 短命令生成逻辑。
- **[R31] `hooks/session-start`** — hook shell 入口。
- **[R32] `scripts/install.sh`** — 平台目录映射与 flat copy。
- **[R33] GitHub composite action** — API、model、comment、SARIF 和 gates。
- **[R34] GitHub Action example** — 消费方 workflow 示例。
- **[R35] Cursor setup** — Cursor 接入说明。
- **[R36] Copilot setup** — Copilot 接入说明。
- **[R37] Pi setup** — Pi 接入说明。
- **[R38] `assemble-prompt.mjs`** — system prompt 拼装。
- **[R39] `ci-review.mjs`** — diff、模型调用、score 与 CI 输出。
- **[R40] `report-parse.mjs`** — finding 解析。
- **[R41] `ci-gate.mjs`** — score、severity 和 regression gates。
- **[R42] `history.mjs`** — history 与 trend。
- **[R43] `run-evals.mjs`** — structural eval。
- **[R44] `run-evals-live.mjs`** — live model eval。
- **[R45] `benchmark.mjs`** — frozen-corpus benchmark。
- **[R46] `evals/evals.json`** — 57 个场景。
- **[R47] `evals/benchmark-corpus.json`** — 30 份冻结报告与 truth inventory。
- **[R48] `validate-repo.mjs`** — 仓库一致性校验。
- **[R49] `validate.yml`** — Node 20/22/24 CI workflow。
- **[R50] CONTRIBUTING** — citation/eval 贡献规则与 benchmark 说明。
- **[R51] Release Skill** — release 流程。
- **[R52] `version-refs.mjs`** — 版本引用同步。
- **[R53] SECURITY** — prompt、hook、installer 与 API 信任边界。
- **[R54] `commands/` directory** — 六个 Claude command wrappers。
- **[R55] GitHub REST repository endpoint** — 调查时被 rate limit，未提供事实。
- **[R56] `validate-repo.test.mjs`** — 107 个 Node test declarations。

### 6.2 领域对照的一手资料

- **[E01] ESLint Core Concepts** — parser、AST、rules、plugins 和 configuration。
- **[E02] GitHub Copilot code review concepts** — 多语言 review、修复建议和项目上下文。
- **[E03] GitHub Copilot Agents responsible use** — 漏报、误报和不准确建议。
- **[E04] CodeQL overview** — database、QL queries 和结果解释。
- **[E05] GitHub Code Quality concepts** — CodeQL rules、AI analysis、coverage 和 gates。

### 6.3 探索覆盖

| ID | 报告位置 | 证据状态 |
|---|---|---|
| P01 简洁准确的定义 | [Summary](#summary) | 已确认产品形态与非目标 |
| P02 目的、用户与使用场景 | [Summary](#summary)、[Key facts](#key-facts) | 已确认 |
| P03 核心概念与心智模型 | [Key facts](#key-facts) | 已确认；书籍原文未独立核验 |
| P04 功能与模式 | [Key facts](#key-facts) | 已确认六模式 |
| P05 产品形态与运行环境 | [Summary](#summary)、[How it works / Structure](#structure) | 已确认 |
| P06 总体架构 | [How it works / Structure](#structure) | 已确认并提供架构图 |
| P07 交互式工作流程 | [How it works / Structure](#structure) | 已确认 |
| P08 CI 工作流程 | [How it works / Structure](#structure) | 已确认 |
| P09 实现结构源码走读 | [How it works / Structure](#structure) | 已确认行为到文件映射 |
| P10 配置、评分与输出契约 | [Key facts](#key-facts)、[How it works / Structure](#structure) | 已区分模型判断与确定性外层 |
| P11 端到端示例 | [How it works / Structure](#structure) | 说明性流程，不虚构运行结果 |
| P12 安装、分发与集成 | [Context](#context) | 已确认 |
| P13 领域位置与相邻工具 | [Context](#context) | 官方一手资料对照 |
| P14 证据边界与报告综合 | [Open questions / Limitations](#limitations)、本表 | 事实、项目声明、未知与冲突已分开 |

[R01]: https://github.com/hyhmrright/brooks-lint/commit/814174cd5b340bc0d8b0161b6d8288980428a44d
[R02]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/README.md
[R03]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/package.json
[R04]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/LICENSE
[R05]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/CHANGELOG.md
[R06]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/docs/getting-started.md
[R07]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/docs/superpowers/specs/2026-03-27-brooks-lint-v3-design.md
[R08]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/_shared/common.md
[R09]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/_shared/source-coverage.md
[R10]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/_shared/decay-risks.md
[R11]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/_shared/test-decay-risks.md
[R12]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-review/SKILL.md
[R13]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-audit/SKILL.md
[R14]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-debt/SKILL.md
[R15]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-test/SKILL.md
[R16]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-health/SKILL.md
[R17]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-sweep/SKILL.md
[R18]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-review/pr-review-guide.md
[R19]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-audit/architecture-guide.md
[R20]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-audit/onboarding-guide.md
[R21]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-debt/debt-guide.md
[R22]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-test/test-guide.md
[R23]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-health/health-guide.md
[R24]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/skills/brooks-sweep/sweep-guide.md
[R25]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/.claude-plugin/plugin.json
[R26]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/.codex-plugin/plugin.json
[R27]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/.claude-plugin/marketplace.json
[R28]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/gemini-extension.json
[R29]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/hooks/hooks.json
[R30]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/hooks/session-start.mjs
[R31]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/hooks/session-start
[R32]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/install.sh
[R33]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/.github/actions/brooks-lint/action.yml
[R34]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/docs/github-action-example.yml
[R35]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/docs/cursor-setup.md
[R36]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/docs/copilot-setup.md
[R37]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/docs/pi-setup.md
[R38]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/assemble-prompt.mjs
[R39]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/ci-review.mjs
[R40]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/report-parse.mjs
[R41]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/ci-gate.mjs
[R42]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/history.mjs
[R43]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/run-evals.mjs
[R44]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/run-evals-live.mjs
[R45]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/benchmark.mjs
[R46]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/evals/evals.json
[R47]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/evals/benchmark-corpus.json
[R48]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/validate-repo.mjs
[R49]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/.github/workflows/validate.yml
[R50]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/CONTRIBUTING.md
[R51]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/.claude/skills/release/SKILL.md
[R52]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/version-refs.mjs
[R53]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/SECURITY.md
[R54]: https://github.com/hyhmrright/brooks-lint/tree/814174cd5b340bc0d8b0161b6d8288980428a44d/commands
[R55]: https://api.github.com/repos/hyhmrright/brooks-lint
[R56]: https://github.com/hyhmrright/brooks-lint/blob/814174cd5b340bc0d8b0161b6d8288980428a44d/scripts/validate-repo.test.mjs
[E01]: https://eslint.org/docs/latest/use/core-concepts/
[E02]: https://docs.github.com/en/copilot/concepts/agents/code-review
[E03]: https://docs.github.com/en/copilot/responsible-use/agents
[E04]: https://codeql.github.com/docs/codeql-overview/about-codeql/
[E05]: https://docs.github.com/en/code-security/concepts/code-quality/code-quality
