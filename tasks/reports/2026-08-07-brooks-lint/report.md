# brooks-lint 深度探索报告

> **调查快照**：2026-08-07；仓库默认分支 commit `814174cd5b340bc0d8b0161b6d8288980428a44d`（2026-08-04，`chore(release): 1.4.3`）。本报告读取源码、配置、测试、评测资产和官方对照资料，但按批准范围未安装或运行 brooks-lint，也未独立核验十二本书的完整原文。[R01][R02]
>
> **证据标签**：`[确认]` 可由仓库源码、配置或一手资料直接支持；`[项目自述]` 是项目自己的定位或效果声明；`[推断]` 是基于已确认机制的分析；`[未知]` 是现有来源不能回答的问题；`[冲突]` 是来源或契约之间的不一致。

<a id="summary"></a>
## 1. Summary

brooks-lint 是一个 MIT 许可的 AI 代码审查 Skill 包：它把十二本软件工程书整理成六类生产代码风险、六类测试风险和六种审查模式，由支持 Agent Skills 的宿主模型阅读仓库并生成结构化报告，而不是自己实现 AST、编译器或静态分析引擎。[R02][R04][R08][R09] 它的重要性在于尝试用固定 rubric、`Symptom → Source → Consequence → Remedy` 链条和统一评分，让 AI 审查比自由提示更可追踪、可复用并可跨宿主分发。[R08] 其设计轻量且覆盖面广，但现有证据主要证明规则结构、报告解析和打包一致性，尚不能证明真实项目上的模型准确率；CI 的“无 diff 全库扫描”、`sweep` 自动修复和分数确定性还存在实现与文档不完全一致的问题。[R23][R39][R44][R47]

<a id="key-facts"></a>
## 2. Key facts

- **[确认] 身份与基线**：`package.json`、README 和 CHANGELOG 均标记版本 `1.4.3`；项目是 Node.js ES module，唯一开发依赖是固定版本的 `@anthropic-ai/sdk`，许可证为 MIT。[R02][R03][R04][R05]
- **[确认] 产品形态**：核心不是可执行分析器，而是 Markdown Skill 与 guide；交互模式下，宿主 Agent 负责读取代码、判断风险和写报告，Node/shell 代码主要处理安装、CI prompt、报告解析、SARIF、gate、history、eval 与一致性校验。[R08][R12][R38][R39]
- **[确认] 十二本知识来源**：*The Mythical Man-Month*、*Code Complete*、*Refactoring*、*Clean Architecture*、*The Pragmatic Programmer*、*Domain-Driven Design*、*A Philosophy of Software Design*、*Software Engineering at Google*、*xUnit Test Patterns*、*The Art of Unit Testing*、*Working Effectively with Legacy Code*、*How Google Tests Software*。仓库为每本书记录“已编码内容、不可忽略项、不可过度报告项”。[R09]
- **[确认] 十二类风险**：生产代码为 R1 Cognitive Overload、R2 Change Propagation、R3 Knowledge Duplication、R4 Accidental Complexity、R5 Dependency Disorder、R6 Domain Model Distortion；测试代码为 T1 Test Obscurity、T2 Test Brittleness、T3 Test Duplication、T4 Mock Abuse、T5 Coverage Illusion、T6 Architecture Mismatch。每类含诊断问题、症状、来源、severity 指引和 `What Not to Flag`。[R10][R11]
- **[确认] 核心报告约束**：所谓 Iron Law 要求先诊断风险再给修复，并要求每个 finding 都包含 `Symptom → Source → Consequence → Remedy`；这是一条 prompt 契约，不是由类型系统或 schema 强制的输出协议。[R08][R40]
- **[确认] 六种模式**：

  | 模式 | 默认对象 | 主要产物 | 关键边界 |
  |---|---|---|---|
  | `review` | staged、unstaged 或 `main...HEAD` diff | PR findings、Health Score、快速测试检查 | 无 diff 的交互路径应询问用户；CI 路径行为不同 |
  | `audit` | 全项目或指定模块 | 架构 findings、Mermaid 依赖图 | onboarding 变体不输出 Health Score |
  | `debt` | 全项目或增量模块 | 六类生产风险、Pain × Spread 优先级 | 分析债务，不实施修复 |
  | `test` | 测试文件及关联生产代码 | 六类测试风险、suite map | 关注测试质量，不等同于 coverage 工具 |
  | `health` | 全项目与可用 diff | 四维 dashboard、复合分 | 每维 findings 有上限 |
  | `sweep` | 全项目 | 扫描、分组、经同意后修复并复扫 | 真正改代码需要有工具的交互宿主 |

  [R12][R13][R14][R15][R16][R17][R18][R19][R20][R21][R22][R23][R24]
