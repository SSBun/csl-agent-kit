# Lessons

## L-20260821-skill-rename-consumers — Skill 移动或重命名时解析全部消费者

### Trigger
- 删除、弃用、移动或重命名一个 Skill、目录或 slash alias。

### Rule
- 在同一改动中搜索并清理当前 README、manifest、安装枚举、规则、Context Authority、路径构造器和测试消费者中的旧名称或旧路径；历史任务记录保持不变。
- 逐个解析共享根目录变量、相对路径与生成式消费者到实际文件，不能只搜索完整旧字符串；已有替代 Skill 时只暴露 canonical 名称。

### Check
- 搜索旧名称和旧路径后只剩有意保留的历史、迁移记录或负向拒绝断言。
- 每个当前消费者解析出的 canonical 路径实际存在，旧路径不存在；获准运行时，相关发现、命令、安装与路径消费者测试通过。

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

## 2026-07-31 发布完成前必须验证最终远端 CI

- **Trigger:**
  - 任务包含向受 CI 保护的分支 push、打 tag 或发布包。
- **Rule:**
  - 最终 push 后必须定位与远端目标 branch HEAD 完全一致的 CI run，并等待其成功；本地测试、dry-run、registry 发布成功或旧 commit 的 CI 结果都不能替代该检查。
  - CI 失败时立即重新打开所属任务，修复并验证新的最终 run 后才能报告发布完成。
- **Check:**
  - CI run 的 `headSha` 与远端 branch HEAD 一致，且结论为 `success`。
  - 任务 Result 记录最终 run 的 ID 或 URL 与成功结论。

## 2026-07-31 共享格式迁移必须覆盖所有读写方

- **Trigger:**
  - 修改由 workflow、检查脚本、扩展或其他组件共同读写的文件格式。
- **Rule:**
  - 变更前搜索所有生产者、消费者和格式样例，并以实际运行时消费者的解析契约验证候选格式。
  - 在同一改动中同步规则、校验器和受影响的消费者测试；不能只验证写入侧格式。
- **Check:**
  - 同一个候选 fixture 同时通过写入侧校验和运行时消费者测试。
  - 搜索旧格式后只剩有意保留的历史记录或明确的拒绝用例。

## 2026-07-29 用目标化检查阻止历史样例覆盖新记录契约

- **Trigger:**
  - 同一索引保留旧格式历史记录，但新建、重新打开或更新的记录必须采用新格式。
- **Rule:**
  - 为当前触及的记录提供可执行格式检查，并在写入后强制运行；不得因历史兼容边界而只依赖提示文本。
  - 检查只针对当前记录，不能要求批量迁移未触及的历史数据。
- **Check:**
  - 新格式目标记录通过，旧格式或与 canonical record 不一致的目标记录失败。
  - 未触及的旧格式兄弟记录不阻塞当前检查。

## 2026-07-28 共享 UI 状态的“保持”不能等同于无操作

- **Trigger:**
  - Hook 或后台任务要求保持标题、状态栏或其他 UI 值，而宿主生命周期也可能改写同一状态。
- **Rule:**
  - 保存最后一次成功写入的所属值；明确的保持决定应重新应用该值，不能假设当前外部状态未被覆盖。
  - 将保持决定与生成失败分开处理；失败路径继续遵守其独立的不写入约束。
- **Check:**
  - 测试模拟外部覆盖后，保持路径恢复最后一次成功值。
  - 测试确认无历史值的初始化行为和生成失败行为分别符合产品约束。

## 2026-07-28 为模型生成的短 UI 标签设置确定性边界

- **Trigger:**
  - 模型生成终端标题、标签、徽标或其他要求严格简短且禁止出现操作过程的 UI 文本。
- **Rule:**
  - Prompt 负责描述核心语义，代码负责强制长度、清理模型元标签，并确定性跳过已知的纯操作型跟进；不得只依赖模型遵守格式和分类要求。
  - 将用户报告的实际坏输出加入回归测试。
