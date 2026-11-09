---
schema: csl-memory/v2
id: memory-automatic-failure-recovery-goal
revision: 3
type: preference
title: Memory 自动恢复与两次尝试上限
summary: 每条输入累计最多两次尝试，首次加一次自动重试；耗尽标记exhausted并继续后续记录。重启和手动retry不重置上限，部分提交保留；周期复查仍有24小时冷却。
sources:
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:fix-memory-failed-batches/event:ac474ce3f470378e989c585fc4ef9a82a46be1413d44748b9d47412fb35e60d8;
    自动恢复目标
  - docs/memory.md#后台与宿主接入
  - .csl-agent-kit/tasks/tasks/memory-workspace-concurrency.md#Scope
  - .csl-agent-kit/tasks/tasks/memory-workspace-concurrency.md#Result
  - session:01a1a559-31fa-7763-ad77-d5e88546996a/task:memory-workspace-concurrency/event:f8ca6e61b4756d31842221060be029ea088499a966be656e9702492060382523#user-and-assistant
updated: 2026-11-05T11:12:02.430Z
deleted: true
retrieval:
  aliases:
    - Memory自动恢复
    - 失败批次自愈
    - exhausted
    - 两次尝试上限
    - 已跳过
  situations:
    - 设计Memory失败或阻塞批次的自动恢复
    - 判断重启或手动retry能否重置尝试次数
    - 处理周期复查耗尽后的调度与冷却
  topics:
    - Memory/自动恢复
    - Memory/定期复查与清理
  links:
    - kind: related
      scope: project
      id: legacy-context-97c02696d8c555646b77
---

此条目已删除；历史正文保留在审计记录中。
