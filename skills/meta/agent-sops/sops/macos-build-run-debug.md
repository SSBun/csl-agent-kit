---
name: macos-build-run-debug
description: Build, launch, debug, and triage tests for native macOS Xcode and SwiftPM projects with a shell-first workflow.
when_to_use: Use when building, launching, debugging, or testing a native macOS Xcode or SwiftPM project, diagnosing compile, link, startup, runtime, or test failures, or wiring a project-local Codex Run action.
version: 1.0
update_date: 2026-08-01
globs:
  - "**/*.swift"
  - "**/Package.swift"
  - "**/*.xcodeproj/project.pbxproj"
  - "**/*.xcworkspace/contents.xcworkspacedata"
  - "**/.codex/environments/environment.toml"
  - "**/*.sh"
do_not_use_when:
  - The task changes only native desktop interface architecture or visual behavior; use macos-swiftui-appkit.
  - The task only inspects signature, entitlement, sandbox, hardened runtime, or Gatekeeper trust state; use macos-signing-entitlements.
  - The task only prepares a distribution archive or notarization submission; use macos-packaging-notarization.
  - The target is a mobile, watch, television, vision, or Catalyst simulator workflow with no desktop executable.
alwaysApply: false
---

# SOP：macOS Build、Run、Debug 与 Test Triage

## 1. 目的

用项目已有入口和最窄命令完成原生 macOS 应用或 Swift package 的构建、启动、调试与测试分流。默认 shell-first，不假设 simulator；只有项目缺少稳定入口且任务需要重复运行时，才建立一个项目级 `script/build_and_run.sh` 并接入 Codex Run action。

## 2. 适用范围

适用：

- Xcode workspace/project 的 scheme 发现、命令行构建、启动和本地调试。
- SwiftPM executable、library 与 test product 的构建、运行和测试。
- SwiftPM AppKit/SwiftUI GUI executable 的本地 `.app` bundle staging 与前台启动。
- compiler、linker、build setting、toolchain、script、startup、runtime 和 macOS test failure 分流。
- 项目明确需要可重复 Run action 时，创建或修复 `script/build_and_run.sh` 与 `.codex/environments/environment.toml`。

不适用：

- scene、window、menu、SwiftUI/AppKit bridge 或视觉实现；使用 `macos-swiftui-appkit`。
- codesign、entitlement、App Sandbox、Hardened Runtime 或 Gatekeeper 根因；使用 `macos-signing-entitlements`。
- distribution archive、Developer ID notarization 或 stapling；使用 `macos-packaging-notarization`。
- iOS/watchOS/tvOS/visionOS simulator、桌面 UI automation 或 App Store Connect release management。

## 3. 开始前检查

1. 阅读项目规则、任务相关文档和现有构建脚本；运行 `git status --short`，不得覆盖用户未提交改动。
2. 检查当前目录是否已属于 Git worktree。若不属于，不得自动 `git init`；只有 Codex Git-backed 功能确实需要且用户确认后，才在正确 workspace root 初始化，绝不在父仓库内创建 nested repository。
3. 按以下优先级寻找入口：项目文档/CI 已验证命令 → 现有 run/build script → Xcode workspace → Xcode project → `Package.swift`。
4. 多个 workspace、project、scheme 或 executable product 都合理时，说明选择依据；不能由源码和配置唯一确定时，询问用户。
5. 按任务读取 reference：

   | 任务 | 必读 reference |
   | --- | --- |
   | 项目发现、Xcode/SwiftPM build/run、故障分类、Run action | `references/macos-build-run-debug/project-discovery-and-run-loop.md` |
   | SwiftPM AppKit/SwiftUI GUI app 启动或 bundle staging | `references/macos-build-run-debug/swiftpm-gui-app-bundle.md` |
   | Xcode/SwiftPM test failure | `references/macos-build-run-debug/test-triage.md` |

## 4. 执行流程

### 4.1 识别 harness 与可运行产物

1. Xcode：用 `xcodebuild -list` 确认 scheme；优先 app-producing shared scheme，不猜 target 名。
2. SwiftPM：读取 `Package.swift`，区分 library、CLI executable、GUI executable 和 test product。
3. 记录将要停止和启动的真实 process name；不要把 bundle display name、scheme 和 executable name 默认视为相同。
4. 先运行能证明当前问题的最窄命令；不要在尚未复现时重写 build settings 或启动脚本。

### 4.2 选择或建立唯一 run loop

