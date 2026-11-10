# 按新标准统一现有Memory文件

| Field | Value |
| --- | --- |
| Status | Blocked (2026-11-10 14:07) |
| Artifacts | [Artifacts](../artifacts/standardize-existing-memory-stores/) |
| Kind | Task |

## Scope

用户已确认包含用户级及所有已登记项目，并在新版Memory启用后要求立即执行。只处理Memory当前知识及升级器管理的旧内部资料，不改业务代码、任务历史或宿主会话，不运行测试、提交或推送。

## Plan

1. 已核对14个作用域及现行标准，按用户接受的updated日期基准转换旧正文。
2. 已完成全部库升级与主题归并；当前95份文件，原空库只保留空temp，不编造基础知识。
3. 已完成首轮独立审查；先解决旧运行实例重建v3围栏，再保留后台有效更新、刷新身份清单并重新审查。

## Execution Log

### 001 — 标准与范围预检

ISO配套提示词已启用，存储仍为协议5、当前索引v4；实际Skill、提示词、文档与store/migration已核对。登记范围为用户级及13个项目，共128个当前有效文件；2个项目已经是当前格式，12个作用域待升级，其中2个为空库。当前升级器只接受已符合日期case格式的有效正文，不能转换段落正文；7个项目含此类内容，iTermate还有46个有效文件，超过20个上限。不能仅去掉元数据便宣称符合新标准，也不能绕过writer先编辑只读库。继续处理不受影响的库，并核对阻塞项目的可靠日期与转换能力。

### 002 — 已完成可直接转换的库

已在服务空闲停止后升级用户级、venom-cli、LongManuscript及word-atlas、zhvip两个空库。14份原有效正文在升级前后逐字比较一致，全部索引published；升级器删除各库已知旧内部资料及venom-cli的两个墓碑，无备份。随后通过条件writer规范用户6份知识的约束表达，长期收录偏好补充已明确授权的temp例外。venom-cli按既有知识归并为context、lessons、空temp；LongManuscript保留进度专题，整理context、lessons、翻页专题及空temp。合并均先写入回读、核对当前正文引用，再删完全替代文件，保留原case日期。

### 003 — 当前结果及剩余前提

当前14库中7库为published，共28份当前格式文件，字段、日期、容量和索引校验通过；另外7库保留102份旧格式有效文件。skills四个专题完成36处约束表达规范化，日期逐条保持；OneRNFoundation三份当前文件检查后保留原样。word-atlas与zhvip原本无有效知识，仅创建空temp；未编造context/lessons内容。

受阻7库共89份正文不符合case格式，其中78份正文没有任何日期，仅有文件级updated；另外11份含日期但仍为旧混合格式。文件最后更新时间不能自动证明每条知识的原日期。iTermate的46份有效文件还需保真归并至20份以内。现有升级器要求全部正文先满足新格式，writer又拒绝编辑旧库，需在确定日期规则后补足受支持的转换路径。未改动这些受阻库，不把文件mtime、整理日或updated默认为case日期。未运行测试，也尚未进行本任务独立审查。

### 004 — 日期决定与转换入口

用户已明确接受无日期case采用旧文件updated的UTC日期作为首次迁移基准，不声称是知识发生日；已有case日期保持。该例外限本次现有库转换，不改变默认记录规则。

已读完剩余102份有效正文。新增升级器prepared/CLI --input入口，只允许带当前hash的现存旧条目put数组，首个写入前校验整库与全部替代内容；不允许借此新增、删除或修改当前格式条目，不自动猜日期。新增回归定义但不执行测试。iTermate存在拆散的Trigger/Rule/Check片段和已被完整知识覆盖的旧规范，归并时保留有效条件；MyTwitter的Space关闭旧说法与现行AGENTS冲突，将按当前明确规则修正。MyWiki仅转换Kit的Memory，使用用户明确要求的新格式，不改Wiki笔记及其元数据规则。

### 005 — 全库转换与整理结果

