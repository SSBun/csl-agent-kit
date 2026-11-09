# 让安装日志实时逐条输出

Status: Completed (2026-08-21 11:09)
Kind: Task

## Scope

- 包含：人类可读安装输出默认实时展示详细进度，并保留最终汇总与退出状态。
- 不包含：JSON 输出结构、安装目标选择与安装动作本身。

## Target
- [x] T1: 人类可读的详细安装模式在每项集成或外部命令执行时逐条输出进度，而不是全部完成后集中显示。
- [x] T2: 实时输出后仍保留最终汇总和准确的成功或失败退出状态。
- [x] T3: JSON 机器可读输出不被人类可读的实时详细日志污染。
- [x] T4: 人类可读安装默认实时逐条输出详细进度，无需显式启用 verbose 模式。

## Plan

1. 让人类可读安装默认进入现有实时详细输出路径。
2. 同步显式 verbose 兼容行为、帮助文本、文档与聚焦输出契约。
3. 验证默认实时输出、最终汇总、失败状态、颜色和 JSON 边界。

## Result

- T1: 慢命令探针修复前 reportedBeforeDone=false；修复后握手探针 realtime-gate=ok，详细模式在命令完成前已输出对应命令。
- T2: 包装脚本 dry-run 保留逐项详情和最终 Done 汇总；伪 Codex 失败路径返回状态 1 并输出 Finished with errors。
- T3: 默认开启详细输出后，--json --color 结果仍可直接解析，且不含进度箭头或 ANSI。
- T4: 未传 --verbose 的包装脚本输出与显式 verbose 完全一致，并通过默认实时握手探针。
- Review gate: Skipped — 用户未请求独立 adversarial review。

## Verification

- Passed: node --check、默认与 verbose 等价、默认实时握手、JSON/help/颜色/失败状态、陈旧契约搜索和 git diff --check 均通过；按用户规则未运行单元测试。
