---
schema: csl-memory/v1
id: legacy-context-5b681e886bf85282d88e
revision: 2
type: fact
title: CSL Agent Kit 项目定位与架构
summary: 项目用途、共享工作流与宿主集成；CSL 来自用户姓名，用户提出探索更现代名称，尚未选定新名。权威代码与正式规格优先。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#Project Core:1
  - session:01a1a062-978e-765e-99e3-c940378e37d3/task:null/event:d390377a3c8f61919149fe3b27faf71d81b397429e51d0f450480fcd6135ccc4
updated: 2026-11-03T07:51:13.329Z
deleted: false
---

# 项目定位

CSL Agent Kit 为 Codex、Claude Code、Cursor 与 Pi 分发共享 skills、rules、hooks 和 extensions，跨宿主复用 Agent 工作流。项目定位与发布边界以 package.json、README.md 和 Agent Hooks 契约为准。

## 命名意向

用户说明 CSL 来自自己的姓名，并提出探索更现代的项目名称（原文为“more command and modern”，其中 command 的含义尚未澄清）。尚未选定新名，也未授权更名迁移。Relay、Agent Loom、Modu 仅是助手建议，未获用户认可，名称可用性也未核查。来源：session:01a1a062-978e-765e-99e3-c940378e37d3，event:d390377a3c8f61919149fe3b27faf71d81b397429e51d0f450480fcd6135ccc4。此意向仅适用于本项目。

# 主要职责

- skills/ 是可分发能力；.agents/skills/ 是项目专用能力。Skill package 以 SKILL.md 为运行时契约。
- skills/meta/agent-hooks/ 提供可注入的稳定行为契约；具体流程由各 Skill 和共享协议持有。
- skills/meta/task/、task-plan/、task-queue/ 管理 canonical task；tasks/tasks/<slug>.md 是任务权威记录，tasks/tasks.md 只是 newest-first 导航。
- pi/ 提供 Pi 集成；bin/、安装脚本和宿主 manifest 负责分发与发现。
- 已决定由统一 Memory 完全替代 Context/Lessons。Memory 区分 User/Project，不设 Core/Normal；首版自动维护只接入 Pi，实际激活及迁移状态须现场核对。

# 知识边界

- Task 保存当前目标、进度、证据与结果；Memory 保存经核对的长期事实、偏好、经验与引用；Topic 保存明确建立的长期共享规格。
- 记忆不是权威源码、schema、测试结果、正式决定或授权的替代品；冲突时回查对应权威。不得存储秘密、私密推理、推测或短期执行状态。
- Task Agent 自主按需读取；常规维护由独立 Memory Agent 承担。用户级修改必须展示具体内容与理由并获得明确授权；项目级在来源、审计和恢复约束下维护。
- Skill package 的规则与运行契约保持项目既有英文约定；用户回复与报告采用用户语言。
- 独立 adversarial review 只在用户明确请求时运行；普通验证不能冒充独立审查，R2 的必要 task-review 仍遵循 Task 协议。
