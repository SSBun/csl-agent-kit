# Lessons

## 2026-06-18 SOP Lessons Scope

- **Trigger:** 用户说 SOP 用来记录标准操作和容易犯错行为，不是在问当前仓库 `tasks/lessons.md`。
  - **Rule:** 把可跨项目复用的错误模式设计为 `sop-manager learn`，写入相关 `~/.ssbun-skills/sops/*.md` 或内置 SOP 的 companion lesson SOP。
  - **Why:** 只回答当前项目 lesson 文件会错过用户要的跨项目、跨 agent 复用目标。

## 2026-06-25 User-Defined SOP Ownership

- **Trigger:** 用户要求扩展动态用户 SOP，或已有 `~/.ssbun-skills/sops/{name}.md` 且没有明确要求发布为插件内置 SOP。
  - **Rule:** 不要把用户 SOP 复制到 `skills/sop-manager/sops/`；内置目录只放通用路由或确认为插件自带的 SOP，具体可变流程留在 `~/.ssbun-skills/sops/`。
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
  - **Rule:** 不要命名为 rules/rulekeeper/remember；优先使用 tips 语义，并把用户数据放到 `~/.ssbun-skills/` 下。
  - **Why:** Claude Code 已有 rule 概念；混用 rules 会让短偏好、流程 SOP 和平台规则边界变乱。

## 2026-06-28 Tips Length

- **Trigger:** 设计或修改 tips 写入逻辑时。
  - **Rule:** tips 只接收短句；写入脚本必须在保存前拒绝过长内容。
  - **Why:** 长内容通常是 SOP、项目规范或文档片段，注入到每个 session 会制造噪声。

## 2026-06-28 Tips Confirmation

- **Trigger:** 用户要求 agent 添加 tip、保存偏好或记录短命令时。
  - **Rule:** 永远不要自动写 tips；必须先展示将保存的完整 tip，等用户明确确认后再写入。
  - **Why:** tips 会在每个 session 注入，未经确认写入会长期污染上下文。

## 2026-06-28 SSBun Local Data Boundary

- **Trigger:** 修改安装脚本、hooks 或任何 `~/.ssbun-skills` 路径时。
  - **Rule:** `~/.ssbun-skills` 只保存用户经验数据，例如 `sops/` 和 `tips/`；不要把 repository mirror 或 skill 代码 symlink 放进去。
  - **Why:** 本地经验数据和安装发现路径混在一起会让输出变吵，也会模糊用户数据与仓库源码的边界。

## 2026-06-28 SOP Create Language Scope

- **Trigger:** 用户要求调整 SOP create 的语言行为时。
  - **Rule:** 不要把 SOP 文件全文强制为某一种语言；主流程描述可以使用任意语言，只有用户明确要求的字段或模板片段才固定语言。
  - **Why:** 把语言约束扩大到整份 SOP 会错误限制用户的流程描述和团队文档习惯。

## 2026-07-03 AGENTS Language Exception

- **Trigger:** 修改 `AGENTS.md` 时，即使全局语言协议要求文档和 prose 使用中文。
  - **Rule:** `AGENTS.md` 文件内容必须使用英文；如果语言协议要求中文 prose，必须显式保留 `AGENTS.md` 的英文例外。
  - **Why:** `AGENTS.md` 是 agent 规则文件，用户明确要求它保持英文；把新增规则翻译成中文会破坏该文件的一致性和可复用性。