- **[确认] 评分规则**：单模式从 100 分开始；`strict / balanced / legacy-friendly` 对 Critical、Warning、Suggestion 分别扣 `20/8/2`、`15/5/1`、`8/3/1`，最低为 0。Health Dashboard 按 PR 25%、Architecture 30%、Debt 25%、Test 20% 加权；无 PR diff 时按剩余权重比例重分配。[R08][R23]
- **[确认] 判断与算术的边界**：模型决定哪些现象构成 finding 及其 severity；在按契约生成 findings 之后，扣分算术可以确定性计算。但 CI 并不重算分数，只用正则从模型文本提取 `Health Score`，因此 gate 信任模型输出的数字。[R08][R39][R41]
- **[确认] 评测资产**：仓库有 57 个场景（`review 29 / test 14 / audit 6 / debt 4 / health 2 / sweep 2`），其中 21 个要求无 risk code、2 个要求无 Health Score；`npm run evals` 只校验数据与覆盖结构，`evals:live` 才调用模型，并以 risk code 和 score 是否出现进行分类。[R43][R44][R46]
- **[确认] Parser benchmark**：冻结语料含 30 份六模式报告、9 个 `isFP` 样本和 56 个 truth risk codes；truth 由另一轮模型分级并人工抽查。它衡量 parser/SARIF 是否忠实读取报告，不衡量模型 finding 是否正确。[R45][R47]
- **[项目自述] 效果数字**：README 展示 brooks-lint 与 “Claude Code (unaided)” 的 `94% vs 16%` 三场景总体通过率；仓库没有对应的原始 paired outputs 或可重放脚本，因此本调查不能复现该数字。[R02][R50]
- **[确认] 分发面**：专用元数据覆盖 Claude Code、Codex CLI、Gemini CLI；通用安装器列出 11 个命名宿主与中立 `agents` 目录，并平铺复制六个 Skill 与 `_shared`。README 只声明 Claude、Gemini、Codex 经维护者验证，另外八个平台只验证文件布局。[R25][R26][R27][R28][R32]
- **[确认] 自身质量控制**：CI 在 Node 20、22、24 上执行仓库一致性校验、Node tests、parser benchmark 和 structural eval；静态统计可见 107 个 `test(...)` 声明。CI 不运行需要 API key 的 live model eval，也不核验书籍原文或所有宿主的端到端行为。[R48][R49][R56]
- **[确认] 信任边界**：GitHub Action 把待审 diff 发送给 Anthropic API；SessionStart hook 会在 `~/.claude/commands/` 写短命令 wrapper；官方安装示例包含 `curl | bash`，Security 文档明确建议需要时先审阅脚本或使用 repo-local 形式。[R29][R30][R31][R32][R33][R53]

<a id="structure"></a>
## 3. How it works / Structure

### 3.1 组件职责

| 层 | 权威内容 | 作用 |
|---|---|---|
| `skills/_shared/` | 风险定义、来源覆盖、报告模板、评分与配置规则 | 所有模式共享的诊断语义；应优先修改这里而非复制规则 |
| `skills/brooks-*/SKILL.md` | mode 路由与读取顺序 | 告诉宿主何时启用模式及应加载哪个 guide |
| mode guides | 分步分析流程、专用输出、上限与例外 | 例如架构图、Pain × Spread、dashboard 权重、sweep 修复循环 |
| `commands/`、plugin manifests、hook | 宿主发现与短命令 | 不包含第二套诊断模型，主要把命令转到 Skill |
| `scripts/` | 安装、CI、解析、SARIF、gate、history、eval、版本校验 | 围绕模型输出提供确定性外壳 |
| `evals/`、tests、workflow | 结构场景、冻结报告、单元/一致性检查 | 证明 prompt/数据/解析/分发契约未漂移，不等同于真实准确率证明 |

[R08][R09][R10][R11][R25][R29][R38][R40][R46][R47][R48]

### 3.2 两条运行路径

