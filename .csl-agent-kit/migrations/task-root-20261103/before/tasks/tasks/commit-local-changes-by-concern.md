# 按关注点拆分并提交全部本地改动

Status: Completed (2026-08-11 10:59)
Kind: Task

## Target
- [x] T1: 当前 tracked 与 untracked 交付物按独立功能或关注点分组，每项变更仅归属一个逻辑提交且不混入无关内容。
- [x] T2: 每个分组使用清晰的 Conventional Commit 风格消息提交，并记录提交 SHA、消息和主要文件范围。
- [x] T3: 所有适用验证通过，生成的会话元数据不进入版本库，最终 git status 为空。

## Scope

- 包含当前工作树中所有 tracked 与 untracked 项目交付物。
- 排除 Pi 运行时生成的 `.pi-glla/` 会话元数据；该目录在收尾时删除而不提交。
- 不改变现有交付内容，仅通过 index 级部分暂存拆分混合文件并提交。

## Plan

1. 检查完整 status、diff 与任务历史，建立关注点—文件/区块映射。
2. 运行基线验证，随后按关注点逐组暂存并复核 staged diff。
3. 使用 Conventional Commit 消息提交每组变更并记录 SHA。
4. 删除生成元数据，运行最终验证，完成任务记录并提交任务收尾。

## Decisions

- 独立关注点包括：deliberate 生命周期、align 重命名、code-review 合并、deep-explore 退役、tldr、skill 质量评分、analyze-project 系统化报告、workspace workflow 现代化、Pi task overlay 稳定性。
- 对同时包含多个关注点的 manifest、README、测试和依赖文件使用 index 级内容拆分，不改写最终工作树。
- 历史任务记录随 workspace workflow 的 `tasks/todo` → `tasks/tasks` 迁移统一提交；本任务完成记录单独收尾提交。

## Result

- T1: 将全部交付改动拆为 10 个关注点提交；共享 manifest、README 与路由测试集中在单独的 skills integration 提交，未混入实现提交。
- T2: Conventional commits：663de0d scorecard；5341fff deliberate；bc16bbb align；0878907 code-review；a943a34 tldr；5522126 deep-explore；22749fa analyze-project；d480a05 workspace；b0848f1 Pi overlay；39ec383 skill integrations。
- T3: 两次 npm run check 全部通过；context/lessons/task validation 有效；git diff --check 通过；.pi-glla 与 .DS_Store 已删除且提交前工作树为空。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查。

## Verification

- Passed: npm run check：CLI 28/28、Triggerify 29/29、Tasks 26/26、Pi 8/8 通过，安装 dry-run 成功；context、lessons 和 task 校验有效。
