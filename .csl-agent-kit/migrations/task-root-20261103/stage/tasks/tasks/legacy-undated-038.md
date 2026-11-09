# 移除 Tips 的逐轮注入

## 计划

- [x] 确认范围：仅移除 tips 的 `UserPromptSubmit` hook，保留该事件下的 SOP candidates。
- [x] 检查 hook manifests、doctor 诊断、相关测试、工作区状态和近期提交。
- [x] 写入并复核最小设计规格，等待用户确认书面规格。
- [x] 按 TDD 先更新契约测试并验证预期失败，再修改两个 hook manifests 与 doctor。
- [x] 运行聚焦测试、全量检查、hook parity、安装包检查和 local quality gate 审计。
- [x] 更新复核并确认不影响 `SessionStart`、`PostCompact`、Pi `before_agent_start` 与 SOP candidates。

## 复核

- 两个 hook manifests 的 `UserPromptSubmit` 已删除 `tips-inject.sh`，仍保留 `sop-candidates.js`；`SessionStart` 与 `PostCompact` 的 tips hooks 未变。
- 新增 manifest 契约测试，先确认 RED（`true !== false`），完成最小修改后 14 个 tips tests 全部通过；Pi 的 7 个 tests 继续通过。
- `env -u NO_COLOR npm run check` 通过 28 个 tests 和 install dry-run；原始环境因外部 `NO_COLOR=1` 与“默认彩色”测试冲突而失败，未修改无关 CLI 行为。
- JSON、Bash、hook parity、残留 lifecycle 契约、npm pack 与 `git diff --check` 通过；发布包保留两个 manifests、tips skill/doctor 和 Pi context extension。
- local quality gate lint、governance 与 resource boundary 通过；聚合验证仅保留仓库既有的 `Missing agents/interface.yaml`，且 tips 仍没有可选的 `manifest.json` 治理元数据。
- 已重装本机 `csl-agent-kit@csl-agent-market` local plugin；cache 验证 `tips=false`、`sop=true`。SOP hook 索引变化后需在新会话通过 `/hooks` 复核 trust。
