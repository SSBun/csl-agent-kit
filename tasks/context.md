# Workspace Context

## Project Core

### Purpose
- CSL Agent Kit 为 Codex、Claude Code、Cursor 与 Pi 分发共享的 skills、rules、hooks 和 extensions，使同一套 Agent 工作流可跨宿主使用；权威入口为 `package.json`、`README.md` 与 `super-agent/AGENTS.md`。

### Global Vocabulary
- Skill package 是以 `SKILL.md` 为运行时契约的可发现能力；共享包位于 `skills/`，项目专用包位于 `.agents/skills/`。
- Project Core 是 session start、resume 与 compaction 时始终加载的项目级最小模型；Context Pack 是具体任务按需检索的完整组件或工作流模型；权威契约为 `skills/workspace-workflow/workspace-context/SKILL.md`。
- Canonical task 是 `tasks/tasks/<task-slug>.md` 中的权威任务记录，`tasks/tasks.md` 仅是 newest-first 导航索引；权威实现为 `skills/csl-tasks/shared/lib/task-core.js`。

### System Map
- `super-agent/` 提供跨宿主默认 Agent rules 与 workspace lifecycle dispatcher。
- `skills/` 提供可分发 skills；`skills/csl-tasks/` 管理任务生命周期，`skills/workspace-workflow/` 管理 Context 与 Lessons。
- `pi/extensions/` 提供 Pi 宿主集成；`bin/`、`scripts/` 与各宿主 manifest 负责安装、发现和分发。
- `tasks/` 保存 workspace-local Context、Lessons、canonical task records 与任务产出的 reports。

### Global Invariants
- Skill package 的 `SKILL.md`、runtime references、prompts、templates 与 eval-facing prose 使用英文；用户回答和生成报告使用用户语言；权威约定记录在本文件的 Decisions and Conventions。
- Context 只承载已确认、项目特有、稳定且会改变未来决策的事实；任务进度归 canonical task，纠错规则归 Lessons，实时值不得缓存；权威契约为 `skills/workspace-workflow/workspace-context/SKILL.md`。
- Context 用于跳过宽泛项目探索，不取代任务直接相关源码、测试和 Authority 验证；Authority 与 Context 冲突时以 Authority 为准。
- 独立 adversarial review 只在用户明确要求时运行；普通验证与自审不能替代，也不会自动触发该流程；权威规则为 `super-agent/AGENTS.md` 与 `skills/csl-tasks/csl-task/SKILL.md`。

## CTX-workspace-context — Workspace Context dispatch and maintenance
- Scope: Workspace Context loading, task-relevant retrieval, source-backed maintenance, and default lifecycle consumers.
- Paths: `tasks/context.md`, `skills/workspace-workflow/workspace-context/`, `super-agent/AGENTS.md`, `super-agent/workspace-workflow-gates.md`, `skills/csl-tasks/csl-task/SKILL.md`, `tests/task-files.test.mjs`
- Keywords: workspace context, project core, context pack, task fingerprint, dispatch, authority
- Authority: `skills/workspace-workflow/workspace-context/SKILL.md`, `skills/workspace-workflow/workspace-context/scripts/context.js`, `tests/task-files.test.mjs`
- Recheck: When the Context schema, query lifecycle, write permissions, or default consumer wording changes.

### Purpose and Boundaries
- Workspace Context 让新 Agent 无需重复宽泛 repository exploration、repo-map 或架构分析即可形成正确项目模型；它不取代任务直接相关源码、测试和 Authority 验证。

### Structure
- `tasks/context.md` 是单一 canonical 文件，由始终加载的 Project Core 与任务按需选择的完整 Context Packs 组成；不生成持久 index、cache 或 selected-ID state。
- Project Core 固定包含 Purpose、Global Vocabulary、System Map 与 Global Invariants；正式 Pack 使用稳定 `CTX-*` ID、Scope/Paths/Keywords/Authority/Recheck metadata 和非空适用正文 sections。
- `scripts/context.js` 只读解析 Core、正式 Packs 和 legacy bullets，提供 `core/index/show/validate/--self-test`；Agent 负责 Task Fingerprint、语义匹配、Authority 验证与写入判断。

