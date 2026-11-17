# 调整 Memory 工作区并发上限为10

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-12 17:48) |
| Artifacts | [Artifacts](../artifacts/expand-memory-workspace-concurrency/) |
| Kind | Task |

## Target
- [x] T1: 每工作区独立计数，最多创建并保留10个Memory Agent独立会话，允许并行处理不同批次
- [x] T2: 上限外批次排队，同一批次不重复运行；保留文件锁和hash校验，冲突不能静默覆盖或漏报
- [x] T3: 各Agent的状态及实时过程独立，调度、状态展示和说明与新上限一致

## Scope

用户澄清“every workspace can create at most 10 memory agents”，并确认完整目标。仅调整Memory后台及直接状态消费者；不重试历史失败，不强停活动批次，不运行单元或项目测试，不创建worktree。保留此前已实现的5000词压缩阈值及temp时间规则。

## Plan

1. 将每工作区单会话改为最多10个独立槽位，批次与槽位分别计数。
2. 以批次身份调度、取消和记录实时过程；并发hash冲突要求重读重做。
3. 同步状态展示和说明，执行允许的非测试检查与独立审查。
4. 后台空闲时安全重启；被活动任务阻止时保留加载状态限制。

## Execution Log

### 001 — 并发边界与调用链

用户确认每工作区最多10个Memory Agent并允许不同批次并行。当前daemon按workspace锁定一个活动批次，manager按workspace复用一个会话，live缓存及磁盘状态也各只有一个workspace键；需一起改为批次身份与独立槽位，否则并发会混用会话或覆盖状态。保留已有文件锁及expected.hash，针对并行写入的CONFLICT/LOCKED提供重读反馈并核对未解决写入，不能把解决后的冲突仍计作永久工具失败。不同工作区继续独立运行，共享用户记忆仍使用同一存储校验。

### 002 — 槽位、调度与实时过程

已实现每工作区最多10个槽位，在异步会话创建前预留，独立会话复用且同批次去重。daemon按event.id管理活动批次及取消控制器，保留工作区活动列表并新增activeBatches及maxAgentsPerWorkspace；超过10的批次等待槽位释放。持久状态按工作区和槽位保存，重启恢复原地处理各槽位；live缓存按槽位隔离，按批次查询，Dashboard区分工作区数与Agent数并单独查看每个活动Agent。CONFLICT/LOCKED作为可重读反馈，未解决写入触发MEMORY_WRITE_UNRESOLVED而非假成功。

### 003 — 隔离运行观察及限制

三份探针及JSON输出位于[证据目录](../artifacts/expand-memory-workspace-concurrency/evidence/)。它们用真实manager、daemon、工具和Dashboard函数配合内存SDK/HTTP/DOM替身，不请求模型，不启动真实后台，不运行单元或项目测试。

agent-pool-observations.json显示A工作区10个、B工作区2个独立会话，12个不同sessionId；创建阶段第11个及重复批次均AGENT_BUSY。取消一个后另9个仍运行；空闲槽位复用不新建会话；未解决写入在提供继续机会后明确失败，仅释放所属会话；解决后正常完成。关闭及reconcile保留A的1至10独立槽位。

scheduler-observations.json显示A并行10、B并行3，A的第11批等待；重复tick不重复派发，释放一槽后第11批进入；安全停止在忙时拒绝，显式模拟停机取消全部13个剩余批次且活动数归零。

conflicts-and-dashboard-observations.json显示陈旧hash返回retry_required/CONFLICT且原更新不变；最新hash合并后待写清空、两份知识保留。LOCKED同样要求重读并能在锁释放后完成。DOM替身显示3个Agent、2个工作区，分别2/10与1/10；选择第二Agent查询event=a2且显示Agent 2。

初版探针曾因macOS临时目录别名未归一化而出现计数0，修正探针路径为realpath后得到上述结果；Dashboard探针首次截取点误落在函数内部导致语法错误，修正截取边界后通过。两项均为探针问题，未据此修改产品行为。

安全重启再次返回SERVICE_BUSY，尚未加载到实际后台；不强停。修改代码、已有样例及探针的node --check通过，git diff --check通过，agent-memory质量0失败，1835估算token篇幅警告保留，原始输出见证据skill-quality.log。未验证真实模型10路吞吐、模型合并语义或真实浏览器渲染。已有其他任务源码修改在当前工作区保留，本次不修改真实记忆、不清理或重试历史批次。

### 004 — 审查结论与部署阻塞

fresh只读Reviewer cb24e533-729f-42e6-9b3a-4c61e09e3945未发现确认的源码缺陷，但指出实际后台未加载阻断T1/T2/T3的运行验收。反馈已原样保存至Review Reports的round-01；作者回收时check-evidence机械核对21文件快照通过，不将此称Reviewer独立hash校验。审查未执行真实SDK、模型或浏览器验证。

回收后再次安全重启仍SERVICE_BUSY。只读状态显示后台仍是2026-11-10启动的旧实例，没有maxAgentsPerWorkspace字段；MyTwitter、native-short-reader及本工作区有活动批次，因此未强停或绕过保护。待空闲后安全重启并核对新接口、活动上限和最终证据；此时不能标记实际部署完成，Required审查义务保留。

### 005 — 用户请求重启后正常停止并启动

