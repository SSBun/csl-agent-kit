# macOS Signing 与 Entitlement Diagnosis

仅在目标 artifact 的 codesign、identity、entitlement、App Sandbox、Hardened Runtime、nested code 或 Gatekeeper trust 出现问题时读取。

## 1. 先定义目标状态

| 场景 | 不能混淆的边界 |
| --- | --- |
| Local ad hoc/development | 只证明本机开发路径，不证明独立分发。 |
| Apple Development | 用于受控开发和 capability 调试，不等于 Developer ID。 |
| Developer ID direct distribution | 需要 Developer ID Application、Hardened Runtime、timestamp 和后续 notarization readiness。 |
| Mac App Store | 使用 Apple Distribution/provisioning/export 流程，不走 Developer ID 独立分发结论。 |

## 2. Artifact Inventory

先定位实际运行或 exported artifact：

```bash
APP='/path/to/App.app'
/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$APP/Contents/Info.plist"
find "$APP/Contents" -type d \( -name '*.framework' -o -name '*.xpc' -o -name '*.appex' -o -name '*.app' \) -print
find "$APP/Contents" -type f \( -name '*.dylib' -o -path '*/MacOS/*' \) -print
```

不要只检查 outer app。记录 main executable、framework、dylib、XPC service、app extension 与 helper tool 的路径和 owner。

## 3. 最小 Inspection Commands

```bash
codesign -dvvv --entitlements :- "$APP"
codesign --verify --strict --verbose=4 "$APP"
security find-identity -p codesigning -v
plutil -p "$APP/Contents/Info.plist"
spctl -a -vv -t exec "$APP"
```

说明：

- `codesign -d` 的 metadata/entitlements 与 `codesign --verify` 的 integrity 是两类证据。
- `spctl` 是 policy assessment；它失败不自动意味着 bytes/signature integrity 失败。
- 需要整体检查时可补充 `codesign --verify --deep --strict --verbose=4`，但必须先定位 nested component；不得用 `--deep` 执行签名。
- 只输出必要字段，避免完整 keychain/profile dump。

## 4. Entitlement Evidence Chain

逐层比较：

```text
产品需要的 capability
        ↓
项目 target/build configuration 使用的 .entitlements
        ↓
签名过程实际应用的 entitlement
        ↓
artifact 中 codesign 读取到的 signed entitlement
        ↓
系统 runtime / Gatekeeper 行为
```

规则：

1. source `.entitlements` 表示配置意图，signed entitlement 表示实际结果。
2. Debug/Release、main app/helper 和不同 target 可能使用不同文件；必须检查本次 configuration。
3. 不从另一组件复制 entitlement；helper 只携带自身需要的能力。
4. Developer ID distribution artifact 通常不应携带 `com.apple.security.get-task-allow=true`。
5. Sandbox file/network/Apple Events、JIT、unsigned executable memory、disable-library-validation 等能力必须有明确功能需求和 Apple 允许路径。

## 5. Failure Classification

| 失败类 | 常见证据 | 最小修复方向 |
| --- | --- | --- |
| Unsigned/ad hoc 不符合目标 | no identity / `Signature=adhoc` | 选择目标渠道要求的真实 identity，重新 build/export。 |
| Wrong identity/team | authority/team 与目标不符 | 修 target/configuration/export signing 设置。 |
| Identity unavailable | `security find-identity` 无匹配或缺私钥 | 恢复/安装正确证书私钥，不伪造 fallback。 |
| Entitlement mismatch | source 与 signed artifact 不同 | 查 `CODE_SIGN_ENTITLEMENTS`、configuration 和签名阶段。 |
| Hardened Runtime | runtime option 缺失或 library/JIT 被拒 | 先确认功能，再设置 runtime 和最小 exception。 |
| App Sandbox | file/network/Apple Event 被拒 | 根据实际 capability 调整最小 entitlement 和测试路径。 |
| Nested code | inner component invalid/different identity | 修 inner component，inside-out 重新签，outer app 最后。 |
| Gatekeeper/notary | integrity 通过但 assessment/ticket 失败 | 进入 packaging/notarization log 与 stapling 检查。 |

## 6. 正确签名顺序

```text
最内层 dylib/helper/framework/XPC/extension
                    ↓
中间 container
                    ↓
main executable / outer app 最后
```

- 每个 code object 使用符合其角色的 entitlement。
- Developer ID main executable 需要 secure timestamp 和 Hardened Runtime 时，使用项目 archive/export 流程或显式正确 options。
- 不使用 `codesign --deep --force --sign ...` 作为 repair shortcut。
- 项目可重建时优先修 source setting 后重新 build/export，不依赖 post-build 临时 re-sign。

## 7. 验证结论分层

分别报告：

1. signature integrity；
2. identity/team/channel 是否正确；
3. signed entitlement 是否符合功能和渠道；
4. Hardened Runtime/timestamp；
5. nested code；
6. Gatekeeper assessment；
7. notarization ticket（若任务涉及）。

单项通过不能推出其余全部通过。

## 8. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/signing-entitlements/SKILL.md
- https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac
- https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
