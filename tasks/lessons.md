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

## 2026-08-07 深度探索先解释对象再呈现认知边界

- **Trigger:**
  - 生成或修订主题、项目或任务的 deep-explore 指南与报告。
- **Rule:**
  - 第一实质内容必须给出简洁准确的定义，再依次解释对象做什么、如何工作和如何实现。
  - 限制、开放问题、冲突与失败模式只作为理解对象的认知边界呈现，不得组织成对象缺陷清单或让问题搜寻成为报告主轴。
  - 用户实际需要审计、review、整改或开发建议时，转交对应能力，不得借探索流程执行。
- **Check:**
  - 批准指南和主报告都在认知边界之前覆盖定义、作用、工作原理与实现方式。
  - 报告没有对对象打分、批准、整改或提出未请求的修复建议。

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

## 2026-07-23 Workflow skill 完整性优先于 Yao token 预算

- **Trigger:**
  - 创建、优化或审计负责复杂任务指导的 workflow skill。
- **Rule:**
  - workflow skill 的准确性和完整性优先于 Yao 的 1000-token 初始加载预算。
  - 不得为了通过该预算而删除、压缩失真或拆散执行所必需的核心契约。
- **Check:**
  - 核心判断、步骤、状态迁移、异常处理和完成条件可从主 `SKILL.md` 完整获得。
  - Yao 超限只作为已知审计结果记录，不作为 workflow skill 的完成阻塞项。

## L-20260820-task-before-preparation — 先建立任务记录再进行实质准备

### Trigger
- 用户请求或对话已形成一个具体、非平凡且可独立验收的目标。

### Rule
- 在针对该目标进行实质讨论、需求澄清、仓库探索、调研、规划、委派或实施前，先创建、恢复或重新打开 owning canonical task；此前只允许加载 Project Core，以及为确认任务归属而进行最小范围的索引和候选记录查询。
- 一般事实问答、未形成具体目标的开放讨论、琐碎确定性机械操作及 Context/Lessons 维护可以跳过任务记录。

### Check
- 对每个具体非平凡目标，首次读取任务直接相关来源、调研、委派或修改交付物前，canonical task 已存在且当前 Session 已聚焦；跳过场景符合上述边界。

## 2026-07-23 Avoid Redundant Confirmation After Explicit Selection

- **Trigger:** A user explicitly selects installation targets, then the workflow asks a generic second confirmation for the same selected actions.
  - **Rule:** Treat the explicit selection-and-submit step as authorization unless the later action introduces a materially different risk or irreversible consequence. When removing a prompt, remove every reader and guard for its response value in the same change.
  - **Why:** Reconfirming the same scope adds friction, while leaving a downstream response guard makes the accepted path fail after the prompt disappears.

## 2026-07-22 Keep Distributed Skills Self-Contained

- **Trigger:** A project RFC or guide informed a distributable skill, but the user clarified that the project document is not part of the skill source.
  - **Rule:** Put operational guidance inside the skill package, keep Agent-facing prose in the requested distribution language, and treat project RFCs as rationale only unless they are explicitly part of the runtime contract.
  - **Why:** A distributed skill must remain usable without repository-only documents, and design history must not override implemented behavior.


## 2026-07-23 持久指令使用无条件生命周期触发

- **Trigger:**
  - 设计或维护跨会话持续有效的用户指令。
- **Rule:**
  - 每条指令保存为全局 Triggerify `session-start` / `inject-prompt` 规则。
  - 不得按用户 prompt 关键词匹配持久指令。
  - 规则正文必须保留高优先级指令和当前请求优先的边界。
- **Check:**
  - `triggerify show` 显示规则有效。
  - Codex、Claude Code、Pi 的会话入口均能注入内容；Cursor 保持 unsupported/inactive，直到宿主能把注入内容传给模型。

## 2026-07-21 任务状态使用英文词汇

- **Trigger:** 创建或更新任务文件与任务索引中的当前状态。
  - **Rule:** 只使用 `Pending`、`In Progress`、`In Review`、`Completed`、`Blocked`，并附本地时间 `YYYY-MM-DD HH:MM`；索引与 canonical task 状态文本必须完全一致，不要翻译状态词，也不要为应用新规则而批量改写历史任务。
  - **Why:** 固定英文词汇可消除状态表达差异，并保持既有任务历史稳定。

## 2026-07-21 先确认规则与工作流设计再落盘

