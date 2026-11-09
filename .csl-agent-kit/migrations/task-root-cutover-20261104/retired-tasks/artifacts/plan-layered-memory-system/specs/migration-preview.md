# Memory 迁移导入预览

预览身份：`3e5a0b293d2275e9b93d7564396eeb81c462bdb86d750d3213a38f5c5d02ea42`。完整机器可核对清单：["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/plan-layered-memory-system/specs/migration-reviewed.json"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/plan-layered-memory-system/specs/migration-reviewed.json)。

拟导入 **48** 条项目级记忆；**2** 个单元只保留在源备份；**0** 个单元尚待审核。

本阶段不修改用户级记忆，不删除原文件，不创建激活标记，也不声称旧消费者已经退出。所有源文件都会在项目 Memory 的隐藏迁移目录保存完整快照。确认绑定本预览身份；源内容变化会拒绝执行。

这里的逐项审核是当前 Agent 对迁移内容的整理，不代表用户已经批准，也不代表整个系统已通过独立审查。

## 源快照

- ["/Users/caishilin/Desktop/personal/skills/tasks/context.md"](file:///Users/caishilin/Desktop/personal/skills/tasks/context.md)：`976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0`
- ["/Users/caishilin/Desktop/personal/skills/tasks/lessons.md"](file:///Users/caishilin/Desktop/personal/skills/tasks/lessons.md)：`9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6`

## 逐项变化

### 01 · 文件前言

处置：仅保留源备份，不建立条目。

理由：只有旧容器标题，没有独立知识；保留在完整源备份中，不创建空记忆。

核对依据：tasks/context.md 的文件前言

### 02 · Project Core

处置：导入 Project Memory。

理由：保留项目定位、职责及权威边界；取消 Core 层级和旧 Context/Lessons 维护入口，不把已决定的 Memory 架构写成已完成迁移。

核对依据：package.json；AGENTS.md；tasks/tasks/plan-layered-memory-system.md#Decisions

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-5b681e886bf85282d88e.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-5b681e886bf85282d88e.md)

标题：CSL Agent Kit 项目定位与架构

类型：`fact`；检索摘要：理解项目用途、共享工作流、宿主集成和记忆职责时读取；权威代码与正式规格优先。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
# 项目定位

CSL Agent Kit 为 Codex、Claude Code、Cursor 与 Pi 分发共享 skills、rules、hooks 和 extensions，跨宿主复用 Agent 工作流。项目定位与发布边界以 package.json、README.md 和 Agent Hooks 契约为准。

# 主要职责

- skills/ 是可分发能力；.agents/skills/ 是项目专用能力。Skill package 以 SKILL.md 为运行时契约。
- skills/meta/agent-hooks/ 提供可注入的稳定行为契约；具体流程由各 Skill 和共享协议持有。
- skills/meta/task/、task-plan/、task-queue/ 管理 canonical task；tasks/tasks/<slug>.md 是任务权威记录，tasks/tasks.md 只是 newest-first 导航。
- pi/ 提供 Pi 集成；bin/、安装脚本和宿主 manifest 负责分发与发现。
- 已决定由统一 Memory 完全替代 Context/Lessons。Memory 区分 User/Project，不设 Core/Normal；首版自动维护只接入 Pi，实际激活及迁移状态须现场核对。

# 知识边界

- Task 保存当前目标、进度、证据与结果；Memory 保存经核对的长期事实、偏好、经验与引用；Topic 保存明确建立的长期共享规格。
- 记忆不是权威源码、schema、测试结果、正式决定或授权的替代品；冲突时回查对应权威。不得存储秘密、私密推理、推测或短期执行状态。
- Task Agent 自主按需读取；常规维护由独立 Memory Agent 承担。用户级修改必须展示具体内容与理由并获得明确授权；项目级在来源、审计和恢复约束下维护。
- Skill package 的规则与运行契约保持项目既有英文约定；用户回复与报告采用用户语言。
- 独立 adversarial review 只在用户明确请求时运行；普通验证不能冒充独立审查，R2 的必要 task-review 仍遵循 Task 协议。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## Project Core

### Purpose
- CSL Agent Kit 为 Codex、Claude Code、Cursor 与 Pi 分发共享的 skills、rules、hooks 和 extensions，使同一套 Agent 工作流可跨宿主使用；权威入口为 `package.json`、`README.md` 与 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`。

### Global Vocabulary
- Skill package 是以 `SKILL.md` 为运行时契约的可发现能力；共享包位于 `skills/`，项目专用包位于 `.agents/skills/`。
- Project Core 是 session start、resume 与 compaction 时始终加载的项目级最小模型；Context Pack 是具体任务按需检索的完整组件或工作流模型；权威契约为 `skills/meta/task-context/SKILL.md`。
- Canonical task 是 `tasks/tasks/<task-slug>.md` 中的权威任务记录，`tasks/tasks.md` 仅是 newest-first 导航索引；权威实现为 `skills/meta/csl-tasks/shared/lib/task-core.js`。

### System Map
- `skills/meta/agent-hooks/` 提供受支持宿主自动注入的稳定 CSL Agent Kit Contract；具体操作流程由对应 Skills 和共享协议持有。
- `skills/` 提供可分发 skills；`skills/meta/task/`、`skills/meta/task-plan/` 与 `skills/meta/task-queue/` 管理任务生命周期，`skills/meta/task-context/` 与 `skills/meta/task-lessons/` 管理 Context 与 Lessons。
- `pi/extensions/` 提供 Pi 宿主集成；`bin/`、`scripts/` 与各宿主 manifest 负责安装、发现和分发。
- `tasks/` 保存 workspace-local Context、Lessons、canonical task records 与任务产出的 reports。

### Global Invariants
- Skill package 的 `SKILL.md`、runtime references、prompts、templates 与 eval-facing prose 使用英文；用户回答和生成报告使用用户语言；权威约定记录在本文件的 Decisions and Conventions。
- Context 只承载已确认、项目特有、稳定且会改变未来决策的事实；任务进度归 canonical task，纠错规则归 Lessons，实时值不得缓存；权威契约为 `skills/meta/task-context/SKILL.md`。
- Context 用于跳过宽泛项目探索，不取代任务直接相关源码、测试和 Authority 验证；Authority 与 Context 冲突时以 Authority 为准。
- 独立 adversarial review 只在用户明确要求时运行；普通验证与自审不能替代，也不会自动触发该流程；权威规则为 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 与 `skills/meta/task/SKILL.md`。
```

</details>

### 03 · CTX-task-context — Workspace Context dispatch and maintenance

处置：导入 Project Memory。

理由：保留检索、知识准入、来源验证及并发防护经验；删除已被用户取消的 Core/Pack 权限和由 Task Agent 日常维护旧文件的要求。

核对依据：原 CTX-task-context 的用途与验证边界；tasks/tasks/plan-layered-memory-system.md#Target

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-042589327b4342aa11f6.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-042589327b4342aa11f6.md)

标题：Memory 检索与知识准入边界

类型：`experience`；检索摘要：检索覆盖不足、来源冲突或维护记忆时使用；保留可核对知识，不把历史机制或任务进度当作当前事实。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
# 检索与来源

短索引负责发现相关知识，正文按需读取。先按任务目标、领域、路径、约束及组件关系检索，再核对相关权威来源；查询没有结果不等于组件不存在。别名、遗漏关系或新边界出现时补充查询，不设固定检索条数上限。

需要建立项目理解时，检查项目用途与词汇、组件职责、入口与产物、控制流和数据流、权威与派生产物、跨组件约束、可观察验证信号。只探索足以支持当前决策的范围，不把普通任务升级为全仓审计。

# 进入记忆的条件

内容必须已确认、适用于对应作用域、稳定或具有明确复核触发点、能够改变未来决策、比反复重建更经济、确属记忆而非任务或规则、且来源可回查。来源存在不等于它支持当前断言。无法确认的内容留在当前任务证据缺口中，不伪装为记忆事实。

# 维护约束

独立 Memory Agent 根据会话增量维护，Task Agent 不负责提出日常维护候选。更新必须使用读取所得 revision/hash，发生冲突先重读；错误不能被当作未写入或已回滚。

删除只针对经证据证明失效的最小知识单元；合并必须保留所有有效独有信息及来源。不能按近期未使用删除。来源不可用不等于事实不存在。用户级提案必须得到用户明确授权，项目级维护保留理由、差异与恢复记录。

# 不应保存

当前进度、下一步、临时阻塞、秘密、未经证实的推测归其他载体；正式规则与流程继续由 Rules/SOP/Skill 管理。记忆检索不能制造目标接受或执行授权。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## CTX-task-context — Workspace Context dispatch and maintenance
- Scope: Workspace Context orientation, project coverage, iterative task retrieval, impact-based maintenance, local Core repair, and lifecycle consumers.
- Paths: `tasks/context.md`, `skills/meta/task-context/`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `skills/meta/task/SKILL.md`, `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`, `tests/task-files.test.mjs`
- Keywords: task context, workspace context, project core, context pack, task fingerprint, coverage, seed packs, change gate, authority, unindexed content
- Authority: `skills/meta/task-context/SKILL.md`, `skills/meta/task-context/scripts/context.js`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `skills/meta/task/SKILL.md`, `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`, `tests/task-files.test.mjs`
- Recheck: When the Context schema, task activation order, query lifecycle, write permissions, or default consumer wording changes.

### Purpose and Boundaries
- Workspace Context 让新 Agent 无需重复宽泛 repository exploration、repo-map 或架构分析即可形成正确项目模型；它不取代任务直接相关源码、测试和 Authority 验证。

### Structure
- `tasks/context.md` 是单一 canonical 文件，由始终加载的 Project Core 与任务按需选择的完整 Context Packs 组成；不生成持久 index、cache 或 selected-ID state。
- Project Core 固定包含 Purpose、Global Vocabulary、System Map 与 Global Invariants；正式 Pack 使用稳定 `CTX-*` ID、Scope/Paths/Keywords/Authority/Recheck metadata 和非空适用正文 sections。
- `scripts/context.js` 只读解析标准 Core 与正式 `CTX-*` Packs，提供 `core/index/show/validate/--self-test`；index 包含 Authority/Recheck，非标准顶层段落产生 `unindexed-context-section` warning 并保留原文，查询 stderr 与 validate JSON 均可见。Agent 负责 Task Fingerprint、语义匹配、覆盖充分性、来源验证和写入判断；结构通过不证明知识完整或准确。

### Relationships
- `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 是自动注入的稳定行为契约，要求 session 边界恢复 Context、先按 outcome 选择 task family、实质工作前完成 Task Target 对齐并消费相关 Context 与 Lessons，同时把具体操作细节留给对应 Skill 和共享协议。

### Workflows
- Session start、resume 或 compaction 先恢复最小 Core；缺失文件仍需精确提案确认。已有 Core 无效时只修复可明确划分的 Core 或安全插入缺失 Core，保留其他 Pack 和非标准内容；边界不明、证据不足或校验失败则披露并回退探索，不整文件重写。权威为 `task-context/SKILL.md` 的 Standard Context Bootstrap。
- Task Target 对齐后按任务范围检查用途与词汇、组件职责、入口与产物、数据/控制流、来源与生成关系、跨组件约束、验证信号七个维度；只持久化已确认且改变决策的事实，缺口留在任务或会话。Core-only 或缺少相关 Pack 时补齐高价值 seed Packs，普通任务不做全仓深度审计。Core 和关键 Pack 结论须能追到具体来源及符号/章节。
- 检索先按 metadata 初选，再核实来源与任务覆盖；一至三包只是初始批次，业务别名、遗漏关系或新依赖触发补检。Change Gate 在任务边界变化或来源冲突时重建 fingerprint；来源不可用时暂停依赖相关结论，不能据此认定事实不存在或直接删除。
- 自检前从本任务实际改动和新确认事实扫描 metadata index，维护集合包括已选 Pack、其他 Paths/Authority 或关系受影响的 Pack、相关 Core 和新事实；逐项选择 Add/Update/Delete/No-op。`task/SKILL.md` 的 Completion 接入此检查，Contract 只保留稳定触发；其他并行任务的 dirty files 不归本任务。

### Decision and Verification Boundaries
- Authority 与 Context 冲突时按该断言的权威范围核实；source-backed ordinary Pack 可在所属任务授权范围内自动维护，缺失文件创建及有效 Core 语义变更仍须精确内容确认。局部修复不得丢弃其他知识；删除稳定 ID 前核对活跃引用，合并保留所有独有有效知识与来源。
- 写前重读防止覆盖并行修改，失败回滚仅撤销本任务的写入；无法核实的事实不进入 Context。`evals/lifecycle_cases.json` 提供覆盖、检索、维护与恢复场景；语法、结构和事件断言不证明 Agent 行为，测试与 self-test 仅在明确授权后运行。现有非标准段落的 warning 需显式处理，不能为了零警告自动迁移历史内容。
```

</details>

### 04 · CTX-skill-quality — Built-in Skill package quality gate

处置：导入 Project Memory。

理由：保留仍有效的质量门禁职责与验证边界，不把测试源码或结构通过当作行为验证。

核对依据：skills/meta/skill-quality/SKILL.md；AGENTS.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-3f04e0f0972b0b999ca0.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-3f04e0f0972b0b999ca0.md)

标题：Skill package 质量门禁

类型：`fact`；检索摘要：修改 Skill package 后如何运行确定性质量检查，以及它不能证明哪些行为。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-skill-quality — Built-in Skill package quality gate
- Scope: 日常 Skill package 的确定性结构、资源、上下文预算与 routing fixture 验证，以及共享和项目本地 package 的检查入口。
- Paths: `skills/meta/skill-quality/`, `AGENTS.md`, `.claude-plugin/plugin.json`, `README.md`, `tests/skill-quality.test.mjs`, `tests/pi-skill-commands.test.mjs`
- Keywords: skill quality, validation, frontmatter, context budget, routing fixtures
- Authority: `skills/meta/skill-quality/SKILL.md`, `skills/meta/skill-quality/scripts/check.js`, `AGENTS.md`
- Recheck: 当 Skill package schema、routing fixture 格式、发现目录、上下文预算或日常维护门禁变化时复核。

### Purpose and Boundaries
- `skill-quality` 是仓库唯一的日常 Skill package 确定性质量门禁。
- 工具只验证声明的 package 契约；不验证非 Skill 规则，也不运行 package 脚本、项目测试、构建、打包或 telemetry。

### Structure
- `scripts/check.js <skill-dir>` 检查单个 package；`--all --workspace <workspace>` 递归发现 `skills/` 与 `.agents/skills/` 下的叶子 `SKILL.md`。共享 Skill 仍由宿主递归发现，Claude manifest 显式枚举共享叶子，项目本地 Skill 不进入共享分发。
- JSON 输出与人类输出都使用 package 级 `pass`、`warning`、`failure`；质量失败返回退出码 2，只有 warning 时返回 0，调用错误返回 1。
- 门禁验证 frontmatter、JSON/YAML、现有 `agents/openai.yaml` display metadata、资源目录和 1000-token 初始加载 warning budget；存在 `trigger_cases.json` 与 `semantic_config.json` 时执行确定性 routing 分类。

### Decision and Verification Boundaries
- 日常 Skill 修改必须逐包运行内置门禁，失败阻塞完成；warning 需要结合 package 语义评估，workflow 的完整性优先于初始加载预算。
- 聚焦行为测试、宿主发现、manifest 一致性和 package 专属验证仍由对应项目检查证明，不能由结构门禁替代。
```

</details>

### 05 · CTX-project-evals — Project-local evaluation workspace

处置：导入 Project Memory。

理由：保留项目评测布局和权限边界；已核对本地评测 Skill 仍是指向 evals 源的相对符号链接。

核对依据：.agents/skills/task-target-alignment-eval -> ../../evals/skills/task-target-alignment-eval；evals/README.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-9cdf026514a05e858751.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-9cdf026514a05e858751.md)

标题：项目评测布局与验证边界

类型：`fact`；检索摘要：维护 evals、项目专用 Skill 发现或 Task Target 评测时使用；不把静态 fixtures 当作模型行为证据。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-project-evals — Project-local evaluation workspace
- Scope: 仓库专用评测套件、共享评测脚本、生成结果边界和 project-only evaluation skills 的 canonical 存储与发现。
- Paths: `evals/`, `.agents/skills/task-target-alignment-eval`
- Keywords: project evals, task target alignment eval, gold cases, scorer, project-local skill, symlink discovery
- Authority: `evals/README.md`, `evals/scripts/check-project-evals.js`, `evals/scripts/evaluate-task-target-alignment.js`, `evals/task-target-alignment/cases.json`, `evals/skills/task-target-alignment-eval/SKILL.md`
- Recheck: 当根评测目录布局、项目 skill 发现入口、发布清单、结果持久化边界或评测 runner contract 变化时复核。

### Purpose and Boundaries
- 根 `evals/` 是项目评测 artifacts 的 canonical source，只服务当前 CSL Agent Kit 仓库；它不属于共享 `skills/` 分发树、npm 发布清单、全局安装或 Pi 共享命令枚举。

### Structure
- `evals/scripts/` 保存跨 suite 的确定性 validator／runner／scorer，`evals/<suite>/` 保存 tracked cases 与 suite 文档，`evals/skills/<name>/` 保存评测 skill 源码；各 suite 的 `results/` 是默认忽略的生成数据。
- `.agents/skills/task-target-alignment-eval` 是指向 canonical skill source 的唯一相对 symlink 发现入口。Pi 会跟随 project `.agents/skills` 目录链接，共享 CLI 只枚举根 `skills/`，因此该 skill 只在受信任的当前项目中激活。

### Workflows
- 修改评测 suite、skill 或发现边界后运行 layout check、evaluator `validate`、针对 symlink package 的 Skill Quality 和 Context validation；`--self-test` 与项目测试须当前请求明确授权。v6 `prepare` 请求不含 oracle，`workType` 区分当前探索／实现工作；等价探索用 null level 的 `continue_exploration`，不产生接受证据。`authorizedClauses` 只表示授权来源，`confirmationItems`／`goal_recheck` 表示需要的用户目标复核；`continue_unchanged` 仍需完整候选及真实接受来源，`show_continue` 仍是策略错误。scorer 检查探索误确认、实现／用户暂停漏等待、越界继续、接受复用、覆盖、原因、展示、委派和 Safety；comparison 只接受相同 v6 dataset hash，旧报告不证明当前策略。固定候选与索引不证明语义、自由生成或真实工具时序，须另获授权后观察；结果保持 provisional／report-only。权威为 `evals/scripts/evaluate-task-target-alignment.js` 和 `evals/task-target-alignment/cases.json`。

### Decision and Verification Boundaries
- Oracle cases、schema、固定 prediction samples 和确定性脚本可提交；当前 Task Target labels 在人工 adjudication 前保持 provisional／report-only。付费模型 run 需要当前用户明确授权，prediction／报告默认写入 ignored `results/`。不得保存 chain-of-thought、凭据、客户数据或未脱敏完整会话。
```

