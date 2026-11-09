# 扩展 Task Maintenance 架构迁移清理

Status: Completed (2026-09-02 17:23)
Kind: Task

## Scope

- 包含：扩展 `task-maintenance`，除 Context/Lessons 数据整理外，还能按当前权威 Task 架构识别并清理或迁移 Task 系统拥有的历史文件与目录。
- 包含：同步 routing、Skill metadata、README 说明与普通 Context Pack。
- 排除：扫描整个仓库的通用架构整理、自动调度、改写历史正文、修改 Task schema/core，或在本任务中实际迁移当前 workspace 的历史数据。

## Target
- [x] T1: task-maintenance 保留 Context/Lessons 数据整理能力，并能依据当前 Task 系统权威架构识别、清理或迁移 Task 系统拥有的历史文件与目录。
- [x] T2: 所有清理和迁移都有可验证的目标布局、数据与引用保全边界、精确变更预览、明确确认及失败恢复。
- [x] T3: Skill 仅处理 Task 系统拥有的历史载体，不扩展为整个仓库的通用架构清理器。

## Decisions

- 当前架构必须从 `task`、`task-context`、`task-lessons`、`archive` 与当前活跃 Task artifact producers 的运行时契约现场建立，不把历史目录名或本仓库现状缓存成永久真相。
- Task-owned carrier 只包括 Authority 明确声明的 Task workspace 路径；仓库源码、正式文档、构建产物和其他未声明目录不进入候选。
- 新增结构操作 `Migrate`，并允许 `Delete` 删除已验证迁移后的旧文件、空目录或内容完全重复的旧副本；现有 Context/Lessons `Delete` 与 `Merge` 语义保持不变。
- 结构维护必须进入 canonical `task` 生命周期；仅 Context/Lessons 数据整理继续使用既有 routine-maintenance 例外。当前维护任务自身不作为本轮迁移候选。
- 每个结构候选必须给出 source、canonical destination、owner、类型、内容校验、引用改写和冲突状态。目标已存在且内容不同、owner 不唯一、路径越界或 Authority 不足时 Defer，永不覆盖。
- 迁移采用先复制到目标并校验，再更新获批的 Task-owned 活动引用，最后删除源的顺序；任一步失败时恢复引用、移除本次目标并保留源。
- 历史 task／conversation 正文不为路径整洁而重写；只有获批迁移后仍承担导航作用的精确 Task-owned 链接可更新。不可在 Task-owned 范围内保全的外部引用阻塞迁移。
- 精确 change set 的一次确认同时作为实际删除／迁移边界的 `Safety Confirmation`；用户可批准完整候选或明确子集，单个 Migrate 候选不可拆分。
- 不新增 parser、migration script、兼容 symlink、双写、fallback、缓存、台账或状态文件。

## Plan

1. 重写 `task-maintenance` 的范围、runtime dependencies、架构发现、候选门、change set、迁移事务、失败路由与完成验证，使数据整理和 Task-owned 结构迁移共享一个明确确认闭环。
2. 更新 Skill metadata 与 routing fixtures，覆盖历史 Task 路径迁移、空旧目录清理、Context/Lessons 整理及整个仓库通用迁移的排除边界。
3. 同步 README 描述和 `CTX-task-maintenance`，记录当前职责、动态 Authority 与结构迁移安全边界。
4. 运行三个改动 package 所需的 Skill Quality、JSON/YAML、Context/Lessons/Task 校验、共享发现与 `git diff --check`；按当前用户规则不运行项目测试套件。

## Result

- T1: task-maintenance 已保留 Context/Lessons Delete/Merge，并新增从 task、task-context、task-lessons、archive 及 live path producers 动态建立当前架构图的 Task-owned Delete/Migrate 流程。
- T2: 结构候选要求唯一 owner、canonical destination、完整类型/字节/SHA-256/引用清单与无覆盖检查；获批后按复制校验、改写 Task-owned 链接、删除源执行，并定义前后失败恢复和一次 Safety Confirmation。
- T3: Skill 明确只枚举当前 Authority roots 与有历史归属证据的 Task sources，排除仓库通用迁移、历史正文现代化和外部引用改写；18 个 routing cases 零误判。
- Review gate: Skipped — 用户未请求 adversarial review、双 Agent Reviewer–Editor 或独立 Reviewer 批准；本次执行常规自审与确定性验证。

## Verification

- Passed: 三个 Skill Quality gate 均为 0 failures，task-maintenance 18 个 routing cases 零误判；Context、Lessons、Task、JSON、Claude manifest 和 git diff --check 通过。仅有已审阅的 context-budget 与 28 条既有 legacy Lesson warnings；按当前规则未运行项目测试。
