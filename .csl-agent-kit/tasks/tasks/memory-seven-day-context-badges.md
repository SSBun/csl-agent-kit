# 最近七天临时记忆与特殊文件徽标

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-10 11:33) |
| Artifacts | [Artifacts](../artifacts/memory-seven-day-context-badges/) |
| Kind | Task |

## Target
- [x] T1: 提供独立的项目临时记忆，供新Agent了解用户近期意图与上下文，仅保留最近7天内容，过期内容不再作为近期上下文读取。
- [x] T2: Dashboard将context、lessons与临时记忆识别为特殊文件，显示可区分的专属徽标。
- [x] T3: 临时记忆与长期知识明确区分，不代替任务权威状态或执行授权，不增加历史、归档或恢复副本，不自动升级用户级及其他项目旧库。

## Scope

项目临时记忆及三类特殊文件的Dashboard标识；保留既有长期知识、旧库只读和无历史恢复边界。不运行单元/项目测试，不提交或推送。

## Plan

1. 实现临时上下文的日期、写入、读取和确定性过期清理。
2. 接入会话后台与新Agent读取，展示三类专属徽标。
3. 更新契约，完成允许的静态与实际界面验证及独立审查。

## Execution Log

### 001 — 用户确认与时间边界

用户以yes确认完整目标。采用UTC当天及前6个自然日，与现有按日case一致；临时摘要不得通过重排续期。已有大量未提交改动来自此前任务，保留这些内容。当前项目已有context与lessons基础文件，新增temp特殊文件；三者仍使用现有标题、摘要和case格式，temp可在过期清空后保留空正文。消息时间不足时不猜测近期来源日期。

### 002 — 实现与现场检查

已接通消息UTC时间、后台临时case写入日期约束、跨日模型会话更新、初始化及每分钟过期清理，以及API与宿主提示的读取过滤。固定标题摘要避免过期意图留在索引；空temp保留入口，同名其他用途文件不覆盖。当前项目按真实本轮意图创建temp，9份文件、索引published。普通文件读取仍按契约忽略过期日期；停机期间不执行物理清理，启动补清。

已通过10份JS语法、桥接TS模块实际加载、新Pi回归定义语法及git diff --check；未运行任何单元/项目测试、模型或模拟时钟实验。回归定义覆盖UTC午夜边界、持久清理与空文件、日期拒绝、保留长期知识、身份冲突、徽标作用域和消息时间传递。非Pi启动脚本实际调用确认输出当前临时上下文。后台已在空闲边界重启以载入新代码。

ego-browser空间24实际打开本项目9条记忆，context/lessons/temp分别显示青/橙/粉徽标，临时详情有相同徽标、正文可读且无错误；空间已关闭，无截图或知识正文证据副本。agent-memory及agent-hooks Skill质量检查均无失败，保留1474与2090估算token的上下文预算提示。

### 003 — TR-1 索引漂移核对

第一轮源码检查无确认缺陷，但结束校验发现index.md漂移，本轮按invalidated by drift保存最终反馈，未作为通过证据。逐项hash比较确认18项中仅索引变化，temp与代码均未改变；当前索引published、9份文件，generation为fd5eb1d50632561be9018ac9998caf2404befad08ceddc66966f502e55c517e9。实际读取交互主题，确认后台将已授权的临时记忆/徽标产品约定提炼为长期产品契约；保留该有效增量，不回退索引。后台已在空闲边界停止。刷新快照后独立复核，无代码补丁，原页面及静态检查仍适用。

### 004 — 后台恢复后的有效临时增量

第二轮独立审查及结束18项身份核验通过，但恢复后台后、最终Verification写入前，temp新增一条本项目其他会话的有效近期意图，索引随之更新；终态门禁正确拒绝旧快照。已回读两条case，均在7日窗口、保留授权边界，未覆盖或删除增量。代码未改。后台再次在空闲边界停止；本轮在暂停期间完成全部验收与任务关闭，然后恢复服务，避免人为在终态检查前重新启动写入。该变化是正常运行数据更新，不是代码缺陷；旧通过结论不复用于新快照。

## Task Summary

**Memory存储与后台**：[运行时](../../../bin/memory/)增加项目temp的七天日期规则、清理和过滤，保留消息时间及来源日期约束；Dashboard为三类特殊文件显示徽标。

