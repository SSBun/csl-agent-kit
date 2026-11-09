# RFC：面向所有编辑场景的持久悬浮语言学习 Panel

- 状态：Proposed
- 日期：2026-09-04
- 所属任务：[`"/Users/caishilin/Desktop/personal/skills/tasks/tasks/plan-pi-language-learning-macos-app.md"`](file:///Users/caishilin/Desktop/personal/skills/tasks/tasks/plan-pi-language-learning-macos-app.md)
- 源码基线：[`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor) 0.4.1
- 目标平台：macOS 14 及以上
- 目标形态：Developer ID 站外分发的原生菜单栏应用

## 1. 摘要

本文提议将 Pi 的 `pi-language-tutor` 核心能力移植为一个独立的原生 macOS 应用。

应用提供一个启动后持续显示的悬浮 panel。它以旁路方式观察当前前台应用中获得焦点的可编辑控件，只读取该控件通过 macOS Accessibility API 主动暴露的输入内容，并被动观察用户的确认信号。确认发生时，应用冻结一份输入快照，在后台执行与 Pi 插件输入侧一致的语言学习处理，再在原位置更新 panel：

- 输入主要使用学习语言时，执行 Writing check，返回拼写/语法问题和更自然的表达；
- 输入主要使用母语或其他语言时，执行 Writing tutor，返回目标语言中的自然整句、关键词汇和语法说明；
- 输入不适合处理时返回 `skip`，不调用或不展示无价值结果。

应用不得改变源应用的任何文本或事件：不拦截确认、不延迟确认、不合成按键、不调用 Accessibility 写入或 action、不读写剪贴板、不替换文本，也不重新提交内容。原应用在监听开启和关闭时必须保持相同的焦点、输入、换行、快捷键与提交行为。

“适配所有编辑场景”在本 RFC 中表示：对所有应用提供统一的只读检测与明确能力结果；对遵循 Accessibility 文本契约的控件提供自动能力；对需要特定确认语义的应用提供用户启用的 profile；对安全输入和不暴露文本的控件明确拒绝捕获。它不表示绕过系统安全边界或保证每个自绘控件都能无感自动读取。

## 2. 背景

### 2.1 现有插件行为

`pi-language-tutor` 0.4.1 包含三组能力：

1. 输入侧 Writing check / Writing tutor；
2. assistant 输出的双语翻译卡片；
3. Tutor 词汇自动入库及 FSRS 复习。

本 RFC 的 MVP 只移植第一组能力，并把 Writing tutor 中的自然整句作为确认输入的翻译结果。MVP 不监听 assistant 输出，也不移植 FSRS。

现有插件通过 Pi 的 `input` 事件得到一条已经提交的完整消息。它并不逐键监听，也不需要猜测 `Return` 是提交还是换行。该控制流位于 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts)。

通用 macOS 应用没有跨进程的“用户提交了一条消息”语义。系统只能提供：

- 当前前台应用与 focused accessibility element；
- 目标控件愿意暴露的 value、selection 和相关通知；
- 较低层的键盘事件。

因此独立应用必须把“输入快照”和“确认信号”分开建模，并将自动确认限制在已知 profile 内。

### 2.2 提取边界

[`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/core.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/core.ts) 是最稳定的移植真相源。它没有 Pi import 或 I/O，包含：

- `Config`、`ReviewResult`、`GrammarItem`、`TutorResult` 等值类型；
- 输入跳过规则；
- review prompt；
- JSON 提取与 review 结果归一化；
- 字符上限和结果数量上限。

以下部分不能直接用于原生应用：

- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/llm.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/llm.ts) 依赖 Pi model registry、认证、provider dispatch、session 与 prompt cache；
- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts)、[`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/tutor.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/tutor.ts)、[`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/translate.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/translate.ts) 和 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/settings.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/settings.ts) 依赖 Pi 生命周期与终端 TUI；
- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/learn.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/learn.ts) 与 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/web/flashcards.html"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/web/flashcards.html) 依赖 Node、Glimpse WebView 和 FSRS 数据。

原生目标不能直接编译任何 TypeScript 模块。这里的“提取”是冻结协议、提示词、规则与测试行为，再以 Swift 等价实现。

### 2.3 许可

插件使用 MIT License。移植、修改和分发被允许，但复制源码或实质部分时，应用分发材料必须保留原版权与许可文本。权威文本位于 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/LICENSE"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/LICENSE)。

## 3. 决策

采用以下方案：

- 原生 Swift 6 + SwiftUI 应用壳；
- 一个由窄 AppKit bridge 管理的持久、nonactivating `NSPanel`；
- Accessibility 只读输入观察；
- 单个 `.listenOnly` Core Graphics event tap 被动观察确认键；
- bundle identifier 驱动、默认关闭的自动确认 profile；
- OpenAI-compatible `/v1/chat/completions` 后端；
- API Key 存 Keychain，其余偏好存应用设置；
- captured text 与分析结果默认只驻留内存；
- Developer ID 站外分发，MVP 不启用 App Sandbox。

不采用 Node sidecar、Electron、Tauri、Glimpse 或 InputMethodKit。

## 4. 目标

### 4.1 产品目标

1. Panel 在应用运行期间持续悬浮于用户选择的屏幕和位置。
2. Panel 不因输入、确认、请求开始或结果返回而激活应用、改变 key window 或夺取源应用焦点。
3. 应用只观察 focused editable control 的文本和确认信号。
4. 确认后执行与 Pi 插件输入侧等价的 `check | tutor | skip` 路由。
5. 模型请求在后台执行，源应用立即继续自己的原始行为。
6. 新输入可以取消旧分析；旧结果不能覆盖新快照。
7. 权限不足、控件不支持、模型失败和网络失败都在 panel 中可见，但不干扰源应用。
8. 对标准原生文本控件、常见 Web 文本控件以及经过验证的 Electron/IDE 控件提供可复现的兼容结论。
9. 显式确认承担 MVP 的确定性基线；自动 `Return/Enter` 只是逐 application profile 验证后才能启用的 best-effort 增强，不用于证明普遍兼容。

### 4.2 工程目标

