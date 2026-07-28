# Workspace Context
- `csl-agent-kit install` treats the integration multiselect as sufficient authorization and does not ask a second external-CLI confirmation.

- Triggerify's distributed `SKILL.md` is written in English, treats its bundled CLI as the accepted-behavior authority, and does not use the project RFC as runtime guidance.


## Components

- `inner:refresh-tab-title` 在 Pi 上通过 hook-ID 专属 input 接收 compaction-aware 活跃分支中的用户、助手与会话摘要文本，排除工具调用/结果、thinking 和 image，并以 12,000 个 Unicode 码点保留会话开头与最新上下文；只有标题模型返回有效新标题时才写 OSC，例行跟进、`KEEP_CURRENT_TITLE`、模型失败或空结果均保持原标题。其他宿主没有稳定会话 API 时仍只提供最新 prompt。权威实现与回归入口为 `pi/extensions/csl-context-hooks.ts`、`skills/triggerify/scripts/refresh-tab-title.js`、`tests/pi-context-hooks.test.mjs` 和 `tests/triggerify.test.js`。
- `pi/extensions/csl-context-hooks.ts` 是 Triggerify 的 Pi adapter：通过 facade 的 `createEvent()` / `runEvent()` 生成以 `ctx.cwd` 为工作区的标准事件；它按 `toolCallId` 记录 `write` / `edit` 调用前状态，成功结果提供工作区相对的 `changed_files`（`created` / `modified`），失败或工作区外文件提供空数组，其他工具保持 unknown。权威实现与回归测试为该 extension 和 `tests/pi-context-hooks.test.mjs`。
- `pi/extensions/csl-task-overlay.ts` 以 `<ctx.cwd>/tasks/todo.md` 作为任务状态来源，任务正文只提供 Target 进度；UI session 启动时立即刷新，随后每 5 秒清除当前工作区进度缓存并重读任务，重复启动会先释放旧 timer，`session_shutdown` 负责最终清理。权威实现与回归测试为该 extension 和 `tests/pi-task-overlay.test.mjs`。
- 主分支的 `csl-agent-kit` CLI 不包含 benchmark 命令；benchmark 实现仍是未合入且已中止的独立工作，不应在 `bin/csl-agent-kit.js` 中保留失效的 `scripts/benchmark-cli.js` 依赖。
- `skills/triggerify/scripts/triggerify.js` 是稳定 facade；V1 规则语义、文件存储、宿主无关运行时、CLI 与 Codex/Claude native hook 适配分别由 `scripts/lib/{rule,store,runtime,cli,native-hook}.js` 负责，外部宿主适配应通过 facade 的 `createEvent()` 和 `runEvent()` 接入。权威边界是这些模块导出与 `tests/triggerify.test.js`；修改跨层行为时复核两者。
- Triggerify inner hooks 从 `skills/triggerify/hooks/` 随包分发、默认启用且源文件不可由 CLI 创建/更新/删除；用户通过 `<data-root>/triggerify/config.json` 的 `disabledHooks` 控制启用状态，并可用 qualified ID 键控的 `hookSettings` 保存专属设置。配置无效时仅 inner hooks fail-closed；运行时把当前 hook 的设置作为 `TRIGGERIFY_HOOK_CONFIG` 传给脚本，host adapter 还可按 qualified ID 通过 `TRIGGERIFY_HOOK_INPUT` 提供只对该脚本可见的临时输入，stdin event payload 保持不变。`inner:refresh-tab-title` 的状态也必须写入 data root，不能写入 skill 源目录；权威实现与回归入口为 `store.js`、`runtime.js`、`cli.js` 和 `tests/triggerify.test.js`。
- `skills/triggerify/scripts/validate-rules.js` 复用 V1 `parseMarkdown()` 校验一个或多个候选 trigger Markdown 的 frontmatter 与规则语义；已存储脚本的可执行性和宿主 effective 状态仍以 `triggerify show` 为准。权威入口是该脚本与 `skills/triggerify/SKILL.md`。
- `skills/triggerify/` 是 Triggerify V1 的共享管理与运行核心；规则可选 `description` 为单行、非空、无控制字符且最多 160 字符，qualified ID 仍由文件名决定，`list`/`show` 负责展示。`csl-agent-kit triggerify` 提供 create/list/show/update/enable/disable/delete 恢复控制面，`hooks/hooks.json` 将 Codex/Claude 生命周期事件映射到同一 dispatcher，Pi extension 在每次 `before_agent_start` 加载全局 `session-start` Prompt 规则。Codex hook payload 不提供 workspace trust verdict，因此运行时只加载 global rules，项目 `list` 保持 metadata-only；Claude Code 和 Pi 目前只验证了 `session-start` Prompt 注入，Cursor V1 因宿主仍丢弃 `additional_context` 而保持 unsupported。

