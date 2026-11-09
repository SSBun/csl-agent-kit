# 以统一注入契约替代 super-agent

Status: Completed (2026-09-01 11:50)
Kind: Task

## Scope

- 包含：移除仓库内 super-agent 安装与规则资产表面，将只关注稳定 Task 工作流门禁、自动低摩擦 adoption 的行为契约归入 Agent Hooks，干净重命名 inner hook，并同步当前消费者、文档、校验和 Context。
- 不包含：修改用户机器上现有的全局 AGENTS/CLAUDE symlink 或 Agent Hooks 配置、保留旧名称迁移层、改变 Cursor 的 injected-context 支持边界，或复制各 Skill 的详细执行流程。

## Target
- [x] T1: super-agent 安装目标、全局 AGENTS 软链接机制、打包资产及用户文档入口被完整移除
- [x] T2: 一个位于 Agent Hooks 所有权边界内的 csl-agent-kit contract 成为稳定跨 Skill 原则的唯一注入来源，并包含 task family 路由
- [x] T3: inner hook 使用 inner:csl-agent-kit-contract 新身份在 Pi、Codex 与 Claude Code 的现有注入边界继续生效
- [x] T4: 旧 inner:workspace-workflow-gates 身份及其他 super-agent 兼容入口不保留，相关消费者、校验和项目 Context 与干净切换保持一致
- [x] T5: 自动注入的 Contract 移除 AGENTS 替换与通用持久性框架，只保留让 Agent 选择并遵循正确 Task-family 工作流所需的稳定门禁
- [x] T6: Task Target section 只保留激活顺序、协议委托、main/child 交互所有权、不重复确认和返回 main 的稳定边界，不再复制详细对齐流程
- [x] T7: Contract 开场明确说明 Task workflow 的价值并指导 Agent 自动、低摩擦地推动用户采用，而不要求用户理解或手动选择 Skill 名称
- [x] T8: Contract 开场以直接面向 Agent 的 prompt 口吻要求采用 Task workflow，不再使用独立的 Task Workflow Adoption 介绍 section

## Plan

1. 建立 Agent Hooks 所有的单一 Contract，并补齐稳定 task-family dispatch 边界，同时保留具体流程由 Skills 持有。
2. 将 inner hook、reader 和全部当前消费者切换到新的 csl-agent-kit-contract 身份，删除旧 hook/path，不迁移旧配置。
3. 删除 super-agent 安装目标、全局指令链接逻辑、发布资产和活动文档入口，同时保留其他安装行为。
4. 同步当前静态断言、项目 Context 和受影响的流程文档；仅运行获准的非测试语法、结构、质量与路径检查。
5. 移除 Contract 的 AGENTS 替换与通用持久性框架，将开场和边界收窄为 task-family 路由及共享 Task 门禁。
6. 把 Task Target section 压缩为稳定触发、委托和返回边界，删除共享协议已拥有的详细 alignment 语义。
7. 强化 Contract 开场的 adoption 指引：Agent 自动路由并以目标对齐、可恢复状态和验证价值降低用户使用成本，不增加额外确认。
8. 将 adoption 指引合并进直接面向 Agent 的开场 prompt，删除介绍文档式独立 section，同时保留原有 adoption 语义。

## Result

- T1: super-agent 目录、package files 入口、installer target/flag/全局指令链接逻辑和活动 README 入口已删除；npm pack dry-run 不含 super-agent，旧 target/option 被拒绝
- T2: 唯一 Contract 已迁入 agent-hooks/references，并保留 Orient/Align/Prepare/Execute/Verify、Context/Lessons、最小改动与验证原则，同时新增稳定 task-family routing
- T3: inner:csl-agent-kit-contract 通过新 hook/reader 在 codex、claude-code、pi 的 session-start runEvent 中返回有效 Contract；Cursor 继续 unsupported
- T4: 旧 hook/script/path 不存在且无活动消费者；README、Agent Hooks Skill、当前流程文档、静态断言和 Context 已同步，Project Core 精确 diff 经用户批准并验证
- T5: Contract 已改名为 Task Workflow Contract，删除 Persistence and Priority、AGENTS.md 替换/互补语义与通用规则优先级框架；开场和边界明确仅拥有稳定 task-family routing 与 cross-workflow gates
- T6: Task Target section 已从详细 alignment 复述压缩为 5 个非空行，仅保留 activation/focus、Skill gate、main ownership、no-repeat、delegation return 与 aligned continuation 边界
- T7: Contract 新增 Task Workflow Adoption 首节，要求自动语义路由、无需用户选择 Skill、将 Target 作为简短意图检查、只在必要门禁暂停并避免叙述内部 bookkeeping
- T8: 独立 Task Workflow Adoption heading 已删除；同等 adoption 语义改为标题后的 7 行直接 imperative prompt，首个正式 section 现在是 Operating Sequence
- Review gate: Skipped — 用户未要求独立 adversarial review

## Verification

- Passed: 开场 prompt 口吻、首 section、adoption 必需/禁止语义和紧凑 Task Target 静态检查、JS/MJS 语法、Hook rule、reader exactness、三宿主注入、Context validate 与 git diff check 通过；Skill Quality 为 0 failure、1 个 context-budget warning；未运行未获授权的项目测试
