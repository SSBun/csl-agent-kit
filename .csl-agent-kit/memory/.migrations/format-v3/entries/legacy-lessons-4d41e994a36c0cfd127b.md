---
schema: csl-memory/v1
id: legacy-lessons-4d41e994a36c0cfd127b
revision: 1
type: experience
title: 稳定触发规则与易变工作流分开
summary: 精简规则时保留触发、强制动作和顺序，把易变步骤放入对应 Skill，而非只留一个名字。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-21 将易变工作流留在 Skill 中:1
updated: 2026-11-02T03:43:10.021Z
deleted: false
---

## 2026-07-21 将易变工作流留在 Skill 中

- **Trigger:** 优化通用或项目 `AGENTS.md`，且相关 workflow 依赖 skill 主动触发。
- **Rule:** `AGENTS.md` 必须保留稳定的触发条件、强制动作、先后顺序和跳过边界；只有易变的字段、循环和输出契约留在 skill。不得把启动工作流所必需的信息压缩成只有 skill 名称或高层路由。
- **Check:** 脱离 hook 注入时，仅阅读 `AGENTS.md` 也能判断何时加载 skill、实施前应读写哪些文件，以及何时可以跳过。