### Relationships
- `super-agent/AGENTS.md` 与 `super-agent/workspace-workflow-gates.md` 触发 session Core loading、concrete-task Pack query 和 completion maintenance；`csl-task` 消费已加载的 Core 与 task-relevant Packs，不无差别读取整份 Context。

### Workflows
- Session start、resume 或 compaction 先加载 Core；具体任务形成 Task Fingerprint 后运行 index 并通常批量 show 一至三个 Packs；重要依赖前验证 Authority，结束前维护变化内容并 validate。

### Decision and Verification Boundaries
- Authority 与 Context 冲突时 Authority 优先；source-backed ordinary Pack 可在所属任务内自动维护并校验，任何 Project Core 持久变更都必须先展示精确 diff 并取得用户确认。
- 缺失或无效 Core、无可信相关 Packs、相关 malformed/duplicate Pack 必须披露并回退普通探索；CLI self-test、实际 Context validation 和 `tests/task-files.test.mjs` 共同验证格式与消费者。

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

## CTX-analyze-project — Systematic source analysis reports
- Scope: `analyze-project` 的路由、系统化单报告与图表合同、证据覆盖门、安全发布与 fresh-session 验证边界。
- Paths: `skills/analyze-project/`, `skills/repo-map/`, `docs/analysis/analyze-project-v2-prd.md`, `docs/analysis/analyze-project-v2-learn-prd.md`, `reports/analyze-project-evals/`
- Keywords: analyze-project, systematic report, project map, component map, functional modules, architecture diagram, workflow diagram, core working flows, active report
- Authority: `skills/analyze-project/SKILL.md`, `skills/analyze-project/references/report-contract.md`, `skills/analyze-project/evals/contract_cases.json`
- Recheck: 报告结构、图表/系统覆盖门、active path、安全发布语义或 fresh-session 验收方式变化时复核。

### Purpose and Boundaries
- `analyze-project` 针对唯一 Git project、目录组件或文件组件生成一份持久、源码可证的系统化当前状态报告；快速入口定位和轻量 glossary 属于 `repo-map`，单一细节问答、审计、代码审查、实施计划与通用课程分别路由到相邻能力。

### Structure
- 产品没有 question-answer 或 Learn 分支；`develop` 仅是无行为差异的兼容 alias。project、directory、file 分别写入 `docs/analysis/project-map.md`、`docs/analysis/components/dir/<relative-dir>/map.md` 和 `docs/analysis/components/file/<relative-file>.md`；旧 `docs/analysis/learning/**` 只作历史归档。
- 报告以 Metadata、Scope Summary、可选 Domain Glossary、Functional Module Map、Core Working Flows 和可选 Cross-flow Invariants 组织；模块按功能职责而非目录划分，系统覆盖主要价值但不穷举内部 inventory。每份报告必须有一张功能架构图；涉及多模块顺序、异步/外部边界、关键分支或状态迁移的复杂流程各有一张对应图，简单流程不强制。

### Decision and Verification Boundaries
- 所有项目事实必须有就近源码证据组：使用独立 Markdown bullet list，每项只包含一个 inline-code `path#symbol`、`path#key` 或 line anchor；锚点不得追加在正文尾部或放入表格。项目报告覆盖解释主要产品价值所需的最高层职责与核心流程，组件报告只覆盖内部、直接邻居和参与流程。所有必需视觉都使用 Mermaid flowchart、sequence 或 state code fence，不再生成 ASCII 图；有本地 validator 时必须验证，无 validator 时保留 Mermaid 并人工检查语法，已有 validator 经有限修复仍失败则不发布。build/test、项目执行、安装、网络和外部 mutation 需要明确授权。
- active report 通过 Node 标准库 owned sibling temp 加 `link`/获准且旧 bytes 未变时 `rename` 发布；失败时不直接覆盖。`evals/contract_cases.json` 是声明式人工核对输入，实际输出价值以禁用 ambient skill 的 fresh-context 子 Agent 在真实项目生成并由父 Agent检查的报告为证据；旧 need-contract eval 仅是历史记录。

