# 扁平化 Meta 任务技能目录

Status: Completed (2026-08-20 17:21)
Kind: Task

## Scope

- 将 `task`、`task-plan`、`task-queue`、`task-grill`、`task-review` 五个叶子 skill package 直接迁移到 `skills/meta/`。
- `skills/meta/csl-tasks/shared/` 不是 skill package，继续作为三个 task workflow 共用的状态核心。

## Target
- [x] T1: csl-tasks 下的所有叶子技能与 task-grill、task-review 均直接位于 skills/meta，相关路径引用同步更新且技能校验通过

## Plan

1. 移动五个 skill package，不改写其无关内容。
2. 同步共享核心解析、manifest、README、Context 与验证入口中的实时路径。
3. 扫描旧路径并对每个迁移后的 skill package 执行适用校验。

## Result

- T1: 五个叶子 skill package 均位于 skills/meta，旧实时路径扫描为空；Claude manifest 与 23 个项目叶子 skill 一致，local quality gate validate/lint 均通过，仅 workflow skill 出现规则明确允许的初始加载 token 预算超限。
- Review gate: Skipped — 用户未要求 adversarial review 或独立 Reviewer 批准。

## Verification

- Passed: 布局、共享核心解析、JSON/JS 语法、Context core/validate、task check/validate、manifest 枚举与 git diff --check 均通过；按用户规则未运行单元测试。
