# 提升 task-context 与 task-lessons 到共享技能根层级

Status: Completed (2026-08-21 11:16)
Kind: Task

## Scope

- 修复 `task-files` 测试消费者的共享根目录错误，并将 `task-context`、`task-lessons` 提升到 `skills/` 根层级。
- 将各自的 routing trigger fixture 收回 Skill 包内，保留共享跨 workflow eval suite。
- 不保留旧路径兼容别名，不改写历史任务或分析记录，不改变 Context、Lessons 或 task workflow 的功能语义。
- 保留任务开始前两个 Skill 包、共享 evals、规则和测试中的已有未提交内容。

## Target
- [x] T1: `task-files` 测试消费者从最终 canonical 路径解析 `task-context` 与 `task-lessons`，不再使用错误的 `workspace-workflow` 根目录。
- [x] T2: `task-context` 与 `task-lessons` 成为 `skills/` 根层级的独立 Skill 包，当前发现、规则、文档、Context Authority 与验证引用全部同步且无旧路径 alias。
- [x] T3: 两个 Skill 包包含各自的 routing trigger fixture，CLI、eval fixtures 与既有 workflow 契约保持有效，任务开始前的未提交内容不丢失。

## Plan

1. 保存当前包与共享 eval 基线，解析所有名称、路径构造器、消费者及分发入口。
2. 移动两个 Skill 包及其专属 trigger fixtures，同步当前消费者与 Context Authority。
3. 运行路径解析、发现、manifest、Context/Lessons、Skill package 与 diff 校验并记录结果。

## Result

- T1: 静态路径检查确认 tests/task-files.test.mjs 统一从 skills/ 解析两个包，所有目标路径存在且 workflowDir 已清除；node --check 通过。
- T2: Pi 递归发现注册 task-context/task-lessons 且无旧命令，Claude manifest、npm pack dry-run 与当前引用搜索均只指向 skills/ 根层级；旧包路径不存在。
- T3: 基线逐文件比较确认两个移动包与专属 trigger fixtures 内容保留，共享 eval 文件未变；Context/Lessons CLI 校验有效，Yao 除已允许的初始加载 token 超限外全部通过。
- Review gate: Skipped — 当前修复未收到独立 adversarial review 或 Reviewer approval 请求；按 task review gate 跳过。

## Verification

- Passed: 通过语法检查、canonical 路径与 manifest 断言、Pi 发现、Context/Lessons index+validate、install/npm pack dry-run、Yao/resource-boundary 审计及 git diff --check；按用户全局约束未运行单元测试。
