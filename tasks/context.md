# Workspace Context

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

## CTX-task-context — Workspace Context dispatch and maintenance
- Scope: Workspace Context loading, task-relevant retrieval, source-backed maintenance, and default lifecycle consumers.
- Paths: `tasks/context.md`, `skills/meta/task-context/`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `skills/meta/task/SKILL.md`, `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`, `tests/task-files.test.mjs`
- Keywords: task context, workspace context, project core, context pack, task fingerprint, dispatch, authority
- Authority: `skills/meta/task-context/SKILL.md`, `skills/meta/task-context/scripts/context.js`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `skills/meta/task/SKILL.md`, `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`, `tests/task-files.test.mjs`
- Recheck: When the Context schema, task activation order, query lifecycle, write permissions, or default consumer wording changes.

### Purpose and Boundaries
- Workspace Context 让新 Agent 无需重复宽泛 repository exploration、repo-map 或架构分析即可形成正确项目模型；它不取代任务直接相关源码、测试和 Authority 验证。

### Structure
- `tasks/context.md` 是单一 canonical 文件，由始终加载的 Project Core 与任务按需选择的完整 Context Packs 组成；不生成持久 index、cache 或 selected-ID state。
- Project Core 固定包含 Purpose、Global Vocabulary、System Map 与 Global Invariants；正式 Pack 使用稳定 `CTX-*` ID、Scope/Paths/Keywords/Authority/Recheck metadata 和非空适用正文 sections。
- `scripts/context.js` 只读解析标准 Core 与正式 `CTX-*` Packs，提供 `core/index/show/validate/--self-test`；非标准顶层内容不进入 Pack 索引，Agent 负责 Task Fingerprint、语义匹配、Authority 验证和写入判断。

