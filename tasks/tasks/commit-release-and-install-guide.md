# 提交改动并发布可安装版本

Status: In Progress (2026-08-28 20:50)
Kind: Queue

## Scope

- 包含：提交当前全部本地改动，更新并发布 npm 版本，创建并推送对应 Git tag 与 `main`，验证 registry、远端 CI 和用户安装命令。
- 排除：额外创建 GitHub Release；仓库既有发布流程以 npm 包、Git tag 和分支推送为准。

## Target

- [ ] T1: 当前工作区的全部本地改动已提交，新版本已通过仓库既有发布渠道发布且可由其他用户安装，并提供经发布状态验证的安装说明。

## Children

1. [提交当前 Context 工作区改动](commit-context-bootstrap-changes.md)
2. [准备 CSL Agent Kit 4.0.0](prepare-csl-agent-kit-4-0-0.md)
3. [发布并验证 CSL Agent Kit 4.0.0](publish-csl-agent-kit-4-0-0.md)

## Plan

1. 完成“提交当前 Context 工作区改动”，固定版本准备前的工作区基线。
2. 完成“准备 CSL Agent Kit 4.0.0”，同步版本与发布说明并通过发布演练。
3. 在正式发布确认后完成“发布并验证 CSL Agent Kit 4.0.0”，推送、发布并验证安装与最终远端 CI。
4. 对全部子结果执行 Queue 集成验收并给出其他用户的安装方式。
