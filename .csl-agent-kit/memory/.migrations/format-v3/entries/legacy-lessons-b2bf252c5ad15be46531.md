---
schema: csl-memory/v1
id: legacy-lessons-b2bf252c5ad15be46531
revision: 1
type: experience
title: 新记录校验不要被历史样例放宽
summary: 同一索引保留旧记录时，只对当前触及的新记录落实现行契约，不借机批量迁移。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-29 用目标化检查阻止历史样例覆盖新记录契约:1
updated: 2026-11-02T03:43:09.567Z
deleted: false
---

## 2026-07-29 用目标化检查阻止历史样例覆盖新记录契约

- **Trigger:**
  - 同一索引保留旧格式历史记录，但新建、重新打开或更新的记录必须采用新格式。
- **Rule:**
  - 为当前触及的记录提供可执行格式检查，并在写入后强制运行；不得因历史兼容边界而只依赖提示文本。
  - 检查只针对当前记录，不能要求批量迁移未触及的历史数据。
- **Check:**
  - 新格式目标记录通过，旧格式或与 canonical record 不一致的目标记录失败。
  - 未触及的旧格式兄弟记录不阻塞当前检查。