- `skills/adversarial-deliberate/` 以 Coordinator 中转的 Synthesizer–Challenger 循环生成问题、主题、想法、决策或计划的综合答案；路由依据是明确的迭代或全面多视角意图，不以裸角色名作为足够证据，普通 brainstorming、逐题 grilling 和需要 `APPROVED` 的交付物审查不进入该 skill。Agent 默认先内部批量处理全部相关主题与可见议题；循环不设硬轮次上限，但 `CONTINUE` 必须对应实质性开放 D-ID 与具体下一轮变化，且只有所有实质性 D-ID 关闭并复查所有固定 T-ID 后才可 `SUFFICIENT`；权威契约与复核入口为该 skill 的 `SKILL.md` 和 `evals/`。
- `.agents/skills/integrate-third-skills/` 是受版本控制且仅在本仓库发现的第三方技能整合流程；它以 `metadata.internal: true` 排除 `npx skills` 的普通安装清单，并通过 npm `files` 白名单排除发布包；它也不进入全局 Codex symlink 或 Pi 命令分发。附带脚本仍以共享 `skills/` 为第三方源码根目录。
- `skills/sop-manager/sops/code-style.md` 是跨语言的内置代码风格 SOP；它按语言读取 `skills/sop-manager/references/code-style/` 中的规则参考，Swift 参考为 `swift-style.md`，并已合并后删除用户级 `~/.csl-agent-kit/sops/swift-code-style.md`。
- `super-agent/AGENTS.md` 是可分发的默认 agent 规则（语言协议 + 工程原则 + workspace 路由）；`csl-agent-kit install` 默认将它软链接到 `~/.codex/AGENTS.md`、`~/.claude/CLAUDE.md`、`~/.pi/agent/AGENTS.md`、`~/.agents/AGENTS.md`，并将 super-agent 目标视为 authoritative：现有软链接默认重置，普通文件先备份再替换，dry-run 不写入。
- `~/.agents/skills` 是 Codex 官方的 USER 级技能发现目录，也可作为多个 agent 共用的技能安装目录；按用户要求当前为空，`~/.agents/.skill-lock.json` 的技能映射也为空。未来从 `mattpocock/skills` 选择的技能应整合到 CSL Agent Kit，而非重新安装到该全局目录。
- `skills/mattpocock/` 是选定 `mattpocock/skills` 的专用来源目录，包含 13 项用户指定技能及上游 MIT 许可证；每个叶子技能都有 `.repository.json`，记录上游 URL、原始路径、ref、导入 commit、许可证和上游状态；`skills/grill-me` 的旧顶层版本已由此目录中的同名上游版本替代。
- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。

## Relationships

- 全局 Triggerify 规则 `global:notify-todo-changed` 在 Pi 上通过 `edit` / `write` 的标准 `changed_files` 识别 `tasks/todo/*.md` 变更，在 Codex 上保留 `apply_patch` header fallback；脚本规范化真实路径并限制在 workspace 的真实 `tasks/todo` 目录后，使用 `terminal-notifier` 发送可点击的 macOS 通知。权威来源为 `~/.csl-agent-kit/triggerify/hooks/notify-todo-changed.md` 与同目录 `scripts/notify-todo-changed.js`。
- Codex 对每条非 managed command hook 按定义 hash 单独保存 trust；CSL Agent Kit 的 Triggerify `PostToolUse` dispatcher 必须先在 `/hooks` 中信任才会运行。
- 用户跨会话持久指令以单条全局 Triggerify `session-start` / `inject-prompt` 规则存放在 `<data-root>/triggerify/hooks/`；Codex 与 Claude Code 通过 `SessionStart` dispatcher 注入，Pi 在每次 `before_agent_start` 重新加载。规则不按用户 prompt 关键词匹配。
- `csl-agent-kit install` 在没有已确认选择时默认预选 `codex-skills` 和 `codex-plugin`；交互式已确认目标保存在 `/Users/caishilin/.csl-agent-kit/install-selection.json`，下次 checklist 会以其为预选项。
- hook-only 客户端的 `UserPromptSubmit` 只运行 SOP candidates；持久指令通过 Triggerify `SessionStart` 规则注入。Pi 在 `before_agent_start` 重建 Triggerify session prompts 与 SOP context。
- 持久指令只在用户明确要求跨会话保存时创建，每条使用独立的 `global:directive-<subject>` 规则并保留高优先级指令和当前请求优先的边界；个人化内容不进入可分发的 `super-agent/AGENTS.md`。
- `bin/csl-agent-kit.js` 与 `pi/extensions/csl-skill-commands.ts` 会递归发现共享 `skills/` 下的叶子 `SKILL.md`，因此 `skills/mattpocock/<skill>/` 会以原始技能名暴露给全局 Codex symlink 安装与 Pi slash alias；项目本地 `.agents/skills/integrate-third-skills/` 不在此枚举中。安装器不提供 repo-local `.agents/skills` 链接目标。
- 第三方技能元数据固定为 `.repository.json`，字段为 `repository`、`sourcePath`、`ref`、`commit`、`license` 和 `upstreamStatus`；它描述可复现的上游基线，不应在更新时绕过本地差异比较。
- `third-party-skills.js status` 对每个来源/ref 在临时目录检出一次上游，并以 `git diff --quiet <导入commit> <当前commit> -- <sourcePath>` 区分“上游变化”和“技能未变”；`diff` 默认显示统计，`--patch` 才显示完整补丁，且排除本地 `.repository.json` 管理文件。

