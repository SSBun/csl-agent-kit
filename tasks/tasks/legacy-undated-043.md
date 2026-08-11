# 复查 Hooks 并提交 Handoff 删除

## 计划

- [x] 枚举 JSON hooks、Pi lifecycle hooks 及其 matcher、脚本和触发时机。
- [x] 验证 hook manifest parity、JSON、脚本可执行性、匹配行为和全量测试。
- [x] 更新任务复核，提交全部当前更改，并确认工作区状态。

## 复核

- JSON hook manifests 完全一致，共 5 类事件、8 个 command hooks：SessionStart、PostCompact、UserPromptSubmit、PreToolUse、PostToolUse。
- Pi context extension 共 5 个 lifecycle hooks：session_start、session_compact、before_agent_start、tool_call、tool_result；Fast Mode extension 共 3 个：session_start、model_select、before_provider_request。
- JSON matcher、Figma/MasterGo matcher、tips/SOP 脚本、tips doctor lifecycle、Pi context tests 和 Fast Mode priority payload smoke test通过；`.git/hooks` 只有未启用的 sample hooks。
- `npm run check` 通过 26 个测试；hook parity、manifest、npm pack、Pi command discovery、Yao audit 与 `git diff --check` 结果保持通过。
- 本轮更改已提交，提交后工作区 clean；本地 `main` 比 `origin/main` 领先 2 个提交，未执行 push。
