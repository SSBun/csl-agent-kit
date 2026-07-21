# Adversarial Review: 将 Super Agent 工作区记录规则拆分为三个 Skills

## Discussion results

### R1 — 保留工作前应用 Lessons 的行为

- Finding: 初始拆分只覆盖用户纠正后的 lessons 维护，遗漏原规则要求的任务开始前读取相关 lessons。
- Required outcome: 保持 Super Agent 路由精简，同时确保 Agent 在适用工作开始前读取并应用相关 lessons。
- Reviewer position:

  - 缺少工作前读取入口会使既有纠错规则无法防止后续任务重复犯错。
  - 应扩展现有 Lessons skill，而不是新增第四个 skill。

- Editor response:

  - 接受 finding，将 `workspace-capture-lessons` 扩展为工作前应用、纠正后维护。
  - Super Agent 使用同一条路由覆盖两个触发点，并增加对应 trigger case 与定向测试。

- Resolution: Lessons skill 已恢复工作前读取行为；quick validation、37 项 trigger eval 和定向路由测试通过。

### R2 — 将 Review 状态移出 Checklist

- Finding: 初始任务 Checklist 包含 `adversarial review 为 APPROVED`，但任务已经进入 `待审查`，与 Checklist 先通过再审查的生命周期冲突。
- Required outcome: Checklist 只验证 Target；review 决定只记录在 Result 和任务状态中。
- Reviewer position:

  - Review 不是交付验收项，不能成为进入 `待审查` 的前置 Checklist 条件。

- Editor response:

  - 接受 finding，从 Checklist 删除 review 状态项。
  - 保留 `待审查` 状态，并在批准后向同一 Result 追加决定和报告链接。

- Resolution: Checklist 与 review 生命周期已分离，当前任务文件符合新 task contract。

## Final decision

- Decision: APPROVED
- Outcome: 三个 workspace workflow skills、Super Agent 最小路由、跨客户端分发和验证契约满足用户要求。
- Remaining: none
