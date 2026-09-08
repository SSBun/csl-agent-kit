# 实现 Perch macOS 语言学习应用

Status: In Progress (2026-09-08 13:47)
Kind: Plan

## Scope

- 包含：依据已确认 RFC，在用户指定的 Perch 目录中实现并验证独立原生 macOS MVP；以已安装的 `pi-language-tutor` 0.4.1 为行为基线，覆盖跨应用文本获取、混合确认触发、持久悬浮面板、OpenAI-compatible 模型接入、权限、隐私和验收矩阵。
- MVP 包含对已确认输入执行 Writing check、Writing tutor 与翻译；面板持续悬浮在屏幕上，应用只观察当前 focused editable control 暴露的输入内容与确认信号，并保持“请求不阻塞当前编辑、check/tutor 互斥、失败不影响源应用”的产品语义。
- MVP 不包含 FSRS 记忆卡片、assistant 输出监控、Pi 会话上下文复放、逐键文本重建、OCR、InputMethodKit 输入法、剪贴板改写、合成按键、自动改写源文本、Mac App Store 分发或插件源码修改；这些边界可在核心闭环验证后另行规划。
- 密码框、Secure Event Input 和拒绝暴露文本的自绘控件不做捕获；无法只读取得输入时显示“不支持当前控件”，不通过复制、粘贴、AX 写入或事件注入绕过。

## Target

- [ ] T1: 方案基于当前安装的 Pi 本地语言学习插件源码，明确可提取的核心能力、依赖与独立应用边界。
- [ ] T2: 方案定义可实现的 macOS 架构与 MVP，使持久悬浮在屏幕上的 panel 只观察用户输入内容与确认信号，并执行与 Pi 插件一致的翻译和语言解析。
- [ ] T3: 方案明确“适配所有编辑场景”的可达范围、系统权限与平台限制，并给出兼容策略和可验证的验收边界。
- [ ] T4: 方案保证应用不消费、抑制、重写、注入或重新提交源应用的文本与输入事件，源应用的焦点、编辑和确认逻辑保持不变。
- [ ] T5: 用户指定目录中存在可由 Xcode 构建并启动的原生 macOS MVP，应用启动后显示单实例持久悬浮 panel，并可从菜单栏管理显示、暂停、设置与退出。
- [ ] T6: Panel 在自动观察和结果更新期间不激活应用、不抢占源应用焦点、不随输入跳动；用户位置与显隐状态可恢复，并在屏幕拓扑变化后保持可达。
- [ ] T7: 应用通过只读、有界 Accessibility 路径观察当前 focused editable control，并通过固定 listen-only event tap 观察显式确认及已验证 profile 的 Enter；安全输入与不支持控件不会发送文本。
- [ ] T8: OpenAI-compatible 后端可配置且凭据存入 Keychain；确认后的输入按 0.4.1 bounded-snapshot 合同产生 check、tutor 或 skip，旧请求结果不能覆盖新快照。
- [ ] T9: 可复现验证证明监听开启前后源应用的文本、selection、undo、换行、提交、快捷键和焦点行为不变，且实现不存在 AX 写入、事件注入/抑制或剪贴板路径。

## Decisions

