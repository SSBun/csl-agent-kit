---
schema: csl-memory/v2
id: legacy-context-042589327b4342aa11f6
revision: 9
type: experience
title: Memory 召回、准入与紧凑索引
summary: 项目20条、每条1000词、单索引；召回与条件保留优先，先存后删，检索不授权，Repo Map聚焦职责关系。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-task-context — Workspace Context dispatch and
    maintenance:1
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-task-lessons — Workspace preventive lessons:1
  - skills/meta/agent-memory/SKILL.md
  - docs/memory.md#主动整理与周期复查
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:dashboard-newest-memory-file-changes/event:faca745aa2930ad2f4edc9006c5bfda59f497d58cac76cacc6591c01a88b0b39
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:dashboard-newest-memory-file-changes/event:8deb885fb4c819b0e8c8a422d1960fb42fc8a94e201e20dc73ede02cc0a47d04
  - .csl-agent-kit/tasks/tasks/proactive-memory-maintenance.md#Execution Log
  - .csl-agent-kit/tasks/tasks/proactive-memory-maintenance.md#Verification
  - session:01a1a0cb-07d5-7305-bc60-c84e0b5271b2/task:proactive-memory-maintenance/event:cfd9ac41f5ed8492fcb97441929b80579cdefb5b84cf8e910228352a09a04410
  - tasks/tasks/design-recall-first-memory-index.md
  - tasks/artifacts/design-recall-first-memory-index/specs/2026-11-03-recall-first-memory-architecture.md
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:design-recall-first-memory-index/event:5be932f7d55631e8e4cf8b5ef75a370121a8b4a37eec3f4d275d9fd8355072bc
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:design-recall-first-memory-index/event:c54a8c2968c4ec9a52c4bd7d0709235619048b48e850a3dc2154caf9869638b1
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:design-recall-first-memory-index/event:a154e51db5a586914e61a5f83b08917794288115b37af11b9138e74c44a95ac4
  - tasks/tasks/implement-recall-first-memory-index.md
  - session:01a1a081-2658-70aa-ae27-c1e4dcc5ef1e/task:null/event:37e20520447a979cfc18d595f7bb831cbbff41c7a6bd807636a0c93d162ff0cc
  - .csl-agent-kit/tasks/tasks/memory-file-count-budget.md#Target
  - session:01a1ab29-d4a2-76ca-a44e-d8111f59b9c0/task:memory-file-count-budget/event:7b324087c3c0e9fe202bb12976db7b10308793ea0d6ed3055baf21b2bd042a3b
  - skills/meta/agent-memory/SKILL.md#Entry format and budgets
  - docs/memory.md#读取与存储
  - docs/memory.md#格式与预算
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-06-25 Repo Map Deep Concepts Only:1
updated: 2026-11-05T11:35:20.692Z
deleted: false
retrieval:
  aliases:
    - Memory 检索、经验准入与主动整理
    - Memory知识准入
    - 防错经验
    - 机械约束优先
    - 主动整理记忆
    - 合并相似chip
    - Memory 召回架构与项目单索引
    - recall-first memory index
    - 召回优先Memory架构
    - 项目单索引
    - 20 chips
    - 1000词
    - Repo Map 聚焦职责和关系
  situations:
    - 用户纠正后判断经验是否值得保存
    - 同类错误复发时修订防护
    - 核对检索覆盖与来源
    - 判断未使用或相似记忆能否删除合并
    - 核对项目单索引与用户卡片主题的结构差异
    - 查找召回架构来源与实施边界
    - 判断容量整理及代际复查要求
  topics:
    - Memory/检索与知识准入
    - Memory/经验纠错
    - Memory/主动整理
    - Memory/召回架构
    - Memory/容量与索引
  links: []
---

## Memory 检索、经验准入与主动整理

