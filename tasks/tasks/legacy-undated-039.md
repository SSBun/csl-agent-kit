# 清理废弃 Agent Skills

## 计划

- [x] 删除 4 个上游明确 deprecated 的技能目录。
- [x] 删除 4 个已重命名或移除的旧技能目录。
- [x] 从 `~/.agents/.skill-lock.json` 删除对应安装记录。
- [x] 验证目录、锁文件和当前有效替代技能，记录复核结果。

## 复核

- 已删除 `design-an-interface`、`qa`、`request-refactor-plan`、`ubiquitous-language`、`diagnose`、`to-issues`、`to-prd` 和 `zoom-out`。
- `~/.agents/.skill-lock.json` 可正常解析，8 个对应键和所有指向 `deprecated/` 的记录均已清除。
- 逐项验证 8 个目录均不存在；有效替代技能 `diagnosing-bugs`、`to-spec`、`to-tickets` 仍存在。
- local quality gate 安装一致性审计通过：42 条锁记录均有安装目录，35 个 `mattpocock/skills` 记录均指向当前上游文件，deprecated 与 stale 路径均为 0。
- 未改动 `~/Desktop/test/skills` 上游参考仓库，也未清理 `~/.claude/skills` 等未授权目录。
