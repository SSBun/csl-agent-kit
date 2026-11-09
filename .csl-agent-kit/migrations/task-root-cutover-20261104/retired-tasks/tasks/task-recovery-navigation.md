# 展示 Task 恢复动作与阻塞条件

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-22 20:53) |
| Artifacts | [Artifacts](../artifacts/task-recovery-navigation/) |
| Kind | Task |
| Parent | optimize-task-workflow |

## Target
- [x] T1: 未完成任务可记录并展示当前产物、下一动作与必要输入，复用现有 Plan 和 Block。
- [x] T2: 任务导航展示有用恢复提示，兼容历史任务且不自动关闭或迁移它们。

## Plan

1. 在既有Plan和Block中约定可选恢复事实，保留旧任务兼容。
2. CLI JSON与Pi只读导航展示明确记录的事实，保持状态与完成门槛不变。
3. 检查解析、宽度、输入清理与无写入边界后记录证据。

- Current artifacts: [恢复投影](../../skills/meta/csl-tasks/shared/lib/task-core.js)、[Pi导航](../../pi/extensions/csl-task-overlay.ts)。
- Next action: 完成恢复导航回归与当前内容核对。
- Required input: None

## Task Summary

**Task共享核心与CLI**：[csl-tasks](../../skills/meta/csl-tasks/) 新增只读恢复事实投影，复用Plan/Block并跳过示例及歧义字段；已有状态和完成门槛不变。

**Pi任务导航**：[overlay](../../pi/extensions/csl-task-overlay.ts) 在焦点任务与列表呈现已记录事实，清理控制字符，兼容无标准元数据的历史任务。

**工作流说明**：[task](../../skills/meta/task/) 与 [README](../../README.md) 明确恢复备注的写入、失效与重新核对边界。

## Result

- T1: Plan三项恢复事实与Block两项明确字段已只读投影到core/CLI；示例、重复和缺失字段不被猜测，实际show输出核对通过。core/CLI+Pi回归76/76，见evidence/recovery.log。
- T2: Pi焦点与/tasks显示详情、普通导航显示下一动作或解除条件；历史、Completed隐藏、Cancelled、窄屏、控制字符、安全读取和无写入回归通过。文档22/22，task质量0失败（9535tokens长度warning），diff与Context结构有效，保留既有Context警告。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 新增可选事实投影和只读导航展示，不改变状态或完成权限
- Snapshot: snapshot:tasks/artifacts/task-recovery-navigation/evidence/56a079ebebb5a8417b2b90cd9c3106342f04881ef086fb17248c70612c77428e.json#56a079ebebb5a8417b2b90cd9c3106342f04881ef086fb17248c70612c77428e
- Evidence: Result T1/T2 与本项evidence日志
- Result clarity: 仅展示Plan/Block明确字段，缺失与重复省略且旧任务无需迁移
- Bounded impact: 直接消费者仅core解析返回、CLI JSON、Pi任务展示；未变更写入、授权或完成门槛
- Low risk: 错误只影响可恢复的导航文字，safePath/控制字符清理且不读非canonical新路径、不写记录
- Sufficient verification: 76项core/Pi及22项文档检查通过，覆盖历史/歧义/窄屏/只读；实际CLI输出符合记录
- Task fingerprint: 8e9e628f7b301588a2afdadda6923a62acb721920037457b1a311e242b618e41

## Verification

- Passed: 冻结后scope diff check与内容快照核对通过，相关tests通过，T1/T2满足；未启动真实Pi交互会话，使用现有组件渲染测试。
