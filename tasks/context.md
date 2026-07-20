# Workspace Context

## Components

- `skills/adversarial-discuss/` 以 Coordinator 中转的 Editor–Reviewer 循环生成问题、主题、想法、决策或计划的综合答案；它不设轮次上限，只在覆盖充分、需要用户/外部输入、客观阻塞或用户停止时结束或暂停，并用稳定资源清单交接双方生成的文件与外部资源。普通 brainstorming 和需要 `APPROVED` 的交付物审查不进入该 skill。
- `.agents/skills/integrate-third-skills/` 是受版本控制且仅在本仓库发现的第三方技能整合流程；它以 `metadata.internal: true` 排除 `npx skills` 的普通安装清单，并通过 npm `files` 白名单排除发布包；它也不进入全局 Codex symlink 或 Pi 命令分发。附带脚本仍以共享 `skills/` 为第三方源码根目录。
- `skills/sop-manager/sops/code-style.md` 是跨语言的内置代码风格 SOP；它按语言读取 `skills/sop-manager/references/code-style/` 中的规则参考，Swift 参考为 `swift-style.md`，并已合并后删除用户级 `~/.csl-agent-kit/sops/swift-code-style.md`。
- `skills/super-agent/references/AGENTS.md` 是可分发的默认 agent 规则；`~/.agents/AGENTS.md` 已按用户确认软链接到该文件，原失效链接保存在 `~/.agents/AGENTS.md.backup-20260719-163637`。
- `~/.agents/skills` 是 Codex 官方的 USER 级技能发现目录，也可作为多个 agent 共用的技能安装目录；按用户要求当前为空，`~/.agents/.skill-lock.json` 的技能映射也为空。未来从 `mattpocock/skills` 选择的技能应整合到 CSL Agent Kit，而非重新安装到该全局目录。
- `skills/mattpocock/` 是选定 `mattpocock/skills` 的专用来源目录，包含 13 项用户指定技能及上游 MIT 许可证；每个叶子技能都有 `.repository.json`，记录上游 URL、原始路径、ref、导入 commit、许可证和上游状态；`skills/grill-me` 的旧顶层版本已由此目录中的同名上游版本替代。
- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。

## Relationships

- tips 数据位于 `/Users/caishilin/.csl-agent-kit/tips/tips.json`；每条含 `text` 与 `keywords`，运行时只注入当前 prompt 命中的条目。
- `csl-agent-kit install` 在没有已确认选择时默认预选 `codex-skills` 和 `codex-plugin`；交互式已确认目标保存在 `/Users/caishilin/.csl-agent-kit/install-selection.json`，下次 checklist 会以其为预选项。
- hook-only 客户端的 `UserPromptSubmit` 同时运行 tips 与 SOP candidates；命中的 tips 只注入一行简洁的适用/优先级说明与条目。`SessionStart` 和 `PostCompact` 不再注入完整 tips。Pi 在 `before_agent_start` 临时重建当前 prompt 的候选 tips context。
- tips 单条上限为 150 个 Unicode code point、最多 20 条、正文合计最多 2,000 个字符；每条 prompt 都静默检查全部显式关键词，`"*"` 不受支持。
- `bin/csl-agent-kit.js` 与 `pi/extensions/csl-skill-commands.ts` 会递归发现共享 `skills/` 下的叶子 `SKILL.md`，因此 `skills/mattpocock/<skill>/` 会以原始技能名暴露给全局 Codex symlink 安装与 Pi slash alias；项目本地 `.agents/skills/integrate-third-skills/` 不在此枚举中。安装器不提供 repo-local `.agents/skills` 链接目标。
- 第三方技能元数据固定为 `.repository.json`，字段为 `repository`、`sourcePath`、`ref`、`commit`、`license` 和 `upstreamStatus`；它描述可复现的上游基线，不应在更新时绕过本地差异比较。
- `third-party-skills.js status` 对每个来源/ref 在临时目录检出一次上游，并以 `git diff --quiet <导入commit> <当前commit> -- <sourcePath>` 区分“上游变化”和“技能未变”；`diff` 默认显示统计，`--patch` 才显示完整补丁，且排除本地 `.repository.json` 管理文件。

