# 实现召回优先的 Memory 索引架构

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 17:23) |
| Artifacts | [Artifacts](../artifacts/implement-recall-first-memory-index/) |
| Kind | Task |

## Scope

用户对完整实施Target明确回复yes。以已完成并经独立复审的召回优先架构稿为实施依据，保留当前工作区其他任务改动。不提交或发布，不删除原始知识，不运行未经当前请求明确授权的测试套件或新模型实验。先在隔离数据上完成允许的确定性检查，确认版本门禁后才考虑真实升级。

## Decisions

- 设计来源：[召回优先架构](../artifacts/design-recall-first-memory-index/specs/2026-11-03-recall-first-memory-architecture.md)。本任务不修改该已完成设计任务或既有正式Topic。
- 继续复用现有Memory实现，不重建平行系统。芯片沿用entry身份，检索元数据随正文CAS提交，卡片/导航确定性派生。
- 正文hash不能代替反向关系generation。所有候选采信前复查代际与pending，未知/不完整时不能宣称不存在或沿用失效结论。
- 不自动重试模型、不过度承诺语义零遗漏；质量提升仍需另外授权的实验。

## Plan

1. 保存当前Memory相关源码基线，核对当前schema、事务、迁移、服务与消费入口。
2. 实现retrieval字段与关系校验、完整卡片和主题代际编译及健康信息，保留现有只读与审计能力。
3. 实现可恢复格式升级和旧服务/旧writer保护，接通恢复、重建及墓碑/替代关系边界。
4. 同步后台Prompt、Pi/bootstrap、CLI/Web与agent-memory规范及相关测试源码，不执行未授权测试。
5. 运行允许的语法/类型/包质量和隔离数据观察，逐Target自检；完成R2独立审查、修正与最终验证。无法验证的真实升级边界不冒称完成。

## Execution Log

### 001 — 获准实施与基线恢复

用户确认完整实施Target。当前工作区已有大量Memory实现及其他任务改动，新任务只改所属范围；发现另有characters运行时修复记录，当前源码已导出characters，不能以旧代码覆盖。本轮先保存原始源码再最小修改，真实两级Memory保持原状。

### 002 — 派生索引编译模块与共享运行时边界

新增bin/memory/recall-index.js，暂未接入store或改变现有schema。模块纯编译，无文件写入/模型调用：校验aliases/situations/topics/typed links，生成完整卡片、动态父子主题、多入口、反向supersedes、健康计数、manifest和预算内总览；缺失引用显式诊断，不生成失效链接；无语义线索和主题的有效entry仍生成基础卡片。关系循环用显式栈检查，主题排序使用不依赖locale的比较。

语法检查通过；对真实项目当前52条有效entry做只读编译预览，返回52张基础卡片、52条未分类、0主题/0关系诊断，总览1009字符。没有发布生成物或改任何记忆文件；这只证明当前无retrieval资料可被完整投影，不证明新schema写入、关系复杂路径或召回率通过。git diff --check通过，未运行测试套件。

只读service status显示旧protocol=2共享daemon仍运行，服务多个工作区；当次active为空，completed=76。为了避免半升级消费者与旧写入者并存，尚未修改存储/服务协议或自动迁移入口。接入新协议与真实升级前需确认共享服务的空闲重启窗口：保留持久队列与知识，不终止前台Agent，不中断正在运行的维护批次。未擅自停止或重启该共享进程。代码基线保存于本任务evidence/baseline；待授权后继续存储与版本门禁接入，所有T1—T4仍未完成。

### 003 — 存储、迁移与消费者接通

用户确认共享服务空闲重启及兼容升级授权。store升级为entry v2，保持v1历史/转换读取；retrieval与正文同事务写入，关系校验在准备审计前，完整卡片/主题/manifest先落盘再发布总览。旧writer永久隔离标记与v3进程锁分离；recover只回收可证明死亡的进程锁。migration v3保留正文原字节与墓碑，转换审计可对账续做，批量转换延后派生发布避免每条落盘整库副本。

已同步Memory Agent职责提示、agent-memory读写规范、Pi bridge与bootstrap、service/daemon协议、CLI index-status和Web索引状态；文档与相关测试源码同步，未执行测试套件。源码基线在evidence/baseline，当前未修改不相关任务或已有Topic规范。

### 004 — 真实升级及当前自检