## CTX-pi-task-overlay — Pi task overlay rendering
- Scope: Pi task widget parsing, session focus persistence, progress rendering, refresh lifecycle, mode boundaries, and clickable task titles.
- Paths: `pi/extensions/csl-task-overlay.ts`, `tests/pi-task-overlay.test.mjs`, `tasks/tasks.md`, `tasks/tasks/`
- Keywords: Pi, task overlay, session focus, custom entry, widget, OSC 8, hyperlink, progress, refresh, RPC
- Authority: `pi/extensions/csl-task-overlay.ts`, `tests/pi-task-overlay.test.mjs`
- Recheck: The canonical task index format, Pi session-entry or widget API, terminal hyperlink capability detection, or refresh lifecycle changes.

### Purpose and Boundaries
- 任务面板以 `<ctx.cwd>/tasks/tasks.md` 和任务正文作为工作区共享状态与 Target 进度来源，不修改任务 Markdown；每个 session 的 focused task 只写入该 Pi session 的 `csl-task-focus` custom entry。

### Structure
- `session_start` 与 `session_tree` 从当前 branch 的最新 focus entry 恢复关联；`csl_task_focus` 工具通过 prompt guidance 供 Agent 在创建、恢复、重开或激活 canonical task 后自动关联，`/csl-task-focus <task-id|clear>` 提供手动切换或清除。
- 有有效关联时，TUI 把该任务单列于 `This Session`，其余近期任务列于 `Workspace`；无关联或失效关联回退普通共享列表。已完成任务保持关联，直到被替换或清除。
- TUI 对非空任务只注册一次自定义 Component，每 5 秒清除当前工作区进度缓存、重读任务并原位更新；空列表注销组件，重复启动释放旧 timer，`session_shutdown` 最终清理。
- 支持 OSC 8 的 TUI 将 canonical `tasks/<task-slug>.md` 标题链接到对应绝对文件 URL；不支持 hyperlink 的终端保持纯文本。RPC 忽略 session 分组并保持可序列化纯字符串数组，headless 不注册 widget。

### Decision and Verification Boundaries
- 只有符合 `tasks/[a-z0-9-]+.md` 的 canonical index path 才能被关联或生成文件链接；`pathToFileURL` 负责绝对路径和特殊字符编码。
- `tests/pi-task-overlay.test.mjs` 覆盖 focus 写入、恢复、切换、清除、完成后保持、失效回退、原位刷新、timer 清理、进度、文件 URL、无 hyperlink 终端、RPC 和 headless 行为。

## Components

