# 编写 Pi Task 系统完整流程文档

Status: Completed (2026-08-31 13:27)
Kind: Task

## Scope

- 包含：当前 CSL Agent Kit Task 工作流、Pi 宿主适配、Codex 可复用边界、确认节点、状态与完成门禁的中文说明和配套图表。
- 不包含：修改 Task 协议、Skill、Pi extension、canonical task core 或 Codex/Pi 安装配置。

## Target
- [x] T1: 形成一份中文 Markdown 文档，完整说明用户提出任务请求后，从适用性判断、任务激活、Target 对齐、准备、执行到验证与完成的流程
- [x] T2: 文档覆盖 L0-L4、S1、重复确认边界、task/task-plan/task-queue、delegated child、Context、Lessons、review 与完成门禁
- [x] T3: 文档明确标记 Pi 专属步骤，并将其与 Codex 等宿主可实现的共享流程区分开
- [x] T4: 文档包含可阅读的流程图、场景示例和当前权威来源，且不修改 Task 协议或产品代码

## Plan

1. 以共享 Task Target 协议和三个 task-family Skill 为主线，整理从请求路由到完成门禁的主流程。
2. 以 Pi extension 源码和 Pi 官方 extension、TUI、session 文档确认 Pi 专属的 context 注入、task focus、session persistence 与 widget 行为。
3. 编写宿主能力对照、确认矩阵、典型场景和恢复边界，并嵌入已渲染 SVG 流程图。
4. 校验文档结构、关键语义、图表引用和来源链接；不运行项目测试。

## Result

- T1: 已生成 747 行中文 Markdown 文档，按 Orient、Align、Prepare、Execute、Verify 展开从请求到 complete/check/validate 的完整流程
- T2: 文档包含 L0-L4、S1、重复确认、三类 task family、delegated child、Context、Lessons、review、状态模型和完成失败边界
- T3: 文档以【共享】【宿主适配】【Pi 适配】【Pi 专属】标记能力归属，并提供 Pi 与 Codex 逐环节对照表
- T4: 文档嵌入三张已渲染 SVG，包含八类典型场景、执行检查表及 16 个有效来源/图表链接；未修改 Task 协议或产品代码
- Review gate: Skipped — 用户未要求独立 adversarial review

## Verification

- Passed: 结构脚本确认 27317 bytes、747 行、19 个关键术语与 16 个链接均有效；三张 SVG 无未解析 CSS 变量，PNG 已在 Pi 预览；按用户规则未运行项目测试