1. 领域逻辑不依赖 AppKit、Accessibility、网络或持久化。
2. Accessibility 与 event tap 封装在平台边界内。
3. 事件回调始终快速返回原事件，不在回调中执行 AX 查询、磁盘 I/O 或网络请求。
4. 模型 provider 可由 mock server 确定性验证。
5. 0.4.1 的核心 fixture 可同时约束 TypeScript 基线与 Swift 移植结果。
6. 不在日志、磁盘或崩溃上下文中保存输入文本、API Key 或模型完整响应。

## 5. 非目标

MVP 不包含：

- 读取或翻译 assistant 输出；
- 对源应用执行文本替换、自动改写或自动提交；
- 记录逐个按键并从 key code 重建字符；
- 剪贴板读取、写入、保存或恢复；
- `CGEventPost`、AX setter、AX action 或 Apple Events；
- OCR、屏幕录制或窗口截图；
- InputMethodKit 输入法；
- FSRS、记忆卡片和旧卡库迁移；
- 跨设备同步或云端历史；
- 完整文档语义分析；
- Mac App Store 上架保证；
- 绕过密码框、Secure Event Input 或目标控件的 Accessibility 缺失。

## 6. 术语

| 术语 | 定义 |
|---|---|
| Source application | 用户当前实际输入文本的前台应用。 |
| Focused editable element | Source application 通过 Accessibility 暴露、当前获得输入焦点且可编辑的元素。 |
| Input snapshot | 对某个 focused editable element 在特定时刻读取到的不可变文本、selection、应用身份和时间信息。 |
| Confirmation signal | 被动观察到的显式组合键或 profile 允许的 `Return/Enter` 事件。 |
| Application profile | 以 bundle identifier 为键，描述确认规则与文本边界的本地配置。 |
| Observation path | 从 AX notification/event tap 到快照冻结的只读链路。 |
| Review pipeline | 将确认快照映射为 `check`、`tutor` 或 `skip` 的领域与模型流程。 |
| Persistent panel | 单实例在应用进程生命周期内持续存在；除用户显式隐藏外保持可见，且不主动成为 key window 的 `NSPanel`。 |
| Capability result | 对当前控件返回 supported、permissionRequired、secure、notEditable 或 unsupported，而不是含糊的空文本。 |

## 7. 需求

### 7.1 功能需求

#### FR-1：持久 panel

- 应用启动完成后创建唯一 panel；首次启动默认显示。
- persistent 指单实例与位置状态持续存在，不表示用户不能显式隐藏。
- panel 可由用户拖动，并按 display identity 保存位置。
- display 消失、分辨率变化或位置越界时，将 panel 约束回可见区域。
- panel 切换内容状态时不自动改变位置。
- 用户通过关闭按钮或菜单执行“隐藏”后，保存 `panelIsVisible=false`，重启时继续隐藏；菜单执行“显示”后保存 `panelIsVisible=true` 并恢复原位置。
- hidden 是合法显式状态；输入观察和模型请求默认暂停，直到用户重新显示 panel。
- 菜单栏始终提供显示、隐藏和退出应用。

#### FR-2：只读输入观察

- 只观察前台应用的 focused editable element。
- 优先使用 AX notification 更新快照；通知不足时只允许对已启用 profile 使用有界轮询。
- 不遍历与当前 focused element 无关的完整 Accessibility 树。
- 不读取后台应用文本。
- focus 改变后立即淘汰旧 element 的活动快照。

#### FR-3：确认观察

- 使用 `.listenOnly` event tap。
- event tap 对所有事件返回原始 `CGEvent`，不得返回 `nil`、替换事件或更改字段。
- 显式组合键只触发本应用的分析副作用，不占用该组合键；源应用仍接收原事件。
- 普通 `Return/Enter` 只有在当前 bundle identifier 的 profile 已启用且规则匹配时才触发。
- `Shift+Return`、`Option+Return`、`Command+Return` 等是否确认由 profile 明确规定，不能使用全局猜测。

#### FR-4：确认快照

- 分析输入必须是确认信号到达时最近一份有效快照。
- 快照必须属于同一个前台 PID、bundle identifier 与 focused element identity。
- 显式确认优先在 event callback 返回之后执行一次有界 AX 读取；因为它不使用源应用的提交键，该路径承担 MVP 的确定性基线。
- 自动 `Return/Enter` 只允许使用 Enter 之前已缓存的 AX 快照；不得在回调中同步查询，也不得为等待 AX 更新而延迟事件。
- 快照超过 profile 允许的新鲜度、内容为空或 focus 已变化时，跳过分析并显示原因。
- 自动 Enter 的 freshness 只用于拒绝过期数据，不能被当作“已包含最后一个 committed character”的证明。
- 不为“拿到可能已经被清空的内容”而延迟、暂停或重放源事件。

#### FR-5：语言处理

- 确认文本通过现有 `shouldSkipCheck` 等价规则后再发起请求。
- 模型一次返回 `check`、`tutor` 或 `skip`，check 与 tutor 不得同时显示。
- `check` 最多展示 5 个 genuine error，以及至多一个 natural rephrase。
- `tutor` 展示一条目标语言自然整句、最多 5 个词汇和最多 3 个语法结构。
- 代码、路径、标识符、产品名与技术术语不得被模型当作普通语言错误强行修改。
- review 文本最多使用 AX 边界允许读取的前 1,500 个字符。
- 由于隐私上限先于领域层生效，原始控件超过 1,500 字符且边界处包含大量前导/尾随空白时，结果可能与“先取得完整 Pi input、再 trim、再 slice”的插件顺序不同；这是有意的平台差异，不得宣称该输入类别完全 parity。

#### FR-6：非阻塞与 latest-wins

- 确认事件不等待模型请求。
- 新确认产生新 snapshot ID，并取消旧请求。
- provider 不支持及时取消时，旧响应仍必须因 snapshot ID 不匹配而被丢弃。
- 请求失败不能清空或修改源应用输入。

### 7.2 不干扰需求

#### NIR-1：文本不变

监听开启前后，源应用的 text value、selection 和 undo stack 必须相同。

#### NIR-2：事件不变

应用不得消费、延迟、复制、合成、重新发布或修改源键盘事件。

#### NIR-3：焦点不变

观察、确认和结果展示不得调用 `activate`、`makeKey`、`orderFrontRegardless` 等会改变源应用活动状态的路径。用户主动打开 Settings 或退出应用属于显式应用交互，不属于自动观察路径。

#### NIR-4：剪贴板不变

自动路径不得访问或改变 `NSPasteboard.general`。