- `csl-agent-kit install` treats the integration multiselect as sufficient authorization and does not ask a second external-CLI confirmation.
- Triggerify's distributed `SKILL.md` is written in English, treats its bundled CLI as the accepted-behavior authority, and does not use the project RFC as runtime guidance.
- `skills/workspace-workflow/workspace-lessons/` 以 `tasks/lessons.md` 为唯一权威规则集：Agent 在 Entry、Change 与 Completion Gates 负责语义召回、冲突处理和 Check，`scripts/lessons.js` 仅负责只读解析、索引、按 ID 查询与 schema 校验；所有持久 Add/Update/Merge/Replace/Delete 都必须先展示精确变更并取得确认，legacy records 渐进兼容且不缓存已选 IDs。权威契约与回归入口为该 skill 的 `SKILL.md`、查询脚本、`evals/query_cases.json`、共享 `evals/lessons_trigger_cases.json` 和 `tests/task-files.test.mjs`。
- `skills/csl-tasks/` 是 Codex、Claude、Cursor 与 Pi 共享的宿主中立任务集合：`csl-task` 管理单任务，`csl-task-plan` 只规划并交接最终 decisions，`csl-task-auto` 用有序父子任务串行推进并执行父级集成门禁；三者共享 `shared/lib/task-core.js` 与 `shared/scripts/csl-tasks.js`，核心只维护 Markdown 状态和证据，不启动嵌套宿主 CLI、worker、daemon 或任意验证命令。权威契约与回归入口为三个 `SKILL.md`、共享 core/CLI 及 `tests/csl-tasks-core.test.mjs`。
- `inner:refresh-tab-title` 在 Pi 上由 `before_agent_start` 的 `prompt-submit` hook 触发；自动刷新把当前活跃分支中最近的用户与 Assistant 文本及最新用户 prompt 限制在 12,000 字符内发送给独立的 `deepseek/deepseek-v4-flash`，排除工具调用、工具结果、thinking、图片、项目文件和主 Agent 上下文。手动 `/title` 始终使用同类有界对话，有参数时把参数作为最新用户请求追加。每次有效刷新都重新生成标题，不向模型提供已保存主题，不使用 `KEEP_CURRENT_TITLE` 或例行操作输入短路；无效输出与模型失败仍不写标题。有效输出经确定性清洗后写入 `<project> · <core intent>` OSC 标题，核心意图最多 24 个 Unicode 码点，完整标题最多 7 个自然语言单词；每个 TTY 按 workspace 保存成功标题，并用 token/锁防止旧 worker 覆盖新结果。手动刷新通过 request ID 报告 refreshed、unchanged、failed 或 timed out，自动刷新保持非阻塞且不显示每轮 toast。权威实现与回归入口为 `pi/extensions/csl-context-hooks.ts`、`skills/triggerify/scripts/refresh-tab-title.js`、`tests/pi-context-hooks.test.mjs` 和 `tests/triggerify.test.js`。
- `pi/extensions/csl-context-hooks.ts` 是 Triggerify 的 Pi adapter：通过 facade 的 `createEvent()` / `runEvent()` 生成以 `ctx.cwd` 为工作区的标准事件；它按 `toolCallId` 记录 `write` / `edit` 调用前状态，成功结果提供工作区相对的 `changed_files`（`created` / `modified`），失败或工作区外文件提供空数组，其他工具保持 unknown。权威实现与回归测试为该 extension 和 `tests/pi-context-hooks.test.mjs`。
- 主分支的 `csl-agent-kit` CLI 不包含 benchmark 命令；benchmark 实现仍是未合入且已中止的独立工作，不应在 `bin/csl-agent-kit.js` 中保留失效的 `scripts/benchmark-cli.js` 依赖。
- `skills/triggerify/scripts/triggerify.js` 是稳定 facade；V1 规则语义、文件存储、宿主无关运行时、CLI 与 Codex/Claude native hook 适配分别由 `scripts/lib/{rule,store,runtime,cli,native-hook}.js` 负责，外部宿主适配应通过 facade 的 `createEvent()` 和 `runEvent()` 接入。权威边界是这些模块导出与 `tests/triggerify.test.js`；修改跨层行为时复核两者。
- Triggerify inner hooks 从 `skills/triggerify/hooks/` 随包分发、默认启用且源文件不可由 CLI 创建/更新/删除；用户通过 `<data-root>/triggerify/config.json` 的 `disabledHooks` 控制启用状态，并可用 qualified ID 键控的 `hookSettings` 保存专属设置。配置无效时仅 inner hooks fail-closed；运行时把当前 hook 的设置作为 `TRIGGERIFY_HOOK_CONFIG` 传给脚本，host adapter 还可按 qualified ID 通过 `TRIGGERIFY_HOOK_INPUT` 提供只对该脚本可见的临时输入，stdin event payload 保持不变。`inner:refresh-tab-title` 的状态也必须写入 data root，不能写入 skill 源目录；权威实现与回归入口为 `store.js`、`runtime.js`、`cli.js` 和 `tests/triggerify.test.js`。
- `skills/triggerify/scripts/validate-rules.js` 复用 V1 `parseMarkdown()` 校验一个或多个候选 trigger Markdown 的 frontmatter 与规则语义；已存储脚本的可执行性和宿主 effective 状态仍以 `triggerify show` 为准。权威入口是该脚本与 `skills/triggerify/SKILL.md`。
- `skills/triggerify/` 是 Triggerify V1 的共享管理与运行核心；规则可选 `description` 为单行、非空、无控制字符且最多 160 字符，qualified ID 仍由文件名决定，`list`/`show` 负责展示。`csl-agent-kit triggerify` 提供 create/list/show/update/enable/disable/delete 恢复控制面，`hooks/hooks.json` 将 Codex/Claude 生命周期事件映射到同一 dispatcher，Pi extension 在每次 `before_agent_start` 加载全局 `session-start` Prompt 规则。Codex hook payload 不提供 workspace trust verdict，因此运行时只加载 global rules，项目 `list` 保持 metadata-only；Claude Code 和 Pi 目前只验证了 `session-start` Prompt 注入，Cursor V1 因宿主仍丢弃 `additional_context` 而保持 unsupported。