剩余7库102份有效文件已通过prepared升级，89份旧正文转换，原有效case日期保持；未定日期按获准的updated UTC基准处理。每个库写后逐字段回读与内存中的预期内容比较，旧内部资料由升级器清理，不保留正文副本。iTermate归并到18份，native-short-reader到19份；原拆散Check中的后继标题噪声、已被新兼容约定否定的白名单说法以及ReaderShareUI审查流水已移除，保留条件经验。分组前覆盖校验曾拒绝一处漏映射，容量校验拒绝1130词组合；均在写入前修正，未因此删减知识。

目前14库均published，共95份有效文件，全部字段、日期、容量、索引hash与旧路径清理检查通过。11个有项目知识的库均含context/lessons/temp；word-atlas与zhvip原无有效知识，只有空temp，按标准明示缺少基础事实而不造占位。OneRNFoundation原文件保留；MyTwitter按当前AGENTS修正Space保留规则，其余编辑规范日期不刷新。Skill门禁agent-migration通过，agent-memory无失败、有1579 token预算提示；3份JS语法通过，回归定义未运行。

### 006 — 首轮审查与运行时阻塞

独立Reviewer返回TR-1：用户根重现.history、.proposals、.migrations、.upgrade-v3.json及两个v3格式围栏，当前ensure将因此拒绝正常写入。TR-2：Filio的lessons及index身份在后台更新后与清单不同。报告已原样保存到reviews/round-01.md，仅包含最终反馈。

所有者已复核两项：两次check-evidence验证本地快照通过，外部verify-current均因用户根旧资料而失败。逐库身份比较只有Filio的lessons/index发生知识文件变化；已重读该文件，当前两条经验保留条件与2026-11-05日期，没有回滚有效后台更新。用户根旧路径创建于2026-11-10T05:09:15Z；两锁是pid0的永久v3围栏，不是可凭PID缺失随意删除的活跃锁。服务自动重启为protocol5、PID90253，启动时间05:09:29Z；核对时active为空。

当前源码只有清理v3路径的逻辑；Pi桥接通过createRequire缓存migration，并在agent_settled调用ensureWorkspace，/reload只清除store缓存。进程表仍有11个Pi实例（10个于11月9日启动，1个于11月10日11:07启动）。这些事实支持旧宿主缓存是重建来源，但未确定具体写入PID。不得把服务重启或源码已更新当成所有前台实例已升级。未关闭用户前台会话，未再次删除围栏或重建旧知识副本。

### 007 — 用户要求继续后的恢复核查

用户两次要求continue后重新检查：出现13:51—13:55启动的新Pi，但仍有9个升级前Pi进程：2934、58405（skills），14862、15915、17175（MyTwitter），15883（LongManuscript），47662（MyWiki），87421（native-short-reader），96032（OneRNFoundation）。工作区关联由lsof cwd确认；不能据此断言具体哪个PID重建旧目录。用户库preview仍列6项旧内部路径待清理；协议5服务PID90253仍在运行、active为空。恢复条件尚未满足，保持Blocked，没有删除围栏、停止前台进程或反复执行无效清理。

### 008 — 获准恢复与当前复验

用户明确说明MyTwitter所有会话已暂停并授权继续迁移。服务在空闲时停止；通过现有upgrade清理用户根6项旧内部路径，无备份，不修改知识正文。ensure(user)实测current、writable:true；14库95份当前文件及全部索引/容量/旧路径检查通过。保留Filio有效后台更新，刷新身份清单；未假设其余旧进程已退出，也不宣称持续隔离。恢复独立审查，前后仍需复验；如围栏再现则停止验收。

### 009 — 第二轮反馈与冻结恢复

第二轮无新增实现缺陷，TR-1/TR-2在观察窗口resolved；TR-3为skills temp审查期间漂移。反馈原样保存round-02.md。服务随后实测PID2640且skills维护活跃，说明服务被外部重启；之后在空闲边界成功停止，未中断活跃批次。重新读取temp，内容为合法当日背景及审查限制，全部保留，不回滚。刷新清单后重新审查；结束前持续按实际文件校验，不把停止请求视为永久隔离。