```text
交互式宿主
用户意图 → 宿主发现 SKILL.md → 读取 _shared + mode guide
        → 宿主工具读取仓库/config/diff → LLM 判断 findings
        → Markdown 报告 + score → 可选 history / triage / sweep 修复

GitHub Action / CI
Git diff → assembleSystemPrompt(_shared + mode guide)
        → 单次 Anthropic Messages API 调用 → Markdown
        → report parser → JSON / SARIF → threshold / severity / regression gate
```

#### 交互路径

1. **安装与发现**：平台 manifest 或 `install.sh` 把六个 Skill 与 `_shared` 放进宿主的 skill 目录；Claude hook 另行生成短命令 wrapper。[R25][R28][R29][R30][R32]
2. **加载项目配置**：共享规则要求尝试读取 `.brooks-lint.yaml`，处理 `disable`、`focus`、`severity`、`ignore`、`strictness`、`sweep.max_iterations` 和 custom risks。YAML 解析与 glob 匹配在交互路径中由宿主 Agent 按自然语言执行，不是仓库内统一 parser。[R08]
3. **确定 scope**：`review` 依次考虑 staged、unstaged、`main...HEAD`；audit/debt 默认全项目；test 默认全部测试；health 默认全项目。宿主是否能完整读取、搜索和关联文件取决于它提供的工具。[R08]
4. **诊断**：模型读取对应风险表与 `source-coverage`，应用症状、severity 和 `What Not to Flag`，再按 mode guide 限制 finding 数量、生成图或优先级。[R09][R10][R11][R18][R19][R21][R22][R23]
5. **报告与分数**：模型输出固定 Markdown 字段并按扣分表计算分数；共享规则随后要求把结果追加到 `.brooks-lint-history.json`。交互式 review 因而不是绝对只读：即使未启用修复，也可能写 history；triage 还可能写 `.brooks-lint.yaml`。[R08][R42]
6. **修复**：普通模式只诊断；用户要求 remedy 时细化建议，只有 `sweep` 在用户同意后调用宿主编辑/测试工具实施并复扫。[R08][R17][R24]

#### CI 路径

1. `ci-review.mjs` 依次读取 staged、unstaged、`main...HEAD` diff；找到 diff 后把完整 diff 放进 user message。[R39]
2. `assemble-prompt.mjs` 把共享框架、来源覆盖、生产/测试风险和 mode guide 组成 system prompt。[R38]
3. 脚本使用指定模型（默认 `claude-sonnet-4-6`）发起一次 Anthropic Messages 请求，`max_tokens` 为 4096；没有文件读取、shell、编辑或二次工具调用。[R03][R39]
4. `report-parse.mjs` 从 Markdown 提取 findings；`ci-review.mjs` 另用正则提取 score，可输出 JSON，并由 SARIF/gate 代码转成 Code Scanning 结果或阻断 CI。[R39][R40][R41]
5. composite action 可发 PR comment、上传 SARIF，并按最低分、severity 或相对上次分数的 regression 失败。[R33][R34]

### 3.3 关键机制的含义

- **可追踪性来自格式，不来自形式证明**：`Source` 字段把 finding 指向书籍原则，但 parser 只识别报告文本，validator 只检查结构与风险目录，并不验证“症状确实存在”或“书籍确实支持这条归因”。[R40][R48][R50]
- **确定性外壳包围非确定性核心**：安装路径、prompt 拼装、报告解析、扣分公式、SARIF 和 gate 可以测试；finding 发现、severity、自然语言理由与 CI score 原值仍由模型产生。[R39][R40][R45]
- **跨平台靠开放文件布局**：同一组 Markdown 可被多个 Agent 宿主消费；代价是项目配置解析、仓库上下文、工具权限、模型版本和执行遵循度都可能因宿主不同而变化。[R25][R26][R28][R32]

<a id="context"></a>
## 4. Context

### 4.1 与主要工具类别的关系