- **Check:**
  - 生成文本不超过产品规定的 Unicode 码点上限，且不含模型元标签。
  - commit、push、test、retry、continue 等纯操作样例不会覆盖现有标签。

## 2026-07-23 Workflow skill 完整性优先于初始加载预算

- **Trigger:**
  - 创建、优化或审计负责复杂任务指导的 workflow skill。
- **Rule:**
  - workflow skill 的准确性和完整性优先于 1000-token 初始加载预算。
  - 不得为了通过该预算而删除、压缩失真或拆散执行所必需的核心契约。
- **Check:**
  - 核心判断、步骤、状态迁移、异常处理和完成条件可从主 `SKILL.md` 完整获得。
  - 初始加载预算超限只作为已知检查结果记录，不作为 workflow skill 的完成阻塞项。

## 2026-07-23 Avoid Redundant Confirmation After Explicit Selection

- **Trigger:** A user explicitly selects installation targets, then the workflow asks a generic second confirmation for the same selected actions.
  - **Rule:** Treat the explicit selection-and-submit step as authorization unless the later action introduces a materially different risk or irreversible consequence. When removing a prompt, remove every reader and guard for its response value in the same change.
  - **Why:** Reconfirming the same scope adds friction, while leaving a downstream response guard makes the accepted path fail after the prompt disappears.

## 2026-07-22 Keep Distributed Skills Self-Contained

- **Trigger:** A project RFC or guide informed a distributable skill, but the user clarified that the project document is not part of the skill source.
  - **Rule:** Put operational guidance inside the skill package, keep Agent-facing prose in the requested distribution language, and treat project RFCs as rationale only unless they are explicitly part of the runtime contract.
  - **Why:** A distributed skill must remain usable without repository-only documents, and design history must not override implemented behavior.


## 2026-07-21 将易变工作流留在 Skill 中

- **Trigger:** 优化通用或项目 `AGENTS.md`，且相关 workflow 依赖 skill 主动触发。
- **Rule:** `AGENTS.md` 必须保留稳定的触发条件、强制动作、先后顺序和跳过边界；只有易变的字段、循环和输出契约留在 skill。不得把启动工作流所必需的信息压缩成只有 skill 名称或高层路由。
- **Check:** 脱离 hook 注入时，仅阅读 `AGENTS.md` 也能判断何时加载 skill、实施前应读写哪些文件，以及何时可以跳过。

## 2026-07-20 让多 Agent 角色名匹配工作阶段

- **Trigger:** 为答案形成、方案讨论或最终交付物检查设计多 Agent 工作流。
  - **Rule:** 答案形成阶段使用能表达综合与挑战职责的角色名，例如 Synthesizer / Challenger；Editor / Reviewer 只用于成稿后的修改与验收。不要因通信拓扑相似而复用阶段语义不符的角色名。
  - **Why:** 角色名会向用户和 Agent 暗示流程目标；混用会让讨论误读为批准门禁，并模糊 `deliberate` 与 `adversarial-review` 的边界。

## 2026-07-19 区分取消流程与取消流程限制

- **Trigger:** 用户要求取消某个流程的轮次、次数、预算或上限。
  - **Rule:** 保留流程本身，只移除被点名的限制；除非用户明确说停止或取消整个流程，否则不得把限制变更解释成终止任务。
  - **Why:** “取消循环次数上限”改变的是终止策略，不是取消循环本身。

## 2026-07-16 将项目专用流程与全局可分发技能分开

- **Trigger:** 用户纠正 `integrate-third-skills` 只应在 CSL Agent Kit 项目内被发现。
  - **Rule:** 当用户将某项技能明确限定为项目专用时，将它放入受版本控制的 `.agents/skills/<技能名>/`，并从共享 `skills/`、全局安装枚举和跨平台命令发现中移除；同时检查项目本地链接机制不会重新把它暴露出去。若某个安装器选项仅为这种链接机制存在，应直接移除该选项，而不是保留它来生成共享技能链接。
  - **Why:** 仅靠描述或安装建议不能阻止全局发现；目录位置和发现器边界必须一致。

