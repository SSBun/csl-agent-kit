---
name: macos-swiftui-appkit
description: Design, implement, refactor, or review native macOS SwiftUI and AppKit UI using desktop scene, window, state, and interop rules.
when_to_use: Use when designing, implementing, refactoring, or reviewing native macOS SwiftUI/AppKit scenes, windows, sidebars, inspectors, menus, settings, menu bar extras, Liquid Glass, or SwiftUI-AppKit bridges.
version: 1.0
update_date: 2026-08-01
globs:
  - "**/*.swift"
do_not_use_when:
  - The task targets only iOS, iPadOS, watchOS, tvOS, visionOS, or Catalyst and has no desktop-specific requirements.
  - The task only performs compilation, test execution, debugging, code signing, packaging, notarization, or release operations.
  - The task concerns only API naming, formatting, import ordering, member ordering, or other local code style.
alwaysApply: false
---

# SOP: macOS SwiftUI 与 AppKit

## 1. 目的

指导 agent 设计、实现、重构或审查原生 macOS UI：先建立清楚的 scene、window 和 state ownership，优先使用 SwiftUI 的桌面能力，只在明确缺口处加入最小 AppKit bridge，并以系统行为、可访问性和部署兼容性约束视觉定制。

## 2. 适用范围

适用：

- `WindowGroup`、`Window`、`Settings`、`MenuBarExtra`、`DocumentGroup` 等 macOS scene。
- sidebar/detail/inspector、commands、menus、toolbars、settings、menu bar utility。
- 窗口 chrome、drag region、placement、restoration、material 和 Liquid Glass。
- `NSViewRepresentable`、`NSViewControllerRepresentable`、`NSWindow`、`NSPanel`、responder chain、pasteboard 等 SwiftUI/AppKit 边界。
- 保持行为不变的 macOS SwiftUI view/scene 结构重构。

不适用：

- 只处理 build、test 或 debug；使用 `macos-build-run-debug`。
- 只处理 codesign/entitlement；使用 `macos-signing-entitlements`。
- 只处理 distribution packaging/notarization；使用 `macos-packaging-notarization`。
- 只处理 Logger/OSLog instrumentation；使用 `macos-unified-logging`。
- 只处理 release 或 App Store Connect。
- 非原生 macOS UI；包括只涉及 iOS/iPadOS/watchOS/tvOS/visionOS 的界面。
- 只处理 API 命名或局部代码风格；分别使用 `swift-api-design` 或 `code-style` SOP。
- 像素级视觉稿生成、品牌设计系统创建或桌面 UI 自动化。

## 3. 使用方式

1. 确认目标是原生 macOS，并从项目配置或源码确认最低部署版本；不要根据最新 SDK 猜测可用 API。
2. 阅读 `@main` app、相关 scene/root view、直接状态拥有者和必要调用点，先说明当前窗口角色、状态归属和交互入口。
3. 按任务只读取需要的 reference：

   | 任务 | 必读 reference |
   | --- | --- |
   | scene、sidebar、inspector、commands、settings、menu bar、state 或 view refactor | `references/macos-swiftui-appkit/scene-architecture.md` |
   | window chrome、drag、placement、restoration、material、search、toolbar 或 Liquid Glass | `references/macos-swiftui-appkit/windowing-and-visuals.md` |
   | representable、NSWindow/NSPanel、panel、responder/menu、pasteboard 或 drag/drop | `references/macos-swiftui-appkit/appkit-interop.md` |

4. 按“现有项目规则 → 标准 SwiftUI scene/control/window API → 最小 AppKit bridge → 必要的自定义视觉”顺序选择方案。
5. 只修改当前需求涉及的 scene、state、view 或 bridge；结构重构默认保持行为不变。
6. 使用项目已有的最小构建/运行入口验证编译和受影响交互；如需新建或诊断该入口，切换 `macos-build-run-debug`。
7. 任务同时涉及签名、公证或 telemetry 时，UI 决策仍由本 SOP 约束，对应流程分别使用 `macos-signing-entitlements`、`macos-packaging-notarization` 或 `macos-unified-logging`。
8. 用完成标准验收；无法直接观察 UI 时，明确写出未验证项，不把进程存在或日志事件当作视觉正确性。

## 4. 核心规则

### 4.1 Scene 与桌面交互

- 先选 scene model，再写 child view；主窗口、settings、utility window、document window 和 menu bar extra 必须有清楚职责。
- macOS 层级导航优先稳定的 sidebar/detail/inspector，不照搬触控设备的 push-only navigation。
- 重要动作应在 menu、toolbar、keyboard shortcut 或内容界面中可发现；不要只依赖 gesture。
- Settings 使用独立 `Settings` scene；窗口级临时状态与持久偏好必须分开。

### 4.2 State ownership 与结构

- 使用能表达真实生命周期的最窄状态范围：view-local、window/scene、app preference 或 shared service。
- SwiftUI 与 AppKit 之间只保留一个 source of truth；AppKit delegate/coordinator 不得演化成第二套状态架构。
- selection 改变时保持根布局稳定，在 detail/inspector 内切换内容；不要频繁替换整棵 root view。
- 非平凡应用按 app entry、views、models、stores、services 和 support 职责拆分，但不为单个小 view 创建无意义层级。

