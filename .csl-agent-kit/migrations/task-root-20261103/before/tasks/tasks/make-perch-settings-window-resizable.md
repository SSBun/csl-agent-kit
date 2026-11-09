# 让 Perch 设置窗口可调整大小

Status: Completed (2026-09-08 17:43)
Kind: Task

## Scope

- 包含：Perch Settings 窗口的标准缩放能力，以及三个标签页内容对窗口尺寸变化的适配。
- 不包含：常驻悬浮 panel 的缩放策略、Settings 信息架构重设计或新增设置项。

## Target
- [x] T1: 用户可拖动 Perch Settings 窗口的边缘或角落改变窗口尺寸。
- [x] T2: Basic、History 与 About 标签内容在窗口调整后仍可访问。
- [x] T3: 常驻悬浮 panel 的尺寸与交互不因 Settings 窗口改动而改变。

## Plan

1. 复现 Settings 固定尺寸行为，并定位窗口与根内容的尺寸约束。
2. 使用最小的标准窗口行为与弹性布局改动开放缩放。
3. 验证真实边缘拖动、三个标签页内容、悬浮 panel 隔离和 macOS Debug 构建，再完成交付前审查。

## Result

- T1: 最终 Debug 应用中用真实鼠标拖动 Settings 右下角，外框从 560×628 变为 660×708。
- T2: 在 500×448 外框下，AX 检查确认 Basic 有可滚动表单及首尾设置、History 有 split/outline/双 scroll area、About 有图标、应用名和版本。
- T3: Settings 改为 700×700 前后，常驻 panel 外框均为 568×44；实现只触及 Settings 根布局与 SettingsWindowPresenter。
- Review gate: Passed — Review mode: non-independent self-review；独立 reviewer 因 pi-subagents 缺少 @earendil-works/pi-tui 而失败，按 task-review 降级自审；检查两处改动、调用时序、三个标签最小尺寸运行证据与 panel 隔离后，无 finding 或阻断性 Unverified Risk。

## Verification

- Passed: Review gate 后重新运行 Swift parse、两文件空白检查和 macOS 14 arm64 Debug build，均通过；最终运行副本真实拖边 560×628→640×688，panel 保持 568×44，并恢复 History 560×628。
