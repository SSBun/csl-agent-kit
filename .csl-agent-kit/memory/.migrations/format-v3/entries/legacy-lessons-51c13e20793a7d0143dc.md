---
schema: csl-memory/v1
id: legacy-lessons-51c13e20793a7d0143dc
revision: 1
type: experience
title: SOP 示例避免无需求的治理字段
summary: 没有明确需要时，不添加 owner、reviewer、approver 等流程元数据。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-08 SOP Example Metadata Minimalism:1
updated: 2026-11-02T03:43:11.768Z
deleted: false
---

## 2026-07-08 SOP Example Metadata Minimalism

- **Trigger:** 设计或修改 SOP 示例文件的 YAML frontmatter 时。
  - **Rule:** 不要默认加入 SOP id、owner、creator、reviewer、approver、effective_date 这类治理字段；示例 SOP 默认只保留 `version` 和 `update_date` 这类轻量元数据。
  - **Why:** 示例文件应展示轻量现代格式，过多治理元数据会让新 SOP 创建变重。
