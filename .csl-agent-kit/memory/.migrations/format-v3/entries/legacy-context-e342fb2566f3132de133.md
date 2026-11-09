---
schema: csl-memory/v1
id: legacy-context-e342fb2566f3132de133
revision: 1
type: fact
title: 长期 Topic 与任务关联
summary: 建立或更新长期共享规格、任务关联、版本采用与跨仓边界时读取。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-topics — 长期 Topic 与任务关联:1
updated: 2026-11-02T03:43:08.553Z
deleted: false
---

## CTX-topics — 长期 Topic 与任务关联
- Scope: 长期维护主题的共享规格、采用版本、可选任务归属、跨仓定位、双向索引和完成门禁。
- Paths: `skills/meta/topic/`, `skills/meta/csl-tasks/shared/lib/topic-core.js`, `skills/meta/csl-tasks/shared/lib/topic-cli.js`, `tasks/topics/`, `tasks/topics.md`
- Keywords: topic, persistent requirement, spec context, revision, freshness, task association, archived, cross-workspace
- Authority: `skills/meta/topic/SKILL.md`, `skills/meta/topic/references/topic-contract.md`, `skills/meta/csl-tasks/shared/lib/topic-core.js`, `skills/meta/csl-tasks/shared/lib/task-core.js`
- Recheck: Topic schema、关联权威、版本范围、跨仓解析、锁或终态门禁变化时复核。

### Purpose and Boundaries
- Topic 是独立于 Task Kind 与 Queue Parent 的长期共享规格，不限于多平台；任务可以没有 Topic，成员全部完成不自动归档。新建 Topic 默认 Active，正常状态为 Active/Archived；Active 不表示规格完整，Topic 状态和内容版本都不是执行授权。旧 Draft 保持读取兼容，`activate` 仅用于显式转换指定旧记录。
- Topic canonical 文件和可重建索引位于 owning workspace 的 Task 数据区；规范快照不可变，成员列表只存引用和职责，状态现场读取。Task 绑定是归属权威，Topic Tasks 是反向索引。
- Topic 的 `resources/` 保存跨任务长期资料，主文档 `Resources` 表记录可点击链接、用途及 normative/reference 分类；`update-resources` 显式替换索引，不复制、移动或删除来源。新 Topic 创建目录与空表；旧记录保持原样，直到显式初始化资源索引。
- normative 资源的元数据与文件摘要进入规格投影并按既有门禁核对；reference 内容与索引变化不影响规格摘要。规范性来源只能是固定摘要的 owner-repo 文件；HTTP(S) 仅支持无凭证的参考链接，CLI 不抓取。已有权威文件直接引用，任务专属产物仍归 owning Task。

### Workflows
- 共享 CLI 的 `topic` 子命令维护 create/show/list/update-spec、activate/archive/restore、attach/detach/adopt、check/repair/rebuild-index；写入核对旧版本并持有工作区锁，跨仓写入另需明确授权和 allow-cross-workspace。关联写入前持久记录确切旧/新引用，失败或回滚后保留 pending marker，直到受限 repair 核对两侧关系并同步、验证该任务索引后完成；即使 Task 已解除绑定也不能绕过终态门禁。不能声称具备分布式崩溃原子性。
- 规格摘要覆盖 Scope、Spec Context、Decisions 与固定的本地规范性依赖，不覆盖成员列表和生命周期状态。完整候选正文先通过同一解析器和 round-trip 检查再写入，避免未闭合围栏破坏固定章节。Task assessment、review、passed verification 和 complete 校验新旧规格、依赖及反向链接；显式 adopt 记录影响处置并失效旧证据，历史 Completed 不自动改写。失败验证和取消允许在过期时记录，并失效旧成功证据。

### Decision and Verification Boundaries
- 跨仓引用复用已确认的 project-index，限定 Git 根目录并固定 origin 哈希；未登记或身份变化不自动修复。规范性外部 URL 必须先取得允许的固定本地副本，CLI 不自动抓取。
- Archived 和旧 Draft 仅允许符合目标的 maintenance 任务，不是实现绕过路径；归档可显式指定当前 In Progress 且已关联的归档维护任务，其他活动或未知成员仍阻止归档。
- `topic check` 核对索引和已列成员关系，并分开展示成员 freshness；不证明所有历史成员满足最新规格，也不扫描所有仓库查找遗漏。
