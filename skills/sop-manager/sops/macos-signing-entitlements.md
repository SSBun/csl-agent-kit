---
name: macos-signing-entitlements
description: Diagnose and repair macOS code-signing, entitlement, sandbox, hardened-runtime, and Gatekeeper trust failures from artifact evidence.
when_to_use: Use when inspecting or fixing macOS codesign failures, entitlement or provisioning mismatches, App Sandbox or Hardened Runtime issues, nested component signature problems, or Gatekeeper trust-policy rejections.
version: 1.0
update_date: 2026-08-01
globs:
  - "**/*.entitlements"
  - "**/Info.plist"
  - "**/*.xcodeproj/project.pbxproj"
do_not_use_when:
  - The task only reports compiler, linker, test assertion, or ordinary runtime logic failures; use macos-build-run-debug.
  - The task only creates or submits a distribution archive for Apple notarization; use macos-packaging-notarization.
  - The task only generates or installs a local disk image; use the matching DMG SOP.
alwaysApply: false
---

# SOP：macOS Signing 与 Entitlements

## 1. 目的

从实际 `.app`、main executable、nested code、project settings 和 entitlement 文件建立证据链，准确区分 identity、signature、provisioning、Hardened Runtime、App Sandbox 与 Gatekeeper 问题，并只修根因。不得猜测 entitlement，也不得把本地开发签名、Developer ID 分发与 notarization 混为一谈。

## 2. 适用范围

适用：

- `codesign` verification failure、invalid/unsigned/ad hoc signature、错误 identity 或证书不可用。
- source entitlement 与 signed entitlement 不一致，或 capability/provisioning 不匹配。
- App Sandbox、Hardened Runtime、Library Validation、nested framework/helper/XPC signature 问题。
- app 可构建但被系统拒绝启动，或 Gatekeeper assessment 失败。
- 为后续 Developer ID 分发检查签名完整性；真正的 archive/notarization 流程使用 `macos-packaging-notarization`。

不适用：

- 普通 compiler/linker/test/runtime bug；使用 `macos-build-run-debug`。
- 仅生成 DMG、安装本地 artifact 或集成 Sparkle。
- App Store Connect release management。

## 3. 使用方式

1. 先确认目标是 local development、CI artifact、Developer ID direct distribution 还是 Mac App Store；同一签名状态在不同目标下结论不同。
2. 先定位实际 artifact 和所有 nested code，再读取项目设置；没有 artifact 时只能给 settings-level readiness 结论，不得声称签名已验证。
3. 按 `references/macos-signing-entitlements/diagnosis-and-entitlements.md` 的顺序收集最小证据。
4. 先分类根因，再修改 entitlement、identity、build setting 或签名顺序；每次只改变一个已证实变量。
5. repair 后重新构建或按正确 inside-out 顺序签名，再复跑同一验证命令。
6. 如果目标进入 archive/export/notarization，签名层通过后切换 `macos-packaging-notarization`。

## 4. 核心规则

### 4.1 Artifact 先于设置推断

- 检查实际运行/分发的 `.app`，不是只读 Xcode UI 或 `.entitlements` 源文件。
- 同时核对 bundle path、main executable、nested frameworks、dylibs、XPC services、app extensions 和 helper tools。
- 比较 declared entitlement 与 signed entitlement；前者表示意图，后者才是 artifact 实际携带的能力。
- `spctl` 用于评估 Gatekeeper/distribution trust，不把其结果当成 compiler 或 local debug 诊断。

### 4.2 不发明 Entitlement

- entitlement 必须来自已确认 capability、Apple 文档、项目现有配置或具体系统错误；不得为“让它运行”添加猜测项。
- 使用最小权限；不复制其他 app 的 entitlement，也不把 wildcard 当修复手段。
- `com.apple.security.get-task-allow` 适合受控开发调试，不应出现在 Developer ID 分发 artifact 中。
- 修改 App Sandbox、network、file access、Apple Events、JIT、unsigned executable memory 或 disable-library-validation 等高影响能力前，必须说明需求与安全代价。

### 4.3 区分签名目标

