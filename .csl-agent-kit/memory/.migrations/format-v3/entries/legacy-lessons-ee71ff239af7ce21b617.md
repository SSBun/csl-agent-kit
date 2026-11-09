---
schema: csl-memory/v1
id: legacy-lessons-ee71ff239af7ce21b617
revision: 1
type: experience
title: Skill 移动或重命名的消费者检查
summary: 删除或移动 Skill 时检查发现、manifest、安装、文档、规则与路径构造器；历史任务不批量重写。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#L-20260821-skill-rename-consumers — Skill
    移动或重命名时解析全部消费者:1
updated: 2026-11-02T03:43:09.297Z
deleted: false
---

## L-20260821-skill-rename-consumers — Skill 移动或重命名时解析全部消费者

### Trigger
- 删除、弃用、移动或重命名一个 Skill、目录或 slash alias。

### Rule
- 在同一改动中搜索并清理当前 README、manifest、安装枚举、规则、Context Authority、路径构造器和测试消费者中的旧名称或旧路径；历史任务记录保持不变。
- 逐个解析共享根目录变量、相对路径与生成式消费者到实际文件，不能只搜索完整旧字符串；已有替代 Skill 时只暴露 canonical 名称。

### Check
- 搜索旧名称和旧路径后只剩有意保留的历史、迁移记录或负向拒绝断言。
- 每个当前消费者解析出的 canonical 路径实际存在，旧路径不存在；获准运行时，相关发现、命令、安装与路径消费者测试通过。
