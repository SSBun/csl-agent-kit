# 仅在用户明确要求时执行任务审查

Status: Completed (2026-07-28 22:58)

## Scope

- 修改任务工作流、默认 Agent 规则与 `adversarial-review` 路由描述中的自动审查触发条件。
- 保留常规验证要求和 `adversarial-review` 的内部审查协议；不删除该 skill。

## Target

- [x] T1: 任务工作流仅在用户明确要求 adversarial review 时进入审查；风险、复杂度或验证缺口不再自动触发。
- [x] T2: 未明确要求审查的任务完成常规验证后可直接完成，任务记录准确标记审查已跳过。
- [x] T3: 相关契约测试、路由验证和 OpenAI 校验通过，Yao 审计仅保留已确认的既有非阻塞项，且本任务不执行 adversarial review。

## Plan

1. 定位任务审查门禁在 skills、默认规则、评测和测试中的权威引用。
2. 将门禁与路由收敛为用户明确请求，并同步最小必要的验证资产和工作区上下文。
3. 运行聚焦验证与两个 skill 审计，记录结果后完成任务。

## Result

- T1: `workspace-manage-task`、可分发 `super-agent/AGENTS.md`、项目 `AGENTS.md` 和 `adversarial-review` 路由现在都只接受用户明确请求；另一规则、风险、复杂度或验证缺口不会自动启动独立审查。
- T2: `review_gate_cases.json` 覆盖 critical、复杂且不可完整验证、workflow mandate、普通单次 review 与两种明确请求；`npm run test:tasks` 的 11 项测试全部通过。
- T3: 两个 skill 的 OpenAI `quick_validate.py` 均通过，路由评测分别通过 12/12 与 28/28，`git diff --check` 通过。Yao 对 `workspace-manage-task` 除已允许的 1,820/1,000 初始加载 token 超限外均通过；`adversarial-review` 的当前与 `HEAD` 基线均报告既有的 `agents/interface.yaml` 缺失和初始加载 token 超限，lint、governance 与其他资源检查未新增失败。
- Review gate: Skipped — 用户没有要求 adversarial review，并明确要求只在其主动请求时执行。