</details>

### 06 · CTX-third-party-skills — Third-party skill integration and discovery

处置：导入 Project Memory。

理由：保留第三方 Skill 来源元数据、项目与共享发现职责，以及更新时的消费者验证要求。

核对依据：.agents/skills/integrate-third-skills/SKILL.md；bin/csl-agent-kit.js

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-c1c22f866bd05d47dfff.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-c1c22f866bd05d47dfff.md)

标题：第三方 Skill 整合与发现

类型：`fact`；检索摘要：导入、更新或移动 Skill 时核对来源元数据、项目专用边界与各宿主发现入口。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-third-party-skills — Third-party skill integration and discovery
- Scope: 共享与第三方 skill 的项目内整合、来源元数据、递归发现和 Pi 特定命令接入边界。
- Paths: `.agents/skills/integrate-third-skills/`, `skills/`, `bin/csl-agent-kit.js`, `pi/extensions/csl-skill-commands.ts`, `tests/cli-install-output.test.js`, `tests/pi-skill-commands.test.mjs`
- Keywords: shared skills, third-party skills, vendor, .repository.json, recursive discovery, Pi command, host source
- Authority: `.agents/skills/integrate-third-skills/SKILL.md`, `.agents/skills/integrate-third-skills/scripts/third-party-skills.js`, `bin/csl-agent-kit.js`, `pi/extensions/csl-skill-commands.ts`
- Recheck: 共享或第三方目录布局、`.repository.json` schema、共享 skill 递归发现机制、Pi 特定命令上下文或 project-local 分发边界变化时复核。

### Purpose and Boundaries
- `.agents/skills/integrate-third-skills/` 是仅在本仓库使用的内部整合流程，不进入共享 skill 发布、全局安装或 Pi 命令发现；第三方源码则导入共享 `skills/<source-group>/<skill>/`。
- 不缓存当前第三方 skill 数量；需要清单时以共享目录中的叶子 `SKILL.md` 与 `.repository.json` 现场查询为准。

### Structure
- 每个 vendored 叶子 skill 使用 `.repository.json` 记录 `repository`、`sourcePath`、`ref`、`commit`、`license` 和 `upstreamStatus`；同一来源的许可证位于来源分组根目录。
- 共享 CLI 与 Pi 命令递归发现 `skills/` 下的叶子 `SKILL.md`，因此共享和 vendored skill 都以其 frontmatter 名称公开；project-local `.agents/skills/` 不进入该枚举。
- `csl-skill-commands.ts` 默认只把 slash alias 转为 skill 请求；需要不可从 Agent 上下文可靠恢复的 Pi 宿主事实时，可在发送请求前附加宿主来源边界。`archive` 使用调用前的 session file、workspace 与 active leaf，避免把归档命令自身或压缩摘要当作原始对话。

### Workflows
- `third-party-skills.js status` 按来源与 ref 复用临时上游检出并比较导入 commit；`diff` 区分导入后的上游变化与当前上游相对本地副本的差异，只有 `--patch` 输出逐行补丁。
- 导入、更新或移除第三方 skill 时使用项目内整合流程，并同步验证来源元数据、共享发现、当前 manifests、README、测试与发布包内容。
```

</details>

### 07 · CTX-pi-settings — Pi 通用设置与审查配置

处置：导入 Project Memory。

理由：保留配置优先级、审查模型解析和重载缓存边界；这些配置独立于 Memory 模型设置。

核对依据：pi/lib/csl-settings.ts；pi/extensions/csl-settings.ts

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-66a03bd93c7948718f2d.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-66a03bd93c7948718f2d.md)

标题：Pi 通用设置与审查模型配置

类型：`fact`；检索摘要：处理 Task 模式、审查配置、设置面板或同进程重载时读取；不要与 Memory 模型配置混淆。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-pi-settings — Pi 通用设置与审查配置
- Scope: CSL Agent Kit 的 Pi 通用设置面板、审查配置存储与启动参数解析边界。
- Paths: `pi/extensions/csl-settings.ts`, `pi/lib/csl-settings.ts`, `tests/pi-settings.test.mjs`
- Keywords: Pi, csl-settings, review model, thinking, parent inheritance, csl_review_config
- Authority: `pi/extensions/csl-settings.ts`, `pi/lib/csl-settings.ts`, `README.md`
- Recheck: 当设置字段、数据目录、Pi 工具指引或 subagent 的模型后缀覆盖语义变化时复核。

### Purpose and Boundaries
- `/csl-settings` 是通用配置入口；`review.model` 与 `review.thinking` 保存到 `CSL_AGENT_KIT_HOME` 或默认 CSL 用户数据目录的 `settings.json`，不修改 Pi 或 pi-subagents 的配置。Task 确认模式也在该面板及 `/task-mode` 提供操作；共享解析器位于 `skills/meta/csl-tasks/shared/lib/task-mode.js`，跨宿主 CLI 位于同组件 `scripts/task-mode.js`。
- Task 模式采用 session > project > global > 默认 confirm，各层新值为 solo／confirm／inherit，solo 对外名称 SOLO；已有 autonomous 存储只读归一为 solo，不自动改写用户文件。全部位于用户数据目录，项目按 realpath 摘要隔离，会话按宿主、工作区和真实会话 ID 摘要隔离。项目配置不是仓库内授权；Pi 每轮通过 Contract Hook 重读，原生 Codex／Claude 在 SessionStart 读取。无效配置降回确认并报告错误，保存成功不证明 Hook 已启用。
- `skills/meta/task-mode/` 提供跨宿主共享 Skill，复用共享配置 CLI；Codex 通过递归 skills 根发现，Claude manifest 显式登记。Skill 查询须区分已保存设置与当前会话实际生效；真实会话身份不可用时仅解析项目／全局，不宣称覆盖会话层。Pi 自动别名跳过 task-mode，由设置扩展独占 `/task-mode`，原生 `/skill:task-mode` 仍可调用 Skill。
- Pi 的 jiti 以 moduleCache=false 重载 TypeScript，但原生 createRequire 的 CommonJS 缓存不会随之失效。`pi/lib/csl-settings.ts` 每次重新加载时只清除无状态 task-mode 直接依赖的缓存，确保 /reload 读到当前枚举；不清理无关模块，不改用户配置。检查边界是同进程升级模块后重载，而非仅验证新进程 import。
- `csl-settings` 使用原生 setStatus 的独立 csl-task-mode 键在 TUI 底栏显示解析模式与来源；启动／恢复／重载、树导航、每轮开始／结束及设置修改后重读，shutdown 只清理自己的键。无定时器，非 TUI 不显示，配置错误显示 CONFIRM · config error；显示配置解析结果，不证明进行中的模型请求已应用新规则。自定义 footer 是否展示 extension statuses 仍由该 footer 决定。
- `csl_review_config` 是只读解析工具，不是启动器。其工具指引要求 CSL 审查的主 Agent 将返回的 `launch.model` 放到实际 Reviewer 子调用中；未设置的项读取调用时父会话实际值。该接入不拦截所有 subagent，不覆盖 Editor，也不会改变已有子 Agent 的恢复契约。
```

</details>

### 08 · CTX-pi-task-overlay — Pi task overlay rendering

处置：导入 Project Memory。

理由：保留任务面板的权威输入、会话关联、刷新与显示边界。

核对依据：pi/extensions/csl-task-overlay.ts

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-a22114c4b3b073184f5e.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-a22114c4b3b073184f5e.md)

标题：Pi 任务面板与会话关联

类型：`fact`；检索摘要：修改任务 widget、focus、链接或刷新行为时使用；面板只导航，不拥有任务状态。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-pi-task-overlay — Pi task overlay rendering
- Scope: Pi task widget parsing, session focus persistence, progress rendering, refresh lifecycle, mode boundaries, and clickable task titles.
- Paths: `pi/extensions/csl-task-overlay.ts`, `tests/pi-task-overlay.test.mjs`, `tasks/tasks.md`, `tasks/tasks/`
- Keywords: Pi, task overlay, session focus, custom entry, widget, OSC 8, hyperlink, progress, refresh, RPC
- Authority: `pi/extensions/csl-task-overlay.ts`, `tests/pi-task-overlay.test.mjs`
- Recheck: The canonical task index format, Pi session-entry or widget API, terminal hyperlink capability detection, or refresh lifecycle changes.

### Purpose and Boundaries
- 任务面板以 `<ctx.cwd>/tasks/tasks.md` 和任务正文作为工作区共享状态与 Target 进度来源，不修改任务 Markdown；每个 session 的 focused task 只写入该 Pi session 的 `csl-task-focus` custom entry。

### Structure
- `session_start` 与 `session_tree` 从当前 branch 的最新 focus entry 恢复关联；`task_focus` 工具通过 prompt guidance 供 Agent 在创建、恢复、重开或激活 canonical task 后自动关联，`/task-focus <task-id|clear>` 提供手动切换或清除，`/tasks` 按索引顺序截取最近 20 个任务后分状态打印。
- 有有效关联时，TUI 把该任务单列于 `This Session`，其余近期任务列于 `Workspace`；无关联或失效关联回退普通共享列表。已完成任务保持关联，直到被替换或清除。
- TUI 对非空任务只注册一次自定义 Component，每 5 秒清除当前工作区进度缓存、重读任务并原位更新；空列表注销组件，重复启动释放旧 timer，`session_shutdown` 最终清理。
- 支持 OSC 8 的 TUI 将 Tasks/Workspace 标题链接到当前工作区 `tasks/tasks.md`，Topics 标题链接到 `tasks/topics.md`；This Session 标题保持纯文本。在任务 widget 与 `/tasks` 通知中将 canonical `tasks/<task-slug>.md` 标题链接到对应绝对文件 URL；不支持 hyperlink 的终端及非 canonical 路径保持纯文本。RPC 忽略 session 分组并保持可序列化纯字符串数组，headless 不注册 widget。
- 任务条目只展示标题、状态和 Target 进度；`This Session`、`Workspace`、无有效 focus 的普通列表、RPC widget 与 `/tasks` 均不读取或展示恢复详情。Execution Log／Plan／Block 的完整内容由 canonical task 或 CLI 非 JSON `show` 承载；JSON `recovery` 仅兼容旧字段，面板不依赖 `recoveryOf(text)`。查看导航不会改写任务记录；日志读取契约见 `skills/meta/task/SKILL.md#execution-log`。

### Decision and Verification Boundaries
- 只有符合 `tasks/[a-z0-9-]+.md` 的 canonical index path 才能被关联或生成文件链接；`pathToFileURL` 负责绝对路径和特殊字符编码。
- `tests/pi-task-overlay.test.mjs` 覆盖 focus 写入、恢复、切换、清除、完成后保持、失效回退、原位刷新、timer 清理、进度、文件 URL、无 hyperlink 终端、RPC 和 headless 行为。
```

</details>

### 09 · CTX-task-workflows — Canonical task workflows

处置：导入 Project Memory。

理由：保留 Task 生命周期、目标对齐、审查与证据契约；把迁移后的记忆读取入口改为 Memory，不保留独立 Context/Lessons 日常维护。

核对依据：skills/meta/task/SKILL.md；skills/meta/csl-tasks/shared/protocols/task-target-alignment.md；tasks/tasks/plan-layered-memory-system.md#Decisions

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-4a9856c5741870ed4527.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-4a9856c5741870ed4527.md)

标题：Canonical Task 工作流与证据边界

类型：`fact`；检索摘要：理解任务族、Target 对齐、执行日志、R0/R1/R2 审查及证据失效时使用；实际契约仍以共享协议为准。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-task-workflows — Canonical task workflows
- Scope: 跨宿主 canonical task 的单任务执行、只读计划、队列执行、main-session L0–L4 Task Target gate、R0／R1／R2 Review 分级与证据失效、mandatory task-review remediation loop 与 per-finding stall protection、delegated child alignment inheritance、S0／S1 Safety Overlay、Queue title invariants、状态证据及完成门禁。
- Paths: `skills/meta/task/`, `skills/meta/task-review/`, `skills/meta/task-plan/`, `skills/meta/task-queue/`, `skills/meta/csl-tasks/shared/`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `tests/csl-tasks-core.test.mjs`, `tests/task-files.test.mjs`
- Keywords: task, task-review, review gate, Review ledger, no-progress streak, stall, Blocked, Passed, In Review, task-plan, task-queue, canonical task, Task Target, Authorization Ledger, interaction owner, delegated child, L2 checkpoint, L4 change approval, Safety Overlay, Queue title, Kind Queue, legacy Auto, Execution Log, 决策记录, 中断恢复
- Authority: `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`, `skills/meta/csl-tasks/shared/protocols/task-review-grading.md`, `skills/meta/task/SKILL.md`, `skills/meta/task-review/SKILL.md`, `skills/meta/task-plan/SKILL.md`, `skills/meta/task-queue/SKILL.md`, `skills/meta/csl-tasks/shared/lib/task-core.js`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`
- Recheck: 当公开 skill identity、task activation timing、Task Target 对齐或确认路径、task record schema、状态转换、父子图或完成门禁变化时复核。

### Purpose and Boundaries
- `task` 从最早的实质准备阶段开始管理一个可独立验收 outcome，`task-plan` 只研究并形成 decisions-only handoff，同时对齐计划任务最终要实现的 Target；该 Target 的接受不授权执行。`task-queue` 用有序父子 records 串行推进多个 outcome，并在父级执行独立 integration gate。
- `Task Summary` 是 Agent 在完成自检与 assessment 前维护的单一改动摘要章节，不是 CLI 自动生成字段；按实际修改的组件分段，记录组件根目录与具体变化，不替代 Result／Verification。Queue parent 只记录 parent-owned 改动；正文变化仍走 `sync` 与证据失效流程。权威为 `skills/meta/task/SKILL.md` 和 `skills/meta/task-queue/SKILL.md`。
- 常驻Contract只保留稳定触发、顺序、授权与停止边界；模式存储/确认分级细节归共享Target协议，assessment细节归Task/Grading，ledger格式/计数/恢复归Task与Review Workflow。独立分析本身可验收时走Task，面向后续实现的调查才走Task Plan；详细规则仍须通过选定Skill加载，去重不豁免任何门槛。

### Structure
- 三个 workflow 直接位于 `skills/meta/`，进入或在上下文丢失后恢复时均须读取 `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`；该普通 Markdown runtime contract 是全部 Target 对齐语义的唯一详细 Authority，不参与 skill discovery。各 consumer 只拥有激活时机、workflow-specific Target 含义、对齐前 lifecycle writes 与对齐后下一步。
- 三个 workflow 共享 `skills/meta/csl-tasks/shared/lib/task-core.js` 与 `skills/meta/csl-tasks/shared/scripts/csl-tasks.js`；core 维护 Markdown 状态、证据、父子关系和索引一致性，并通过 `task-evidence.js`／`task-reports.js` 校验明确登记的文件快照和报告。它不持久化会话 alignment 或 confirmation，不启动嵌套宿主 CLI、worker、daemon 或任意验证命令。
- Core 将 Status、Kind、可选 Artifacts 与 Parent 投影到 canonical record 顶部的 `Field`／`Value` 两列表格，状态值保持 `<state> (<YYYY-MM-DD HH:MM>)`；兼容读取旧式 `Name: value` 元数据，并仅在该记录下次写入时转换，展示格式转换不改变 review fingerprint。canonical `#`／`##` record headings 固定从 column zero 开始，indented 或 container-nested headings 仅是内容。Core 在 `tasks/tasks.md` 维护对应标题、状态与 `tasks/<task-slug>.md` 链接；record 在索引不一致时仍是权威。
- 新队列父任务只写入 `Kind: Queue`；读取现有历史 `Kind: Auto` 时在内存中归一为 queue 以继续执行，但创建新记录不接受 `auto`。
- Task／Plan／Queue 在所属 canonical record 的单一 `Execution Log` 按重要事件追加发现、决策依据、实际结果和修正，使用递增序号指明取代关系，不再维护三个即时恢复字段。当前计划与约束仍由 Plan／Decisions／Target 承载，验收仍由 Result／Verification 承载；Queue 父日志不复制子日志或替代 `next`。权威为 `skills/meta/task/SKILL.md#execution-log` 及 Plan／Queue 的引用。
- Execution Log 复用普通 Markdown 章节与 `sync`／`check`，`task-core.js#reviewTaskFingerprint` 默认覆盖日志，不豁免追加产生的证据失效；审查期间冻结，终态记录不重复追加进日志。`csl-tasks.js` 非 JSON `show` 输出完整正文；`recoveryOf(text)` 与 JSON `recovery` 仍只兼容旧 Plan 字段和 Block，不投影或推断新日志。历史无日志记录仍可读，不批量迁移；恢复需核对当前计划、证据及真实产物，缺日志不证明外部动作未发生。
- Core 在每次写入 Task／Plan／Queue record 时，按对应 `tasks/artifacts/<task-id>/` 是否为目录，在顶部元数据表维护 `Artifacts` 行及 `[Artifacts](../artifacts/<task-id>/)` 链接；不会创建空目录或批量回填，读取与校验不写入。仅这个固定格式的顶部导航字段不参与 review fingerprint，正文中的同类文本仍参与；`sync` 的既有证据失效行为不变。

