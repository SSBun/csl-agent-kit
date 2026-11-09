# 确定性拒绝纯英文标签标题

Status: Completed (2026-08-27 11:49)
Kind: Task
Parent: fix-selected-audit-findings

## Scope

- 只强化模型输出与已保存标题的中文门禁；保留长度、操作型标题、技术术语、状态恢复与失败不写入行为。

## Target
- [x] T1: 模型标题只有至少包含一个汉字时才可写入或恢复，同时继续接受混合技术术语、缩写和数字的中文标题。

## Plan

1. 在统一标题清理边界加入确定性汉字要求。
2. 更新脚本自检与相邻回归断言，覆盖纯英文拒绝和中英数字混合接受。
3. 以直接 smoke、语法与 Skill 校验验证行为。

## Result

- T1: 直接 smoke 观察到纯英文及“截断后会丢失汉字”的输出均为空，认证 cache/GPT 5 标题仍被接受，纯英文已保存标题被丢弃且混合中文标题可恢复。
- Review gate: Skipped — 用户未要求独立 Reviewer；已对截断、持久化和混合术语边界做本地对抗性自审。

## Verification

- Passed: 直接行为 smoke、脚本与相邻回归文件语法检查、Context validate、whitespace check 均通过；local quality gate 除既有且允许非阻塞的 1463>1000 initial-load token 预算外其余门禁通过。
