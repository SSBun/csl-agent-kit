# macOS SwiftUI Scene、State 与 View Architecture

仅在任务涉及 scene、sidebar/detail/inspector、commands、settings、menu bar、state ownership 或 view refactor 时读取。

## 1. 先选 Scene Model

| 需求 | 默认选择 | 边界 |
| --- | --- | --- |
| 可有多个独立窗口实例 | `WindowGroup` | 每个窗口保留自己的 scene/window state。 |
| 启动时出现的主窗口，尤其同时存在 `MenuBarExtra` | 带稳定 id 的 `WindowGroup` | 不要只依赖按需出现的 singleton `Window`。 |
| 单例 utility、About、support 或 inspector window | `Window` | 不把主导航窗口误建成只按需出现的辅助窗口。 |
| 应用偏好 | `Settings` | 不把全局偏好塞进主内容 push stack。 |
| 文档驱动应用 | `DocumentGroup` | 文档 lifecycle 和 window ownership 必须由文档模型决定。 |
| 轻量状态/快捷操作 | `MenuBarExtra` | 深层工作流打开专用窗口，不把完整应用塞进 menu。 |

规则：

1. `@main` app 只负责 scene composition 和必要的 app delegate 接线。
2. 每个 scene 都要能说明窗口角色、打开方式、状态归属和恢复策略。
3. 主窗口、settings、utility window 和 menu bar extra 不共享一堆无边界 global state。
4. menu-bar-plus-window app 需要普通 Dock/前台行为时，明确设置 activation policy；若有意做 accessory/no-Dock app，也要把它作为产品决定记录。

## 2. State Ownership

| 生命周期 | 默认工具 |
| --- | --- |
| view-local control state | `@State` |
| child 修改 parent-owned value | `@Binding` |
| macOS 14+ root-owned `@Observable` reference | owner view 中的 `@State` |
| child 使用注入的 observable model | 显式 stored property |
| window-scoped selection、expansion、inspector visibility | 优先 `@SceneStorage`，否则 scene-owned `@State` |
| 持久用户偏好 | `@AppStorage` |
| app-wide service/configuration | typed `@Environment` |
| 旧 deployment target 的 reference model | owner 用 `@StateObject`，child 用 `@ObservedObject` |

判断顺序：先确定 owner 和 lifecycle，再选择 property wrapper；不要因为状态稍复杂就默认增加 view model。

## 3. Sidebar、Detail 与 Inspector

1. hierarchy-driven macOS UI 优先 `NavigationSplitView` 和显式 selection。
2. selection 改变时保持 split/root layout 稳定，只替换 detail 或 inspector 内容。
3. sidebar row 保持 source-list 密度：最多一个 leading icon、一个主标题和一个可选 secondary line。
4. card、指标、计数、时间和密集 metadata 放在 detail/inspector，不堆进每个 sidebar row。
5. sidebar 和 split container 默认保留系统 background；自定义 surface 放在真实内容卡片中。
6. 轻量次级控制使用 inspector；不要把适合 inspector 的内容全部隐藏进 modal sheet。

## 4. Commands、Toolbar 与 Settings

1. app-specific command 放在 scene-level `commands`；需要 menu grouping 时使用 `CommandMenu` 或 `CommandGroup`。
2. context-sensitive command 优先通过 focused value、scene state 或显式 selection 路由。
3. 重要动作至少有一种可发现的 menu、toolbar、keyboard 或内容入口；gesture 不能成为唯一入口。
4. 同一 shortcut 只能有一个清楚 owner，不在多处重复注册。
5. Settings 使用独立 root view；持久偏好用 `@AppStorage`，按 tab/section/split 组织，不使用深层 push navigation。

## 5. Menu Bar Extra

1. 适合 status、轻量 utility 和快捷动作，不是完整 app window 的替代品。
2. item label 保持短且可扫描；可变文本建议不超过 30 个字符，完整内容进入窗口或 detail。
3. 同时有主窗口时，主窗口使用稳定 `WindowGroup(..., id:)`，由 menu action 通过 `openWindow(id:)` 打开或激活。
4. `.regular` 与 `.accessory` activation policy 必须是明确产品决定，不能把无 Dock/无前台误当成功能正常。
5. 需要高级 status item/menu validation 时才进入 AppKit reference。

## 6. View 与文件职责

非平凡应用优先保持以下职责边界，但已有项目的稳定目录结构优先：

- `App/<AppName>App.swift`：`@main` app 与必要的 `AppDelegate`。
- `Views/ContentView.swift`：根布局和高层 composition。
- `Views/*View.swift`：按 primary view type 拆分 feature UI。
- `Models/`：value model、identifier、selection enum。
- `Stores/`：持久化与 state store。
- `Services/`：network、process、app-server 和 platform client。
- `Support/`：小型 formatter、resolver、extension 与 glue。

拆分规则：

1. 约 50 行以内、单屏、无 persistence/network/process client/reusable model 的 throwaway sample 可以单文件。
2. 超过该边界时先按职责拆分，不把 app entry、views、models、stores、services 和 helpers 混在一个文件。
3. 优先独立 subview type，而不是堆叠大量 computed `some View` fragment。
4. child 只接收所需 data、binding 和 action，不把整个 scene model 无差别下传。
5. command、toolbar 和非平凡 action 从 `body` 的布局表达中抽离，但不为一个按钮创建多层抽象。
6. AppKit escape hatch 放在小 wrapper/helper 内，不传播到无关 SwiftUI view。

## 7. Refactor 约束

1. 先识别 scene boundary、state owner、selection flow 和 action route，再移动代码。
2. 默认只改变结构，不改变用户行为、窗口生命周期或状态持久性。
3. 根布局稳定性优先于“每个状态一个完全不同 root view”。
4. 大文件按职责分步拆分，每个主要拆分后运行最小编译验证。
5. 不删除既有兼容层或 AppKit bridge，除非已证明 SwiftUI 替代方案覆盖全部行为。

## 8. 常见错误

- 一个 `ContentView` 同时拥有 app entry、settings、toolbar、commands、sidebar、detail、services 和 persistence。
- 把 iOS push navigation 原样搬到需要长期可见 selection/detail 的 Mac 窗口。
- Settings 只是主窗口里的另一个 destination。
- sidebar row 使用大型 card、重复 utility icon 和多行 metadata。
- 以多个 boolean 表示互斥 selection、inspector 或 utility window 状态。
- menu bar extra 展示完整文档标题、prompt 或 message body。
- AppKit object 穿过多层 SwiftUI view，却没有明确 lifecycle owner。

## 9. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/swiftui-patterns/SKILL.md
- https://github.com/openai/plugins/tree/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/swiftui-patterns/references
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/view-refactor/SKILL.md
- https://developers.openai.com/codex/use-cases/macos-sidebar-detail-inspector
