---
created: 2026-07-23
task: optimize-adversarial-review-gate
review_cycles: 7
---

# 按风险与可验证性控制对抗审查

Topic: 门禁公式的唯一性

> **R1:** 自检发现问题后的直接升级旁路会让公式为假的任务仍进入昂贵审查。
>
> **E1:** 删除旁路；自检只能改变 `Critical`、复杂度类别或 `Verification Gap`，随后重新计算同一公式。
>
> **R2:** 审查入口现在严格受 `Explicit OR Critical OR (Complex AND Verification Gap)` 控制。

**Conclusion:** 不存在公式外的强制对抗审查入口。

Topic: 既有任务契约与复杂度判定

> **R1:** 初始压缩误删阻塞、子任务和索引修复契约，复杂度信号的计数单位也不明确。
>
> **E1:** 将完整既有契约移入强制读取的 deferred reference；将复杂度定义为至少两个不同类别，同一类别内的多个 hosts 或 protocols 只计一次。
>
> **R2:** 旧契约语义已恢复，prompt-only gate 的计数规则明确。

**Conclusion:** 门禁优化没有回退既有任务管理行为。

Topic: 边界评测与证据

> **R1:** 初版缺少 Gap-only、单类别加 Gap、双类别无 Gap，以及恰好双类别加 Gap 的显式边界。
>
> **E1:** 将 fixture 扩为九个案例，并在测试中按 ID 固定这些正反边界；同步任务证据。
>
> **R2:** focused tests、skill validation、Yao 审计和路由评测均通过。

**Conclusion:** 公式的关键阈值和否定边界均有回归保护。

Topic: Workflow skill 的完整性与预算例外

> **E1:** 用户纠正 workflow skill 不应为了 Yao 的 1000-token 预算牺牲复杂任务指导的准确性与完整性。
>
> **R1:** 初版预算例外不够窄，inline 完整性测试也无法阻止关键契约被再次删除。
>
> **E2:** 将全部任务契约合回主 `SKILL.md`，删除 split reference；把唯一非阻塞失败限定为 Yao 的 `Estimated initial-load tokens exceed budget`，并扩充核心章节和生命周期断言。
>
> **R2:** 预算例外、完整契约、测试证据和任务记录现已一致。

**Conclusion:** Workflow skill 保持完整自包含；只有 Yao 1000-token initial-load 超限可被接受，其他验证仍然阻塞。

Topic: 已完成任务的小幅续作

> **E6:** 为同一 outcome 的小幅 follow-up 增加复用 canonical task 的生命周期规则，并以本任务的新增 `T6` 实际重开既有记录。
>
> **R6:** 行为与测试满足用户要求，但 owning task 的 Scope 未纳入新增生命周期边界，任务历史仍不完整。
>
> **E7:** 仅补充对应 Scope：同一 outcome 的小幅续作复用 owning task，独立 Subtasks 边界仍使用独立任务记录。
>
> **R7:** Scope、Target、实现、测试与索引状态现已一致，无未解决项。

**Conclusion:** 同一已完成任务的小幅续作会追加新 Target 并重开原任务；独立交付边界仍新建任务。

---

**Final decision:** `APPROVED`

**Outcome:** 非关键的普通任务可跳过对抗审查；完整任务契约保留在主 workflow skill 中；同一 outcome 的小幅续作复用并重开原任务记录。

**Remaining:** none
