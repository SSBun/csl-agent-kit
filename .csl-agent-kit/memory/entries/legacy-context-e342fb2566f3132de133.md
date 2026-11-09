---
schema: csl-memory/v2
id: legacy-context-e342fb2566f3132de133
revision: 3
type: reference
title: 长期 Topic 与任务关联
summary: Topic是可选共享规格；Task绑定决定正式成员，history仅引用旧工作。活动Task根存储，规范性资料参与版本门禁；跨仓和部分写入须显式处理。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-topics — 长期 Topic 与任务关联:1
  - "skills/meta/topic/SKILL.md#Entry and Ownership; #Maintenance Workflow;
    #Association and Cross-Repository Boundaries"
  - "skills/meta/topic/references/topic-contract.md#Storage; #Resource Index;
    #Tasks Table and History; #Task Association; #Failure and Concurrency"
updated: 2026-11-07T11:24:00.135Z
deleted: false
retrieval:
  aliases:
    - Topic
    - member/history
    - topic reference-task
    - topic adopt
    - normative/reference
    - Topic Resources
  situations:
    - 建立长期共享规格与任务关联
    - 引用已完成历史任务而不改变归属
    - 处理Topic版本过期或跨仓关联失败
    - 区分Topic资料与任务记录
  topics:
    - Topic/共享规格
    - Topic/任务关联
    - Topic/资源与版本
  links: []
---

Topic 是独立于 Task Kind、Queue Parent 的可选长期共享规格，不限多平台；成员全部完成不自动归档。Active 不证明规格完整或执行授权；正常状态 Active/Archived，旧 Draft 仅兼容读取或显式 activate。Archived/Draft 的 maintenance 模式不能绕过实现限制；归档可豁免显式指定、已关联且 fresh 的当前 In Progress 归档维护任务，其他活动或不可访问成员仍阻止归档。

权威入口：`skills/meta/topic/SKILL.md` 与 `references/topic-contract.md`；共享实现 `skills/meta/csl-tasks/shared/lib/topic-core.js`、topic-cli.js、task-core.js。存储取 owning workspace 的活动 Task 根；当前规范为 `.csl-agent-kit/tasks/topics/` 及 topics.md，旧根仅按迁移过渡规则使用，不双写。规范快照不可变；成员状态现场读取。

Task binding 是正式归属权威，Topic 的 member 是反向索引；history 仅引用旧工作，不建立绑定、不改变旧任务或证据，Completed 不必为历史引用 reopen。history 不参与完成/归档门禁，缺失仅警告；不能用历史引用满足 backlink 或解除正式成员。旧 JSON-line Tasks 保持读取兼容，仅显式 format 所选 Topic。

Resources 收跨任务长期资料，任务记录放 Tasks，专属产物仍归 owning Task；已有权威文件原地引用。update-resources 替换整个索引，不复制、搬移或删除文件；旧记录不自动初始化。normative 为固定摘要的 owner-repo 文件，元数据及内容身份参与规格摘要/快照与 freshness；reference 不影响规格，除非同源另为 normative Dependency。HTTP(S) 仅无凭证 reference，CLI 不抓取；外部规范先取得允许的固定本地副本。

规格变化须影响分析及显式 adopt，失效旧 assessment/verification，保留 Required review；历史 Completed 不自动改写。成员列表和生命周期不进入规格摘要。过期时仍可记录 Failed verification 或取消，并失效旧成功证据。完整候选经解析及 round-trip 检查再写入。

写入核对当前 whole-file version 并加工作区锁；跨仓需明确授权及 allow-cross-workspace，复用确认的 project-index、Git 根与 origin 身份，不猜路径或自动修复身份变化。关联失败保留确切旧/新引用的 pending marker，repair 按 Task binding 核对两侧及任务索引后清除；已 detach 也不能绕过终态门禁。多文件回滚不保证分布式崩溃原子性。topic check 只查结构、索引和列出的正式成员，freshness 另报；不证明全部历史成员满足最新规格，不跨仓扫描遗漏。
