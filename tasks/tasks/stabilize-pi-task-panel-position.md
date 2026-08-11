# 稳定 Pi Tasks 面板位置

Status: Completed (2026-08-09 12:04)

Kind: task

## Scope

- 包含：将 Pi TUI 的 Tasks 面板改为单次注册、原位更新的自定义 Component。
- 排除：修改 Pi 核心 widget 排序逻辑或 Goal package。

## Target
- [x] T1: Tasks 面板非空期间只注册一次 widget，轮询刷新通过自定义 Component 原位更新，不改变它与其他 above-editor widgets 的相对顺序。
- [x] T2: 现有首次加载、五秒轮询、空列表隐藏、重新出现、RPC/headless 与 `/csl-tasks` 行为保持有效。
- [x] T3: 聚焦回归测试与 Pi 测试通过。

## Plan

1. 用 Pi TUI 原生组件承载现有任务行，并把轮询刷新改为更新组件内容。
2. 扩展聚焦测试，验证非空刷新不重复注册以及隐藏后可重新注册。
3. 运行聚焦测试、扩展自检和 Pi 测试。

## Result

- T1: 聚焦测试确认非空刷新前后 TaskWidget identity 不变且 setWidget 注册次数保持为 1。
- T2: 聚焦测试确认五秒刷新、空列表注销与重现、RPC 字符串数组及 headless 无 UI 调用均符合预期。
- T3: npm run test:pi 通过 8/8；扩展 --check、实际 Pi 加载探针与 git diff --check 通过。
- Review gate: Skipped — 用户未请求独立 adversarial review。

## Verification

- Passed: 聚焦测试 2/2 与 Pi 测试 8/8 通过，扩展自检和加载探针成功。
