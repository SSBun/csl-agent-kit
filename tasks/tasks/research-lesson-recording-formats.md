# 研究 Lesson 记录的权威格式

Status: Completed (2026-08-20 19:04)
Kind: Task

## Scope

- 包含：澄清 Lesson 的用途，比较权威记录方法，并提出适合当前 workspace workflow 的推荐格式。
- 排除：未经用户另行批准，修改 `tasks/lessons.md`、`workspace-lessons` skill 或相关实现。

## Target
- [x] T1: 形成一份基于权威来源的 Lesson 记录方法对比，并给出适合本项目的推荐格式与取舍

## Decisions

- 本次 Lesson 专指防止 Agent 重犯错误的可执行规则；不把项目复盘记录或个人学习笔记作为目标格式。
- Lesson 的首要成功标准是改变后续行为并防止同类错误再次发生；仅记录事件或总结认知不算完成学习闭环。
- 采用最小运行时格式 `Trigger / Rule / Check`，不增加 `Cause`、`Evidence` 或完整 CAPA/ODCR 字段；通过收紧三个字段的语义和质量门槛保证防错效果。
- `Check` 证明最可能阻止复发的控制已覆盖相关范围，不承诺错误永不再发；再次复发时应更新或替换无效的 Rule 或 Check。
- 匹配当前任务的 Lesson 若其 `Check` 未通过或无法观察，必须阻止任务完成，避免把 Lesson 降级为可选建议。
- 防复发优先采用 source、schema、test、CI 或强制 workflow 等机械控制；Lesson 只承载仍需 Agent 语义判断的最后一公里行为控制。

## Plan

1. 确认本次所说 Lesson 的核心用途与成功标准。
2. 调研 2–3 类权威的一手方法，并提取其最小记录结构。
3. 对照当前 `Trigger`、`Rule`、`Check` schema 分析适配性与缺口。
4. 给出推荐格式、采用理由和明确不采用的复杂度。

## Result

- T1: 已比较 NATO ODCR、NASA Lessons Learned Lifecycle、FDA/MDSAP CAPA、Google SRE postmortem、implementation intentions 与 NIOSH 控制层级；用户逐项确认最小 Trigger/Rule/Check 格式、Check 完成门禁和机械控制优先原则。
- Review gate: Skipped — 用户未要求 adversarial review、双 Agent Reviewer–Editor 循环或独立 Reviewer 批准。

## Verification

- Passed: 已核对权威一手资料与当前 workspace-lessons 契约，推荐格式及关键取舍均经用户分段确认；本任务仅研究设计，未运行测试。
