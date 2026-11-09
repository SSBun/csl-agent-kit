# 审计并构思跨会话 Handoff 机制

## 计划

- [x] 读取 handoff-save、handoff-restore、格式模板、实际 handoff 样本和相关历史审计。
- [x] 验证两个 skill 的结构、资源边界、存储与恢复流程。
- [x] 说明当前用法，识别“继续执行”与“继续思考”的差距，并提出最小设计方向。

## 复核

- 当前双 skill 分工清楚，适合把单一编码任务从一个会话交给下一个会话；实际样本证明 Task Scope、Pinboard、Locked Decisions 和 Next Action 可用。
- 主要缺口是单项目单文件会冲突、restore 未校验 workspace/branch/HEAD、格式要求展示不存在的 In Progress、显式 project-name 缺少严格规范化，以及 handoff 没有 consumed/archive 生命周期。
- 当前格式保存执行位置多于思考前沿；若目标是跨会话继续推理，应保存当前心智模型、未决问题、候选路径、证据缺口和下一步思考动作，而不是保存聊天叙事。
- quick validation 通过；local quality gate lint、governance 和 resource boundary 通过，聚合结果仅报告仓库统一的 `Missing agents/interface.yaml` 约定缺口；两个 skill 当前都没有 trigger eval。