- **Trigger:** 用户要求查看、讨论、检查或确认新的规则、模板、任务结构、SOP 或 skill 设计后再决定是否采用。
  - **Rule:** 先在对话中展示候选结构或示例并等待明确批准；不要把“优化”“设计”或“你觉得怎么样”解释为修改文件的授权。用户批准后再创建任务记录并实施。
  - **Why:** 规则和工作流会持续影响后续 Agent；未经确认直接落盘会把尚在讨论的候选方案错误固化。

## 2026-07-21 用列表呈现审查双方观点

- **Trigger:** 最终审查报告需要展示 Reviewer 与 Editor 的立场和回应。
  - **Rule:** `Reviewer position` 和 `Editor response` 必须使用嵌套列表，每条只表达一个核心观点；不要把多个判断、证据和方案挤进一个段落值。
  - **Why:** 角色观点常包含多个独立判断，列表比长段落更容易扫描、对照和确认最终分歧。

## 2026-07-21 将易变工作流留在 Skill 中

- **Trigger:** 优化通用或项目 `AGENTS.md`，且相关 workflow 依赖 skill 主动触发。
- **Rule:** `AGENTS.md` 必须保留稳定的触发条件、强制动作、先后顺序和跳过边界；只有易变的字段、循环和输出契约留在 skill。不得把启动工作流所必需的信息压缩成只有 skill 名称或高层路由。
- **Check:** 脱离 hook 注入时，仅阅读 `AGENTS.md` 也能判断何时加载 skill、实施前应读写哪些文件，以及何时可以跳过。

## 2026-07-21 让流程成本与可验证风险匹配

- **Trigger:** 用户要求执行精确保存、复制、移动、重命名等基础文件操作，且结果可由目标路径、文件类型、hash、`cmp` 或同等确定性检查完整证明。
  - **Rule:** 不为这类无语义变更的机械操作创建 todo 或运行 adversarial review，直接完成并验证。只有工作需要实质判断、改变内容语义，或涉及破坏性、歧义、安全与数据完整性风险时，才进入相应任务记录和审查流程。
  - **Why:** 机械操作的正确性已有直接证据；额外的任务台账和多 Agent 审查不会增加可信度，只会拖慢交付。

## 2026-07-20 让多 Agent 角色名匹配工作阶段

- **Trigger:** 为答案形成、方案讨论或最终交付物检查设计多 Agent 工作流。
  - **Rule:** 答案形成阶段使用能表达综合与挑战职责的角色名，例如 Synthesizer / Challenger；Editor / Reviewer 只用于成稿后的修改与验收。不要因通信拓扑相似而复用阶段语义不符的角色名。
  - **Why:** 角色名会向用户和 Agent 暗示流程目标；混用会让讨论误读为批准门禁，并模糊 `deliberate` 与 `adversarial-review` 的边界。

## 2026-07-20 区分文件化审查报告与普通任务交接

- **Trigger:** 用户要求审查报告只写入文件、不在会话中展示。
  - **Rule:** 批准后只给普通任务结果、用户相关变更、验证结果和报告链接；不得使用“最终审查报告”等报告标题，也不得主动复述 Gate、State、Reviewer、轮次、findings、审查流程或外部操作授权。只有用户明确询问审查详情时才回答对应信息。
  - **Why:** 仅禁止粘贴完整报告仍会留下“报告式摘要”漏洞，使文件化输出契约在用户体验上失效。

## 2026-07-19 隔离并发任务记录

- **Trigger:** 多个 Agent 或会话可能同时更新不同任务的进度、审查状态或完成标记。
  - **Rule:** 每个任务使用独立的 `tasks/tasks/<task-slug>.md` 作为唯一权威记录；`tasks/tasks.md` 只维护标题、当前状态和链接。每次只修改所属任务文件及其精确索引项，写入前重新读取目标，禁止用整文件旧快照覆盖索引或其他任务。
  - **Why:** 共享大文件中的并发整段写入会造成已批准状态回退、任务内容丢失和错误归属；按任务隔离把冲突面缩到单一索引行。

## 2026-07-19 区分取消流程与取消流程限制

- **Trigger:** 用户要求取消某个流程的轮次、次数、预算或上限。
  - **Rule:** 保留流程本身，只移除被点名的限制；除非用户明确说停止或取消整个流程，否则不得把限制变更解释成终止任务。
  - **Why:** “取消循环次数上限”改变的是终止策略，不是取消循环本身。

