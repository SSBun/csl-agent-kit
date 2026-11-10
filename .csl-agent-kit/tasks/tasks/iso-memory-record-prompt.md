# 整合 ISO 原则与现行 Memory 记录提示词

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-10 10:46) |
| Kind | Task |

## Scope

交付聊天中的英文提示词草案，组合此前英文草案、五份ISO概念说明与当前agent-memory技能。只生成内容，不安装提示词、不修改技能、后台或记忆库。

## Execution Log

### 001 — 现行契约核对

已完整读取当前agent-memory技能。提示词需保留user/project作用域、两个基础文件、title/summary与日期case格式、容量、hash条件写入、合并顺序、错误处理和旧库只读边界。ISO原则仅用于内容质量判断，不能扩大数据留存、权限或系统职责；不宣称逐条标准符合性。调度及升级机制继续由当前运行时和技能控制。

## Task Summary

本任务仅交付聊天中的英文提示词，未修改产品代码、技能或记忆文件。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 以一个提示词整合现行记录契约及ISO判断原则，不增加存储字段或基础设施。 | 不复制与记录无关的Dashboard流程。 |
| 稳定性 | A | 对照当前技能保留权限、并发、容量、遗忘及旧库边界，区分ISO参考与强制本地契约。 | 提示词未安装，未进行模型执行验证；ISO全文未逐条核对。 |
| 完整性 | S | 草案覆盖五项ISO、BCP14和记录流程，明确不恢复历史或旧Task知识存储。 | 交付为提示词文本，不含部署或运行效果承诺。 |

## Target
- [x] T1: 生成英文Memory记录提示词，整合现行agent-memory契约、五项ISO原则及BCP14，明确知识和记录管理边界

## Result

- T1: 已按当前agent-memory逐项构造英文聊天草案：五项ISO应用、BCP14、两级作用域、基础文件、格式日期容量、CAS写入、保真合并、失败恢复边界及最终检查。仅生成文本，未安装或执行。
- Review gate: Skipped — R0聊天草案，无显式独立审查要求。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 交付为聊天提示词，无请求交付文件或运行行为修改。
- Snapshot: chat:iso-memory-record-prompt-v1
- Evidence: Result T1；现行agent-memory全文与对话中五项ISO概念说明。
- Task fingerprint: b14e34be422a7d2740a365be277acde46c1c5fe66ac4f60c99f22d3bb33e2c80

## Verification

- Passed: 已对照技能核对关键字段、限额及边界；ISO用途与本地规则分开，旧库只读且不扩大权限。不宣称全文合规或真实模型遵循；未运行测试。