## Decisions and Conventions

- 新任务从下一项开始采用 `Target` 作为唯一 checkbox（稳定 `Tn` ID），`Plan` 使用普通有序列表，`Result` 按 Target ID 记录当前证据，不再创建独立 `Checklist`；`Scope`、`Block` 与 review details 仅在生命周期需要时出现，当前任务和未触及历史不迁移。
- 新建或更新任务状态时，canonical task 使用 `Status: <state> (YYYY-MM-DD HH:MM)`，`tasks/todo.md` 使用完全一致的 `<state> (YYYY-MM-DD HH:MM)`；不批量改写未触及的历史任务。
- `skills/workspace-workflow/` 以三个独立 leaf skills 承载默认 Agent 的工作区记录流程：`workspace-maintain-context` 只保留已确认、项目特有、会改变未来判断且可复核的事实，并要求易变边界有权威入口、复核触发，临时事实有事件型退出；`workspace-manage-task` 维护任务契约、状态与 adversarial-review 交接，`workspace-capture-lessons` 在工作前应用相关经验并在纠正后维护可复用规则。`super-agent/AGENTS.md` 保留稳定触发、文件职责与跳过边界，`super-agent/workspace-workflow-gates.md` 固定 SessionStart/PostCompact 的五步调度顺序，三个 skills 拥有易变执行契约。Workflow skill 的核心操作契约完整保留在主 `SKILL.md`，准确性和完整性优先于 Yao 的 1000-token 初始加载预算。Codex 与 Cursor 从 skills 根递归发现，Pi 动态递归注册别名，Claude manifest 显式列出三个 leaf 路径。
- 可分发默认 `AGENTS.md` 保留稳定的通用原则与工作流触发指引；任务字段、状态迁移、循环和输出契约等易变细节属于对应 skill。非简单交付物改动进入 task 记录，所有结果按风险验证；独立审查门禁固定为 `Explicit OR Critical OR (Complex AND Verification Gap)`，否则记录 `Skipped` 并在常规验证通过后直接完成。
- `adversarial-review` 必须把 `Finding`、`Required Outcome` 和 `Suggested Remedy` 作为三个独立概念：Finding 只陈述有证据的问题或风险，Required Outcome 只定义必须达到的结果，Suggested Remedy 是可被 Editor 接受、缩小或基于证据拒绝的建议；解决 Finding 不等于必须采用 Reviewer 的建议实现。
- `adversarial-review` 的 `BLOCKER` 必须同时说明被违反的要求或原则、可观察证据、不处理的实际风险与 `Required Outcome`；缺少任一项时不得作为阻塞性 Finding，应降级为 `QUESTION`、`NOTE` 或省略。`Suggested Remedy` 不能代替这四项成立条件。
- `adversarial-review` 的 Editor 对每个 Finding 必须依次审计 `Current Adequacy`、`Minimal Resolution`、`Blast Radius` 与 `Proportionality`，再选择接受、缩小、拒绝、确认无需修改或需要用户决定。当前方案已满足 `Required Outcome` 时默认保留，除非正确性、安全、数据完整性或明确需求提供了必须变更的证据。
- `adversarial-review` 只以 `Required Outcome` 是否已满足作为 Finding 的复审和关闭标准，不以 `Suggested Remedy` 是否被采用为标准。Editor 的更小修复或基于证据的拒绝已消除风险时，Reviewer 必须关闭 Finding；若继续阻塞，必须指出新证据或仍未满足的 `Required Outcome`，不得只重复原建议。
- `adversarial-review` 的 Finding 类型语义固定：`BLOCKER` 是满足四项成立条件的明确违规或实质风险，可通过满足 `Required Outcome` 或证明 Finding 不成立而关闭；`QUESTION` 只请求判断所需的缺失信息，不得隐含修改命令；`NOTE` 是非阻塞观察或可选改进，Editor 确认后即关闭，不得要求修改 artifact。纯偏好、顺手重构与推测性未来需求应省略。
- `adversarial-review` 的 Reviewer 与 Editor 共同遵守以下优先级：用户意图，然后是正确性、安全、数据完整性与明确兼容要求，再是 `Required Outcome`、证据、最小改动、最小影响范围和最低的已证成本。当多个方案都满足 `Required Outcome` 时，必须选择影响范围更小、维护成本更低且新假设更少的方案；最终以测试或可观察证据判定，不以双方口头同意判定。
- `tasks/todo.md` 是 newest-first 导航索引，只保存任务标题、当前状态和 `tasks/todo/<task-slug>.md` 相对链接；每个独立任务文件才是目标、计划、审查状态与复核历史的唯一权威记录。Agent 只能修改所属任务文件及其精确索引项，不能重写其他任务状态。
- `analyze-project` v2 的 `learn` 模式一次只分析一个 project/目录/文件 scope，并输出一份 `docs/analysis/learning/` 下的掌握指南；核心结构为最小 Orientation、目标覆盖链、Concept Ladder、代表行为走读、严格串行的 Human Recall/Prediction/Transfer checks 与 Verification Key。Agent 不使用“学会/回忆”语义，只以 sealed held-out prediction/transfer trial 衡量报告效用。
- `learn` v1 不读取 Develop map、不生成 Mermaid、不增量合并旧报告；现有普通报告只允许完整重分析后安全原子替换。project/dir 只在职责学习链覆盖图不连通时要求缩小 scope，file 图不连通时仍生成一份按分量组织的报告。
- `adversarial-review` 在循环运行中只通过 Agent handoff 传递完整 finding ledger，不写中间报告或同步 task 状态；仅在审查结束或暂停时写一次 `reports/adversarial-review/<task-slug>.md`。最终文件只包含每个实质 finding 的讨论结果和一项最终决定，其中 `Reviewer position` 与 `Editor response` 用嵌套列表逐条展示核心观点；报告不含总体结论、主题清单、验证章节、Reviewer/轮次/fingerprint/round history 等技术附录。已有 owning task 时只追加最终决定和报告链接，不能为承载报告单独创建 task。
- 每次 adversarial-review pass 都必须覆盖固定的完整 scope：Reviewer 一次性报告当前可见的全部 `BLOCKER`、`QUESTION` 与 `NOTE`，并在复审中逐项说明全部既有 finding ID 已解决或未解决，不得故意分轮释放；Editor 一次性回答和处理整轮全部条目后才能请求普通复审。后续新 finding 必须指出使其此前不可行动的新 artifact、diff、证据或其他原因；需要用户决定时保持 `BLOCKED`，多个方案进入 Decision Consensus Gate，否则直接询问用户，不得用普通复审绕过决定。
- `adversarial-review` 对代码、PRD、RFC、设计文档及其他交付物执行同一 fail-closed 双 Agent 流程；不设总轮次上限，只保留单调递增的 `INITIAL (1)` 与 `RE-REVIEW (n)` 审计编号。流程仅按 `APPROVED`、需要用户、客观阻塞、连续无实质进展或用户停止等状态结束或暂停；不同交付物只切换 review lens。
- `skills/sop-manager/references/code-style/swift-style.md` 只保留按主题分组的 Swift 具体规则：类型与状态、可选值与失败路径、控制流、enum 与 MARK、extension 组织、方法布局、文档注释和改动边界；覆盖 `T!` 边界、强制操作、`guard`、`for ... where`、`@unknown default`、类型简写和公开声明 summary。只有需要展示精确语法或布局的规则才附最小代码块，适用边界和使用顺序放在 `code-style.md`。
- 默认 agent 规则不规定 plan mode 或 subagent 策略；agent 可以按任务需要自行使用这些能力。d
- `super-agent/` 纳入 npm 发布白名单，包含默认 `AGENTS.md` 与 workspace lifecycle dispatcher；它是运行时规则资产目录，不是 skill。
- README 当前列出 31 个可分发技能；第三方源码导入不等同于安装到 `~/.agents/skills`，除非用户明确要求执行安装器。`integrate-third-skills` 是本仓库本地流程，不计入这个数量。