#### NIR-5：安全输入不读

focused element 为 secure text field，或系统开启 Secure Event Input 时，不保留旧文本、不发起请求，也不显示内容预览。

## 8. 方案比较

### 8.1 方案 A：原生 SwiftUI + 最小 AppKit bridge（采用）

优点：

- 最接近 Accessibility、event tap、窗口层级与多屏行为；
- 可严格约束 panel 激活和焦点；
- 不需要分发额外运行时；
- Keychain、TCC 权限和 Developer ID 分发路径清楚。

代价：

- TypeScript core 需要等价移植；
- Pi model/session 能力必须重建；
- Accessibility 兼容矩阵仍需逐类验证。

### 8.2 方案 B：Swift 外壳 + Node sidecar（拒绝）

优点是可以直接执行部分 TypeScript。缺点是需要携带 Node、定义 IPC、管理子进程、处理签名与升级，并保留 Pi provider 之外的大量重写工作。它没有降低 AX 和 event tap 风险。

### 8.3 方案 C：Electron/Tauri/Glimpse（拒绝）

这类方案可复用 Web UI，但持久 nonactivating panel、焦点、多 Space、Accessibility 与事件监听仍需要原生 bridge。对于一个单 panel utility，运行时和签名复杂度大于节省的 UI 代码。

### 8.4 方案 D：InputMethodKit（拒绝）

输入法只能在用户主动选中该输入法并通过 text-input client 参与 composition 时看到相关输入。它不能被动覆盖其他输入法和所有编辑场景，并会与用户原有中日韩输入法工作流冲突。

## 9. 总体架构

```text
┌──────────────────── Source application ────────────────────┐
│ focused editable control                                   │
│ original text / focus / Return handling remain unchanged   │
└───────────────┬───────────────────────────┬─────────────────┘
                │ AX read + notifications   │ unchanged key event
                ▼                           ▼
      InputObservationService       ConfirmationObserver
                │ InputSnapshot             │ ConfirmationSignal
                └──────────────┬─────────────┘
                               ▼
                    SnapshotCoordinator
                   validate + freeze + dedupe
                               │
                               ▼
                      LanguageReviewService
                    policy → prompt → provider
                               │
                               ▼
                  OpenAICompatibleReviewClient
                               │ ReviewOutcome
                               ▼
                       PanelStateStore
                               │
                               ▼
              PersistentPanelController / NSPanel
```

### 9.1 组件职责

| 组件 | 职责 | 明确不负责 |
|---|---|---|
| AppShell | 组合 menu bar、Settings、应用生命周期和服务。 | 不读取 AX，不调用模型。 |
| PersistentPanelController | 创建、定位和更新唯一 `NSPanel`。 | 不拥有语言规则、网络或输入快照。 |
| InputObservationService | 跟踪 focused editable element，产生 capability 与 input snapshot。 | 不解释确认语义，不写目标控件。 |
| ConfirmationObserver | 通过 listen-only event tap 产生确认信号。 | 不读取文本，不修改事件。 |
| ApplicationProfileStore | 保存 bundle identifier、确认规则和文本边界。 | 不自动下载 profile，不信任远端配置。 |
| SnapshotCoordinator | 匹配 signal 与 snapshot，检查 freshness/identity，分配 snapshot ID。 | 不直接操作 panel 或网络。 |
| ReviewPolicy | 执行跳过规则、长度限制与路由前置判断。 | 不执行 I/O。 |
| PromptBuilder | 等价生成插件 review prompt。 | 不选择 provider。 |
| ReviewResponseDecoder | 将模型文本归一化为 `check | tutor | skip`。 | 不渲染 UI。 |
| LanguageReviewService | 编排 policy、prompt、provider、decode、取消与 latest-wins。 | 不接触 AX 或 AppKit。 |
| OpenAICompatibleReviewClient | 调用 `/v1/chat/completions` 并返回文本响应。 | 不读取 Pi 配置或会话。 |
| SettingsStore | 保存语言、模型、profile、panel geometry 与暂停状态。 | 不保存 API Key 或 captured text。 |
| CredentialStore | 在 Keychain 中保存 API Key。 | 不返回可记录的凭据描述。 |

### 9.2 状态所有权

应用只有一个 app-level state owner，持有：

- 权限状态；
- 当前前台应用身份；
- 当前 capture capability；
- 当前 snapshot ID；
- 当前 panel state；
- 当前请求 cancellation handle；
- 用户偏好。

AppKit delegate、AX observer callback 与 event-tap callback 只产生语义事件，不保留第二份业务状态。

## 10. 输入观察设计

### 10.1 Accessibility 根路径

通用路径：

1. `AXUIElementCreateSystemWide()` 创建 system-wide accessibility element；
2. 读取 focused application 与 focused UI element；
3. 在读取文本前验证权限、前台 PID、role/subrole、editable 能力、secure 状态与 application profile；
4. 先读取 `AXSelectedTextRange` 与 `AXNumberOfCharacters` 等元数据，只据此计算允许的字符范围；
5. 优先使用 `AXStringForRange` 参数化属性读取最多 `MAX_CAPTURE_CHARS` 个字符；
6. 只有字符数已证明不超过硬上限，或 profile 已验证该控件是有界提交输入时，才允许读取完整 `AXValue`；
7. 订阅 focused element/value/selection 变化通知；
8. 只用已经过 AX 边界限制的文本生成不可变 input snapshot。

`MAX_CAPTURE_CHARS` 在 MVP 固定为 1,500，与 review prompt 上限一致。任何通用捕获路径都不得先把完整 `AXValue` 读入进程再裁剪。对异常 AX provider 返回的字符串还要在接收处再次执行 1,500 字符防御性上限。

Apple SDK 将 selected text、selected text range、number of characters 与 string-for-range 定义为文本元素能力。但自定义控件只有在目标应用正确实现 Accessibility 时才会提供可靠值。相关系统说明：

