# Memory仅保留当前知识文件并移除历史恢复体系

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-09 18:52) |
| Artifacts | [Artifacts](../artifacts/memory-current-files-only/) |
| Kind | Task |

## Target
- [x] T1: Memory文件仅保留title、summary及带日期case正文，文件名作为身份，必要索引只描述当前有效知识。
- [x] T2: Memory不再保存来源、历史版本、审查记录、墓碑或恢复副本，移除历史浏览和恢复能力；读写、检索及界面适配当前内容模式。
- [x] T3: 清理当前skills项目的Memory内部历史及其历史来源、审查和恢复副本，保留全部当前有效知识，不把被移除资料转存到其他位置；不扩大删除用户级或其他项目数据。

## Scope

仅永久清理当前项目的Memory数据及其专属历史副本。用户级与其他项目旧库继续只读，不自动转换或删除；共享服务协调状态不作为知识历史。无推送，无单元测试或项目测试套件执行授权。

## Plan

1. 完成当前文件存储、索引、后台、CLI、Dashboard和宿主入口的一致适配。
2. 校验当前知识内容，转换当前项目并清理其Memory专属历史、来源和恢复副本。
3. 完成语法、实际文件与入口检查、独立审查和最终核验；不创建知识正文的证据副本。

## Execution Log

### 001 — 用户确认范围与旧服务停止

用户以yes接受当前内容模式及当前项目永久清理范围。已核对历史依赖贯穿存储、后台工具、索引、CLI与Dashboard。旧协议4服务最初存在活动维护，正式空闲停止接口两次拒绝后，在空闲边界成功停止；未中断活动批次。核心新实现已开始适配，实际Memory条目尚未转换或删除，其他入口仍需同步，尚未完成验证。

### 002 — 当前内容转换与知识校验

实现协议5及双作用域单一当前索引，旧库只读且显式分scope转换。转换初次因共享服务重新启动而在写入前拒绝；再次空闲停止后，实际转换成功。8份有效知识、88条case的title/summary/body逐项完全一致，转换前知识摘要为2c7b26e8e29c3bf6aee8dd7a5ceb843e94286fae3d386cae6b101aea4a4306fb。随后用hash条件写入纠正3个主题中13条因本次改造已过时的机制说明，其他case保留，仍为8份88条。当前根仅entries与index.md，预算全部满足。

### 003 — 项目历史副本清理

永久移除项目根的历史、提案、迁移备份、旧标记及墓碑。另清理3个Memory整理任务的专属历史附件、5处旧Context/Lessons与20份旧Memory导入草案/审查副本，共54个工作区文件；移除项目专属临时目录4文件。混合临时drafts/results各移除19个project记录、原样保留6个user记录，没有转存。首次清理在最后临时目录遇到macOS的/tmp父级符号链接而停止，前54文件已经删除；确认/private/tmp的同一实际目录后完成余项。未清理无关Task记录、其他项目及用户根。用户知识与内部旧库259文件的聚合hash持续为273af2fedc2ed974daedaede69199c428aac41b4bbdfd36dc253b4e4d1dc241f。未重写Git历史。

### 004 — 实际入口核验

19个JavaScript文件语法检查及git diff --check通过。Pi bridge通过已安装SDK的jiti加载；仓库直接require jiti不可用，改从已安装SDK依赖解析，没有安装软件。三个修改Skill质量检查无失败，agent-hooks保留2090估算token预算警告。未运行单元测试或项目测试套件，已更新两份相关测试定义但不宣称通过。

ego-browser实际打开当前Dashboard，展开本项目8条并读取正文，历史控件数量为0、详情无错误；三个页面可用。7个旧历史/提案/恢复HTTP入口均返回404，服务协议5，项目index为published、user为upgrade-required且不可写。后台现有耗尽队列未清理或重置；旧格式不可写的批次新增执行前检查，保持等待而不消耗模型尝试。检查未主动新增模型批次。最终服务再次重启以加载该检查，当前Pi进程仍需用户完整重启才能更新宿主缓存。

### 005 — 并发知识增量使首个快照失效

首个440文件快照在assessment时检测到project-identity内容漂移，尚未派发Reviewer。核对发现后台为另一项规则维护新增一条STE边界知识，保留该增量，当前为8主题89条case；它不是本任务创建的知识。已在空闲边界停止服务，更新当前校验与快照后再审查，不使用失效快照。该变化未生成历史或恢复副本。

### 006 — TR-1 调度阻塞修复

