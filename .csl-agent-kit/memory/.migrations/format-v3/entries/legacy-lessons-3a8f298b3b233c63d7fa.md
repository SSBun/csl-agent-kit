---
schema: csl-memory/v1
id: legacy-lessons-3a8f298b3b233c63d7fa
revision: 1
type: experience
title: 避免无用途的 Skill 特殊接口目录
summary: 清理孤立结构前核查运行和打包消费者；仅在无用途且任务授权覆盖时移除。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-10 Avoid One-Off Skill Interface Folders:1
updated: 2026-11-02T03:43:10.905Z
deleted: false
---

## 2026-07-10 Avoid One-Off Skill Interface Folders

- **Trigger:** 某个 skill 单独包含 `agents/` 接口元数据，但项目中的其他 skills 不采用该结构，且运行时和打包配置都不依赖它。
  - **Rule:** 先检查引用和运行依赖；没有实际用途时删除这个一次性目录，不要为了形式完整保留孤立元数据。
  - **Why:** 单个 skill 的特殊目录会制造错误的项目约定，并增加维护和审计噪声。