- ad hoc/local development、Apple Development、Developer ID Application 与 Apple Distribution 服务不同渠道；不能互相替代。
- 独立分发通常使用 Developer ID Application、secure timestamp 与 Hardened Runtime；Mac App Store 使用 Apple Distribution 和对应 provisioning/export 流程。
- notarization 不是 ordinary local debug 前置条件；本地能启动也不等于可分发或已被 Gatekeeper 接受。
- identity 不存在、过期或 keychain 无私钥时，报告实际缺口，不生成或伪造替代 identity。

### 4.4 Nested Code 与签名顺序

- 签名顺序由最内层 code 向外层 container；main app 最后签。
- 不用 `codesign --deep` 执行签名；它会掩盖 nested code 的 entitlement 与 order 问题。`--deep` 仅可作为整体 verification 的补充，不能替代逐项检查。
- nested helper/framework 需要各自正确 identity、options 和必要 entitlement；不要把 main app entitlement 无差别复制给所有组件。
- 修复源配置后优先重新 build/archive，不把临时 re-sign 当长期项目修复。

### 4.5 最小证据与隐私

- 输出证书 common name、Team ID 或 artifact path 时只保留诊断所需信息；不得输出 private key、keychain password、notary credential 或 provisioning profile 中的敏感内容。
- 保留失败命令和最小关键输出，避免把整份 security/keychain dump 写入任务记录或对话。

## 5. 冲突处理

| 冲突 | 处理方式 |
| --- | --- |
| source entitlement 与 signed entitlement 不一致 | 以 signed artifact 为当前事实，回查 build configuration、target 和 signing phase 找到偏差。 |
| local debug 可运行但 distribution verification 失败 | 分开记录两个目标；不降低分发要求来保持本地行为。 |
| `--deep` 快速签名与可审计 nested signing 冲突 | 使用 inside-out 显式签名；`--deep` 只做补充验证。 |
| capability 需要高风险 entitlement | 先证明产品需求与 Apple 允许路径；不能证明时不添加并标记待确认。 |
| 项目已有签名脚本与默认命令不同 | 保留项目流程，检查其产物结果；只有根因位于脚本时才修改。 |
| Gatekeeper、notary 与 codesign 输出指向不同层 | 分别记录 signature integrity、policy assessment 和 notarization ticket，不把一项通过解释为全部通过。 |

## 6. 异常处理

| 场景 | Agent 行为 |
| --- | --- |
| 找不到目标 artifact | 定位 build/archive/export 输出；仍无 artifact 时只检查 source settings，并明确限制。 |
| 没有可用 signing identity | 用 `security find-identity -p codesigning -v` 确认；报告证书/私钥缺口，停止 distribution repair。 |
| entitlement 是否必要不清楚 | 查具体 capability 和系统错误；仍不明确时不添加，向用户确认产品能力。 |
| nested code 验证失败 | 定位首个失败组件，检查其 identity/options/entitlement，再按 inside-out 顺序重建或重签。 |
| local launch failure 实为 build/runtime bug | 切回 `macos-build-run-debug`，不继续改变签名配置。 |
| 签名通过但 notarization/Gatekeeper 仍失败 | 保存签名证据，切换 `macos-packaging-notarization` 检查 ticket、submission log 与 stapling。 |

## 7. 完成标准

- [ ] 已确认签名目标和实际 artifact，而不是只根据 project settings 推断。
- [ ] 已枚举 main executable 与相关 nested code，并定位首个失败组件。
- [ ] 已检查 identity、signed entitlement、Hardened Runtime、timestamp、sandbox 和 trust evidence 中的相关项。
- [ ] 已比较 source entitlement 与 artifact 实际 entitlement。
- [ ] 未发明、复制或扩大 entitlement；高影响 entitlement 有明确需求证据。
- [ ] 已区分 local development、Developer ID direct distribution、Mac App Store 与 notarization。
- [ ] 签名采用 inside-out 顺序，未用 `codesign --deep` 代替正确签名。
- [ ] repair 后复跑了同一失败验证，并记录最小可复现证据。
- [ ] 未泄露 private key、password、notary credential 或其他敏感信息。
- [ ] 如果问题已进入 packaging/notarization 层，已明确路由到对应 SOP。

## 8. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/signing-entitlements/SKILL.md
- https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac
- https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
