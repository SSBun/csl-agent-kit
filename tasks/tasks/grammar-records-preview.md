# 规划语法自动记录与复习展示

| Field | Value |
| --- | --- |
| Status | Blocked (2026-10-15 17:08) |
| Artifacts | [Artifacts](../artifacts/grammar-records-preview/) |
| Kind | Plan |

## Scope

在本地 fork 实现 SQLite 自动记录及 /grammar 列表、搜索、类型筛选和详情；不生成额外例句、不恢复旧历史、不修改闪卡行为。用户已看过示例并明确要求实现。

## Task Summary

**语法记录**：[插件源码](file:///Users/caishilin/Desktop/personal/pi-language-tutor/src) 新增 SQLite 保存与窗口命令，接入解析成功路径；保存失败提示而不阻止原面板。

**语法浏览界面**：[网页资源](file:///Users/caishilin/Desktop/personal/pi-language-tutor/web) 新增中文列表详情与搜索筛选，通过纯文本渲染记录。

**窗口类型声明**：[声明目录](file:///Users/caishilin/Desktop/personal/pi-language-tutor/types) 补充已存在的 setHTML API。

## Target
- [x] T1: 自动保存插件后续生成的所有语法解析记录及其已有例句，供 /grammar 查看。
- [x] T2: 实现前先向用户展示呈现示例并等待反馈，不提前修改插件。
- [x] T3: 保留现有单词闪卡功能与数据。

## Result

- T1: 类型检查、oxlint、diff check 通过；临时 SQLite 冒烟确认纠错/教学保存、重复保留、Unicode往返、倒序和skip排除；真实 Glimpse WebView 确认列表、详情、搜索和脚本注入文本安全。未运行测试套件，尚未当前会话 reload。
- T2: 用户在收到列表和详情示例后明确要求 first implement this plan。
- T3: flashcards.ts、learn.ts 和闪卡数据未修改；新 SQLite 独立存储；Git diff 仅涉及记录、界面和入口声明。
- Review gate: Required — 新增持久化与 UI 的独立反馈审查。
## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/grammar-records-preview/reviews/round-01.md) | grammar-v1-20261015 | findings: TR-1（宿主加载验证缺口） |

## Review

- Schema: task-review-ledger/v1
- Pass: 1
- Next finding: 2
- `TR-1` | no-progress=0 | 当前 Pi 宿主加载链 | 验证 /reload 无加载错误、/grammar 命令可用、关闭窗口后可重开。

## Block

- Reason: 独立审查指出当前会话的加载链与命令生命周期尚缺实际验证；主代理不能直接输入当前 TUI 的 slash 命令。
- Unblock when: 用户在当前会话执行 /reload、/grammar，关闭窗口后再次 /grammar，并提供成功或错误结果。

## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Stale
- Reason: 新增持久化和原生 WebView 交互，需独立检查数据与运行边界。
- Snapshot: grammar-v1-20261015
- Evidence: 当前自查见 Result；已运行 tsc、oxlint、临时DB和真实WebView冒烟。
- Task fingerprint: 2b234980ee57b5b3944ad22983e9e03a5abe79f68e538d97691239b349172016
