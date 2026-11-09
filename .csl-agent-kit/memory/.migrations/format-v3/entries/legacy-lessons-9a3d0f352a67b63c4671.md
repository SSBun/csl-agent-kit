---
schema: csl-memory/v1
id: legacy-lessons-9a3d0f352a67b63c4671
revision: 1
type: experience
title: 清空与重新选择整合是独立授权
summary: 用户要求清空后查看候选时，目录应保持为空；推荐清单不等于安装授权。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-16 将“清空”和“选择整合”视为两个独立阶段:1
updated: 2026-11-02T03:43:10.404Z
deleted: false
---

## 2026-07-16 将“清空”和“选择整合”视为两个独立阶段

- **Trigger:** 用户要求清空 `~/.agents/skills` 后列出上游技能，随后纠正我不应自动重装推荐集合。
  - **Rule:** 当用户要求清空目标目录、再从候选列表选择未来整合项时，清理完成后的目录必须保持为空；只列出候选并等待明确选择，不能把推荐清单当作安装授权。
  - **Why:** 清理的最终状态和后续整合选择是两个独立决策；自动重装会违背“清空全部”的字面结果。