### Workflows
- 默认 confirm 模式下，具体非平凡探索与文件变更都先激活／聚焦 owning record，再应用共享对齐协议。主会话的等价探索（检查、分析、研究与只读规划）用 `continue_exploration`，无需目标确认或先前接受证据；明确用户暂停、真正阻塞的用户决策和承诺变化仍保留对应检查。探索可写任务记录及明确请求的调查报告，不能擅自实施；“调查并修复”属于实现。用户后来要求执行同一 canonical plan 时正常应用实现确认，只有已展示且真实接受、未变仍适用的完整实现 Target 才可复用。探索结束不等于 Target 接受。实现的首次、实质修订与澄清收敛后非平凡等价 Target 仍完整展示并等待；L3／L4、接受来源和组合效果检查保留。子会话按完整当前 Plan packet 继续或返回主会话，不自行询问用户；范围内调查重排和缺失接受不单独制造探索暂停。协议选中探索继续后可按需读取任务相关 Memory 与直接来源；日常记忆维护由独立 Memory Agent 承担。权威为 `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`。
- 主 Agent 按原始要求、有效修订与已接受约束自检并记录逐 Target 证据后，按独立于 Task Target 的 R0／R1／R2 协议分类实际结果：R0 无交付物变更；R1 是结果明确、影响可界定、低风险且验证充分的简单变更，包括符合条件的小范围逻辑修改；R2 是复杂、高风险或存在重要不确定性的变更。R0／R1 在没有显式或既有审查义务时可 `Skipped`，R2 或显式普通审查进入 Required／In Review／fresh 只读 `task-review` 修复循环。R2 的显式 adversarial approval 需保留 ordinary pass；R0／R1 可因显式 adversarial 请求直接进入 Required／In Review／Approved。所有等级保留最终验证。
- `assess-review` 在 In Progress 写入唯一 `task-review-assessment/v1` Review Assessment，保留等级、Current／Stale、具体依据、外部内容身份、自检证据和任务指纹；R1 另需四项成立依据。core 校验结构、等级／gate 一致性及任务记录指纹，不执行语义评级、检查命令或外部文件监控。`snapshot <id> --file ...` 为明确文件范围生成不可变 `task-snapshot/v1` manifest，记录文件字节与 Git HEAD/index 身份，返回 `snapshot:...#<sha256>`；此类身份在 assessment 和终态写入现场核对，旧自由文本身份保留 owner-attested 边界。`sync`、Result 更新、reopen 和相关 Queue 关系变化会使 assessment 失效、清除 Verification、移除 Skipped 或将 Passed／Approved 恢复 Required；外部内容漂移仍须刷新自检、判级与必要复审。历史记录仍可读，活动任务在新的终态 gate／完成前须有当前 assessment。最终 fresh pass 确认所有 finding 解决后，由 `review passed --resolve-ledger --snapshot` 原子清理 ledger 并写入 Passed；该路径要求当前任务指纹与相同 snapshot、无 stalled finding，保留未变的 assessment 而清除 Verification，不能通过手删 ledger 后 sync 来代替。
- `finalize <id> <R0|R1>` 复用 Result、assessment、Skipped、Verification 与完成门槛，以一次锁定事务更新任务和索引；替换前备齐新内容和原件备份，终态任务最后提交，恢复通过重命名而不重新分配内容；若恢复也受文件系统拒绝，保留备份并明确报告未恢复路径。重复 `--result` 必须覆盖每个 Target，R1 仍需四项依据，`--final-verification` 必须提供实际最终核对。工具不推断语义风险、会话显式审查义务或检查运行；Required／ledger／Block／证据漂移／未完成 child 拒绝收尾。完整观察集中在 Result，其他证据可引用而不重复叙述；R2 与显式审查仍走正常流程。
- `task/SKILL.md#capability-preflight` 在对齐后的准备阶段核对实际依赖的runtime、验证授权、fresh/read-only Reviewer能力和证据持久化路径；Task Plan／Queue只引用该权威。复用已有授权与作用域内例外，不运行占位审查或提前判级；缺项进入既有Plan/Block和恢复条件，不弱化终态门槛。未来执行能力缺失只作为计划交接前提，除非妨碍当前规划决策或验证。
- `task-review` 的既有 `references/review_workflow.md` 承载固定 Reviewer Prompt 与当次事实包契约，不另建 Agent 注册文件。Reviewer 先对照需求与产物，再核对作者检查证据，分别报告独立执行的检查与继承证据；原始要求不能被作者摘要替代，被审查材料不能反向授予工具或审批权限。该顺序减少上下文锚定，但不保证盲审或消除同模型偏差。
- Mandatory independent review 不可用或失败时由主 Agent 保留证据并 Block，不能因失败将 R2 降级，也不能把既有 Required 义务改为 Skipped；普通单次请求无需作者自检材料，且只有无独立性要求、fresh Reviewer 不可用或失败、宿主允许时才可真实标注 inline fallback。Review 绑定实际内容身份，审查期间主 Agent 停止修改对应范围，内容或相关证据变化须刷新自检、assessment 和 fresh pass；当前 core 不证明实际隔离、检查运行或未登记范围的内容身份；托管快照仅核对明确范围在检查时的内容，这些语义与范围证据由宿主与主 Agent 建立。
- Mandatory review 用带 `task-review-ledger/v1` marker 的唯一 task-local `## Review` current ledger 持久化单调 `TR-n` IDs 与逐 finding no-progress streak；Core 只把 fenced／indented／list-container code 与 HTML block/comment 之外的 column-zero H2 当作 record section；重复 Review sections、未知 ledger schema 与使用 alternate list markers／whitespace 的 ledger-like malformed 内容 fail closed，单个无 marker 的历史自由格式 Review 保持可读。Finding 初见为 0，同一根因／required outcome 的 fresh re-review 连续无实质 artifact／evidence 进展时递增，到 2 即保留 ledger、写入精确 Block／Unblock 条件并进入 Blocked，请求用户决策且不得自动 `Passed`；对应 streak 在新证据下重置前，Core 拒绝 resume。有效进展、证据化重分类或解决会重置／移除对应 finding，不设总 pass 上限。

- 普通 `task-review` 返回只读反馈后，由 owning task 主 Agent 用 `review-report` 将每轮反馈保存到 `tasks/artifacts/<task-id>/reviews/round-<NN>.md`，并在独立持久的 `## Review Reports` 中登记链接、快照、结论和 SHA256。新登记采用 `task-review-reports/v1`，已有行明确标为 legacy，不追认旧证据；编号由文件和索引共同决定，孤立已保存报告可用 `--existing-round` 核对后登记，不覆盖历史。写入复用锁与异常回滚，不保证跨文件崩溃事务。Task fingerprint 排除此索引；`check-evidence` 和终态门槛核对托管报告字节、路径、头部对应，托管快照或报告索引的 Passed 还要求最新报告同时匹配当前快照与 Task fingerprint，并记载独立审查无阻断问题；含旧说明文字的索引拒绝自动迁移，需先保留文字再操作。语义结论、实际 Reviewer 隔离和遗漏范围仍归主 Agent。独立 adversarial-review 保留其自己的报告契约。

### Decision and Verification Boundaries
- 共享对齐协议的 Confirmation Modes 定义 SOLO 独立执行路径：有效 solo 在 L0–L4 分级前使用 `continue_solo`，仍激活／聚焦并展示完整 Target，跳过原二次确认分级，目标范围内操作选择由 Agent 根据证据与有界默认值处理；已授权发布／X／SOP 的框架确认改为动作说明，不能仅因 SOP 要求询问而暂停。保留实质防护、真实用户暂停、命令范围、宿主审批和上级安全限制，缺少无法查证的必要事实／授权时如实报告阻塞；质量审查和验证不变。查询／切换模式不恢复旧批次，默认或配置错误仍为 confirm。权威为 `skills/meta/csl-tasks/shared/lib/task-mode.js`、`scripts/task-mode.js` 和共享对齐协议。
- User-facing Task Target 只描述结果、可观察完成条件和必要边界；只有 interaction owner 显示 L2／L3／L4 与 S1，delegated child 只执行 `continue_delegated`／`return_to_main`。Level、delegation packet、alignment／confirmation 不写入 canonical task core，详细规则只由共享协议定义。
- 新请求默认创建独立 task；明确执行 implementation-ready plan 时 resume 该 plan 的 exact record，`task-plan` → `task` 阶段变化本身不产生新 ownership。其他情况下，只有直接修正、补全或重新验证同一 outcome，且保留旧 Target 或 Result 会失真时才复用或重开，组件、文件、主题或实现重叠本身不建立 ownership。Queue parent、children 与 siblings 的标准化标题必须互异，core 在 link 和 validation 边界 fail closed；无图关系的独立任务可同名。Completed child 只能在 parent 已激活后 reopen；该动作会原子失效 parent 的 assessment、终态 review／Verification，并将 In Review parent 退回 In Progress，防止 parent 以旧 integration evidence 完成。改变 Completed child 的关系前须显式 reopen；完全相同的 reciprocal link 为 no-op，不能清除任一已完成记录的证据。
- 任务执行族仍为 `task`、`task-plan` 与 `task-queue`，不保留旧名称 alias；`topic` 是独立的可选共享规格与归属入口，不是第四种执行族。共享 Task Target 协议没有 `SKILL.md` 且不参与路由，各 skill package、协议与 task core 位于 `skills/meta/` 的分发树中。
- `tests/csl-tasks-core.test.mjs` 定义 Queue／旧 Auto、父子图、Review gate、Review Assessment schema 与指纹失效、R1 四项依据、R2 禁止降级、显式审查、历史兼容、finding ledger 与完成门禁的回归用例；`tests/task-files.test.mjs` 定义 discoverability、默认规则、`evals/review_gate_cases.json`／`evals/review_stall_cases.json` 和记录契约检查。测试源码不是当前执行通过的证明，实际运行证据由 owning task 保存。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## CTX-task-workflows — Canonical task workflows
- Scope: 跨宿主 canonical task 的单任务执行、只读计划、队列执行、main-session L0–L4 Task Target gate、R0／R1／R2 Review 分级与证据失效、mandatory task-review remediation loop 与 per-finding stall protection、delegated child alignment inheritance、S0／S1 Safety Overlay、Queue title invariants、状态证据及完成门禁。
- Paths: `skills/meta/task/`, `skills/meta/task-review/`, `skills/meta/task-plan/`, `skills/meta/task-queue/`, `skills/meta/csl-tasks/shared/`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `tests/csl-tasks-core.test.mjs`, `tests/task-files.test.mjs`
- Keywords: task, task-review, review gate, Review ledger, no-progress streak, stall, Blocked, Passed, In Review, task-plan, task-queue, canonical task, Task Target, Authorization Ledger, interaction owner, delegated child, L2 checkpoint, L4 change approval, Safety Overlay, Queue title, Kind Queue, legacy Auto, Execution Log, 决策记录, 中断恢复
- Authority: `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`, `skills/meta/csl-tasks/shared/protocols/task-review-grading.md`, `skills/meta/task/SKILL.md`, `skills/meta/task-review/SKILL.md`, `skills/meta/task-plan/SKILL.md`, `skills/meta/task-queue/SKILL.md`, `skills/meta/csl-tasks/shared/lib/task-core.js`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`
- Recheck: 当公开 skill identity、task activation timing、Task Target 对齐或确认路径、task record schema、状态转换、父子图或完成门禁变化时复核。

### Purpose and Boundaries
- `task` 从最早的实质准备阶段开始管理一个可独立验收 outcome，`task-plan` 只研究并形成 decisions-only handoff，同时对齐计划任务最终要实现的 Target；该 Target 的接受不授权执行。`task-queue` 用有序父子 records 串行推进多个 outcome，并在父级执行独立 integration gate。
- `Task Summary` 是 Agent 在完成自检与 assessment 前维护的单一改动摘要章节，不是 CLI 自动生成字段；按实际修改的组件分段，记录组件根目录与具体变化，不替代 Result／Verification。Queue parent 只记录 parent-owned 改动；正文变化仍走 `sync` 与证据失效流程。权威为 `skills/meta/task/SKILL.md` 和 `skills/meta/task-queue/SKILL.md`。
- 常驻Contract只保留稳定触发、顺序、授权与停止边界；模式存储/确认分级细节归共享Target协议，assessment细节归Task/Grading，ledger格式/计数/恢复归Task与Review Workflow。独立分析本身可验收时走Task，面向后续实现的调查才走Task Plan；详细规则仍须通过选定Skill加载，去重不豁免任何门槛。

### Structure
- 三个 workflow 直接位于 `skills/meta/`，进入或在上下文丢失后恢复时均须读取 `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`；该普通 Markdown runtime contract 是全部 Target 对齐语义的唯一详细 Authority，不参与 skill discovery。各 consumer 只拥有激活时机、workflow-specific Target 含义、对齐前 lifecycle writes 与对齐后下一步。
- 三个 workflow 共享 `skills/meta/csl-tasks/shared/lib/task-core.js` 与 `skills/meta/csl-tasks/shared/scripts/csl-tasks.js`；core 维护 Markdown 状态、证据、父子关系和索引一致性，并通过 `task-evidence.js`／`task-reports.js` 校验明确登记的文件快照和报告。它不持久化会话 alignment 或 confirmation，不启动嵌套宿主 CLI、worker、daemon 或任意验证命令。
- Core 将 Status、Kind、可选 Artifacts 与 Parent 投影到 canonical record 顶部的 `Field`／`Value` 两列表格，状态值保持 `<state> (<YYYY-MM-DD HH:MM>)`；兼容读取旧式 `Name: value` 元数据，并仅在该记录下次写入时转换，展示格式转换不改变 review fingerprint。canonical `#`／`##` record headings 固定从 column zero 开始，indented 或 container-nested headings 仅是内容。Core 在 `tasks/tasks.md` 维护对应标题、状态与 `tasks/<task-slug>.md` 链接；record 在索引不一致时仍是权威。
- 新队列父任务只写入 `Kind: Queue`；读取现有历史 `Kind: Auto` 时在内存中归一为 queue 以继续执行，但创建新记录不接受 `auto`。
- Task／Plan／Queue 在所属 canonical record 的单一 `Execution Log` 按重要事件追加发现、决策依据、实际结果和修正，使用递增序号指明取代关系，不再维护三个即时恢复字段。当前计划与约束仍由 Plan／Decisions／Target 承载，验收仍由 Result／Verification 承载；Queue 父日志不复制子日志或替代 `next`。权威为 `skills/meta/task/SKILL.md#execution-log` 及 Plan／Queue 的引用。
- Execution Log 复用普通 Markdown 章节与 `sync`／`check`，`task-core.js#reviewTaskFingerprint` 默认覆盖日志，不豁免追加产生的证据失效；审查期间冻结，终态记录不重复追加进日志。`csl-tasks.js` 非 JSON `show` 输出完整正文；`recoveryOf(text)` 与 JSON `recovery` 仍只兼容旧 Plan 字段和 Block，不投影或推断新日志。历史无日志记录仍可读，不批量迁移；恢复需核对当前计划、证据及真实产物，缺日志不证明外部动作未发生。
- Core 在每次写入 Task／Plan／Queue record 时，按对应 `tasks/artifacts/<task-id>/` 是否为目录，在顶部元数据表维护 `Artifacts` 行及 `[Artifacts](../artifacts/<task-id>/)` 链接；不会创建空目录或批量回填，读取与校验不写入。仅这个固定格式的顶部导航字段不参与 review fingerprint，正文中的同类文本仍参与；`sync` 的既有证据失效行为不变。

### Workflows
- 默认 confirm 模式下，具体非平凡探索与文件变更都先激活／聚焦 owning record，再应用共享对齐协议。主会话的等价探索（检查、分析、研究与只读规划）用 `continue_exploration`，无需目标确认或先前接受证据；明确用户暂停、真正阻塞的用户决策和承诺变化仍保留对应检查。探索可写任务记录及明确请求的调查报告，不能擅自实施；“调查并修复”属于实现。用户后来要求执行同一 canonical plan 时正常应用实现确认，只有已展示且真实接受、未变仍适用的完整实现 Target 才可复用。探索结束不等于 Target 接受。实现的首次、实质修订与澄清收敛后非平凡等价 Target 仍完整展示并等待；L3／L4、接受来源和组合效果检查保留。子会话按完整当前 Plan packet 继续或返回主会话，不自行询问用户；范围内调查重排和缺失接受不单独制造探索暂停。协议选中探索继续后即可加载 task-relevant Context、Lessons 和直接来源。权威为 `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`。
- 主 Agent 按原始要求、有效修订与已接受约束自检并记录逐 Target 证据后，按独立于 Task Target 的 R0／R1／R2 协议分类实际结果：R0 无交付物变更；R1 是结果明确、影响可界定、低风险且验证充分的简单变更，包括符合条件的小范围逻辑修改；R2 是复杂、高风险或存在重要不确定性的变更。R0／R1 在没有显式或既有审查义务时可 `Skipped`，R2 或显式普通审查进入 Required／In Review／fresh 只读 `task-review` 修复循环。R2 的显式 adversarial approval 需保留 ordinary pass；R0／R1 可因显式 adversarial 请求直接进入 Required／In Review／Approved。所有等级保留最终验证。
- `assess-review` 在 In Progress 写入唯一 `task-review-assessment/v1` Review Assessment，保留等级、Current／Stale、具体依据、外部内容身份、自检证据和任务指纹；R1 另需四项成立依据。core 校验结构、等级／gate 一致性及任务记录指纹，不执行语义评级、检查命令或外部文件监控。`snapshot <id> --file ...` 为明确文件范围生成不可变 `task-snapshot/v1` manifest，记录文件字节与 Git HEAD/index 身份，返回 `snapshot:...#<sha256>`；此类身份在 assessment 和终态写入现场核对，旧自由文本身份保留 owner-attested 边界。`sync`、Result 更新、reopen 和相关 Queue 关系变化会使 assessment 失效、清除 Verification、移除 Skipped 或将 Passed／Approved 恢复 Required；外部内容漂移仍须刷新自检、判级与必要复审。历史记录仍可读，活动任务在新的终态 gate／完成前须有当前 assessment。最终 fresh pass 确认所有 finding 解决后，由 `review passed --resolve-ledger --snapshot` 原子清理 ledger 并写入 Passed；该路径要求当前任务指纹与相同 snapshot、无 stalled finding，保留未变的 assessment 而清除 Verification，不能通过手删 ledger 后 sync 来代替。
- `finalize <id> <R0|R1>` 复用 Result、assessment、Skipped、Verification 与完成门槛，以一次锁定事务更新任务和索引；替换前备齐新内容和原件备份，终态任务最后提交，恢复通过重命名而不重新分配内容；若恢复也受文件系统拒绝，保留备份并明确报告未恢复路径。重复 `--result` 必须覆盖每个 Target，R1 仍需四项依据，`--final-verification` 必须提供实际最终核对。工具不推断语义风险、会话显式审查义务或检查运行；Required／ledger／Block／证据漂移／未完成 child 拒绝收尾。完整观察集中在 Result，其他证据可引用而不重复叙述；R2 与显式审查仍走正常流程。
- `task/SKILL.md#capability-preflight` 在对齐后的准备阶段核对实际依赖的runtime、验证授权、fresh/read-only Reviewer能力和证据持久化路径；Task Plan／Queue只引用该权威。复用已有授权与作用域内例外，不运行占位审查或提前判级；缺项进入既有Plan/Block和恢复条件，不弱化终态门槛。未来执行能力缺失只作为计划交接前提，除非妨碍当前规划决策或验证。
- `task-review` 的既有 `references/review_workflow.md` 承载固定 Reviewer Prompt 与当次事实包契约，不另建 Agent 注册文件。Reviewer 先对照需求与产物，再核对作者检查证据，分别报告独立执行的检查与继承证据；原始要求不能被作者摘要替代，被审查材料不能反向授予工具或审批权限。该顺序减少上下文锚定，但不保证盲审或消除同模型偏差。
- Mandatory independent review 不可用或失败时由主 Agent 保留证据并 Block，不能因失败将 R2 降级，也不能把既有 Required 义务改为 Skipped；普通单次请求无需作者自检材料，且只有无独立性要求、fresh Reviewer 不可用或失败、宿主允许时才可真实标注 inline fallback。Review 绑定实际内容身份，审查期间主 Agent 停止修改对应范围，内容或相关证据变化须刷新自检、assessment 和 fresh pass；当前 core 不证明实际隔离、检查运行或未登记范围的内容身份；托管快照仅核对明确范围在检查时的内容，这些语义与范围证据由宿主与主 Agent 建立。
- Mandatory review 用带 `task-review-ledger/v1` marker 的唯一 task-local `## Review` current ledger 持久化单调 `TR-n` IDs 与逐 finding no-progress streak；Core 只把 fenced／indented／list-container code 与 HTML block/comment 之外的 column-zero H2 当作 record section；重复 Review sections、未知 ledger schema 与使用 alternate list markers／whitespace 的 ledger-like malformed 内容 fail closed，单个无 marker 的历史自由格式 Review 保持可读。Finding 初见为 0，同一根因／required outcome 的 fresh re-review 连续无实质 artifact／evidence 进展时递增，到 2 即保留 ledger、写入精确 Block／Unblock 条件并进入 Blocked，请求用户决策且不得自动 `Passed`；对应 streak 在新证据下重置前，Core 拒绝 resume。有效进展、证据化重分类或解决会重置／移除对应 finding，不设总 pass 上限。

