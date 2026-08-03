# macOS Developer ID Distribution 与 Notarization

仅在处理 Mac App Store 外分发的 exported artifact、Apple notary service、submission log、stapling 或 Gatekeeper 最终验证时读取。

## 1. 事实边界

- Notarization 是 Apple 对 Developer ID 签名软件执行的自动安全扫描，不是 App Review。
- Accepted ticket 可 stapled 到支持的 artifact，Gatekeeper 也可在线取得 ticket。
- 普通 local debug 不要求 notarization。
- 项目设置只能说明意图；只有最终 exported artifact 能证明 distribution readiness。
- `.app` 不能直接提交。`notarytool` 接受 ZIP、UDIF DMG 和 flat PKG 等支持容器。

## 2. Xcode Archive 与 Export

优先项目已有流程。命令行形态：

```bash
xcodebuild \
  -workspace '<App>.xcworkspace' \
  -scheme '<Scheme>' \
  -configuration Release \
  -destination 'generic/platform=macOS' \
  -archivePath '<path>/<App>.xcarchive' \
  archive

xcodebuild \
  -exportArchive \
  -archivePath '<path>/<App>.xcarchive' \
  -exportPath '<path>/export' \
  -exportOptionsPlist '<path>/ExportOptions.plist'
```

project-only 时使用 `-project`。`ExportOptions.plist` 必须来自项目实际 distribution channel，不复制未知项目模板。

外部构建系统同样必须形成完整 `.app`、正确 Info.plist/resources 和 inside-out signed nested code。

## 3. Readiness Checklist

对最终 exported app 检查：

```bash
codesign --verify --deep --strict --verbose=4 '<App>.app'
codesign -dvvv --entitlements :- '<App>.app'
spctl -a -vv -t exec '<App>.app'
```

并确认：

- Developer ID Application identity 与预期 Team；
- main executable 启用 Hardened Runtime；
- secure timestamp；
- `com.apple.security.get-task-allow` 不为 `true`；
- framework/dylib/XPC/helper/extension 均有正确 nested signature；
- entitlement 最小且符合 distribution behavior；
- version、build、bundle identifier、architecture、deployment target 正确。

发现签名根因时转 `macos-signing-entitlements`，重新 export 后再提交。

## 4. 创建提交容器

### ZIP

```bash
ditto -c -k --keepParent '<App>.app' '<App>.zip'
ditto -x -k '<App>.zip' '<temporary-validation-directory>'
shasum -a 256 '<App>.zip'
```

使用 `ditto --keepParent` 保留 app bundle 根结构。验证解压结果后删除 temporary directory。

### DMG / PKG

- DMG 必须是 UDIF image，并在提交前运行 `hdiutil verify '<App>.dmg'`。
- PKG 使用 flat installer package，并独立检查 installer signature。
- DMG 创建与本地安装流程分别交给 `xcode-macos-create-dmg-system` 与 `xcode-macos-dmg-release`。

## 5. Credential 与 Submission

首次配置 credential 时使用 Keychain profile：

```bash
xcrun notarytool store-credentials '<profile-name>'
```

不得把 password、app-specific password、API private key、issuer 或 token 明文写入仓库、script 或任务记录。

上传会改变远端状态，用户明确授权具体 artifact 后才能执行：

```bash
xcrun notarytool submit '<artifact.zip|dmg|pkg>' \
  --keychain-profile '<profile-name>' \
  --wait
```

记录：artifact absolute path、SHA-256、submission ID、提交时间和最终 status。等待中断不等于 rejected；用 submission ID 查询真实状态，不盲目再次 submit。

## 6. Rejection Diagnosis

```bash
xcrun notarytool log '<submission-id>' \
  --keychain-profile '<profile-name>' \
  '<notary-log.json>'
```

按 JSON issue 的 path、architecture、severity/message 定位首个 blocker。常见类别：

- component 未签名、签名无效或 identity 不正确；
- Hardened Runtime/secure timestamp 缺失；
- distribution artifact 携带 disallowed entitlement；
- nested executable architecture 或 signature 问题；
- package/container 损坏或格式不支持。

修复 source/archive/export 后重新生成新 artifact、计算新 SHA-256，再经用户授权重新提交；不要重复上传完全相同的已知坏 artifact。

## 7. Staple 与最终验证

Accepted 后：

```bash
xcrun stapler staple '<App>.app|dmg|pkg>'
xcrun stapler validate '<App>.app|dmg|pkg>'
spctl -a -vv -t exec '<App>.app'
```

- ZIP 不能直接 staple。解压/使用原 app 执行 staple，再创建新的 ZIP；新 ZIP 需重新计算 SHA-256。
- 若分发 DMG，可 staple app 和/或最终 DMG，并重新运行 `hdiutil verify`。
- artifact 在 Accepted/staple 后被重签、修改 bundle 或重新打包时，旧验证结论不再覆盖新字节；按变更层级重新检查和提交。

## 8. 状态词必须精确

| 状态 | 可声称内容 |
| --- | --- |
| Readiness checked | 本地 prerequisite 已检查，尚未上传或服务端未知。 |
| Submitted | 已取得 submission ID，不代表 Accepted。 |
| Accepted | Apple service 已接受该 submission，不代表 ticket 已 stapled。 |
| Stapled/validated | 指定 artifact 的 ticket 已写入并通过 stapler validation。 |
| Distribution verified | 还应包含签名、Gatekeeper 与 artifact-specific 验证；不自动包含实际用户机器安装。 |

## 9. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/packaging-notarization/SKILL.md
- https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
- https://developer.apple.com/documentation/security/customizing-the-notarization-workflow
- https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac
