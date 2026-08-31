---
created: 2026-07-23
task: move-agent-rules-to-super-agent
review_cycles: 3
---

# 将 Agent 规则迁移到 super-agent 目录

Topic: Legacy symlink 的自动迁移边界

> **E1:** 初版使用路径后缀识别两个旧 Agent 规则源。
>
> **R1:** 后缀匹配会把外部的同名路径误判为 CSL 旧资产，从而在没有 `--force` 时覆盖用户链接。
>
> **E2:** 改为只匹配当前仓库内两个精确旧路径，并用同样以 `other/references/agents.md` 结尾的外部链接补充回归。
>
> **R2:** 精确归属判定消除了无 force 误覆盖，该问题已解决。

**Conclusion:** 只有可证明属于当前 CSL Agent Kit 仓库的旧 canonical 链接自动迁移；其他链接必须显式使用 `--force`。

Topic: 新 AGENTS.md 的追踪例外

> **E1:** 规则文件移动后，`.gitignore` 仍放行已不存在的旧路径。
>
> **R1:** 该残留没有运行时影响，但可能让新 `super-agent/AGENTS.md` 被全局 ignore 规则隐藏。
>
> **E2:** 将例外替换为 `!/super-agent/AGENTS.md`，其他 ignore 规则不变。
>
> **R2:** 新 canonical 文件已明确可跟踪，该项已关闭。

**Conclusion:** `super-agent/AGENTS.md` 不会被用户的全局 gitignore 漏掉。

Topic: super-agent 的默认 authoritative 安装

> **E3:** 用户将范围扩展为无需 `--force` 也默认重置四个 instruction targets；实现仅在 `installSuperAgent` 调用现有链接函数时固定 `force: true`。
>
> **R3:** 默认行为只作用于 super-agent 的四个目标，保留了普通文件备份、dry-run 不写入、精确 legacy 归属与幂等性。

**Conclusion:** super-agent 默认强制建立 canonical 链接，不需额外传入 `--force`，且破坏性边界仍有备份和 dry-run 保护。

---

**Final decision:** `APPROVED`

**Outcome:** Agent 规则资产已迁移到 `super-agent/`，安装器默认将四个 instruction targets 重置为 canonical 链接。

**Remaining:** none