| 维度 | ESLint | CodeQL | GitHub Copilot code review / Code Quality | brooks-lint |
|---|---|---|---|---|
| 核心机制 | parser 把 JavaScript 转成 AST，规则检查约束 | 为每种语言构建含 AST、类型、data/control flow 的数据库，再执行 QL 查询 | Copilot review 用生成式 AI 与项目上下文审查；Code Quality 混合确定性 CodeQL 规则与 AI | 通用 LLM 按 Markdown rubric 和仓库工具做语义判断 |
| 主要强项 | 语法、风格、明确反模式；规则结果可重复 | 安全/variant analysis、结构与数据流查询；查询可重放 | PR 工作流、建议修复、平台上下文；Code Quality 还有 coverage 与 ruleset gate | 跨语言的架构、知识重复、领域模型、测试设计；书籍来源链与跨宿主可移植性 |
| 可复现性 | 给定版本、配置和源码通常高 | 给定 extractor、database、query 通常高 | AI 部分存在漏报、误报和 hallucination，官方要求人工验证 | finding 核心由模型判断；公式可重复，但报告与 score 未被实现强制一致 |
| 证据形式 | rule ID、AST 节点/位置 | query metadata、位置、data/control-flow path | 自然语言评论、代码建议；混合平台 finding | `Symptom / Source / Consequence / Remedy` 与 R/T risk code |
| 集成边界 | 主要是 JavaScript/TypeScript 生态，可由插件扩展 | 依赖受支持语言的 extractor/schema | GitHub 产品、Actions runner、许可与 AI credits | Skill 文件可复制到多种 Agent；CI 路径固定依赖 Anthropic API |
| 典型风险 | 规则只覆盖已编码模式，难理解业务语义 | 建模/查询成本与语言覆盖边界 | 官方确认会漏报、误报或给出不准确/不安全建议 | 同类模型风险，加上 prompt 遵循、宿主差异和来源归因未核验 |

ESLint 官方将 parser、AST、rules、plugins 和 configuration 作为核心概念；CodeQL 官方把分析明确拆为建库、执行查询、解释结果三步。[E01][E04] GitHub Copilot code review 是最接近的对照：它也支持多语言、可收集完整项目上下文并建议修复，同时官方明确要求用人工 review 补充，因为它会漏掉问题或 hallucinate false positive。[E02][E03] GitHub Code Quality 则代表混合路线：已知 anti-pattern 用确定性 CodeQL 规则，其余问题再用 AI，并配合 coverage、ruleset 和组织级界面。[E05]

### 4.2 brooks-lint 的实际位置

- **[确认] 它明确定位为补充而不是替代 linter**：最合理的组合是让 ESLint/CodeQL 一类工具负责可编码、可重复的规则与数据流问题，让 brooks-lint 负责需要跨文件语义、设计意图和权衡判断的问题。[R02][E01][E04]
- **[推断] 最有辨识度的资产不是模型，而是 rubric**：任何具备仓库工具的宿主模型都可以读取这些文件；项目的差异化集中在十二书映射、风险 taxonomy、false-positive guards、mode workflow 和报告协议，而非专有推理引擎。[R08][R09][R10][R11]
- **[推断] 可移植性与一致性互相牵制**：纯 Markdown 让部署简单，也使行为取决于宿主是否正确发现 Skill、提供足够上下文并严格遵循步骤。专用静态分析器较难跨语言，但执行语义更固定。[R25][R26][R28][R32]
- **[确认] 当前 evidence 更适合证明“工程化包装”，不适合证明“诊断优越性”**：仓库能重复证明 parser 和结构契约，却没有公开、可重放的 94/16 raw comparison，也没有把 live model eval 纳入 CI。[R02][R44][R47][R49][R50]

### 4.3 历史与维护语境

历史设计文档显示项目曾以“大型组织扩展”和较早版本目标组织功能；当前权威实现已发展到六个 Skills、十二类风险、GitHub Action、SARIF、strictness、history 和多宿主分发。历史 spec 只能解释演进意图，不能覆盖当前源码。[R05][R07] Release Skill、版本引用脚本和 validator 把 `package.json` 版本同步到 manifests、README 与 changelog，说明维护者重点防止发布资产漂移；是否具有持续社区维护能力则因 GitHub API 限流而没有实时 issue、star、contributor 数据支持。[R03][R48][R51][R52][R55]

<a id="limitations"></a>
## 5. Open questions / Limitations

### 5.1 已确认限制

