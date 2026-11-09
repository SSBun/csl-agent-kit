# 退役 release skill

Status: Completed (2026-08-28 11:16)
Kind: Task

## Scope

- 包含：移动完整 release Skill，清理当前发现、分发、文档与 Context 消费者。
- 不包含：删除或修改具体 release SOP，以及改写历史任务记录。

## Target
- [x] T1: release skill 不再作为活跃 skill 被发现或分发。
- [x] T2: release skill 作为 deprecated skill 保留在仓库中。

## Plan

1. 确认 release Skill、deprecated 边界及全部当前消费者。
2. 移动 Skill，并仅清理受影响的活跃消费者。
3. 同步 Context，验证归档完整性与活跃发现边界。

## Result

- T1: 活跃目录已不存在；Claude manifest 的 24 个 skill 路径全部有效且不含 release；README 入口已移除；npm pack dry-run 的 155 个文件不含 deprecated/release。
- T2: deprecated/release/SKILL.md 已存在，并与移动前 skills/dev/release/SKILL.md 的 SHA-256 及 HEAD 内容逐字节一致。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: skill-quality 1/1 通过；Context 校验有效；manifest 路径、旧活跃引用、npm 包边界与 git diff whitespace 检查均通过。
