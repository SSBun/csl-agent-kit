---
schema: csl-memory/v1
id: legacy-lessons-9151dbd1441ef552561c
revision: 1
type: experience
title: 核对宿主实际加载的 Agent 指令来源
summary: 不要将 home 根规则文件、agent-specific 文件和宿主实际注入来源混为一谈。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-13 Distinguish Agent-Specific And Parent
    AGENTS Files:1
updated: 2026-11-02T03:43:10.764Z
deleted: false
---

## 2026-07-13 Distinguish Agent-Specific And Parent AGENTS Files

- **Trigger:** 判断当前 agent 使用哪份全局 `AGENTS.md`，或决定默认规则模板的更新范围时。
  - **Rule:** 同时检查 harness 实际注入的规则来源和 `~/.agents/AGENTS.md`；不要把 `~/AGENTS.md` 自动等同于 agent-specific 全局配置。历史软链接或默认路径不能证明当前宿主实际加载了相应规则；使用前核对链接目标与实际注入来源。
  - **Why:** 不同 agent 客户端可能从不同位置加载规则，仅检查 home 根目录会错误判断模板更新是否能对目标客户端生效。