1. **CI 的“无 diff 全库扫描”没有源码输入**：找不到 diff 时，`ci-review.mjs` 只发送一句 `Scope: no diff detected — full codebase scan`，请求没有仓库文件、检索工具或 agent loop；因此该分支不能按字面执行完整 codebase scan。[R39]
2. **GitHub Action 的 `sweep` 不能实现交互式自动修复**：action 接受 `sweep` mode，但 CI 只进行一次无工具的 Messages API 调用；没有编辑文件、运行测试、等待同意或复扫的执行通道。[R24][R33][R39]
3. **CI gate 信任模型分数**：`ci-review.mjs` 用 `/Health\s+Score/` 正则提取数字，不从解析出的 severity 重新计算；模型若算错、漏写或输出与 findings 不一致，threshold 和 regression gate 会继承该结果。[R39][R41]
4. **Live eval 的判定粒度有限**：runner 主要比较期望 risk code 是否出现、无风险场景是否保持无 code、是否出现 score；它不自动评估 symptom 是否真实、source 是否准确、consequence/remedy 是否合理，也不在默认 CI 中运行。[R43][R44][R49]
5. **书籍归因没有自动真值校验**：仓库没有书籍全文；validator 检查书名、数量、章节和引用结构，贡献指南允许新增 citation 而不要求代码或测试。因此来源映射可追踪，但其学术/文本准确性未由仓库独立证明。[R09][R48][R50]
6. **跨平台验证不完整**：维护者只声明 Claude Code、Gemini CLI、Codex CLI 经验证；另外八个平台只验证 installer/file layout。相同文件被发现不等于相同 scope、tool use、config parsing 或输出。[R02][R32]
7. **报告模式可能产生项目写入**：共享规则要求评分后追加 `.brooks-lint-history.json`，triage 还会更新 `.brooks-lint.yaml`；用户若期望纯只读 review，需要宿主阻止或明确跳过这些步骤。[R08][R42]
8. **供应链与数据边界需要使用者决定**：`curl | bash` 会联网 clone 并复制文件；GitHub Action 会把 diff 发往 Anthropic。Security 文档公开了这些边界，但没有使其对所有私有代码策略自动合规。[R32][R33][R53]

### 5.2 来源与契约冲突

- **[冲突] `94% vs 16%` 的可复现性表述**：README 先把 comparison table 称为 “illustrative”，紧接着写 “These numbers are deterministic and you can reproduce them locally”；后续 honesty 段又限定“只有 parser numbers 精确可复现，live measurements 会波动”。CONTRIBUTING 说明 94% 是独立三场景 head-to-head，但仓库未提供原始输入、输出、grader 或重放命令。本报告因此只把 94/16 视为未独立验证的项目声明。[R02][R50]
- **[冲突] Health Score 的确定性要求与执行机制**：`health-guide.md` 要求“同一 codebase 两次运行必须一致”，但 findings 和 severity 由单次模型生成，CI 没有确定性 finding engine，也不重算 score。公式可以确定，整个 dashboard 目前没有机制保证确定。[R23][R39]
- **[冲突] 通用能力名称与执行环境**：交互式 `sweep` 契约包含确认、编辑、测试和回滚，而 GitHub Action 暴露同名 mode，却只有文本生成能力；两个入口的同名模式并非功能等价。[R24][R33][R39]

### 5.3 合理推断

- **[推断] 大 diff 或大仓库会遇到上下文上限**：CI 直接把完整 diff 放入单次请求，没有分块、检索或降级策略；输入超过模型上下文时可能失败，接近上限时也可能牺牲跨文件关联。代码只固定输出 `max_tokens: 4096`，没有公开规模基准。[R39]
- **[推断] 模型和宿主升级会造成行为漂移**：默认 model ID、宿主工具集和 prompt 遵循变化都可能改变 findings；当前冻结语料只保护 parser，structural eval 只保护 schema，无法捕获这种漂移。[R39][R43][R45][R47]
- **[推断] Markdown 配置契约可能在宿主间产生差异**：交互路径要求 Agent 自行解析 YAML、glob、日期和 suppress 规则，没有共享的执行 parser；不同模型或工具可能解释不同。[R08]

### 5.4 仍然开放的问题

- **[未知]** 在真实、跨语言、跨规模代码库上，各 R/T 风险的 precision、recall、严重度一致率和对 human review 的增益是多少？57 个 curated 场景不能回答总体误报/漏报率。[R44][R46]
- **[未知]** 十二本书的每一条 principle/smell 映射是否经原文、版本、章节或页码系统核对？仓库现有 citation 粒度不一致。[R09][R10][R11]
- **[未知]** 不同宿主、模型、版本、temperature/default sampling 下，同一 commit 的 finding 稳定性和 score 方差是多少？现有来源没有跨运行实验。[R23][R44]
- **[未知]** 三场景 `94% vs 16%` 的样本选择、grader rubric、重复次数、模型版本和完整输出是什么？缺少这些资产，无法判断外部效度或复现结果。[R02][R50]
- **[未知]** 书籍摘要与引用的版权/许可边界是否经过法律审查？仓库代码和文本声明 MIT，但本调查未发现专门的第三方内容许可说明，也未进行法律判断。[R04][R09]
- **[未知]** 实时 GitHub 维护指标如何？未认证 GitHub API 在调查时触发 rate limit，因此未把 stars、open issues、contributors 等易变数据写入事实结论。[R55]

