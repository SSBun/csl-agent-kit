---
schema: csl-memory/v1
id: legacy-lessons-c5a35c3c5696edfe3676
revision: 1
type: experience
title: Repo Map 聚焦职责和关系
summary: 解释代码库时呈现入口、类型、职责与调用关系，不重复显而易见的元数据。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-06-25 Repo Map Deep Concepts Only:1
updated: 2026-11-02T03:43:11.438Z
deleted: false
---

## 2026-06-25 Repo Map Deep Concepts Only

- **Trigger:** 设计 repo-map 输出或示例内容时。
  - **Rule:** 不要输出一眼就能看出的项目名、语言、框架等 inventory；只输出通过文件结构、CodeGraph、调用关系和代码阅读确认的组件职责、模块边界、关键类型职责和客观流程。
  - **Why:** repo-map 的价值是帮助 agent 快速理解项目结构和核心职责，不是重复项目元数据或解释实现细节。
