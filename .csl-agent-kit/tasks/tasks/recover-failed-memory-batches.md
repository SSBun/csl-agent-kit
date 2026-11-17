# 恢复失败Memory批次并清理非法旧记录

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-12 18:55) |
| Artifacts | [Artifacts](../artifacts/recover-failed-memory-batches/) |
| Kind | Task |

## Target
- [x] T1: 逐一核对当前所有失败Memory后台批次，将有效批次恢复处理，清理经核实不合法的旧批次，明确未能恢复的阻塞原因
- [x] T2: 保留有效记忆与已写入内容，不重复执行已完成批次，不删除正常Task记录或干扰活动批次

## Scope

用户要求恢复全部失败Memory后台批次，或清理不合法旧Memory批次，并确认完整目标。本次处理开始时的全局失败队列，涵盖全部工作区；不删除有效记忆、普通Task、活动批次或未核实无效的输入，不自动升级旧库。不是修改全局重试策略，也不无限重复失败批次。

## Plan

1. 固定最终完成凭据、接续映射及恢复操作证据，核对120个原逻辑批次。
2. 独立只读审查恢复与清理边界，处理确认问题。
3. 复核实际队列与凭据，记录最终验收。

## Execution Log

### 001 — 失败队列盘点

2026-11-12T09:58:26.527Z盘点全局Memory队列：120条均exhausted、尝试2次，来自8个工作区；schema均csl-memory-event/v1。逐条用实际队列校验器在只读VM中校验，重算ID与规范化payloadHash，检查完成凭据：没有输入非法、身份不匹配或已有完成凭据的记录。项目库preview均current，用户库current且3文件，不需要升级。旧UPGRADE_REQUIRED是历史错误，不代表当前不可写。服务PID5175、每工作区上限10，盘点时activeBatches=0、schedulerError=null。

元数据清单见[inventory.json](../artifacts/recover-failed-memory-batches/evidence/inventory.json)，不保存会话正文副本。历史错误分布：TOOL_FAILED 89、MEMORY_BUDGET_UNRESOLVED 19、UPGRADE_REQUIRED 5、MODEL_TIMEOUT 4、MODEL_FAILED 3。没有足够依据删除任何旧记录；合法但缺消息时间的旧输入不能新写temp，不把它认定为垃圾。

### 002 — 恢复方法

用户已确认恢复有效失败批次。对本清单做一次性恢复：保持event.id、eventKey、payload、effects及现有去重凭据不变；逐条获取job锁和event锁后，重新校验原始文件hash、当前非活动状态及完成凭据，仅将符合条件的exhausted批次状态改回queued并重置本轮attempts=0。普通队列每轮最多2次、每次5分钟规则不变。恢复前再次扫描当前文件，对effects可定位的ID/hash核对当前条目；旧transaction型effects只作为已有写入提示，不能据此冒称已完整恢复或无写入。后台按既有协议重新读取完整记忆与最新hash，不重放旧磁盘内容。

### 003 — 旧工作区别名与首轮恢复范围

只读预检查112条可直接恢复，8条需额外处理：它们使用/Users/caishilin/Desktop/personal/skills，当前该目录是指向/Users/caishilin/Desktop/personal/csl-agent-kit的符号链接。输入与旧ID/payload本身一致，但已不符合当前队列按真实工作区路径计算身份的规则；不能在错误工作区键下直接重试，也不能因此丢弃其有效输入。先恢复其余112条，另核对8条的规范化目标身份、是否已存在相同输入的完成凭据，准备以有效规范身份接续后再清理旧别名记录，不强行改写原ID或重复投递。

首轮effects检查（112条）：共251条效果记录，其中229条为无法按当前文件定位的旧transaction形态，7条hash仍匹配，15条内容已变或已删除。无法定位不等于未写入；恢复必须由Agent重读当前知识，不据这些计数宣称完整语义保真。

### 004 — 112条恢复与8条规范接续

一次性恢复已在锁内完成112条，逐条验证输入文件hash及effects摘要不变；8条旧别名记录原样保留。10:06:41Z后台已自然处理部分批次，当前全局queued=28、running=26、exhausted=8，schedulerError=null；先前曾观察46个批次跨工作区运行，各实际工作区不超过10。此数量是观察时点，不等于所有恢复已成功。