详见[运行观察](../artifacts/implement-recall-first-memory-index/evidence/runtime-observations.md)。隔离CLI实际完成旧v2转换、幂等复用、旧writer/旧recover拒绝、反向替代而旧正文不变、环拒绝、pending审计恢复与已提交转换登记恢复；临时API和Chrome DOM显示新索引状态，无页面错误。未执行模型实验或测试套件。

在共享服务active=[]、无queued/running、completed=88的窗口重启到protocol=3，随后真实user转换1条、当前project转换52条，导入数均为0，转换审计正文原字节差异均为空。两级实际重建manifest文件hash核对通过，chip/manifest/card数量分别一致为1/52，pending=false；保留原知识、备份与审计。重载最新代码后服务running=true、protocol=3、completed=88、无schedulerError。没有停止前台会话。

主Agent逐Target核对：T1由recall-index及真实集合/manifest核对支持；T2由Skill、Prompt、Pi/bootstrap消费协议与关系反例观察支持，但未新开Pi会话验证所有前台缓存，需/reload生效；T3由隔离恢复/旧writer拒绝及真实保真转换支持，未遍历全部崩溃/并发排列；T4由静态检查、CLI/API/Chrome/bootstrap观察及下述独立审查门禁支持。所有修改JS语法、Pi tsc、diff检查通过；两个改动Skill包0失败，2668/1923 token预算警告保留。R2实现复杂度要求fresh独立只读审查，当前不宣称审查已通过。

### 005 — TR-1批准入口修复与运行态限制

独立Reviewer指出批准提案固定preserveLegacy=true，原代码因此跳过新增引用存在性检查。主Agent确认调用链成立，已分离预算保真与精确历史引用恢复标志；批准仍保留历史预算例外，但必须校验当前两级目标。精确历史恢复使用独立restoreHistoricalReferences，并保留卡片失效诊断。新增三组测试源码覆盖不存在/批准前删除、有效跨scope及历史恢复；未运行测试套件。

隔离正式CLI/API实际观察中，两种目标缺失批准均REFERENCE_NOT_FOUND，提案pending、正文未创建、审计计数不变、无pending事务。store/测试语法、diff及Skill质量检查通过，后者警告2743tokens。已在共享服务空闲时重载修正代码，原始round-01反馈保留；TR-1有实质修复，待fresh复核。

另观察到首轮审查期间真实后台有一次MODEL_FAILED批次（attempts=1），两级审计未发现对应事件事务，底层错误细节未保留且daemon日志为空。当前completed=88、failed=1，服务本身仍运行且无schedulerError。未自动重试，未宣称维护成功或推断原因；该事件阻挡当前workspace后续维护，须显式retry。详见运行观察，作为运行态限制一并交给复审，不掩盖该缺口。

### 006 — TR-1解决，TR-2运行态阻塞

第二次fresh独立复审确认TR-1 resolved，无已证实新代码问题；新增TR-2为Target阻断的运行态证据缺口，不推断模型失败原因。主Agent复查服务仍running/protocol3、active=[]、schedulerError=null，当前89 completed、1 failed、1 queued；失败仍阻挡当前workspace后续维护。原始round-02反馈已保存。未清除失败、未显式retry、未发起新的恢复模型调用。

完成仍需恢复失败批次并保留正常维护结果，再刷新快照、证据和fresh复审。当前请求没有给予失败调用的重试授权，下一步向用户请求一次明确重试；成功后按既有队列协议会继续积压维护，若再次失败则停止，不自动再次重试。稳定性和完整性因关键运行证据不足降为B，不将进程在线等同于维护恢复。

### 007 — 一次授权重试后维护恢复

用户明确yes允许补充诊断并显式重试该批次一次，成功后恢复正常积压维护，再次失败即停。已补充SDK errorMessage的有界错误摘要（常见凭据遮盖，不读完整消息/思考），通过语法及diff检查。重试前再次核对两级审计无该事件事务、原attempts=1；共享服务空闲重载后只执行一次显式retry。

原事件现completed、attempts=2，实际提交project事务36cccfca-1dac-4921-8857-ee75f9c40673，审计committed、source及afterHash一致；既有chip更新包含aliases/situations/topic。后续被阻挡事件正常completed、attempts=1、effects=[]，复用同一Memory Agent会话。当前服务protocol3、running、91 completed，无failed/queued/active及schedulerError。没有启动召回评测或测试套件，也没有第二次重试。

