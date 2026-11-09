# 让非平凡任务始终展示 Task Target

Status: Completed (2026-08-29 08:46)
Kind: Task

## Scope

- Included: 共享对齐协议、三个 task-family 消费者、分发的稳定 Agent 契约／规则、相关 fixtures 与确定性质量检查。
- Excluded: 为等价 Target 增加确认等待、披露详细 Approach／Plan、持久化 alignment 状态、修改 task core 状态模型，或改变仅由琐碎确定性文件编辑触发的 task 的现有展示语义。

## Target
- [x] T1: 对具体、非平凡 outcome，task、task-plan 与 task-queue 在 owning record 激活后、任何实质工作前，都向用户展示一次当前 Task Target，即使候选目标与用户授权实质等价。
- [x] T2: 实质等价的 Target 展示后直接继续且不要求重复确认；存在用户歧义时继续聚焦澄清，存在实质差异时展示后等待明确确认。
- [x] T3: 用户可见 Target 仍只描述结果、可观察完成条件和必要边界，不包含实现方法、算法、文件、命令或内部 Plan。
- [x] T4: 共享协议、三个消费者及其分发规则和质量验证对新的可见对齐语义保持一致。

## Plan

1. 将共享协议改为具体非平凡 outcome 的 ready Target 先渲染同一结果结构，再按实质等价性决定直接继续或等待确认；保留琐碎确定性文件编辑的现有等价展示例外。
2. 同步三个消费者、分发规则、Context 与相关 fixtures 中的可见对齐语义，同时保留无重复确认边界。
3. 运行 JSON 解析、逐包 Skill Quality、Context 校验和 diff 检查；按当前用户规则不运行项目测试套件。

## Result

- T1: 共享协议现在要求具体非平凡 outcome 的每个 ready Target 在实质工作前展示一次；三个 task-family 消费者与两份分发规则同步声明该门禁。
- T2: 协议将等价路径定义为展示后同一轮立即继续、不等待回复；非等价路径追加本地化确认提示并停止等待，琐碎确定性文件编辑保留原有等价展示例外。
- T3: 统一 Task Target 模板仍仅包含 Outcome、Done when 与可选 Boundaries，并明确禁止实现方法、文件、命令、内部 Plan 和 checkbox。
- T4: 已同步 task/task-plan/task-queue、共享协议、super-agent 规则、routing fixtures、静态回归断言与 Context；三项 Skill Quality 均 0 failure。
- Review gate: Skipped — 用户未要求 adversarial review、Reviewer–Editor 循环或独立批准。

## Verification

- Passed: 自定义契约检查、修改后 JS 语法、JSON 解析、Context validate 与 git diff --check 均通过；Skill Quality 仅报告三个既有 workflow context-budget warning，未运行用户未授权的项目测试。
