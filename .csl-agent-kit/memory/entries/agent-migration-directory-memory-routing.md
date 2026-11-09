---
schema: csl-memory/v2
id: agent-migration-directory-memory-routing
revision: 5
type: reference
title: 迁移协调、历史整理与旧项目检测
summary: 显式调用agent-migration默认当前工作区组合迁移，限定范围优先；写前核对最新Memory规范、结构和运行时能力，两类分别验收。保真与恢复边界保留，自动检测不授权搬迁。
sources:
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:extend-agent-migration-memory-support/event:5de6171889eb67a7b4949e65699b5466f140ed0a6d70e033edcc1dbd41d9ac9f
  - .csl-agent-kit/tasks/tasks/extend-agent-migration-memory-support.md
  - skills/meta/agent-migration/SKILL.md
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-task-maintenance — Task workspace data and
    architecture maintenance:1
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:inspect-agent-migration-skill/event:e212df8ab52800dd044522ab9148feb7a81fc56b47f2b998f2b48f14a165c405
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:default-combined-agent-migration/event:13c07a6287cdac2e92257472d9a0f1f47abafa3bf12cf80a29de0b24dedfc95f#user-final-request
  - session:01a1aa8b-a9fa-75b1-82f3-d85c3adae02a/task:default-combined-agent-migration/event:672116b9756dbdee375c1f4755a08bfcec992c5fa357088ee44eb53e12cf8017
  - skills/meta/agent-migration/SKILL.md#预检与分流
updated: 2026-11-06T07:35:14.000Z
deleted: false
retrieval:
  aliases:
    - agent-migration
    - 目录路径迁移与Memory升级
    - 组合迁移
    - 默认组合迁移
    - Task历史文件迁移
    - 旧项目自动迁移
    - session-start
    - Memory目标结构预检
  situations:
    - 确定显式调用agent-migration的默认迁移范围
    - 迁移前核对最新Memory结构及运行时能力
    - 核对组合迁移的旧源依赖及职责边界
    - 设计Pi进入旧项目时的自动迁移检测
    - 区分迁移检测需求与搬迁授权
    - 核对Task历史保真迁移与冲突恢复
  topics:
    - 存储迁移/协调入口
    - Memory/迁移
    - Pi/迁移检测
    - 存储迁移/自动化
  links:
    - kind: related
      scope: project
      id: legacy-context-22ba57285e51417e1ae9
---

入口：skills/meta/agent-migration/SKILL.md；目录布局见references/storage.md，Memory升级见references/memory-migration.md。

显式调用agent-migration且未限定模式、分支或作用域：默认执行当前工作区Memory与.csl-agent-kit目录组合迁移。显式只读、单分支或指定作用域优先；项目范围不扩张到用户级或其他项目。仅加载Skill或检测旧结构不授权写入。

任何迁移写入前，核对当前最新可用Memory权威规范、store/entry/index目标结构及实际升级器和读写方能力；不把历史版本号或旧布局当固定目标。单独目录迁移仍须核对Memory旧源与恢复依赖，不因此扩大升级范围。项目与用户索引按核实后的各自布局验收；细节以当前Skill为准。

Memory复用既有升级器，不复制第二个知识库。若搬目录会移走导入源，先原地导入并验证；否则按依赖决定顺序。两类结果分别验收，Memory不套用目录分支旧源删除步骤。入口负责协调，不是通用迁移引擎；不因加载Skill安装启动Hook或重复宿主已完成的升级。目录切换核对消费者兼容性、冲突、活动写入方及恢复能力。

Task历史迁移：确定唯一owner、权威路径及全部相关引用。Context/Lessons不再独立日常维护，长期知识归Memory，Task历史不顺带改写。含唯一内容的非空路径须保真迁移；重复删除须证明源与目标的路径、类型、权限、字节及hash一致。只删除整树确为空且不含他人内容的目录；源与目标不得互含。

移动或删除稳定身份前核对当前非历史消费者；无法证明有效则暂缓。展示准确变化与恢复边界，遵守已授权范围及当前确认模式。执行前后重验源、目标、引用；使用经验证的同文件系统无覆盖原子迁移能力与私有隔离区。能力不可用则不能声称安全迁移。恢复不得覆盖已重建的源；保留候选、隔离区及冲突信息，不能安全自动解决的冲突由用户决定。实际产物决定当前状态，缺少日志不证明未发生。

Pi进入旧项目时自动检测是否需迁移是独立产品需求，不是跨项目无人确认执行偏好。自动检测本身不授权删除旧源、处理冲突或无条件搬迁。session-start/run-script/inject-output只读预检是备选接入方案，不能当作既定实现；接入与运行时兼容性须查当前规范和代码。
