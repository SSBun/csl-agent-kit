---
name: macos-unified-logging
description: Design, add, review, and verify privacy-safe macOS runtime telemetry with Logger, OSLog, Console, and log stream.
when_to_use: Use when adding, reviewing, or verifying macOS Logger or OSLog instrumentation, choosing subsystem, category, level, and privacy settings, or filtering unified logs for windows, sidebars, menus, commands, synchronization, and recovery paths.
version: 1.0
update_date: 2026-08-01
globs:
  - "**/*.swift"
do_not_use_when:
  - The task is primarily crash, backtrace, compiler, linker, launch, or test diagnosis with no event instrumentation; use macos-build-run-debug.
  - The task is only performance profiling and needs no timing signposts or runtime events.
  - The target is a server, command-line platform, or non-Apple client with no unified-log integration.
alwaysApply: false
---

# SOP：macOS Unified Logging

## 1. 目的

使用 Apple `Logger`/unified logging 为原生 macOS 行为增加少量、可过滤、隐私安全且可实际验证的运行时证据。日志用于回答具体行为问题，不把代码库变成 state dump，也不以 `print` 作为长期 app telemetry。

## 2. 适用范围

适用：

- window open/close、sidebar/inspector selection、menu/command、menu bar extra 等桌面交互事件。
- load、sync、import、fallback、error 与 recovery path 的轻量 instrumentation。
- 选择 subsystem、category、log level、interpolation privacy 与持久性边界。
- 用 Console.app、`log stream` 或已有 build/run loop 验证事件是否触发。
- 仅在测量 duration/span 时增加 signpost。

不适用：

- 纯 compiler/linker/test/crash/backtrace 调试；使用 `macos-build-run-debug`。
- 完整 metrics/analytics pipeline、remote log backend、隐私政策设计或 crash reporting SDK 选型。
- 没有明确诊断问题的全库 logging 改造。

## 3. 使用方式

1. 先写出日志要回答的问题、触发动作和预期证据；无法提出具体问题时不加日志。
2. 阅读触发入口、实际 side effect 和现有 logging convention，优先复用项目已有 subsystem/category helper。
3. 按 `references/macos-unified-logging/logger-design-and-verification.md` 选择 API、level、privacy 与 predicate。
4. 在最接近语义边界的位置加入一条高信号事件或小型有界序列，不记录每个 state mutation。
5. 通过项目已有 `macos-build-run-debug` loop 构建和运行，执行真实动作，再用精确 predicate 读取事件。
6. 保留长期有诊断价值的日志；临时 dump 删除或降为 `debug` 后再完成。

## 4. 核心规则

### 4.1 API、Subsystem 与 Category

- macOS 11+ Swift code 优先 `Logger` from `OSLog`；最低部署版本更旧时使用项目已有兼容层，不为一条日志升级 deployment target。
- subsystem 表达稳定功能域，app code 通常使用 bundle identifier；category 表达可过滤的 feature area，例如 `Windowing`、`Commands`、`Sidebar`、`Sync` 或 `Import`。
- 一个 feature/type 通常共享一个 logger；不为每个 method 创建动态 subsystem/category，也不使用用户输入作为 category。
- library/framework 无法可靠取得 host bundle identifier 时，使用项目已定义的稳定 subsystem，而不是每次运行变化的值。

### 4.2 Level 与信号密度

- `debug`：开发期细节和可能高频的诊断状态。
- `info`：正常但值得观察的行为边界或里程碑。
- `notice`：需要长期突出显示的正常重要事件。
- `error`：操作失败、降级或需要排查的恢复路径。
- `fault`：运行时 bug、破坏不变量或严重不可恢复状态；不得用来放大普通用户错误。
- 优先每次用户动作一条稳定事件；只有异步阶段确实需要关联时使用小型 start/result 序列。

### 4.3 Privacy 与内容

