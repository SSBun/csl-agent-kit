# macOS SwiftUI Window 与 Visual Rules

仅在任务涉及 window chrome、drag、placement、restoration、launch behavior、toolbar/search、system material 或 Liquid Glass 时读取。

## 1. Availability 先于实现

1. 从项目配置确认 deployment target 和当前 Xcode/SDK。
2. `window-management` 来源中的 scene/window customization 主要面向 macOS 15+；旧系统需要 availability guard、旧 API 或 AppKit fallback。
3. Liquid Glass API 不得根据名称猜测最低系统版本；逐个 symbol 检查 SDK availability。
4. 如果项目必须支持旧系统，先定义可接受的降级行为，再选择 modifier 或 bridge。

## 2. 按窗口角色选择行为

先把窗口归类为主导航、document、utility/inspector、About/support、welcome、media/player 或 borderless custom surface，然后分别决定：

- title 是否显示，但逻辑 title 始终有意义；
- toolbar 是否可见、是否需要 system background；
- 是否允许 minimize、resize、zoom 与 restoration；
- 初次 launch 是否 presented；
- 新窗口默认位置和用户执行 Zoom 时的 ideal placement；
- 是否值得放弃标准 titlebar affordance。

主导航/document window 默认保留 restoration；About、support、transient welcome 等窗口只有在行为明确时才禁用。

## 3. Title、Toolbar 与 Drag Region

1. 只想隐藏视觉 title 时，保留有意义的逻辑 title，使用相应 toolbar/title modifier。
2. 隐藏 toolbar background 或整个 toolbar 后，必须补回可靠的拖动区域。
3. drag overlay 只能覆盖非交互 header/background，不得截获 button、video control、text selection 或 scroll gesture。
4. 后台窗口需要 click-then-drag 时，保证 activation 与 drag 同时可用。
5. borderless/plain window 必须仍有明显 move 和 close 路径。

## 4. Placement、Resize 与 Display

1. 新窗口的 default placement 与用户触发 Zoom 的 ideal placement 是两套策略，不要混用。
2. 内容尺寸来自实际 content fitting，不硬编码一台显示器的尺寸。
3. 位置和尺寸以当前 display 的 visible rect 为边界，考虑 menu bar、Dock、外接屏和旋转/窄屏。
4. media window 保持 aspect ratio，并限制在可见区域。
5. 固定尺寸 utility window 才考虑限制 zoom/resize；主内容窗口不应无故锁死。

## 5. System Material 与桌面 Chrome

1. system-adaptive color、semantic foreground、native sidebar/window material 优先。
2. 不默认给 `NavigationSplitView` sidebar、toolbar、sheet 或 root pane 添加固定白色、opaque fill、额外 blur 或 dark scrim。
3. 先删除与系统 material 冲突的旧 chrome，再判断是否仍需要自定义 surface。
4. 自定义背景只服务明确产品需求，并同时检查 Light/Dark mode、contrast、window activation 和 scroll-edge 行为。

## 6. Toolbar 与 Search

1. toolbar item 默认由系统组合在桌面 chrome 中；按相关性分组，不自绘整条 toolbar background。
2. 用 system spacing/grouping API 表达 group；不要只靠任意 padding 模拟。
3. icon tint 只表达 primary、status、warning 等语义，不为装饰给每个 icon 上色。
4. search 覆盖整个 split hierarchy 时，将 `searchable` 放在拥有该范围的 container。
5. secondary search 优先使用系统 toolbar behavior，不手工同步一套 button + field state。
6. dense inspector/popover 通过合适 control size 保持密度，不牺牲可点击区域和 accessibility。

## 7. Liquid Glass

1. 先采用系统 scene、toolbar、sheet、search 和 standard control；只有产品特定 surface 才使用 custom glass。
2. custom glass shape、tint 和 interactivity 必须有功能含义，不只追求视觉变化。
3. 相邻且需要一致折射的 custom glass element 放入同一个 `GlassEffectContainer`。
4. morphing transition 使用稳定 identity、namespace 和对应 glass effect id。
5. capsule 不是所有 surface 的默认答案；shape 应与内容、container 和交互匹配。
6. 不把 iPhone tab/search 行为强行套到 Mac；优先 desktop toolbar、split view 和 inspector。

## 8. 验证清单

- 窗口可从后台激活、移动、关闭，并保留预期的 minimize/zoom/restore 行为。
- title、menu 与 accessibility 仍能识别窗口。
- pointer、keyboard、toolbar、menu 和 scroll interaction 未被 overlay 截获。
- 新窗口在主屏、外接屏和较小 visible rect 中不会出界。
- Light/Dark mode、contrast、semantic tint 和 system material 均可接受。
- 自定义 glass 不与 sidebar、toolbar、sheet 或相邻 glass container 冲突。
- 所有新 API 与 deployment target 相容；降级路径已验证或明确记录。
- 仅有 build/process/log 证据时，不声称视觉验证通过。

## 9. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/window-management/SKILL.md
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/window-management/references/api-snippets.md
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/liquid-glass/SKILL.md
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/swiftui-patterns/SKILL.md
