---
schema: csl-memory/v1
id: legacy-lessons-8d4dd4d0e6e77c693311
revision: 1
type: experience
title: 可分发 Skill 必须自包含
summary: 项目 RFC 可提供设计背景，但共享 Skill 的运行契约必须随包分发。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-22 Keep Distributed Skills Self-Contained:1
updated: 2026-11-02T03:43:09.936Z
deleted: false
---

## 2026-07-22 Keep Distributed Skills Self-Contained

- **Trigger:** A project RFC or guide informed a distributable skill, but the user clarified that the project document is not part of the skill source.
  - **Rule:** Put operational guidance inside the skill package, keep Agent-facing prose in the requested distribution language, and treat project RFCs as rationale only unless they are explicitly part of the runtime contract.
  - **Why:** A distributed skill must remain usable without repository-only documents, and design history must not override implemented behavior.
