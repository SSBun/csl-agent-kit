# 支持项目级 SOP

Status: Completed (2026-08-16 21:02)
Kind: Task

## Target
- [x] T1: 当前项目 .agents/sops 中的 SOP 能被发现并出现在会话 SOP 摘要中
- [x] T2: 同名 SOP 按项目级、用户级、内置级顺序覆盖，列表中只保留最高优先级版本
- [x] T3: SOP 管理说明和创建流程支持明确选择项目级或用户级存储

## Plan

1. 统一摘要脚本与候选路由器的三级 SOP 发现和覆盖顺序。
2. 让 Pi 以当前 workspace 加载项目级 SOP，并补充聚焦回归测试。
3. 更新 SOP Manager 契约，完成 skill 与仓库级验证。

## Result

- T1: 项目级 .agents/sops 已由摘要脚本、候选路由器和 Pi workspace loader 发现；CLI 与 Pi 回归测试通过。
- T2: 回归测试验证同一 frontmatter name 仅保留项目 > 用户 > 内置的最高优先级版本，包括文件名不同的覆盖场景。
- T3: SOP Manager 契约、README 与 Release 路由文档已写明项目/用户存储选择、路径和覆盖顺序。
- Review gate: Skipped — 用户未要求独立或对抗式审查。

## Verification

- Passed: npm run test:all、聚焦 CLI/Pi 测试、bash/node 语法检查、Context 校验和 git diff --check 均通过；Yao 除允许的 SOP Manager 初始加载 token 预算外通过。