## 2026-07-17 按 symlink 目标所有权清理旧的全局 skill 链接

- **Trigger:** 将共享 skills 从逐项全局 symlink 迁移到单一 plugin，并且旧安装可能包含已从当前发行版删除的 skill。
  - **Rule:** 迁移清理应扫描 legacy 目录的实际顶层条目，而不是只枚举当前 skill 清单；仅删除 lexical target 或 resolved target 位于当前包 canonical `skills/` 树内的 symlink。broken link 用 lexical target 判定，普通条目和外部 symlink 必须保留；真实清理只能在替代安装成功后执行，dry-run 只报告。
  - **Why:** 当前清单无法发现已删除 skill 留下的 stale link；按目标所有权判断既能清干净旧副本，又不会把同名用户数据或第三方链接误删。

## 2026-07-16 将项目专用流程与全局可分发技能分开

- **Trigger:** 用户纠正 `integrate-third-skills` 只应在 CSL Agent Kit 项目内被发现。
  - **Rule:** 当用户将某项技能明确限定为项目专用时，将它放入受版本控制的 `.agents/skills/<技能名>/`，并从共享 `skills/`、全局安装枚举和跨平台命令发现中移除；同时检查项目本地链接机制不会重新把它暴露出去。若某个安装器选项仅为这种链接机制存在，应直接移除该选项，而不是保留它来生成共享技能链接。
  - **Why:** 仅靠描述或安装建议不能阻止全局发现；目录位置和发现器边界必须一致。

## 2026-07-16 将“清空”和“选择整合”视为两个独立阶段

- **Trigger:** 用户要求清空 `~/.agents/skills` 后列出上游技能，随后纠正我不应自动重装推荐集合。
  - **Rule:** 当用户要求清空目标目录、再从候选列表选择未来整合项时，清理完成后的目录必须保持为空；只列出候选并等待明确选择，不能把推荐清单当作安装授权。
  - **Why:** 清理的最终状态和后续整合选择是两个独立决策；自动重装会违背“清空全部”的字面结果。

## 2026-07-15 Prefer Explicit Style Rules Over a Code-Only Sample

- **Trigger:** 用户指出纯 `swift.swift` 样例无法完整表达应遵循的 Swift 风格限制。
  - **Rule:** 当语言参考的用途是约束 agent 的代码组织行为时，参考文件只保留按主题分组的具体规则；只有文字无法清楚表达字面语法或布局时，才在对应规则下加入最小代码块。触发条件、适用边界、使用顺序、例外处理与完成检查放在主 SOP。
  - **Why:** 代码样例无法完整表达规则，而不加选择地堆叠样例会降低可读性并让参考文件重新变成代码模板。

## 2026-07-14 Preserve Confirmed Tip Text When Limits Change

- **Trigger:** 迁移被 120 字符上限阻止后，用户要求将限制放宽到 150，而不是缩短 130 字符的原 tip。
  - **Rule:** 当可配置的校验限制阻碍已确认用户内容时，先明确确认用户要调整限制还是改写内容；若用户选择调整限制，只更新该限制、对应边界测试和说明后再迁移。
  - **Why:** 不得把用户已确认的持续指令静默缩短、改写或丢失。

## 2026-07-14 Match Persistent Tips By Prompt Relevance

- **Trigger:** 用户指出把整份 tips 注入上下文会造成重复，并要求每条 tip 带关键词、仅在 prompt 匹配时注入。
  - **Rule:** 当持续指令只在特定任务中适用时，不要把整份文件作为通用 session context；存储显式关键词，并以当前 prompt 选择候选 tip。
  - **Why:** session 级全量注入既会携带无关规则，也不能解决同一线程中反复注入导致的历史重复。

## 2026-07-14 Separate Product, Plugin, And Marketplace Names

- **Trigger:** 为同一个 agent toolkit 设计项目名、plugin 名和 marketplace 名，尤其是平台 identity 使用 `<plugin>@<marketplace>` 时。
  - **Rule:** 不要机械地把完整产品名复制到两个 identity 槽位；分别选择清楚且稳定的 plugin 与 marketplace 名，并先展示最终组合给用户确认。当前 Codex 使用 `csl-agent-kit@csl-agent-market`。
  - **Why:** `csl-agent-kit@csl-agent-kit` 重复且冗长；将产品和分发来源分开命名更容易理解，也避免大小写 alias 迁移问题。

## 2026-07-13 Remove Handoff Skills When Existing State Files Cover Continuity

