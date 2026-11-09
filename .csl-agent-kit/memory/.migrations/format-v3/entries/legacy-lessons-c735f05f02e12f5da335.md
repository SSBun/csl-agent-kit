---
schema: csl-memory/v1
id: legacy-lessons-c735f05f02e12f5da335
revision: 1
type: experience
title: Workflow Skill 完整性优先于预算警告
summary: Skill 预算超限时保留必要流程与异常处理，不为消除 warning 删除核心契约。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-23 Workflow skill 完整性优先于初始加载预算:1
updated: 2026-11-02T03:43:09.788Z
deleted: false
---

## 2026-07-23 Workflow skill 完整性优先于初始加载预算

- **Trigger:**
  - 创建、优化或审计负责复杂任务指导的 workflow skill。
- **Rule:**
  - workflow skill 的准确性和完整性优先于 1000-token 初始加载预算。
  - 不得为了通过该预算而删除、压缩失真或拆散执行所必需的核心契约。
- **Check:**
  - 核心判断、步骤、状态迁移、异常处理和完成条件可从主 `SKILL.md` 完整获得。
  - 初始加载预算超限只作为已知检查结果记录，不作为 workflow skill 的完成阻塞项。
