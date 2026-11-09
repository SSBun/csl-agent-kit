# 运行 Spark Task Target Alignment 完整评测

Status: Blocked (2026-08-29 11:27)
Kind: Task

## Scope

- Included: 64 cases × 3 fresh repeats、精确 Spark model、oracle-free batch packets、prediction 聚合、离线 score 和 ignored JSON／Markdown artifacts。
- Excluded: 修改 provisional oracle、生产 guard、共享 task skills、运行其他模型、发布结果或将 report-only 结论解释为 release approval。

## Target

- [ ] T1: 使用精确模型 openai-codex/gpt-5.3-codex-spark 对 64 个 Task Target Alignment cases 执行三轮 fresh-context 评测，且 evaluator children 不接收 oracle。
- [ ] T2: 收集并校验全部 192 条 predictions，离线 scorer 生成过松、过紧、可见性、澄清、安全门、family、稳定性和 commitment dimension 报告。
- [ ] T3: 评测产物保存到项目 ignored results 边界，记录模型、协议、dataset 和运行证据，并明确 provisional/report-only 限制。
- [ ] T4: 完整运行无缺失 case 或基础设施错误；若模型行为未达阈值，诚实报告失败和具体 regressions，不修改生产 guard。

## Plan

1. 生成 64 个 oracle-free requests，并按每轮不同顺序拆成 16 个四-case batches，共 48 个 batch packets。
2. 用一个 async `workflowScript` 启动 48 个 `pi-agent` fresh-context children，统一锁定 `openai-codex/gpt-5.3-codex-spark`，每个 child 只读取一个 batch 并输出严格 JSON。
3. 从 managed child artifacts 聚合 192 条 predictions，拒绝缺失、重复、未知 case、invalid JSON 或 model／run ID 不匹配。
4. 运行离线 scorer 生成 provisional/report-only JSON 与 Markdown，保存 run metadata 和 subagent receipts，再记录任务证据；不修改 guard。

## Block

- Reason: Spark workflow `c6135528-6789-4b51-922a-bd50d72f1ec1` 在 48 个 batches 中完成 35 个、部分完成 1 个、因 `The usage limit has been reached` 失败 12 个；当前只有 143／192 条有效 predictions，49 条为 infrastructure failures。Partial artifacts 已保存到 ignored `evals/task-target-alignment/results/spark-2026-08-29/`，不能用其他模型补齐。
- Unblock when: `openai-codex/gpt-5.3-codex-spark` 配额恢复后，以 fresh context 重跑 `r01-b01`、`r01-b06`、`r01-b07`、`r02-b01`、`r02-b08`、`r02-b10`、`r02-b11`、`r03-b03`、`r03-b04`、`r03-b07`、`r03-b11`、`r03-b15`、`r03-b16`，替换对应 batch 后聚合出 192 条有效 predictions、0 infrastructure failures，再重新评分。