## 2026-07-16 将“清空”和“选择整合”视为两个独立阶段

- **Trigger:** 用户要求清空 `~/.agents/skills` 后列出上游技能，随后纠正我不应自动重装推荐集合。
  - **Rule:** 当用户要求清空目标目录、再从候选列表选择未来整合项时，清理完成后的目录必须保持为空；只列出候选并等待明确选择，不能把推荐清单当作安装授权。
  - **Why:** 清理的最终状态和后续整合选择是两个独立决策；自动重装会违背“清空全部”的字面结果。

## 2026-07-14 Separate Product, Plugin, And Marketplace Names

- **Trigger:** 为同一个 agent toolkit 设计项目名、plugin 名和 marketplace 名，尤其是平台 identity 使用 `<plugin>@<marketplace>` 时。
  - **Rule:** 不要机械地把完整产品名复制到两个 identity 槽位；分别选择清楚且稳定的 plugin 与 marketplace 名，并先展示最终组合给用户确认。当前 Codex 使用 `csl-agent-kit@csl-agent-market`。
  - **Why:** `csl-agent-kit@csl-agent-kit` 重复且冗长；将产品和分发来源分开命名更容易理解，也避免大小写 alias 迁移问题。

## 2026-07-13 Separate Todo Planning From Plan Mode And Subagents

- **Trigger:** 精简默认 agent 原则但仍要求任务计划时。
  - **Rule:** 保留在所属 `tasks/tasks/<task-slug>.md` 中写可检查计划的要求，不要因此强制进入 plan mode 或调用 subagent；后两者由 agent 按实际需要自行决定。
  - **Why:** todo 是持久化任务控制和验证记录，plan mode 与 subagent 是可选执行能力，三者不应绑定。

## 2026-07-13 Distinguish Agent-Specific And Parent AGENTS Files

- **Trigger:** 判断当前 agent 使用哪份全局 `AGENTS.md`，或决定默认规则模板的更新范围时。
  - **Rule:** 同时检查 harness 实际注入的规则来源和 `~/.agents/AGENTS.md`；不要把 `~/AGENTS.md` 自动等同于 agent-specific 全局配置。当前 `~/.agents/AGENTS.md` 软链接到 super-agent 的默认模板，而 Pi 本会话另行加载了 `~/AGENTS.md`。
  - **Why:** 不同 agent 客户端可能从不同位置加载规则，仅检查 home 根目录会错误判断模板更新是否能对目标客户端生效。

## 2026-07-10 Keep Caveman And Ponytail Responsibilities Distinct

- **Trigger:** 比较、配置或推荐 Caveman 与 Ponytail 时。
  - **Rule:** Caveman 用于压缩回答中的冗词和填充表达；Ponytail 用于让代码输出简洁、清晰并避免过度实现。不要因为两者都强调精简就把它们视为重复插件或建议二选一。
  - **Why:** 两者作用对象不同：一个约束自然语言回答风格，一个约束代码设计与实现规模；同时保留可以形成互补。

## 2026-07-10 Avoid One-Off Skill Interface Folders

- **Trigger:** 某个 skill 单独包含 `agents/` 接口元数据，但项目中的其他 skills 不采用该结构，且运行时和打包配置都不依赖它。
  - **Rule:** 先检查引用和运行依赖；没有实际用途时删除这个一次性目录，不要为了形式完整保留孤立元数据。
  - **Why:** 单个 skill 的特殊目录会制造错误的项目约定，并增加维护和审计噪声。

## 2026-07-10 Keep Repository Name Aligned With Product

