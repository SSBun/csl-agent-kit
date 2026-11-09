---
schema: csl-memory/v1
id: legacy-lessons-01aa1afd3ed4938569c4
revision: 1
type: fact
title: CSL Agent Kit 本机数据根
summary: 用户数据使用既有 .csl-agent-kit 根，并遵循 CSL_AGENT_KIT_HOME；不要发明第二个产品数据根。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-09 CSL Agent Kit Local Data Directory:1
updated: 2026-11-02T03:43:11.290Z
deleted: false
---

## 2026-07-09 CSL Agent Kit Local Data Directory

- **Trigger:** Modifying SOP, tips, hooks, installer, or docs that reference CSL Agent Kit local user data.
  - **Rule:** Use `~/.csl-agent-kit/` as the canonical local data directory for user SOPs, tips, settings, and future config.
  - **Why:** The project is now named CSL Agent Kit; the local data directory should match the product name and not the old SSBun Skills branding.
