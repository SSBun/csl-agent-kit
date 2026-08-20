# 诊断 Project Core 持续无效提示

Status: Completed (2026-08-20 16:36)
Kind: Task

## Target
- [x] T1: 定位 Agent 重复报告“项目上下文 Core 当前无效”的具体触发条件与根因，并给出源码证据和最小修复方向

## Scope

- 包含：复现历史提示、追踪 Core 解析与提示来源、核对宿主注入链路。
- 不包含：未经确认修改 Project Core 或实现修复。

## Plan

1. 从出现该提示的 Session 还原 Core 加载命令及诊断结果。
2. 对照 Context 解析器、工作区文件和宿主注入链路定位根因。
3. 用可复现命令验证结论并给出最小修复方向。

## Result

- T1: 历史 iTermate Session 与当前 parser 复现均返回 missing-or-duplicate-core；源码确认严格 Core schema、每次 Session 强制加载/披露，以及旧工作区未批量迁移共同造成重复提示。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 只读复现确认 skills Core 有效、iTermate Core 按预期失败且诊断精确匹配；git diff --check 通过。
