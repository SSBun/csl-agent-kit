---
schema: csl-memory/v2
id: memory-workspace-concurrency-goal
revision: 3
type: preference
title: Memory 按工作区独立并行处理
summary: 不同workspace独立并行，取消全局两个并发上限；同workspace仍串行。运行契约与后台激活证据分别核对。
sources:
  - session:01a1a559-31fa-7763-ad77-d5e88546996a/task:memory-discard-invalid-backlog/event:8ef96be9c8f281a485fd5fc039231215932bfb19f602c3517016066c6b74a936#user-and-assistant
  - docs/memory.md#后台与宿主接入
  - .csl-agent-kit/tasks/tasks/memory-workspace-concurrency.md#Scope
  - session:01a1a559-31fa-7763-ad77-d5e88546996a/task:memory-workspace-concurrency/event:f8ca6e61b4756d31842221060be029ea088499a966be656e9702492060382523#user-and-assistant
updated: 2026-11-05T11:12:11.388Z
deleted: true
retrieval:
  aliases:
    - Memory工作区并发
    - 每个workspace独立Memory Agent
  situations:
    - 设计Memory跨工作区并行调度
    - 区分Memory Agent会话隔离与全局并发上限
  topics:
    - Memory/并发调度
  links:
    - kind: related
      scope: project
      id: legacy-context-97c02696d8c555646b77
---

此条目已删除；历史正文保留在审计记录中。
