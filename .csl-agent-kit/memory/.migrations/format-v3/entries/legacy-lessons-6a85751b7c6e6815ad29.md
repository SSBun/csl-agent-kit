---
schema: csl-memory/v1
id: legacy-lessons-6a85751b7c6e6815ad29
revision: 1
type: experience
title: 可分发 Agent 模板不包含本机绝对路径
summary: 模板不能带作者机器的本地 include；用户自己的私有配置不属于同一分发边界。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-08 AGENTS Template No Local Include:1
updated: 2026-11-02T03:43:11.876Z
deleted: false
---

## 2026-07-08 AGENTS Template No Local Include

- **Trigger:** 修改 `AGENTS.md` 或 agent template 文件时。
  - **Rule:** 不要在可注入的 AGENTS template/example 中保留 `@/Users/...` 这类用户本机绝对路径 include；本地 `/Users/caishilin/.codex/AGENTS.md` 可以保留用户本机工具 include。
  - **Why:** AGENTS 模板会被注入到其它项目，本机绝对路径 include 不可移植；但用户自己的本地 AGENTS 可以包含本机专用工具规则。