- 普通 `task-review` 返回只读反馈后，由 owning task 主 Agent 用 `review-report` 将每轮反馈保存到 `tasks/artifacts/<task-id>/reviews/round-<NN>.md`，并在独立持久的 `## Review Reports` 中登记链接、快照、结论和 SHA256。新登记采用 `task-review-reports/v1`，已有行明确标为 legacy，不追认旧证据；编号由文件和索引共同决定，孤立已保存报告可用 `--existing-round` 核对后登记，不覆盖历史。写入复用锁与异常回滚，不保证跨文件崩溃事务。Task fingerprint 排除此索引；`check-evidence` 和终态门槛核对托管报告字节、路径、头部对应，托管快照或报告索引的 Passed 还要求最新报告同时匹配当前快照与 Task fingerprint，并记载独立审查无阻断问题；含旧说明文字的索引拒绝自动迁移，需先保留文字再操作。语义结论、实际 Reviewer 隔离和遗漏范围仍归主 Agent。独立 adversarial-review 保留其自己的报告契约。

### Decision and Verification Boundaries
- 共享对齐协议的 Confirmation Modes 定义 SOLO 独立执行路径：有效 solo 在 L0–L4 分级前使用 `continue_solo`，仍激活／聚焦并展示完整 Target，跳过原二次确认分级，目标范围内操作选择由 Agent 根据证据与有界默认值处理；已授权发布／X／SOP 的框架确认改为动作说明，不能仅因 SOP 要求询问而暂停。保留实质防护、真实用户暂停、命令范围、宿主审批和上级安全限制，缺少无法查证的必要事实／授权时如实报告阻塞；质量审查和验证不变。查询／切换模式不恢复旧批次，默认或配置错误仍为 confirm。权威为 `skills/meta/csl-tasks/shared/lib/task-mode.js`、`scripts/task-mode.js` 和共享对齐协议。
- User-facing Task Target 只描述结果、可观察完成条件和必要边界；只有 interaction owner 显示 L2／L3／L4 与 S1，delegated child 只执行 `continue_delegated`／`return_to_main`。Level、delegation packet、alignment／confirmation 不写入 canonical task core，详细规则只由共享协议定义。
- 新请求默认创建独立 task；明确执行 implementation-ready plan 时 resume 该 plan 的 exact record，`task-plan` → `task` 阶段变化本身不产生新 ownership。其他情况下，只有直接修正、补全或重新验证同一 outcome，且保留旧 Target 或 Result 会失真时才复用或重开，组件、文件、主题或实现重叠本身不建立 ownership。Queue parent、children 与 siblings 的标准化标题必须互异，core 在 link 和 validation 边界 fail closed；无图关系的独立任务可同名。Completed child 只能在 parent 已激活后 reopen；该动作会原子失效 parent 的 assessment、终态 review／Verification，并将 In Review parent 退回 In Progress，防止 parent 以旧 integration evidence 完成。改变 Completed child 的关系前须显式 reopen；完全相同的 reciprocal link 为 no-op，不能清除任一已完成记录的证据。
- 任务执行族仍为 `task`、`task-plan` 与 `task-queue`，不保留旧名称 alias；`topic` 是独立的可选共享规格与归属入口，不是第四种执行族。共享 Task Target 协议没有 `SKILL.md` 且不参与路由，各 skill package、协议与 task core 位于 `skills/meta/` 的分发树中。
- `tests/csl-tasks-core.test.mjs` 定义 Queue／旧 Auto、父子图、Review gate、Review Assessment schema 与指纹失效、R1 四项依据、R2 禁止降级、显式审查、历史兼容、finding ledger 与完成门禁的回归用例；`tests/task-files.test.mjs` 定义 discoverability、默认规则、`evals/review_gate_cases.json`／`evals/review_stall_cases.json` 和记录契约检查。测试源码不是当前执行通过的证明，实际运行证据由 owning task 保存。
```

</details>

### 10 · CTX-topics — 长期 Topic 与任务关联

处置：导入 Project Memory。

理由：保留 Topic 规格归属、成员关联与版本新鲜度边界，不把 Topic 与 Memory 混为一体。

核对依据：skills/meta/topic/SKILL.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-e342fb2566f3132de133.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-e342fb2566f3132de133.md)

标题：长期 Topic 与任务关联

类型：`fact`；检索摘要：建立或更新长期共享规格、任务关联、版本采用与跨仓边界时读取。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-topics — 长期 Topic 与任务关联
- Scope: 长期维护主题的共享规格、采用版本、可选任务归属、跨仓定位、双向索引和完成门禁。
- Paths: `skills/meta/topic/`, `skills/meta/csl-tasks/shared/lib/topic-core.js`, `skills/meta/csl-tasks/shared/lib/topic-cli.js`, `tasks/topics/`, `tasks/topics.md`
- Keywords: topic, persistent requirement, spec context, revision, freshness, task association, archived, cross-workspace
- Authority: `skills/meta/topic/SKILL.md`, `skills/meta/topic/references/topic-contract.md`, `skills/meta/csl-tasks/shared/lib/topic-core.js`, `skills/meta/csl-tasks/shared/lib/task-core.js`
- Recheck: Topic schema、关联权威、版本范围、跨仓解析、锁或终态门禁变化时复核。

### Purpose and Boundaries
- Topic 是独立于 Task Kind 与 Queue Parent 的长期共享规格，不限于多平台；任务可以没有 Topic，成员全部完成不自动归档。新建 Topic 默认 Active，正常状态为 Active/Archived；Active 不表示规格完整，Topic 状态和内容版本都不是执行授权。旧 Draft 保持读取兼容，`activate` 仅用于显式转换指定旧记录。
- Topic canonical 文件和可重建索引位于 owning workspace 的 Task 数据区；规范快照不可变，成员列表只存引用和职责，状态现场读取。Task 绑定是归属权威，Topic Tasks 是反向索引。
- Topic 的 `resources/` 保存跨任务长期资料，主文档 `Resources` 表记录可点击链接、用途及 normative/reference 分类；`update-resources` 显式替换索引，不复制、移动或删除来源。新 Topic 创建目录与空表；旧记录保持原样，直到显式初始化资源索引。
- normative 资源的元数据与文件摘要进入规格投影并按既有门禁核对；reference 内容与索引变化不影响规格摘要。规范性来源只能是固定摘要的 owner-repo 文件；HTTP(S) 仅支持无凭证的参考链接，CLI 不抓取。已有权威文件直接引用，任务专属产物仍归 owning Task。

### Workflows
- 共享 CLI 的 `topic` 子命令维护 create/show/list/update-spec、activate/archive/restore、attach/detach/adopt、check/repair/rebuild-index；写入核对旧版本并持有工作区锁，跨仓写入另需明确授权和 allow-cross-workspace。关联写入前持久记录确切旧/新引用，失败或回滚后保留 pending marker，直到受限 repair 核对两侧关系并同步、验证该任务索引后完成；即使 Task 已解除绑定也不能绕过终态门禁。不能声称具备分布式崩溃原子性。
- 规格摘要覆盖 Scope、Spec Context、Decisions 与固定的本地规范性依赖，不覆盖成员列表和生命周期状态。完整候选正文先通过同一解析器和 round-trip 检查再写入，避免未闭合围栏破坏固定章节。Task assessment、review、passed verification 和 complete 校验新旧规格、依赖及反向链接；显式 adopt 记录影响处置并失效旧证据，历史 Completed 不自动改写。失败验证和取消允许在过期时记录，并失效旧成功证据。

### Decision and Verification Boundaries
- 跨仓引用复用已确认的 project-index，限定 Git 根目录并固定 origin 哈希；未登记或身份变化不自动修复。规范性外部 URL 必须先取得允许的固定本地副本，CLI 不自动抓取。
- Archived 和旧 Draft 仅允许符合目标的 maintenance 任务，不是实现绕过路径；归档可显式指定当前 In Progress 且已关联的归档维护任务，其他活动或未知成员仍阻止归档。
- `topic check` 核对索引和已列成员关系，并分开展示成员 freshness；不证明所有历史成员满足最新规格，也不扫描所有仓库查找遗漏。
```

</details>

### 11 · CTX-agent-hooks — Agent Hooks runtime and built-in hooks

处置：导入 Project Memory。

理由：保留 Hook 存储、宿主适配与可信边界；同步说明新的 Memory 定向投递而非旧 Context/Lessons 注入职责。

核对依据：skills/meta/agent-hooks/SKILL.md；skills/meta/agent-hooks/scripts/lib/runtime.js；pi/lib/memory-bridge.ts

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-2e3175e9d15b6364c50a.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-2e3175e9d15b6364c50a.md)

标题：Agent Hooks 运行时与内置集成

类型：`fact`；检索摘要：修改 Hook 路由、配置、宿主能力或 Memory 定向投递时使用；eligible 不等于实际生效。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-agent-hooks — Agent Hooks runtime and built-in hooks
- Scope: Agent Hooks V1 rule storage, host-neutral execution, inner hook policy, three-level Agent Rules injection, CSL Agent Kit Contract injection, data migration, and host lifecycle adapters.
- Paths: `skills/meta/agent-hooks/`, `skills/meta/agent-rules/`, `hooks/hooks.json`, `pi/extensions/csl-context-hooks.ts`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `tests/agent-hooks.test.js`, `tests/pi-context-hooks.test.mjs`
- Keywords: agent hooks, agent rules, inner hook, session-start, inject-output, CSL Agent Kit contract, compaction, host adapter
- Authority: `skills/meta/agent-hooks/scripts/agent-hooks.js`, `skills/meta/agent-hooks/scripts/lib/store.js`, `skills/meta/agent-hooks/scripts/lib/runtime.js`, `skills/meta/agent-hooks/scripts/read-agent-rules.js`, `skills/meta/agent-hooks/scripts/read-csl-agent-kit-contract.js`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `skills/meta/agent-rules/SKILL.md`, `hooks/hooks.json`
- Recheck: 当 Agent Hooks rule schema、存储路径、inner hook override、built-in Agent Rules 来源、宿主 capability 或 session/compaction lifecycle mapping 变化时复核。

### Purpose and Boundaries
- `skills/meta/agent-hooks/scripts/agent-hooks.js` 是稳定 facade；rule、store、runtime、CLI 与 native hook 模块分别负责 V1 语义、存储、执行和宿主适配，外部 adapter 通过 `createEvent()` 与 `runEvent()` 接入。

### Structure
- 用户规则、配置和脚本位于 `<data-root>/hooks/`，项目规则和脚本位于 `<workspace>/.agents/hooks/`；旧 Triggerify 用户级与项目级根目录只作为一次性迁移输入，成功迁移后不再读取。
- `skills/meta/agent-hooks/hooks/` 中的 inner hooks 随包分发、默认启用且源文件只读；用户通过 `<data-root>/hooks/config.json` 的 `disabledHooks` 和 `hookSettings` 控制自身状态。
- `inner:agent-rules` 依次合并 `skills/meta/agent-rules/agent-rules.md`、`<data-root>/agent-rules.md` 与 `<workspace>/.agents/agent-rules.md` 三个同格式单文件来源；`AGENTS.md` / `CLAUDE.md` 不属于该系统，禁用 inner hook 会同时停止三个来源的注入。
- Hook 规则、配置、事件与脚本环境协议分别使用 `agent-hooks/v1`、`agent-hooks.config/v1`、`agent-hooks.event/v1` 与 `AGENT_HOOKS_*`。
- `inner:csl-agent-kit-contract` 在 `session-start` 运行 bundled script 并注入 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 的自包含行为契约，使 task-family 路由、目标对齐、记忆读取职责、最小与手术式执行及验证边界不依赖替换用户的 Agent 指令文件。脚本追加按当前 workspace、宿主和 payload session ID 解析的 Task 模式；Pi adapter 在每轮提供真实 session ID，避免会话覆盖丢失。配置错误保留契约并注入 confirm 诊断。

### Relationships
- `hooks/hooks.json` 的 SessionStart dispatcher 处理 startup、resume 与 compact 来源，Pi adapter 在每次 `before_agent_start` 重建 session prompts；同一 Contract prompt 不再由 manifest 直接 `cat`，避免重复注入。
- Codex manifest 显式组合共享 hooks 与 `hooks/codex-lifecycle.json`；后者只补 Interrupt/SessionEnd，均为非阻塞脚本事件，不能把这些入口加入 Claude/Pi 共享声明。`inner:itermate-codex-*` 按宿主筛选并调用 bundled adapter，只有 iTermate 的显式启用标记存在时才转发原生 payload 给用户已安装的 reporter；该规则不自行安装、改写原生 hooks 或注入模型上下文。规则 eligible、App opt-in、Codex plugin 版本/信任和实际 Socket 投递是不同验证边界。权威为 `.codex-plugin/plugin.json`、`hooks/codex-lifecycle.json`、`scripts/lib/runtime.js`、`scripts/itermate-codex-status.js`（后两者位于 Agent Hooks skill 内）。

### Decision and Verification Boundaries
- Codex、Claude Code 与 Pi 支持该 session prompt；Cursor 在宿主传递 injected context 前保持 unsupported。`tests/agent-hooks.test.js` 与 `tests/pi-context-hooks.test.mjs` 验证迁移、默认启用、Built-in → User → Project Agent Rules 合并、来源不变、用户禁用、最终 task 名称和压缩后重建边界。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## CTX-agent-hooks — Agent Hooks runtime and built-in hooks
- Scope: Agent Hooks V1 rule storage, host-neutral execution, inner hook policy, three-level Agent Rules injection, CSL Agent Kit Contract injection, data migration, and host lifecycle adapters.
- Paths: `skills/meta/agent-hooks/`, `skills/meta/agent-rules/`, `hooks/hooks.json`, `pi/extensions/csl-context-hooks.ts`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `tests/agent-hooks.test.js`, `tests/pi-context-hooks.test.mjs`
- Keywords: agent hooks, agent rules, inner hook, session-start, inject-output, CSL Agent Kit contract, compaction, host adapter
- Authority: `skills/meta/agent-hooks/scripts/agent-hooks.js`, `skills/meta/agent-hooks/scripts/lib/store.js`, `skills/meta/agent-hooks/scripts/lib/runtime.js`, `skills/meta/agent-hooks/scripts/read-agent-rules.js`, `skills/meta/agent-hooks/scripts/read-csl-agent-kit-contract.js`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `skills/meta/agent-rules/SKILL.md`, `hooks/hooks.json`
- Recheck: 当 Agent Hooks rule schema、存储路径、inner hook override、built-in Agent Rules 来源、宿主 capability 或 session/compaction lifecycle mapping 变化时复核。

### Purpose and Boundaries
- `skills/meta/agent-hooks/scripts/agent-hooks.js` 是稳定 facade；rule、store、runtime、CLI 与 native hook 模块分别负责 V1 语义、存储、执行和宿主适配，外部 adapter 通过 `createEvent()` 与 `runEvent()` 接入。

### Structure
- 用户规则、配置和脚本位于 `<data-root>/hooks/`，项目规则和脚本位于 `<workspace>/.agents/hooks/`；旧 Triggerify 用户级与项目级根目录只作为一次性迁移输入，成功迁移后不再读取。
- `skills/meta/agent-hooks/hooks/` 中的 inner hooks 随包分发、默认启用且源文件只读；用户通过 `<data-root>/hooks/config.json` 的 `disabledHooks` 和 `hookSettings` 控制自身状态。
- `inner:agent-rules` 依次合并 `skills/meta/agent-rules/agent-rules.md`、`<data-root>/agent-rules.md` 与 `<workspace>/.agents/agent-rules.md` 三个同格式单文件来源；`AGENTS.md` / `CLAUDE.md` 不属于该系统，禁用 inner hook 会同时停止三个来源的注入。
- Hook 规则、配置、事件与脚本环境协议分别使用 `agent-hooks/v1`、`agent-hooks.config/v1`、`agent-hooks.event/v1` 与 `AGENT_HOOKS_*`。
- `inner:csl-agent-kit-contract` 在 `session-start` 运行 bundled script 并注入 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 的自包含行为契约，使 task-family 路由、目标对齐、Context、Lessons、最小与手术式执行及验证边界不依赖替换用户的 Agent 指令文件。脚本追加按当前 workspace、宿主和 payload session ID 解析的 Task 模式；Pi adapter 在每轮提供真实 session ID，避免会话覆盖丢失。配置错误保留契约并注入 confirm 诊断。