- `skills/deliberate/` 以 Coordinator 中转的 Synthesizer–Challenger 循环生成问题、主题、想法、决策或计划的综合答案；路由依据是明确的迭代或全面多视角意图，不以裸角色名作为足够证据，普通 brainstorming、逐题 grilling 和需要 `APPROVED` 的交付物审查不进入该 skill。Agent 默认先内部批量处理全部相关主题与可见议题；循环不设硬轮次上限，但 `CONTINUE` 必须对应实质性开放 D-ID 与具体下一轮变化，且只有所有实质性 D-ID 关闭并复查所有固定 T-ID 后才可 `SUFFICIENT`。Pi 分发元数据必须查询 `pi-agent` 的 effective model，不得仅凭 `PI_MODEL` 推断；无 Challenger 时流程不能运行，INLINE-FALLBACK 则可在明确 `ISOLATION: simulated` caveat 下达到 `SUFFICIENT`；Synthesizer 的量化结论必须附可复现测量证据。每次交付只把面向用户的最终结果保存到当前工作区 `tasks/thinking/YYYY-MM-DD-<topic-slug>.md`，文件冲突时递增后缀，且不保存角色交换、私有推理、state packet 或 ledger。权威契约与复核入口为该 skill 的 `SKILL.md`、角色契约、共享 subagent dispatch reference 和 `evals/`。
- `skills/sop-manager/sops/code-style.md` 是跨语言的内置代码风格 SOP；它按语言读取 `skills/sop-manager/references/code-style/` 中的规则参考，Swift 参考为 `swift-style.md`，并已合并后删除用户级 `~/.csl-agent-kit/sops/swift-code-style.md`。
- `super-agent/AGENTS.md` 是可分发的默认 agent 规则（语言协议 + 工程原则 + workspace 路由）；`csl-agent-kit install` 默认将它软链接到 `~/.codex/AGENTS.md`、`~/.claude/CLAUDE.md`、`~/.pi/agent/AGENTS.md`、`~/.agents/AGENTS.md`，并将 super-agent 目标视为 authoritative：现有软链接默认重置，普通文件先备份再替换，dry-run 不写入。
- `~/.agents/skills` 是 Codex 官方的 USER 级技能发现目录，也可作为多个 agent 共用的技能安装目录；按用户要求当前为空，`~/.agents/.skill-lock.json` 的技能映射也为空。未来从 `mattpocock/skills` 选择的技能应整合到 CSL Agent Kit，而非重新安装到该全局目录。
- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。

## Relationships

- 全局 Triggerify 规则 `global:notify-todo-changed` 在 Pi 上通过 `edit` / `write` 的标准 `changed_files` 识别 `tasks/tasks/*.md` 变更，在 Codex 上保留 `apply_patch` header fallback；脚本规范化真实路径并限制在 workspace 的真实 `tasks/tasks` 目录后，使用 `terminal-notifier` 发送可点击的 macOS 通知。权威来源为 `~/.csl-agent-kit/triggerify/hooks/notify-todo-changed.md` 与 `~/.csl-agent-kit/triggerify/scripts/notify-todo-changed.js`。
- Codex 对每条非 managed command hook 按定义 hash 单独保存 trust；CSL Agent Kit 的 Triggerify `PostToolUse` dispatcher 必须先在 `/hooks` 中信任才会运行。
- 用户跨会话持久指令以单条全局 Triggerify `session-start` / `inject-prompt` 规则存放在 `<data-root>/triggerify/hooks/`；Codex 与 Claude Code 通过 `SessionStart` dispatcher 注入，Pi 在每次 `before_agent_start` 重新加载。规则不按用户 prompt 关键词匹配。
- `csl-agent-kit install` 在没有已确认选择时默认预选 `codex-skills` 和 `codex-plugin`；交互式已确认目标保存在 `/Users/caishilin/.csl-agent-kit/install-selection.json`，下次 checklist 会以其为预选项。
- hook-only 客户端的 `UserPromptSubmit` 只运行 SOP candidates；持久指令通过 Triggerify `SessionStart` 规则注入。Pi 在 `before_agent_start` 重建 Triggerify session prompts 与 SOP context。
- 持久指令只在用户明确要求跨会话保存时创建，每条使用独立的 `global:directive-<subject>` 规则并保留高优先级指令和当前请求优先的边界；个人化内容不进入可分发的 `super-agent/AGENTS.md`。

