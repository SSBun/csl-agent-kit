---
name: macos-packaging-notarization
description: Prepare, submit, diagnose, and validate Developer ID macOS distribution artifacts through Apple notarization and stapling.
when_to_use: Use when archiving or exporting a macOS app for direct distribution, checking Developer ID notarization readiness, submitting an app archive, ZIP, DMG, or PKG to Apple notary service, diagnosing a rejected submission, or stapling and validating a ticket.
version: 1.0
update_date: 2026-08-01
globs:
  - "**/Info.plist"
  - "**/*.entitlements"
  - "**/*.xcodeproj/project.pbxproj"
do_not_use_when:
  - The task only runs or debugs a local development build; use macos-build-run-debug.
  - The task only diagnoses identity, entitlement, sandbox, runtime-hardening, or nested-signature state before distribution; use macos-signing-entitlements.
  - The task only asks to create, verify, or locally install a disk image; use the matching DMG SOP.
  - The task only integrates or validates application self-updates; use integrate-sparkle2-macos.
alwaysApply: false
---

# SOP：macOS Packaging 与 Notarization

## 1. 目的

为 Mac App Store 外分发的 macOS 软件建立可验证的 Developer ID archive/export、notarization、log diagnosis、stapling 与 Gatekeeper 验证闭环。公证是 Apple 对已签名软件执行的自动安全扫描，不是 App Review；它不替代正确签名、artifact 打包或实际安装验证。

## 2. 适用范围与相邻 SOP

适用：

- Xcode archive/export 或外部构建产物的 Developer ID direct distribution。
- `.app`、ZIP、UDIF DMG 或 flat PKG 的 notarization readiness、submission、rejection diagnosis 和 ticket stapling。
- Hardened Runtime、secure timestamp、nested signatures 与 distribution entitlement 的最终产物检查。

边界：

- 只诊断 identity/entitlement/signature 根因：`macos-signing-entitlements`。
- 项目缺少可维护 DMG 脚本：`xcode-macos-create-dmg-system`。
- 生成、验证或安装本地 DMG：`xcode-macos-dmg-release`。
- Sparkle 2 集成与双版本升级验证：`integrate-sparkle2-macos`。
- App Store Connect release management、GitHub Release 上传、feed 发布和 registry publish 不属于本 SOP。

## 3. 开始前必须确认

1. 分发渠道是 Developer ID direct distribution，而不是 ordinary local debug 或 Mac App Store。
2. 用户要求的终点：只做 readiness、生成待提交 artifact、实际提交、诊断既有 submission，还是 staple/validate。
3. 找到实际 exported artifact 及其生成方式；只有 project settings 时，只能给出推断性的 readiness 结论。
4. 检查项目现有 archive/export/package/release 脚本和上述相邻 SOP；不创建重复流程。
5. 实际 `notarytool submit` 会上传 artifact 并改变远端状态，执行前必须获得用户对本次 artifact 的明确授权。
6. 按 `references/macos-packaging-notarization/distribution-and-notarization.md` 执行命令与 artifact-specific 规则。

## 4. 执行流程

### 4.1 生成或定位分发产物

1. Xcode app 优先使用项目已有 archive/export 流程；需要命令行时，用 shared scheme 生成 `.xcarchive`，再用 `xcodebuild -exportArchive` 与明确的 export options 导出。
2. 外部构建系统必须提供完整 `.app` bundle 并显式处理 nested code signing；不能只分发裸 executable。
3. 记录 app version、build、bundle identifier、CPU architecture、deployment target 与 artifact SHA-256，避免提交后无法对应源产物。

### 4.2 检查 notarization prerequisites

1. 主 app 与所有 nested code 使用正确 Developer ID Application identity，并通过 signature verification。
2. main executable 启用 Hardened Runtime、secure timestamp；distribution artifact 不携带 `com.apple.security.get-task-allow=true`。
3. 只保留功能必需的 entitlement；检查 helper/framework/XPC/app extension 的独立签名与 entitlement。
4. readiness 有签名根因时先切换 `macos-signing-entitlements`，修复后重新 export；不在错误 artifact 上继续提交。

### 4.3 生成 Apple 支持的提交容器

1. `.app` 不能直接提交给 notary service；用 `ditto -c -k --keepParent` 创建保留 bundle 结构的 ZIP，或使用最终 DMG/flat PKG。
2. 提交前验证 ZIP 可展开、DMG 通过 `hdiutil verify`、PKG 结构和签名符合项目渠道。
3. notarize 的必须是最终分发字节；公证后重新打包会产生新的未验证 artifact。

