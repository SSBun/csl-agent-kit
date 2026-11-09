---
schema: csl-memory/v1
id: legacy-lessons-ee92e47c51ca9b06138d
revision: 1
type: experience
title: 用户数据目录不承载源码镜像
summary: 用户根保存记忆、配置、审计与服务状态；可分发代码留在安装包或仓库。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-06-28 CSL Agent Kit Local Data Boundary:1
updated: 2026-11-02T03:43:11.550Z
deleted: false
---

## 2026-06-28 CSL Agent Kit Local Data Boundary

- **Trigger:** 修改安装脚本、hooks 或任何 `~/.csl-agent-kit` 路径时。
  - **Rule:** `~/.csl-agent-kit` 保存用户经验、记忆、配置、审计和服务运行状态；不要把 repository mirror 或 skill 代码 symlink 放进去。
  - **Why:** 本地经验数据和安装发现路径混在一起会让输出变吵，也会模糊用户数据与仓库源码的边界。
