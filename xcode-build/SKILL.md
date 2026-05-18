---
name: xcode-build
description: Use when the user wants to build, run, or test iOS/macOS/watchOS/tvOS apps with Xcode or xcodebuild. Auto-detects project type and platform, handles simulators and real devices, and resolves common build errors.
---

## Project Detection

```bash
find . -maxdepth 2 \( -name "*.xcodeproj" -o -name "*.xcworkspace" -o -name "Package.swift" \) 2>/dev/null
```

If no `.xcodeproj` or `.xcworkspace` found, current dir is likely a component. **Ask user for root project path.**

### Platform Detection

```bash
xcodebuild -workspace "$(ls *.xcworkspace 2>/dev/null | head -1)" -list 2>/dev/null || xcodebuild -project "$(ls *.xcodeproj 2>/dev/null | head -1)" -list
```

Match scheme names against targets to determine platform: iOS, macOS, watchOS, tvOS.

## Device Selection

```bash
xcrun xctrace list devices
```

Filter by detected platform (`grep -i ios/macos/watch/appletv`). Present filtered list to user with one question:

> **Select target device** (simulators listed, real devices marked with UDID):
> - [device list]

If real devices are connected, note signing requirement. User picks one.

## Build Action

Ask user: **build only, build and run, or analyze?**

### Build Commands

**Simulator:**
```bash
xcodebuild build \
  -workspace Project.xcworkspace \
  -scheme SchemeName \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
```

**Real device:**
```bash
xcodebuild build \
  -workspace Project.xcworkspace \
  -scheme SchemeName \
  -destination 'platform=iOS,name=My iPhone'
```

**macOS build and run** (full clean to avoid stale cache):
```bash
DERIVED_DATA=$(xcodebuild -workspace Project.xcworkspace -scheme SchemeName -showBuildSettings 2>/dev/null | grep -m1 BUILD_DIR | awk '{print $3}' | sed 's|/Build/Products||') && \
[ -n "$DERIVED_DATA" ] && rm -rf "${DERIVED_DATA}/Build/Products/Debug/SchemeName.app" ; \
xcodebuild clean build -workspace Project.xcworkspace -scheme SchemeName -configuration Debug -destination 'platform=macOS' && \
APP_PATH=$(xcodebuild -workspace Project.xcworkspace -scheme SchemeName -configuration Debug -destination 'platform=macOS' -showBuildSettings 2>/dev/null | grep -m1 BUILT_PRODUCTS_DIR | awk '{print $3}') && \
[ -n "$APP_PATH" ] && open "${APP_PATH}/SchemeName.app"
```

For macOS build-only, use regular `xcodebuild build` without clean.

**Install and launch on simulator (build and run):**
```bash
xcrun simctl boot "iPhone 15 Pro" 2>/dev/null; \
xcrun simctl install booted /path/to/app.app && \
xcrun simctl launch booted com.bundle.id
```

## Build Options

| Flag | Purpose |
|---|---|
| `-configuration ` `Debug|Release` | Build configuration |
| `-derivedDataPath <path>` | Derived data location |
| `-quiet` | Less verbose output |
| `-showBuildSettings` | Display build settings |

## Common Build Errors

| Error | Fix |
|---|---|
| `no such module 'X'` | Check import, ensure dependency is linked |
| `ld: symbol not found` | Check library linking in target |
| `could not find developer disk image` | Update Xcode or simulator runtimes |
| `no signing certificate` | Check Apple Developer account + provisioning profile |
| `Build input file cannot be found` | Check file references in project navigator, re-add if deleted |
| `Ambiguous use of function` | Add explicit type annotation |

## Rules

- Auto-detect platform and project type. Only ask for root path when no project found.
- Support both `.xcodeproj` and `.xcworkspace` — prefer workspace if both exist.
- Handle both simulators and real devices.
- Use `AskUserQuestion` for device selection and build action.
