# 按关注点拆分提交当前全部本地改动

Status: Completed (2026-08-21 11:32)
Kind: Task

## Scope

- 提交当前工作树中的全部既有改动，包括已完成功能、Context/Lessons 维护与 canonical task 记录；不重写交付内容或夹带新的产品变更。
- 将同时出现的其他 canonical task 记录作为 task bookkeeping 处理，不替代其 owning session 的实现或完成状态。

## Target
- [x] T1: 当前所有 tracked 与 untracked 改动均被完整归入一个且仅一个明确关注点，不遗漏、不跨关注点混合。
- [x] T2: 每个关注点分别形成清晰 conventional-style message 的 Git commit，保留现有内容且不改写无关改动。
- [x] T3: 提交完成后工作树干净，最近提交历史可清楚对应各独立功能或关注点。

## Plan

1. 分离安装包装脚本修复与默认实时日志两个安装关注点。
2. 分离 Lessons 防复发契约、共享 Task Target 协议以及 Context/Lessons 命名与目录对齐。
3. 单独提交 Context 权威模型与 canonical task bookkeeping，逐组核对 staged diff、提交历史和最终工作树。

## Result

- T1: 逐组检查 cached diff 与路径清单后提交；首轮最终 git status --porcelain 为空，证明除本任务完成元数据外没有遗漏的 tracked 或 untracked 改动。
- T2: 形成 8 个 conventional commits：安装 Shell 修复、安装实时日志、Lessons 防复发、Task Target 协议、Skill 命名与目录、Context Authority、既有任务记录及本任务记录各自独立。
- T3: 首轮最终工作树为空；git log --reverse 7664f8e..HEAD 显示 8 个按关注点命名且顺序清晰的提交。
- Review gate: Skipped — 用户未要求 adversarial review、双 Agent Reviewer–Editor 循环或独立 Reviewer 批准。

## Verification

- Passed: 逐组通过 git diff --cached --check；最终语法、Context/Lessons validate、Skill 路径、安装 dry-run、conventional message 与 clean-tree 检查通过；按用户全局约束未运行单元测试。
