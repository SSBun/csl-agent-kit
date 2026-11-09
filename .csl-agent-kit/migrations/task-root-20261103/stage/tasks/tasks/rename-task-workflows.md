# 迁移任务工作流公开名称

Status: Completed (2026-08-11 17:22)
Kind: Task

## Target
- [x] T1: 三个 canonical skills 分别以 task、task-plan、task-queue 公开，旧 skill 名称与 alias 不再被发现。
- [x] T2: Pi 的 Agent 工具与用户命令迁移为 task_focus、/task-focus 和 /tasks，session focus 行为保持不变。
- [x] T3: 新队列父任务写入 Kind: Queue，现有 Kind: Auto 记录继续可读；生产者、消费者和格式测试一致。
- [x] T4: 内置 Triggerify 使用最终名称在支持的宿主 session 启动和压缩后注入任务工作流指引，不依赖替换 Super Agent。

## Scope

- 公开入口不保留 `csl-task*`、`csl_task_focus`、`/csl-task-focus` 或 `/csl-tasks` 兼容 alias；该 breaking migration 对应未来 major release。
- 既有历史任务文件不批量改写；内部集合目录、共享 CLI 文件名和 Pi custom entry 类型保持稳定。
- 内置 Triggerify hook 沿用现有 inner hook 默认启用、用户可禁用的控制边界；Cursor 保持 unsupported。

## Plan

1. 同步迁移 skill identities、Agent metadata、路由说明、发现清单和公开文档。
2. 迁移 Pi focus 工具与命令，并更新聚焦回归测试及 Context。
3. 将新父任务 kind 切换为 Queue，同时验证旧 Auto 读取边界和所有格式消费者。
4. 用内置 Triggerify session hook 统一注入最终工作流指引，移除宿主清单中的重复注入。
5. 运行 skill 审计、全量测试、Context/任务校验和旧名称搜索。

## Result

- T1: Skill discovery, Claude manifest, routing, and task contract tests expose only task, task-plan, and task-queue; old skill directories are absent.
- T2: Pi tests register task_focus, /task-focus, and /tasks while preserving session focus persistence and rejecting the old public names.
- T3: Shared core tests confirm new Kind: Queue writes, reject new auto kinds, and read and operate on legacy Kind: Auto parents as queues.
- T4: Triggerify and Pi tests confirm the default-enabled inner hook injects final task guidance on supported session starts, rebuilds after Pi compaction, and the host matcher includes compact without direct duplicate injection.
- Review gate: Skipped — User did not request independent adversarial review.

## Verification

- Passed: npm run check, focused final hook tests, three routing evals, Context and Lessons validation, skill audits, and git diff --check passed; local quality gate reported only permitted workflow token-budget warnings.