### Relationships
- `hooks/hooks.json` 的 SessionStart dispatcher 处理 startup、resume 与 compact 来源，Pi adapter 在每次 `before_agent_start` 重建 session prompts；同一 Contract prompt 不再由 manifest 直接 `cat`，避免重复注入。
- Codex manifest 显式组合共享 hooks 与 `hooks/codex-lifecycle.json`；后者只补 Interrupt/SessionEnd，均为非阻塞脚本事件，不能把这些入口加入 Claude/Pi 共享声明。`inner:itermate-codex-*` 按宿主筛选并调用 bundled adapter，只有 iTermate 的显式启用标记存在时才转发原生 payload 给用户已安装的 reporter；该规则不自行安装、改写原生 hooks 或注入模型上下文。规则 eligible、App opt-in、Codex plugin 版本/信任和实际 Socket 投递是不同验证边界。权威为 `.codex-plugin/plugin.json`、`hooks/codex-lifecycle.json`、`scripts/lib/runtime.js`、`scripts/itermate-codex-status.js`（后两者位于 Agent Hooks skill 内）。

### Decision and Verification Boundaries
- Codex、Claude Code 与 Pi 支持该 session prompt；Cursor 在宿主传递 injected context 前保持 unsupported。`tests/agent-hooks.test.js` 与 `tests/pi-context-hooks.test.mjs` 验证迁移、默认启用、Built-in → User → Project Agent Rules 合并、来源不变、用户禁用、最终 task 名称和压缩后重建边界。
```

</details>

### 12 · CTX-agent-sops — Project, user, and built-in SOP routing

处置：导入 Project Memory。

理由：保留 SOP 三级覆盖、候选路由及审批边界。

核对依据：skills/meta/agent-sops/SKILL.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-22ba57285e51417e1ae9.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-22ba57285e51417e1ae9.md)

标题：SOP 发现与覆盖顺序

类型：`fact`；检索摘要：查询或维护项目、用户和内置 SOP 时使用；同名规则按项目、用户、内置优先。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-agent-sops — Project, user, and built-in SOP routing
- Scope: SOP discovery, writable ownership, same-name precedence, session summaries, prompt candidates, and Pi workspace loading.
- Paths: `skills/meta/agent-sops/`, `pi/extensions/csl-context-hooks.ts`, `tests/cli-install-output.test.js`, `tests/pi-context-hooks.test.mjs`
- Keywords: agent sops, project SOP, user SOP, built-in SOP, .agents/sops, precedence, candidates
- Authority: `skills/meta/agent-sops/SKILL.md`, `skills/meta/agent-sops/scripts/sop-summaries.sh`, `skills/meta/agent-sops/scripts/sop-candidates.js`
- Recheck: 当 SOP 存储层级、workspace 根边界、同名覆盖顺序或宿主 context 注入方式变化时复核。

### Purpose and Boundaries
- Agent SOPs 统一发现项目、用户和内置 SOP；同一 frontmatter `name` 只暴露最高优先级版本，顺序固定为项目级、用户级、内置级。

### Structure
- 项目级 SOP 位于当前 workspace 的 `.agents/sops/` 并可随仓库版本控制；用户级 SOP 位于 `~/.csl-agent-kit/sops/` 并跨项目生效；内置 SOP 位于 `skills/meta/agent-sops/sops/` 并随包分发。
- `skills/meta/agent-sops/sops/code-style.md` 是跨语言内置代码风格 SOP；它按语言读取 `skills/meta/agent-sops/references/code-style/`，Swift 参考为 `swift-style.md`。

### Relationships
- Native hooks 通过 `sop-summaries.sh` 从当前工作目录生成 session summary，并通过 `sop-candidates.js` 做 prompt-time 路由；Pi adapter 必须把 `ctx.cwd` 显式传给同一候选模块。
- 发布工作直接按同一三级发现边界匹配具体 SOP，不另建发布 SOP 注册表。`agent-sops` 的 Priority boundary 将 Task 确认模式应用到 SOP 的确认步骤：SOLO 跳过授权范围内的 confirmation-only 暂停，保留 SOP 的身份、防重复、平台限制、验证等实质要求；不修改用户级 SOP 来实现该模式。

### Decision and Verification Boundaries
- `tests/cli-install-output.test.js` 同时验证摘要与候选路由的项目 > 用户 > 内置覆盖；`tests/pi-context-hooks.test.mjs` 验证 Pi 从活跃 workspace 注入项目 SOP。
```

</details>

### 13 · CTX-task-lessons — Workspace preventive lessons

处置：导入 Project Memory。

理由：保留可复用防错知识的准入和纠错原则；取消独立 Lessons 文件、Legacy parser 与 Task Agent 写入维护门。

核对依据：原 CTX-task-lessons 的准入和纠错原则；tasks/tasks/plan-layered-memory-system.md#Decisions

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-3dc1c2253be6bf9e46ea.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-3dc1c2253be6bf9e46ea.md)

标题：可复用经验的准入与纠错

类型：`experience`；检索摘要：处理用户纠正或保存防错经验时使用；优先机械约束，Memory 只承载仍需判断的有效知识。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
# 经验何时有价值

一条经验应当能跨越当前任务复用，有可提前识别的触发条件，改变实际行为并阻止同类错误，而且有可观察的检查方式。态度要求、一次性细节、推测、进度和秘密不应被当作经验。

能由源码、schema、类型检查、测试、lint、CI 或正式工作流完全约束的错误，应优先在那些位置修复；记忆不能代替机械约束。只保留仍需 Agent 判断的剩余部分。

# 如何表达与使用

经验正文保留适用条件、具体防护动作和检查方式；这些是语义内容，不再要求单独 Lessons 文件或专属 parser。类型只是 experience 元数据，不构成额外权限层或检索排除条件。Task Agent 自主读取相关经验并应用，但不承担生成维护候选或常规写入。

用户纠正先应用到当前工作。独立 Memory Agent 在后台判断是新增、修订、合并、替换、删除还是无变化。同类错误重复出现时检查既有防护是否失效，优先修订而不是添加重复条目。

合并保留所有有效独有条件、动作与检查；原始权威规则和来源不能丢失。实际约束发生冲突时服从当前有效的更高优先级指令，不能按记忆日期机械决定优先级。

项目级经验按来源、审计和恢复约束维护；用户级提案必须展示具体变化与理由并获得明确批准。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## CTX-task-lessons — Workspace preventive lessons
- Scope: Workspace-local preventive Lesson admission, trigger-first retrieval, application, confirmed maintenance, and legacy compatibility.
- Paths: `tasks/lessons.md`, `skills/meta/task-lessons/`, `skills/meta/task-lessons/evals/trigger_cases.json`, `tests/task-files.test.mjs`
- Keywords: task lessons, workspace lessons, prevention, recurrence, Trigger, Rule, Check, correction, mechanical control
- Authority: `skills/meta/task-lessons/SKILL.md`, `skills/meta/task-lessons/scripts/lessons.js`, `skills/meta/task-lessons/evals/query_cases.json`
- Recheck: 当 Lesson schema、准入与载体边界、Entry/Change/Completion Gates、持久写入确认或 legacy 解析行为变化时复核。

### Purpose and Boundaries
- `tasks/lessons.md` 只保存当前有效、可复用且仍需 Agent 判断的最后一公里防复发控制；能由 source、schema、types、tests、lint、CI 或强制 workflow 完全阻止的错误优先在更强载体中消除。

### Structure
- 新增或实质更新的记录固定使用 `Trigger / Rule / Check`：Trigger 必须能在复发前识别，Rule 必须直接阻断失败机制，Check 必须证明控制覆盖相关范围；不增加 `Cause`、`Evidence`、状态或历史字段。

### Workflows
- Agent 在 Entry 与 Change Gates 以 Task Fingerprint 做 Trigger-first 语义召回并应用全部匹配 Rule；Completion Gate 复核 Rule 已约束当前工作，任何适用 Check 失败或不可观察都会阻止完成。
- 用户纠正后先应用于当前任务，再在 Add、Update、Merge、Replace、Delete 与 No-op 中选择；同类错误复发说明闭环无效，应修订既有记录而非新增重复项。所有持久写入必须先展示精确变更并取得确认。

### Decision and Verification Boundaries
- `scripts/lessons.js` 只负责确定性只读解析、索引、按 ID 查询与 schema 校验；Agent 负责语义匹配、载体选择、冲突处理、Rule 应用和 Check 证据。Legacy records 渐进兼容，已选 IDs 不持久缓存。
- 聚焦契约与回归入口为主 Skill、查询脚本、`evals/query_cases.json`、`evals/trigger_cases.json` 和 `tests/task-files.test.mjs`。
```

</details>

### 14 · CTX-task-maintenance — Task workspace data and architecture maintenance

处置：导入 Project Memory。

理由：保留 Task-owned 历史文件迁移的安全经验；将已决定退出的 Context/Lessons 专属整理职责与新 Memory 明确分离。

核对依据：skills/meta/task-maintenance/SKILL.md 的结构迁移部分；tasks/tasks/plan-layered-memory-system.md#Target

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-bf4d7050557e0a133921.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-bf4d7050557e0a133921.md)

标题：Task 历史文件迁移的安全边界

类型：`experience`；检索摘要：显式整理 Task-owned 旧文件时使用；不把历史清理当作 Memory 日常维护或全仓架构清理。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
# 职责

Task-owned 历史文件和目录的迁移必须先确定唯一 owner、当前权威路径与全部相关引用。Memory 替代方案已确定不再保留 Context/Lessons 的独立日常维护入口；长期知识的整理交给 Memory，Task 历史记录不顺带改写。

# 迁移与删除

含唯一内容的非空路径只能保真迁移，不能当作重复项删除。Duplicate Delete 必须证明非空源与保留目标在路径、类型、权限、字节及 hash 上一致。空目录删除需要确认整个候选树确实为空且不含他人内容。源与目标不得互相包含。

删除或移动稳定身份前核对当前非历史消费者；无法证明消费者有效就暂缓。执行前展示准确变化与恢复边界并取得明确确认，不自动扩大到其他任务或目录。

# 并发与恢复

执行前后重验源、目标和引用。使用已验证的同文件系统无覆盖原子迁移能力和私有隔离区，保护并行写入；能力不可用时不能声称安全迁移。失败恢复不得覆盖已经重建的源；保留全部候选、隔离区和冲突信息，由用户决定不能安全自动解决的冲突。

执行日志和任务证据记录发生了什么；当前状态以实际产物为准，缺少日志不证明操作没有发生。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## CTX-task-maintenance — Task workspace data and architecture maintenance
- Scope: 用户显式发起、统一确认的 Context/Lessons 数据整理，以及按当前权威架构执行的 Task-owned 历史文件与目录清理迁移。
- Paths: `skills/meta/task-maintenance/`, `skills/meta/task/`, `skills/meta/task-context/`, `skills/meta/task-lessons/`, `skills/meta/archive/`, `tasks/`
- Keywords: task maintenance, context cleanup, lessons cleanup, stable ID consumers, task architecture, historical paths, Migrate, Duplicate Delete, Empty Directory Delete
- Authority: `skills/meta/task-maintenance/SKILL.md`, `skills/meta/task/SKILL.md`, `skills/meta/task-context/SKILL.md`, `skills/meta/task-lessons/SKILL.md`, `skills/meta/archive/SKILL.md`
- Recheck: 当数据清理证据门、Task workspace canonical layout、artifact ownership、Conversation archive 路径、统一 Safety Confirmation 或迁移恢复边界变化时复核。

### Purpose and Boundaries
- `task-maintenance` 是内容产生方即时维护之外的显式兜底：既能删除或合并 Authority 已证明失效／重叠的 Context/Lessons 数据，也能将唯一归属的 Task-owned 历史路径无损迁移到当前 canonical layout；它不负责整个仓库的架构整理、历史正文现代化、自动调度或兼容层。

### Relationships
- `task-context` 与 `task-lessons` 继续负责日常数据生命周期，`task` 定义 canonical records、artifacts 与结构维护所需 lifecycle，`archive` 定义逐字 Conversation 载体；`task-maintenance` 每次从这些 live Authorities 与当前 path producers 建立架构图，不缓存目录清单。仅数据整理沿用 routine-maintenance 例外，结构迁移先进入 canonical task。

### Decision and Verification Boundaries
- Data Delete 在移除稳定 ID 前必须证明全部当前非历史 consumers 仍有效。Structure operations 分为 Migrate、仅限 non-empty byte-identical source 的 Duplicate Delete 与独占全部 empty-source cases、无 destination 的 Empty Directory Delete：含唯一内容的非空路径只能 Migrate，source／destination 不得互相包含。删除前必须立即重验 manifest／引用并把 source 原子移到同文件系统 sibling quarantine；rename 后和最终 cleanup 前都重新验证 source absence、quarantine manifest／mode、destination 与引用，全部 postconditions 通过后才最终删除，Structure candidate 在写入前必须验证同文件系统 atomic no-replace primitive 可用，否则 Defer。失败恢复在 rename 调用边界再次确认 source absent，并使用该 no-replace primitive；primitive 不可用或 source 已重建时禁止覆盖／删除，保留 source、quarantine 与 destination 并报告 unresolved recovery conflict。每个候选都需 Task-system ownership、唯一 owner、适用时的 canonical destination、完整 manifest／引用边界与一次精确 `Safety Confirmation`。
- `skills/meta/task-maintenance/evals/structure_operation_cases.json` 与 `tests/task-files.test.mjs` 共同固定三类 structure operation、unique-content Defer 及 stable-ID live-consumer gate。
```

</details>

### 15 · CTX-install — Installer target selection and workflow delivery

处置：导入 Project Memory。

理由：保留安装目标选择和不改写用户指令文件的边界。

核对依据：bin/csl-agent-kit.js

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-d3613f68e48dfcd44c44.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-d3613f68e48dfcd44c44.md)

标题：安装目标与工作流分发

类型：`fact`；检索摘要：修改安装器或诊断宿主集成时使用；区分默认、保存和显式选择，安装动作不能冒充宿主注入成功。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-install — Installer target selection and workflow delivery
- Scope: `csl-agent-kit install` 的默认、已保存与显式 integration target 选择，以及内置 Agent Hooks 行为契约的独立注入边界。
- Paths: `bin/csl-agent-kit.js`, `README.md`, `skills/meta/agent-hooks/`, `tests/cli-install-output.test.js`
- Keywords: install, default targets, saved selection, Codex plugin, Pi package, Agent Hooks, Cursor
- Authority: `bin/csl-agent-kit.js`, `skills/meta/agent-hooks/scripts/lib/runtime.js`, `skills/meta/agent-hooks/scripts/read-csl-agent-kit-contract.js`, `tests/cli-install-output.test.js`
- Recheck: 当 install target 集合、`default` 标记、selection persistence 或 Agent Hooks host capabilities 变化时复核。

### Purpose and Boundaries
- 新安装或无有效已保存选择时，默认 checklist 与 `--yes` 只选择 `codex-plugin`；已保存 checklist 选择代表用户先前确认，显式 `--target` 与 `--all` 继续按用户选择执行。
- Installer 只暴露 `cursor`、`codex-plugin` 与 `pi` integration targets；不再安装或替换全局 Agent instruction 文件，旧 `super-agent` target 与 `--no-super-agent` option 被拒绝。

### Relationships
- Codex、Claude Code 与 Pi 通过默认启用的 `inner:csl-agent-kit-contract` 获得自包含行为契约，不依赖替换用户默认指令文件；Cursor 在宿主支持 injected context 前保持 unsupported，且不提供文件替换回退。

### Decision and Verification Boundaries
- 交互 multiselect 的提交已构成安装授权，不再追加通用确认；默认和已保存选择由 `buildInstallChoices()` 与 selection helpers 约束，旧安装入口以负向拒绝断言验证，宿主注入能力以 `agent-hooks show inner:csl-agent-kit-contract --host <host>` 验证。
```

</details>

### 16 · CTX-tab-title — Pi terminal tab title refresh

处置：导入 Project Memory。

理由：保留标题刷新模型、文本输入范围、并发写入和失败不覆盖规则。

核对依据：skills/meta/agent-hooks/scripts/refresh-tab-title.js；pi/extensions/csl-context-hooks.ts

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-9e202660c5470b4d1098.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-9e202660c5470b4d1098.md)

标题：Pi 终端标题刷新

类型：`fact`；检索摘要：修改自动标题或手动 /title 行为时使用；标题状态、输入范围和失败保留有独立边界。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-tab-title — Pi terminal tab title refresh
- Scope: Pi 终端标签标题的自动与手动刷新、生成边界、持久化和并发保护。
- Paths: `pi/extensions/csl-context-hooks.ts`, `skills/meta/agent-hooks/hooks/refresh-tab-title.md`, `skills/meta/agent-hooks/scripts/refresh-tab-title.js`, `tests/pi-context-hooks.test.mjs`, `tests/agent-hooks.test.js`
- Keywords: terminal tab title, Chinese title, core intent, /title, prompt-submit, OSC, TTY
- Authority: `pi/extensions/csl-context-hooks.ts`, `skills/meta/agent-hooks/hooks/refresh-tab-title.md`, `skills/meta/agent-hooks/scripts/refresh-tab-title.js`, `tests/pi-context-hooks.test.mjs`, `tests/agent-hooks.test.js`
- Recheck: 当标题刷新时机、输入上下文、生成模型、中文与格式约束、TTY 写入、持久化或手动结果反馈发生变化时复核。

### Purpose and Boundaries
- `inner:refresh-tab-title` 更新终端标签的 OSC 标题而非 Pi session metadata；成功标题只显示简洁中文任务描述，不包含项目目录名前缀。中文是表达语言而非纯汉字字符集，信息密度更高时可保留数字、拉丁字母和技术术语。

### Workflows
- Pi 在带 prompt 的 `before_agent_start` 中触发 `prompt-submit`；自动刷新把当前活跃分支的用户与 Assistant 文本及最新 prompt 限制在 12,000 字符内交给独立模型，排除工具调用、工具结果、thinking、图片、项目文件和主 Agent 上下文；原生压缩后注入的 `Compaction completed. Continue.` 内部提示会在派发标题 worker 前确定性跳过，不生成或写入标题。
- `/title` 使用同类有界对话手动刷新，有参数时将参数作为最新用户请求追加；自动刷新非阻塞且不显示 toast；手动派发异常会立即显示原始错误且不启动结果监听，派发成功后通过 request ID 报告 refreshed、unchanged、failed 或 timed out。

### Decision and Verification Boundaries
- 标题模型同时接收当前已保存标题与有界会话文本：先从完整上下文识别当前工作，再判断最新消息是任务切换、细化、回答、确认还是操作；原标题仍准确或上下文不足时返回保持决定，否则生成脱离最新消息也有明确任务含义的新标题。
- 代码要求新标题至少 4 个、最多 24 个 Unicode 码点且包含汉字，并确定性清理模型元标签、目录前缀、纯操作型或无效输出；保持决定会在 TTY 锁和 latest-token 检查内重新写入该 workspace 的最后成功标题，无历史标题时不写入，模型失败或无效输出也不覆盖已有有效标题。
```

