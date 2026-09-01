# 发布 CSL Agent Kit 新生产版本

Status: In Progress (2026-09-01 17:06)
Kind: Task

## Scope

- 包含：将当前 `main` 中自 4.1.0 后的已提交改动整理为 SemVer 5.0.0 正式版本，同步 npm 版本与 CHANGELOG，通过既有 `main`、Git tag 和公开 npm 渠道发布并验证。
- 排除：新增功能、GitHub Release、修改 npm 包名／scope／access、强推或重写历史。

## Target

- [ ] T1: CSL Agent Kit 的一个新生产版本已通过项目既有生产发布渠道发布并可供用户获取。

## Plan

1. 根据 `v4.1.0..HEAD` 的用户可见与兼容性变化，将用户确认的 5.0.0 同步到 package、lockfile 与 CHANGELOG。
2. 运行不含项目测试的语法、结构、Skill Quality、包内容、registry 占用和 publish dry-run 检查，提交发布元数据。
3. 在正式 push、tag 与 npm publish 前展示独立 Safety Confirmation；未经确认不执行远端写入。
4. 获准后推送 `main`，等待目标 commit 的 GitHub CI 成功，再创建并推送 annotated tag、公开发布 npm 包。
5. 验证远端 main/tag、npm latest、公开安装与最终远端 main HEAD 对应 CI，记录证据并完成任务。
