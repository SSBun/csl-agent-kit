# 仅保留记忆提交历史并简化 Dashboard

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 16:09) |
| Artifacts | [Artifacts](../artifacts/memory-commit-only-history/) |
| Kind | Task |

## Target
- [x] T1: 持久历史只记录实际提交的记忆变更，不为无变更处理保留会话和检查流水
- [x] T2: Dashboard直接展示记忆提交，不再提供有变更/全部处理记录筛选
- [x] T3: 保留真实提交的审计恢复及处理中的必要可靠性，不丢失部分成功提交

## Scope

用户原始要求：“不要任何处理记录都执行记录，这样会大幅增加硬盘消耗，只要被记忆系统认可的提交才执行记录，所以dashboard面板也要优化，现在不需要过滤记录成功的对象了,因为只有成功的记录存储才会被记录”。

永久历史仅为committed记忆审计。暂留未完成、失败待重试输入；最小去重hash、工作区登记及最新周期游标属于必要协调状态，不是处理历史。旧的完成事件也按同一策略释放；不删除entries、审计或索引代际。既有失败队列不自动retry。已加载旧queue模块的Pi需完整重启识别完成凭据。

## Plan

1. 提交审计成为唯一历史源，完成批次释放对话与处理日志，保留最小协调状态。
2. Dashboard去掉成功筛选及重复历史区，展示真实提交，待处理队列独立折叠。
3. 隔离验证关键路径、浏览器观察和独立只读审查。
4. 审查通过后空闲重启真实后台，核对清理与审计保留情况。

## Execution Log

### 001 — 队列与审计职责拆分

原events/jobs永久保存全部可见消息与summary，并承载去重、周期游标和工作区发现；只改Dashboard过滤无法减少磁盘占用。现将输入留在未完成队列，完成后先写去重hash、登记工作区及更新最新周期游标，再删除events/jobs。实际提交从原.history直接读取，独立于批次effects/最终状态。prepared/aborted仍是必要写入恢复凭据，不进入成功列表。

### 002 — 实现与隔离核验

新增commits聚合读取；queue增加完成释放与中断恢复；maintenance使用独立游标及登记工作区，保留用户chip跨项目入链保护；daemon不再保存完成summary，启动清理旧完成批次。Dashboard主列表使用提交源，去除changes-only筛选和维护回放，折叠区保留未完成队列及显式重试。CLI、Skill和文档同步契约。

真实接口隔离走查确认无变更不留原文、重复去重、异文拒绝、部分失败提交可见、周期游标与跨项目依赖保护、旧批次清理和清理中断不重放。浏览器MCP故障后改用独立headless Chrome和只读隔离服务，实际界面列表、摘要、diff和恢复入口正常。细节见[自查证据](../artifacts/memory-commit-only-history/evidence/verification.md)。未运行单元/项目测试或模型请求。

### 003 — 真实数据预览

只读预览：6个工作区、490笔committed审计；154个已完成事件及jobs合计454004字节可释放。真实后台尚未重启，清理尚未执行。独立审查只针对当前实现和隔离证据，部署作为后续步骤，不把预览记为已完成清理。

### 004 — 第一轮审查与修复

独立Reviewer确认TR-1固定去重分片可能跨越2 MiB读取上限，TR-2聚合分页重复全量读取审计；两项均成立。已改为1 MiB叶子的前缀拆分、子片先落盘再原子发布分支，以及每根一次元数据扫描。容量临界追加、拆分中断恢复均保留15197项且旧项丢失0；205笔分页每次读取205文件。详见[第二轮自查](../artifacts/memory-commit-only-history/evidence/verification-round-02.md)。实际后台仍未激活，等待新的独立复查。

## Task Summary

**Memory 队列、提交与调度**：[bin/memory](../../../bin/memory/)将完成批次原文和处理日志改为释放，仅保留最小去重与周期状态，新增直接读取提交审计的列表及CLI入口。

