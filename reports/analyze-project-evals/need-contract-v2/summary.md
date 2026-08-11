# need-contract-v2

两个 case 的内容均满足 rubric；随后仅为压缩最终 SKILL.md 而改变 skill snapshot，因此本版作为 superseded 输入保留。

| Case | Verdict | Lines | Words | Reason |
| --- | --- | ---: | ---: | --- |
| default-develop | superseded-input | 35 | 255 | 内容满足 rubric，但最终 SKILL.md 随后压缩，snapshot 不再是发布候选。 |
| learning | superseded-input | 47 | 284 | 内容满足 rubric，但最终 SKILL.md 随后压缩，snapshot 不再是发布候选。 |

## 边界

- 冻结源码 revision：`05a6c689e2344dc925b7dc111f02aa03750114f6`。
- 每个版本保留完整 skill snapshot、生成报告、去除模型隐藏推理后的 JSONL transcript 与 manifest。
- 使用 host-native fresh-context delegate，而非嵌套 `pi --print`；manifest 明确记录隔离与可重现性限制。