<a id="sources"></a>
## 6. Sources

### 6.1 目标仓库：固定 commit `814174c`

- **[R01] Commit snapshot** — 固定调查 revision、提交时间和 release commit，避免把后续变更混入结论。
- **[R02] README** — 项目定位、功能、benchmark 声明、安装平台和验证状态。
- **[R03] `package.json`** — 版本、ESM、脚本、Node 包元数据和 Anthropic SDK 版本。
- **[R04] LICENSE** — MIT 许可与 copyright 年份。
- **[R05] CHANGELOG** — v1.4.3 与历史功能演进。
- **[R06] `docs/getting-started.md`** — 通用安装、调用与平台入门路径。
- **[R07] 历史 v3 design spec** — 早期“大型组织扩展”设计背景；仅用于历史语境。
- **[R08] `_shared/common.md`** — Iron Law、项目配置、scope、报告、评分、history 与 triage 契约。
- **[R09] `_shared/source-coverage.md`** — 十二本书及 encoded / do-not-ignore / do-not-over-flag 映射。
- **[R10] `_shared/decay-risks.md`** — R1–R6 的 canonical 定义、来源、severity 和 false-positive guard。
- **[R11] `_shared/test-decay-risks.md`** — T1–T6 的 canonical 定义、来源、severity 和 false-positive guard。
- **[R12] `brooks-review/SKILL.md`** — PR review 路由与共享文件加载顺序。
- **[R13] `brooks-audit/SKILL.md`** — architecture/onboarding 路由。
- **[R14] `brooks-debt/SKILL.md`** — tech debt 路由。
- **[R15] `brooks-test/SKILL.md`** — test quality 路由。
- **[R16] `brooks-health/SKILL.md`** — dashboard 路由。
- **[R17] `brooks-sweep/SKILL.md`** — full sweep 路由与交互式修复边界。
- **[R18] `pr-review-guide.md`** — diff 分析步骤和 PR 专用检查。
- **[R19] `architecture-guide.md`** — 架构 audit、依赖图和结构风险流程。
- **[R20] `onboarding-guide.md`** — 无 Health Score 的 codebase tour 变体。
- **[R21] `debt-guide.md`** — tech debt 分析与 Pain × Spread。
- **[R22] `test-guide.md`** — test suite map 与测试风险流程。
- **[R23] `health-guide.md`** — 四维权重、finding cap 和确定性要求。
- **[R24] `sweep-guide.md`** — 用户确认、修复、测试、回滚与复扫循环。
- **[R25] Claude plugin manifest** — Claude Code plugin identity、skills、commands 与 hooks 注册。
- **[R26] Codex plugin manifest** — Codex 分发元数据。
- **[R27] Claude marketplace manifest** — marketplace 包装和版本引用。
- **[R28] Gemini extension manifest** — Gemini CLI 的 skills/context 注册。
- **[R29] `hooks/hooks.json`** — SessionStart hook 注册。
- **[R30] `hooks/session-start.mjs`** — Claude 短命令生成逻辑。
- **[R31] `hooks/session-start`** — hook shell 入口。
- **[R32] `scripts/install.sh`** — 平台目录映射、flat copy、`curl | bash` 与 clone 行为。
- **[R33] GitHub composite action** — API key、model、CI 调用、comment、SARIF 和 quality gates。
- **[R34] GitHub Action example** — 消费方 workflow 的典型接法。
- **[R35] Cursor setup** — Cursor 安装与文件发现说明。
- **[R36] Copilot setup** — GitHub Copilot skill 接入说明。
- **[R37] Pi setup** — Pi 安装与调用说明。
- **[R38] `assemble-prompt.mjs`** — CI/live eval 共用的 system prompt 拼装。
- **[R39] `ci-review.mjs`** — diff 选择、单次 Anthropic 调用、score 提取和 CI 输出。
- **[R40] `report-parse.mjs`** — Markdown finding 的确定性解析与风险目录。
- **[R41] `ci-gate.mjs`** — score、severity 和 regression gate 判定。
- **[R42] `history.mjs`** — history 读取与 trend 计算。
- **[R43] `run-evals.mjs`** — 57-scenario structural validation，不调用模型。
- **[R44] `run-evals-live.mjs`** — live model 调用、risk-code presence 分类和通过率统计。
- **[R45] `benchmark.mjs`** — parser/SARIF frozen-corpus benchmark 逻辑。
- **[R46] `evals/evals.json`** — 57 个正例、反误报与 score-suppression 场景。
- **[R47] `evals/benchmark-corpus.json`** — 30 份冻结报告、truth inventory 与方法说明。
- **[R48] `validate-repo.mjs`** — 版本、manifest、风险数、guide、hook 与 eval coverage 一致性校验。
- **[R49] `validate.yml`** — Node 20/22/24 CI job 及实际运行的 validation/test/benchmark/eval 命令。
- **[R50] CONTRIBUTING** — citation/eval 贡献规则，以及 94% 三场景 benchmark 与 eval suite 的分离说明。
- **[R51] Release Skill** — release 前的版本、测试、manifest 和 changelog 流程。
- **[R52] `version-refs.mjs`** — 版本引用发现与同步范围。
- **[R53] SECURITY** — prompt、hook、installer、Anthropic API 和静态站点的信任边界。
- **[R54] `commands/` directory** — 六个 Claude command wrapper；确认其只转读对应 Skill。
- **[R55] GitHub REST repository endpoint** — 调查时因未认证 rate limit 失败；未为任何事实提供实时仓库元数据。
- **[R56] `validate-repo.test.mjs`** — 仓库的 Node test declarations 及 validator/parser/action/install 回归覆盖。

