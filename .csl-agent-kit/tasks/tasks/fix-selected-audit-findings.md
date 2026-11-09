# 修复选定的本地改动审计问题

Status: Completed (2026-08-27 12:04)
Kind: Queue

## Scope

- 包含审计问题 #1、#3、#5、#6、#7 的修复与组合验证。
- 不包含审计问题 #2、#4、#8、真实 Git push、真实 MR 创建及无关清理。

## Target
- [x] T1: 本地改动审计中的 #1、#3、#5、#6、#7 已全部修复并通过集成验证，且未改变其余审计问题或无关行为。

## Children

1. [阻止已有云效 MR 前的分支推送](prevent-yunxiao-existing-mr-push.md)
2. [避免云效 MR 推送修改 Git upstream](preserve-yunxiao-git-upstream.md)
3. [将云效 MR 运行时契约改为英文](translate-yunxiao-runtime-contract.md)
4. [确定性拒绝纯英文标签标题](enforce-chinese-tab-title-output.md)
5. [安全回收 Project Index 陈旧写锁](recover-project-index-stale-lock.md)

## Plan

1. 依次完成 `prevent-yunxiao-existing-mr-push`、`preserve-yunxiao-git-upstream` 与 `translate-yunxiao-runtime-contract`；后项依赖前项留下的 Yunxiao MR 行为与文档基线。
2. 完成 `enforce-chinese-tab-title-output`。
3. 完成 `recover-project-index-stale-lock`。
4. 全部子任务完成后执行父任务集成验证。

## Result

- T1: 五个子任务均已完成；Yunxiao mock preflight/race、隔离 bare Git push、标题直接行为与隔离 Project Index 锁 smoke 观察到 #1/#3/#5/#6/#7 的目标行为，静态契约检查确认排除的 #2/#4 保持原状且未处理 #8。
- Review gate: Skipped — 用户未要求本次修复执行独立 Reviewer 审批；已完成本地对抗性自审。

## Verification

- Passed: 集成验证通过：相关脚本与相邻回归文件 node --check、四类隔离/直接 smoke、英文运行时契约、local quality gate/resource boundary、Context validate 与 scoped whitespace 检查均通过；agent-hooks 仅保留允许非阻塞的 1463>1000 初始加载预算告警。
