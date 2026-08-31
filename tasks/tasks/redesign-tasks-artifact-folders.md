# 重新设计 tasks 产物目录划分

Status: Completed (2026-08-31 14:42)
Kind: Task

## Target
- [x] T1: 给出不受现有目录结构约束、基于职责与生命周期的 tasks 子目录最优划分
- [x] T2: 明确每类内容的归属、互斥边界和典型示例，使讨论过程、中间产物、任务状态与最终交付物可无歧义路由
- [x] T3: 在保持现有任务索引与任务记录目录不变的前提下，为其他子文件和目录给出四种不同划分方案，并说明各自设计意图
- [x] T4: 在文件路径不随状态或执行阶段变化的前提下，基于实际 Task 执行列出可能产生的文件类型及其稳定归属

## Plan

1. 固定现有任务索引与任务记录目录的职责和命名。
2. 从 Task 工作流、讨论、研究、设计、验证和交付过程识别实际生成的文件。
3. 按不会随任务状态改变的文件职责确定稳定归属，并验证常见 Task 场景。

## Decisions

- 现有任务索引与 `tasks/` 任务记录目录保持不变，统一承载 `task`、`task-plan` 与 `task-queue` 的 canonical records。
- 文件路径由创建时可确定且不会随状态变化的职责决定；草稿、确认、完成或归档等状态变化不得要求移动文件。
- 其他文件和目录的具体划分仍以实际生成文件及稳定职责为依据。

## Result

- T1: 已形成按权威性与生命周期划分的最小结构：tasks、artifacts、conversations、context 和 lessons；tasks 统一承载 task、task-plan 与 task-queue 的 canonical records，artifacts 再区分 supporting 与 deliverables。
- T3: 已给出生命周期型、文档职责型、Task 聚合型和受众／交接型四套可独立采用方案；每套均说明设计意图、目录归属、RFC 示例与主要取舍。
- T2: 进一步验证 Task 聚合方案的内部边界：二分类会混合探索材料、稳定交接和验证证据；建议按需使用 notes、handoffs、evidence、deliverables 四个角色，仍保持每项唯一归属。
- T4: 已核对当前 Task、Context、Lessons、Archive、Brainstorming 与 Deliberate 的写入契约，区分必有任务记录、条件性讨论／规格／报告／证据文件、对话归档及 tasks 外的产品文件；建议路径按文件固有职责固定，不编码状态。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 用讨论记录、RFC、实施计划、调查报告、验证日志、截图和最终报告逐项检查：均按固有文档职责保持同一路径，Draft、Accepted、Completed 或 Superseded 不触发移动。