检索与维护权威：skills/meta/agent-memory/SKILL.md、docs/memory.md。索引发现后核对正文、来源、条件和关系；无命中不证明不存在，按别名和依赖补检，不设固定命中上限。项目理解按需覆盖用途、词汇、职责、入口产物、数据/控制流、权威、跨组件约束和验证信号，不默认全仓审计。

准入：证据支持、范围明确、稳定或有复核触发，能跨任务改变判断且比重建经济。经验须有复发前可识别的触发、防护动作和可观察检查；态度、临时进度、推测、秘密不入库。源码、schema、类型、测试、lint、CI或正式流程能完全约束的错误优先在那里修复；Memory只留仍需判断的部分，不能替代机械约束。

用户纠正先应用当前工作；同类错误复发优先检查并修订既有防护。Task Agent读取应用，独立Memory Agent日常维护；两级自动维护、用户明确限制优先。experience仅为元数据，不另设权限、检索排除或专属Lessons解析器。冲突依当前有效指令与权威，不按记忆日期机械排序。检索不产生授权。

主动纠错、淘汰失效、合并相似主题、提炼共性；未使用只提示复查，删除须有期限/条件失效或完整替代证据。合并保留独有条件、动作、检查、例外和来源；语义相似不足，抽象不得超出案例。先保存回读替代知识，再修正入链和处理旧条目；跨工作区依赖不能安全修正时保留，supersedes目标不能删成断链。CAS冲突重读，错误不证明回滚。

周期复查依运行中daemon，每scope至少24小时、最多8个起始ID；超容量扩展完整项目索引。停机不运行，允许零修改但超限须修复或报告阻塞；不等于统一有效期/复查日期/最近使用字段驱动的完整自动过期系统。

证据边界：隔离模型曾将条件、来源一致的两条样例合一并保留项目限定与审计；组件覆盖候选上限、去重、冷却、入链保护。真实调度投递和部分开始执行不证明完成、当前服务状态或真实库整理效果，单一样例不证明普遍语义准确率。历史失败不重发演示不代表当前恢复策略；实施任务的审查不构成每次合并的审批要求。

## Memory 召回架构与项目单索引

当前契约：每项目最多20个有效chips，每chip正文最多1000词（Intl.Segmenter zh的isWordLike段）。项目只有index.md，直接列全部有效条目的摘要、正文链接、revision/hash及反向替代提示，不再生成项目卡片/主题文件；用户级仍保留完整卡片库、动态主题与薄总览。正式入口：skills/meta/agent-memory/SKILL.md、docs/memory.md。

召回原则：相关知识与适用条件优先，成本次之；同一权威正文可有多个发现入口，不复制知识版本。历史多文件索引设计不能覆盖当前项目单索引契约。未分类/待增强条目仍须可发现；普通工具检索后核对正文、generation和反向关系，覆盖不足明确降级。新增B supersedes A，即使A正文hash不变也须复查代际与反向关系。两级自动维护、CAS、审计恢复、保真幂等迁移、旧writer保护依当前Skill，覆盖CLI/Web/Pi。

历史设计和实施证据入口见sources；基础元数据卡片不等于语义增强或召回提升。契约、实现授权不证明完成或后台激活；试跑证据及外推限制见memory-index-pilot-evidence。

既有实施范围：不引入必需数据库/向量服务，不删除原始知识、不提交发布、不覆盖无关改动，不擅自运行测试套件或新模型评测。共享旧daemon兼容升级许可限代码验证完成且空闲，保留队列与知识、不关闭前台、不打断批次，不构成无条件服务控制授权。

## Repo Map 聚焦职责和关系

## 2026-06-25 Repo Map Deep Concepts Only

- **Trigger:** 设计 repo-map 输出或示例内容时。
  - **Rule:** 不要输出一眼就能看出的项目名、语言、框架等 inventory；只输出通过文件结构、CodeGraph、调用关系和代码阅读确认的组件职责、模块边界、关键类型职责和客观流程。
  - **Why:** repo-map 的价值是帮助 agent 快速理解项目结构和核心职责，不是重复项目元数据或解释实现细节。
