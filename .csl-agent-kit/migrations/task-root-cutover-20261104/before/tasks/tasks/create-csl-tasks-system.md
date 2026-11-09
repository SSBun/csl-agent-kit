# 创建跨 Codex 与 Pi 的 CSL Tasks 系统

Status: Completed (2026-08-09 12:18)
Kind: Task

## Scope

- 包含：以 clean-room 方式创建 `csl-task`、`csl-task-plan`、`csl-task-auto`，共享宿主无关的任务状态核心，并迁移现有任务记录系统。
- 包含：Codex 与 Pi 中由当前 Agent 原生交互执行，使用宿主已有的研究、子 Agent、文件和 shell 能力。
- 排除：上游 AGPL 源码复制、Web UI、`pi-worker-*`、thinking compression、watchdog、嵌套 `codex exec` / `pi --print` 和 unattended supervisor。

## Target
- [x] T1: `csl-tasks` 集合提供三个可发现的 leaf skills，并能随完整 CSL Agent Kit 在 Codex 与 Pi 中使用。
- [x] T2: 共享任务核心确定性维护单任务、父子任务、状态迁移、恢复、取消、验证结果和索引一致性。
- [x] T3: 三个 skills 分别覆盖单任务、只读规划与 decisions-only handoff、父任务分解和子任务串行推进及最终门禁。
- [x] T4: 任务索引与 canonical records 全量迁移到 `tasks/tasks.md` 和 `tasks/tasks/`，所有当前生产者、消费者、规则、测试及有效链接使用新路径。
- [x] T5: `workspace-manage-task` 被替代且不再发现；`workspace-maintain-context`、`workspace-capture-lessons` 与 Pi 任务展示继续工作。
- [x] T6: 相关回归测试、项目检查与三个 skill packages 的治理校验通过，且交付物不包含复制的 AGPL 实现。

## Plan

1. 固化跨宿主任务协议、共享状态模型与迁移影响面。
2. 实现共享核心和三个任务 skills，并覆盖恢复、父子关系与验证门禁。
3. 迁移现有任务数据和所有运行时集成，移除被替代的 skill 入口。
4. 运行聚焦回归、完整项目检查与 skill package 审计，修复发现的问题并记录结果。

## Result

- T1: Claude manifest、Codex root export 与 Pi discovery 测试确认 csl-task、csl-task-plan、csl-task-auto 三个 leaf 均可发现。
- T2: tests/csl-tasks-core.test.mjs 覆盖 create、状态、cancel/resume、Block/In Review、父子互反、单 parent、顺序 next、验证与 complete fail-closed，8/8 通过。
- T3: 三个 SKILL.md 已分别固化单任务、planning-only decisions handoff 与 Auto 串行 child/parent integration gate，task contract 与 discovery 测试通过。
- T4: 184 个 canonical records 与索引全量迁至 tasks/tasks.md 和 tasks/tasks/；task graph、报告互链、旧活动路径 grep 及用户级 Triggerify hook self-test 均通过。
- T5: 旧 workspace-manage-task 目录和发现入口已删除；Pi overlay、context/lessons、Claude/Codex/Pi 集成回归通过。
- T6: npm run check、聚焦迁移检查、git diff --check 与三个 skill 的 local quality gate 校验已运行；local quality gate 仅报告工作流允许的 initial-load token budget 超限，新集合无上游 AGPL 标识或实现复制。
- Review gate: Skipped — no explicit user request

## Verification

- Passed: npm run check 全量通过；task 22/22、Pi 8/8，迁移、外部通知 hook 与 task core validate 均通过。