8条旧别名经预检查均可接续：规范工作区与旧别名的实际Memory根完全相同，8个规范目标ID互不重复且目前均不存在。恢复脚本准备在源job/event锁与目标job锁内调用正常queue.enqueue，将原session、eventKey、task、messages、消息时间、maintenance及effects保留到规范目标，核对规范payloadHash、输入与effects后才移除旧别名event/job。旧输入不另行备份、不复制到Task附件，元数据映射见alias-plan.json。全部接续成功且旧别名无剩余event后，移除其过时工作区登记，防止周期维护继续使用旧工作区键触发EVENT_CONFLICT。不会把新目标入队冒称模型处理成功。

### 005 — 规范接续完成与进度

10:09:28Z完成8条旧别名输入的规范接续；入队后逐条核对payload、原始messages和effects，再删除8对旧event/job记录，最后移除唯一旧工作区登记。旧、新Memory根实际一致，没有直接改写记忆正文。后续10:10:56Z核对：原120条中85条completed、18条queued、15条running、2条再次exhausted，完整性错误0；旧登记不存在、maintenanceErrors=[]，旧别名事件冲突消失。

10:14:09Z进一步核对92条completed、15条queued、10条running、3条exhausted。重失败原因：已迁移的Task旧路径ENOENT、temp日期超出原批消息日期，以及5分钟MODEL_TIMEOUT。它们都是有效输入，不作为非法垃圾删除。

### 006 — 已核实上下文的有界恢复

ENOENT的目标文件已确认位于native-short-reader/.csl-agent-kit/tasks/artifacts/reader-common-next-risk-report/reports/reader-common-next-navigation-risk.md。temp失败批次原消息均为2026-11-10，不能用当前处理日改写其他日期case；超时批次仅4条短消息且无effects，可先核对已有知识是否已覆盖，允许零修改结束。

准备3条有界的上下文恢复事件：完整保留原消息及原始时间，额外增加一条无at的assistant运维说明，不把说明或恢复过程当知识，不发明消息日期或用户事实。新eventKey由原ID和说明hash确定，正常enqueue去重；旧失败输入暂保留。只有新恢复事件取得匹配完整payloadHash的成功凭据，且能由仍保留的原消息重建相同恢复payload，才通过queue.complete为原输入登记完成并释放旧运行状态；不得仅因新事件入队就标完成。三项计划见context-recovery-plan.json，未更改全局模型、五分钟期限或两次尝试规则。

### 007 — 3条上下文恢复成功与逐条续处理

10:19:19Z三条上下文恢复均取得匹配计划payload的完成凭据。用仍保留的原消息及运维说明重建payload，核对成功后才通过queue.complete完成原批次，原消息没有修改。此时原120条为102 completed、10 running、2 queued、6 exhausted。后续10:23:18Z为110 completed、2 running、8 exhausted；未出现输入或别名接续完整性错误，旧登记未复生，schedulerError及maintenanceErrors均为空。

剩余8个再次失败批次均来自MyTwitter：6个超时、1个temp日期违规、1个并发写入未解决，均为合法会话输入。为每个原ID最多准备一个确定性恢复事件，保留原消息/日期/当前知识，说明只核对相关主题、已覆盖可零修改、不得回滚较新知识、不得执行发帖等前台任务。待该工作区现有可运行批次清空后逐个入队，既有10槽位上限不变；同工作区只增加一个恢复事件，避免再次批量争用。未把这些记录删除或直接标成功。

### 008 — 全部恢复完成与最终自检

原第一轮最后一个MyTwitter批次也发生超时，因此在不重复准备既有源ID的前提下，最终形成12条有界上下文恢复计划（最初3条及后续MyTwitter 9条）。各源ID最多对应一个确定性恢复事件；后9条在工作区空闲时逐条处理。只有目标成功凭据、重建payload及原输入身份全部匹配，才登记源输入完成。

10:42:45Z按规范化映射核对原120个逻辑批次：全部completed且已正常释放输入；108条无需补充上下文完成，12条由验证成功的上下文恢复接续。8条旧别名原输入已完整接续，旧event/job各8份及1个过时工作区登记已清理。final-audit.json逐项记录120个完成凭据、8个映射及12对上下文恢复证明，errors=[]。不将旧别名原ID误称仍有完成凭据；其完成结果按8个规范目标ID核对。

10:45:24Z再次直接核对：events=0、jobs=0，服务PID5175运行，maxAgentsPerWorkspace=10，activeBatches=0、counts={}、schedulerError=null、maintenanceErrors=[]。所有恢复脚本通过node --check；19份JSON及491条操作日志可解析，git diff --check通过。与已完成并发任务快照相比，11份相关产品/规则文件字节未变，正常MAX_ATTEMPTS仍为2，没有修改全局策略或重启服务。未运行单元或项目测试。

