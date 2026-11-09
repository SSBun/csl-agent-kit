# 提交全部本地改动并发布 CSL Agent Kit 新版本

Status: In Review (2026-09-11 15:28)
Kind: Task

## Scope

包含当前仓库全部 tracked／untracked 本地改动与新版 npm 发布；不丢弃既有改动，不强制纳入 ignored 文件。Git push、tag 和正式 npm publish 在列明实际版本、对象与影响后单独确认。未经用户明确要求，不运行测试套件。

## Plan

1. 清点当前改动与上次发布以来的变更，检查敏感内容、版本来源和 npm 发布条件。
2. 准备最小版本与 CHANGELOG 更新，执行语法、Skill Quality、包内容与发布 dry-run 检查。
3. 全部原始本地改动已提交 c71cbef；TR-1 的 Queue 最终 Verification 修复及契约断言已提交 1ac923f。两轮 fresh task-review 已结束，TR-1 resolved，最新范围无确认问题，返回后机械核对冻结内容与证据全部匹配。
4. 提交后续任务记录，向用户确认具体远端发布动作；获确认后推送 main，等待 exact-head 既有 CI 成功，再创建／推送 v5.1.0 annotated tag 并以 public/latest 发布 npm。未经确认不执行这些动作。
5. 记录最终证据并核验 Git 工作区状态。

## Decisions

- 准备 npm `@ssbun/csl-agent-kit@5.1.0`，依据上次 `v5.0.0` 以来的向后兼容功能增强采用 minor；最终发布版本与远端动作待 Safety Confirmation。
- npm 版本以 package.json 为来源，package-lock.json 由 npm version 同步。其他宿主的 plugin version 保持既有 2.0.0：v5.0.0 已采用该组合，本次不扩展为跨宿主版本策略迁移。
- 用户明确要求 all local changes，因此一并提交既有 Task／Perch／Wiki 记录及原始审查证据，不对它们进行内容重写。扫描当前 22 个既有变更文件未命中常见私钥、npm／GitHub token、云访问键或高熵 secret assignment；该扫描不构成无敏感信息的完整保证。

## Target
- [x] T1: 当前仓库的全部本地改动已纳入 Git 提交。
- [ ] T2: CSL Agent Kit 新版本已发布到 npm，且 registry 可查询到该版本。

## Result

- 发布前自检：package／lock 均为 5.1.0；CHANGELOG 覆盖 v5.0.0 后的 CLI、Task 和云效变更。27 条非测试检查全部 exit=0，详见 ../artifacts/commit-and-publish-csl-agent-kit-20260911/evidence/checks-pre-release.json。
- 发布包自检：TR-1 修复后重新执行 npm pack 与 publish dry-run，167 个文件，压缩大小 1,359,680 bytes，shasum=390d02e41acce59e89f66fb2d80bb497de44f13a；关键 CLI／Skill／共享协议／Pi 入口存在，未包含 tasks、tests、项目专用 evals、旧 zip 或典型凭据文件路径。此前 CLI help 显示 v5.1.0，三宿主 install dry-run 成功。最新输出见 ../artifacts/commit-and-publish-csl-agent-kit-20260911/evidence/checks-pass-2.json。
- 验证边界：未运行单元测试、项目测试或真实云效服务操作；10 个受发布差异影响的 Skill package 均无 quality failure，9 个有已接受的 context-budget warning（1215–5302 estimated tokens），不为减小预算删除完整工作流契约。
- TR-1 修复与复审：1ac923f 在 Queue Parent Final Gate 补上最终核查、通过后 verify 写入、scope drift 回退和失败阻塞，并添加 verify 在 complete 前的契约断言。fresh reviewer run 192495a3-d5ec-4306-bbe0-f3556418a61b 确认 TR-1 resolved、无新问题；首轮与第二轮快照均完成机械哈希复核。返回后6条非测试检查再次通过，tarball shasum未变。新断言未运行，仅语法检查；最新证据见 ../artifacts/commit-and-publish-csl-agent-kit-20260911/evidence/checks-final-pre-publish.json 与 task-review-pass-2.md。
- 远端条件：npm latest=5.0.0、登录用户 ssbun；GitHub 仓库公开，默认分支 main；正式 publish、push、tag 和新版本远端 CI 均尚未执行。T2 尚未满足。
- T1: 初始全部本地改动及5.1.0准备已提交c71cbef，Queue审查修复已提交1ac923f；发布源码已冻结，后续生命周期与验证证据将在Safety Confirmation前一并提交。
- Review gate: Passed — 两次fresh只读reviewer完成；192495a3-d5ec-4306-bbe0-f3556418a61b对1ac923f复审为Findings none、TR-1 resolved；主会话核对41个源文件、修复diff、原始证据哈希均匹配。此门针对发布准备文件；T2正式发布仍待用户安全确认。

## Verification

- Passed: 最终review gate后重新执行源码diff空白、修改测试文件语法、当前Task check及全索引validate，全部通过；发布包双dry-run与41源文件哈希核对见checks-final-pre-publish.json。未运行测试或远端动作；T2不标为完成。
