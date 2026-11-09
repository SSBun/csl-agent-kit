# 将 resolving-merge-conflicts 重写为 git-conflict

Status: Completed (2026-08-21 15:47)
Kind: Task

## Scope

- 将现有第三方 Skill 的本地身份与运行时内容替换为 `git-conflict`，同时保留其上游来源元数据。
- 同步当前发现与文档消费者；不保留旧别名，不改写历史任务或历史报告。

## Target
- [x] T1: 新的 canonical Skill 名称与目录统一为 git-conflict，且当前仓库只发现该新身份。
- [x] T2: git-conflict 提供完整、清晰且最小的 merge/rebase 冲突解决工作流，保留双方意图并完成必要验证与 Git 流程。
- [x] T3: 所有当前消费者、清单、文档与验证入口使用 git-conflict，历史任务记录保持不变。

## Plan

1. 重写 canonical Skill 包并保留可追溯的上游来源。
2. 将当前发现、文档与验证消费者对齐到新身份。
3. 验证 Skill 结构、递归发现、旧引用边界与发布包内容，并记录任务证据。

## Result

- T1: 递归 npx skills 发现与 Pi 运行时 smoke check 仅暴露 git-conflict；旧本地目录和旧 alias 均不存在。
- T2: SKILL.md 已覆盖状态/意图识别、窄范围解决、冲突与项目检查、merge/rebase 继续及结束条件；local quality gate 与 resource-boundary 校验通过。
- T3: README、来源 fixture 与 Pi 命令 fixture 已同步；旧名称搜索仅保留 .repository.json 及 fixture 中有意保留的上游 sourcePath，npm pack 仅包含新本地路径。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: local quality gate、resource-boundary、语法、来源元数据 cmp、递归发现、Pi runtime、npm pack、旧路径、Context/Lessons 与 git diff --check 全部通过；按用户规则未运行单元测试。