本Task未直接覆盖真实记忆正文，原会话正文未复制到Task附件或备份；后台按正常Memory writer处理。成功依据完整输入/日期保留检查、真实队列完成凭据和有限操作审计；没有逐条语义审计所有模型提炼的知识，不宣称未来永不再失败。

## Task Summary

**Memory运行状态**（[全局运行目录](/Users/caishilin/.csl-agent-kit/memory/.service/)）：恢复120个逻辑失败批次，规范接续8条旧别名输入，清理旧运行记录及1个过时工作区登记；产品源码与正常重试策略不变。

**本次恢复工具及证据**（[证据目录](../artifacts/recover-failed-memory-batches/evidence/)）：保留不含原会话正文的受控恢复脚本、身份清单、操作日志、规范映射及完成凭据核对，支持独立审查与中断后核实当前状态。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用正常队列、文件锁、hash、writer及完成凭据，仅以一次性脚本处理固定集合和少量已核实恢复说明；无新服务或全局策略。 | 需要区分普通恢复、别名接续与上下文恢复；脚本仅为本次受控集合，不应盲目用于其他事件。 |
| 稳定性 | A | 复查输入/job身份、effects保留及完整目标payload后才迁移或完成；最终120条均有正常完成结果，12对上下文凭据匹配，无孤立event/job。 | 未逐条语义审计模型对记忆的提炼；旧输入正常释放后不再保留正文副本，不能冒称能重放原文保真审计。 |
| 完整性 | A | final-audit覆盖120条，8个旧别名已接续并清理，当前无失败或待处理批次，服务及调度状态正常。 | 最终数量为观察时点；未来新会话或维护仍可能产生新失败，未运行单元或项目测试。 |

## Result

- T1: final-audit.json核对初始120个逻辑批次全部完成（含8个规范别名映射及12对上下文恢复凭据），无受阻记录；旧event/job各8份和1个过时登记已清理，runtime-final-check确认events/jobs均0。
- T2: 固定输入及job hash、job/event锁、effects摘要检查与完整payload成功凭据保护已执行；未复制原会话正文备份、未改普通Task或产品源码；全局正常2次尝试/5分钟/10Agent策略保留。未逐条语义审计模型记忆合并。
- Review gate: Passed — fresh只读Reviewer无确认finding，并直接抽样核对普通/规范/上下文完成凭据；回收40项快照机械核对通过。新出现的运行批次晚于固定120条，不属恢复遗漏；模型语义与持续状态限制保留。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 全局失败队列恢复包含一次性重新开放尝试、跨旧工作区别名的输入接续与清理、以成功派生事件核验后完成原输入，涉及持久运行数据和去重边界，需要独立审查。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence/41738bd51e9cbe85dddca55a5736f38afba3067069c5fa66b2cf045cd4d7fb82.json#41738bd51e9cbe85dddca55a5736f38afba3067069c5fa66b2cf045cd4d7fb82
- Evidence: Execution Log 001-008、T1/T2 Result、final-audit.json和runtime-final-check.json：120逻辑批次完成，8别名映射、12对上下文凭据验证，events/jobs0，正常策略文件未改。未逐条语义审计模型知识，未运行单元/项目测试。
- Task fingerprint: c1e236347e5c28340da977d09e2d20896534423ebd6030e189d15de05c388f3d

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/recover-failed-memory-batches/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence/41738bd51e9cbe85dddca55a5736f38afba3067069c5fa66b2cf045cd4d7fb82.json#41738bd51e9cbe85dddca55a5736f38afba3067069c5fa66b2cf045cd4d7fb82 | no blocking findings | 73bd75468ee40c586f70e42f9d6c1a7bfe2a6bb3c59eb5629bca53c440b13155 |

## Verification

- Passed: 10:54:07Z直接只读重核原120条规范映射后的完成凭据及12对上下文成功凭据，均匹配冻结清单；8对旧别名运行文件及旧登记仍不存在。40项快照和审查报告机械核对、git diff --check通过。当前服务PID5175，另有1个晚于本集合的新批次运行，无failed/exhausted、schedulerError=null、maintenanceErrors=[]。Self Assessment仍适用；未运行测试或逐条语义审计记忆。
