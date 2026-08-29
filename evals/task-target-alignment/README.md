# Task Target Alignment 评测

本套件验证分级 guard：

- `L0_NO_TASK`：无需 canonical task。
- `L1_TRIVIAL_PASS`：琐碎等价编辑可直接继续。
- `L2_VISIBLE_CHECKPOINT`：非平凡等价 Target 展示并等待一次核对。
- `L3_CLARIFICATION_HOLD`：用户歧义，先问一个问题。
- `L4_TARGET_CHANGE_APPROVAL`：Target 改变授权，展示差异并等待批准。
- `S1_REQUIRED`：独立 Safety Confirmation 仍然存在。
- delegated child：不进入用户可见 L0–L4；Plan 覆盖完整时 `continue_delegated`，否则 `return_to_main`。

Main-session actions 为 `no_task`、`trivial_pass`、`show_checkpoint`、`clarify`、`show_change_wait` 和 `continue_unchanged`；delegated actions 为 `continue_delegated` 与 `return_to_main`。Oracle 使用 `allowedDecisions`，因此琐碎等价 case 可以同时允许 L1 或 L2，而不会把协议允许的选择误判为失败。

## 文件

- `cases.json`：36 个 contrast scenarios、72 个展开 cases 和 provisional v3 oracle；覆盖 main／delegated session role、material／implementation-only Plan change，人工 adjudication 前固定为 `report-only`。
- `results/`：生成的 request／prediction JSONL 与报告；由根 `.gitignore` 排除。
- `../scripts/evaluate-task-target-alignment.js`：离线 validator、request preparer、scorer 和 comparator。
- `../skills/task-target-alignment-eval/SKILL.md`：当前项目专用的维护与运行工作流。

## 离线命令

```bash
node evals/scripts/evaluate-task-target-alignment.js validate
node evals/scripts/evaluate-task-target-alignment.js --self-test
node evals/scripts/evaluate-task-target-alignment.js prepare --output evals/task-target-alignment/results/requests.jsonl
node evals/scripts/evaluate-task-target-alignment.js score \
  --predictions evals/task-target-alignment/results/predictions.jsonl \
  --output evals/task-target-alignment/results/report.json \
  --markdown evals/task-target-alignment/results/report.md
node evals/scripts/evaluate-task-target-alignment.js compare \
  --baseline evals/task-target-alignment/results/baseline.json \
  --candidate evals/task-target-alignment/results/candidate.json
```

`prepare` 输出不包含 oracle。`score` 报告 guard level、checkpoint、mode、Safety Overlay、child confirmation leak、stale-plan continue、reason completeness、transition、family、stability 和 commitment dimensions。PASS／FAIL 只表示当前 provisional labels 下的阈值结果，不构成 release approval。付费模型运行仍需单独授权。
