# 准备、发布并验证 Perch 0.2.0

Status: Completed (2026-09-11 11:11)
Kind: Task
Parent: publish-perch-minor-version

## Scope

- 包含：0.1.0 → 0.2.0、build number 单调递增、release notes、可分发 macOS 归档、Sparkle 签名元数据、`v0.2.0` GitHub Release、默认分支与公开 feed。
- 不包含：在缺少 Developer ID Application 身份时把产物描述为 production-signed 或 notarized；任何实际限制必须在远端动作确认前明确列出。

## Target
- [x] T1: Perch 的版本真相源、生成工程、build number 与发布说明一致更新为 0.2.0 的发布状态。
- [x] T2: 最终 macOS 发布归档的版本、架构、签名、公证能力、可读性、SHA-256 与 Sparkle 元数据均完成验证，并准确披露任何分发限制。
- [x] T3: v0.2.0 标签、GitHub Release 资产和公开 Sparkle appcast 按安全顺序发布，远端下载内容与本地最终归档一致。
- [x] T4: 发布后远端标签、Release、默认分支 HEAD 与适用的最终 CI 状态均指向或覆盖同一发布结果。

## Plan

1. 确认版本真相源、发布工具、签名身份、Sparkle 密钥、远端仓库和分发限制。
2. 更新 0.2.0/build 元数据与发布说明，生成工程并完成非测试 Release 构建及归档验证。
3. 从最终归档生成 checksum 与 Sparkle appcast，创建 release commit 和 annotated tag。
4. 在远端动作安全确认后，依次发布 tag、GitHub Release 资产和默认分支 feed。
5. 独立下载资产并复核 checksum、公开 appcast、远端提交关联与适用 CI，再完成交付前审查。

## Result

- T1: release commit 03868c2 将 project.yml 真相源及生成 Info.plist 更新为 0.2.0/build 2，并新增 2026-09-11 CHANGELOG、更新 README 与公开 appcast。
- T2: 最终 Perch-0.2.0.zip 为 x86_64+arm64、3,323,877 bytes、SHA-256 7b96529c…f36c；解压、版本/build、Sparkle 2.9.6、deep/strict codesign、EdDSA 验签通过；用户明确接受 ad hoc 签名且未 notarize。
- T3: v0.2.0、稳定 GitHub Release 及两个资产已发布；远端资产独立下载后大小、HTTP 200、checksum 均匹配，本地签名 appcast 随后发布到公开 raw URL 并逐字段与 EdDSA 复验通过。
- T4: origin/main、annotated v0.2.0 与 Release 均解析到 03868c23d3cef6e5dbe6b06119d8683115ae022b；main 为默认分支，Release 非 draft/prerelease；仓库 workflows=0、该 commit check runs=0，CI 不适用。
- Review gate: Passed — Review mode: non-independent self-review；独立 reviewer 运行器缺少 @earendil-works/pi-tui。复核本地归档、签名限制、Release 顺序、公网资产/feed 与远端关联后无 finding；真实跨版本安装和 Gatekeeper 机器未验证为已明确接受的非阻断限制。

## Verification

- Passed: Review 后重新确认本地/远端 HEAD 与 v0.2.0 均为 03868c23…、Release 稳定且两资产尺寸正确、公开 appcast 与本地逐字一致、远端 ZIP SHA-256 和 EdDSA 通过；workflows/check runs 均为 0，Perch Context/Task 校验通过。
