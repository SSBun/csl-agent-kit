# 运行 Luna Task Target Alignment 完整评测

Status: Completed (2026-08-29 12:18)
Kind: Task

## Scope

- Included: 64 cases × 3 fresh repeats、精确 Luna model、oracle-free packets、低并发 wave 执行、prediction 聚合和独立 ignored report artifacts。
- Excluded: 使用 Spark partial results、其他模型 fallback、修改 provisional oracle／生产 guard、发布结果或把 report-only 结论视为 release approval。

## Target
- [x] T1: 使用精确模型 openai-codex/gpt-5.6-luna 对 64 个 Task Target Alignment cases 执行三轮 fresh-context 评测，且 evaluator children 不接收 oracle。
- [x] T2: 收集并校验全部 192 条 predictions，离线 scorer 生成过松、过紧、可见性、澄清、安全门、family、稳定性和 commitment dimension 报告。
- [x] T3: 评测产物保存到独立 ignored results 边界，记录模型、协议、dataset 和运行证据，并明确 provisional/report-only 限制。
- [x] T4: 完整运行无缺失 case 或基础设施错误；若模型行为未达阈值，诚实报告失败和具体 regressions，不修改生产 guard。

## Plan

1. 为 Luna 生成独立 64-case requests 和三轮随机化四-case batches，记录 model／protocol／dataset hash。
2. 用一个 async `workflowScript` 按最多 6 个 children 的 waves 串行推进 48 个 `pi-agent` fresh-context batches，不设置 turn budget，避免 Spark 运行中的并发配额和 wrap-up 失败。
3. 从 managed artifacts 容忍外层 metadata／已知非 JSON 前缀但严格校验每条 prediction，只有 192 条有效、case×repeat 覆盖准确且 infrastructure failures 为 0 才进入完整评分。
4. 保存 Luna 独立 run metadata、batch status、predictions、JSON／Markdown report 和 workflow receipts；如外部配额再次失败则保持 Blocked，不用其他模型补齐。

## Result

- T1: Workflow f57edfdd-3c05-40ca-9d53-341cedeb144c 使用精确 Luna model 完成 48 个 fresh batches（含 1 次格式 repair），覆盖 64 cases × 3 repeats；batch packets oracle-leak check 为 clean。
- T2: 已聚合 192／192 唯一 case×run predictions，48 batches 全部有效、0 infrastructure failures；离线 scorer 生成完整 JSON／Markdown，报告 action allowed 98.44%、unsafe continue 0%、unnecessary gate 0%、visibility miss 0%、consistency 95.31%。
- T3: 独立 Luna artifacts 保存于 ignored eval results，run metadata 记录 model、protocol c3219c…、dataset 57cbf9…、workflow receipt、batch status、predictions 和 provisional/report-only 报告。
- T4: 完整运行无缺失或基础设施错误，但 provisional scorer 判定 FAIL：clarification miss 12.50%、safety miss 19.05%、8 个 critical safety outcomes；未修改 guard，失败证据已保留。
- Review gate: Skipped — 用户要求模型评测而非 adversarial Reviewer–Editor 或独立批准。

## Verification

- Passed: 观察到 48/48 valid batches、192 unique case-runs、每 case 3 repeats、0 oracle leak、0 infrastructure failures；fixture validate/self-test 通过，报告失败语义与原始 case results 一致。
