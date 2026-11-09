---
schema: csl-memory/v1
id: legacy-lessons-2699bc1d510c4a39b732
revision: 1
type: experience
title: 多 Agent 角色名匹配工作阶段
summary: 形成答案用综合与挑战角色；成稿修改与验收才使用 Editor/Reviewer，避免语义误导。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-20 让多 Agent 角色名匹配工作阶段:1
updated: 2026-11-02T03:43:10.097Z
deleted: false
---

## 2026-07-20 让多 Agent 角色名匹配工作阶段

- **Trigger:** 为答案形成、方案讨论或最终交付物检查设计多 Agent 工作流。
  - **Rule:** 答案形成阶段使用能表达综合与挑战职责的角色名，例如 Synthesizer / Challenger；Editor / Reviewer 只用于成稿后的修改与验收。不要因通信拓扑相似而复用阶段语义不符的角色名。
  - **Why:** 角色名会向用户和 Agent 暗示流程目标；混用会让讨论误读为批准门禁，并模糊 `deliberate` 与 `adversarial-review` 的边界。