### Relationships
- `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 是自动注入的稳定行为契约，要求 session 边界恢复 Context、先按 outcome 选择 task family、实质工作前完成 Task Target 对齐并消费相关 Context 与 Lessons，同时把具体操作细节留给对应 Skill 和共享协议。

### Workflows
- Session start、resume 或 compaction 先运行 `core`；已有文件缺少有效 Core 时从最小权威来源重建并验证，文件缺失时展示完整最小 Core 提案并取得确认后才创建。随后具体 outcome 才激活 canonical task；共享协议独占 Target 详细语义，稳定行为是非平凡等价 Target 展示一次并等待 checkpoint 确认、实质差异显示 changed dimensions 并等待批准、用户歧义先澄清，以及纯琐碎等价文件编辑可直接继续。对齐后才检索相关 Packs。

### Decision and Verification Boundaries
- Authority 与 Context 冲突时 Authority 优先；source-backed ordinary Pack 可在所属任务内自动维护并校验，已有文件缺少有效 Core 时可自动重写，缺失文件的创建及其他有效 Project Core 持久变更必须先展示精确内容并取得用户确认。
- 重写失败时恢复原文件；缺失文件未获确认、无可信相关 Packs、相关 malformed/duplicate Pack 或 Authority 冲突时披露并回退普通探索。Core 不得使用占位事实，CLI self-test、实际 Context validation 和 `tests/task-files.test.mjs` 共同验证格式与消费者。

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
- 修改评测 suite、skill 或发现边界后运行 layout check、evaluator `validate`／`--self-test`、针对 symlink package 的 Skill Quality 和 Context validation。v3 模型请求由 `prepare` 生成且不含 oracle；score／compare 分别评测 main-session L0–L4、delegated child handoff、L2 checkpoint、L3／L4 mode、S0／S1 overlay、child confirmation leak、stale-plan continue、reason 和 transition，并在 provisional labels 下保持 report-only。

### Decision and Verification Boundaries
- Oracle cases、schema、固定 prediction samples 和确定性脚本可提交；当前 Task Target labels 在人工 adjudication 前保持 provisional／report-only。付费模型 run 需要当前用户明确授权，prediction／报告默认写入 ignored `results/`。不得保存 chain-of-thought、凭据、客户数据或未脱敏完整会话。

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
- 支持 OSC 8 的 TUI 在任务 widget 与 `/tasks` 通知中将 canonical `tasks/<task-slug>.md` 标题链接到对应绝对文件 URL；不支持 hyperlink 的终端及非 canonical 路径保持纯文本。RPC 忽略 session 分组并保持可序列化纯字符串数组，headless 不注册 widget。

### Decision and Verification Boundaries
- 只有符合 `tasks/[a-z0-9-]+.md` 的 canonical index path 才能被关联或生成文件链接；`pathToFileURL` 负责绝对路径和特殊字符编码。
- `tests/pi-task-overlay.test.mjs` 覆盖 focus 写入、恢复、切换、清除、完成后保持、失效回退、原位刷新、timer 清理、进度、文件 URL、无 hyperlink 终端、RPC 和 headless 行为。

## CTX-task-workflows — Canonical task workflows
- Scope: 跨宿主 canonical task 的单任务执行、只读计划、队列执行、main-session L0–L4 Task Target gate、delegated child alignment inheritance、S0／S1 Safety Overlay、Queue title invariants、状态证据及完成门禁。
- Paths: `skills/meta/task/`, `skills/meta/task-plan/`, `skills/meta/task-queue/`, `skills/meta/csl-tasks/shared/`, `tests/csl-tasks-core.test.mjs`, `tests/task-files.test.mjs`
- Keywords: task, task-plan, task-queue, canonical task, Task Target, Authorization Ledger, interaction owner, delegated child, L2 checkpoint, L4 change approval, Safety Overlay, Queue title, Kind Queue, legacy Auto
- Authority: `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`, `skills/meta/task/SKILL.md`, `skills/meta/task-plan/SKILL.md`, `skills/meta/task-queue/SKILL.md`, `skills/meta/csl-tasks/shared/lib/task-core.js`
- Recheck: 当公开 skill identity、task activation timing、Task Target 对齐或确认路径、task record schema、状态转换、父子图或完成门禁变化时复核。

### Purpose and Boundaries
- `task` 从最早的实质准备阶段开始管理一个可独立验收 outcome，`task-plan` 只研究并形成 decisions-only handoff，同时对齐计划任务最终要实现的 Target；该 Target 的接受不授权执行。`task-queue` 用有序父子 records 串行推进多个 outcome，并在父级执行独立 integration gate。

### Structure
- 三个 workflow 直接位于 `skills/meta/`，进入或在上下文丢失后恢复时均须读取 `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`；该普通 Markdown runtime contract 是全部 Target 对齐语义的唯一详细 Authority，不参与 skill discovery。各 consumer 只拥有激活时机、workflow-specific Target 含义、对齐前 lifecycle writes 与对齐后下一步。
- 三个 workflow 共享 `skills/meta/csl-tasks/shared/lib/task-core.js` 与 `skills/meta/csl-tasks/shared/scripts/csl-tasks.js`；core 只维护 Markdown 状态、证据、父子关系和索引一致性，不持久化会话 alignment 或 confirmation，也不启动嵌套宿主 CLI、worker、daemon 或任意验证命令。
- Core 将 `Status: <state> (<YYYY-MM-DD HH:MM>)` 投影到 canonical record，并在 `tasks/tasks.md` 维护对应的标题、状态与 `tasks/<task-slug>.md` 链接；record 在索引不一致时仍是权威。
- 新队列父任务只写入 `Kind: Queue`；读取现有历史 `Kind: Auto` 时在内存中归一为 queue 以继续执行，但创建新记录不接受 `auto`。

### Workflows
- 文件变更请求（包括琐碎确定性编辑）或具体非平凡 outcome 先激活并聚焦 owning record，再进入对齐门。主 user-facing session 是 interaction owner：非平凡等价 Target 初次执行前进入一次 L2 checkpoint，实质差异进入 L4，用户歧义进入 L3，纯琐碎等价编辑可走 L1。同一 canonical plan record 在用户后来明确授权执行时，若已接受 Target 语义未变且确认依据仍可恢复，则从 `task-plan` 进入 `task` 不再显示 checkpoint；仅接受规划阶段 Target 不等于授权执行。由当前主 Plan 明确分发的 child session／task 继承 alignment，不显示用户 gate；缺少覆盖、material child-distribution graph change、用户决策或 S1 边界返回主 session。同一 child node 内的实现调整不重新确认。对齐后才加载 task-relevant Context、Lessons 与任务直接来源。

### Decision and Verification Boundaries
- User-facing Task Target 只描述结果、可观察完成条件和必要边界；只有 interaction owner 显示 L2／L3／L4 与 S1，delegated child 只执行 `continue_delegated`／`return_to_main`。Level、delegation packet、alignment／confirmation 不写入 canonical task core，详细规则只由共享协议定义。
- 新请求默认创建独立 task；明确执行 implementation-ready plan 时 resume 该 plan 的 exact record，`task-plan` → `task` 阶段变化本身不产生新 ownership。其他情况下，只有直接修正、补全或重新验证同一 outcome，且保留旧 Target 或 Result 会失真时才复用或重开，组件、文件、主题或实现重叠本身不建立 ownership。Queue parent、children 与 siblings 的标准化标题必须互异，core 在 link 和 validation 边界 fail closed；无图关系的独立任务可同名。
- 公开 skill 名称只有 `task`、`task-plan` 与 `task-queue`，不保留旧名称 alias；共享 Task Target 协议没有 `SKILL.md` 且不参与路由，三个 skill package、协议与 task core 共同位于 `skills/meta/` 的分发树中。
- `tests/csl-tasks-core.test.mjs` 覆盖新 Queue 写入、旧 Auto 读取、父子图与完成门禁；`tests/task-files.test.mjs` 覆盖 discoverability、默认规则与记录契约。

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
- `inner:csl-agent-kit-contract` 在 `session-start` 运行 bundled script 并注入 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 的自包含行为契约，使 task-family 路由、目标对齐、Context、Lessons、最小与手术式执行及验证边界不依赖替换用户的 Agent 指令文件。

### Relationships
- `hooks/hooks.json` 的 SessionStart dispatcher 处理 startup、resume 与 compact 来源，Pi adapter 在每次 `before_agent_start` 重建 session prompts；同一 Contract prompt 不再由 manifest 直接 `cat`，避免重复注入。

### Decision and Verification Boundaries
- Codex、Claude Code 与 Pi 支持该 session prompt；Cursor 在宿主传递 injected context 前保持 unsupported。`tests/agent-hooks.test.js` 与 `tests/pi-context-hooks.test.mjs` 验证迁移、默认启用、Built-in → User → Project Agent Rules 合并、来源不变、用户禁用、最终 task 名称和压缩后重建边界。

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
- 发布工作直接按同一三级发现边界匹配具体 SOP，不另建发布 SOP 注册表。

### Decision and Verification Boundaries
- `tests/cli-install-output.test.js` 同时验证摘要与候选路由的项目 > 用户 > 内置覆盖；`tests/pi-context-hooks.test.mjs` 验证 Pi 从活跃 workspace 注入项目 SOP。

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

## CTX-task-maintenance — Context and Lessons historical cleanup
- Scope: 用户显式发起、统一确认的 Context/Lessons 失效历史删除与同载体语义合并。
- Paths: `skills/meta/task-maintenance/`, `skills/meta/task-context/`, `skills/meta/task-lessons/`, `tasks/context.md`, `tasks/lessons.md`
- Keywords: task maintenance, context cleanup, lessons cleanup, stale history, merge
- Authority: `skills/meta/task-maintenance/SKILL.md`, `skills/meta/task-context/SKILL.md`, `skills/meta/task-lessons/SKILL.md`
- Recheck: 当删除或合并证据门、统一确认行为、Context/Lessons schema 或三者职责边界变化时复核。

### Purpose and Boundaries
- `task-maintenance` 是内容产生方即时维护之外的显式兜底，只删除 Authority 已证明失效的历史内容并合并不会丢失有效约束的同载体项；它不负责调度、任务归档、格式迁移、一般重写或内容重路由。

### Relationships
- `task-context` 继续负责 Project Core、按需 Pack 检索及事实变化时的 source-backed 维护；`task-lessons` 继续负责纠正驱动的 Lesson 检索与持久写入；跨记录历史清理由 `task-maintenance` 编排并复用两者现有只读 CLI 与 schema。

### Decision and Verification Boundaries
- 每个 Delete/Merge 候选都必须展示 Authority 证据和精确最终内容并获得一次明确确认；两个载体不得互相合并，legacy 或日期久本身不证明失效，获批变更按文件独立校验并在失败时恢复原文。

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

## Components

- Agent Hooks 的分发 `SKILL.md` 使用英文，以 bundled CLI 作为 accepted-behavior authority，不把项目 RFC 当作 runtime guidance。
- `pi/extensions/csl-context-hooks.ts` 是 Agent Hooks 的 Pi adapter：通过 facade 的 `createEvent()` / `runEvent()` 生成以 `ctx.cwd` 为工作区的标准事件；它按 `toolCallId` 记录 `write` / `edit` 调用前状态，成功结果提供工作区相对的 `changed_files`（`created` / `modified`），失败或工作区外文件提供空数组，其他工具保持 unknown。权威实现与回归测试为该 extension 和 `tests/pi-context-hooks.test.mjs`。
- `skills/meta/agent-hooks/scripts/validate-rules.js` 复用 V1 `parseMarkdown()` 校验一个或多个候选 Hook Markdown 的 frontmatter 与规则语义；已存储脚本的可执行性和宿主 effective 状态仍以 `agent-hooks show` 为准。权威入口是该脚本与 `skills/meta/agent-hooks/SKILL.md`。

- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。

## Relationships

- 全局 Agent Hooks 规则 `global:notify-todo-changed` 在 Pi 上通过 `edit` / `write` 的标准 `changed_files` 识别 `tasks/tasks/*.md` 变更，在 Codex 上保留 `apply_patch` header fallback；脚本规范化真实路径并限制在 workspace 的真实 `tasks/tasks` 目录后，使用 `terminal-notifier` 发送可点击的 macOS 通知。权威来源为 `~/.csl-agent-kit/hooks/notify-todo-changed.md` 与 `~/.csl-agent-kit/hooks/scripts/notify-todo-changed.js`。
- Codex 对每条非 managed command hook 按定义 hash 单独保存 trust；CSL Agent Kit 的 Agent Hooks `PostToolUse` dispatcher 必须先在 `/hooks` 中信任才会运行。
- 用户跨会话持久指令以单条全局 Agent Hooks `session-start` / `inject-prompt` 规则存放在 `<data-root>/hooks/`；Codex 与 Claude Code 通过 `SessionStart` dispatcher 注入，Pi 在每次 `before_agent_start` 重新加载。规则不按用户 prompt 关键词匹配。
- hook-only 客户端的 `UserPromptSubmit` 只运行 SOP candidates；持久指令通过 Agent Hooks `SessionStart` 规则注入。Pi 在 `before_agent_start` 重建 Agent Hooks session prompts 与 SOP context。
- 持久指令只在用户明确要求跨会话保存时创建，每条使用独立的 `global:directive-<subject>` 规则并保留高优先级指令和当前请求优先的边界；个人化内容不进入可分发的 CSL Agent Kit Contract。

## Decisions and Conventions

- Skill packages use English for `SKILL.md`, runtime references, prompts, templates, and eval-facing prose; generated reports and user responses still follow the user's language. A task that modifies one skill does not bulk-translate unrelated existing packages unless the user explicitly requests a repository-wide migration — authoritative source: user confirmation on 2026-08-07; review when that language convention changes.
- 新任务从下一项开始采用 `Target` 作为唯一 checkbox（稳定 `Tn` ID），`Plan` 使用普通有序列表，`Result` 按 Target ID 记录当前证据，不再创建独立 `Checklist`；`Scope`、`Block` 与 review details 仅在生命周期需要时出现，当前任务和未触及历史不迁移。
- 自动注入的 CSL Agent Kit Contract 保留稳定的通用原则、task-family 路由与工作流触发指引；任务字段、状态迁移、循环和输出契约等易变细节属于对应 skill。非简单交付物改动进入 task 记录，所有结果按风险验证；只有用户明确要求 `$adversarial-review`、双 Agent Reviewer–Editor 循环或独立 Reviewer 批准时才进入独立审查，风险、复杂度、验证缺口、其他规则或工作流都不会自动触发，未明确要求时记录 `Skipped` 并在常规验证通过后直接完成。
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