**宿主与契约**：[Pi桥接](../../../pi/lib/)和[Hooks](../../../skills/meta/agent-hooks/)给新Agent注入有效近期背景；[Memory技能](../../../skills/meta/agent-memory/)及[说明文档](../../../docs/memory.md)定义短期例外与边界。

**回归定义与当前数据**：[测试定义](../../../tests/)补充日期边界与时间传递场景；[项目Memory](../../memory/)新增temp及当前索引项。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性（Simplicity） | A | 复用同一正文格式、writer、锁和索引；特殊身份由文件名及固定摘要识别，无新历史或类型字段。 | 增加一个共享日期模块，三条读写路径需保持一致。 |
| 稳定性（Stability） | A | 语法/模块加载、实际写入回读、启动注入、真实页面检查通过；保留条件写入及旧scope限制。 | 午夜、崩溃及并发回归仅有定义与静态检查，未执行测试或模型实验；前台Pi需完整重启。 |
| 完整性（Completeness） | A | 三项Target对应后台/读取/清理/徽标与契约均有实现和检查；当前项目9份文件索引正常。 | 已运行会话中原有上下文不会被追溯抹除；停机清理在下次启动执行，接口读取仍过滤。 |

## Result

- T1: 项目temp实际创建、9份文件index published；非Pi启动注入包含当前有效上下文，Pi模块加载通过。UTC当天及前6日过滤、清理与来源日期约束已静态核对；边界测试定义未运行。
- T2: ego-browser真实页面显示context/lessons/temp三种文字及青橙粉徽标，临时详情同样显示徽标、正文可读且无错误；空间24已关闭。
- T3: 固定临时身份和七天例外写入契约；保留Task状态/授权边界与旧库只读限制，无新增归档恢复。Skill检查无失败，有1474/2090 token预算警告；未运行测试或模型实验。
- Review gate: Passed — fresh/read-only第03轮无缺陷，TR-1 resolved；终态前18项身份重新核验通过，保留有效临时增量。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 七天清理与多入口适配；在包含正常后台增量的新快照上复核。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-seven-day-context-badges/evidence/009a345a2126aff7f528c20aa9279a7a6fbddd7fce549dd0c297426767b70f75.json#009a345a2126aff7f528c20aa9279a7a6fbddd7fce549dd0c297426767b70f75
- Evidence: Result、Self Assessment及Execution Log001—004；只有temp和索引新增有效上下文，代码未变；当前9份文件published、2条temp均在日期窗口，测试未运行。
- Task fingerprint: a9d5d1deb664b14add0984d87ec5515068bc48d6336b24844803ba426e4efd2f
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-seven-day-context-badges/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-seven-day-context-badges/evidence/f1cc1460f688366b1662bc3fb48a74dd0043fbaf987cded78a2bf4215f59ca3e.json#f1cc1460f688366b1662bc3fb48a74dd0043fbaf987cded78a2bf4215f59ca3e | invalidated by drift | d563d80141cc02d4bb2b6bdc4e5d088624f2f381c56ddf9557dc4faf51b32ef3 |
| 02 | [Round 02](../artifacts/memory-seven-day-context-badges/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-seven-day-context-badges/evidence/db94c3a4903d108f4a690ae99a1938af3178b92e5e85a7ecc9409cafa6dbc0a2.json#db94c3a4903d108f4a690ae99a1938af3178b92e5e85a7ecc9409cafa6dbc0a2 | no blocking findings | db3d923d748f7301859a78a19816b9182ae1331a807e245599270ad8b9808a31 |
| 03 | [Round 03](../artifacts/memory-seven-day-context-badges/reviews/round-03.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-seven-day-context-badges/evidence/009a345a2126aff7f528c20aa9279a7a6fbddd7fce549dd0c297426767b70f75.json#009a345a2126aff7f528c20aa9279a7a6fbddd7fce549dd0c297426767b70f75 | no blocking findings | 373b144db05483e442225b681919493512ff63d619f3e3b254a59a4bfa849f6b |

## Verification

- Passed: 第03轮独立审查无阻塞，终态前18项内容/Git身份匹配；当前9份文件index published，2条temp处于7日窗口，三类徽标已通过真实页面检查，启动注入/模块加载/语法及Skill门禁检查适用。自评依据维持；未运行测试、午夜/模型/并发/崩溃实验，前台Pi需完整重启，Skill预算警告保留。验收后恢复服务。