独立只读审查发现并经源码确认：只读scope的queued周期批次同时占住schedule的工作区资格与tick的seen标记。已移除工作区级周期批次挡板，保留现有按scope的去重；tick在占用工作区前跳过只读周期批次，processJob仍保留执行前可写性复核。等待输入和尝试计数不变，其他可写scope可生成与执行批次。新增隔离环境的回归定义覆盖旧user批次与新project调度、重复调度及等待输入保留；未执行。三份改动文件语法及git diff --check通过。静态复核既有project批次会越过旧user批次，仍保持同工作区串行。动态调度、模型与崩溃路径未运行，交由新独立审查核对该修复及全范围遗漏。

### 007 — TR-2 工作区异常隔离

第二轮独立审查确认TR-1已解决，并指出预检中的失效路径异常会退出整个tick。主Agent确认该路径后，将可写性预检改为逐项捕获；错误按工作区汇总到现有schedulerError状态，继续扫描，未改等待事件或尝试计数。新增实际daemon入口的隔离回归定义，以替身I/O和模型入口覆盖失效工作区在前、同工作区旧user与健康project在后、重复tick及诊断输出，未执行测试。daemon和回归定义语法通过；当前8主题90条case，index published且格式预算通过。当前8份正文hash与第二轮快照一致；此前89条统计已过时，保留全部并发增量，未回退内容。

### 008 — TR-3/4 双作用域入口与当前知识核对

第三轮确认TR-1/2已解决。TR-3经源码复核成立，agent_settled现按ensureWorkspace返回的两级可写状态入队，不再要求project可写或以项目索引代替双scope判断；两级均不可写才跳过，实际写入仍由后台限定。新增桥接回归定义，覆盖user/project四种可写组合、持久队列与游标，并登记Pi测试入口，未执行。桥接通过已安装SDK的jiti实际加载，两个测试文件语法及差异检查通过。

TR-4在准备条件修正时检测到case已经变化，因此未写入；回读确认后台已把该case纠正为当前索引元数据，不再使用旧格式标记，保留定向Hook与入队不等于处理完成的条件。主Agent核对当前源码、正文及索引，当前8主题90条格式、预算与published索引均有效。未备份或回退后台修正。相邻入口与当前8主题检索未发现其他相同旧激活判断；非Memory的Task恢复说明不在删除范围。

### 009 — TR-5 审查附件正文清理

第四轮确认TR-1—4解决，并发现前三轮错误地把output-0.log整份工具转录当作最终反馈登记，确实重新保存了知识正文。现从各原始子代理session的最后一条最终assistant文本提取反馈，仅保留正式报告header、原run/snapshot/fingerprint及原样最终结论。已有报告机制没有历史报告修订入口；本次依用户永久清理授权，在正式工作区锁内覆写本任务01—03报告并仅更新对应登记SHA256，没有保留原转录副本或改变审查结论。正式verifyReports验证4份报告通过；第04轮通过recordReviewReport正式入口直接传入最终反馈，未再传入日志。

本任务9份附件逐文件扫描未发现带日期知识条目、title/summary正文标记或已废止激活语句。修正后的01—04报告一并纳入新审查快照。只处理本任务导出的报告，不改无关任务、Git历史或用户级宿主原生会话记录。后续报告同样只从最终assistant文本登记，不使用output日志作为反馈。

## Task Summary

**Memory运行时**：[bin/memory](../../../bin/memory/)改为当前文件、完整hash条件写入及单索引，永久删除替代墓碑，移除来源审计、历史、提案、恢复接口和界面；旧格式库只读，显式按scope转换。

**宿主与契约**：[Pi集成](../../../pi/lib/)、[Agent Hooks](../../../skills/meta/agent-hooks/)、[Memory技能](../../../skills/meta/agent-memory/)与[迁移技能](../../../skills/meta/agent-migration/)同步当前内容模式、作用域边界及重启要求；[说明文档](../../../docs/memory.md)与[测试定义](../../../tests/)同步新契约。

**本项目Memory数据**：[当前知识](../../memory/)移除旧元数据及历史副本，保留8个宽主题及原88条case，更新已过时的运行机制说明，并保留并发后台新增的2条有效知识；清理相关专属历史附件和迁移源副本。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性（Simplicity） | A | 存储仅当前正文与一个索引，删除历史模块及跨层恢复链；实际根目录只有entries和index.md。 | 为未授权旧库保留只读解析；共享服务仍保留必要队列状态。 |
| 稳定性（Stability） | A | 真实转换逐项保真、3次hash条件更新回读、用户259文件hash不变；实际页面/API、19项语法与TS模块加载检查通过。TR-1—4另经语法、桥接加载、静态路径及当前知识回读复核。 | 未运行单元测试、项目套件或模型行为实验；崩溃/并发未动态演练，当前Pi需完整重启。 |
| 完整性（Completeness） | A | 当前格式、后台、CLI、索引、页面、宿主契约与项目专属历史清理均已处理；当前8主题90条含并发增量；4份审查报告仅保留原最终反馈并通过正式校验，逐Target证据见Result。 | 用户级及其他项目旧库按范围保留只读，Git历史未重写；独立审查和最终内容复核仍需完成。 |

