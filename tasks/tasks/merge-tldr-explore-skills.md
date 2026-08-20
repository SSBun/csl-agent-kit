# 设计 tldr 与 explore 技能合并方案

Status: Completed (2026-08-20 17:15)
Kind: Plan
Parent: retire-analyze-and-unify-tldr

## Scope

- 包含：设计由 `tldr` skill 吸收全局 `/explore` Prompt Template 能力后的统一入口、深度选择、输出契约与迁移方式。
- 不包含：本规划任务不修改 `tldr` skill 或全局 Prompt Template。

## Target
- [x] T1: `tldr` 使用确定性的请求信号选择简略或深入模式；冲突时询问、无信号时简略，目标类型、规模和复杂度不参与判断。
- [x] T2: 简略模式保持一屏概览，深入模式在会话中生成带来源的详细报告；项目目标使用同一通用契约，持久研究、review、教程、计划与实施保持明确边界。
- [x] T3: 全局 `/explore` Prompt Template 被删除且无 alias，`tldr` 的公开描述、接口元数据、路由 fixtures 和适用非测试验证与统一能力一致。

## Decisions

- `tldr` 是合并后的 canonical 名称。
- 合并目标同时是减少可见命令数量，并让同一入口按用户意图选择简略或深入输出。
- 当前 `/explore` 来自 Pi 全局 Prompt Template，而不是仓库 skill。
- 模式选择只使用可观察请求信号：`TL;DR`、brief、quick、concise、one-screen、high-level 及对应中文表达属于简略信号；explore、deep、in-depth、detailed、comprehensive、thorough、full report、analyze 及对应中文表达属于深入信号。
- 用户即使未使用深入词，只要同时要求核心事实、工作机制、领域背景、限制/开放问题和完整来源中的至少三项，也进入深入模式。
- 简略与深入信号同时出现时询问一个选择问题；没有任何信号时使用简略模式。目标类型、规模、长度、复杂度及 Agent 主观判断不得改变模式。
- 统一工作流按目标解析、深度判断、信息获取和输出生成推进；简略与深入模式共享来源核实、冲突披露和失败处理。
- `tldr` 负责在会话中简略或深入理解一个目标，包括 Git 项目或组件；要求后台调研并写入仓库 Markdown 时路由到 `research`，review、教程、实施计划与修复保持现有边界。
- 项目目标只使用 `tldr` 的通用模式，不继承已决定退役的 `analyze-project` 所拥有的持久报告、证据锚点、Mermaid 或安全发布协议。
- 合并实施后删除全局 `/explore` Prompt Template，不保留别名。
- 简略模式保持 `**TL;DR:**` 加最多约五个必要要点的一屏输出，并只做最少必要检索。
- 深入模式以 `**TL;DR:**` 开始，并按适用性覆盖 Key facts、How it works / Structure、Context、Open questions / Limitations 和 Sources；正文部分仅在确实不适用时省略，Sources 必须保留。
- 深入模式对 URL 先读取原文，对主题优先权威一手来源，明确区分事实、推断与来源冲突；深度服从目标而非无限或穷尽式扫描。
- 两种模式都默认在会话中输出，不自动写文件，也不追加惯例性的帮助邀请。

## Plan

1. 更新 `tldr` 的 description 与主契约，按已确认信号表执行路由排除、模式选择、信息获取和失败处理。
2. 保留简略输出并加入深入报告契约，使主题、链接、文件、会话和项目目标遵循同一输入模型，而不恢复已退役的专用项目报告协议。
3. 同步 `agents/interface.yaml`、README、trigger fixtures 与 semantic config，覆盖简略、深入、信号冲突、无信号默认及相邻能力边界。
4. 删除全局 `/explore` Prompt Template，不保留 alias，并验证当前 Pi 命令与共享 skill 发现只暴露 `tldr`。
5. 运行路由评测、Yao、resource-boundary、JSON/YAML、英文 skill prose 与 `git diff --check`；除非用户另行明确要求，不运行项目或单元测试套件。

## Result

- T1: The tldr contract now selects mode only from explicit brief/detailed cues or at least 3 of 5 requested report dimensions; conflicts ask one fixed question, no signal defaults brief, and target properties are explicitly excluded.
- T2: Brief output remains one-screen TL;DR plus at most five bullets. Detailed output defines the target first, covers mechanism before limitations, requires Sources, stays in chat, supports generic project targets, and routes durable/background research, repo mapping, review, tutorials, plans, and implementation elsewhere.
- T3: Deleted ~/.pi/agent/prompts/explore.md with no alias; updated tldr SKILL.md, interface metadata, README, trigger fixtures, and semantic config. Direct Pi discovery exposes tldr and no retired alias; routing evaluation passed 30/30.
- Review gate: Skipped — Independent review was not requested.

## Verification

- Passed: Yao validation passed, including resource boundary at 993/1000 tokens; semantic routing evaluation passed with precision/recall 1.0 and no misfires; JSON/YAML parsing, contract assertions, Pi alias discovery, npm pack dry-run, Context validation, and git diff --check passed. Skill prose is English except intentional Chinese cue literals and fixtures. Project/unit tests were not run because the user did not request them.
