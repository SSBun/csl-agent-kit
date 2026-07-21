# Workspace Context

## Components

- `skills/adversarial-deliberate/` 以 Coordinator 中转的 Synthesizer–Challenger 循环生成问题、主题、想法、决策或计划的综合答案；Agent 默认先内部批量处理全部相关主题与当前可见议题，只把会实质改变结果且无法内部解决的用户专属选择合并后询问用户。它不设轮次上限，并用稳定资源清单交接双方生成的文件与外部资源；普通 brainstorming、逐题 grilling 和需要 `APPROVED` 的交付物审查不进入该 skill。
- `.agents/skills/integrate-third-skills/` 是受版本控制且仅在本仓库发现的第三方技能整合流程；它以 `metadata.internal: true` 排除 `npx skills` 的普通安装清单，并通过 npm `files` 白名单排除发布包；它也不进入全局 Codex symlink 或 Pi 命令分发。附带脚本仍以共享 `skills/` 为第三方源码根目录。
- `skills/sop-manager/sops/code-style.md` 是跨语言的内置代码风格 SOP；它按语言读取 `skills/sop-manager/references/code-style/` 中的规则参考，Swift 参考为 `swift-style.md`，并已合并后删除用户级 `~/.csl-agent-kit/sops/swift-code-style.md`。
- `references/agents.md` 是可分发的默认 agent 规则（语言协议 + 工程原则 + workspace 路由）；`csl-agent-kit install` 默认把它软链接到 `~/.codex/AGENTS.md`、`~/.claude/CLAUDE.md`、`~/.pi/agent/AGENTS.md`、`~/.agents/AGENTS.md`。旧的 `skills/super-agent` skill 已退役，指向 `skills/super-agent/references/AGENTS.md` 的遗留软链会被 install 自动重指到 `references/agents.md`。
- `~/.agents/skills` 是 Codex 官方的 USER 级技能发现目录，也可作为多个 agent 共用的技能安装目录；按用户要求当前为空，`~/.agents/.skill-lock.json` 的技能映射也为空。未来从 `mattpocock/skills` 选择的技能应整合到 CSL Agent Kit，而非重新安装到该全局目录。
- `skills/mattpocock/` 是选定 `mattpocock/skills` 的专用来源目录，包含 13 项用户指定技能及上游 MIT 许可证；每个叶子技能都有 `.repository.json`，记录上游 URL、原始路径、ref、导入 commit、许可证和上游状态；`skills/grill-me` 的旧顶层版本已由此目录中的同名上游版本替代。
- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。

## Relationships

- 用户始终在场的指令位于 `~/.csl-agent-kit/conventions.md`（纯 Markdown，按主题分组，上限 15 条 / 1500 字符，每条单行命令式）；它经 `references/agents.md` 的 `### Standing Orders` 段引用，并由 `SessionStart`/`PostCompact` hook 与 Pi `session_start`/`session_compact` 一次性全量注入。`standing-orders` skill 只负责增删改并经 CLASSIFY→DISTILL→CHECK→CONFIRM 引导，不参与运行时注入。文件名沿用 `conventions.md` 以避免迁移既有用户数据。
- `csl-agent-kit install` 在没有已确认选择时默认预选 `codex-skills` 和 `codex-plugin`；交互式已确认目标保存在 `/Users/caishilin/.csl-agent-kit/install-selection.json`，下次 checklist 会以其为预选项。
- hook-only 客户端的 `UserPromptSubmit` 只运行 SOP candidates；用户约定通过 `SessionStart`/`PostCompact` hook 一次性注入，不按 prompt 关键词匹配。Pi 在 `session_start` 与 `before_agent_start` 重建当前会话的约定与 SOP context。
- 用户 standing orders 保持纯 Markdown，每条单一、可执行、跨会话有效；上限 15 条 / 1500 字符，每条 ≤ 120 字符；不做关键词匹配；个人化内容（绝对路径、本机工具）只进 `~/.csl-agent-kit/conventions.md`，不进可分发的 `references/agents.md`。
- `bin/csl-agent-kit.js` 与 `pi/extensions/csl-skill-commands.ts` 会递归发现共享 `skills/` 下的叶子 `SKILL.md`，因此 `skills/mattpocock/<skill>/` 会以原始技能名暴露给全局 Codex symlink 安装与 Pi slash alias；项目本地 `.agents/skills/integrate-third-skills/` 不在此枚举中。安装器不提供 repo-local `.agents/skills` 链接目标。
- 第三方技能元数据固定为 `.repository.json`，字段为 `repository`、`sourcePath`、`ref`、`commit`、`license` 和 `upstreamStatus`；它描述可复现的上游基线，不应在更新时绕过本地差异比较。
- `third-party-skills.js status` 对每个来源/ref 在临时目录检出一次上游，并以 `git diff --quiet <导入commit> <当前commit> -- <sourcePath>` 区分“上游变化”和“技能未变”；`diff` 默认显示统计，`--patch` 才显示完整补丁，且排除本地 `.repository.json` 管理文件。

## Decisions and Conventions

- `skills/workspace-workflow/` 以三个独立 leaf skills 承载默认 Agent 的工作区记录流程：`workspace-maintain-context` 维护稳定工作区事实，`workspace-manage-task` 维护任务契约、状态与 adversarial-review 交接，`workspace-capture-lessons` 在工作前应用相关经验并在纠正后维护可复用规则；`references/agents.md` 只保留三条强制路由。Codex 与 Cursor 从 skills 根递归发现，Pi 动态递归注册别名，Claude manifest 显式列出三个 leaf 路径。
- 可分发默认 `AGENTS.md` 只保留稳定的通用原则：非简单工作才进入 task 记录，所有结果都按风险验证，独立审查只在用户明确要求或任务约束将其设为完成门禁时使用。具体触发、循环和报告契约属于对应 skill，不写入项目 `AGENTS.md`，避免规则频繁改动破坏 prompt cache。
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
- `references/` 现纳入 npm 发布白名单，包含默认 `agents.md`；`super-agent` skill 目录已删除，不再随包发布。
- README 当前列出 32 个可分发技能；第三方源码导入不等同于安装到 `~/.agents/skills`，除非用户明确要求执行安装器。`integrate-third-skills` 是本仓库本地流程，不计入这个数量。
