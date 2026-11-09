---
schema: csl-memory/v1
id: legacy-lessons-86b15cd6e022d3d4c89d
revision: 1
type: experience
title: 共享格式迁移覆盖全部读写方
summary: 修改公共文件格式前检查所有读写方和 fixture；仅写入侧通过不足以证明兼容。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-31 共享格式迁移必须覆盖所有读写方:1
updated: 2026-11-02T03:43:09.493Z
deleted: false
---

## 2026-07-31 共享格式迁移必须覆盖所有读写方

- **Trigger:**
  - 修改由 workflow、检查脚本、扩展或其他组件共同读写的文件格式。
- **Rule:**
  - 变更前搜索所有生产者、消费者和格式样例，并以实际运行时消费者的解析契约验证候选格式。
  - 在同一改动中同步规则、校验器和受影响的消费者测试；不能只验证写入侧格式。
- **Check:**
  - 同一个候选 fixture 同时通过写入侧校验和运行时消费者测试。
  - 搜索旧格式后只剩有意保留的历史记录或明确的拒绝用例。