### 6.2 领域对照的一手资料

- **[E01] ESLint Core Concepts** — parser、AST、rules、plugins 和 configuration 的官方定义。
- **[E02] GitHub Copilot code review concepts** — 多语言 review、建议修复、完整项目上下文和必须人工验证的官方说明。
- **[E03] GitHub Copilot Agents responsible use** — 漏报、false positive/hallucination、不准确或不安全建议等限制。
- **[E04] CodeQL overview** — database creation、QL query execution、result interpretation，以及 AST/data/control-flow 表示。
- **[E05] GitHub Code Quality concepts** — 确定性 CodeQL 规则与 AI analysis 的混合、coverage 和 ruleset gate。

### 6.3 探索覆盖

| ID | 报告位置 | 证据状态 |
|---|---|---|
| P01 项目身份与状态 | [Summary](#summary)、[Key facts](#key-facts)、[历史与维护语境](#context) | 已确认；实时 GitHub 指标阻塞已注明 |
| P02 问题与价值主张 | [Summary](#summary)、[实际位置](#context) | 项目自述与分析结论已分开 |
| P03 知识与诊断模型 | [Key facts](#key-facts)、[组件职责](#structure) | 已确认；书籍原文未独立核验 |
| P04 功能表面 | [Key facts](#key-facts) 六模式表 | 已确认 |
| P05 仓库与组件结构 | [How it works / Structure](#structure) | 已确认 |
| P06 端到端工作机制 | [两条运行路径](#structure) | 已确认交互与 CI 路径 |
| P07 Finding 与 Health Score | [Key facts](#key-facts)、[关键机制](#structure) | 规则/算术已确认；模型判断已区分 |
| P08 引用可信度 | [关键机制](#structure)、[已确认限制](#limitations) | 可追踪性已确认；准确性未知 |
| P09 评测与效果声明 | [Key facts](#key-facts)、[来源与契约冲突](#limitations) | 资产已统计；94/16 未复现 |
| P10 分发与平台兼容 | [Key facts](#key-facts)、[实际位置](#context) | manifest/布局已确认；八平台 E2E 未验证 |
| P11 质量与维护机制 | [Key facts](#key-facts)、[历史与维护语境](#context) | CI/validator 已确认 |
| P12 领域背景与替代方案 | [Context](#context) | 官方一手资料对照 |
| P13 限制与开放问题 | [Open questions / Limitations](#limitations) | 事实、推断、未知、冲突已分开 |
| P14 报告综合与覆盖检查 | 本表与六个主章节 | 已覆盖 |

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
