# 纠正全局技能清理范围

## 计划

- [x] 确认用户要的是清空后的空目录，而不是按推荐清单重装。
- [x] 删除 `~/.agents/skills` 的全部剩余条目，并清空对应技能锁记录。
- [x] 从 Matt Pocock 上游列出全部可选技能；不执行任何整合或重装。

## 复核

- 上一轮错误地将“选择常用技能”理解成可立即重装；本轮以空目录为完成标准，整合清单须等待用户明确选择。
- `~/.agents/skills` 已为空，`~/.agents/.skill-lock.json` 的 `skills` 映射也为空；没有保留或重装任何技能。
- `npx skills@latest add mattpocock/skills --list --full-depth` 从上游发现 40 个技能；本轮仅列出它们，不执行 CSL Agent Kit 整合。
