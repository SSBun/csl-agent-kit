# macOS SwiftUI 与 AppKit Interop Rules

仅在 SwiftUI 已确认无法干净表达所需窗口、control、panel、responder、menu、pasteboard 或 drag/drop 行为时读取。

## 1. 先准确命名能力缺口

在写 AppKit 代码前，必须用一句话说明 SwiftUI 缺失的能力，例如：

- 需要特定 `NSTextView` 行为；
- 需要 `NSOpenPanel`/`NSSavePanel`；
- command enablement 依赖 first responder；
- 需要访问 backing `NSWindow` 的未暴露行为；
- 需要 custom pasteboard type 或 AppKit drop validation。

如果不能准确说出缺口，回到 SwiftUI scene/window/control API 继续检查；不要以“macOS 更原生”为理由默认使用 AppKit。

## 2. 选择最小 Bridge

| 缺口 | 默认 bridge | 不应升级为 |
| --- | --- | --- |
| 单个 AppKit view/control | `NSViewRepresentable` | 整页 AppKit rewrite |
| controller lifecycle、delegate 或 presentation coordination | `NSViewControllerRepresentable` | 第二套 navigation architecture |
| target-action/delegate glue | representable 的 `Coordinator` | 全局 service locator |
| open/save panel | 小型 `@MainActor` helper/service | 每个 view 各自配置 panel |
| backing window/utility panel | 窄 `NSWindow`/`NSPanel` helper | 全局保存所有 window instance |
| first responder/menu validation | focused SwiftUI state；不足时窄 responder bridge | SwiftUI closure 与 selector 混杂无 owner |
| custom pasteboard/drop validation | boundary adapter | AppKit type 穿透整个 domain model |

## 3. Ownership 与 Data Flow

1. SwiftUI 是 value state、selection、observable model 和 scene lifecycle 的 source of truth。
2. AppKit object 留在 representable、coordinator 或专用 bridge object 内。
3. SwiftUI → AppKit：只在值变化时更新，避免无条件回写和 update loop。
4. AppKit → SwiftUI：通过 binding 或小 callback 返回语义事件，不暴露整个 `NSView`/delegate。
5. coordinator 只保存 delegate、target-action 和必要 lifecycle glue；不拥有业务 store、network client 或第二份 model。
6. SwiftUI 可能重建 representable；不要把 view identity 当作永久 lifecycle。

## 4. Representable 规则

1. `makeNSView`/`makeNSViewController` 只创建和接线 AppKit object。
2. `updateNSView`/`updateNSViewController` 比较实际值后再同步，避免 cursor、selection、scroll position 或 delegate callback 循环。
3. delegate 与 target-action 放在 coordinator，并在 lifecycle 结束时正确解绑需要解绑的观察者。
4. wrapper 对 SwiftUI 暴露最小 data、binding 和 action surface。
5. wrapper 开始承担完整 feature、routing 或 persistence 时，停止扩张并重新评估边界。

## 5. Window 与 Panel

1. SwiftUI `Window`、`WindowGroup`、`Settings`、`openWindow` 和 window modifier 优先。
2. 只有 SwiftUI 未暴露的 titlebar、tabbing、floating panel 或 window lifecycle 行为才直接访问 `NSWindow`/`NSPanel`。
3. 普通 view 不持有长期 `NSWindow` reference；由 scene/window bridge 或专用 owner 管理。
4. `NSOpenPanel`/`NSSavePanel` 配置集中在小 helper/service，返回 URL 或用户取消，不让 AppKit 类型扩散到业务层。
5. panel 必须在 main actor 上运行，并明确 single/multiple selection、file/directory 和 allowed content type。

## 6. Responder、Commands 与 Menus

1. 先使用 SwiftUI `commands`、focused value 和 focused scene state。
2. 只有 enablement、validation 或 action routing 真正依赖 current first responder 时才使用 AppKit responder chain。
3. menu enablement 规则靠近它依赖的状态，不在多处复制。
4. 同一 command 不能同时由 SwiftUI closure 和 AppKit selector 各自拥有一半逻辑。
5. text/document 的系统 responder 行为应尽量保留，不用 custom global command 绕过。

## 7. Drag、Drop 与 Pasteboard

1. SwiftUI drag/drop 或 transferable API 能满足需求时留在 SwiftUI。
2. 需要 `NSPasteboard`、custom pasteboard type、legacy delegate 或高级 drop validation 时才进入 AppKit。
3. 文件 URL、UTType/pasteboard type 和外部输入必须显式验证。
4. data conversion 固定在 bridge boundary；domain model 不依赖 `NSPasteboardItem` 等 AppKit 类型。
5. 不为一个 drop target 把整个 list、canvas 或 feature 迁移到 AppKit。

## 8. 验证清单

- 能用一句话说明 SwiftUI 缺口和为何需要 AppKit。
- bridge type 是覆盖该缺口的最小类型。
- SwiftUI/AppKit 之间只有一个 source of truth，update 不会形成循环。
- coordinator 没有变成第二套业务架构。
- window/panel/responder object 有明确 owner 和 lifecycle。
- menu、keyboard、focus、selection、drag/drop 和 cancellation 路径已检查。
- AppKit 类型没有泄漏到无关 view、store 或 domain model。
- 未把局部 gap 扩大成整页 AppKit rewrite。

## 9. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/appkit-interop/SKILL.md
- https://github.com/openai/plugins/tree/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/appkit-interop/references
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/swiftui-patterns/SKILL.md
- https://developer.apple.com/documentation/swiftui/nsviewrepresentable
- https://developer.apple.com/documentation/swiftui/nsviewcontrollerrepresentable
