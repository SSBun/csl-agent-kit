# 退役 deep-explore skill

Status: Completed (2026-08-09 21:50)
Kind: Task

## Scope

- Included: 删除当前 `deep-explore` skill package 及其 README、plugin manifest、发现与测试入口。
- Excluded: 改写历史任务、历史探索报告，或为该 skill 保留 deprecated stub、兼容 alias 与替代实现。

## Target
- [x] T1: 当前共享 skill、README、plugin manifests 与 Pi/Claude 发现中不再存在 deep-explore 身份或 slash alias。
- [x] T2: deep-explore 的完整 skill package 被删除，历史任务与既有探索报告保持不变。
- [x] T3: 项目测试、skill discovery、npm pack dry-run、JSON/manifest、Context validation 与 git diff --check 全部通过。

## Plan

1. 删除 `deep-explore` package，并清理当前 README 与 plugin manifest 的发现身份。
2. 添加最小负向发现回归，确认 Pi、Claude 与发布包均不再暴露旧身份。
3. 清理 Context 中已退役组件事实，运行项目级与分发级验证后关闭任务。

## Result

- T1: 已从 README 与 Claude plugin keyword/skills 清单移除；Pi 与 CLI 负向回归确认不再注册 deep-explore，npx skills discovery 无该身份。
- T2: skills/deep-explore 的 8 个 package 文件均已删除；历史 tasks、tasks/reports 与 docs/analysis 产物未改写。
- T3: npm run check 全部通过（CLI 28、Triggerify 29、Tasks 26、Pi 8）；npm pack 共 193 个文件且 deep-explore 为 0；manifest JSON、Context validation、focused discovery tests 与 git diff --check 均通过。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查；已执行普通自审与确定性验证。

## Verification

- Passed: 最终验证覆盖完整项目检查、Pi/Claude 发现、npx skills list、npm pack dry-run、manifest JSON、Context validation、旧身份残留和 git diff --check，结果均通过。
