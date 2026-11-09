---
schema: csl-memory/v1
id: legacy-lessons-a2e584719409e67276c3
revision: 1
type: experience
title: 项目专用流程与全局 Skill 分开
summary: 项目专用 Skill 放在 .agents/skills，并同步排除共享发现与分发，不能只靠描述限制。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-16 将项目专用流程与全局可分发技能分开:1
updated: 2026-11-02T03:43:10.281Z
deleted: false
---

## 2026-07-16 将项目专用流程与全局可分发技能分开

- **Trigger:** 用户纠正 `integrate-third-skills` 只应在 CSL Agent Kit 项目内被发现。
  - **Rule:** 当用户将某项技能明确限定为项目专用时，将它放入受版本控制的 `.agents/skills/<技能名>/`，并从共享 `skills/`、全局安装枚举和跨平台命令发现中移除；同时检查项目本地链接机制不会重新把它暴露出去。若某个安装器选项仅为这种链接机制存在，应直接移除该选项，而不是保留它来生成共享技能链接。
  - **Why:** 仅靠描述或安装建议不能阻止全局发现；目录位置和发现器边界必须一致。