</details>

### 17 · CTX-memory-runtime — Memory 存储与后台维护边界

处置：导入 Project Memory。

理由：保留本任务已由源码确认的 Memory 边界，激活标记不等于迁移或验收完成。

核对依据：bin/memory/store.js；bin/memory/queue.js；bin/memory/agent.js；pi/lib/memory-bridge.ts

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-97c02696d8c555646b77.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-97c02696d8c555646b77.md)

标题：Memory 存储与后台维护边界

类型：`fact`；检索摘要：修改 Memory 存储、模型选择、后台队列、审批或 Pi 激活时读取。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## CTX-memory-runtime — Memory 存储与后台维护边界
- Scope: Memory 条目存储、默认模型解析、持久队列、独立 SDK 会话、本机审计服务和 Pi 激活边界。
- Paths: `bin/memory/`, `bin/csl-agent-kit.js`, `pi/lib/memory-bridge.ts`, `skills/meta/agent-hooks/hooks/memory-maintenance.md`
- Keywords: memory, revision, hash, queue, daemon, approval, agent_settled, model default
- Authority: `bin/memory/store.js`, `bin/memory/model-config.js`, `bin/memory/queue.js`, `bin/memory/agent.js`, `bin/memory/daemon.js`, `pi/lib/memory-bridge.ts`, `docs/memory.md`
- Recheck: Memory schema、Pi SDK API、模型配置优先级、后台调度、审批或旧机制切换入口变化时复核。

### Structure
- `bin/memory/store.js` 以 User/Project 各自 memory 根内的 Markdown 条目为权威，索引可重建；revision/hash 在写锁内核对，墓碑保持版本连续，审计保留 before/after。pending 恢复依赖当前文件 hash，不能把异常当成未提交。
- `bin/memory/model-config.js` 的 Memory 独立覆盖优先于 Pi 用户级保存的默认模型；不读取前台会话临时切换，配置缺失或不可用不选择其他模型。
- `bin/memory/queue.js` 在用户 Memory 根的 `.service` 保存事件与独立处理状态；同一 workspace/session/eventKey 绑定内容 hash。服务按项目串行、跨项目最多两个并发；失败或中断事件阻挡同项目后续事件，显式 retry 保留已记录的 effects。
- `bin/memory/agent.js` 使用 Pi SDK 的全新内存会话和空资源加载器，不加载环境 extensions、skills 或主任务 Hooks；允许源码只读工具及专用 Memory 工具，没有 shell、普通文件编辑或用户提案审批接口。服务独立于前台终端存活。

### Decision and Verification Boundaries
- Pi bridge 仅在项目 `.active.json` 符合 `csl-memory-activation/v1` 时接入；该标记是迁移及消费者切换门，不能用手动创建标记替代迁移确认。`agent_settled` 只定向派发 `inner:memory-maintenance`，游标推进绑定持久入队内容 hash，不等于模型处理完成。
- 本机面板绑定 127.0.0.1，以随机 bearer token 和严格 Host/Origin 校验保护 API；用户级批准绑定展示的提案 digest 与条目 CAS。审批是 Prompt/CLI/UI 工作流边界，不是针对本地文件或内部 API 修改的操作系统沙箱。
```

</details>

### 18 · Components

处置：导入 Project Memory。

理由：保留未被旧索引收录的有效组件知识和参考仓位置；已检查该本机参考仓存在且 origin 为 mattpocock/skills。

核对依据：pi/extensions/csl-context-hooks.ts；skills/meta/agent-hooks/scripts/validate-rules.js；git -C /Users/caishilin/Desktop/test/skills remote get-url origin

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-1617a7ae8f376d8041a9.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-1617a7ae8f376d8041a9.md)

标题：补充组件边界与本机参考仓

类型：`fact`；检索摘要：查找 Agent Hooks 验证器、Pi 文件变更事件或第三方 skills 参考仓时使用；本机路径使用前复核。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## Components

- Agent Hooks 的分发 `SKILL.md` 使用英文，以 bundled CLI 作为 accepted-behavior authority，不把项目 RFC 当作 runtime guidance。
- `pi/extensions/csl-context-hooks.ts` 是 Agent Hooks 的 Pi adapter：通过 facade 的 `createEvent()` / `runEvent()` 生成以 `ctx.cwd` 为工作区的标准事件；它按 `toolCallId` 记录 `write` / `edit` 调用前状态，成功结果提供工作区相对的 `changed_files`（`created` / `modified`），失败或工作区外文件提供空数组，其他工具保持 unknown。权威实现与回归测试为该 extension 和 `tests/pi-context-hooks.test.mjs`。
- `skills/meta/agent-hooks/scripts/validate-rules.js` 复用 V1 `parseMarkdown()` 校验一个或多个候选 Hook Markdown 的 frontmatter 与规则语义；已存储脚本的可执行性和宿主 effective 状态仍以 `agent-hooks show` 为准。权威入口是该脚本与 `skills/meta/agent-hooks/SKILL.md`。

- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。
```

</details>

### 19 · Relationships

处置：导入 Project Memory。

理由：保留未被旧索引收录的宿主注入与信任关系；用户级 Hook 的实时启用状态仍须现场核对。

核对依据：skills/meta/agent-hooks/SKILL.md；pi/extensions/csl-context-hooks.ts；原 Relationships 中列出的来源

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-d88f9609a385b39dc7e3.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-d88f9609a385b39dc7e3.md)

标题：宿主 Hook 注入与信任关系

类型：`fact`；检索摘要：诊断跨宿主规则注入、信任或本机通知时使用；持久配置存在不等于运行成功。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## Relationships

- 全局 Agent Hooks 规则 `global:notify-todo-changed` 在 Pi 上通过 `edit` / `write` 的标准 `changed_files` 识别 `tasks/tasks/*.md` 变更，在 Codex 上保留 `apply_patch` header fallback；脚本规范化真实路径并限制在 workspace 的真实 `tasks/tasks` 目录后，使用 `terminal-notifier` 发送可点击的 macOS 通知。权威来源为 `~/.csl-agent-kit/hooks/notify-todo-changed.md` 与 `~/.csl-agent-kit/hooks/scripts/notify-todo-changed.js`。
- Codex 对每条非 managed command hook 按定义 hash 单独保存 trust；CSL Agent Kit 的 Agent Hooks `PostToolUse` dispatcher 必须先在 `/hooks` 中信任才会运行。
- 用户跨会话持久指令以单条全局 Agent Hooks `session-start` / `inject-prompt` 规则存放在 `<data-root>/hooks/`；Codex 与 Claude Code 通过 `SessionStart` dispatcher 注入，Pi 在每次 `before_agent_start` 重新加载。规则不按用户 prompt 关键词匹配。
- hook-only 客户端的 `UserPromptSubmit` 只运行 SOP candidates；持久指令通过 Agent Hooks `SessionStart` 规则注入。Pi 在 `before_agent_start` 重建 Agent Hooks session prompts 与 SOP context。
- 持久指令只在用户明确要求跨会话保存时创建，每条使用独立的 `global:directive-<subject>` 规则并保留高优先级指令和当前请求优先的边界；个人化内容不进入可分发的 CSL Agent Kit Contract。
```

</details>

### 20 · Decisions and Conventions

处置：导入 Project Memory。

理由：保留未被旧索引收录的约定；纠正与当前委派授权边界冲突的旧概括并移除尾部误字。

核对依据：skills/meta/task/SKILL.md；skills/dev/adversarial-review/SKILL.md；当前会话的工具与委派授权规则

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-c9e1b7a7d7d8266238aa.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-context-c9e1b7a7d7d8266238aa.md)

标题：项目约定与审查职责边界

类型：`fact`；检索摘要：理解任务记录、审查角色、规则分层和 Skill 语言约定时读取；当前权威契约优先。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## Decisions and Conventions

- Skill packages use English for `SKILL.md`, runtime references, prompts, templates, and eval-facing prose; generated reports and user responses still follow the user's language. A task that modifies one skill does not bulk-translate unrelated existing packages unless the user explicitly requests a repository-wide migration — authoritative source: user confirmation on 2026-08-07; review when that language convention changes.
- 新任务从下一项开始采用 `Target` 作为唯一 checkbox（稳定 `Tn` ID），`Plan` 使用普通有序列表，`Result` 按 Target ID 记录当前证据，不再创建独立 `Checklist`；`Scope`、`Block` 与 review details 仅在生命周期需要时出现，当前任务和未触及历史不迁移。
- 自动注入的 CSL Agent Kit Contract 保留稳定原则、task-family 路由与分级审查触发边界；详细字段、循环和输出契约属于 Skill 与共享协议。所有请求交付物文件改动（包括 trivial edits）进入 task 记录，所有结果按风险验证；R0／R1 在具备当前 assessment 且无显式或既有审查义务时可免独立审查，R2 执行 mandatory `task-review` 并以 `Passed` 完成。R1 包括满足全部条件的小范围逻辑修改，不按行数或主观信心免审。`$adversarial-review`、双 Agent Reviewer–Editor 循环与独立 Reviewer 批准仍仅在用户明确要求时触发；R2 不能用它们替代 mandatory pass。
- `adversarial-review` 必须把 `Finding`、`Required Outcome` 和 `Suggested Remedy` 作为三个独立概念：Finding 只陈述有证据的问题或风险，Required Outcome 只定义必须达到的结果，Suggested Remedy 是可被 Editor 接受、缩小或基于证据拒绝的建议；解决 Finding 不等于必须采用 Reviewer 的建议实现。
- `adversarial-review` 的 `BLOCKER` 必须同时说明被违反的要求或原则、可观察证据、不处理的实际风险与 `Required Outcome`；缺少任一项时不得作为阻塞性 Finding，应降级为 `QUESTION`、`NOTE` 或省略。`Suggested Remedy` 不能代替这四项成立条件。
- `adversarial-review` 的 Editor 对每个 Finding 必须依次审计 `Current Adequacy`、`Minimal Resolution`、`Blast Radius` 与 `Proportionality`，再选择接受、缩小、拒绝、确认无需修改或需要用户决定。当前方案已满足 `Required Outcome` 时默认保留，除非正确性、安全、数据完整性或明确需求提供了必须变更的证据。
- `adversarial-review` 只以 `Required Outcome` 是否已满足作为 Finding 的复审和关闭标准，不以 `Suggested Remedy` 是否被采用为标准。Editor 的更小修复或基于证据的拒绝已消除风险时，Reviewer 必须关闭 Finding；若继续阻塞，必须指出新证据或仍未满足的 `Required Outcome`，不得只重复原建议。
- `adversarial-review` 的 Finding 类型语义固定：`BLOCKER` 是满足四项成立条件的明确违规或实质风险，可通过满足 `Required Outcome` 或证明 Finding 不成立而关闭；`QUESTION` 只请求判断所需的缺失信息，不得隐含修改命令；`NOTE` 是非阻塞观察或可选改进，Editor 确认后即关闭，不得要求修改 artifact。纯偏好、顺手重构与推测性未来需求应省略。
- `adversarial-review` 的 Reviewer 与 Editor 共同遵守以下优先级：用户意图，然后是正确性、安全、数据完整性与明确兼容要求，再是 `Required Outcome`、证据、最小改动、最小影响范围和最低的已证成本。当多个方案都满足 `Required Outcome` 时，必须选择影响范围更小、维护成本更低且新假设更少的方案；最终以测试或可观察证据判定，不以双方口头同意判定。
- `tasks/tasks.md` 是 newest-first 导航索引，只保存任务标题、当前状态和 `tasks/tasks/<task-slug>.md` 的索引相对链接 `tasks/<task-slug>.md`；每个独立任务文件才是目标、计划、审查状态与复核历史的唯一权威记录。Agent 只能修改所属任务文件及其精确索引项，不能重写其他任务状态。
- `adversarial-review` 在循环运行中只通过 Agent handoff 传递完整 finding ledger，不写中间报告或同步 task 状态；仅在审查结束或暂停时写一次 `tasks/artifacts/<task-id>/reports/adversarial-review.md`。最终文件只包含每个实质 finding 的讨论结果和一项最终决定，其中 `Reviewer position` 与 `Editor response` 用嵌套列表逐条展示核心观点；报告不含总体结论、主题清单、验证章节、Reviewer/轮次/fingerprint/round history 等技术附录。写入前必须已有 owning task；缺失时返回 Task 激活，写入后只向该 task 追加最终决定和报告链接。
- 每次 adversarial-review pass 都必须覆盖固定的完整 scope：Reviewer 一次性报告当前可见的全部 `BLOCKER`、`QUESTION` 与 `NOTE`，并在复审中逐项说明全部既有 finding ID 已解决或未解决，不得故意分轮释放；Editor 一次性回答和处理整轮全部条目后才能请求普通复审。后续新 finding 必须指出使其此前不可行动的新 artifact、diff、证据或其他原因；需要用户决定时保持 `BLOCKED`，多个方案进入 Decision Consensus Gate，否则直接询问用户，不得用普通复审绕过决定。
- `adversarial-review` 对代码、PRD、RFC、设计文档及其他交付物执行同一 fail-closed 双 Agent 流程；不设总轮次上限，只保留单调递增的 `INITIAL (1)` 与 `RE-REVIEW (n)` 审计编号。流程仅按 `APPROVED`、需要用户、客观阻塞、连续无实质进展或用户停止等状态结束或暂停；不同交付物只切换 review lens。
- `skills/meta/agent-sops/references/code-style/swift-style.md` 只保留按主题分组的 Swift 具体规则：类型与状态、可选值与失败路径、控制流、enum 与 MARK、extension 组织、方法布局、文档注释和改动边界；覆盖 `T!` 边界、强制操作、`guard`、`for ... where`、`@unknown default`、类型简写和公开声明 summary。只有需要展示精确语法或布局的规则才附最小代码块，适用边界和使用顺序放在 `code-style.md`。
- 任务计划记录不等于进入宿主 plan mode 或授权委派。使用 subagent 仍须当前用户或适用指令授权，任务规模本身不构成授权；必要独立审查按 Task 契约执行。
- CSL Agent Kit Contract 位于 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 并随 Agent Hooks skill 分发；仓库不再发布或安装独立的 `super-agent` 规则资产。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## Decisions and Conventions

- Skill packages use English for `SKILL.md`, runtime references, prompts, templates, and eval-facing prose; generated reports and user responses still follow the user's language. A task that modifies one skill does not bulk-translate unrelated existing packages unless the user explicitly requests a repository-wide migration — authoritative source: user confirmation on 2026-08-07; review when that language convention changes.
- 新任务从下一项开始采用 `Target` 作为唯一 checkbox（稳定 `Tn` ID），`Plan` 使用普通有序列表，`Result` 按 Target ID 记录当前证据，不再创建独立 `Checklist`；`Scope`、`Block` 与 review details 仅在生命周期需要时出现，当前任务和未触及历史不迁移。
- 自动注入的 CSL Agent Kit Contract 保留稳定原则、task-family 路由与分级审查触发边界；详细字段、循环和输出契约属于 Skill 与共享协议。所有请求交付物文件改动（包括 trivial edits）进入 task 记录，所有结果按风险验证；R0／R1 在具备当前 assessment 且无显式或既有审查义务时可免独立审查，R2 执行 mandatory `task-review` 并以 `Passed` 完成。R1 包括满足全部条件的小范围逻辑修改，不按行数或主观信心免审。`$adversarial-review`、双 Agent Reviewer–Editor 循环与独立 Reviewer 批准仍仅在用户明确要求时触发；R2 不能用它们替代 mandatory pass。
- `adversarial-review` 必须把 `Finding`、`Required Outcome` 和 `Suggested Remedy` 作为三个独立概念：Finding 只陈述有证据的问题或风险，Required Outcome 只定义必须达到的结果，Suggested Remedy 是可被 Editor 接受、缩小或基于证据拒绝的建议；解决 Finding 不等于必须采用 Reviewer 的建议实现。
- `adversarial-review` 的 `BLOCKER` 必须同时说明被违反的要求或原则、可观察证据、不处理的实际风险与 `Required Outcome`；缺少任一项时不得作为阻塞性 Finding，应降级为 `QUESTION`、`NOTE` 或省略。`Suggested Remedy` 不能代替这四项成立条件。
- `adversarial-review` 的 Editor 对每个 Finding 必须依次审计 `Current Adequacy`、`Minimal Resolution`、`Blast Radius` 与 `Proportionality`，再选择接受、缩小、拒绝、确认无需修改或需要用户决定。当前方案已满足 `Required Outcome` 时默认保留，除非正确性、安全、数据完整性或明确需求提供了必须变更的证据。
- `adversarial-review` 只以 `Required Outcome` 是否已满足作为 Finding 的复审和关闭标准，不以 `Suggested Remedy` 是否被采用为标准。Editor 的更小修复或基于证据的拒绝已消除风险时，Reviewer 必须关闭 Finding；若继续阻塞，必须指出新证据或仍未满足的 `Required Outcome`，不得只重复原建议。
- `adversarial-review` 的 Finding 类型语义固定：`BLOCKER` 是满足四项成立条件的明确违规或实质风险，可通过满足 `Required Outcome` 或证明 Finding 不成立而关闭；`QUESTION` 只请求判断所需的缺失信息，不得隐含修改命令；`NOTE` 是非阻塞观察或可选改进，Editor 确认后即关闭，不得要求修改 artifact。纯偏好、顺手重构与推测性未来需求应省略。
- `adversarial-review` 的 Reviewer 与 Editor 共同遵守以下优先级：用户意图，然后是正确性、安全、数据完整性与明确兼容要求，再是 `Required Outcome`、证据、最小改动、最小影响范围和最低的已证成本。当多个方案都满足 `Required Outcome` 时，必须选择影响范围更小、维护成本更低且新假设更少的方案；最终以测试或可观察证据判定，不以双方口头同意判定。
- `tasks/tasks.md` 是 newest-first 导航索引，只保存任务标题、当前状态和 `tasks/tasks/<task-slug>.md` 的索引相对链接 `tasks/<task-slug>.md`；每个独立任务文件才是目标、计划、审查状态与复核历史的唯一权威记录。Agent 只能修改所属任务文件及其精确索引项，不能重写其他任务状态。
- `adversarial-review` 在循环运行中只通过 Agent handoff 传递完整 finding ledger，不写中间报告或同步 task 状态；仅在审查结束或暂停时写一次 `tasks/artifacts/<task-id>/reports/adversarial-review.md`。最终文件只包含每个实质 finding 的讨论结果和一项最终决定，其中 `Reviewer position` 与 `Editor response` 用嵌套列表逐条展示核心观点；报告不含总体结论、主题清单、验证章节、Reviewer/轮次/fingerprint/round history 等技术附录。写入前必须已有 owning task；缺失时返回 Task 激活，写入后只向该 task 追加最终决定和报告链接。
- 每次 adversarial-review pass 都必须覆盖固定的完整 scope：Reviewer 一次性报告当前可见的全部 `BLOCKER`、`QUESTION` 与 `NOTE`，并在复审中逐项说明全部既有 finding ID 已解决或未解决，不得故意分轮释放；Editor 一次性回答和处理整轮全部条目后才能请求普通复审。后续新 finding 必须指出使其此前不可行动的新 artifact、diff、证据或其他原因；需要用户决定时保持 `BLOCKED`，多个方案进入 Decision Consensus Gate，否则直接询问用户，不得用普通复审绕过决定。
- `adversarial-review` 对代码、PRD、RFC、设计文档及其他交付物执行同一 fail-closed 双 Agent 流程；不设总轮次上限，只保留单调递增的 `INITIAL (1)` 与 `RE-REVIEW (n)` 审计编号。流程仅按 `APPROVED`、需要用户、客观阻塞、连续无实质进展或用户停止等状态结束或暂停；不同交付物只切换 review lens。
- `skills/meta/agent-sops/references/code-style/swift-style.md` 只保留按主题分组的 Swift 具体规则：类型与状态、可选值与失败路径、控制流、enum 与 MARK、extension 组织、方法布局、文档注释和改动边界；覆盖 `T!` 边界、强制操作、`guard`、`for ... where`、`@unknown default`、类型简写和公开声明 summary。只有需要展示精确语法或布局的规则才附最小代码块，适用边界和使用顺序放在 `code-style.md`。
- 默认 agent 规则不规定 plan mode 或 subagent 策略；agent 可以按任务需要自行使用这些能力。d
- CSL Agent Kit Contract 位于 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 并随 Agent Hooks skill 分发；仓库不再发布或安装独立的 `super-agent` 规则资产。
```