- **Trigger:** Renaming the product, npm package, CLI, and local data namespace.
  - **Rule:** Prefer the same distinctive base name across GitHub, npm, CLI, and local data paths unless a platform constraint requires otherwise.
  - **Why:** Using generic `agent-kit` for GitHub while using `csl-agent-kit` everywhere else creates broken assumptions, weaker discoverability, and extra release-time corrections.

## 2026-07-10 CLI Colors Default On

- **Trigger:** Rendering human-readable CSL Agent Kit CLI output.
  - **Rule:** Enable ANSI colors by default, including non-TTY output. Disable only for `--no-color`, `NO_COLOR`, or machine-readable JSON.
  - **Why:** The user prefers consistently colorful CLI output rather than terminal-detection-based behavior.

## 2026-07-09 Rename Means No Legacy Compatibility By Default

- **Trigger:** Renaming project-owned paths, plugin namespaces, or user-facing identifiers after the user says compatibility is not needed.
  - **Rule:** Remove old fallback paths, old environment variables, and old invocation examples instead of preserving compatibility layers.
  - **Why:** Compatibility code keeps stale branding alive and makes docs, scripts, and behavior harder to reason about.

## 2026-07-09 CSL Agent Kit Local Data Directory

- **Trigger:** Modifying SOP, tips, hooks, installer, or docs that reference CSL Agent Kit local user data.
  - **Rule:** Use `~/.csl-agent-kit/` as the canonical local data directory for user SOPs, tips, settings, and future config.
  - **Why:** The project is now named CSL Agent Kit; the local data directory should match the product name and not the old SSBun Skills branding.

## 2026-06-25 Repo Map Deep Concepts Only

- **Trigger:** 设计 repo-map 输出或示例内容时。
  - **Rule:** 不要输出一眼就能看出的项目名、语言、框架等 inventory；只输出通过文件结构、CodeGraph、调用关系和代码阅读确认的组件职责、模块边界、关键类型职责和客观流程。
  - **Why:** repo-map 的价值是帮助 agent 快速理解项目结构和核心职责，不是重复项目元数据或解释实现细节。

## 2026-06-28 CSL Agent Kit Local Data Boundary

- **Trigger:** 修改安装脚本、hooks 或任何 `~/.csl-agent-kit` 路径时。
  - **Rule:** `~/.csl-agent-kit` 只保存用户经验数据，例如 `sops/` 和 `tips/`；不要把 repository mirror 或 skill 代码 symlink 放进去。
  - **Why:** 本地经验数据和安装发现路径混在一起会让输出变吵，也会模糊用户数据与仓库源码的边界。

## 2026-06-28 SOP Create Language Scope

- **Trigger:** 用户要求调整 SOP create 的语言行为时。
  - **Rule:** 不要把 SOP 文件全文强制为某一种语言；主流程描述可以使用任意语言，只有用户明确要求的字段或模板片段才固定语言。
  - **Why:** 把语言约束扩大到整份 SOP 会错误限制用户的流程描述和团队文档习惯。

## 2026-07-08 SOP Example Metadata Minimalism

- **Trigger:** 设计或修改 SOP 示例文件的 YAML frontmatter 时。
  - **Rule:** 不要默认加入 SOP id、owner、creator、reviewer、approver、effective_date 这类治理字段；示例 SOP 默认只保留 `version` 和 `update_date` 这类轻量元数据。
  - **Why:** 示例文件应展示轻量现代格式，过多治理元数据会让新 SOP 创建变重。

## 2026-07-08 AGENTS Template No Local Include

- **Trigger:** 修改 `AGENTS.md` 或 agent template 文件时。
  - **Rule:** 不要在可注入的 AGENTS template/example 中保留 `@/Users/...` 这类用户本机绝对路径 include；本地 `/Users/caishilin/.codex/AGENTS.md` 可以保留用户本机工具 include。
  - **Why:** AGENTS 模板会被注入到其它项目，本机绝对路径 include 不可移植；但用户自己的本地 AGENTS 可以包含本机专用工具规则。
