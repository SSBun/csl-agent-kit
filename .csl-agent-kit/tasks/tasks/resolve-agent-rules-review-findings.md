# 修复 Agent Rules 加载及规则语言与格式问题

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-19 14:57) |
| Kind | Queue |

## Target
- [x] T1: 仅有旧路径规则的项目能获知需要迁移，新路径继续加载规则；本次审查指出的操作指令统一使用英文并按用户指定的 ISO 标准或模板核验；保存待决问题并对两项修复做集成验证。

## Decisions

- 依次修复；在当前工作区执行。
- 采用记忆记录指引引用的 ISO/IEC/IEEE 29148:2018 要求表述原则，并参考 ASD-STE100 Issue 9 SOP 的程序写作指导。核验主体、条件、动作、可观察检查和原有约束强度。

## Children

1. [提示迁移旧路径 Agent Rules](warn-legacy-agent-rules.md)
2. [统一新增操作规则的英文格式](english-execution-evidence-rules.md)

## Plan

1. `warn-legacy-agent-rules`
2. `english-execution-evidence-rules`
3. 集成验证两项结果。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 按顺序完成两个子任务；父任务负责协调和集成验证。 | 无。 |
| 稳定性 | A | 四种文件组合和三个宿主的会话启动事件已核对。 | 未运行项目测试或启动真实宿主会话。 |
| 完整性 | A | 迁移提示、英文规则及本地格式检查均已交付。 | 未做正式标准符合性评估。 |

## Result

- T1: 两项修复已完成；四种路径组合、三个宿主的启动事件、五个技能的英文规则及本地格式约定均已核对。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 父任务仅协调和集成验收。
- Snapshot: 47d140c9fb21d2bd1a73e206ba3ef1b8c549292bda5b88842fed9b30d5424d01
- Evidence: 实际调用加载器和启动事件；六个修改包质量检查无失败。
- Task fingerprint: 16c9f8c1dfbe83aa746002ada7988813baa62bb3e5698a3613199d286091a72a

## Verification

- Passed: 启动事件显示旧路径独有时报迁移提示，新路径存在时正常注入；英文规则检查和差异检查通过。