- [Apple Accessibility Model](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXmodel.html)
- [AX selected text](https://developer.apple.com/documentation/applicationservices/kaxselectedtextattribute)
- [UIElementInspector sample](https://developer.apple.com/library/archive/samplecode/UIElementInspector/Introduction/Intro.html)

### 10.2 允许读取的内容

通用 profile 按以下顺序决定范围：

1. 有非空 selection 时，先读取 selection range，再用 `AXStringForRange` 读取最多 1,500 字符；
2. 单行 editable control 只有在 `AXNumberOfCharacters <= 1,500` 时读取完整 value，否则读取前 1,500 字符的 range；
3. 多行 editable control 默认只读取 selection；当前段落范围只有在 `AXRangeForLine`/`AXStringForRange` 可用时才读取；
4. 已验证的提交型 application profile 可以声明完整输入范围，但仍必须在 AX 边界限制为 1,500 字符；
5. 无法在读取前确定安全范围时返回 unsupported，不调用完整 `AXValue`；
6. 空文本不创建可分析快照，非 editable control 不观察正文。

Application profile 必须以 bundle identifier 与控件特征共同匹配，不能只凭应用名称。profile 只能缩小或解释范围，不能放宽 1,500 字符硬上限。

### 10.3 AX 错误与通知降级

| AX 结果 | 稳定映射 | 行为 |
|---|---|---|
| success | supported | 继续执行有界读取。 |
| API disabled / process untrusted | permissionRequired | 不重试文本读取，等待权限状态变化。 |
| `kAXErrorAttributeUnsupported` | unsupportedAttribute | 尝试同一 profile 明确列出的下一个只读属性；没有则 unsupported。 |
| `kAXErrorNotificationUnsupported` | notificationUnsupported | 显式确认仍可执行一次有界按需读取；自动 Enter 只有经验证的有界轮询 profile 才能启用，否则关闭。 |
| `kAXErrorCannotComplete` | transientFailure | 在串行 AX owner 上重新取得 focused element 后最多重试一次；再次失败则本次 unsupported，不把它永久缓存为控件能力。 |
| invalid UI element / invalid observer | staleElement | 立即丢弃 element 与 snapshot，重新发现 focus；不使用旧引用重试。 |
| illegal argument / generic failure | internalFailure | 记录无文本诊断并停止本次读取。 |

有界轮询只允许在当前 app/profile/focused element 生命周期内运行；focus、应用、权限或 panel visibility 变化时立即停止。fake AX 验证必须覆盖每种映射和重试上限。

### 10.4 不允许的操作

生产代码中不得出现以下行为：

- `AXUIElementSetAttributeValue`；
- `AXUIElementPerformAction`；
- `CGEventPost`；
- 非 listen-only event tap；
- `NSPasteboard.general`；
- 模拟 `Command+C`、`Command+V` 或 `Return`；
- 对源应用调用 Apple Events；
- 通过轮询全局键盘状态重建文本。

该禁令应通过静态检查和代码审查，而不是只依赖约定。

### 10.5 IME

原始 key code 不能可靠表示中文、日文、韩文等输入法组合后的文本。MVP 只接受 focused control 已经通过 Accessibility 暴露的 committed value。

对于自动 Enter profile：

- event tap 只产生确认信号；
- 分析使用 Enter 之前最近一次 AX value snapshot；
- profile 验证必须包含拼音、日文假名和候选词确认；
- 无法区分“候选词确认”与“消息提交”的应用不得启用自动 Enter，只保留显式确认。

## 11. 确认观察设计

### 11.1 显式确认

所有应用可以使用一个用户可配置的旁路组合键。它通过 listen-only event tap 被动观察，不通过 `RegisterEventHotKey` 注册，因此不会占用或吞掉事件。持久 panel 另提供一个不含文本输入的“分析当前输入”鼠标控件，作为不依赖键盘组合冲突的显式入口；阶段 1 必须证明该控件不会激活应用或改变源应用 key window。

显式信号返回后，coordinator 在事件回调之外执行第 10 节定义的有界 AX 读取。若源应用也为旁路组合键定义了行为，两个行为都会发生；本应用既不阻止源行为，也不在 app/focus/element identity 已变化时使用竞态结果。

### 11.2 自动 Enter

自动 Enter 默认对所有应用关闭，并被定义为 best-effort、profile-limited 增强，而不是通用能力。用户必须逐个启用 application profile；profile 只有通过确认前快照因果验证后才能进入 active 状态。

一个 profile 至少定义：

- bundle identifier；
- 允许的 focused role/subrole 或控件标识；
- 确认按键与 modifier 规则；
- 单行/多行文本边界；
- snapshot freshness；
- notification 或有界轮询策略；
- 已验证的应用版本范围和重新验证触发条件；
- 最后字符后立即 Enter、提交后清空、中文/日文候选确认与 AX callback 延迟的验证结果。

Freshness 不能替代因果验证。无法证明快照包含确认前完整 committed text 时，profile 必须保持 disabled；应用升级、控件身份变化或连续出现空/错误快照时，active profile 降级为显式确认。

### 11.3 Event-tap 约束

MVP 固定以下创建参数，改变任一项需要更新 RFC 与平台 fixture：

- location：`kCGSessionEventTap`，避免 `kCGHIDEventTap` 的 root 边界；
- placement：`kCGHeadInsertEventTap`；
- options：`kCGEventTapOptionListenOnly`；
- event mask：仅 `kCGEventKeyDown`；tap-disabled 通知按 Core Graphics 约定处理，不扩展普通字符观察；
- owner：独立串行线程上的 `CFRunLoopSource`，由 `ConfirmationObserver` 单独管理生命周期。

前台 app/PID 由 `NSWorkspace` activation notification 在 callback 外更新为原子只读快照。Event-tap callback 只完成以下常量时间工作：

1. 判断 key-down 是否匹配显式组合键或当前 active profile；
2. 读取 key code、modifier、timestamp 和已缓存的前台 app identity；
3. 将语义事件投递给串行 coordinator；
4. 原样返回同一个 `CGEvent`。

回调不得查询 AX/`NSWorkspace`、更新 SwiftUI、读取磁盘、访问 Keychain 或发起网络请求。`CGEventTapCreate` 返回 `nil` 时：若 `CGPreflightListenEventAccess()` 为 false，映射为 permissionRequired；权限已存在仍为 `nil` 时映射为 eventTapUnavailable，并停止自动确认。收到 timeout-disabled 通知时只允许重新启用一次；再次禁用后关闭确认监听并保留 panel 诊断状态。

Apple 明确说明 global event monitor 不能修改事件，而 event tap 可以是 passive listener 或 active filter。MVP 只使用 passive/listen-only 行为：

- [Monitoring Events](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/MonitoringEvents/MonitoringEvents.html)
- [Quartz Event Services](https://developer.apple.com/documentation/coregraphics/quartz-event-services)

## 12. Persistent Panel 设计

### 12.1 窗口角色

Panel 是显示型 utility surface，不是主文档窗口，也不是输入法候选窗。使用专用 `NSPanel` owner，而不是让普通 SwiftUI view 长期持有 `NSWindow` reference。

建议窗口行为：

- nonactivating；
- floating；
- 可加入普通 Spaces；
- 可在全屏辅助层显示时遵守系统限制；
- 无 Dock icon，应用由 `MenuBarExtra` 管理；
- 有逻辑标题和可访问性描述；
- 用户可拖动，但结果到达时不自动移动；
- 几何位置按 display identity 保存；
- 屏幕拓扑变化时保证仍位于 visible frame。

### 12.2 Panel 状态机

```text
starting
  ├─ permissionRequired
  └─ monitoring
        ├─ unsupported
        ├─ secure
        └─ confirmed(snapshotID)
              └─ analyzing(snapshotID)
                    ├─ check(snapshotID)
                    ├─ tutor(snapshotID)
                    ├─ skipped(snapshotID)
                    └─ failed(snapshotID)
```

任何 result 只有在 snapshot ID 等于当前 active ID 时才能进入可见状态。focus 改变可以更新顶部来源状态，但不自动清除用户正在阅读的最后结果；下一次有效确认再替换正文。

### 12.3 内容层级

Panel 保持稳定布局：

1. 顶部：当前来源应用、监听/权限状态；
2. 正文：最后一次分析结果；
3. 底部：不含文本输入的“分析当前输入”控件，以及模型状态、暂停指示或简短失败原因。

`check` 内容：

- 错误片段 → 正确片段；
- 母语原因；
- 可选自然改写。

`tutor` 内容：

- 目标语言自然整句；
- Words；
- Grammar。

clean 或 skip 不展示伪造反馈。可以显示短暂的“未发现需要提示的内容”，随后恢复 monitoring 状态。

### 12.4 焦点规则

自动路径不能调用应用激活或 key-window API。Panel 正文不包含文本输入控件；鼠标触发“分析当前输入”只能通过 nonactivating panel action 发送语义信号，不能调用 `makeKey`。设置、授权帮助和退出通过 menu bar 打开；这些是用户显式操作，可以进入本应用，但不得由一次普通确认自动触发。

## 13. 语言领域设计

### 13.1 输入过滤

领域层对已经过 AX 边界限制的 snapshot 执行 `trim → shouldSkipCheck → buildReviewPrompt`，与 0.4.1 的 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts) 内部顺序一致。trim 后文本同时用于 skip 判断和 prompt。

生产链路存在一项明确、受控的差异：Pi 先取得完整 `event.text` 再 trim/slice；本应用为了不把长文档读入内存，必须先把 AX 读取限制为原始前 1,500 个字符，再进入领域 trim。Core parity 因此只承诺“输入 snapshot 已不超过 1,500 字符”的范围。若 `AXNumberOfCharacters > 1,500` 且已读取窗口全部为空白，capture 返回 `truncatedBeforeContent`，不把它伪装为普通 skip，也不继续扫描文档寻找第一个非空白字符。

过滤语义为：

- `/` 或 `!` 开头的命令跳过；
- 包含 fenced code 的输入跳过；
- 少于 4 个 Latin word 或 CJK 字符的输入跳过；
- 字母占比不足 50% 的符号密集输入跳过；
- “代码味”token 比例超过 30% 的输入跳过；
- CJK 按字符而不是空白单词计数。

独立应用不是 coding-agent 专用，因此应用 profile 可以额外指定是否保留 slash/bang command 规则；MVP 默认保持插件行为以确保等价基线。

### 13.2 Review 结果

领域结果维持互斥 union：

```text
ReviewOutcome
  ├─ check(items, rephrase?)
  ├─ tutor(sentence, words, grammar)
  └─ skip(reason)
```

`tutor.sentence` 是本 MVP 对已确认母语输入的翻译结果；不增加独立的 assistant-response translation pipeline。

### 13.3 响应解码

移植时保留以下兼容行为：

- `extractJson` 精确保持 0.4.1 算法：取原始响应中第一个 `{` 到最后一个 `}`（含边界）的子串并执行一次 JSON decode；没有边界、末尾不在首个边界之后或 decode 失败时返回 undefined；它不是花括号平衡的“第一个完整 object”解析；
- 允许旧式省略 `mode` 的 check 结果，但必须存在合法 `items` 或 `rephrase` 证据；
- malformed item 被过滤；
- words 截断到 5，grammar 截断到 3；
- 空 tutor 退化为 skip；
- 无法证明是 review payload 的 JSON 不得被解释为 clean check。

Swift decoder 可以比旧实现更严格地校验字段类型，但不能改变上述用户可见结果。每次加强校验都必须由 parity fixture 证明不会把有效基线响应错误拒绝。

### 13.4 最小调用示例

以下调用点用于约束未来 Swift API 的清晰性：

```swift
let capture = await inputObserver.currentCapture()
let snapshot = snapshotCoordinator.snapshot(for: signal, from: capture)
let outcome = try await reviewService.review(snapshot, using: preferences)
panelState.present(outcome, for: snapshot.id)
```

类型和方法按职责命名；读取型 API 使用名词或无副作用表达，产生 UI/状态副作用的方法使用动词。声明时应能为每个公开或跨模块 API 写出一句清楚的 documentation summary。

## 14. 模型接入

### 14.1 Provider 合同

MVP 保存完整的 Chat Completions `endpointURL`，而不是模糊的 Base URL。默认值为 `https://api.openai.com/v1/chat/completions`；客户端不追加 `/v1` 或其他路径，因此不会产生重复路径。

配置字段只有：

- Endpoint URL；
- Model ID；
- API Key；
- Request timeout。

远程 endpoint 必须使用 HTTPS。明文 HTTP 只允许 `localhost`、`127.0.0.1` 或 `[::1]`；如当前 SDK 需要 ATS local-networking 声明，只添加该窄例外，不启用 arbitrary loads。

网络层使用非 background `URLSession`。Session delegate 在 `willPerformHTTPRedirection` 中对所有 3xx 调用 `completionHandler(nil)`，禁止同源、跨源及 HTTPS→HTTP 重定向；configured `endpointURL` 是唯一允许接收输入文本的 URL。重定向响应映射为 `redirectDenied`，不发出第二个请求。

API Key 可为空，以支持不需要鉴权的 loopback 服务。非空 Key 只存 Keychain，不能进入 `UserDefaults`、任务日志或错误文案。不要求 provider 支持 tools、reasoning、session ID、prompt cache、streaming 或 structured-output 扩展。

### 14.2 HTTP wire contract

请求固定为：

```http
POST <endpointURL>
Content-Type: application/json
Accept: application/json
Authorization: Bearer <api-key>   # 仅非空 Key 时发送
```

JSON body 固定为：

```json
{
  "model": "<model-id>",
  "messages": [
    { "role": "user", "content": "<review-prompt>" }
  ],
  "stream": false
}
```

成功响应只接受 `2xx`，并从 `choices[0].message.content` 提取非空字符串。缺失 choice、content 非字符串或 JSON 无效均映射为 `invalidResponse`。非 `2xx` 先按 status 映射 401/403、429 与 server error，再读取有界错误摘要；不得把完整 response body 或凭据写入日志。

Review prompt 只包含静态指令、learning language、native language 与已经在 AX 边界限制为 1,500 字符的确认文本。不得包含 Pi system prompt、Pi session 历史、当前应用其他文本、Accessibility 树或 bundle identifier。

Wire fixture 必须同时覆盖默认 OpenAI endpoint、带自定义 path 的 HTTPS endpoint、loopback HTTP、空/非空 Key、禁止的远程明文 HTTP，以及 301/302/303/307/308 的同源、跨源和 HTTPS→HTTP 响应；每种重定向都必须证明只有初始 endpoint 收到请求。

### 14.3 并发

- 同一时间最多一个 active review request；
- 新确认先取消旧请求；
- 网络层使用 snapshot ID 贯穿 request/response；
- cancellation 不成功时由 presentation gate 丢弃 stale response；
- provider redirectDenied、429、认证、超时、无效 JSON 和连接失败分别映射为稳定错误类型。

## 15. 数据与持久化

### 15.1 持久化内容

| 数据 | 存储 |
|---|---|
| native / learning language | 应用设置 |
| endpoint URL / model / timeout | 应用设置 |
| API Key | Keychain |
| application profiles | 应用设置中的版本化结构 |
| panel display 与位置 | 按 display identity 的应用设置 |
| pause 状态 | 应用设置 |

### 15.2 不持久化内容

MVP 默认不持久化：

- 输入快照；
- selection；
- review prompt；
- 模型原始响应；
- panel 历史；
- source application title 或文档名。

内存中只保留当前 focused element 的最近快照和当前可见结果。focus 进入安全字段、应用暂停或进程退出时立即释放 captured text。

## 16. 权限与分发

### 16.1 Accessibility

读取其他应用的 focused element 与文本属性需要用户授予 Accessibility 权限。应用通过 `AXIsProcessTrustedWithOptions` 检查并在用户主动操作时触发系统引导；授权结果是异步的，应用必须持续显示真实状态。

### 16.2 Input Monitoring

键盘 event listening 通过 `CGPreflightListenEventAccess` 检查，并由用户主动操作调用 `CGRequestListenEventAccess`。未授权时 panel 仍可显示，但不能自动处理确认。

### 16.3 Secure Event Input

Secure Event Input 用于阻止其他进程截获敏感键盘输入。系统开启时，本应用不得尝试绕过；它应丢弃文本快照并显示安全状态。Apple 说明见 [Using Secure Event Input Fairly](https://developer.apple.com/library/archive/technotes/tn2150/_index.html)。

### 16.4 分发

MVP 使用 Developer ID 签名与站外分发，不启用 App Sandbox。若后续要求 Mac App Store，必须先用独立 spike 验证当前 App Review、sandbox、Accessibility 与 event-tap 边界；本文不把站外方案声明为可直接上架。

MVP 不申请 Screen Recording、Full Disk Access 或 Automation 权限。

## 17. Application Profile

### 17.1 通用 profile

所有应用自动获得通用只读 profile：

- 识别 focused editable element；
- 维护 AX value snapshot；
- 自动 Enter 关闭；
- 支持显式确认；
- 多行边界不明确时只处理 selection 或返回 unsupported。

### 17.2 应用特定 profile

应用特定 profile 只补足两个问题：

1. 什么按键在该控件中代表提交；
2. 哪一段 AX value 是这次提交的完整输入。

Profile 不允许改变任何系统安全规则，也不允许启用 AX 写入或事件修改。

### 17.3 生命周期

- 默认 allowlist 为空；
- 用户从当前前台应用主动启用 profile；
- 未验证 profile 首先进入观察/预览模式，不直接发模型请求；
- 用户确认捕获边界正确后才启用自动分析；
- 应用升级或控件身份变化触发重新验证；
- 连续错误自动降级为显式确认。

## 18. 兼容矩阵

| 技术场景 | 文本读取 | 显式确认 | 自动 Enter | MVP 结论 |
|---|---|---|---|---|
| `NSTextField` | 通常完整 value | 支持 | profile 验证后支持 | 目标支持 |
| `NSTextView` | value/selection | 支持 | 仅明确提交型控件 | 目标支持 |
| Safari/Chrome input | 依赖 Web Accessibility | 支持 | profile 验证后支持 | 目标支持 |
| textarea/contenteditable | selection 通常较稳，完整 value 因实现而异 | 支持 | 必须验证边界 | 条件支持 |
| Electron 普通文本框 | 依赖 Chromium AX 暴露 | 支持 | 按应用 profile | 条件支持 |
| Monaco/VS Code editor | value 与 selection 可能受 accessibility mode 影响 | 有文本时支持 | 默认关闭 | 条件支持 |
| Xcode source editor | selection/当前编辑值按实测 | 有文本时支持 | 默认关闭 | 条件支持 |
| Terminal/iTerm2 | 命令行完整 value 通常不稳定 | 有明确 AX 文本时支持 | 默认关闭 | 有限支持 |
| 长文档编辑器 | selection 优先 | 支持 selection | 默认关闭 | 有限支持 |
| 自绘 canvas/OpenGL | 通常无语义文本 | 无文本则不可用 | 不支持 | 明确不支持 |
| Remote Desktop | 只看到远端画面 | 不支持 | 不支持 | 明确不支持 |
| 密码框/Secure Input | 禁止读取 | 不支持 | 不支持 | 安全排除 |

“目标支持”仍需在实际应用中验证；表格描述的是平台能力预期，不是未经验证的兼容承诺。

## 19. 错误处理

| 场景 | 行为 |
|---|---|
| Accessibility 未授权 | panel 显示权限说明；不创建文本快照。 |
| Input Monitoring 未授权 | 保留 panel；确认监听关闭。 |
| focused element 非 editable | 显示 monitoring，但不读取正文。 |
| secure field/Secure Input | 清除快照并显示安全状态。 |
| 控件不支持 value | 显示 unsupported，不使用剪贴板绕过。 |
| 确认时快照过期 | 跳过请求，显示“未取得本次输入”。 |
| 输入被过滤 | 不调用模型；短暂显示 skipped 原因。 |
| 网络超时/断网 | 保留源应用行为；panel 显示可诊断错误。 |
| HTTP 重定向 | 拒绝跳转并显示 endpoint redirect denied；不发送第二个请求。 |
| 401/403 | 提示检查 Keychain 凭据。 |
| 429 | 显示限流，不自动无限重试。 |
| invalid JSON | 标记 provider response invalid；不展示伪结果。 |
| stale response | 静默丢弃，不覆盖当前 panel。 |
| event tap 被禁用 | 尝试恢复一次；继续失败则关闭确认监听。 |
| display 拔出 | 把 panel 移回可见屏幕，并更新保存位置。 |

## 20. 隐私与安全

### 20.1 主要威胁

1. 把密码或敏感字段误当普通输入；
2. 从长文档过度读取与本次确认无关的内容；
3. 将 source application 信息或历史文本发送给 provider；
4. event tap 意外变成 active filter，影响原应用；
5. 旧请求结果与新输入串线；
6. API Key 泄漏到设置、日志或崩溃报告；
7. 恶意或异常 AX provider 返回超大或畸形值。

### 20.2 控制

- secure role/subrole 与 Secure Event Input 双重拒绝；
- 只观察 focused editable element；
- 每次请求执行长度上限；
- provider payload 使用 allowlist 组装；
- event tap 类型在构造处固定为 listen-only；
- 生产代码静态禁止 AX write、event post 与 pasteboard；
- snapshot ID 与前台 element identity 双重匹配；
- Keychain-only credential；
- 诊断信息不含输入、prompt、完整响应或 Key。

## 21. 性能与资源

- AX notifications 优先，禁止全局高频轮询。
- 只有当前 profile 明确需要时才启用有界轮询，并在 focus/app 变化时停止。
- event-tap callback 只复制小型事件元数据并立即返回。
- panel 只有一个实例，不为每次确认创建窗口。
- 同时最多一个模型请求。
- 输入快照只保留当前 focused element 的最新值。
- panel render 与网络状态更新合并到单一 app state，避免 SwiftUI/AppKit 双状态循环。

## 22. 验证策略

### 22.1 Core parity

权威上游固定为 tag `v0.4.1` 指向的 commit [`e2d0f679abac26597c04777f07a7685b468e3432`](https://github.com/mackt/pi-language-tutor/commit/e2d0f679abac26597c04777f07a7685b468e3432)。使用以下可恢复基线：

- [`test/core.test.ts`](https://raw.githubusercontent.com/mackt/pi-language-tutor/e2d0f679abac26597c04777f07a7685b468e3432/test/core.test.ts)，SHA-256 `fc5a46f0f46e67d7e3c7e3f8e18cb9babb21dd81f07a704b31b76078b93a8f6b`；
- 上游 `src/core.ts` 与已安装 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/core.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/core.ts) 一致，SHA-256 `e1512271574e1d2f655ff04b4e7eea9b7b7261f47e04781a16e2b0ceea7c8c88`；
- 上游 `src/grammar.ts` 与已安装 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts) 一致，SHA-256 `a7022c2ce5199a4b914ee292236027ca5688f701632cf46fbce6577886ce1f8b`。

从该固定测试冻结以下 fixture；它们证明领域 core 对不超过 1,500 字符 snapshot 的 parity，而不证明 AX 读取前的完整原文 parity：

- `trim → skip/check` 输入分类；
- CJK 计数；
- `check | tutor | skip` JSON 解析；
- malformed/legacy payload；
- words/grammar 数量上限；
- prompt 内容与 1,500 字符剪裁。

Swift 结果必须与这些 fixture 一致。平台集成 fixture 另覆盖“原始输入以超过 1,500 个空白开头后跟有效文本”和“有效文本后跟超长空白”：前者必须返回 `truncatedBeforeContent`，后者只分析有界窗口。该预期明确记录隐私边界与 Pi 完整输入行为的差异，不能被标成 core parity 通过。

### 22.2 平台单元验证

- fake AX element 覆盖 supported、notEditable、secure、missingAttribute、notificationUnsupported、cannotComplete、staleElement 与 oversized value，并证明长值不会先经 `AXValue` 进入内存；
- snapshot coordinator 覆盖 app/focus identity、freshness 与 stale signal；
- confirmation matcher 覆盖 modifier、allowlist 与 profile 降级；
- panel reducer 覆盖 stale response；
- settings migration 与 Keychain error 分类。

### 22.3 Provider 验证

使用可控 mock server 检查：

- endpoint URL 不追加路径、POST method、headers、model、messages 与 `stream=false`；
- Key 为空/非空；
- 401、429、500、超时和 malformed JSON；
- 301/302/303/307/308 的同源、跨源及 HTTPS→HTTP redirect 均被拒绝，mock 只观察到一次请求；
- 取消和迟到响应；
- payload 不含 bundle identifier、历史文本或无关 AX 属性。

### 22.4 不干扰验证

为测试宿主准备标准 `NSTextField`、`NSTextView` 和提交型输入框。分别在监听关闭和开启时执行相同输入序列，并比较：

- 最终 text value；
- selection；
- undo/redo；
- Return/Shift+Return 行为；
- source action 调用次数；
- focused application 与 key window；
- 剪贴板 change count。

任何差异都阻塞 MVP 验收。

### 22.5 手工兼容矩阵

至少覆盖：

- TextEdit；
- Notes；
- Safari 与 Chrome 的 input、textarea、contenteditable；
- VS Code/Monaco；
- Xcode source editor；
- Terminal 与 iTerm2；
- 一个 Electron 聊天输入框；
- 密码框；
- 中文拼音与日文 IME；
- 多显示器、Space 切换与全屏应用。

每项记录：capture capability、输入边界、显式确认、自动 Enter、panel 焦点、源应用行为差异和安全结果。

## 23. 验收标准

MVP 只有在以下条件全部满足时才完成：

1. 首次启动显示唯一 panel；除用户显式隐藏外持续可见，隐藏/恢复与重启语义符合 `panelIsVisible`，位置在屏幕变化后保持可达。
2. 自动观察路径不激活应用、不移动 panel、不改变源应用焦点；显式 panel control 也通过 nonactivating 验证。
3. 标准原生测试控件可以得到正确的有界输入快照；超过 1,500 字符的控件不会先读取完整 `AXValue`。
4. 显式确认通过确认后的有界读取或 identity-matched 快照得到稳定文本。
5. 自动 Enter 只在逐 profile 的最后字符、清空、IME 和 AX 延迟场景全部验证后启用；未证明时保持 disabled，不计入通用兼容承诺。
6. Event tap 固定为 session/head-insert/listen-only/key-down/独立 run loop，原始 event 始终不变地到达源应用。
7. 监听开关前后源应用文本、selection、undo、换行、提交和快捷键行为相同。
8. secure field 与 Secure Event Input 不产生模型请求或残留快照。
9. AX error taxonomy、一次 transient retry、element invalidation 与 notification fallback 均有确定性验证。
10. Writing check 与 Writing tutor 的固定 commit、hash 与核心 fixture 可恢复；不超过 1,500 字符 snapshot 与 0.4.1 一致，超长边界空白按已记录平台差异验收。
11. API Key 只存在于 Keychain；wire fixture 证明 endpoint、headers、body、response、HTTPS/loopback 与拒绝所有 HTTP redirect 的策略唯一。
12. 新确认取消旧请求，迟到响应不能覆盖当前 panel。
13. 不支持控件显示明确状态，不使用剪贴板或合成事件绕过。
14. 兼容矩阵按自动、显式或不支持给出可复现证据。

## 24. 实施阶段

### 阶段 0：行为基线

- 固定 commit `e2d0f679abac26597c04777f07a7685b468e3432`、三份 SHA-256 与 raw test URL；
- 导入 trim、JSON 截取、bounded-snapshot parity 与超长边界空白差异 fixture；
- 记录 MIT notice；
- 建立禁止 API 的静态检查。

### 阶段 1：平台可行性闭环

只实现最小宿主：

- 持久 nonactivating panel；
- Accessibility trust；
- 读取前先定界的 focused editable range；
- 固定 session/head-insert/key-down/run-loop 合同的 listen-only confirmation；
- AX error taxonomy 与 notification fallback；
- panel 显式 control 和 profile-limited 自动 Enter 的竞态验证；
- TextEdit 测试宿主；
- 不干扰对比。

若阶段 1 无法证明显式确认既取得有界正确文本又保持源事件、焦点和剪贴板不变，停止后续产品实现并重新评估触发语义。自动 Enter 无法证明因果完整性时只关闭该 profile 能力，不阻塞显式确认 MVP。

### 阶段 2：领域与 provider

- 移植 review policy、prompt 和 decoder；
- 按固定 HTTP wire contract 接入 OpenAI-compatible client，并通过非 background URLSession delegate 拒绝所有 redirect；
- 完成 Keychain、HTTPS/loopback/redirect policy 与 mock server；
- 串联 latest-wins panel state。

### 阶段 3：应用 profile 与兼容矩阵

- 实现通用 profile；
- 加入用户启用/验证流程；
- 覆盖 Web、Electron、IDE、Terminal 与 IME；
- 对不稳定 profile 自动降级。

### 阶段 4：发布准备

- Developer ID 签名与权限重置验证；
- 隐私说明与网络披露；
- 多显示器、Spaces、睡眠唤醒与重启恢复；
- 完整验收矩阵。

## 25. 后续候选

只有 MVP 验收后才讨论：

- FSRS 与现有 Pi 卡库的一次性导入；
- 本地模型；
- 经显式同意的短上下文；
- 更多 application profiles；
- panel 历史；
- Mac App Store 可行性；
- 浏览器扩展或编辑器插件作为高保真补充。

这些项目不应提前改变 MVP 的只读、不干扰边界。

## 26. 未决但不阻塞的问题

- 最终产品名和 bundle identifier；
- 显式旁路组合键的默认值；
- 首批内置 application profile 名单；
- panel 默认尺寸和视觉样式；
- 是否在第二阶段加入 FSRS。

这些选择不会改变本文的系统边界。实现阶段可以通过最小原型或用户设置决定。

## 27. 权威来源

### 本地源码

- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/package.json"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/package.json)
- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/core.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/core.ts)
- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/grammar.ts)
- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/llm.ts"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/src/llm.ts)
- [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/LICENSE"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor/LICENSE)

### 平台资料

- [Apple Accessibility Model](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXmodel.html)
- [AXUIElementCreateSystemWide](https://developer.apple.com/documentation/applicationservices/1462095-axuielementcreatesystemwide)
- [AX selected text](https://developer.apple.com/documentation/applicationservices/kaxselectedtextattribute)
- [Monitoring Events](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/MonitoringEvents/MonitoringEvents.html)
- [Quartz Event Services](https://developer.apple.com/documentation/coregraphics/quartz-event-services)
- [Using Secure Event Input Fairly](https://developer.apple.com/library/archive/technotes/tn2150/_index.html)
- [InputMethodKit](https://developer.apple.com/documentation/inputmethodkit)

## 28. Target 追踪

| Target | RFC 证据 |
|---|---|
| T1：源码提取边界 | §2、§8、§13、§22.1、§27 固定 0.4.1 模块职责、commit、测试 URL 与哈希。 |
| T2：持久 panel 与同等语言能力 | §7、§9、§12、§13、§14、§23 定义 panel 生命周期、review 语义和 provider 合同。 |
| T3：所有编辑场景的可达范围 | §10、§11、§16–§19、§22 明确有界 AX 能力、权限、profile、矩阵和降级。 |
| T4：不影响源应用 | §7.2、§10.4、§11.3、§20、§22.4、§23 规定只读 API、原事件返回与差异验收。 |
