# 提取并接入共享 Task Target 对齐协议

Status: Completed (2026-08-20 20:01)
Kind: Plan

## Scope

- 包含 Task Target 对齐语义的权威归属、task-family skill 的显式加载链路、默认规则与 dispatcher 的稳定门禁、相关契约检查及 Context 同步。
- 不创建新的可路由 skill，不改变 canonical task schema，不持久化会话确认状态，也不恢复宿主专用确认界面。

## Target
- [x] T1: `csl-tasks` 共享运行时提供唯一的 Task Target Alignment Protocol，三个 task-family workflow 均会显式加载且在协议缺失时 fail closed。
- [x] T2: 对齐协议允许形成诚实 Target 所需的聚焦澄清，确认前继续阻止实质工作，并完整保留文本确认、`TASK_GO`、修改后重新呈现及目标实质变化后重新确认语义。
- [x] T3: 默认 Agent 规则与 workspace lifecycle dispatcher 保留稳定触发条件、执行顺序和跳过边界，同时不再拥有重复的详细确认协议。
- [x] T4: 静态契约、routing fixtures 与 Canonical task workflows Context Pack 同步新的 Authority 和消费关系，适用的非测试验证通过且未运行项明确披露。

## Decisions

- 由 `csl-tasks` 共享运行时拥有唯一的 Task Target Alignment Protocol；它是普通 Markdown 运行时契约，不使用 `SKILL.md`，因此不参与 skill discovery 或路由。
- `task`、`task-plan` 与 `task-queue` 各自拥有调用时机和 workflow-specific Target 含义，并在进入或上下文丢失后恢复 workflow 时强制完整读取共享协议；协议缺失时在实质工作前 fail closed。
- 共享协议拥有 Target readiness、必要澄清、确认语义、`TASK_GO`、确认失效与重新对齐、以及 conversational Target 与 canonical `Target` 的关系；三个 skill 只保留防止绕过门禁所需的稳定摘要，不复制详细规则。
- 对齐发生在承诺边界：形成诚实且可观察的结果前允许聚焦于用户拥有歧义的必要澄清；确认前仍禁止任务直接来源调查、调研、规划、委派和交付物修改。
- `super-agent` 默认规则与 lifecycle dispatcher 保留稳定触发条件、强制顺序和跳过边界，并把详细确认协议交给所选 task-family skill；不能退化为只列 skill 名称的弱路由。
- task core 继续只管理持久 Target、证据、状态与完成门禁；不新增 confirmation 字段、命令或状态转换。现有文本格式和 `TASK_GO` 行为保持兼容，不引入宿主专用确认 UI。
- Skill、runtime reference 与 eval-facing prose 使用英文；计划和用户交付使用中文。

## Plan

1. 建立共享 Task Target Alignment Protocol，完整定义进入条件、允许的前置澄清、呈现与确认、`TASK_GO`、修改后重新呈现、确认失效及 fail-closed 行为。
2. 将三个 task-family skill 改为显式加载共享协议，并分别保留单任务结果、计划交付和 Queue 集成结果的 workflow adapter；删除其中重复的详细确认段落。
3. 收敛默认 Agent 规则与 workspace lifecycle dispatcher：保留稳定触发、顺序、跳过和禁止绕过的安全包络，将易变的确认细节指向共享协议。
4. 迁移静态契约与 routing fixtures：集中验证协议语义、三个消费者的强制引用、默认规则的稳定门禁、文本确认兼容性，以及旧重复条款已无意外残留。
5. 更新受影响的 Canonical task workflows Context Pack，使后续 Agent 能定位协议 Authority、消费者关系和重新检查事件。
6. 执行英文内容、JSON/Markdown 结构、local quality gate、resource-boundary、stale-reference 与 diff 检查；更新测试断言，但仅在用户明确授权时运行单元测试或项目测试套件，并披露未运行项。

## Result

- T1: 共享协议文件已加入分发树，task、task-plan 与 task-queue 均显式完整读取并在缺失时 fail closed；静态引用与 npm pack dry-run 已确认。
- T2: 共享协议集中定义必要聚焦澄清、确认前禁止项、精确文本格式、TASK_GO、修订和实质变化后的重新对齐；静态契约检查通过。
- T3: super-agent 默认规则与 lifecycle dispatcher 保留触发、激活、确认、跳过和后续 Context/Lessons 顺序，详细 TASK_GO 与文本格式仅由共享协议拥有。
- T4: 相关静态断言、routing fixtures 与 CTX-task-workflows/CTX-workspace-context 已同步；JSON、Node 语法、Context、package、diff、local quality gate 与 resource-boundary 的适用非测试检查满足约束。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 静态协议检查、JSON 解析、Node --check、Context validate/core、npm pack dry-run、AGENTS 结构、git diff --check 与 local quality gate syntax/lint/governance 通过；resource-boundary 仅有允许的 initial-load token 超限，按用户规则未运行单元测试或项目测试套件。