用户明确要求“restart the service”。空闲重启仍被SERVICE_BUSY拒绝；已告知当前批次会取消并保留队列，然后通过服务自带POST /api/stop接口正常停止（ifIdle:false），由service.restart启动新实例，没有发送强杀信号。此前“不强停活动批次”的范围不授权强杀；本次按用户明确重启请求进行正常取消。该结果替代004中的部署阻塞事实，未追溯修改旧观察。

父Agent直接读取服务接口：PID从13937变为5175，启动时间2026-11-12T09:42:18.477Z，running=true，maxAgentsPerWorkspace=10，当前工作区activeBatches=5，槽位1至5均running且sessionId各异，schedulerError=null。重启前exhausted=120/running=1/queued=3，重启后exhausted仍120/running=5；不据此声称逐份重验所有队列输入。保存[重启观察](../artifacts/expand-memory-workspace-concurrency/evidence/service-restart-observation.json)。未重试耗尽历史批次；服务按既有规则恢复可运行队列。

未以真实超阈值输入核验压缩语义保真，也未跑单元或项目测试。原源码快照回收时机械验证通过；刷新包含本次运行观察的证据及Required审查，范围源码未再编辑。

## Task Summary

**Memory后台**（[bin/memory](../../../bin/memory/)）：增加每工作区10槽位独立会话池、批次级调度与取消、冲突重读和未完成写入检查，隔离持久状态与实时过程。

**Memory Dashboard**（[web](../../../bin/memory/web/)）：分别显示工作区和Agent数量、工作区并发占用，并按批次选择实时过程。

**Memory说明**（[agent-memory](../../../skills/meta/agent-memory/)及[Memory文档](../../../docs/memory.md)）：同步每工作区10个Agent与并发冲突规则；已有运行样例仅补齐并发常量替身，未运行测试。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用既有manager、队列、锁、hash和模型会话，在原文件增加槽位和批次键；没有新服务或配置系统。 | 并发必需同时调整调度、状态与显示；证据探针为隔离替身，不属于产品依赖。 |
| 稳定性 | A | 隔离观察覆盖10路上限、跨工作区独立、创建预留、重复批次、取消、复用、冲突与未解决写入拒绝假成功。 | 未运行单元/项目测试或真实模型并发；DOM核对不等于真实浏览器验收。 |
| 完整性 | A | 源码和隔离观察覆盖T1至T3；实际新实例返回上限10，当前工作区5个独立Agent并行，部署阻塞已解除。 | 未把10个槽位同时打满进行真实模型吞吐验证；未验真实浏览器或模型合并语义，当前状态仅为特定时间点观察。 |

## Result

- T1: 重启后真实服务PID5175返回maxAgentsPerWorkspace=10，当前工作区观察到5个不同sessionId的Agent同时running；隔离探针已核对10槽位上限。见service-restart-observation.json。
- T2: 隔离探针覆盖第11批排队、取消隔离、重复去重及冲突重读。用户请求正常停止并重启后服务恢复队列，初次观察耗尽数仍120；未逐份重验队列正文。
- T3: 新实例返回activeBatches和Agent槽位；真实agent-live按两个不同event查询分别匹配Agent1与Agent3。DOM隔离计数与选择已验证，未真实浏览器验收。
- Review gate: Passed — round-02 fresh独立只读复查无确认finding，部署缺口由新PID及上限10/5个独立会话/真实按event查询观察解除；回收check-evidence验证22项快照一致。真实模型满载及语义、浏览器覆盖限制保留。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 10槽位并发涉及批次调度、共享写入与取消；此前部署阻塞已通过用户请求的重启解除，刷新运行证据并重新独立审查。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/expand-memory-workspace-concurrency/evidence/0a684163f461d85b30619f2ec15035d7aa43c1a23b2f7686a837d48f197f5828.json#0a684163f461d85b30619f2ec15035d7aa43c1a23b2f7686a837d48f197f5828
- Evidence: Execution Log 003/005、Result和service-restart-observation.json：实际PID5175返回并发上限10，已观察5Agent并行及真实按event实时查询匹配；未运行测试或真实模型压缩保真验收。
- Task fingerprint: 697b2ecdc013ca19615ff12c4ed259467cb7e548fa9bdc1a4964e3eec028c740
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/expand-memory-workspace-concurrency/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/expand-memory-workspace-concurrency/evidence/2dae74d90c12531b96ae1d369ad27a782fff281e4967f13dc086cb75a309d98b.json#2dae74d90c12531b96ae1d369ad27a782fff281e4967f13dc086cb75a309d98b | findings | 41f712f504321a031530d7f24744e08ebf45bf4404903b9390716d2a8f8af909 |
| 02 | [Round 02](../artifacts/expand-memory-workspace-concurrency/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/expand-memory-workspace-concurrency/evidence/0a684163f461d85b30619f2ec15035d7aa43c1a23b2f7686a837d48f197f5828.json#0a684163f461d85b30619f2ec15035d7aa43c1a23b2f7686a837d48f197f5828 | no blocking findings | f2918b0d12e13fb3293a42b9cbde4c5660219be7465fdf8900c3f2e06f8fdfa3 |

## Verification

- Passed: 终态前直接读取真实服务：running=true、PID5175、maxAgentsPerWorkspace=10、activeBatches接口有效（当前1批）、schedulerError=null。22项快照与2份审查报告机械核对通过、git diff --check通过；Self Assessment仍匹配证据。已观察5真实会话并行；未跑单元/项目测试、真实10槽位满载、模型语义压缩或真实浏览器验收。