- 源码基线固定为已安装包 [`"/Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor"`](file:///Users/caishilin/.pi/agent/npm/node_modules/pi-language-tutor) 0.4.1，并以 tag `v0.4.1` 的 commit `e2d0f679abac26597c04777f07a7685b468e3432`、上游测试 URL 和已核对 SHA-256 提供可恢复 fixture。`src/core.ts` 的配置、结果类型、跳过规则、提示词和解析是移植真相源；其余模块依赖 Pi、Node、TUI 或 Glimpse，不能直接链接到原生应用。MIT 许可允许改写和分发，但复制实质部分时保留版权与许可文本。
- 采用原生 Swift 6 + SwiftUI 应用壳，最低部署目标默认 macOS 14；只在 SwiftUI 缺少非抢焦点浮动面板、跨应用 Accessibility 与全局事件能力处使用窄 AppKit/Core Graphics bridge。应用以 `MenuBarExtra`、独立 `Settings` scene 和单一持久 `NSPanel` 组成，默认 accessory/no-Dock 运行；panel 首次启动可见、可由用户拖动并按 display 保存位置，除用户显式隐藏外保持可见且不随输入跳动，隐藏/恢复状态跨重启保存。
- 不采用“Swift 壳 + Node sidecar”或 Electron/Glimpse 方案：前者保留运行时、进程、签名和升级负担，后者不能减少 Accessibility/事件监听工作且削弱原生窗口行为。TypeScript 核心按现有测试契约等价移植为 Swift，而不是嵌入 JavaScript 运行时。
- “所有编辑场景”定义为分层兼容而不是无例外自动捕获：标准 AppKit/Web 可访问控件走通用 Accessibility；Electron、IDE、终端等先走同一只读路径，再由按 bundle identifier 启用的应用配置补充确认语义；不暴露语义输入的自绘/远程画布与安全输入明确不支持，不使用侵入式回退。
- 用户已选择混合确认，但所有触发都必须是旁路观察：event tap 固定为 `kCGSessionEventTap`、`kCGHeadInsertEventTap`、`kCGEventTapOptionListenOnly`、仅 key-down mask 和独立串行 run loop；它被动识别显式组合键及用户启用 profile 的 `Return/Enter`，原样返回事件。自动 Enter 是逐 profile 因果验证后才能启用的 best-effort 增强；显式组合键与 nonactivating panel control 承担基线确认。
- Accessibility observer 只跟踪 focused editable control 并在内存保留最近有界快照，不根据 key code 重建文字。读取文本前先验证权限、role、secure 状态、profile、selection range 与字符数，优先使用 `AXStringForRange`，硬上限为 1,500 字符；无法在 AX 边界确定安全范围时返回 unsupported，禁止先读取完整长 `AXValue` 再裁剪。
- `AXUIElementCreateSystemWide`、focused element、selected text range、number of characters、string for range 与 AX notifications 构成只读捕获层；实现禁止调用 AX setter/action、`CGEventPost`、剪贴板或事件抑制，并确定性区分 permission、attribute/notification unsupported、cannotComplete、stale element 与 internal failure。Secure Event Input 开启或 focused element 为 secure text field 时立即丢弃快照。
- `NSPanel` 使用 nonactivating/floating 行为，固定悬浮于用户选择的 display 和位置，并可跨普通 Space 保持可见；监控、分析中、结果、无权限和不支持状态都在同一 panel 内切换。panel 不因结果出现而移动、激活或成为 key window，新结果按 snapshot ID 丢弃过期响应。
- 用户已选择 OpenAI-compatible 后端。MVP 保存完整 Chat Completions endpoint URL，不追加路径；固定 POST、JSON headers/body、可选 Bearer Key、`stream=false` 与 `choices[0].message.content` 响应合同。远程仅 HTTPS，明文 HTTP 仅允许 loopback；非 background URLSession 必须拒绝所有 HTTP redirect，确保只有配置 endpoint 接收文本。API Key 存 Keychain，其余字段存普通设置。
- 领域流水线只处理确认时冻结且已在 AX 边界限制为 1,500 字符的输入快照，再执行 `trim → shouldSkipCheck → buildReviewPrompt`，并保持“首个 `{` 至末个 `}`”JSON 截取、`check | tutor | skip` 单调用路由、latest-wins 取消、最多 5 个纠错/词汇和 3 个语法项。对原始超长前导空白，先有界读取再 trim 是隐私优先的显式平台差异，不宣称完整 Pi parity；不读取 assistant 输出。
- MVP 初始按 Developer ID 站外分发、关闭 App Sandbox 规划；若后续要求 Mac App Store，先独立验证 sandbox、Accessibility 和 event-tap 审核边界，不把当前方案直接宣称为可上架。
- 权限与能力依据当前本机 macOS 26.2 SDK 的 ApplicationServices/CoreGraphics 头文件及 Apple Accessibility/Event 文档；SDK 明确 selected text/range 是 editable text element 属性、键盘 event tap 需要 assistive-device access，且 Secure Event Input 会阻止其他进程截获键盘事件。

## Plan

1. 以 [持久悬浮语言学习 Panel RFC](../artifacts/plan-pi-language-learning-macos-app/specs/2026-09-04-persistent-language-panel-rfc.md) 为执行依据，冻结 0.4.1 commit、源码/测试哈希、bounded-snapshot parity、超长边界空白差异、trim/skip/JSON 解析 fixture 与 MIT notice。
2. 建立原生应用壳与单一状态所有者：完成 menu bar、Settings、accessory activation policy、权限 onboarding，以及单实例、位置/显隐持久、跨 Space、nonactivating 的 `NSPanel` 生命周期。
3. 实现只读有界输入观察结果：Accessibility 层在读取前确定 selection/range 与 1,500 字符上限，定义 AX error taxonomy、一次 transient retry、element invalidation 和 notification fallback；代码路径不存在 AX 写入、剪贴板或合成事件。
4. 实现两种旁路确认结果：按固定 location/placement/options/mask/run-loop 创建 listen-only event tap，显式组合键和 panel control 承担稳定入口；自动 `Return/Enter` 只有通过最后字符、清空、IME 与 callback 延迟验证的 profile 才能启用。
5. 等价移植语言领域核心：完成 Swift 数据模型、跳过策略、prompt builders、宽容但有边界的 response decoder、Markdown 分段和双语卡片组装，并以 0.4.1 fixture 做差异验证。
6. 实现 OpenAI-compatible 模型边界：完整 endpoint URL、Keychain 凭据、HTTPS/loopback policy、固定 wire contract、拒绝所有 HTTP redirect、请求取消、超时与错误分类；使用可控 mock server 验证唯一请求目的地，不依赖真实消费型 API 做确定性检查。
7. 串联非阻塞协调器与持久 panel：每个确认信号冻结当前 input snapshot，再按插件输入侧语义路由到 check/tutor/skip，其中 tutor sentence 承担翻译；monitoring、loading、结果与错误均按 snapshot ID 原位更新，旧请求不能覆盖新输入。
8. 完成设置与安全边界：语言、模型、旁路组合键、自动 Enter 应用列表、暂停开关、panel display/位置可发现；不加入 OCR、输入法、手动复制粘贴捷径或自动替换文本。
9. 按控件技术而非只按品牌验收：覆盖 `NSTextField`、`NSTextView`、浏览器 input/textarea/contenteditable、Electron/Monaco、IDE editor、Terminal、长文档、自绘 canvas、远程桌面、密码框、中文/日文 IME、多个显示器和全屏空间；同时比对源应用启用/停用监听前后的文本、焦点、换行、提交和快捷键行为，记录每类为自动、旁路组合键或明确不支持。
10. 通过 parity fixtures、provider mock、权限状态、焦点保持、剪裁边界、过期响应、网络 payload 与人工窗口矩阵后再决定第二阶段；第二阶段候选仅包括 FSRS/旧卡导入、更多应用配置、本地模型和显式同意的短上下文。

## Review
- Schema: task-review-ledger/v1
- Pass: 10
- Next finding: 21
- `TR-18` | no-progress=0 | Perch verification | TCC、验证生命周期、Return 前历史快照、1.2 秒延迟清空 fixture 及受 1,500 字符边界约束的直接 AXValue 空值 fallback 已有实现与 smoke/build/analyze evidence；仍需用户授权测试后补足 parity、fake AX、redirect、latest-wins、设置迁移和真实 Chatwise/源应用不干扰的确定性证据。

## Result

- Review gate: Required — 修复 Chatwise 可见清空但 AX range 状态滞后的判定：新增受 1,500 字符上限、secure role、editable 和精确 focus 约束的只读 AXValue 空值检查，作为提交确认第二证据；build/analyze/静态禁止 API 与文本检查通过，运行 event-tap 线程存在，待用户在真实 Chatwise 重试。
