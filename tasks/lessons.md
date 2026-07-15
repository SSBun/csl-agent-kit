# Lessons

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

- **Trigger:** handoff-save/restore 主要复制 `tasks/todo.md` 的进度和 `tasks/context.md` 的稳定事实，剩余会话状态没有明确独立价值时。
  - **Rule:** 先问这两个 skill 是否还需要存在；如果 todo/context 已能可靠恢复工作，优先删除 handoff skills，而不是继续压缩模板或引入线程、归档和生命周期机制。
  - **Why:** 为很少出现的“思考前沿”维护额外命令、文件格式、存储目录和恢复协议，会制造重复 source of truth 与不必要的认知负担。

## 2026-07-13 Keep Handoff State Distinct From Todo Progress

- **Trigger:** 设计跨会话 handoff，并且 handoff 模板包含 Done、In Progress、Task Scope 或 acceptance criteria 时。
  - **Rule:** 不要在 handoff 中复制 `tasks/todo.md` 的计划和完成状态；handoff 只引用 todo 路径，并保存 todo 无法表达的会话边界信息，例如当前思考前沿、下一步切入点、临时假设和恢复所需导航。
  - **Why:** 同一进度维护两个副本会立即产生漂移，让新会话无法判断哪一个才是 source of truth。

## 2026-07-13 Separate Todo Planning From Plan Mode And Subagents

- **Trigger:** 精简默认 agent 原则但仍要求任务计划时。
  - **Rule:** 保留在 `tasks/todo.md` 中写可检查计划的要求，不要因此强制进入 plan mode 或调用 subagent；后两者由 agent 按实际需要自行决定。
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

- **Trigger:** Adding a new entry to `tasks/todo.md` or `tasks/lessons.md`.
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
  - **Rule:** 不要把 `tasks/todo.md` 和 `tasks/lessons.md` 规则弱化为可选建议；它们是用户确认有价值且必须遵守的执行机制。
  - **Why:** todo 负责把多步骤工作变成可验证进度，lessons 负责把用户纠正沉淀成可复用规则；弱化它们会让同类错误重复出现。

## 2026-07-08 AGENTS Template No Local Include

- **Trigger:** 修改 `AGENTS.md` 或 agent template 文件时。
  - **Rule:** 不要在可注入的 AGENTS template/example 中保留 `@/Users/...` 这类用户本机绝对路径 include；本地 `/Users/caishilin/.codex/AGENTS.md` 可以保留用户本机工具 include。
  - **Why:** AGENTS 模板会被注入到其它项目，本机绝对路径 include 不可移植；但用户自己的本地 AGENTS 可以包含本机专用工具规则。
