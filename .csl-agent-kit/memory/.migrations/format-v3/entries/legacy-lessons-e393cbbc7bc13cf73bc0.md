---
schema: csl-memory/v1
id: legacy-lessons-e393cbbc7bc13cf73bc0
revision: 1
type: experience
title: 区分产品、插件与 marketplace 名称
summary: 设计平台 identity 时核对最终组合，避免机械重复产品名导致发现和引用错误。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-14 Separate Product, Plugin, And Marketplace
    Names:1
updated: 2026-11-02T03:43:10.542Z
deleted: false
---

## 2026-07-14 Separate Product, Plugin, And Marketplace Names

- **Trigger:** 为同一个 agent toolkit 设计项目名、plugin 名和 marketplace 名，尤其是平台 identity 使用 `<plugin>@<marketplace>` 时。
  - **Rule:** 不要机械地把完整产品名复制到两个 identity 槽位；分别选择清楚且稳定的 plugin 与 marketplace 名，并先展示最终组合给用户确认。当前 Codex 使用 `csl-agent-kit@csl-agent-market`。
  - **Why:** `csl-agent-kit@csl-agent-kit` 重复且冗长；将产品和分发来源分开命名更容易理解，也避免大小写 alias 迁移问题。