## Decisions and Conventions

- Skill packages use English for `SKILL.md`, runtime references, prompts, templates, and eval-facing prose; generated reports and user responses still follow the user's language. A task that modifies one skill does not bulk-translate unrelated existing packages unless the user explicitly requests a repository-wide migration — authoritative source: user confirmation on 2026-08-07; review when that language convention changes.
- 新的用户请求只要形成可独立验收的 outcome，就默认创建新的 canonical task；只有请求直接修正、补全或重新验证旧任务的同一 outcome，且不处理会让旧 Target/Result 失真时，才复用或重开旧任务。同一组件、文件、主题或实现重叠不足以建立 ownership，无法确定时创建新任务。权威来源为 `skills/csl-tasks/csl-task/SKILL.md` 与其 `evals/task_ownership_cases.json`。
- 新任务从下一项开始采用 `Target` 作为唯一 checkbox（稳定 `Tn` ID），`Plan` 使用普通有序列表，`Result` 按 Target ID 记录当前证据，不再创建独立 `Checklist`；`Scope`、`Block` 与 review details 仅在生命周期需要时出现，当前任务和未触及历史不迁移。
- 新任务由 CSL Tasks core 投影 `Status: <state> (<YYYY-MM-DD HH:MM>)` 到 canonical record，并在 `tasks/tasks.md` 使用 `- [<title>](tasks/<task-slug>.md) — <state> (<YYYY-MM-DD HH:MM>)`；状态、证据、父子关系和完成门禁通过共享 CLI 更新，canonical task 仍是索引不一致时的权威。旧正文无需批量改写，但所有 records 已统一迁入 `tasks/tasks/`。权威来源为 `skills/csl-tasks/csl-task/SKILL.md`、`shared/lib/task-core.js` 和 `pi/extensions/csl-task-overlay.ts`。
- 可分发默认 `AGENTS.md` 保留稳定的通用原则与工作流触发指引；任务字段、状态迁移、循环和输出契约等易变细节属于对应 skill。非简单交付物改动进入 task 记录，所有结果按风险验证；只有用户明确要求 `$adversarial-review`、双 Agent Reviewer–Editor 循环或独立 Reviewer 批准时才进入独立审查，风险、复杂度、验证缺口、其他规则或工作流都不会自动触发，未明确要求时记录 `Skipped` 并在常规验证通过后直接完成。
- `adversarial-review` 必须把 `Finding`、`Required Outcome` 和 `Suggested Remedy` 作为三个独立概念：Finding 只陈述有证据的问题或风险，Required Outcome 只定义必须达到的结果，Suggested Remedy 是可被 Editor 接受、缩小或基于证据拒绝的建议；解决 Finding 不等于必须采用 Reviewer 的建议实现。
- `adversarial-review` 的 `BLOCKER` 必须同时说明被违反的要求或原则、可观察证据、不处理的实际风险与 `Required Outcome`；缺少任一项时不得作为阻塞性 Finding，应降级为 `QUESTION`、`NOTE` 或省略。`Suggested Remedy` 不能代替这四项成立条件。
- `adversarial-review` 的 Editor 对每个 Finding 必须依次审计 `Current Adequacy`、`Minimal Resolution`、`Blast Radius` 与 `Proportionality`，再选择接受、缩小、拒绝、确认无需修改或需要用户决定。当前方案已满足 `Required Outcome` 时默认保留，除非正确性、安全、数据完整性或明确需求提供了必须变更的证据。
- `adversarial-review` 只以 `Required Outcome` 是否已满足作为 Finding 的复审和关闭标准，不以 `Suggested Remedy` 是否被采用为标准。Editor 的更小修复或基于证据的拒绝已消除风险时，Reviewer 必须关闭 Finding；若继续阻塞，必须指出新证据或仍未满足的 `Required Outcome`，不得只重复原建议。
- `adversarial-review` 的 Finding 类型语义固定：`BLOCKER` 是满足四项成立条件的明确违规或实质风险，可通过满足 `Required Outcome` 或证明 Finding 不成立而关闭；`QUESTION` 只请求判断所需的缺失信息，不得隐含修改命令；`NOTE` 是非阻塞观察或可选改进，Editor 确认后即关闭，不得要求修改 artifact。纯偏好、顺手重构与推测性未来需求应省略。
- `adversarial-review` 的 Reviewer 与 Editor 共同遵守以下优先级：用户意图，然后是正确性、安全、数据完整性与明确兼容要求，再是 `Required Outcome`、证据、最小改动、最小影响范围和最低的已证成本。当多个方案都满足 `Required Outcome` 时，必须选择影响范围更小、维护成本更低且新假设更少的方案；最终以测试或可观察证据判定，不以双方口头同意判定。
- `tasks/tasks.md` 是 newest-first 导航索引，只保存任务标题、当前状态和 `tasks/tasks/<task-slug>.md` 的索引相对链接 `tasks/<task-slug>.md`；每个独立任务文件才是目标、计划、审查状态与复核历史的唯一权威记录。Agent 只能修改所属任务文件及其精确索引项，不能重写其他任务状态。
- `adversarial-review` 在循环运行中只通过 Agent handoff 传递完整 finding ledger，不写中间报告或同步 task 状态；仅在审查结束或暂停时写一次 `reports/adversarial-review/<task-slug>.md`。最终文件只包含每个实质 finding 的讨论结果和一项最终决定，其中 `Reviewer position` 与 `Editor response` 用嵌套列表逐条展示核心观点；报告不含总体结论、主题清单、验证章节、Reviewer/轮次/fingerprint/round history 等技术附录。已有 owning task 时只追加最终决定和报告链接，不能为承载报告单独创建 task。
- 每次 adversarial-review pass 都必须覆盖固定的完整 scope：Reviewer 一次性报告当前可见的全部 `BLOCKER`、`QUESTION` 与 `NOTE`，并在复审中逐项说明全部既有 finding ID 已解决或未解决，不得故意分轮释放；Editor 一次性回答和处理整轮全部条目后才能请求普通复审。后续新 finding 必须指出使其此前不可行动的新 artifact、diff、证据或其他原因；需要用户决定时保持 `BLOCKED`，多个方案进入 Decision Consensus Gate，否则直接询问用户，不得用普通复审绕过决定。
- `adversarial-review` 对代码、PRD、RFC、设计文档及其他交付物执行同一 fail-closed 双 Agent 流程；不设总轮次上限，只保留单调递增的 `INITIAL (1)` 与 `RE-REVIEW (n)` 审计编号。流程仅按 `APPROVED`、需要用户、客观阻塞、连续无实质进展或用户停止等状态结束或暂停；不同交付物只切换 review lens。
- `skills/sop-manager/references/code-style/swift-style.md` 只保留按主题分组的 Swift 具体规则：类型与状态、可选值与失败路径、控制流、enum 与 MARK、extension 组织、方法布局、文档注释和改动边界；覆盖 `T!` 边界、强制操作、`guard`、`for ... where`、`@unknown default`、类型简写和公开声明 summary。只有需要展示精确语法或布局的规则才附最小代码块，适用边界和使用顺序放在 `code-style.md`。
- 默认 agent 规则不规定 plan mode 或 subagent 策略；agent 可以按任务需要自行使用这些能力。d
- `super-agent/` 纳入 npm 发布白名单，包含默认 `AGENTS.md` 与 workspace lifecycle dispatcher；它是运行时规则资产目录，不是 skill。
- README 当前列出 31 个可分发技能；第三方源码导入不等同于安装到 `~/.agents/skills`，除非用户明确要求执行安装器。`integrate-third-skills` 是本仓库本地流程，不计入这个数量。