</details>

### 21 · 文件前言

处置：仅保留源备份，不建立条目。

理由：只有 Lessons 容器标题，无独立知识；原文保留在源备份。

核对依据：tasks/lessons.md 的文件前言

### 22 · L-20260821-skill-rename-consumers — Skill 移动或重命名时解析全部消费者

处置：导入 Project Memory。

理由：保留迁移时必须覆盖所有消费者的防错规则；记忆载体更名不放宽验证。

核对依据：tasks/lessons.md 对应条目；当前迁移范围的消费者搜索

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-ee71ff239af7ce21b617.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-ee71ff239af7ce21b617.md)

标题：Skill 移动或重命名的消费者检查

类型：`experience`；检索摘要：删除或移动 Skill 时检查发现、manifest、安装、文档、规则与路径构造器；历史任务不批量重写。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## L-20260821-skill-rename-consumers — Skill 移动或重命名时解析全部消费者

### Trigger
- 删除、弃用、移动或重命名一个 Skill、目录或 slash alias。

### Rule
- 在同一改动中搜索并清理当前 README、manifest、安装枚举、规则、Context Authority、路径构造器和测试消费者中的旧名称或旧路径；历史任务记录保持不变。
- 逐个解析共享根目录变量、相对路径与生成式消费者到实际文件，不能只搜索完整旧字符串；已有替代 Skill 时只暴露 canonical 名称。

### Check
- 搜索旧名称和旧路径后只剩有意保留的历史、迁移记录或负向拒绝断言。
- 每个当前消费者解析出的 canonical 路径实际存在，旧路径不存在；获准运行时，相关发现、命令、安装与路径消费者测试通过。
```

</details>

### 23 · 2026-08-07 Skill packages use English

处置：导入 Project Memory。

理由：这是已确认的项目语言约定，不降格为软偏好；只改变记忆载体。

核对依据：tasks/lessons.md 对应条目；tasks/context.md#Decisions and Conventions

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-85aba95d4e2536609b3c.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-85aba95d4e2536609b3c.md)

标题：Skill package 的项目语言约定

类型：`fact`；检索摘要：编写 Skill 规则、运行契约或评测说明时使用；用户回复与报告语言独立处理。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-08-07 Skill packages use English

- **Trigger:**
  - Creating or modifying any project-local or distributable skill package.
- **Rule:**
  - Write `SKILL.md`, runtime references, prompts, templates, and eval-facing prose in English.
  - Keep generated reports and user-facing answers in the user's language.
  - Do not bulk-translate unrelated existing skill packages unless the user explicitly requests a repository-wide migration.
- **Check:**
  - Changed skill-package prose is English, except fixtures that intentionally test another language.
  - Report language remains independent from skill-source language.
```

</details>

### 24 · 2026-07-31 发布完成前必须验证最终远端 CI

处置：导入 Project Memory。

理由：保留发布验证不能由旧运行或本地检查替代的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-cab48fff3215d7a069b0.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-cab48fff3215d7a069b0.md)

标题：发布后核对最终远端 CI

类型：`experience`；检索摘要：push、打 tag 或发布后核对远端 headSha 和最终 CI 结论，不复用旧证据。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-31 发布完成前必须验证最终远端 CI

- **Trigger:**
  - 任务包含向受 CI 保护的分支 push、打 tag 或发布包。
- **Rule:**
  - 最终 push 后必须定位与远端目标 branch HEAD 完全一致的 CI run，并等待其成功；本地测试、dry-run、registry 发布成功或旧 commit 的 CI 结果都不能替代该检查。
  - CI 失败时立即重新打开所属任务，修复并验证新的最终 run 后才能报告发布完成。
- **Check:**
  - CI run 的 `headSha` 与远端 branch HEAD 一致，且结论为 `success`。
  - 任务 Result 记录最终 run 的 ID 或 URL 与成功结论。
```

</details>

### 25 · 2026-07-31 共享格式迁移必须覆盖所有读写方

处置：导入 Project Memory。

理由：保留格式迁移必须覆盖生产者与消费者的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-86b15cd6e022d3d4c89d.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-86b15cd6e022d3d4c89d.md)

标题：共享格式迁移覆盖全部读写方

类型：`experience`；检索摘要：修改公共文件格式前检查所有读写方和 fixture；仅写入侧通过不足以证明兼容。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-31 共享格式迁移必须覆盖所有读写方

- **Trigger:**
  - 修改由 workflow、检查脚本、扩展或其他组件共同读写的文件格式。
- **Rule:**
  - 变更前搜索所有生产者、消费者和格式样例，并以实际运行时消费者的解析契约验证候选格式。
  - 在同一改动中同步规则、校验器和受影响的消费者测试；不能只验证写入侧格式。
- **Check:**
  - 同一个候选 fixture 同时通过写入侧校验和运行时消费者测试。
  - 搜索旧格式后只剩有意保留的历史记录或明确的拒绝用例。
```

</details>

### 26 · 2026-07-29 用目标化检查阻止历史样例覆盖新记录契约

处置：导入 Project Memory。

理由：保留新记录校验与未触及历史兼容之间的边界。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-b2bf252c5ad15be46531.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-b2bf252c5ad15be46531.md)

标题：新记录校验不要被历史样例放宽

类型：`experience`；检索摘要：同一索引保留旧记录时，只对当前触及的新记录落实现行契约，不借机批量迁移。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-29 用目标化检查阻止历史样例覆盖新记录契约

- **Trigger:**
  - 同一索引保留旧格式历史记录，但新建、重新打开或更新的记录必须采用新格式。
- **Rule:**
  - 为当前触及的记录提供可执行格式检查，并在写入后强制运行；不得因历史兼容边界而只依赖提示文本。
  - 检查只针对当前记录，不能要求批量迁移未触及的历史数据。
- **Check:**
  - 新格式目标记录通过，旧格式或与 canonical record 不一致的目标记录失败。
  - 未触及的旧格式兄弟记录不阻塞当前检查。
```

</details>

### 27 · 2026-07-28 共享 UI 状态的“保持”不能等同于无操作

处置：导入 Project Memory。

理由：保留共享状态被宿主覆盖后的正确恢复经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-f70055900a7ae1733947.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-f70055900a7ae1733947.md)

标题：共享 UI 状态的保持与恢复

类型：`experience`；检索摘要：Hook 与宿主都写 UI 状态时，保持决定可能需要重应用旧值，不能等同于不操作。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-28 共享 UI 状态的“保持”不能等同于无操作

- **Trigger:**
  - Hook 或后台任务要求保持标题、状态栏或其他 UI 值，而宿主生命周期也可能改写同一状态。
- **Rule:**
  - 保存最后一次成功写入的所属值；明确的保持决定应重新应用该值，不能假设当前外部状态未被覆盖。
  - 将保持决定与生成失败分开处理；失败路径继续遵守其独立的不写入约束。
- **Check:**
  - 测试模拟外部覆盖后，保持路径恢复最后一次成功值。
  - 测试确认无历史值的初始化行为和生成失败行为分别符合产品约束。
```

</details>

### 28 · 2026-07-28 为模型生成的短 UI 标签设置确定性边界

处置：导入 Project Memory。

理由：保留模型文本必须由代码落实长度和格式边界的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-c4d4acd64f5ea359d5f3.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-c4d4acd64f5ea359d5f3.md)

标题：模型生成短 UI 标签的确定性约束

类型：`experience`；检索摘要：生成标题、标签或徽标时，由代码验证长度与格式并跳过纯操作型消息，不只依赖提示词。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-28 为模型生成的短 UI 标签设置确定性边界

- **Trigger:**
  - 模型生成终端标题、标签、徽标或其他要求严格简短且禁止出现操作过程的 UI 文本。
- **Rule:**
  - Prompt 负责描述核心语义，代码负责强制长度、清理模型元标签，并确定性跳过已知的纯操作型跟进；不得只依赖模型遵守格式和分类要求。
  - 将用户报告的实际坏输出加入回归测试。
- **Check:**
  - 生成文本不超过产品规定的 Unicode 码点上限，且不含模型元标签。
  - commit、push、test、retry、continue 等纯操作样例不会覆盖现有标签。
```

</details>

### 29 · 2026-07-23 Workflow skill 完整性优先于初始加载预算

处置：导入 Project Memory。

理由：保留完整契约优先于上下文预算警告的边界。

核对依据：tasks/lessons.md 对应条目；AGENTS.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-c735f05f02e12f5da335.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-c735f05f02e12f5da335.md)

标题：Workflow Skill 完整性优先于预算警告

类型：`experience`；检索摘要：Skill 预算超限时保留必要流程与异常处理，不为消除 warning 删除核心契约。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-23 Workflow skill 完整性优先于初始加载预算

- **Trigger:**
  - 创建、优化或审计负责复杂任务指导的 workflow skill。
- **Rule:**
  - workflow skill 的准确性和完整性优先于 1000-token 初始加载预算。
  - 不得为了通过该预算而删除、压缩失真或拆散执行所必需的核心契约。
- **Check:**
  - 核心判断、步骤、状态迁移、异常处理和完成条件可从主 `SKILL.md` 完整获得。
  - 初始加载预算超限只作为已知检查结果记录，不作为 workflow skill 的完成阻塞项。
```

</details>

### 30 · 2026-07-23 Avoid Redundant Confirmation After Explicit Selection

处置：导入 Project Memory。

理由：保留安装器显式选择后的去重复确认经验；不将它泛化为绕过 Task Target 或独立安全门。

核对依据：tasks/lessons.md 对应条目；bin/csl-agent-kit.js 的交互安装流程

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-ed7ba763a9bff7d3c6d7.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-ed7ba763a9bff7d3c6d7.md)

标题：显式安装选择后避免重复确认

类型：`experience`；检索摘要：交互安装已提交同一选择时，不再增加无意义确认；实质范围变化和 Task 对齐门仍独立适用。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-23 Avoid Redundant Confirmation After Explicit Selection

- **Trigger:** A user explicitly selects installation targets, then the workflow asks a generic second confirmation for the same selected actions.
  - **Rule:** For the same interactive installation selection, treat the explicit selection-and-submit step as authorization unless the later action introduces a materially different risk or irreversible consequence. This does not replace Task Target acceptance or separately required safety gates. When removing a prompt, remove every reader and guard for its response value in the same change.
  - **Why:** Reconfirming the same scope adds friction, while leaving a downstream response guard makes the accepted path fail after the prompt disappears.
```

</details>

<details><summary>对照源正文</summary>

```markdown
## 2026-07-23 Avoid Redundant Confirmation After Explicit Selection

- **Trigger:** A user explicitly selects installation targets, then the workflow asks a generic second confirmation for the same selected actions.
  - **Rule:** Treat the explicit selection-and-submit step as authorization unless the later action introduces a materially different risk or irreversible consequence. When removing a prompt, remove every reader and guard for its response value in the same change.
  - **Why:** Reconfirming the same scope adds friction, while leaving a downstream response guard makes the accepted path fail after the prompt disappears.
```

</details>

### 31 · 2026-07-22 Keep Distributed Skills Self-Contained

处置：导入 Project Memory。

理由：保留共享 Skill 不能依赖项目私有 RFC 的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-8d4dd4d0e6e77c693311.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-8d4dd4d0e6e77c693311.md)

标题：可分发 Skill 必须自包含

类型：`experience`；检索摘要：项目 RFC 可提供设计背景，但共享 Skill 的运行契约必须随包分发。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-22 Keep Distributed Skills Self-Contained

- **Trigger:** A project RFC or guide informed a distributable skill, but the user clarified that the project document is not part of the skill source.
  - **Rule:** Put operational guidance inside the skill package, keep Agent-facing prose in the requested distribution language, and treat project RFCs as rationale only unless they are explicitly part of the runtime contract.
  - **Why:** A distributed skill must remain usable without repository-only documents, and design history must not override implemented behavior.
```

</details>

### 32 · 2026-07-21 将易变工作流留在 Skill 中

处置：导入 Project Memory。

理由：保留稳定规则与易变工作流的职责分离。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-4d41e994a36c0cfd127b.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-4d41e994a36c0cfd127b.md)

标题：稳定触发规则与易变工作流分开

类型：`experience`；检索摘要：精简规则时保留触发、强制动作和顺序，把易变步骤放入对应 Skill，而非只留一个名字。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-21 将易变工作流留在 Skill 中

- **Trigger:** 优化通用或项目 `AGENTS.md`，且相关 workflow 依赖 skill 主动触发。
- **Rule:** `AGENTS.md` 必须保留稳定的触发条件、强制动作、先后顺序和跳过边界；只有易变的字段、循环和输出契约留在 skill。不得把启动工作流所必需的信息压缩成只有 skill 名称或高层路由。
- **Check:** 脱离 hook 注入时，仅阅读 `AGENTS.md` 也能判断何时加载 skill、实施前应读写哪些文件，以及何时可以跳过。
```

</details>

### 33 · 2026-07-20 让多 Agent 角色名匹配工作阶段

处置：导入 Project Memory。

理由：保留讨论角色与成稿审查角色应区分的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-2699bc1d510c4a39b732.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-2699bc1d510c4a39b732.md)

标题：多 Agent 角色名匹配工作阶段

类型：`experience`；检索摘要：形成答案用综合与挑战角色；成稿修改与验收才使用 Editor/Reviewer，避免语义误导。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-20 让多 Agent 角色名匹配工作阶段

- **Trigger:** 为答案形成、方案讨论或最终交付物检查设计多 Agent 工作流。
  - **Rule:** 答案形成阶段使用能表达综合与挑战职责的角色名，例如 Synthesizer / Challenger；Editor / Reviewer 只用于成稿后的修改与验收。不要因通信拓扑相似而复用阶段语义不符的角色名。
  - **Why:** 角色名会向用户和 Agent 暗示流程目标；混用会让讨论误读为批准门禁，并模糊 `deliberate` 与 `adversarial-review` 的边界。
```

</details>

### 34 · 2026-07-19 区分取消流程与取消流程限制

处置：导入 Project Memory。

理由：保留取消次数上限不等于取消整个流程的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-7ac549285b858276f3af.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-7ac549285b858276f3af.md)

标题：取消限制不等于取消流程

类型：`experience`；检索摘要：用户调整轮次、预算或次数上限时，保留未被明确取消的流程本身。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-19 区分取消流程与取消流程限制

- **Trigger:** 用户要求取消某个流程的轮次、次数、预算或上限。
  - **Rule:** 保留流程本身，只移除被点名的限制；除非用户明确说停止或取消整个流程，否则不得把限制变更解释成终止任务。
  - **Why:** “取消循环次数上限”改变的是终止策略，不是取消循环本身。
