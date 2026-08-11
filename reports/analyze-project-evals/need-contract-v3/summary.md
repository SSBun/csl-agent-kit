# need-contract-v3

最终冻结 skill snapshot。standard 与 learning 各一个 attempt 均满足内容、边界、锚点和紧凑度 rubric，接受。

| Case | Verdict | Lines | Words | Reason |
| --- | --- | ---: | ---: | --- |
| default-develop | accepted | 31 | 233 | 覆盖选择优先级、同意边界、失败出口和验证入口；无 Learning Check、风险清单或实施计划。 |
| learning | accepted | 54 | 361 | 覆盖冻结代表路径、Prediction、Transfer 与 Key；无 Recall、课程、掌握声明或实施计划。 |

## 边界

- 冻结源码 revision：`05a6c689e2344dc925b7dc111f02aa03750114f6`。
- 每个版本保留完整 skill snapshot、生成报告、去除模型隐藏推理后的 JSONL transcript 与 manifest。
- 使用 host-native fresh-context delegate，而非嵌套 `pi --print`；manifest 明确记录隔离与可重现性限制。
