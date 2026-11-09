---
schema: csl-memory/v1
id: legacy-lessons-390b42ee70500603083a
revision: 1
type: experience
title: 任务计划不等于 plan mode 或委派授权
summary: 必须写任务计划不代表必须进入 plan mode，也不自动授权使用 subagent。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-13 Separate Todo Planning From Plan Mode And
    Subagents:1
updated: 2026-11-02T03:43:10.687Z
deleted: false
---

## 2026-07-13 Separate Todo Planning From Plan Mode And Subagents

- **Trigger:** 精简默认 agent 原则但仍要求任务计划时。
  - **Rule:** 保留在所属 `tasks/tasks/<task-slug>.md` 中写可检查计划的要求，不要因此强制进入 plan mode 或调用 subagent；plan mode 按实际需要使用；subagent 仍须当前用户或适用指令授权，不能仅凭任务复杂度自行委派。
  - **Why:** todo 是持久化任务控制和验证记录，plan mode 与 subagent 是可选执行能力，三者不应绑定。