- interpolated `String` 和 custom object 默认保持 redacted；只有已确认非敏感、且过滤/诊断确实需要的值才标记 `.public`。
- 禁止记录 secret、token、password、credential、个人数据、完整路径中的用户名、raw document、clipboard、prompt、message body 或未经审查的 server response。
- 优先记录稳定 ID 的安全摘要、枚举状态、计数、耗时或失败类别；不要日志化完整对象。
- 错误描述也按输入边界审查，不能因为是 `Error` 就默认公开。

### 4.4 事件位置与语义

- log 放在实际 action 被接受、side effect 开始/结束或 failure 被处理的位置，不只放在 button tap 外层。
- UI 触发、service 执行与结果回写是不同事实；必要时各有一条有清楚语义的事件，不用单条“clicked”冒充成功。
- 进程存在和日志出现都不能证明窗口层级、焦点、布局或视觉正确性。
- `print` 只可作临时、局部诊断，完成前删除或转换为适当 `Logger`；不建立 print-wrapper abstraction。

### 4.5 Signpost

- 只有任务明确需要测量 operation duration、interval 或 performance span 时才加 signpost。
- signpost 名称与边界必须稳定；不要为普通事件同时写 logger 和 signpost 形成重复噪声。
- 性能结论必须基于实际测量，不根据日志时间戳粗略推断。

## 5. 冲突处理

| 冲突 | 处理方式 |
| --- | --- |
| 诊断可见性与隐私冲突 | 隐私优先；记录类别、计数或不可逆摘要，不公开原始值。 |
| 项目已有 logging wrapper 与直接 `Logger` 都可用 | 复用已验证 wrapper；不要为本 SOP 新建第二套 abstraction。 |
| `.public` 便于过滤但值可能识别用户 | 保持 redacted/private，改用安全枚举或非敏感稳定字段。 |
| 高信号与完整状态 dump 冲突 | 只记录能证明或推翻当前理论的最小字段。 |
| 日志事件出现但 UI 看起来错误 | 日志只证明执行路径；使用人工或 UI 验证，不扩大日志结论。 |
| debug instrumentation 与长期运维日志冲突 | 完成前删除临时 dump，或降级并限制到稳定 category。 |

## 6. 异常处理

| 场景 | Agent 行为 |
| --- | --- |
| 现有项目没有 logging convention | 使用一个 feature-local `Logger` 和稳定 subsystem/category，不创建 logging framework。 |
| 最低 deployment target 早于 `Logger` | 复用现有 OSLog compatibility path，或在任务范围内选择窄 fallback；标明兼容性。 |
| 事件未出现 | 先检查 predicate/level/process，再把 logger 移到更接近真实 control path 的位置；不先添加更多无关日志。 |
| 事件重复出现 | 检查 view lifecycle、重复 observer/task/command registration 和多层 logging；保留唯一语义 owner。 |
| 值是否敏感不明确 | 默认不公开；记录类型、计数或失败类别，并标记需隐私确认。 |
| 任务实为 crash/backtrace 分析 | 保存必要日志证据，切换 `macos-build-run-debug`。 |

## 7. 完成标准

- [ ] 每条新增日志都对应一个明确问题、动作或状态边界。
- [ ] 已复用项目现有 logging convention；没有无必要的新 wrapper。
- [ ] subsystem/category 稳定、可过滤且不包含用户输入。
- [ ] level 与事件严重性、频率和保留需求匹配。
- [ ] interpolated string/custom object 默认保持 redacted；每个 `.public` 值均已确认非敏感。
- [ ] 未记录 secret、credential、个人数据、raw document、clipboard 或完整用户内容。
- [ ] 每次动作只产生一条清楚日志或小型有界序列，未记录每个 state mutation。
- [ ] 已构建并执行真实行为，通过 Console、`log stream` 或捕获输出验证目标事件。
- [ ] 临时 dump 已删除或降级，`print` 未成为主要 telemetry。
- [ ] 结论未把日志/进程证据误报为视觉或端到端行为正确。

## 8. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/telemetry/SKILL.md
- https://developer.apple.com/documentation/os/logger
- https://developer.apple.com/documentation/os/logging