1. 已有稳定入口时直接复用并最小修复，不再创建第二套脚本。
2. 一次性 build/test 不需要永久脚本；只有用户要求 Run action、现有手工链反复出错，或后续调试需要稳定 kill→build→launch 闭环时，才建立 `script/build_and_run.sh`。
3. 脚本默认路径只做：停止旧进程、构建目标、启动本次产物。按实际需求增加 `--debug`、`--logs`、`--telemetry` 或 `--verify`；不要添加未使用模式。
4. CLI executable 可直接运行。SwiftPM AppKit/SwiftUI GUI executable 必须 staging 为项目本地 `.app` 并通过 `/usr/bin/open -n` 启动，不把 raw executable launch 当正常路径。
5. 只有脚本已存在且验证可执行后，才写 `.codex/environments/environment.toml`；更新现有 `Run` action，不创建重复 action。

### 4.3 构建、启动与收集证据

1. 通过已选入口执行 Debug build；Release 只在用户或分发任务明确需要时运行。
2. 构建失败时停止启动，截取首个真实 blocker，而不是最后一串 cascading errors。
3. 启动失败时区分：脚本路径/权限、产物路径、bundle metadata、签名/entitlement、activation、动态链接、即时 crash。
4. `pgrep`、process list 或一条启动日志只证明进程路径，不证明窗口、焦点或视觉正确性。
5. symbolized crash 使用 LLDB 或项目现有 crash tooling；行为事件使用 `macos-unified-logging`；签名或 sandbox 证据转入 `macos-signing-entitlements`。

### 4.4 测试分流

1. Xcode 用 `xcodebuild test`，SwiftPM 用 `swift test`；优先用户指定 target/filter，否则从最可能失败的最小 test scope 开始。
2. 分清 test build 失败与 test execution 失败，再归类为 assertion、crash/signal、async/flake、fixture/environment、host app 或 entitlement。
3. 只有新证据需要时才扩大范围；不要无信息地重复整个 suite。
4. 修复后先重跑原失败 scope，再按风险扩大到相关 target 或 suite。

### 4.5 汇报

至少报告：检测到的项目类型与入口、实际命令、产物或脚本路径、build/run/test 结果、失败分类与最小证据、下一步。未直接观察 UI 时必须明确标注人工验证项。

## 5. 异常处理

| 场景 | Agent 行为 |
| --- | --- |
| 多个 workspace/project/scheme/product 无法唯一选择 | 列出候选与已有证据，询问用户；不建立猜测性默认流程。 |
| workspace 不在 Git 中 | 继续完成不依赖 Git 的 build/test；如 Run action 确需 Git-backed 功能，先说明影响并请求初始化确认。 |
| 现有脚本与本 SOP 结构不同但可重复工作 | 复用现有脚本，只修当前故障；不为统一命名而替换。 |
| SwiftPM package 只有 library product | 只 build/test；明确没有可直接运行的产品。 |
| GUI raw executable 能启动但无 Dock icon/前台窗口 | 改用项目本地 `.app` staging；bundle 已正确仍不激活时，再检查 activation policy。 |
| 错误指向 signing、sandbox 或 trust policy | 保存最小失败证据，切换 `macos-signing-entitlements`，不靠 clean/rebuild 掩盖。 |
| 测试疑似 flaky | 记录失败类型与时序证据，做有限的 focused rerun；不直接宣称产品回归或已修复。 |
| 无法自动观察窗口 | 验证 build、launch path 和必要日志，列出需人工检查的窗口、焦点与交互；不声称 UI 通过。 |

## 6. 完成标准

- [ ] 已阅读项目规则、现有入口和相关配置，并保护用户未提交改动。
- [ ] 已确认 workspace/project/package、scheme/product、executable 与 process name。
- [ ] 已使用最窄、可复现的现有入口；没有创建重复 build/run 系统。
- [ ] 如创建 run script，其默认路径为 kill→build→launch，且只含任务需要的 mode。
- [ ] SwiftPM GUI executable 通过有效 `.app` bundle 与 `/usr/bin/open -n` 启动。
- [ ] 如配置 Codex Run action，目标脚本已存在、可执行且 action 不重复。
- [ ] 已区分 compiler、linker、settings/toolchain、script、signing、startup、runtime 与 test failure。
- [ ] test triage 从最小 scope 开始，修复后重跑了原失败 scope。
- [ ] 已运行与任务相称的 build/run/test 验证，并保留最小失败证据。
- [ ] 最终结论区分了进程证据、日志证据与人工 UI 验证。

## 7. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/build-run-debug/SKILL.md
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/swiftpm-macos/SKILL.md
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/test-triage/SKILL.md
- https://developer.apple.com/library/archive/technotes/tn2339/_index.html
