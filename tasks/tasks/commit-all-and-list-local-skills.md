# 提交全部本地改动并列出仓库 Skills

Status: In Progress (2026-08-21 14:56)
Kind: Task

## Scope

- 提交当前工作树中的全部既有改动，不重写交付内容；按清晰关注点组织本地 commit，不推送远端。
- Skill 清单以 `skills/` 与 `.agents/skills/` 下现场发现的叶子 `SKILL.md` 为准，并区分共享与项目专用来源。

## Target

- [ ] T1: 当前仓库现有 tracked 与 untracked 改动全部进入本地 Git commit，最终工作树干净。
- [ ] T2: 提交完成后完整列出当前仓库 skills/ 与 .agents/skills/ 下可发现的 Skill。

## Plan

1. 核对现有改动、验证状态与关注点边界，不改写已完成交付。
2. 按关注点提交实现、文档、验证入口与持久项目资料。
3. 完成并提交剩余任务记录，确认工作树干净后现场枚举全部叶子 Skill。