**Dashboard**：[bin/memory/web](../../../bin/memory/web/)主列表改为实际提交，删除有变更/全部处理筛选和重复历史区，保留差异、恢复与未完成队列。

**Memory 契约**：[skills/meta/agent-memory](../../../skills/meta/agent-memory/)及[docs/memory.md](../../../docs/memory.md)同步临时队列、永久提交、来源回放与升级激活边界。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用原提交审计而非另建历史；去重、最新周期与工作区状态用于维持原可靠性 | 分片去重hash仍随事件数缓慢增长 |
| 稳定性 | A | 隔离接口覆盖去重、部分成功、清理中断、周期及入链；补充跨2 MiB分片拆分/中断恢复和205笔分页读取计数，语法与既有浏览器观察通过 | 未运行单元/项目测试或模型；真实激活结果须由最终Verification核对，旧Pi需完整重启 |
| 完整性 | A | 代码与隔离环境覆盖T1–T3，UI无成功筛选且实际提交可见；真实数据预览已完成 | 原失败批次暂留且不重试；真实释放结果以最终Verification为准 |

## Result

- T1: queue.complete在隔离目录释放无变更/成功批次events和jobs，只保留hash与最新游标；commits从原审计读取，模型总结不再持久化。真实环境154完成批次454004字节仅做了预览，部署尚待审查后执行。
- T2: 独立headless Chrome隔离页主列表3笔实际提交，changes-only与旧重复history面板均不存在；点击提交显示摘要、before/after和恢复入口，无页面错误。
- T3: 隔离走查保留原去重、部分成功、周期与入链保护；TR-1临界2MiB追加拆分后15197凭据无丢失，中断恢复不重放；TR-2的205笔分页每次只读取205文件。原审计恢复路径不变；见verification-round-02.md，未跑套件。
- Review gate: Passed — fresh只读Reviewer第二轮确认TR-1/TR-2 resolved，无新增问题和实现阻塞；check-evidence快照匹配。真实部署与清理进入最终Verification。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 持久队列与恢复边界修复后的fresh复查，保持R2义务
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/daabeaafe772ee82972557b97d76cc75495f73b9d72a92435093d17cfe1ca556.json#daabeaafe772ee82972557b97d76cc75495f73b9d72a92435093d17cfe1ca556
- Evidence: T1–T3；verification.md与verification-round-02.md、两份走查脚本及changes-round-02.patch
- Task fingerprint: 59176fc5794a8bb0f12c46dfe906b26dd522acd62aae798d6701e8001bd234f5
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-commit-only-history/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/0e1d11b61ae4405a5719c6f32e98dd6e0a0732fcb27eb18d925fabe7d9ea7159.json#0e1d11b61ae4405a5719c6f32e98dd6e0a0732fcb27eb18d925fabe7d9ea7159 | findings | 9bac8a4797a0054f79e8ae29228dfefde64c678b533ff4c2563d5063f42764b2 |
| 02 | [Round 02](../artifacts/memory-commit-only-history/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-commit-only-history/evidence/daabeaafe772ee82972557b97d76cc75495f73b9d72a92435093d17cfe1ca556.json#daabeaafe772ee82972557b97d76cc75495f73b9d72a92435093d17cfe1ca556 | no blocking findings | d7d130171cedbd053f113bcfb21385734dfc5c89420bdf5579ba6737921c5949 |

## Verification

- Passed: 当前21文件快照及两份审查报告机械核验通过；第二轮TR-1/TR-2 resolved。空闲重启后PID30467、historyPolicy=commits-only/v1；158完成批次478135字节已释放，原493笔committed审计哈希全部一致，残留/凭据错误/未完成输入丢失均0，无调度错误。真实浏览器显示1—20/493，无成功筛选，详情与恢复入口正常。证据production-before.json、production-verification.json、production-ui.json。Self Assessment仍适用：未跑套件/模型，旧Pi须完整重启；既有1失败+50排队未擅自重试；skill-quality无failure但3329token预算warning。
