# 绘制 Task 中断恢复优化流程图

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-29 19:53) |
| Kind | Task |

## Scope

将既有中断恢复优化建议绘制为聊天内 ANSI 终端流程图，不修改方案内容或系统实现，不生成额外图片和报告。

## Target
- [x] T1: 用中文终端流程图表达前述恢复检查与外部动作防重复分支，保留授权、证据漂移和结果未知的边界

## Plan

1. 对照 [恢复优化方案](plan-task-recovery-improvements.md) 与当前对话，提炼主流程和外部动作恢复分支。
2. 使用原生 ANSI 终端图展示建议方案，保留当前模式、原始授权、证据漂移、写前失败和防重复动作约束。
3. 核对成功回执、未知结果、补录回执与最终任务验收的区别。

## Task Summary

未修改代码或组件；交付两张聊天内终端流程图。

## Result

- T1: 两次 render_ansi 均成功显示中文流程图：主图覆盖模式与授权、产物/Topic/证据漂移及正常终态门禁；细节图覆盖操作意图写入、未决尝试、回执保存失败、权威查询、成功去重、确认无副作用后有条件重试和未知/部分成功阻塞。图中注明建议未实施、探索/SOLO 保留原规则、动作成功不等于任务完成及 Queue 不跳过阻塞 child。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 仅将既有方案可视化为聊天内终端文本，无请求交付物文件变更，无独立审查义务，属于 R0。
- Snapshot: no-file:visualize-task-recovery-workflow:two-render-ansi-diagrams-v1
- Evidence: 对照 plan-task-recovery-improvements 的 Decisions 与上一轮用户可见方案核对流程；未运行测试、外部操作或模型生成图像。无新项目事实，Context 无需维护。
- Task fingerprint: 299c6090d414758fb40d7325b9dca1a7d3c4924e25a4b64704ebf8ce34f71742

## Verification

- Passed: 直接核对两次渲染返回内容：无截断告警；授权与必要确认依当前模式，证据漂移不沿用旧结论，结果未知不自动重试，外部动作只返回主流程验收；canonical check 已通过。
