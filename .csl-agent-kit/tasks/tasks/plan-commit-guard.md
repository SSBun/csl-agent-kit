# 设计提交与推送内容保护机制

| Field | Value |
| --- | --- |
| Status | Pending (2026-11-06 11:35) |
| Kind | Plan |

## Target

- [ ] T1: 根据明确的禁止内容规则阻止违规内容进入 Git 提交及推送，报告可定位原因并保留用户改动
- [ ] T2: 明确 Skill、CSL Hooks、原生 Git hooks 与远端保护的职责、检查对象和覆盖限制

## Scope

当前仅讨论设计，不修改已有实现或安装 hooks。用户提出通用 commit-guard，并强调阻止禁止内容被推送到远端。禁止内容类别和安装范围尚待用户确定。

## Decisions

用户要求将关注点从临时审查说明扩展到 Git 提交与推送内容保护，尤其是远端推送。具体执行层和规则集尚未确认。

## Plan

1. 确定第一版禁止内容类别，以及硬阻断与提示的边界。
2. 确定 Skill、CSL 与 Git 原生 hooks 的职责和安装范围。
3. 确定提交/index与推送提交历史的扫描语义、例外、失败处理和验收证据，形成可执行计划。

## Execution Log

### 001 — 当前能力与推送边界

只读核对当前 check-code-review-commit.js：push 属于非提交白名单，现有 guard 没有推送内容检查。Git 官方 githooks 文档说明 pre-push 接收实际推送的本地/远端 refs 与对象ID；因此不能用工作区或当前 index 代替对实际推送提交的检查。pre-receive 位于远端 ref 更新之前，不能把普通 push 后 CI 当作发送前防泄露保护。来源：https://git-scm.com/docs/githooks 。提议共用内容检查器、原生 pre-commit/pre-push 执行、Skill解释修复；这些尚是待讨论建议。