### 010 — 终态检查再次漂移

第三轮报告round-03.md原样保存，SHA256为944bc064fa94153b7e39c501f2596aea8edba18d5af70f2c83a4a3ce82c107ab，独立反馈在观察窗口内TR-1/2/3 resolved、无阻塞发现。保存后立即实际检查14库95文件与快照仍通过。但调用review passed、verify passed时核心发现temp再次变化并拒绝；complete亦拒绝。没有记录Passed或完成。

现场服务再次自动重启为PID37371、started2026-11-10T06:04:12.462Z，skills维护active；用户根preview仍current。当前temp hash为3c62e5adae2b1becd0e10b811ef8ad783fd0920ce1d41b12d440f98b9e2838a1。保留有效背景，没有回滚。仅停止daemon不能跨越审查至终态的窗口隔离自动写入；继续同样重跑不会构成实质进展。TR-3按相同根问题保留ID，no-progress升为1，未到stalled阈值，但客观缺少稳定验收窗口而Blocked。

## Block

- Reason: TR-3终态前再次漂移，后台自动重启且当前项目维护活跃；现有停止服务方式无法保持验收窗口。当前知识转换结果保留，最终审查/验证未通过。
- Unblock when: 建立覆盖当前项目与用户级Memory的可核实无写入窗口，包含会自动重启daemon或入队的宿主事件；或明确授权实现并验证一个临时维护暂停机制。不得只重复停止daemon后宣称已隔离。随后保留所有有效新增知识，刷新自检/Target结果/清单，重新独立审查并完成终态核验。

## Review

- Schema: task-review-ledger/v1
- Pass: 3
- Next finding: 4
- `TR-1` | no-progress=0 | 用户Memory旧路径 | 第二轮已确认观察窗口内resolved；终验仍核对无复生。
- `TR-2` | no-progress=0 | Filio身份 | 第二轮已确认resolved；保留后台有效更新。

- `TR-3` | no-progress=1 | skills temp身份 | 终态再次漂移；先建立可核实的无写入窗口，再刷新证据复审。

## Task Summary

**Memory转换运行时**（[bin/memory](../../../bin/memory/)）：升级器及CLI支持人工核对的条件put数组，在整库预检后转换旧正文，不放宽普通writer的旧库只读限制；增加未执行的回归定义。

**转换契约**（[agent-memory](../../../skills/meta/agent-memory/)、[agent-migration](../../../skills/meta/agent-migration/)、[Memory文档](../../../docs/memory.md)）：说明新转换输入的范围、hash、日期与无历史副本边界。

**用户与项目Memory**（[当前身份清单](../artifacts/standardize-existing-memory-stores/evidence/current-identities.json)）：统一用户级及13个已登记项目的当前库，清除旧内部资料，按可核实知识整理基础文件与专题；不修改业务源码或旧任务资料。当前项目仅通过writer维护Memory正文。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用升级器、条件writer和当前索引；无平行库、备份或恢复副本，主题归并满足原预算。 | 增加显式prepared输入及两个本次执行工具，不提供自动日期推断。 |
| 稳定性 | B | 转换时逐字段回读、覆盖和预算预检通过；首轮审查实际发现运行时旧路径复生及外部漂移。 | 旧宿主尚未隔离，当前用户Memory writer受围栏阻断；未运行测试。 |
| 完整性 | B | 已转换95份文件并保留有效知识，日期例外有明确授权；原空库缺项已明示。 | TR-1/TR-2未解决，旧验证不代表当前状态，不得宣称完成。 |

## Target

