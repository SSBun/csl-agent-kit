# 让 Perch 在下次解析前保留上次内容

Status: Completed (2026-09-10 14:19)
Kind: Task

## Scope

- 包含：已有成功解析结果后，面板在观察新输入、等待触发和等待新解析结果期间的内容保留与替换行为。
- 不包含：输入捕获方式、解析触发规则、语言分析逻辑或占位提示文案本身的调整。

## Target
- [x] T1: Perch 已有成功解析内容时，在下一次解析完成前持续显示该内容，而不是切换为观察状态占位提示。
- [x] T2: 下一次解析完成后，面板用新的解析结果替换旧内容。

## Plan

1. 复现占位提示覆盖最近解析结果的状态切换，并定位负责显示内容的状态边界。
2. 以最小状态改动保留最近一次成功解析内容，同时维持新解析结果的正常替换。
3. 通过静态检查、构建和针对状态切换的可复现验证确认行为，再完成交付前审查。

## Result

- T1: AppModel 保存最近一次 check、tutor 或 clean 展示；showAnalyzing 与 skip 在已有结果时继续使用该展示，Swift parse 与 Debug build 均通过。
- T2: 每个新的非 skip ReviewOutcome 同时替换 lastParsedPresentation 与 reviewPresentation，编译后的新结果替换路径保持有效。
- Review gate: Passed — Review mode: non-independent self-review；独立 reviewer 因缺少 @earendil-works/pi-tui 启动失败。检查完整状态流、最小改动与既有未提交改动隔离后无 finding，未做真实 UI 回放为非阻断限制。

## Verification

- Passed: Review gate 后重新通过 Swift parse、AppModel 定向 diff 检查和 macOS arm64 Debug xcodebuild；状态赋值核对确认已有结果在 analyzing/skip 时保留，新非 skip 结果覆盖旧值。