### 4.3 SwiftUI 优先，AppKit 最小化

- SwiftUI 已提供 scene、commands、toolbar、inspector、window modifier 或标准 control 时，不创建 AppKit wrapper。
- 需要 AppKit 时，先准确命名 SwiftUI 缺失的能力，再选择最小 bridge type。
- SwiftUI 拥有 value state、selection 和 observable model；AppKit object 留在 representable、coordinator 或专用 bridge 内。
- 不把 `NSView`、`NSWindow` 或 coordinator 传播到无关 view，也不为一个 panel 或 drop target 把整个页面迁移到 AppKit。

### 4.4 Window 与视觉

- 先按窗口角色决定 title/toolbar、drag、resize、restoration、placement 和 launch behavior。
- 隐藏 title 或 toolbar 时仍保留有意义的逻辑标题、可用 drag region 和可访问的关闭/移动路径。
- 系统 material、semantic color、toolbar、search 和标准 control 优先于自绘 chrome、固定亮色背景或自制 blur。
- Liquid Glass 只用于系统结构无法覆盖的产品特定 surface；相关元素必须正确分组，并检查 SDK availability。

### 4.5 可用性与验证

- 同时考虑 pointer、keyboard、menu、multiwindow、Light/Dark mode 和 accessibility。
- 新 API 必须符合 deployment target；否则使用 availability guard、可接受的旧 API 或窄 AppKit fallback。
- 进程启动、`pgrep` 或日志只证明执行路径，不证明窗口层级、焦点、布局或视觉效果。
- 不为了 SOP 一致性覆盖项目已有且已验证的 scene、state 或 build 约定。

## 5. 冲突处理

| 冲突 | 处理方式 |
| --- | --- |
| 明确项目规则与本 SOP 冲突 | 采用项目规则。 |
| deployment target 与推荐 SwiftUI API 冲突 | 兼容性优先；使用 availability guard、旧 API 或最小 AppKit fallback。 |
| SwiftUI 标准能力与 AppKit 自定义实现都可行 | 选择能完整满足行为的最小 SwiftUI 方案。 |
| 系统桌面惯例与明确产品设计冲突 | 保留明确产品要求，但仍满足可访问性、窗口可操作性和状态一致性。 |
| 结构重构可能改变用户行为 | 默认停止行为改动，只完成可证明等价的结构调整；行为变化需用户明确要求。 |
| 局部项目结构与 reference 默认结构冲突 | 采用稳定局部结构，不为统一目录而扩大改动。 |

## 6. 异常处理

| 场景 | Agent 行为 |
| --- | --- |
| deployment target 无法确认 | 先查项目配置；仍不明确时，不引入可能不兼容的新 API，并将该决策标为待确认。 |
| SwiftUI 是否能满足需求不明确 | 构造最小行为需求，先查 scene/window/control API；只有确认缺口后才进入 AppKit reference。 |
| 现有项目以 AppKit 为主 | 不强制迁移到 SwiftUI；只在用户要求的边界采用 SwiftUI，并保持现有 lifecycle 和 state ownership。 |
| 无法自动观察 UI | 完成编译和可执行路径验证，列出需要人工检查的窗口、焦点、布局和视觉项。 |
| 任务同时涉及构建、签名、公证、telemetry 或发布 | 本 SOP 只约束 UI 改动；按职责使用 `macos-build-run-debug`、`macos-signing-entitlements`、`macos-packaging-notarization`、`macos-unified-logging` 或项目现有 release 流程。 |

## 7. 完成标准

- [ ] 已确认原生 macOS scope、最低部署版本和目标窗口角色。
- [ ] 已读取 `@main` app、相关 scene/root view、状态拥有者和必要调用点。
- [ ] 已按任务读取所有相关 reference，未加载无关 reference。
- [ ] scene model、state ownership、selection 和 action route 清楚且只有一个 source of truth。
- [ ] 已优先使用能完整满足需求的标准 SwiftUI 能力。
- [ ] AppKit bridge 只覆盖已确认的能力缺口，且 lifecycle/data flow 明确。
- [ ] 窗口仍可移动、关闭、激活并通过 keyboard/menu 发现重要动作。
- [ ] system material、semantic color、Light/Dark mode、accessibility 和 API availability 已检查。
- [ ] 重构未擅自改变行为，改动未扩展到无关文件或构建/发布流程。
- [ ] 已运行项目已有的最小相关验证，并明确区分编译、运行证据与人工 UI 验证。

## 8. 来源

本 SOP 改编自 OpenAI `build-macos-apps` 插件 commit `11c74d6ba24d3a6d48f54a194cd00ef3beea18f9` 的 `swiftui-patterns`、`appkit-interop`、`window-management`、`view-refactor` 与 `liquid-glass`，并按规则型 SOP 重新组织：

- https://github.com/openai/plugins/tree/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills
- https://developers.openai.com/codex/use-cases/native-macos-apps
- https://developers.openai.com/codex/use-cases/macos-sidebar-detail-inspector
