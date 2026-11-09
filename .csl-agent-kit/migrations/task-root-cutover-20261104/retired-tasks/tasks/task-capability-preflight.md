# 提前核对 Task 验证与审查能力

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-22 20:56) |
| Artifacts | [Artifacts](../artifacts/task-capability-preflight/) |
| Kind | Task |
| Parent | optimize-task-workflow |

## Target
- [x] T1: 明显依赖独立审查、特定检查或宿主操作的任务在准备阶段核对能力与授权。
- [x] T2: 预检不授予权限或预判最终风险，不降低实际审查与验证要求，并提供明确恢复条件。

## Plan

1. 将必要能力与授权核对提前到对齐后的准备阶段。
2. 单任务、计划和队列共享同一预检说明，明确缺项恢复和规划边界。
3. 对照现有授权、判级及审查门槛检查语义并验证修改包。

## Task Summary

**Task工作流说明**：[task](../../skills/meta/task/) 统一描述准备阶段能力预检及恢复边界，[task-plan](../../skills/meta/task-plan/) 和 [task-queue](../../skills/meta/task-queue/) 仅引用该流程；复用已有授权，不新增状态、授权或终态豁免。

**使用说明**：[README](../../README.md) 说明预检用途与规划交接边界。

## Result

- T1: 对齐后的准备阶段新增必要runtime、验证授权、fresh/read-only宿主能力和证据保存条件检查；Task-plan/Queue引用同一入口。直接语义对照及引用/边界断言通过，文档回归22/22。
- T2: 明确保留已有授权与例外范围、不占位review、不提前判级、不降低要求；缺项记录Plan/Block和恢复条件，只允许当前child独立工作，未来执行前提不阻断完整计划。三个Skill质量0失败，接受10132/1916/2485tokens长度warning；辅助只读核对无具体问题。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 提前检查现有必要条件的文档澄清，不改变授权、风险分类、review或状态实现
- Snapshot: snapshot:tasks/artifacts/task-capability-preflight/evidence/f85b3bd89b2fbda1d16e4c9c5d2778bf4744694e584e7adc4c7c2441af2b55e7.json#f85b3bd89b2fbda1d16e4c9c5d2778bf4744694e584e7adc4c7c2441af2b55e7
- Evidence: Result T1/T2及evidence/docs.log
- Result clarity: 检查时间和用途明确，原终态要求完整保留
- Bounded impact: 单一权威Task章节及两个消费者短引用，CLI与状态规则没有更改
- Low risk: 仅在现有流程提前暴露缺项；复用授权、不能跳child或扩展例外，修改可直接回退
- Sufficient verification: 逐句与现有门槛比较、文档22/22、跨消费者引用断言及3包质量检查通过
- Task fingerprint: 4ebaec8696a8b6dca8e68349ba7a72c4f9226e7017320fec00da20ae26882318

## Verification

- Passed: 当前snapshot与diff check匹配，准备/授权/规划/队列边界对照满足T1/T2；没有把文档断言当实际Agent行为回放。
