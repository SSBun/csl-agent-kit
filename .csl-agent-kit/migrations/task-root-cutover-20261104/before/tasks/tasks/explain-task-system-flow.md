# 梳理 Task 系统流程与确认节点

Status: Completed (2026-08-31 11:38)
Kind: Task

## Target
- [x] T1: 说明用户提出请求后 Task 系统从适用性判断、任务激活、Target 对齐到执行与完成的完整流程
- [x] T2: 用流程图区分自动继续、Task Target 确认、目标变更批准、用户澄清及独立安全确认节点
- [x] T3: 说明同一 Target、修订 Target、新 Task、task-plan 交接及 delegated child 的确认继承边界

## Result

- T1: 已按共享 Task Target 协议与 task、task-plan、task-queue consumer 契约梳理从请求路由、激活、对齐、准备、执行到完成的全流程
- T2: 已生成并人工查看两张中文流程图，分别覆盖完整生命周期与 L0-L4、delegated child、S1 确认分支
- T3: 说明已覆盖同一已确认 Target 不重复、修订/新 Target 重新对齐、task-plan 同 record 交接及 Queue child 确认继承边界
- Review gate: Skipped — 用户未要求独立 adversarial review

## Verification

- Passed: 已核对四份权威 workflow 文档；两个 SVG 无未解析 CSS 变量，两个 PNG 预览成功生成并在 Pi 中查看；按用户规则未运行项目测试
