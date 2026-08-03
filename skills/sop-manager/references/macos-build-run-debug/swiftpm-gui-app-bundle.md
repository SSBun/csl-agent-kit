# SwiftPM macOS GUI App Bundle Staging

仅在 `Package.swift` 产出 AppKit/SwiftUI GUI executable、但项目没有 Xcode app bundle 或等价启动流程时读取。本流程只创建项目本地 debug/run scaffold，不是 distribution package，不代表已正确 codesign 或 notarize。

## 1. 为什么不能只运行 Raw Executable

AppKit/SwiftUI GUI binary 直接从 `.build/...` 启动时可能缺少：

- `.app` bundle metadata 与 bundle identifier；
- Dock/foreground activation；
- 正确的 application lifecycle 环境；
- 与 bundle 相关的资源和系统行为。

因此正常本地启动路径是：

```text
swift build
    ↓
.build/.../<AppName>
    ↓ copy + Info.plist
dist/<AppName>.app/Contents/
    ↓
/usr/bin/open -n dist/<AppName>.app
```

## 2. 最小 Bundle Contract

```text
dist/<AppName>.app/
└── Contents/
    ├── Info.plist
    └── MacOS/
        └── <AppName>
```

`Info.plist` 至少包含：

| Key | 含义 |
| --- | --- |
| `CFBundleExecutable` | 与 `Contents/MacOS` 中 binary 名完全相同。 |
| `CFBundleIdentifier` | 稳定 reverse-DNS identifier。 |
| `CFBundleName` | app 名。 |
| `CFBundlePackageType` | `APPL`。 |
| `LSMinimumSystemVersion` | 与 package/deployment 约束一致。 |
| `NSPrincipalClass` | `NSApplication`。 |

有 resources、icons、embedded frameworks、helper 或 entitlement 时，按实际 app contract 增加；不要把这个最小 scaffold 误当 production bundle。

## 3. 最小项目脚本

仅当项目没有稳定等价入口时，按项目值改写：

```bash
#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
APP_NAME="MyApp"
BUNDLE_ID="com.example.MyApp"
MIN_SYSTEM_VERSION="14.0"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_BUNDLE="$ROOT_DIR/dist/$APP_NAME.app"
APP_CONTENTS="$APP_BUNDLE/Contents"
APP_MACOS="$APP_CONTENTS/MacOS"
APP_BINARY="$APP_MACOS/$APP_NAME"

pkill -x "$APP_NAME" >/dev/null 2>&1 || true
swift build
BUILD_BINARY="$(swift build --show-bin-path)/$APP_NAME"

rm -rf "$APP_BUNDLE"
mkdir -p "$APP_MACOS"
cp "$BUILD_BINARY" "$APP_BINARY"
chmod +x "$APP_BINARY"

cat >"$APP_CONTENTS/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>$BUNDLE_ID</string>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSMinimumSystemVersion</key><string>$MIN_SYSTEM_VERSION</string>
  <key>NSPrincipalClass</key><string>NSApplication</string>
</dict>
</plist>
PLIST

open_app() {
  /usr/bin/open -n "$APP_BUNDLE"
}

case "$MODE" in
  run)
    open_app
    ;;
  --debug|debug)
    lldb -- "$APP_BINARY"
    ;;
  --logs|logs)
    open_app
    /usr/bin/log stream --info --style compact \
      --predicate "process == \"$APP_NAME\""
    ;;
  --telemetry|telemetry)
    open_app
    /usr/bin/log stream --info --style compact \
      --predicate "subsystem == \"$BUNDLE_ID\""
    ;;
  --verify|verify)
    open_app
    sleep 1
    pgrep -x "$APP_NAME" >/dev/null
    ;;
  *)
    echo "usage: $0 [run|--debug|--logs|--telemetry|--verify]" >&2
    exit 2
    ;;
esac
```

只保留任务实际需要的 mode。若 app 有 bundle resources，优先复用 SwiftPM resource output 或项目已有 copy phase，不靠这个示例猜目录。

## 4. Activation Diagnosis

bundle 能 open 但没有前台窗口时，依次确认：

1. process 是否存活，是否立即 crash；
2. `@main`/AppKit application lifecycle 是否真的创建 scene/window；
3. app 是否有意使用 accessory/no-Dock policy；
4. product 需要普通 foreground app 时，entrypoint 是否需要：

```swift
NSApp.setActivationPolicy(.regular)
NSApp.activate(ignoringOtherApps: true)
```

不要无条件加入这两行；menu-bar-only accessory app 可能有意不激活为普通应用。

## 5. 验证边界

- `plutil -lint dist/<AppName>.app/Contents/Info.plist` 验证 plist syntax。
- `test -x dist/<AppName>.app/Contents/MacOS/<AppName>` 验证 executable。
- `/usr/bin/open -n ...` + `pgrep` 验证 launch/process path。
- 窗口可见、前台焦点、菜单、布局仍需实际观察。
- 本地 scaffold 不证明 Developer ID signing、Gatekeeper、notarization 或 production packaging。

## 6. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/build-run-debug/references/run-button-bootstrap.md
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/build-run-debug/SKILL.md
