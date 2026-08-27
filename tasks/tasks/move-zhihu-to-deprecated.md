# 将知乎 Skill 移入 deprecated 目录

Status: Completed (2026-08-26 17:12)
Kind: Task

## Scope

- 包含：移动完整 `zhihu` Skill，并同步当前发现、安装与路径消费者。
- 不包含：修改 Skill 功能、删除 Skill 内容或改写历史任务记录。

## Target
- [x] T1: zhihu Skill 已完整移入项目约定的 deprecated 目录，并且不再作为活跃 Skill 被发现

## Plan

1. 确认活跃目录、弃用目录及全部当前消费者。
2. 移动 Skill，并仅更新受影响的当前消费者。
3. 验证 Skill 完整性、发现边界与路径引用。

## Result

- T1: 已将 12 个文件从 ~/.pi/agent/skills/zhihu 移至 deprecated/zhihu；移动前后 SHA-256 清单一致，活跃 Skill 根目录扫描结果为 0 个 zhihu。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: pi-skill-commands 5 项测试通过；npm pack dry-run 未包含 deprecated/；旧路径不存在且归档副本完整。