### 4.4 提交与诊断

1. credential 使用 `xcrun notarytool store-credentials` 保存到 Keychain profile；不得把 Apple ID password、app-specific password、issuer/private key 或 token 明文写进仓库和命令历史。
2. 在用户明确授权后执行 `xcrun notarytool submit <artifact> --keychain-profile <profile> --wait`，记录 submission ID、最终 status 和被提交 artifact 的 SHA-256。
3. status 不是 Accepted 时，用 `xcrun notarytool log <submission-id> --keychain-profile <profile> <log.json>` 读取 JSON issue；从首个阻塞问题开始修复并重新生成 artifact。
4. network timeout 或本地等待中断不等于 submission 被拒；用 submission ID 查询真实服务端状态，不盲目重复上传。

### 4.5 Staple 与最终验证

1. Accepted 后对 `.app`、DMG 或 PKG 运行 `xcrun stapler staple` 与 `xcrun stapler validate`。ZIP 本身不能 staple；先 staple 内部 app，再重新 ZIP。
2. 再运行 codesign verification、Gatekeeper assessment，以及 artifact-specific 验证；DMG 还需 `hdiutil verify`。
3. 如果重新打包、重签或修改 bundle，重新计算 SHA-256，并按变更层级重新 notarize/staple；旧 ticket 不能证明新字节。
4. 最终报告 artifact 路径、version/build、SHA-256、signing identity class、submission ID/status、staple 与 Gatekeeper 结果，以及未执行项。

## 5. 确认点

以下动作执行前必须明确确认：

- 首次或再次向 Apple notary service 上传具体 artifact。
- 覆盖、替换或重新生成用户指定的现有 release artifact。
- 任何 GitHub Release、App Store Connect、feed、registry 或其他远端发布动作；这些动作应交给相应 release SOP。

只做本地 readiness、signature verification、archive inspection、log 读取或 dry-run 时，不需要额外确认。

## 6. 异常处理

| 场景 | Agent 行为 |
| --- | --- |
| 只有 project settings，没有 exported artifact | 给出 settings-level 检查并标记为推断；不声称 distribution-ready。 |
| 项目没有 DMG 流程 | 如果目标是 DMG，切换 `xcode-macos-create-dmg-system`；不在本 SOP 内临时发明脚本。 |
| codesign、entitlement 或 nested code 失败 | 切换 `macos-signing-entitlements` 修复根因，重新 export 后再继续。 |
| `notarytool` 返回 Invalid/Rejected | 下载 JSON log，按 path/architecture/message 定位首个 issue；不靠重复提交修复。 |
| `notarytool --wait` 超时或连接中断 | 保存 submission ID，查询服务端状态；未知状态时不重复上传。 |
| Accepted 但 stapling 失败 | 确认目标类型、网络、ticket 与 artifact 未被修改；ZIP 必须 staple 内部 app 而非 ZIP。 |
| staple 后 artifact 又被修改或重新打包 | 视为新 artifact，重新验证签名并按需要重新提交。 |
| 用户要求上传 Release/feed/registry | 停止在本 SOP 边界，切换匹配 release SOP 并重新确认远端动作。 |

## 7. 完成标准

- [ ] 已确认 Developer ID direct-distribution 目标和本次终点。
- [ ] 已检查实际 exported artifact、nested code、version/build、architecture 与 SHA-256。
- [ ] Developer ID identity、Hardened Runtime、secure timestamp、distribution entitlement 与 signature verification 均已检查。
- [ ] 提交容器是受支持且可读取的 ZIP、DMG 或 flat PKG；未直接提交 `.app`。
- [ ] credential 使用 Keychain profile，未进入仓库、脚本、日志或回复。
- [ ] 如执行 submission，已取得用户授权并记录 submission ID 与最终 status。
- [ ] 如 submission 未 Accepted，已读取 JSON log 并定位首个可操作 issue。
- [ ] 如 Accepted，已对可 staple artifact 执行 staple/validate，并重新检查 Gatekeeper。
- [ ] 重新签名、打包或修改后未复用旧 artifact 的验证结论。
- [ ] 最终报告明确区分 readiness、submitted、Accepted、stapled 与实际分发状态。

## 8. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/packaging-notarization/SKILL.md
- https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
- https://developer.apple.com/documentation/security/customizing-the-notarization-workflow
- https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac
