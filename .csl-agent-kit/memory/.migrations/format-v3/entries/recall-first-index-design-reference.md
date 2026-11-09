---
schema: csl-memory/v1
id: recall-first-index-design-reference
revision: 3
type: reference
title: 召回优先Memory架构设计文档引用
summary: 召回优先、多入口及检索卡片方向已获认可；架构稿集中描述chip、卡片库、主题导航与薄总览。仅为设计提案，不代表当前运行时。
sources:
  - tasks/tasks/design-recall-first-memory-index.md
  - tasks/artifacts/design-recall-first-memory-index/specs/2026-11-03-recall-first-memory-architecture.md
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:design-recall-first-memory-index/event:5be932f7d55631e8e4cf8b5ef75a370121a8b4a37eec3f4d275d9fd8355072bc
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:design-recall-first-memory-index/event:c54a8c2968c4ec9a52c4bd7d0709235619048b48e850a3dc2154caf9869638b1
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:design-recall-first-memory-index/event:a154e51db5a586914e61a5f83b08917794288115b37af11b9138e74c44a95ac4
updated: 2026-11-03T07:27:55.300Z
deleted: false
---

## 设计来源
新版架构提案：`tasks/artifacts/design-recall-first-memory-index/specs/2026-11-03-recall-first-memory-architecture.md`。任务载体：`tasks/tasks/design-recall-first-memory-index.md`。查阅设计时优先读文档，不以本条复制或替代规格。

## 已认可的方向
用户强调相关知识及适用条件的召回优先，成本次之；已确认同一权威正文允许多个发现入口，不限单一目录分支，不复制知识版本。用户随后认可检索卡片思路，并明确要求根据讨论形成新版架构设计文档。

## 提案与实现边界
文档提出权威chip正文、完整检索卡片库、多入口主题导航及薄总览。它自述为供后续实施的架构提案，不表示运行时已实现，也不替代现有正式规范；具体schema、预算、迁移步骤和验收阈值仍属于提案。用户要求文档，不等于逐项批准文档新增细节或授权运行模型实验。
这更新了此前仅以讨论中的待确认三层建议定位该方案的描述：现在已有可回查的设计文档，但仍不能把提案当作已实施行为。原试跑证据及外推限制另见 `memory-index-pilot-evidence`。