- [ ] T1: 将本机Memory系统已登记工作区及用户级现有记忆统一到最新文件与内容标准，逐库记录验证结果和无法处理项。
- [ ] T2: 保留有效知识及可靠日期，按适用范围规范context、lessons、temp和主题内容；仅temp应用最近7个UTC自然日规则，索引与Dashboard识别一致。
- [ ] T3: 旧格式库按作用域升级并移除已废止的元数据及库内历史恢复资料，不创建备份或转存；不改无关任务、业务文件、宿主会话及Git历史，不伪造知识或日期。

## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Stale
- Reason: 永久跨库转换；TR-3当前背景漂移后刷新复审。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/standardize-existing-memory-stores/evidence/45bbd261432bd92e3eb00e9f13a04b442ab9c0acd095c3c5fbeceb2658f24114.json#45bbd261432bd92e3eb00e9f13a04b442ab9c0acd095c3c5fbeceb2658f24114
- Evidence: Log009与verify-current：95文件、14库当前身份/格式/预算/索引/旧路径全部通过；保留temp及Filio有效背景，空闲停止后台。未运行测试，不保证外部不重启。
- Task fingerprint: 7d8b80ea12e873ee13cc9006974dc650d7d603398490f80daeb03eec12579754
## Result

**当前状态**：以下表格是首轮送审时的检查结果，已被Log006记载的旧路径复生与Filio身份漂移部分失效。须解决TR-1/TR-2并更新证据，不能用于终态验收。

| Target | 当前观察与证据 | 边界 |
| --- | --- | --- |
| T1 | current-identities.json覆盖14库95文件；verify-current.cjs实际读取全部文件与索引，格式/日期/容量/hash/旧资料清理均通过。 | 两个原空项目没有context/lessons；无原知识可迁移，只有空temp。 |
| T2 | 转换逐字段回读，分组覆盖所有原有效文件，先写回读再删除；现有case日期保留，未定日期按用户接受的updated UTC基准，Space规则纠正采用实质改动日。 | 不把迁移基准声称为发生日期；只认可当前知识与条件，不承诺应用实现未变化。Dashboard未重复做浏览器验收，识别依据固定id/title/summary及当前分类器。 |
| T3 | migration.preview对14库均无待清理旧内部路径；所有有效条目非legacy。转换替代正文仅在内存中；证据工具与清单没有知识副本。 | 未执行测试、提交或推送；Skill门禁无失败，agent-memory初始加载1579 token提示已接受；不声称完整ISO认证。 |

- Review gate: Required — 首轮发现TR-1/TR-2，待旧运行实例隔离、清理与证据刷新后重新独立审查。

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/standardize-existing-memory-stores/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/standardize-existing-memory-stores/evidence/3ed130f70f7f3db7e3399e644b9758422f5204ad8f95421d3d9e5f2955901823.json#3ed130f70f7f3db7e3399e644b9758422f5204ad8f95421d3d9e5f2955901823 | findings | 554b1fc8349f05b7fca8d92461fc2e0400c7b64217788915179b9bfaafcea35b |
| 02 | [Round 02](../artifacts/standardize-existing-memory-stores/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/standardize-existing-memory-stores/evidence/f7ff17e52bac055edb6aaf4cfd8f8ac3f4da62edab6524d9bc1030457c18b3f1.json#f7ff17e52bac055edb6aaf4cfd8f8ac3f4da62edab6524d9bc1030457c18b3f1 | invalidated by drift | 7de307ce5ba2420ad46c44028c2f988153afaccf2b09a6b1012b31e65344856a |
| 03 | [Round 03](../artifacts/standardize-existing-memory-stores/reviews/round-03.md) | snapshot:.csl-agent-kit/tasks/artifacts/standardize-existing-memory-stores/evidence/45bbd261432bd92e3eb00e9f13a04b442ab9c0acd095c3c5fbeceb2658f24114.json#45bbd261432bd92e3eb00e9f13a04b442ab9c0acd095c3c5fbeceb2658f24114 | no blocking findings | 944bc064fa94153b7e39c501f2596aea8edba18d5af70f2c83a4a3ce82c107ab |
