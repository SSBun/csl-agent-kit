# 统一 Codex Plugin Identity

## 计划

- [x] 将 Codex marketplace/plugin identity 改为 `csl-agent-kit@csl-agent-market`，不改 Claude、Cursor 或独立 skill 名称。
- [x] 修正 installer 的迁移流程和最小回归测试，清理 `csl@CSL`、`csl@csl` 旧注册。
- [x] 运行全量检查，迁移本机 Codex 配置并验证 hooks 只注册一次。
- [x] 更新复核；本轮未收到 commit/push 请求，因此保留仓库改动未提交。

## 复核

- `.agents/plugins/marketplace.json` 现使用 marketplace `csl-agent-market` 和 plugin `csl-agent-kit`；`.codex-plugin/plugin.json` 与之对齐。
- Installer 会先移除新 identity 以支持幂等重装，再清理 `csl@CSL`、`csl@csl` 及旧 marketplaces，最后安装 `csl-agent-kit@csl-agent-market`；新增 CLI regression test 固定该命令序列。
- 本机 `/Users/caishilin/.codex/config.toml` 和旧 cache 已清理；`codex plugin list` 只显示一个启用项 `csl-agent-kit@csl-agent-market`，连续运行 installer 两次仍保持单一注册。
- `npm run check` 共通过 27 项测试（CLI 7、tips 13、Pi 7）；manifest contract、hook parity、npm pack 和 `git diff --check` 通过。
- Yao audit 不适用：本轮未修改 agent rule、skill、SOP 或 hook 定义，只修改 Codex distribution identity、installer、文档和测试。
