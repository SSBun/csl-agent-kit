# 提交全部本地改动并发布 CSL Agent Kit 新版本

Status: In Progress (2026-09-11 15:16)
Kind: Task

## Scope

包含当前仓库全部 tracked／untracked 本地改动与新版 npm 发布；不丢弃既有改动，不强制纳入 ignored 文件。Git push、tag 和正式 npm publish 在列明实际版本、对象与影响后单独确认。未经用户明确要求，不运行测试套件。

## Plan

1. 清点当前改动与上次发布以来的变更，检查敏感内容、版本来源和 npm 发布条件。
2. 准备最小版本与 CHANGELOG 更新，执行语法、Skill Quality、包内容与发布 dry-run 检查。
3. 对冻结快照进行主 Agent 自检和 fresh read-only task-review，处理确认的问题。
4. 提交全部本地改动，向用户确认具体远端发布动作；获确认后发布并核对 registry 与适用的远端 CI。
5. 记录最终证据并核验 Git 工作区状态。

## Decisions

- 准备 npm `@ssbun/csl-agent-kit@5.1.0`，依据上次 `v5.0.0` 以来的向后兼容功能增强采用 minor；最终发布版本与远端动作待 Safety Confirmation。
- npm 版本以 package.json 为来源，package-lock.json 由 npm version 同步。其他宿主的 plugin version 保持既有 2.0.0：v5.0.0 已采用该组合，本次不扩展为跨宿主版本策略迁移。
- 用户明确要求 all local changes，因此一并提交既有 Task／Perch／Wiki 记录及原始审查证据，不对它们进行内容重写。扫描当前 22 个既有变更文件未命中常见私钥、npm／GitHub token、云访问键或高熵 secret assignment；该扫描不构成无敏感信息的完整保证。

## Target

- [ ] T1: 当前仓库的全部本地改动已纳入 Git 提交。
- [ ] T2: CSL Agent Kit 新版本已发布到 npm，且 registry 可查询到该版本。

## Result

- 发布前自检：package／lock 均为 5.1.0；CHANGELOG 覆盖 v5.0.0 后的 CLI、Task 和云效变更。27 条非测试检查全部 exit=0，详见 ../artifacts/commit-and-publish-csl-agent-kit-20260911/evidence/checks-pre-release.json。
- 发布包自检：npm pack 与 publish dry-run 成功；167 个文件，压缩大小 1,359,546 bytes，shasum=0c19252b9ea5e9a47ff66f2a5e5531431fb47b5d；关键 CLI／Skill／共享协议／Pi 入口存在，未包含 tasks、tests、项目专用 evals、旧 zip 或典型凭据文件路径。CLI help 显示 v5.1.0，三宿主 install dry-run 成功。
- 验证边界：未运行单元测试、项目测试或真实云效服务操作；10 个受发布差异影响的 Skill package 均无 quality failure，9 个有已接受的 context-budget warning（1215–5302 estimated tokens），不为减小预算删除完整工作流契约。
- 远端条件：npm latest=5.0.0、登录用户 ssbun；GitHub 仓库公开，默认分支 main；正式 publish、push、tag 和新版本远端 CI 均尚未执行。T2 尚未满足。