## Decisions and Conventions

- `tasks/todo.md` 是 newest-first 导航索引，只保存任务标题、当前状态和 `tasks/todo/<task-slug>.md` 相对链接；每个独立任务文件才是目标、计划、审查状态与复核历史的唯一权威记录。Agent 只能修改所属任务文件及其精确索引项，不能重写其他任务状态。
- `analyze-project` v2 的 `learn` 模式一次只分析一个 project/目录/文件 scope，并输出一份 `docs/analysis/learning/` 下的掌握指南；核心结构为最小 Orientation、目标覆盖链、Concept Ladder、代表行为走读、严格串行的 Human Recall/Prediction/Transfer checks 与 Verification Key。Agent 不使用“学会/回忆”语义，只以 sealed held-out prediction/transfer trial 衡量报告效用。
- `learn` v1 不读取 Develop map、不生成 Mermaid、不增量合并旧报告；现有普通报告只允许完整重分析后安全原子替换。project/dir 只在职责学习链覆盖图不连通时要求缩小 scope，file 图不连通时仍生成一份按分量组织的报告。
- `adversarial-review` 为每个 review task 在 `reports/adversarial-review/<task-slug>.md` 维护一份稳定报告，并与 `tasks/todo/<task-slug>.md` 双向链接；完整 Gate、Reviewer、轮次、scope、摘要与未解决项保存在任务文件，`tasks/todo.md` 只保留导航摘要。报告、所属任务与精确索引状态对 ledger 的同步属于管理记录，不使批准失效；完整报告不粘贴到用户对话。
- 每次 adversarial-review pass 都必须覆盖固定的完整 scope：Reviewer 一次性报告当前可见的全部 `BLOCKER`、`QUESTION` 与 `NOTE`，并在复审中逐项说明全部既有 finding ID 已解决或未解决，不得故意分轮释放；Editor 一次性回答和处理整轮全部条目后才能请求普通复审。后续新 finding 必须指出使其此前不可行动的新 artifact、diff、证据或其他原因；需要用户决定时保持 `BLOCKED`，多个方案进入 Decision Consensus Gate，否则直接询问用户，不得用普通复审绕过决定。
- `adversarial-review` 对代码、PRD、RFC、设计文档及其他交付物执行同一 fail-closed 双 Agent 流程；不设总轮次上限，只保留单调递增的 `INITIAL (1)` 与 `RE-REVIEW (n)` 审计编号。流程仅按 `APPROVED`、需要用户、客观阻塞、连续无实质进展或用户停止等状态结束或暂停；不同交付物只切换 review lens。
- `skills/sop-manager/references/code-style/swift-style.md` 只保留按主题分组的 Swift 具体规则：类型与状态、可选值与失败路径、控制流、enum 与 MARK、extension 组织、方法布局、文档注释和改动边界；覆盖 `T!` 边界、强制操作、`guard`、`for ... where`、`@unknown default`、类型简写和公开声明 summary。只有需要展示精确语法或布局的规则才附最小代码块，适用边界和使用顺序放在 `code-style.md`。
- 任何文件修改或非简单任务都必须先在当前 workspace 的 `tasks/todo/<task-slug>.md` 写可检查计划，并在 `tasks/todo.md` 建立索引项；`tasks/context.md` 的常规维护是唯一例外。
- 默认 agent 规则不规定 plan mode 或 subagent 策略；agent 可以按任务需要自行使用这些能力。d
- npm 发布白名单显式排除 `skills/super-agent/references/AGENTS.md.backup-*`，因此该本地备份即使被 Git 跟踪也不会进入 npm tarball。
- README 当前列出 29 个可分发技能；第三方源码导入不等同于安装到 `~/.agents/skills`，除非用户明确要求执行安装器。`integrate-third-skills` 是本仓库本地流程，不计入这个数量。