## Result

- T2: 已移除历史/提案/恢复CLI及HTTP和UI；ego-browser正文可读、历史控件0，7个旧接口均404，协议5；19个JS语法和TS桥接加载通过，3个Skill无质量失败。旧scope只读，未运行测试套件或模型实验；当前Pi需完整重启。
- T3: 当前Memory根仅entries/index.md；清理54个项目历史附件/旧Context/Lessons/导入副本、4个项目临时文件及2个混合JSON中各19条project记录，未转存。user 259文件聚合SHA256保持273af2fedc2ed974daedaede69199c428aac41b4bbdfd36dc253b4e4d1dc241f；混合文件6条user各保留。未删除其他项目或无关Task，未重写Git历史。
- T1: 真实转换8份88条case的title/summary/body逐项一致；3主题13条旧机制按新实现纠正；随后保留后台并发新增2条有效知识。当前8份90条，只有title/summary字段及case正文，index published，20片/1000词预算通过。
- Review gate: Passed — 独立fresh/read-only第05轮确认TR-1—5全部resolved且无阻塞发现；结束快照及前4份报告机械检查通过，第05轮只登记最终反馈。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 当前知识跨层变更与永久清理；TR-5审查转录清理纳入最终范围。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-current-files-only/evidence/963145a808a0ed8257adfc4afec1dff30deea13ee4297eb96b3b68e756c56044.json#963145a808a0ed8257adfc4afec1dff30deea13ee4297eb96b3b68e756c56044
- Evidence: Result、Self Assessment及Execution Log 002—009；4份最终反馈正式校验、9份附件正文标记扫描通过，前述源码/页面/格式检查仍适用，未运行测试。
- Task fingerprint: 955f3172ee22e49dd3aaca10bd9ee82653b8769442b6867e7ee78de2bb94ffe4
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-current-files-only/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-current-files-only/evidence/48619e3a156cbf538e53a2f2b979175198978f24b3fb10cdd1c77346a6044357.json#48619e3a156cbf538e53a2f2b979175198978f24b3fb10cdd1c77346a6044357 | findings | 257e81de79af36f38f785ed9e3f57ff7bd4f92414d7c8ca64e8de5aaea5fe84a |
| 02 | [Round 02](../artifacts/memory-current-files-only/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-current-files-only/evidence/49924895c75d3fadc8919c78146558f35171068f38fa80cdccecb9356c34b814.json#49924895c75d3fadc8919c78146558f35171068f38fa80cdccecb9356c34b814 | findings | b47979c5cde971f2ef9fd7de4676e9d193207d857f549cff59147cbb82110f40 |
| 03 | [Round 03](../artifacts/memory-current-files-only/reviews/round-03.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-current-files-only/evidence/47c7590e1f6d56932b79310c866b15600cc3e9924bc85f9b6237617db2ea048f.json#47c7590e1f6d56932b79310c866b15600cc3e9924bc85f9b6237617db2ea048f | findings | 8158d701bedc0a66bae5bb5349cf13b21ab067b1b52a4c14f1fb4d2585ffd129 |
| 04 | [Round 04](../artifacts/memory-current-files-only/reviews/round-04.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-current-files-only/evidence/871d57e7aa8d837da2593cddf1319aa36ca7a765656699ee195346ed59c56217.json#871d57e7aa8d837da2593cddf1319aa36ca7a765656699ee195346ed59c56217 | findings | 506694fe1faa1e00ebeed52893ba2c256e3cc093dbe7dbdf98aed37f0df78d42 |
| 05 | [Round 05](../artifacts/memory-current-files-only/reviews/round-05.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-current-files-only/evidence/963145a808a0ed8257adfc4afec1dff30deea13ee4297eb96b3b68e756c56044.json#963145a808a0ed8257adfc4afec1dff30deea13ee4297eb96b3b68e756c56044 | no blocking findings | 7d2162939f449db9613d390e68072342c105847d90519add2fe0c52912268515 |

## Verification

- Passed: 第05轮独立审查无阻塞，TR-1—5全部解决；447项快照结束校验通过。最终8主题90条格式/预算合规、index published且根仅entries/index.md；33个退休路径及项目临时目录仍不存在，两个混合JSON各保留6条user且project为0，5份报告无知识正文标记。用户scope只读。后台已重新启动，PID95867、协议5、空闲且schedulerError为null。自评依据与等级复核维持；测试/模型/崩溃实验未运行，前台Pi仍需完整重启。
