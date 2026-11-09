# 添加 Task Review 停滞保护

Status: Completed (2026-09-03 15:12)
Kind: Task

## Scope

- 包含：为 mandatory `task-review` 增加稳定 finding ID、按 finding 计算的连续无进展计数、当前 Review ledger，以及达到阈值后的 `Blocked`／用户决策路径。
- 不包含：总审查轮数上限、新状态、自动 `Passed`、修改 adversarial-review 自身的停滞算法，或迁移历史任务记录。

## Target
- [x] T1: Mandatory task-review 循环能识别同一确认问题或阻塞性证据缺口连续两轮没有实质进展。
- [x] T2: 达到停滞条件时 Task 进入 Blocked，记录具体原因与可观察解除条件并请求用户决策，不能自动 Passed 或继续无限复审。
- [x] T3: 问题解决、有效重分类、新证据或实质交付物变化会打破无进展序列；总审查轮数仍无硬上限。
- [x] T4: Core、task/task-review/Queue 工作流、宿主契约、Context 与聚焦覆盖对停滞语义保持一致，历史任务无需迁移。

## Decisions

- Mandatory review 的 `## Review` 以 `task-review-ledger/v1` marker 区分历史自由格式 Review，并只保存当前 ledger：pass、单调递增且不复用的 `TR-n` ID，以及每个未解决问题的 `no-progress=0|1|2`；通过前删除，Block／resume 时保留。
- Finding 初见计为 0；后续 fresh pass 对同一根因和 required outcome 判定 `no progress` 时逐次递增，达到 2 后立即停止复审并进入 Blocked。该阈值限制连续无进展，不限制总 pass 数。
- 证据化 artifact 进展、有效重分类或新 actionable evidence 将对应 streak 重置为 0，解决则移出 ledger；文本 churn、复述、重复未变化检查或无证据 relabel 不算进展。
- Reviewer 负责保留 stable ID 并提供 `resolved`／`substantive progress`／`no progress` 证据；interaction owner 更新 ledger、判定阈值、写 Block／Unblock 并请求用户。Core 复用现有 Block 生命周期，禁止 active Review ledger 进入终态 gate 或 Completed，并在任一 finding 仍为 `no-progress=2` 时拒绝 resume。

## Plan

1. 定义 owning-task Review ledger、稳定 finding ID、实质进展判定及逐 finding streak 规则。
2. 同步 `task`、`task-review`、Queue 与宿主注入契约，明确停滞后的 Block 和恢复路径。
3. 增加确定性 stall fixtures、契约断言及 Core Block 生命周期覆盖。
4. 运行语法、fixture、Context、Skill Quality 与差异检查，并让本任务通过 mandatory review 循环。

## Result

- T3: Fixture 与 contracts 证明 resolved 移除，证据化 artifact 进展、有效重分类或新 actionable evidence 重置为 0；文本 churn/重复检查不重置且总 pass 无硬上限。
- T1: task-review-ledger/v1 以稳定 TR-n 和逐 finding streak 跟踪；10 个 scalar cases 与 3 个 simultaneous-ledger cases 证明初见 0、两次无进展到 2，新增/重置/解决互不影响其他 finding。
- T2: no-progress=2 时 Core 在同状态 resume、返回 In Progress、terminal review 与 completion 边界均 fail closed；Block 保留 ledger，满足 Unblock 并重置后才可 resume。
- T4: Core、task/task-review/Queue、宿主契约、CTX-task-workflows、v1 schema、contract/stall fixtures 和聚焦断言已同步；pass 1 的 TR-1～TR-4 全部修复，fresh pass 2 全部 resolved 且无新 finding 或阻塞证据缺口。
- Review gate: Passed — Independent mandatory task-review pass 2 resolved TR-1 through TR-4 and found no new Critical Finding, Concern, or Target-blocking evidence gap.

## Verification

- Passed: Post-review probes passed 10 scalar and 3 multi-finding stall cases, same-state resume rejection, active-ledger terminal blocking, v1 malformed fail-closed and historical free-form compatibility; JS syntax, JSON, Context, git diff and four Skill Quality gates passed with context-budget warnings only. Unit/project tests were not run.
