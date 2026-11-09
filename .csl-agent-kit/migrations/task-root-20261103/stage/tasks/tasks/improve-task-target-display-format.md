# 改进 Task Target 确认展示格式

Status: Completed (2026-08-20 20:20)
Kind: Task

## Target
- [x] T1: Task Target 文本确认使用固定标题、Outcome、Done when 与可选 Boundaries 的结构化展示，并按用户语言呈现字段标签。
- [x] T2: task、task-plan 与 task-queue 通过共享协议获得同一展示格式，且展示不包含实现计划、文件、命令或 checkbox。
- [x] T3: TASK_GO、明确确认、重新对齐及 canonical Target 语义保持不变，相关静态契约与 Context 同步。

## Plan

1. 将共享协议的单行文本确认改为结构化、本地化且无 checkbox 的展示契约。
2. 同步静态契约与 Canonical task workflows Context Pack，保留其他确认和重新对齐语义。
3. 执行协议、语言、Context、打包、格式和任务一致性验证。

## Result

- T1: 共享协议现要求固定 Task Target 标题、本地化 Outcome/Done when、可选 Boundaries 与本地化确认提示；协议静态检查通过。
- T2: task、task-plan 与 task-queue 继续强制读取同一共享协议；协议明确禁止 code fence、实现方法、文件、命令、内部计划和 checkbox。
- T3: TASK_GO、明确确认、修订与重新对齐及 canonical Target 段落保持，旧单行格式仅剩拒绝断言，CTX-task-workflows 已同步并验证。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 结构化协议静态检查、Node --check、Context validate/show、npm pack dry-run、英文检查与 git diff --check 通过；按用户规则未运行单元测试或项目测试套件。
