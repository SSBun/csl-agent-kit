# 增加记忆主动纠错淘汰合并与提炼流程

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 20:09) |
| Artifacts | [Artifacts](../artifacts/proactive-memory-maintenance/) |
| Kind | Task |

## Scope

落实到现有Memory daemon与Memory Agent，不新增独立服务或预设知识分类。默认每scope距上次成功至少24小时，最多8个种子ID，后台每分钟检查；user scope全局共享，project scope按已注册工作区。停机不运行，模型费用沿用现有配置。未知外部引用不做全局完整性承诺。

## Plan

1. 将相关旧知识复查纳入每次会话维护，明确保留、纠错、合并、提炼和淘汰条件。
2. 增加显式周期事件、持久游标和空闲调度，隔离会话失败与周期失败的阻塞策略。
3. 对Memory Agent删除添加入链与pending保护；同步规范与文档。
4. 完成隔离流程检查、真实模型样例、独立只读审查，审查通过后在空闲窗口加载服务并核对状态。

## Execution Log

### 001 — 机制与边界

现有Agent已有put/delete与审计，但缺少周期入口。新增maintenance事件携带scope/ids且messages为空，不伪造用户会话。使用既有事件历史做持久游标：成功后24小时可继续，失败/中断必须显式retry；会话优先，周期失败不阻塞会话。每批最多8个按字典序轮转的种子，允许模型按相关性扩展同scope。删除前检查当前两级以及用户chip的已知项目入链，保留无法跨workspace修正的依赖；不对未知外部引用或并发外部writer作原子保证。

### 002 — 隔离调度与保护检查

通过独立临时home/workspace运行真实queue/store/scheduler组件的操作演示，未运行测试套件。11个样例chip首批8个，messages为空；重复检查仍仅1个批次，模拟失败后经过两个周期仍不自动重发；显式retry后模拟完成，冷却期不重发，到期下一批为剩余3个ID。被requires引用的sample-0被MEMORY_REFERENCED拦截，无入链sample-1检查通过。脚本位于/tmp/csl-memory-maintenance-smoke.cjs，隔离目录为/var/folders/lr/zrjft2s57_38p9t1ctj4_57m0000gn/T/csl-maintenance-UFi9at。

### 003 — 真实模型隔离演示

在另一隔离home/workspace通过实际scheduler生成周期事件，再交给实际Memory Agent模型。两条来源、条件一致的配置样例被整理为1条：sample-config更新至revision2，重复项逻辑删除至revision2；两次transaction均已审计。回读存活正文保留“仅限本隔离样例项目”及spec.md来源，派生索引published、pending=false、missingReferences=0。模型说明检查两条及来源，无待复查项。此观察证明一次真实周期事件可完成合并淘汰，不证明任意语义判断都正确。隔离目录为/var/folders/lr/zrjft2s57_38p9t1ctj4_57m0000gn/T/csl-maintenance-model-68opil，操作脚本为/tmp/csl-memory-maintenance-model-smoke.cjs。

### 004 — 初步自检

四份JS语法检查及git diff --check通过。agent-memory Skill Quality无failure，有约3054 token上下文预算warning，保留必要读写及维护边界，不以缩短规范换取过关。尚未重启真实服务加载新调度，需完成R2独立审查后进行空闲重启。

## Task Summary

**Memory 后台**：组件 [memory](../../bin/memory/) 增加周期维护调度和显式事件，复用队列审计记录游标；Agent主动复查相关旧知识，周期写入限定scope，删除前检查入链和pending。

**Memory Skill**：组件 [agent-memory](../../skills/meta/agent-memory/) 补充主动整理、周期维护、合并淘汰依据及异常处理规范。

**Memory 文档**：组件 [docs](../../docs/) 说明周期安排、费用、失败恢复及引用保护边界。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 使用已有队列事件作为游标和审计，无新服务或重复状态库；模型写入沿用现有CAS工具。 | 无已知实质缺口。 |
| 稳定性 | A | 隔离操作核验重复投递、冷却、失败和入链保护；真实模型合并案例有审计，语法检查通过。 | 未运行单元/项目测试套件；未知外部引用与外部并发不在全局原子保证内。 |
| 完整性 | A | 增量复查及周期路径实现，实际模型周期合并淘汰已观察，条件和来源保留。 | 真实daemon部署在审查后执行；一个样例不构成全量语义准确率保证，Skill上下文预算有warning。 |

## Target
- [x] T1: Memory Agent处理新信息时主动复查相关旧记忆，并依据证据更新、合并、提炼或逻辑删除，而非只新增。
- [x] T2: 支持定期复查跨批次的重复和失效记忆，无需用户逐条指示。
- [x] T3: 整理保留有效条件、例外、来源、可恢复历史与关联完整性，不因长期未使用或仅语义相似就删除或合并。

## Result

- T1: 增量系统提示和每批指令明确相关旧知识复查；真实周期模型样例完成存活chip更新和重复chip逻辑删除，回读保留来源与适用条件。
- T2: 隔离环境实际scheduler/queue演示首批8个、下一批3个，重复检查不重发，失败不自动重试，成功后冷却24小时；新daemon tick已接入每分钟调度，部署待审查后。
- T3: 实际入链保护返回MEMORY_REFERENCED；真实模型样例两次审计、保留source和项目范围，索引published/pending=false/missingReferences=0；未知外部引用和语义泛化准确率无全局保证。
- Review gate: Passed — 独立只读Reviewer d2e92b5e-c8ed-4e19-9afa-8aa3684fba36无确认问题或Target阻塞风险；报告round-01已保存，快照复核verified。真实daemon部署仍待最终核验。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 新增自动模型周期调度和删除保护，涉及后台自主数据维护及失败恢复。
- Snapshot: snapshot:tasks/artifacts/proactive-memory-maintenance/evidence/15bf9fe38db4e805c44b5a5a297e395b98d9e052a0be90283adbfa572cc98fb5.json#15bf9fe38db4e805c44b5a5a297e395b98d9e052a0be90283adbfa572cc98fb5
- Evidence: Execution Log 002-004及T1/T2/T3；实际组件隔离操作和真实模型样例，语法及Skill Quality检查。
- Task fingerprint: 0f96128b4e86bd493fba6007309b0292f9a70687d5ac85021716dbc62b3d6de2

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/proactive-memory-maintenance/reviews/round-01.md) | snapshot:tasks/artifacts/proactive-memory-maintenance/evidence/15bf9fe38db4e805c44b5a5a297e395b98d9e052a0be90283adbfa572cc98fb5.json#15bf9fe38db4e805c44b5a5a297e395b98d9e052a0be90283adbfa572cc98fb5 | no blocking findings | 2eac918805351a470e65bcd5d3e6ed06517106e4b94957957fd22760209082ae |

## Verification

- Passed: 独立审查后确认旧服务active=0，经restart/ifIdle保护启动pid11888。真实/api/status返回running=true、maintenanceErrors=[]、schedulerError=null，并具有新maintenanceErrors字段；队列已自动生成1条user及4条project周期事件，候选数1/4/1/8/8且messages均为空，2条running、3条queued，证明新daemon实际投递并执行；不宣称这些真实批次已完成。四份JS语法和git diff检查通过，六文件及round-01报告check-evidence均verified。Self Assessment仍适用：真实模型语义证据为隔离样例，不保证所有复杂语义；未运行测试套件，Skill上下文预算warning保留。
