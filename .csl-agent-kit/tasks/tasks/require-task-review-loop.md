# 强制 Task Review 修复循环

Status: Completed (2026-09-03 11:27)
Kind: Task

## Scope

- 包含：复用现有 `In Review` 状态，为产生交付物文件改动的 Task 建立强制 `task-review`、修复、复审循环，并同步核心门禁、工作流契约与聚焦覆盖。
- 不包含：新增任务状态、强制无交付物改动的 Task 或 `task-plan` 进入审查，或把独立 `adversarial-review` 变成默认流程。

## Target
- [x] T1: 每个产生文件改动的 Task 在完成前必须进入现有 In Review 状态并执行一次 task-review，不能以 skipped review 直接完成。
- [x] T2: task-review 发现确认问题或阻塞性未验证风险时，Task 返回 In Progress 修复并重新进入 In Review，循环直至复核无剩余阻塞问题。
- [x] T3: 无文件改动的 Task、task-plan 与独立 adversarial-review 保持各自现有边界，不新增 REVIESING 状态。
- [x] T4: 共享任务协议、核心状态门禁、Skill 指引和聚焦回归覆盖对该循环保持一致。

## Decisions

- 复用单一 `Review gate`：`Skipped` 仅表示无请求交付物文件改动，`Required` 表示待审查，`Passed` 表示普通 `task-review` 无阻塞问题，`Approved` 保留给用户显式请求的 adversarial review。
- Core 机械强制 `Required` 才能进入 In Review、`Passed`／`Approved` 必须从 In Review 完成，并在 Result、Queue graph、reopen 或离开 In Review 后使旧终态审查和 Verification 失效；completed child 只能在 parent 激活后 reopen，并会同步失效 parent integration evidence。是否产生交付物文件改动由 owning workflow 判定并记录证据。
- `task-review` 每次仍是单次、只读、只反馈 pass；interaction owner 独占状态写入、修复和无限次重新分发。Critical Finding、Concern 或阻止 Target 验证的证据缺口都会回到 In Progress。
- `task-plan` 的规划记录写入不触发该循环；Queue child 和 parent 按各自是否产生交付物文件应用。显式 adversarial review 保持独立：文件改动 Task 在 ordinary pass 后升级同一 gate，无文件改动 Task 可直接走 `Required`／In Review／`Approved`。

## Plan

1. 枚举 Review gate、状态迁移、完成门禁及宿主契约的全部生产者、消费者和兼容边界。
2. 扩展核心 Review gate 语义，并让修改后的审查或 Result 变化失效旧审查证据。
3. 同步 `task`、`task-review`、Queue 集成与宿主契约，定义强制单次审查及有问题时的修复循环。
4. 增加聚焦核心与契约覆盖，运行确定性门禁，并让本任务自身通过新的 `In Review` 循环。

## Result

- T1: Task workflow 与注入契约现要求交付物文件改动进入 Required → In Review → task-review，并由 owner 记录 Passed；Skipped 仅用于无交付物改动。
- T3: task-plan 规划记录不触发循环；无文件改动且显式要求 adversarial 时走 Required → In Review → Approved 且不运行 mandatory task-review；文件改动则 ordinary Passed 后升级 Approved。
- T2: Core 在 Result、Queue graph、reopen、离开 In Review 及 completed child reopen 后原子失效适用终态 review 与 Verification；active In Review parent 同时退回 In Progress，Completed parent 必须先 reopen。
- T4: Core/CLI、Task 系列与 adversarial Skills、宿主契约、Context、fixtures 和聚焦覆盖已同步；三轮 findings 全部修复，fresh mandatory task-review pass 4 无确认问题或阻塞证据缺口。
- Review gate: Passed — Independent mandatory task-review pass 4 found no Critical Finding, Concern, or Target-blocking evidence gap.

## Verification

- Passed: Post-review core probe passed 9 policy cases plus file Passed, no-file Skipped, no-file adversarial invalidation and Queue child-reopen propagation; JS syntax, JSON parse, Context validation, git diff check and six Skill Quality gates passed with context-budget warnings only. Unit/project tests were not run.
