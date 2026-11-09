---
schema: csl-memory/v1
id: legacy-lessons-ed7ba763a9bff7d3c6d7
revision: 1
type: experience
title: 显式安装选择后避免重复确认
summary: 交互安装已提交同一选择时，不再增加无意义确认；实质范围变化和 Task 对齐门仍独立适用。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-23 Avoid Redundant Confirmation After Explicit
    Selection:1
updated: 2026-11-02T03:43:09.858Z
deleted: false
---

## 2026-07-23 Avoid Redundant Confirmation After Explicit Selection

- **Trigger:** A user explicitly selects installation targets, then the workflow asks a generic second confirmation for the same selected actions.
  - **Rule:** For the same interactive installation selection, treat the explicit selection-and-submit step as authorization unless the later action introduces a materially different risk or irreversible consequence. This does not replace Task Target acceptance or separately required safety gates. When removing a prompt, remove every reader and guard for its response value in the same change.
  - **Why:** Reconfirming the same scope adds friction, while leaving a downstream response guard makes the accepted path fail after the prompt disappears.
