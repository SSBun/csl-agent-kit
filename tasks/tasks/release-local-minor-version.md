# 提交全部本地改动并发布新的 minor 版本

| Field | Value |
| --- | --- |
| Status | Blocked (2026-10-27 19:27) |
| Artifacts | [Artifacts](../artifacts/release-local-minor-version/) |
| Kind | Task |

## Scope

包含本仓库全部未忽略的 tracked／untracked 本地改动及 5.2.0 发布元数据；保留既有内容，不处理其他任务状态或批量修复历史记录。未经明确授权不运行测试；远端推送、tag、npm publish 须列明对象并取得独立确认。

## Plan

1. 已确认 package／lock 当前版本 5.1.0，registry latest 为 5.0.0，目标采用新的 minor 5.2.0；沿用宿主 plugin 独立 2.0.0 版本策略。
2. 更新 package／lock 与 CHANGELOG，核对全部待提交内容及敏感信息，执行非测试语法、Skill Quality、打包内容与发布 dry-run 检查。
3. 完成本地提交；在正式推送前说明 main 已有 47 个领先提交，并确认含测试的远端 CI 执行授权。
4. 取得确认后推送 main，核对 exact-head CI；成功后创建／推送 v5.2.0 annotated tag，发布 npm public/latest 并核实 registry 与包摘要。
5. 对实际结果执行自检、R2 独立只读审查和最终核对，记录证据与未完成边界。

- Current artifacts: 本地发布准备提交 3f4dbd2977bc6efb143dbb285180ac9f5ae22001；版本 5.2.0；../artifacts/release-local-minor-version/evidence/。
- Next action: 用户完成 npm login 并明确确认远端推送／发布及远端 CI 测试后，重新核对身份、远端 HEAD、版本可用性及冻结发布内容，继续执行发布。
- Required input: npm whoami 返回 E401，需要用户完成 npm login；正式推送／发布及含测试的远端 CI 待明确确认。

## Decisions

- GitHub 登录账户为 SSBun；origin 指向 https://github.com/SSBun/csl-agent-kit.git，远端 main 当前为 2df08a82150d9115849def62f5b740dd65bf18f9。
- npm 包为 @ssbun/csl-agent-kit，5.2.0 尚不存在。当前 npm 身份不可用，不输出或读取凭据，不替换认证机制。
- 此前 5.1.0 只有本地准备记录、未发布；新版本按用户要求基于本地 5.1.0 增为 5.2.0，发布说明补充上一已发布 v5.0.0 后的可见变化。

## Task Summary

**npm 版本元数据**：[package.json](../../package.json) 将版本从 5.1.0 更新为 5.2.0，使用 npm 同步 lockfile，保持既有独立宿主 plugin 版本不变。

**发布说明**：[CHANGELOG.md](../../CHANGELOG.md) 新增 5.2.0 条目，概括 Task 证据工具、Topic、Pi、Context 与修复，并说明包含尚未单独发布的 5.1.0 改动。

## Target
- [x] T1: 当前仓库全部本地改动提交至 Git，保留已有变更。
- [ ] T2: 按仓库既有发布流程发布新的 minor 版本，并核实版本与发布结果；无法执行的验证或发布步骤明确披露。

## Result

- 发布准备检查：package／lock 为 5.2.0；npm pack 与 publish dry-run 均通过，包含 194 个文件、压缩大小 1453596 bytes，shasum=6b58461fb10aefbca4904c18f25c38e10730fda0。新增证据模块包含在包中，tasks／tests／项目专用 evals 未进入 npm 包。原始输出见 ../artifacts/release-local-minor-version/evidence/。
- 14 个受 v5.0.0 后变更影响的 Skill packages 逐包质量检查无失败；13 个有 context-budget warning（1319–10180 estimated tokens），为保留完整工作流而接受，不据此删改契约。当前 13 个修改 JS／MJS 语法检查、28 个 JSON 解析、CLI help、install dry-run、alignment 122-case 数据校验和 diff check 均通过。未运行测试。
- 常见私钥／GitHub token／npm token／AWS access key 模式扫描未命中待提交文件；该检查不证明不存在所有敏感内容。Context 校验通过，保留三项历史未索引段落警告，无本任务引入的稳定项目事实需要写入。
- 验证脚本首次读取到并行生成中尚未完成的 JSON；生成命令结束后重新执行，全部 JSON 解析通过。详情见 static-checks.json，不将该次脚本失败归为项目故障。
- 当前阻塞：npm whoami E401；远端 main／tag／npm 尚未写入，不声称 T2 完成。发布阶段的 R2 自检、独立只读 task-review 与最终验证仍待实际结果和证据，不沿用之前单次本地审查作为发布完成门槛。

## Block

- Reason: npm 身份校验 E401；尚未取得列明 5.2.0、全部领先提交、public/latest 及自动触发远端测试后的正式动作确认。未执行 push、tag 或 publish。
- Unblock when: 用户在本机完成 npm login，npm whoami 成功且归属匹配，并明确同意推送全部领先提交到 origin/main、允许既有 GitHub Actions 测试、创建／推送 v5.2.0 和公开发布 @ssbun/csl-agent-kit@5.2.0。
- T1: 全部原始 tracked／untracked 本地改动、5.2.0 元数据与本轮检查证据已提交 3f4dbd2977bc6efb143dbb285180ac9f5ae22001（97 files）；提交后 git status --short 为空。后续仅记录本任务的发布阻塞与恢复信息。
