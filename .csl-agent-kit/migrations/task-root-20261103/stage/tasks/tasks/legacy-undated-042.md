# 诊断重复 Hook 执行

## 计划

- [x] 确认当前客户端实际加载的 CSL plugin/hook 来源及重复注册路径。
- [x] 对照两个 hook manifests、安装 symlink 和客户端配置复现重复数量。
- [x] 给出根因与最小修复；未经确认不删除用户安装配置。

## 复核

- 根因不是单个 manifest 内重复，而是 Codex 同时启用了 `csl@CSL` 和 `csl@csl`；两个 marketplace 名称仅大小写不同，且都指向 `/Users/caishilin/Desktop/personal/skills`。
- `/Users/caishilin/.codex/config.toml` 同时包含 `[marketplaces.CSL]`、`[marketplaces.csl]`、`[plugins."csl@CSL"]`、`[plugins."csl@csl"]`，hook trust state 也分别记录了两套相同 hash，因此 CSL 的 SessionStart 和 UserPromptSubmit hooks 各运行两次。
- 当前 manifest 和 `codex plugin list` 的 canonical identity 是小写 `csl@csl`；最小修复是删除 legacy uppercase `CSL` marketplace/plugin/state，保留 lowercase 注册。
- 该重复由 installer 的升级迁移遗漏造成：v2.0.0 将 marketplace 从 `CSL` 改为 `csl`，但 `installCodexPlugin()` 只删除 `csl@csl`，没有清理旧的 `csl@CSL` marketplace/plugin/state；旧安装在升级重装后变为双注册。
- 后续用户确认采用 `csl-agent-kit@csl-agent-market`；本机旧配置已清理，installer 也已加入迁移步骤。
