# 允许执行继承 task-plan 的 Target 确认

Status: Completed (2026-08-31 17:06)
Kind: Task

## Scope

- 包含：同一 canonical plan record 从 task-plan 进入单任务执行时，对已接受且语义不变的 Target 进行会话内继承。
- 不包含：自动授予执行权限、持久化确认状态，或放宽目标变化、确认依据恢复和独立安全门禁。

## Target
- [x] T1: 已在 task-plan 阶段明确接受的 Task Target，在进入执行且目标、完成条件和范围边界均无实质变化时，不再重复确认
- [x] T2: 规划确认不被视为执行授权，目标变化、确认依据不可恢复及独立安全边界仍触发各自所需门禁
- [x] T3: 协议、相关消费者规则与评测对上述语义保持一致，并通过适用的确定性质量检查

## Plan

1. 明确 Target 接受状态与 workflow 阶段转换、执行授权之间的语义边界。
2. 让 task-plan、task 与稳定默认规则遵循同一继承规则。
3. 增加覆盖“显式授权执行后继承”和“目标变化仍重新确认”的对比评测，并同步语料说明。
4. 运行允许的确定性校验和 Skill Quality，审查最终差异后记录证据。

## Result

- T1: 共享协议、task 与 task-plan consumer 及稳定默认规则均规定：同一 plan record 的已接受等价 Target 在显式执行授权后直接继承，不再显示 checkpoint
- T2: 协议与 consumer 明确区分 Target 接受和执行授权，并保留确认依据丢失、Target 实质变化及 S1 Safety Overlay 门禁
- T3: 37-scenario/74-case corpus 增加 plan-to-task 对比场景；layout、eval validate、Node syntax、Context validate、Skill Quality 与 git diff --check 均无失败
- Review gate: Skipped — 用户未要求独立 adversarial review

## Verification

- Passed: 项目评测布局与 74-case validator 通过，相关 JS/MJS 语法通过，四个 Skill Quality 检查无 failure，Context 与 task check 通过，git diff --check 无错误；按当前指令未运行单元测试或 --self-test