```

</details>

### 35 · 2026-07-16 将项目专用流程与全局可分发技能分开

处置：导入 Project Memory。

理由：保留项目专用 Skill 的发现和发布边界。

核对依据：tasks/lessons.md 对应条目；.agents/skills/integrate-third-skills/SKILL.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-a2e584719409e67276c3.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-a2e584719409e67276c3.md)

标题：项目专用流程与全局 Skill 分开

类型：`experience`；检索摘要：项目专用 Skill 放在 .agents/skills，并同步排除共享发现与分发，不能只靠描述限制。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-16 将项目专用流程与全局可分发技能分开

- **Trigger:** 用户纠正 `integrate-third-skills` 只应在 CSL Agent Kit 项目内被发现。
  - **Rule:** 当用户将某项技能明确限定为项目专用时，将它放入受版本控制的 `.agents/skills/<技能名>/`，并从共享 `skills/`、全局安装枚举和跨平台命令发现中移除；同时检查项目本地链接机制不会重新把它暴露出去。若某个安装器选项仅为这种链接机制存在，应直接移除该选项，而不是保留它来生成共享技能链接。
  - **Why:** 仅靠描述或安装建议不能阻止全局发现；目录位置和发现器边界必须一致。
```

</details>

### 36 · 2026-07-16 将“清空”和“选择整合”视为两个独立阶段

处置：导入 Project Memory。

理由：保留删除授权不能推导出自动重装授权的边界。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-9a3d0f352a67b63c4671.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-9a3d0f352a67b63c4671.md)

标题：清空与重新选择整合是独立授权

类型：`experience`；检索摘要：用户要求清空后查看候选时，目录应保持为空；推荐清单不等于安装授权。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-16 将“清空”和“选择整合”视为两个独立阶段

- **Trigger:** 用户要求清空 `~/.agents/skills` 后列出上游技能，随后纠正我不应自动重装推荐集合。
  - **Rule:** 当用户要求清空目标目录、再从候选列表选择未来整合项时，清理完成后的目录必须保持为空；只列出候选并等待明确选择，不能把推荐清单当作安装授权。
  - **Why:** 清理的最终状态和后续整合选择是两个独立决策；自动重装会违背“清空全部”的字面结果。
```

</details>

### 37 · 2026-07-14 Separate Product, Plugin, And Marketplace Names

处置：导入 Project Memory。

理由：保留产品、插件与 marketplace identity 的命名经验。

核对依据：tasks/lessons.md 对应条目；.codex-plugin/plugin.json

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-e393cbbc7bc13cf73bc0.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-e393cbbc7bc13cf73bc0.md)

标题：区分产品、插件与 marketplace 名称

类型：`experience`；检索摘要：设计平台 identity 时核对最终组合，避免机械重复产品名导致发现和引用错误。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-14 Separate Product, Plugin, And Marketplace Names

- **Trigger:** 为同一个 agent toolkit 设计项目名、plugin 名和 marketplace 名，尤其是平台 identity 使用 `<plugin>@<marketplace>` 时。
  - **Rule:** 不要机械地把完整产品名复制到两个 identity 槽位；分别选择清楚且稳定的 plugin 与 marketplace 名，并先展示最终组合给用户确认。当前 Codex 使用 `csl-agent-kit@csl-agent-market`。
  - **Why:** `csl-agent-kit@csl-agent-kit` 重复且冗长；将产品和分发来源分开命名更容易理解，也避免大小写 alias 迁移问题。
```

</details>

### 38 · 2026-07-13 Separate Todo Planning From Plan Mode And Subagents

处置：导入 Project Memory。

理由：保留任务计划与宿主模式分离，但同步当前委派必须获得授权的边界。

核对依据：tasks/lessons.md 对应条目；当前会话的委派授权规则

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-390b42ee70500603083a.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-390b42ee70500603083a.md)

标题：任务计划不等于 plan mode 或委派授权

类型：`experience`；检索摘要：必须写任务计划不代表必须进入 plan mode，也不自动授权使用 subagent。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-13 Separate Todo Planning From Plan Mode And Subagents

- **Trigger:** 精简默认 agent 原则但仍要求任务计划时。
  - **Rule:** 保留在所属 `tasks/tasks/<task-slug>.md` 中写可检查计划的要求，不要因此强制进入 plan mode 或调用 subagent；plan mode 按实际需要使用；subagent 仍须当前用户或适用指令授权，不能仅凭任务复杂度自行委派。
  - **Why:** todo 是持久化任务控制和验证记录，plan mode 与 subagent 是可选执行能力，三者不应绑定。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## 2026-07-13 Separate Todo Planning From Plan Mode And Subagents

- **Trigger:** 精简默认 agent 原则但仍要求任务计划时。
  - **Rule:** 保留在所属 `tasks/tasks/<task-slug>.md` 中写可检查计划的要求，不要因此强制进入 plan mode 或调用 subagent；后两者由 agent 按实际需要自行决定。
  - **Why:** todo 是持久化任务控制和验证记录，plan mode 与 subagent 是可选执行能力，三者不应绑定。
```

</details>

### 39 · 2026-07-13 Distinguish Agent-Specific And Parent AGENTS Files

处置：导入 Project Memory。

理由：保留核对实际宿主加载来源的经验；已观察历史 super-agent 链接目标不存在，不把旧机器状态当作当前事实。

核对依据：tasks/lessons.md 对应条目；只读检查 /Users/caishilin/.agents/AGENTS.md 为指向不存在目标的历史符号链接

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-9151dbd1441ef552561c.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-9151dbd1441ef552561c.md)

标题：核对宿主实际加载的 Agent 指令来源

类型：`experience`；检索摘要：不要将 home 根规则文件、agent-specific 文件和宿主实际注入来源混为一谈。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-13 Distinguish Agent-Specific And Parent AGENTS Files

- **Trigger:** 判断当前 agent 使用哪份全局 `AGENTS.md`，或决定默认规则模板的更新范围时。
  - **Rule:** 同时检查 harness 实际注入的规则来源和 `~/.agents/AGENTS.md`；不要把 `~/AGENTS.md` 自动等同于 agent-specific 全局配置。历史软链接或默认路径不能证明当前宿主实际加载了相应规则；使用前核对链接目标与实际注入来源。
  - **Why:** 不同 agent 客户端可能从不同位置加载规则，仅检查 home 根目录会错误判断模板更新是否能对目标客户端生效。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## 2026-07-13 Distinguish Agent-Specific And Parent AGENTS Files

- **Trigger:** 判断当前 agent 使用哪份全局 `AGENTS.md`，或决定默认规则模板的更新范围时。
  - **Rule:** 同时检查 harness 实际注入的规则来源和 `~/.agents/AGENTS.md`；不要把 `~/AGENTS.md` 自动等同于 agent-specific 全局配置。当前 `~/.agents/AGENTS.md` 软链接到 super-agent 的默认模板，而 Pi 本会话另行加载了 `~/AGENTS.md`。
  - **Why:** 不同 agent 客户端可能从不同位置加载规则，仅检查 home 根目录会错误判断模板更新是否能对目标客户端生效。
```

</details>

### 40 · 2026-07-10 Keep Caveman And Ponytail Responsibilities Distinct

处置：导入 Project Memory。

理由：保留自然语言压缩与代码简洁性不能混为同一职责的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-855b53907661709bafdb.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-855b53907661709bafdb.md)

标题：区分文字简洁与代码简洁工具

类型：`experience`；检索摘要：比较 Caveman/Ponytail 等约束时，区分自然语言表达与代码设计职责，不因都强调简洁就视作重复。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-10 Keep Caveman And Ponytail Responsibilities Distinct

- **Trigger:** 比较、配置或推荐 Caveman 与 Ponytail 时。
  - **Rule:** Caveman 用于压缩回答中的冗词和填充表达；Ponytail 用于让代码输出简洁、清晰并避免过度实现。不要因为两者都强调精简就把它们视为重复插件或建议二选一。
  - **Why:** 两者作用对象不同：一个约束自然语言回答风格，一个约束代码设计与实现规模；同时保留可以形成互补。
```

</details>

### 41 · 2026-07-10 Avoid One-Off Skill Interface Folders

处置：导入 Project Memory。

理由：保留删除无用途特殊结构前先核对消费者的条件性经验，不声称所有 agents 目录都无用。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-3a8f298b3b233c63d7fa.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-3a8f298b3b233c63d7fa.md)

标题：避免无用途的 Skill 特殊接口目录

类型：`experience`；检索摘要：清理孤立结构前核查运行和打包消费者；仅在无用途且任务授权覆盖时移除。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-10 Avoid One-Off Skill Interface Folders

- **Trigger:** 某个 skill 单独包含 `agents/` 接口元数据，但项目中的其他 skills 不采用该结构，且运行时和打包配置都不依赖它。
  - **Rule:** 先检查引用和运行依赖；没有实际用途时删除这个一次性目录，不要为了形式完整保留孤立元数据。
  - **Why:** 单个 skill 的特殊目录会制造错误的项目约定，并增加维护和审计噪声。
```

</details>

### 42 · 2026-07-10 Keep Repository Name Aligned With Product

处置：导入 Project Memory。

理由：保留产品与仓库命名应保持一致的经验。

核对依据：tasks/lessons.md 对应条目；package.json

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-bacee4d7ea884d043950.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-bacee4d7ea884d043950.md)

标题：仓库与产品命名保持一致

类型：`experience`；检索摘要：重命名产品、包或命名空间时保持一致，平台约束除外。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-10 Keep Repository Name Aligned With Product

- **Trigger:** Renaming the product, npm package, CLI, and local data namespace.
  - **Rule:** Prefer the same distinctive base name across GitHub, npm, CLI, and local data paths unless a platform constraint requires otherwise.
  - **Why:** Using generic `agent-kit` for GitHub while using `csl-agent-kit` everywhere else creates broken assumptions, weaker discoverability, and extra release-time corrections.
```

</details>

### 43 · 2026-07-10 CLI Colors Default On

处置：导入 Project Memory。

理由：这是用户已表达的 CLI 展示偏好；保留项目归属，不自动提升为用户级记忆。

核对依据：tasks/lessons.md 对应条目中的用户偏好说明

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-8113726141f45d9803cd.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-8113726141f45d9803cd.md)

标题：CLI 人类输出默认启用颜色

类型：`preference`；检索摘要：人类可读 CLI 默认启用颜色；显式关闭、NO_COLOR 或机器 JSON 输出例外。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-10 CLI Colors Default On

- **Trigger:** Rendering human-readable CSL Agent Kit CLI output.
  - **Rule:** Enable ANSI colors by default, including non-TTY output. Disable only for `--no-color`, `NO_COLOR`, or machine-readable JSON.
  - **Why:** The user prefers consistently colorful CLI output rather than terminal-detection-based behavior.
```

</details>

### 44 · 2026-07-09 Rename Means No Legacy Compatibility By Default

处置：导入 Project Memory。

理由：保留用户明确不要求兼容时不增加旧 alias 的经验。

核对依据：tasks/lessons.md 对应条目；本次 Memory 完全替代旧机制的明确要求

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-bc839c3424a94bad3409.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-bc839c3424a94bad3409.md)

标题：无兼容要求的重命名不保留旧入口

类型：`experience`；检索摘要：用户明确取消旧兼容时，同步移除旧 fallback、环境变量与示例，不保留长期双轨。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-09 Rename Means No Legacy Compatibility By Default

- **Trigger:** Renaming project-owned paths, plugin namespaces, or user-facing identifiers after the user says compatibility is not needed.
  - **Rule:** Remove old fallback paths, old environment variables, and old invocation examples instead of preserving compatibility layers.
  - **Why:** Compatibility code keeps stale branding alive and makes docs, scripts, and behavior harder to reason about.
```

</details>

### 45 · 2026-07-09 CSL Agent Kit Local Data Directory

处置：导入 Project Memory。

理由：保留本机数据根约定，和本次 User Memory 设计一致。

核对依据：tasks/lessons.md 对应条目；bin/memory/store.js#rootFor

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-01aa1afd3ed4938569c4.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-01aa1afd3ed4938569c4.md)

标题：CSL Agent Kit 本机数据根

类型：`fact`；检索摘要：用户数据使用既有 .csl-agent-kit 根，并遵循 CSL_AGENT_KIT_HOME；不要发明第二个产品数据根。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-09 CSL Agent Kit Local Data Directory

- **Trigger:** Modifying SOP, tips, hooks, installer, or docs that reference CSL Agent Kit local user data.
  - **Rule:** Use `~/.csl-agent-kit/` as the canonical local data directory for user SOPs, tips, settings, and future config.
  - **Why:** The project is now named CSL Agent Kit; the local data directory should match the product name and not the old SSBun Skills branding.
```

</details>

### 46 · 2026-06-25 Repo Map Deep Concepts Only

处置：导入 Project Memory。

理由：保留架构理解应解释职责与关系而非堆砌目录清单的经验。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-c5a35c3c5696edfe3676.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-c5a35c3c5696edfe3676.md)

标题：Repo Map 聚焦职责和关系

类型：`experience`；检索摘要：解释代码库时呈现入口、类型、职责与调用关系，不重复显而易见的元数据。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-06-25 Repo Map Deep Concepts Only

- **Trigger:** 设计 repo-map 输出或示例内容时。
  - **Rule:** 不要输出一眼就能看出的项目名、语言、框架等 inventory；只输出通过文件结构、CodeGraph、调用关系和代码阅读确认的组件职责、模块边界、关键类型职责和客观流程。
  - **Why:** repo-map 的价值是帮助 agent 快速理解项目结构和核心职责，不是重复项目元数据或解释实现细节。
```

</details>

### 47 · 2026-06-28 CSL Agent Kit Local Data Boundary

处置：导入 Project Memory。

理由：保留用户数据与可分发源码分离；更新旧措辞以覆盖已批准的记忆和服务状态，不改变禁止放代码镜像的边界。

核对依据：tasks/lessons.md 对应条目；tasks/tasks/plan-layered-memory-system.md#Decisions

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-ee92e47c51ca9b06138d.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-ee92e47c51ca9b06138d.md)

标题：用户数据目录不承载源码镜像

类型：`experience`；检索摘要：用户根保存记忆、配置、审计与服务状态；可分发代码留在安装包或仓库。

正文：有明确修订；下列为修订后的全文。原始全文仍保留在源快照。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-06-28 CSL Agent Kit Local Data Boundary

- **Trigger:** 修改安装脚本、hooks 或任何 `~/.csl-agent-kit` 路径时。
  - **Rule:** `~/.csl-agent-kit` 保存用户经验、记忆、配置、审计和服务运行状态；不要把 repository mirror 或 skill 代码 symlink 放进去。
  - **Why:** 本地经验数据和安装发现路径混在一起会让输出变吵，也会模糊用户数据与仓库源码的边界。
```

</details>

<details><summary>对照源正文</summary>

```markdown
## 2026-06-28 CSL Agent Kit Local Data Boundary

- **Trigger:** 修改安装脚本、hooks 或任何 `~/.csl-agent-kit` 路径时。
  - **Rule:** `~/.csl-agent-kit` 只保存用户经验数据，例如 `sops/` 和 `tips/`；不要把 repository mirror 或 skill 代码 symlink 放进去。
  - **Why:** 本地经验数据和安装发现路径混在一起会让输出变吵，也会模糊用户数据与仓库源码的边界。
```

</details>

### 48 · 2026-06-28 SOP Create Language Scope

处置：导入 Project Memory。

理由：保留不要扩大用户语言约束范围的经验；当前更高优先级语言要求仍优先。

核对依据：tasks/lessons.md 对应条目；skills/meta/agent-sops/SKILL.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-b6cd5b4be4b8b0ece77b.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-b6cd5b4be4b8b0ece77b.md)

标题：SOP 语言约束不扩大范围

类型：`experience`；检索摘要：按当前有效语言指令处理 SOP；不要把某个字段的约束擅自扩大到全部正文。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-06-28 SOP Create Language Scope

- **Trigger:** 用户要求调整 SOP create 的语言行为时。
  - **Rule:** 不要把 SOP 文件全文强制为某一种语言；主流程描述可以使用任意语言，只有用户明确要求的字段或模板片段才固定语言。
  - **Why:** 把语言约束扩大到整份 SOP 会错误限制用户的流程描述和团队文档习惯。
```

</details>

### 49 · 2026-07-08 SOP Example Metadata Minimalism

处置：导入 Project Memory。

理由：保留 SOP 示例元数据的最小化经验。

核对依据：tasks/lessons.md 对应条目；skills/meta/agent-sops/SKILL.md

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-51c13e20793a7d0143dc.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-51c13e20793a7d0143dc.md)

标题：SOP 示例避免无需求的治理字段

类型：`experience`；检索摘要：没有明确需要时，不添加 owner、reviewer、approver 等流程元数据。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-08 SOP Example Metadata Minimalism

- **Trigger:** 设计或修改 SOP 示例文件的 YAML frontmatter 时。
  - **Rule:** 不要默认加入 SOP id、owner、creator、reviewer、approver、effective_date 这类治理字段；示例 SOP 默认只保留 `version` 和 `update_date` 这类轻量元数据。
  - **Why:** 示例文件应展示轻量现代格式，过多治理元数据会让新 SOP 创建变重。
```

</details>

### 50 · 2026-07-08 AGENTS Template No Local Include

处置：导入 Project Memory。

理由：保留可分发模板与用户私有配置的可移植性边界。

核对依据：tasks/lessons.md 对应条目

拟创建：["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-6a85751b7c6e6815ad29.md"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/entries/legacy-lessons-6a85751b7c6e6815ad29.md)

标题：可分发 Agent 模板不包含本机绝对路径

类型：`experience`；检索摘要：模板不能带作者机器的本地 include；用户自己的私有配置不属于同一分发边界。

正文：原文保真，仅外层采用统一 Memory schema。

<details><summary>查看拟写入的完整正文</summary>

```markdown
## 2026-07-08 AGENTS Template No Local Include

- **Trigger:** 修改 `AGENTS.md` 或 agent template 文件时。
  - **Rule:** 不要在可注入的 AGENTS template/example 中保留 `@/Users/...` 这类用户本机绝对路径 include；本地 `/Users/caishilin/.codex/AGENTS.md` 可以保留用户本机工具 include。
  - **Why:** AGENTS 模板会被注入到其它项目，本机绝对路径 include 不可移植；但用户自己的本地 AGENTS 可以包含本机专用工具规则。
```

</details>

