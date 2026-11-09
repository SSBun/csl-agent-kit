# 提交并刷新当前 skills

状态：已完成（2026-07-21）

## 目标

- 核对并提交当前工作区全部本地改动。
- 提交前验证完整 staged snapshot，并取得独立审查通过。
- 提交成功后运行仓库安装器刷新 Codex plugin，确认安装后的 skill 与源码一致。

## 计划

- [x] 核对全部改动、所属任务与验证证据，排除秘密或意外文件。
- [x] 运行仓库检查并暂存完整 snapshot。
- [x] 对 staged snapshot 运行独立 adversarial review，修复全部阻塞项。
- [x] 创建一个本地 commit，并核对 commit 内容与工作区状态。
- [x] 运行安装器刷新 Codex plugin，验证安装结果与关键文件 hash。

## 边界

- 提交当前工作区全部已跟踪与新增改动，不修改其已确认功能范围。
- 不 push、不发布 npm、不创建 release。
- 安装目标仅为本机 Codex plugin。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: `current_skills_commit_reviewer`
- Round: RE-REVIEW (2)
- Scope: 完整 staged snapshot 与其验证证据
- Summary: 完整 staged snapshot 与验证证据已通过提交前检查。
- Unresolved: none
- Report: [Adversarial review report](../artifacts/commit-and-refresh-current-skills/reports/adversarial-review.md)

## 复核

- INITIAL (1) 报告 R1：`adversarial-discuss` description 遗漏既有 `topic, idea`，与 context 不一致并可能造成漏触发。
- Editor 接受 R1：恢复 `topic, idea`，新增无技能名的 product-idea 正例；trigger eval 27/27。
- RE-REVIEW (2) 关闭 R1；提交前 snapshot fingerprint 为 `316ebaad42420d347128098939dbc7b9918da0c99052c4b956951bd88ebd4050`。
- 功能提交：`40fe63b Refine adversarial workflows`，包含 19 个路径。
- `./scripts/install.sh --target codex-plugin --yes --verbose` 成功刷新 `csl-agent-kit@csl-agent-market`。
- 安装缓存与源码一致：`adversarial-discuss` SHA-256 `70a2d7dc345764549a2df51b835dc2e6e5e6c2197983f363e61a66ba133136a0`；`adversarial-review` SHA-256 `017734a84691c0715cff236c6c575425480696800da2e5134790d1ca4d6c8b12`。