两级manifest全部文件及chip身份重新核对：user 1/1/1、project 52/52/52，missingFiles/hashMismatches为0、pending=false，观察前后代际稳定。project 51条基础卡片和2个主题节点；索引/维护恢复有实证，但原失败根因无法追溯，不声称修复了未知原因。详见runtime-observations TR-2段。当前自评基于恢复证据重新为A；TR-2保持待fresh复核状态。

### 008 — TR-2解决，TR-3前台升级指引修正

第三轮fresh复审确认TR-1/TR-2 resolved，新增TR-3：/reload只清扩展缓存，bridge刷新store但可能保留旧migration/service的原生缓存。主Agent核对基线及已安装SDK源码确认，采用Reviewer提出的最小可靠方案：本次不支持跨版本热更新，升级前已加载Memory的Pi必须完整退出并重启进程，再恢复会话。此前日志/Result关于仅/reload的建议被本条取代。

已同步docs、Skill及bridge版本错误提示，没有扩展缓存清理机制，也没有关闭用户前台。新Node进程实际加载store3/migration3并访问protocol3服务、两级published/pending=false；当前93 completed、无failed/queued/active。这不是完整Pi UI会话验证。Pi tsc、diff及Skill质量门通过，最新预算警告2849tokens。TR-3修正及边界待fresh复核。

### 009 — 最终独立复审与运行态核对

第四轮fresh独立Reviewer覆盖16个冻结文件，Findings none，确认TR-1/2/3全部resolved；TR-3限定为明确完整Pi进程重启的交付方案，不宣称热更新或用户已重启。主Agent随后实际调用verifySnapshot核对397520067e3ac7a584c7860c96c197e26d62d3c29d204b95b2d0a9b9c43e59e9的16文件字节，结果通过。

等待当时正在运行的正常维护批次结束（未重试）后，服务running=true、protocol3、94 completed、active=[]，无failed/queued/running及schedulerError。再次核对两级当前manifest每个文件hash与全部有效chip身份，user 1/1/1、project 52/52/52，mismatches=0、pending=false、检查前后generation稳定、published。Self Assessment按最终证据复核仍为A；完整Pi UI升级、测试套件、全部故障排列及语义召回效果未验证，首次模型错误根因未知，限制保留。

## Task Summary

**存储与索引**：新增recall-index编译器；store增加retrieval/关系、卡片主题代际、健康状态、旧writer隔离及可恢复schema转换，保留正文权威和条件写入。

**迁移与服务**：v3迁移保真升级现有条目并恢复漏登记效果；service/daemon协议升级，空闲重启及索引状态API接通，真实两级转换与派生核对完成。

**读取与维护入口**：Pi/bootstrap、Memory Agent、Skill及CLI/Web同步薄总览、全卡片发现、关系新鲜度和降级规则；保留dashboard命令。

**文档与验证**：使用文档、测试源码和任务证据更新；仅运行允许的静态检查与隔离实际操作，没有执行单元/项目测试或新模型评测。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用Markdown、原事务和SDK，纯编译派生入口，无新数据库/检索服务。 | 完整代际重建与历史保留有磁盘成本，未做规模性能保证。 |
| 稳定性 | A | CAS、隔离、反向关系、两类恢复、保真转换有观察；一次授权retry及后续正常批次成功，当前无失败/排队，源码静态门通过。 | 未跑测试套件、未遍历全部并发窗口；前台旧模块必须完整退出并重启Pi进程，未验证完整Pi UI会话。首次模型失败根因未知，本次恢复不证明未知根因已修复。 |
| 完整性 | A | T1—T4实现及允许验证覆盖，53条集合/hash最新核对，真实后台维护恢复证据与限制齐备。 | 多数既有卡片仍是基础线索，未证明困难语义召回或所有宿主路径；TR-1/TR-2/TR-3均已独立确认解决；完整Pi进程重启仍是用户交付激活步骤，不宣称用户前台已恢复。 |

## Target
- [x] T1: 按新版架构实现chip权威正文、完整检索卡片库、动态多入口主题索引和薄总览，所有有效chip均可发现，包括未分类与待增强记录。
- [x] T2: 接通普通文件工具检索、正文与反向关系代际复查、覆盖检查及失败降级，保留两级作用域与后台自动维护。
- [x] T3: 实现可恢复、幂等的格式迁移和派生发布，保留现有知识、来源、审计及条件写入，防止旧writer破坏新格式。
- [x] T4: 同步CLI/Web、Pi与Skill消费契约，完成授权范围内验证和独立审查；不以实现存在声称召回性能已改善。

## Result

