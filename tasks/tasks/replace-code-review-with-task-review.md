# 用 task-review 替换 code-review

Status: Completed (2026-08-20 14:42)
Kind: Task

## Scope

- 将现有 `skills/dev/code-review/` 迁移并泛化为 `skills/dev/task-review/`，同步当前发现、路由、说明和验证资产。
- 保留 `adversarial-review` 的双 Agent 修复与批准职责；不修改历史任务、报告或 transcript 中的旧名称。

## Target
- [x] T1: 当前共享 skill、发现清单与命令仅公开 task-review，code-review 只保留于历史记录。
- [x] T2: task-review 仅在明确请求时，对 canonical task 或临时目标执行一次只反馈审查，优先使用 fresh-context 只读 subagent，并明确标注自审降级。
- [x] T3: task-review 覆盖代码、其他文件与无文件结果，按已确认的 Findings、Concerns、Unverified Risks 契约输出且不修改、不复审、不批准、不写报告。
- [x] T4: 相关路由、契约、发现、安装与 skill 包验证通过，未破坏无关工作区改动。

## Plan

1. 盘点 `code-review` 的当前发现入口、消费者、运行时契约与验证资产。
2. 原位迁移 skill package，并以最小改动实现已确认的通用任务审查流程和输出契约。
3. 同步当前 README、manifest、相邻 skill 引用、发现测试与评测，清理旧公开身份。
4. 运行聚焦测试、路由与契约评测、Yao、resource boundary、发布发现检查和差异检查。

## Result

- T1: skills/dev/task-review 已成为唯一当前普通审查 skill；README、plugin manifests、package keyword、Pi 发现测试与相邻引用均改用 task-review，当前源码中的 code-review 仅剩明确的负向缺失断言。
- T2: SKILL.md 固定明确请求、目标优先级、单个 fresh 只读 subagent、non-independent fallback 与单次反馈边界；routing eval 26/26。
- T3: SKILL.md 与 contract_cases.json 覆盖代码、文档/设计、配置/资产、无文件结果、Critical Findings、Concerns、Unverified Risks 及禁止修改/复审/批准/报告。
- T4: quick_validate、Yao（含 998/1000 resource boundary）、task-review 26/26 与 adversarial-review 28/28 路由、deterministic contract、Pi alias、npm pack、CLI install dry-run、JSON、英文 runtime prose 与 git diff checks 均通过；标准测试入口仍被 HEAD 基线中的旧 sop 路径和 grill 期望阻断。
- Review gate: Skipped — 用户未要求 adversarial review、Reviewer–Editor 修复闭环或独立批准。

## Verification

- Passed: 聚焦验证全部通过；两个标准测试入口的失败来自 HEAD 已存在且不属于本任务的旧 sop 导入与 grill 命令期望，已用等价独立检查验证 task-review 契约与发现。
