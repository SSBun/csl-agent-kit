---
schema: csl-memory/v1
id: legacy-lessons-85aba95d4e2536609b3c
revision: 1
type: fact
title: Skill package 的项目语言约定
summary: 编写 Skill 规则、运行契约或评测说明时使用；用户回复与报告语言独立处理。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-08-07 Skill packages use English:1
updated: 2026-11-02T03:43:09.359Z
deleted: false
---

## 2026-08-07 Skill packages use English

- **Trigger:**
  - Creating or modifying any project-local or distributable skill package.
- **Rule:**
  - Write `SKILL.md`, runtime references, prompts, templates, and eval-facing prose in English.
  - Keep generated reports and user-facing answers in the user's language.
  - Do not bulk-translate unrelated existing skill packages unless the user explicitly requests a repository-wide migration.
- **Check:**
  - Changed skill-package prose is English, except fixtures that intentionally test another language.
  - Report language remains independent from skill-source language.
