---
created: 2026-07-23
task: add-triggerify-typora-todo-hook
review_cycles: 3
---

# 安全启用 Triggerify 的 Typora todo hook

Topic: 仅在真实 todo 文件变更后打开 Typora

> **E1:** 初始规则通过 `PostToolUse` 调用脚本，并从序列化 payload 中提取 `tasks/todo/*.md` 路径。
>
> **R1:** 完整 payload 扫描会因补丁正文提及 todo 路径而误触发，也允许 `../` 或 symlink 逃逸 todo 目录。
>
> **E2:** 脚本改为解析 canonical `apply_patch` 的文件 header，使用真实路径校验目录边界，并以自检覆盖正文误触发、路径遍历与 symlink 逃逸；真实 Codex 事件仍成功打开目标文件。
>
> **R2:** 运行时修复已满足要求，但任务记录尚未同步最新 T2、T3 证据与 In Review 状态。
>
> **E3:** 只更新所属任务文件及其精确索引项，使全部 Target、Result 证据和状态一致。
>
> **R3:** 安全边界、真实事件行为和任务生命周期记录均满足要求。

**Conclusion:** Hook 只处理真实 `apply_patch` 目标，且仅打开规范化后仍位于当前 workspace `tasks/todo/` 内的现有 Markdown 文件。

---

**Final decision:** `APPROVED`

**Outcome:** Triggerify dispatcher 已受信任，正式规则 active；真实 Codex file-tool 事件可安全地在 Typora 中打开对应 todo 文件。

**Remaining:** none
