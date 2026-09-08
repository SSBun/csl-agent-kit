# Task Target Alignment 评测

本套件验证分级 guard：

- `L0_NO_TASK`：无需 canonical task。
- `L1_TRIVIAL_PASS`：琐碎等价编辑可直接继续。
- `L2_VISIBLE_CHECKPOINT`：非平凡等价 Target 保持可见；明确依据覆盖全部条款时展示后继续，否则仅等待未完成的核对或既有强制门禁。
- `L3_CLARIFICATION_HOLD`：用户歧义，先问一个问题。
- `L4_TARGET_CHANGE_APPROVAL`：Target 改变授权，展示差异并等待批准。
- `S1_REQUIRED`：独立 Safety Confirmation 仍然存在。
- delegated child：不进入用户可见 L0–L4；Plan 覆盖完整时 `continue_delegated`，否则 `return_to_main`。

Main-session actions 为 `no_task`、`trivial_pass`、`show_continue`、`show_checkpoint`、`clarify`、`show_change_wait` 和 `continue_unchanged`；delegated actions 为 `continue_delegated` 与 `return_to_main`。Oracle 使用 `allowedDecisions`，因此琐碎等价 case 可以同时允许 L1 或 L2，而不会把协议允许的选择误判为失败。

## 文件

- `cases.json`：46 个 contrast scenarios、92 个展开 cases 和 provisional v4 oracle；保留 main／delegated、task-plan → task 继承、material／implementation-only Plan change，新增明确修订、澄清收敛、局部用户要求核对、跨环境／任务误复用、撤销条件、组合效果、事实与未接受摘要、恢复依据缺失等对照。人工 adjudication 前固定为 `report-only`。
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

`prepare` 输出不包含 oracle。v4 prediction 必须声明 `csl-task-target-alignment-prediction/v4`，包含 `settledClauses`（`clause`／`basis`／零起点 `sources`）、`confirmationItems` 和 `checkpointReason`。条款键为 `outcome`、`doneWhen.N`、可选 `boundaries`；每项是一个确认单元。`show_continue` 必须覆盖完整 Target、无待核对项且无等待原因；`show_checkpoint` 明确保留用户要求、分发图变化、恢复依据缺失等原因。非 L2 展示动作的确认列表为空、原因为空。

本套件评估给定候选 Target，不评估自由生成：展示动作须原样返回候选的三个结构字段，不能通过悄悄改写 Target 获得正确动作分数。Scorer 分开统计可见性、checkpoint 遗漏／多问、已定条目重复询问、错误来源复用、已定／待定覆盖遗漏、展示内容不一致，以及原有 guard、Safety、delegation、reason、transition、family、stability 指标。相同 L2 level 下错误直行也计入 under-guard；条款错误会进入逐 case comparison，而不只比较 level/action。

来源匹配是对 provisional reference 的精确比较，不是语义蕴含证明；同样有效的另一组来源须由人工 adjudication 判断，不能把字段存在或合成 perfect prediction 当作模型可靠性证据。局部核对的自然语言对照覆盖明确用户要求与 L3 格式选择；`unsettled_interpretation` 的分区逻辑另有合成自检，尚不能声称该边界已有独立人工标注覆盖。历史 v3 报告不能直接与 v4 比较；需要在相同 v4 dataset hash 下重新生成／评分，旧结果保留为历史。

`validate`／`prepare` 不调用模型或运行测试。`--self-test` 和项目测试只在当前请求明确授权后运行；付费模型运行仍需单独授权。PASS／FAIL 只表示当前 provisional labels 下的阈值结果，不构成 release approval。
