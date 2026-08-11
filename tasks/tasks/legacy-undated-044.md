# 删除全部 Handoff 机制

## 计划

- [x] 删除仓库中的 handoff-save、handoff-restore 及所有当前产品声明。
- [x] 删除独立安装的 Pi handoff skill 和 `~/.agents/handoffs/` 用户数据。
- [x] 验证各平台 manifest、Pi 命令发现、npm pack、全量测试和残留引用。
- [x] 运行所需 Yao skill 审计并记录已知非阻塞缺口。

## 复核

- 删除了仓库中的 handoff-save、handoff-restore 和格式模板，并清理 README、六个 plugin/marketplace manifest 与当前 skill 文案中的产品引用；CHANGELOG 已记录到 `[Unreleased]`。
- 删除了 `~/.agents/skills/handoff-save`、`~/.agents/skills/handoff-restore`、第三方 `~/.agents/skills/handoff`、Pi handoff symlink 和 `~/.agents/handoffs/` 内全部用户数据。
- `npm run check` 通过 26 个测试；Claude manifest 与 15 个实际 skill 目录完全一致，npm pack 不含 handoff skills，Pi RPC 的 61 个命令中无 handoff 命令。
- JSON、hook parity、残留路径和 `git diff --check` 验证通过；brainstorming 与 tips quick validation 通过。Yao lint、governance、resource boundary 通过，聚合结果仅保留仓库统一的 `Missing agents/interface.yaml` 约定缺口。
