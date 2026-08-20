# 设计 analyze-project 技能退役方案

Status: Completed (2026-08-20 17:08)
Kind: Plan
Parent: retire-analyze-and-unify-tldr

## Scope

- 包含：设计 `analyze-project` 的彻底停用、源码归档、当前发现与文档清理及历史产物保留方式。
- 不包含：本规划任务不移动或修改 skill package，也不恢复其能力到其他 skill。

## Target
- [x] T1: 活动路径 `skills/dev/analyze-project/` 不再存在，完整 skill package 保留在非发现路径 `deprecated/analyze-project/`。
- [x] T2: README、Claude manifest、Pi 命令与当前发现契约不再暴露 `analyze-project`，且当前 Context 不再将其描述为活动能力。
- [x] T3: 历史任务、PRD、既有 `docs/analysis/` 报告与 `reports/analyze-project-evals/` 保持不变，没有 alias、stub 或替代入口继续调用旧能力。

## Decisions

- `analyze-project` 彻底停用，不再参与路由、命令发现或后续工作流。
- 完整 package 原样从 `skills/dev/analyze-project/` 移至顶层 `deprecated/analyze-project/`；不使用仍会被递归发现的 `skills/deprecated/`。
- 不保留兼容 alias、deprecated stub 或可调用入口。
- 删除当前 `CTX-analyze-project` Context Pack；历史任务、PRD、报告和评测产物保持原位且不改写。
- `tldr` 可按其通用深入模式解释项目，但不继承 `analyze-project` 的持久报告、证据锚点、Mermaid 或安全发布协议。

## Plan

1. 将完整 `analyze-project` package 移至顶层非发现归档路径，并确认归档文件集合与移动前一致。
2. 清理 README、Claude manifest、Pi 命令期望及所有当前发现入口中的活动身份，同时保留历史记录。
3. 删除只描述活动能力的 `CTX-analyze-project` Pack，并验证其他 Context 结论仍正确。
4. 验证活动 skill 发现与命令列表均无 `analyze-project`，归档 package 完整存在，历史任务、PRD、既有报告与评测产物未被改写。
5. 对被移动的 skill package 执行 Yao 与 resource-boundary 审计，并运行格式、清单和 `git diff --check`；除非用户另行明确要求，不运行项目或单元测试套件。

## Result

- T1: Moved the complete 6-file package from skills/dev/analyze-project/ to deprecated/analyze-project/; the active path is absent and every before/after SHA-256 hash matches.
- T2: Removed active README, plugin manifest, workflow, repo-map referral, Pi command expectation, and CTX-analyze-project references. Direct Pi alias discovery, Claude manifest path validation, JSON parsing, Context validation, and npm pack dry-run confirm analyze-project is not active or shipped.
- T3: Targeted diffs confirm historical tasks, PRDs, docs/analysis reports, and reports/analyze-project-evals are unchanged. No alias or stub was added; remaining current test mentions are intentional stale-install migration fixtures.
- Review gate: Skipped — Independent review was not requested.

## Verification

- Passed: Task-specific checks passed: archive hashes and paths, active discovery absence, package dry-run exclusion, manifest parsing, Context validation, Yao syntax/lint/governance, repo-map resource boundary, and git diff --check. Archived package only retains its pre-existing allowed Yao initial-load budget warning (1382 > 1000). Project tests were not run because the user did not request them. A pre-existing unrelated Claude manifest parity drift remains: active task-grill is not listed.
