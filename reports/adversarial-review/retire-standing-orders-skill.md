---
created: 2026-07-23
task: retire-standing-orders-skill
review_cycles: 3
---

# 将持久指令迁移到 Triggerify

Topic: 活动文档与 Super Agent 清理

> **E1:** 删除独立 skill、专用 hooks、manifest 注册、README 路由和 `super-agent/AGENTS.md` 的旧章节。
>
> **R1:** Accepted RFC 和 README 仍有旧载体说明，活动文档尚未一致。
>
> **E2:** 将 RFC 的职责边界和示例改为 Triggerify，并移除 README 对旧 AGENTS 载体的说明。
>
> **R2:** 活动文档和 Super Agent 已统一为 Triggerify，历史任务与报告可以保留。

**Conclusion:** 活动产品面已完成清理。

Topic: Cursor 支持边界

> **E1:** 初始文档把 Cursor 与 Codex、Claude Code、Pi 一并标记为已验证。
>
> **R1:** Cursor 没有 capability 或协议测试，支持声明与实际状态不符。
>
> **E2:** 根据本机 Cursor 3.7.36 和宿主已知缺陷，将 Cursor 标记为 `unsupported/inactive`，并补充协议记录和回归断言。
>
> **R2:** 运行时、文档和测试已准确，仅剩 `tasks/lessons.md` 的旧检查项需要用户授权修订。
>
> **E3:** 用户批准精确替换；lesson 现只把 Codex、Claude Code 和 Pi 标为可注入，并要求 Cursor 保持 `unsupported/inactive` 直到宿主修复。
>
> **R3:** lesson、运行时状态、协议记录和测试已一致。

**Conclusion:** Cursor 不再被误报为可用，持久指令规则的支持边界一致。

Topic: 验证证据

> **E1:** 任务记录误写为 16 个 Triggerify 测试和 4 个 Pi 测试。
>
> **R1:** 实际 Pi 测试为 3 个，证据数字不准确。
>
> **E2:** 修正为 16 + 3 = 19，并重新运行 focused tests。
>
> **R2:** 19/19 通过，证据已一致。

**Conclusion:** focused verification 记录准确。

---

**Final decision:** `APPROVED`

**Outcome:** 独立 skill 和旧载体已退役，持久指令已迁移到 Triggerify，活动文档、Super Agent、宿主能力声明和验证证据保持一致。

**Remaining:** none
