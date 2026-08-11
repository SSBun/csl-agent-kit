# need-contract-v1

首次执行。standard 内容通过，但随后 skill 输入发生变化；learning 未满足冻结代表路径、Prediction 与 Transfer，因此拒绝。

| Case | Verdict | Lines | Words | Reason |
| --- | --- | ---: | ---: | --- |
| default-develop | superseded-input | 38 | 386 | 内容满足 rubric，但后续 skill snapshot 变化，不能作为最终 accepted attempt。 |
| learning | rejected | 47 | 307 | 未使用冻结的 pi,cursor,pi 代表路径，Prediction 与 Transfer 也未匹配冻结检查。 |

## 边界

- 冻结源码 revision：`05a6c689e2344dc925b7dc111f02aa03750114f6`。
- 每个版本保留完整 skill snapshot、生成报告、去除模型隐藏推理后的 JSONL transcript 与 manifest。
- 使用 host-native fresh-context delegate，而非嵌套 `pi --print`；manifest 明确记录隔离与可重现性限制。
