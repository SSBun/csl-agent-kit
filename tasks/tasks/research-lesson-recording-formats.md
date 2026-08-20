# 研究 Lesson 记录的权威格式

Status: In Progress (2026-08-20 17:05)
Kind: Task

## Scope

- 包含：澄清 Lesson 的用途，比较权威记录方法，并提出适合当前 workspace workflow 的推荐格式。
- 排除：未经用户另行批准，修改 `tasks/lessons.md`、`workspace-lessons` skill 或相关实现。

## Target

- [ ] T1: 形成一份基于权威来源的 Lesson 记录方法对比，并给出适合本项目的推荐格式与取舍

## Decisions

- 本次 Lesson 专指防止 Agent 重犯错误的可执行规则；不把项目复盘记录或个人学习笔记作为目标格式。
- Lesson 的首要成功标准是改变后续行为并防止同类错误再次发生；仅记录事件或总结认知不算完成学习闭环。

## Plan

1. 确认本次所说 Lesson 的核心用途与成功标准。
2. 调研 2–3 类权威的一手方法，并提取其最小记录结构。
3. 对照当前 `Trigger`、`Rule`、`Check` schema 分析适配性与缺口。
4. 给出推荐格式、采用理由和明确不采用的复杂度。