- **Trigger:** handoff-save/restore 主要复制 `tasks/tasks/` 中的任务进度和 `tasks/context.md` 的稳定事实，剩余会话状态没有明确独立价值时。
  - **Rule:** 先问这两个 skill 是否还需要存在；如果 todo/context 已能可靠恢复工作，优先删除 handoff skills，而不是继续压缩模板或引入线程、归档和生命周期机制。
  - **Why:** 为很少出现的“思考前沿”维护额外命令、文件格式、存储目录和恢复协议，会制造重复 source of truth 与不必要的认知负担。

## 2026-07-13 Keep Handoff State Distinct From Todo Progress

- **Trigger:** 设计跨会话 handoff，并且 handoff 模板包含 Done、In Progress、Task Scope 或 acceptance criteria 时。
  - **Rule:** 不要在 handoff 中复制所属 `tasks/tasks/<task-slug>.md` 的计划和完成状态；handoff 只引用任务文件，并保存它无法表达的会话边界信息，例如当前思考前沿、下一步切入点、临时假设和恢复所需导航。
  - **Why:** 同一进度维护两个副本会立即产生漂移，让新会话无法判断哪一个才是 source of truth。

## 2026-07-13 Separate Todo Planning From Plan Mode And Subagents

- **Trigger:** 精简默认 agent 原则但仍要求任务计划时。
  - **Rule:** 保留在所属 `tasks/tasks/<task-slug>.md` 中写可检查计划的要求，不要因此强制进入 plan mode 或调用 subagent；后两者由 agent 按实际需要自行决定。
  - **Why:** todo 是持久化任务控制和验证记录，plan mode 与 subagent 是可选执行能力，三者不应绑定。

## 2026-07-13 Distinguish Agent-Specific And Parent AGENTS Files

- **Trigger:** 判断当前 agent 使用哪份全局 `AGENTS.md`，或决定默认规则模板的更新范围时。
  - **Rule:** 同时检查 harness 实际注入的规则来源和 `~/.agents/AGENTS.md`；不要把 `~/AGENTS.md` 自动等同于 agent-specific 全局配置。当前 `~/.agents/AGENTS.md` 软链接到 super-agent 的默认模板，而 Pi 本会话另行加载了 `~/AGENTS.md`。
  - **Why:** 不同 agent 客户端可能从不同位置加载规则，仅检查 home 根目录会错误判断模板更新是否能对目标客户端生效。

## 2026-07-13 Keep Workspace Context Conversation-Derived

- **Trigger:** 设计跨会话工作区上下文记录机制时。
  - **Rule:** 使用 `tasks/context.md`，默认保持为空；只沉淀对话中确认的、可供后续 agent 复用的工作区事实，不要默认生成仓库结构地图或改用根目录 `CONTEXT.md`。
  - **Why:** 工作区上下文来自持续协作中形成的认知，职责不同于一次性的 repo-map，也不同于任务进度和纠错经验。

## 2026-07-10 Keep Caveman And Ponytail Responsibilities Distinct

- **Trigger:** 比较、配置或推荐 Caveman 与 Ponytail 时。
  - **Rule:** Caveman 用于压缩回答中的冗词和填充表达；Ponytail 用于让代码输出简洁、清晰并避免过度实现。不要因为两者都强调精简就把它们视为重复插件或建议二选一。
  - **Why:** 两者作用对象不同：一个约束自然语言回答风格，一个约束代码设计与实现规模；同时保留可以形成互补。

## 2026-07-10 Avoid One-Off Skill Interface Folders

- **Trigger:** 某个 skill 单独包含 `agents/` 接口元数据，但项目中的其他 skills 不采用该结构，且运行时和打包配置都不依赖它。
  - **Rule:** 先检查引用和运行依赖；没有实际用途时删除这个一次性目录，不要为了形式完整保留孤立元数据。
  - **Why:** 单个 skill 的特殊目录会制造错误的项目约定，并增加维护和审计噪声。

## 2026-07-10 Separate Tips Capture From Tips Compliance

- **Trigger:** 用户要求让 tips 更积极或更主动时。
  - **Rule:** 先区分用户是在要求更主动地发现/保存新 tip，还是要求更稳定地遵守已注入的 tip；不要默认把“积极”解释为主动保存。
  - **Why:** tips 写入必须始终经过明确确认，但已确认并注入的 tips 可以具有更强的默认遵循语义，这是两个独立的设计维度。

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