- T1: recall-index.js及store生成完整卡片/主题/薄总览；真实user/project的chip、manifest、cards分别为1/52且文件hash无差异；未分类基础条目全部覆盖。
- T3: 隔离旧v2升级保真、重复升级current，旧writer写入和recover均LOCKED；pending事务和漏登记转换效果经正式CLI恢复且revision不重复增加。空闲共享服务切换protocol3后真实1+52条转换，正文byteMismatches为空、备份审计保留。
- T2: 双路径检索/正文条件/代际复查契约及反向替代观察成立；授权retry后实际维护审计与后续队列成功。旧前台缓存不承诺/reload热更新，升级前加载模块的Pi须完整退出并重启进程；新Node进程加载store3/migration3及双级published已观察。
- T4: CLI/API/Web/Pi/Skill同步；TR-1/2已独立确认解决；TR-3统一完整Pi进程重启指引，不提供跨版本热更新。最新tsc/Skill/diff通过；测试套件与召回评测未执行、完整Pi UI会话未验证。当前服务93 completed，无failed/queued/active；最终fresh复核待完成。
- Review gate: Passed — round-04 fresh独立只读复审无阻断项、TR-1/2/3均resolved；owner已完成16文件字节、最新两级集合/hash及94 completed无失败/待处理的运行态核对。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 复杂跨组件实现，第四轮fresh独立复审覆盖冻结范围；最终字节/运行态已核对。
- Snapshot: snapshot:tasks/artifacts/implement-recall-first-memory-index/evidence/397520067e3ac7a584c7860c96c197e26d62d3c29d204b95b2d0a9b9c43e59e9.json#397520067e3ac7a584c7860c96c197e26d62d3c29d204b95b2d0a9b9c43e59e9
- Evidence: Log009、逐Target Result及最终Self Assessment；16文件字节通过，两级53条完整对账，94 completed且无失败/排队/运行批次，限制保留。
- Task fingerprint: 8b41d84efe4f2d2ee3baa7489547cf0fb4ce9d80eb78d3a06494c1eb610ed36e
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/implement-recall-first-memory-index/reviews/round-01.md) | snapshot:tasks/artifacts/implement-recall-first-memory-index/evidence/119b313aeeefda0d290af387ac4b35b559dfb1941d329f6d4273cae227f3a2a7.json#119b313aeeefda0d290af387ac4b35b559dfb1941d329f6d4273cae227f3a2a7 | findings | 3dc9a477e4f35158adefd02d652e1f3dddf6066564ea867b8bbaf18d001d40d8 |
| 02 | [Round 02](../artifacts/implement-recall-first-memory-index/reviews/round-02.md) | snapshot:tasks/artifacts/implement-recall-first-memory-index/evidence/d1db56724068ebbc48ebbaf436e19becf2290e10f483cd51c222b298a13cdbd4.json#d1db56724068ebbc48ebbaf436e19becf2290e10f483cd51c222b298a13cdbd4 | findings | 19d8e457957c478d8cd495c7634fb9220f8cda498fccf371e3e7e63bfce2fd8b |
| 03 | [Round 03](../artifacts/implement-recall-first-memory-index/reviews/round-03.md) | snapshot:tasks/artifacts/implement-recall-first-memory-index/evidence/398222230aa672689d45bcbaa5237a73deccea23328f56b2631774ef2ce259ba.json#398222230aa672689d45bcbaa5237a73deccea23328f56b2631774ef2ce259ba | findings | 9e2064d63f63085c93b51a37055f002b167842ed4bf1aab85c37ed62a2e407de |
| 04 | [Round 04](../artifacts/implement-recall-first-memory-index/reviews/round-04.md) | snapshot:tasks/artifacts/implement-recall-first-memory-index/evidence/397520067e3ac7a584c7860c96c197e26d62d3c29d204b95b2d0a9b9c43e59e9.json#397520067e3ac7a584c7860c96c197e26d62d3c29d204b95b2d0a9b9c43e59e9 | no blocking findings | c40949135648e73cf4f7760da686c07d9348feb418558834c6c870add5d6d600 |

## Verification

- Passed: Log009：冻结快照当前字节一致；正常维护结束后protocol3、94 completed、无failed/queued/running/active及schedulerError；user1/project52有效chip=manifest=cards、hash差异0、pending=false且代际稳定。静态/质量检查及独立复审通过。完整Pi进程重启为用户激活步骤；未跑测试套件或召回评测，首次模型失败根因未知，接受Skill预算警告2849/1923。Self Assessment已据最终证据复核。
