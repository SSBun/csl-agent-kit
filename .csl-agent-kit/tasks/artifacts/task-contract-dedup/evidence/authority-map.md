# Contract 去重核对

- 对照副本：本目录 `contract-before.md`，为本子项编辑前实际工作区字节；包含已存在的并行 Context 改动。
- 大小：17,274 → 15,577 bytes，减少 1,697 bytes（9.8%）；未测量真实模型 token、耗时或遵循率收益。
- `Task, Context, and Lessons` 区块逐字节保持；Engineering Judgment、Simplicity First、Surgical Changes 不变。

| 移出的重复细节 | 仍适用的权威入口 |
| --- | --- |
| 模式优先级、旧 autonomous 存储兼容 | `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md` / Confirmation Modes、Configuration；Task Mode |
| 确认分级字面量和重复 SOLO 路径 | 同一 Target 协议 / SOLO execution path、Guard Levels、User-Facing Target Body |
| ledger schema、重复与 malformed 拒绝、计数阈值、reset/resume | `skills/meta/task/SKILL.md` / Record Contract / Review；`task-review/references/review_workflow.md` / Fixed Reviewer Prompt |
| assessment 字段和身份记录步骤 | Task / Review Assessment；`csl-tasks/shared/protocols/task-review-grading.md` / Record the Assessment |
| 重复 adversarial opt-in 句及分级路径展开 | Contract Review 仍保留明确 opt-in；Grading / Explicit Review and Existing Obligations 保留详细路径 |

常驻仍要求：先激活/对齐，再准备/执行；R2 和明确普通 review 必须 fresh/read-only；Required 不得 Skipped；失败 Block；漂移失效；整改与 false-positive fresh 核实；stall 停止并记录可观察恢复条件；最终验证。独立分析本身可验收时走 Task，面向后续执行的调查走 Task Plan。

检查界限：文档断言与宿主 Hook 注入检查不能证明真实 Agent 的长期遵循率。两个基线相关例外单列：maintenance 的大小写断言此前已证实 HEAD 同样不匹配；Hook runtime 的 2 秒预算案例在整组运行失败、当前与 HEAD 隔离运行各通过一次，保留所有日志，未修改该运行时代码或宣称整套 Hook 全绿。