## 2026-07-09 Task Files Newest First

- **Trigger:** Adding a new entry to `tasks/tasks.md` or `tasks/lessons.md`.
  - **Rule:** Insert the newest entry at the top of the file, directly under the title, instead of appending to the bottom.
  - **Why:** Newest-first ordering makes active tasks and recent corrections easier to find and read.

## 2026-06-18 SOP Lessons Scope

- **Trigger:** 用户说 SOP 用来记录标准操作和容易犯错行为，不是在问当前仓库 `tasks/lessons.md`。
  - **Rule:** 把可跨项目复用的错误模式设计为 `sop-manager learn`，写入相关 `~/.csl-agent-kit/sops/*.md` 或内置 SOP 的 companion lesson SOP。
  - **Why:** 只回答当前项目 lesson 文件会错过用户要的跨项目、跨 agent 复用目标。

## 2026-06-25 User-Defined SOP Ownership

- **Trigger:** 用户要求扩展动态用户 SOP，或已有 `~/.csl-agent-kit/sops/{name}.md` 且没有明确要求发布为插件内置 SOP。
  - **Rule:** 不要把用户 SOP 复制到 `skills/sop-manager/sops/`；内置目录只放通用路由或确认为插件自带的 SOP，具体可变流程留在 `~/.csl-agent-kit/sops/`。
  - **Why:** 内置副本会让用户看不清 SOP 的真实来源，也会让动态用户 SOP 的更新和分发边界变复杂。

## 2026-06-25 Repo Map Glossary

- **Trigger:** 设计 repo-map、项目探索、陌生仓库分析或任何需要用户和 agent 对项目概念保持一致的流程。
  - **Rule:** repo-map 不能只列目录、入口和关键类型；必须产出基础 glossary，解释业务术语、代码术语、相近概念区别和证据来源。
  - **Why:** 仅有结构地图不能防止用户和 agent 对同一类、类型或业务词产生理解偏差，后续实现容易找错逻辑或误用概念。

## 2026-06-25 Repo Root Detection

- **Trigger:** 工作目录可能只是包含多个项目的文件夹，而不是单个 git repo。
  - **Rule:** repo-map 和项目分析前先用 git 判断 root；如果当前目录不是 git repo 但子目录是 git repo，必须按子 repo 分开分析，不要合并成一个项目。
  - **Why:** 把多个独立项目混成一个 glossary/map 会污染术语和关键类型判断，导致 agent 找错代码边界。

## 2026-06-25 Repo Map Project-Specific Formats

- **Trigger:** 为 repo-map 设计示例、模板或保存格式时。
  - **Rule:** 不要把 web/backend 的结构当作默认格式；先识别项目类型，并只在 web、backend、iOS/macOS/apple development、Android 四类格式中选择。
  - **Why:** 不同项目的关键概念不同。Apple 项目需要 app targets、Swift modules、entry scene、navigation、view models、state、persistence、XCTest；Android 项目需要 Gradle modules、Activity、navigation graph、ViewModel、Compose/XML UI、repository、storage、instrumentation tests。

## 2026-06-25 Repo Map Deep Concepts Only

- **Trigger:** 设计 repo-map 输出或示例内容时。
  - **Rule:** 不要输出一眼就能看出的项目名、语言、框架等 inventory；只输出通过文件结构、CodeGraph、调用关系和代码阅读确认的组件职责、模块边界、关键类型职责和客观流程。
  - **Why:** repo-map 的价值是帮助 agent 快速理解项目结构和核心职责，不是重复项目元数据或解释实现细节。

## 2026-06-26 Repo Map No Question List

- **Trigger:** 设计 repo-map 示例或保存格式时。
  - **Rule:** 不要包含默认问题清单 section；repo-map 应给 agent 足够概念地图来继续工作，而不是在示例格式里默认追加问题清单。
  - **Why:** 默认问题清单会把输出从行动地图拉回分析报告，增加噪声。

## 2026-06-26 Repo Map Component Summary

- **Trigger:** 生成 repo-map、repo-map 示例或保存格式时。
  - **Rule:** 在 glossary 之前必须给出一段简洁的 component summary，说明这个组件/项目区域面向用户或业务到底做什么；不要只从核心术语开始。
  - **Why:** 没有组件摘要时，agent 可能知道类型关系，却不知道整体组件的产品职责，后续容易在错误业务边界里理解代码。

## 2026-06-26 Repo Map Objective Structure

