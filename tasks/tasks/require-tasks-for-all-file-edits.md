# 要求所有文件编辑使用 canonical task

Status: Completed (2026-08-25 14:01)
Kind: Task

## Scope

- 所有用户请求的文件创建、修改、移动、重命名与删除均进入 canonical task workflow，包括可直接验证的机械操作。
- 无文件变更的简单事实问答、未形成结果的开放讨论，以及建立所属 task 所需的生命周期写入不受首次交付物编辑门禁约束。

## Target
- [x] T1: 所有用户请求的文件创建、修改、移动、重命名或删除，无论是否琐碎，都必须在首次交付物编辑前激活所属 canonical task。
- [x] T2: 创建、恢复、重新打开、聚焦和对齐所属 task 所需的生命周期写入可作为启动例外，避免递归，同时仍由 task workflow 约束。
- [x] T3: CSL Agent Contract 与 task Skill 成为该规则的稳定权威后，移除重复的用户级 task 创建与 task_focus 规则，并保留其他用户规则不变。

## Plan

1. 对齐稳定 Contract、默认 Agent rules、`task` Skill 与路由 fixtures 的文件变更触发和启动例外。
2. 更新 task workflow Context 与直接契约检查，验证无文件跳过、任意文件编辑触发及宿主无关聚焦边界。
3. 在仓库内权威规则验证后，原子删除两条重复用户规则并确认其他规则字节内容不变。

## Result

- T1: Contract、默认 AGENTS、task Skill 与两套路由 fixtures 均覆盖所有用户请求的文件创建/修改/移动/重命名/删除；routing eval 分别 18/18 与 16/16 通过。
- T2: Contract 与 task Skill 明确 task lifecycle bootstrap exception；直接契约检查通过且 Contract 未泄漏 task_focus、tasks/tasks、$task 或 SKILL.md。
- T3: 仓库权威经实际 Agent Hooks 注入、skill discovery、npm pack、OpenAI quick_validate 与 Yao 审核验证后，用户 Agent Rules 原子移除两条重复规则，其余 3 条逐字节保留并由 Codex/Claude Code/Pi 成功注入。
- Review gate: Skipped — 用户未要求独立 adversarial review；已执行普通自审与失败模式检查。

## Verification

- Passed: 直接契约/运行时 smoke、两套路由评测、JSON 与 Node 语法、Context/Lessons 校验、skill discovery、npm pack dry-run、OpenAI quick_validate、git diff --check 均通过；Yao 唯一结果为规则允许的 2422/1000 initial-load token 超限；依用户规则未运行单元测试。
