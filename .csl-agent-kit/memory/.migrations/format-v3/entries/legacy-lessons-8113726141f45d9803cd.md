---
schema: csl-memory/v1
id: legacy-lessons-8113726141f45d9803cd
revision: 1
type: preference
title: CLI 人类输出默认启用颜色
summary: 人类可读 CLI 默认启用颜色；显式关闭、NO_COLOR 或机器 JSON 输出例外。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-10 CLI Colors Default On:1
updated: 2026-11-02T03:43:11.074Z
deleted: false
---

## 2026-07-10 CLI Colors Default On

- **Trigger:** Rendering human-readable CSL Agent Kit CLI output.
  - **Rule:** Enable ANSI colors by default, including non-TTY output. Disable only for `--no-color`, `NO_COLOR`, or machine-readable JSON.
  - **Why:** The user prefers consistently colorful CLI output rather than terminal-detection-based behavior.