- **Trigger:** 生成 repo-map、repo-map 示例或保存格式时。
  - **Rule:** repo-map 只提供客观项目信息：组件职责、目录/模块结构、模块位置、关键类型及其主要职责、从代码确认的主要流程；不要包含 risks、confidence、relevance filter、change targets、why it matters、open questions 或主观建议。
  - **Why:** repo-map 是结构地图，不是项目审计。动态变化的风险和建议会污染 agent 对项目的客观理解。

## 2026-06-28 Tips Naming

- **Trigger:** 设计用于保存短命令、用户偏好、轻量提醒或 session-start 注入内容的 skill。
  - **Rule:** 不要命名为 rules/rulekeeper/remember；优先使用 tips 语义，并把用户数据放到 `~/.csl-agent-kit/` 下。
  - **Why:** Claude Code 已有 rule 概念；混用 rules 会让短偏好、流程 SOP 和平台规则边界变乱。

## 2026-06-28 Tips Length

- **Trigger:** 设计或修改 tips 写入逻辑时。
  - **Rule:** tips 只接收短句；写入脚本必须在保存前拒绝过长内容。
  - **Why:** 长内容通常是 SOP、项目规范或文档片段，注入到每个 session 会制造噪声。

## 2026-06-28 Tips Confirmation

- **Trigger:** 用户要求 agent 添加 tip、保存偏好或记录短命令时。
  - **Rule:** 永远不要自动写 tips；必须先展示将保存的完整 tip，等用户明确确认后再写入。
  - **Why:** tips 会在每个 session 注入，未经确认写入会长期污染上下文。

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

## 2026-07-08 SOP Example Agent Behavior Focus

- **Trigger:** 设计或修改 agent 使用的 SOP 示例文件时。
  - **Rule:** SOP 示例应重点描述 agent 行为规则、确认点、异常处理和完成标准；不要默认加入修订记录、产品操作手册式步骤或过重的治理章节。
  - **Why:** 这个项目的 SOP 用来指导 agent 行为，不是给产品/运维团队归档审批流程。

## 2026-07-08 SOP Completion Checklist

- **Trigger:** 设计或修改 SOP 的完成标准 section 时。
  - **Rule:** 完成标准应写成 checkbox checklist。
  - **Why:** SOP 用来指导 agent 执行，checklist 比普通 bullet 更容易逐项验证。

## 2026-07-08 SOP No Lessons Section

- **Trigger:** 设计或修改 agent 使用的 SOP 文件时。
  - **Rule:** 不要添加单独的 `Lessons` section 或 companion lessons SOP；如果有可复用经验需要沉淀，直接更新对应 SOP 的范围、规则、流程、异常处理或完成标准。
  - **Why:** SOP 本身就是指导 agent 行为的源文件，单独累积经验规则会让规则分散。

## 2026-07-03 AGENTS Language Exception

- **Trigger:** 修改 `AGENTS.md` 时，即使全局语言协议要求文档和 prose 使用中文。
  - **Rule:** `AGENTS.md` 文件内容必须使用英文；如果语言协议要求中文 prose，必须显式保留 `AGENTS.md` 的英文例外。
  - **Why:** `AGENTS.md` 是 agent 规则文件，用户明确要求它保持英文；把新增规则翻译成中文会破坏该文件的一致性和可复用性。

## 2026-07-07 Todo Lessons Compliance

- **Trigger:** 优化 agent rule、AGENTS、CLAUDE 或项目执行规则时。
  - **Rule:** 不要把 `tasks/tasks.md`、`tasks/tasks/<task-slug>.md` 和 `tasks/lessons.md` 规则弱化为可选建议；它们是用户确认有价值且必须遵守的执行机制。
  - **Why:** todo 负责把多步骤工作变成可验证进度，lessons 负责把用户纠正沉淀成可复用规则；弱化它们会让同类错误重复出现。

## 2026-07-08 AGENTS Template No Local Include

- **Trigger:** 修改 `AGENTS.md` 或 agent template 文件时。
  - **Rule:** 不要在可注入的 AGENTS template/example 中保留 `@/Users/...` 这类用户本机绝对路径 include；本地 `/Users/caishilin/.codex/AGENTS.md` 可以保留用户本机工具 include。
  - **Why:** AGENTS 模板会被注入到其它项目，本机绝对路径 include 不可移植；但用户自己的本地 AGENTS 可以包含本机专用工具规则。
