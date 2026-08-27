# 重构 adversarial-discuss 的角色与批量讨论流程

状态：已完成（2026-07-21）

## 目标

- 将成稿审查语义的 Editor / Reviewer 改为讨论阶段的 Synthesizer / Challenger，并保留 Coordinator。
- 默认先由 Agent 内部讨论，只在用户专属、会实质改变结果且无法内部解决的关键选择上询问用户。
- 每轮同时处理完整的相关主题与当前可见议题，减少往返轮次并禁止逐轮释放已知问题。
- 保持无固定轮次上限、完整状态交接、稳定议题 ID 与资源交接约束。
- 更新触发/行为评测、分发清单与工作区稳定事实，并通过技能审计与独立审查。

## 计划

- [x] 核对当前 skill、评测、清单和仓库验证入口，确定最小变更范围。
- [x] 更新角色契约、内部优先路由、User Decision Gate 与完整批处理协议。
- [x] 更新相关评测、README/清单和工作区事实；记录本次用户纠正形成的可复用 lesson。
- [x] 运行 Skill Creator、Skill Quality、仓库测试、安装/打包检查及前向试用。
- [x] 对最终 artifact 与 diff 运行独立 adversarial review，修复全部阻塞项后完成任务。

## 边界

- 不修改 `adversarial-review` 的既有角色或审查协议。
- 不增加新的抽象、脚本或配置，除非现有验证系统确实需要。
- 不把普通 brainstorming、简单问答或 grilling 路由到 `adversarial-discuss`。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: `discuss_workflow_reviewer`
- Round: RE-REVIEW (2)
- Scope: adversarial-discuss 角色、内部优先决策门、完整批处理、触发/行为评测、README 与上下文记录
- Summary: 角色、内部优先决策门、完整批处理与路由边界均已实现并验证。
- Unresolved: none
- Report: [Adversarial review report](../../reports/adversarial-review/redesign-adversarial-discuss-workflow.md)

## 复核

- INITIAL (1) 报告 R1：`discuss internally first`、`完整批次` 等短语可脱离角色/循环语境单独命中，需收窄语义并补中英文反例。
- Editor 接受 R1：删除四个通用正向 phrase，新增两个无显式否定词的普通 brainstorming 近邻用例；trigger eval 26/26。
- 同一 Reviewer 在 RE-REVIEW (2) 关闭 R1；最终 fingerprint 为 `7e8ab6f0f5428c6b12723974f98d8708908bc44a4e105dd045894411ab8ffbf1`。
- `npm run check`、安装/打包 dry-run、Skill Creator、local quality gate lint/resource boundary/schema validation、26/26 trigger eval、JSON 与 diff 检查均通过。
