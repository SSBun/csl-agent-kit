# 为语法记录添加删除按钮

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-15 17:17) |
| Artifacts | [Artifacts](../artifacts/grammar-delete-record/) |
| Kind | Task |

## Scope

只为现有 /grammar 添加选中整条解析记录的删除、确认与成功/失败反馈，不执行真实学习数据删除，不改闪卡。

## Task Summary

**语法记录存储与命令**：[源码目录](file:///Users/caishilin/Desktop/personal/pi-language-tutor/src) 新增参数化按 ID 删除，验证桥接消息类型、整数 ID 和当前展示记录范围，成功后才回传删除确认。

**语法界面**：[网页目录](file:///Users/caishilin/Desktop/personal/pi-language-tutor/web) 新增删除按钮、不可撤销提示、取消/确认和等待状态；收到成功回执后更新列表与详情，失败保留记录。

## Target
- [x] T1: /grammar 支持删除用户选中的单条语法记录，数据库和界面同步移除，重新打开后不再出现。
- [x] T2: 删除不影响其他语法记录或单词闪卡。

## Result

- T1: tsc、oxlint 和 diff check 通过；临时 SQLite+真实隐藏 WebView 冒烟覆盖取消、确认、成功回执后列表更新与重新读取数据库确认删除持久化。未执行测试套件或当前会话 reload。
- T2: 临时数据库两条记录删除一条后另一条内容仍为 keep；非法负数 ID 被拒绝；未接触真实学习数据库与闪卡代码。
- Review gate: Passed — 独立 reviewer run 7b52daaa-96de-48e5-b424-11bbbc8bf21d 无发现、无阻塞风险；round-01 报告已保存，两文件 SHA256 与审查快照一致。
## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/grammar-delete-record/reviews/round-01.md) | grammar-delete-v1 | no blocking findings |

## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 永久删除用户记录涉及桥接消息与数据边界，独立检查。
- Snapshot: grammar-delete-v1
- Evidence: Result 中记录类型/lint检查及真实WebView和临时数据库联合冒烟。
- Task fingerprint: e2cbb582695a6ff4982d402485af2eb07e070edf99ff407b50026550d5e7da25

## Verification

- Passed: 最终两文件 SHA256 与派发一致，diff check 通过；既有类型/lint和临时DB+真实WebView冒烟证据未失效。未运行测试套件；当前会话需用户 /reload。
