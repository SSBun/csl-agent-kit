# 同步委派契约的两处测试断言

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-27 14:33) |
| Artifacts | [Artifacts](../artifacts/fix-contract-delegation-assertions/) |
| Kind | Task |

## Scope

仅修复上一轮审查确认的两处过时委派断言；不修改契约或其他既有本地改动，不清理历史 Context 警告。不运行测试。

## Target
- [x] T1: 两处委派断言与当前已对齐 Plan 的有界委派契约一致，保留原有检查覆盖且不改动无关内容。

## Plan

1. 核对当前契约及两处直接消费者，机械同步文案。
2. 比较变更前预计算的替换结果摘要、检查旧引用和语法；记录未执行测试的边界。

## Task Summary

**契约回归断言**：[tests](../../tests/) 同步直接读取及宿主注入检查中的委派文案，保留原有断言方式和检查范围。

## Result

- T1: 两处断言现均使用当前契约的完整委派文案；全 tests 搜索未发现旧引用。两文件 SHA256 与修改前预计算的单次替换结果完全一致，保留其余字节和所有既有覆盖。node --check 两文件及 git diff --check 均通过；未运行测试。Context 无需维护，校验通过并保留三项历史未索引警告。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅同步两个现有正则中的固定文本，不变更契约、运行时行为或测试范围。
- Snapshot: snapshot:tasks/artifacts/fix-contract-delegation-assertions/evidence/94804c916cf5457a1804dca86f64499a5abdeea71ca037257acd5d2745d2f64b.json#94804c916cf5457a1804dca86f64499a5abdeea71ca037257acd5d2745d2f64b
- Evidence: 见 Result T1：源契约静态对照、旧引用搜索、预计算摘要比对和语法检查。
- Result clarity: 上一轮 F-1 明确指向两处旧文案；当前断言完整匹配 current aligned Plan inherits its bounded scope。
- Bounded impact: 只影响两个契约测试的固定文本匹配；assert.match 方式及直接读取、宿主注入检查范围均保持。
- Low risk: 机械文本替换，不涉及权限、生产数据或运行时变更，失败可局部恢复。
- Sufficient verification: 实际文件摘要与两份预计算替换结果完全一致，旧引用已消失；两文件语法和 diff 检查通过。未运行测试，不声称整套通过。
- Task fingerprint: cac8f5878b0686e40a228c9e1fc3b9a1aaa219b5dbd29ab0a0374b53746c82b5

## Verification

- Passed: 收尾前重新搜索契约及全 tests，只有当前文案；两文件仅预期替换、语法及 diff 检查均通过，托管快照固定这两个文件和契约，未执行测试。
