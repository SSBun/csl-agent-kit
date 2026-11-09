# 召回优先的 Markdown Memory

Memory 保留用户级与项目级的权威 Markdown。每个 entry 是同一主题的知识速记 chip；项目只保留单个 index.md，用户级保留卡片、主题导航和薄总览。这些都是派生入口，不是第二份知识。正文只留核心结论、适用条件和例外，来源独立存于 sources；允许短句和碎片，不为每一句事实创建文件。

本文描述实现契约，不代替任务验收记录。代码存在、升级完成、服务就绪、模型处理完成与召回率提升是不同事实。

## 速记准入与提炼

先判断信息是否有证据、能改变未来决策且值得跨任务复用，再压缩表达。稳定偏好、难重建的项目事实、带条件的经验可保留；确认经过、任务进度、交付与验证流水、重复规范不进入知识正文。旧知识已覆盖且没有纠正或实质增量时零写入，不仅为追加来源更新条目。

正文采用短句、关键词或并列项；不要求文章结构、固定章节或连贯叙述。删除无决策作用的修饰语及“用户明确要求”“随后澄清”“本批核对”等包装。title、summary和检索词同样聚焦知识，不携带维护过程。没有最低长度，不按字数凑齐内容。

会话/事件/事务ID、任务编号、审计hash和证据位置归 sources 及审计；维护理由归 reason/source，核查过程只作即时输出或未完成队列状态，不保存为长期处理日志。必要时在 sources 标注各结论对应的证据段落。结构性id、revision、hash及关系links保留。API、配置键、错误码、阈值、单位、否定、范围、时效与例外若影响后续判断，也必须准确保留。精简不扩大适用范围，不把不确定陈述写成事实。

例如，仅凭一次“用户回复yes、随后验证完成”的消息不创建记忆。确有复用价值的筛选条件可写为“Dashboard：有 transaction 即显示，含失败但已写入记录。”其确认及验证过程只通过来源追溯，不进入正文。已有正式规则和需求最多保留必要提示及来源入口。

会话维护和周期复查使用同一准入标准，逐步精简实际触及的旧条目；先核对条件与独有有效知识，再移除正文冗余，保留来源，不批量重写全库。具体读写约束见 `skills/meta/agent-memory/SKILL.md`。这些是模型提炼要求，writer仍负责格式、预算、版本与关系校验，不以关键词删除或机械截断代替语义判断。

## 读取与存储

用户根遵循 `${CSL_AGENT_KIT_HOME:-~/.csl-agent-kit}/memory`，项目根为当前workspace的 `.csl-agent-kit/memory`。`csl-agent-kit memory paths`只读返回两级绝对位置，不调用模型。

各根的逻辑成员：

| 成员 | 职责 |
| --- | --- |
| `entries` | 权威chip，包含身份、revision、来源、正文及检索元数据；deleted墓碑不是有效知识 |
| `index.md` | 项目唯一索引，列全部有效chip摘要、正文链接、revision/hash和反向替代提示；用户级为4000字符以内的薄总览 |
| `.indexes/<generation>/cards` | 仅用户级：全部有效chip的卡片，包括未分类和待增强记录 |
| `.indexes/<generation>/topics` | 仅用户级：动态主题及父子主题，多入口共同指向同一chip |
| `.indexes/<generation>/topics.md` | 仅用户级：完整主题目录，按需搜索或分段读取 |
| `.indexes/<generation>/manifest.json` | 仅用户级：代际身份、文件hash、卡片集合和关系诊断；不是权威正文 |
| `.history` | before/after、原因、来源、hash与事务状态 |
| `.pending.json` | 未完成事务；存在时不能声称索引已充分反映当前知识 |
| `.format.json` | 已完成升级版本与作用域 |
| `.upgrade-v3.json`、`.migrations` | 可恢复转换状态、完整原文备份和旧迁移资料 |
| `.write-lock` | 阻止旧writer的永久格式隔离标记，不能当作过期PID锁删除 |
| `.write-lock-v3` | 阻止旧v3 writer的永久隔离标记 |
| `.write-lock-v4` | 当前writer的进程锁 |
| `.index-error.json` | 最近派生重建错误，成功重建后清除 |
| `.proposals` | 遗留或手工提案，不是两级自主维护前置条件 |
| `.service` | 仅用户根：未完成事件/作业、去重hash分片、工作区登记、最新周期游标、模型配置及服务状态；不是处理历史 |

读者无需专用检索接口或后台在线。先看两级index.md：项目单索引直接覆盖全部有效chips，不查找额外卡片或主题文件；用户级浏览相关主题并显式搜索总览给出的当前cards目录。线索不足时用普通read/grep/find搜索entries正文及retrieval，不搜索历史代际。

候选按(scope,id)去重后读正文，核对条件、来源、必要依赖及完整替代关系。主题导航不是全集，type不作硬过滤。弱命中、冲突、缺失条件或截断时扩展措辞/主题并搜索当前entries；墓碑和已替代条目不能被直接采信。

采信任何候选或报告未找到之前，重读相关作用域的generation、检查pending、再复读generation。变化时刷新卡片和反向supersedes，不能只看旧正文hash。无锁检查不保证最后观察之后不会再发生写入；跨user/project也不是全局原子快照。无法核对时披露覆盖有限，不把部分搜索报告成知识不存在。

## 格式与预算

当前store version=4，entry schema=`csl-memory/v2`，派生overview schema=`csl-memory-index/v3`。旧v1条目可在转换及历史中读取，不作为长期平行写入格式。

chip保留id、revision、title、summary、type、sources、updated、deleted及Markdown正文。新增可选retrieval：

- aliases：有正文依据的相关说法，最多64个，每个160字符。
- situations：可能需要该知识的任务/情境，最多64个，每个400字符；不是执行授权。
- topics：动态语义路径，可多入口，最多64个，每个512字符；最多8段，每段80字符。不是磁盘路径，不预设领域模板。
- links：最多128个唯一 `{kind, scope, id}`。kind为related/requires/supersedes；新引用需指向存在的有效chip。完整替代不能跨scope或形成环；部分纠正更新原chip，不隐藏仍有效的其他知识。

跨作用域关系在卡片上明确标为cross-scope-recheck，读者必须到另一作用域的当前卡片库核对。删除目标后保留诊断，不生成指向缺失卡片的链接；未解决的requires不能忽略。卡片完整不等于语义召回完整。

标题最多60个Unicode字符、summary最多200。每个项目独立最多20个有效chips，每chip正文最多1000词，以`Intl.Segmenter("zh", {granularity: "word"})`的`isWordLike`段计数：覆盖中英文混排，标点/空白不计，Markdown代码与链接文字参与分词。项目不再使用8000字符正文预算，仍保留解析器及256 KiB文件安全上限。用户级沿用8000字符正文上限及兼容参考bodyTarget=4000，没有最低长度。

新增或复活使项目超过20个时返回MEMORY_CAPACITY；正文超过1000词返回MEMORY_BUDGET；均在写入审计前拒绝，不截断。容量检查在写锁内进行，更新已有chip和删除仍允许，以便先合并后淘汰。项目索引完整列出全部摘要，不套用用户级4000字符薄总览限制；用户级布局和配额不变。

升级及旧导入保真，现有超限条目不会按数量直接删除，`index-status.budget`报告数量及超长条目；后台优先提炼、合并并保留条件与来源。项目新写入、提案批准和精确历史恢复均受新限制，超限历史可查看但不可直接恢复到有效集合；用户级历史恢复保持原行为。

## 仅提交历史与队列释放

永久历史以 `.history` 中的 committed 事务为准：保留记忆修改前后内容、理由、来源和恢复能力。Dashboard 与 `memory commits` 直接从该审计读取，每个根只扫描一次，再过滤、跨根排序和分页；不依赖批次成功状态或effects回写，因此部分失败批次的已提交变更也可见。prepared/aborted事务继续作为写入恢复凭据保留，不作为成功提交展示。

会话原文和处理状态在排队、执行、失败待重试或耗尽待查看期间保留。成功完成后，无论是否修改记忆，均删除 `.service/events` 和 `.service/jobs` 对应文件，不保存模型总结或额外处理历史。无变更不会产生记忆提交。后台启动时也释放旧的已完成事件；未完成输入不自动删除，失败及中断在剩余次数内自动重试，累计最多两次，耗尽后保留标记并跳过。

释放前先持久化必要协调状态：分片去重表只保存事件ID→payload hash，防止同一输入重复付费或同键异文；叶子写入超过1 MiB前按ID下一位拆分，子片全部落盘后原子发布父分支，避免跨越通用读取上限。旧的平面分片按需拆分，拆分中断保留原叶子及未完成释放状态，重启可继续；工作区登记供周期复查和跨项目入链检查；每scope仅保留最新成功周期游标。它们不是对话或处理日志，不含消息和检查总结。去重表仍随已处理事件数缓慢增长；不宣称所有服务状态零增长。

完成标记、去重凭据和周期游标先于输入删除；中断后可继续释放，不能把成功处理重置为待执行。事件来源标识仍可追踪提交身份，但已释放原文不提供对话回放。CLI `jobs` 与“记忆处理”页的队列仅用于尚未解决的工作；只有提交列表属于历史。

升级后在空闲窗口重启后台以启用释放策略。已加载旧 queue 模块的 Pi 也需完整退出重启后恢复会话，避免旧读者在事件已释放后无法识别去重凭据；仅 `/reload` 不保证更新 CommonJS 缓存。

## 条件写入与审计恢复

两级均允许Memory Agent自主写入。Task Agent使用知识，不承担例行整理。所有修改通过memory_apply或CLI，不直接覆写派生文件。后台没有shell权限，核对旧导入来源使用只读memory_legacy_sources工具；它复用CLI legacy-sources的迁移清单与hash校验，返回逻辑path、绝对resolvedPath及hash，不执行升级。来源缺失或漂移时仍失败，不猜测另一份副本。

```sh
csl-agent-kit memory put --scope project --input mutation.json
csl-agent-kit memory delete --scope user --input mutation.json
csl-agent-kit memory history --scope project
csl-agent-kit memory change <transaction-id> --scope project
csl-agent-kit memory restore <transaction-id> --scope project --input restore.json
csl-agent-kit memory reindex --scope project
csl-agent-kit memory recover --scope project
```

mutation包含id、operation、expected:{revision,hash}、reason、source；put的content包含title/summary/type/sources/body及可选retrieval。新ID使用0/null，已有或墓碑ID使用当前完整文件身份。省略retrieval保留既有线索，显式空对象表示有意清空；正文语义改变时应同步复核线索。

writer在锁内核对CAS、引用及替代环，递增revision，记录准备审计/pending后替换正文，再发布完整派生代际，最后完成审计。不是跨文件原子事务；RECOVERY_REQUIRED可能意味着正文已经提交，不能盲目重放。recover只回收能够证明死亡的本机v4 writer，未知/存活锁失败关闭。

批准提案时重新核对新增关系目标及当前两级根；目标原本不存在或在提案后删除都会拒绝批准，提案仍保留pending。历史预算豁免不能绕过这项校验。

恢复以expected和reason提交新版本，不倒退revision。只有精确历史恢复单独允许保留当时记录的失效引用，并在卡片上显示诊断；这不允许读者忽略未满足的requires。历史retrieval也随历史正文恢复；用户级超预算内容保真保留，项目级恢复须满足20 chips/1000词限制。合并/拆分先保存并核对新知识，再墓碑化旧条目；不因近期未使用而删除。

派生编译不调用模型。项目直接原子发布完整index.md，再移除旧`.indexes`派生目录，正文、历史与备份不变；发布或清理失败可重新恢复。用户级先写不可变卡片/主题/manifest，再原子切换总览，同代不同字节返回INDEX_COLLISION；用户级仍保留旧代际。项目索引保留generation及反向supersedes提示，具体条件和依赖仍读正文。

## 自动升级与旧writer隔离

```sh
csl-agent-kit memory upgrade --scope project --dry-run
csl-agent-kit memory upgrade --scope project
csl-agent-kit memory upgrade --scope user
```

升级保留现有ID、来源、正文原字节和墓碑，v1条目转v2时递增revision并审计；旧store v2只转换既有条目，不再导入退休Context/Lessons。尚未启用Memory的旧项目仍使用原来的有限旧源清单、章节切分和来源hash对账，保留前言、围栏内容及历史批准导入，不全盘扫描或导入凭证。

首次使用由Pi/bootstrap检查升级，无需每个项目手动转换。升级不依赖LLM，项目生成单索引，用户级保留基础卡片，后台随后整理超限内容或补充有依据的语义线索。待审批提案不会被自动批准。

升级先取得v4锁，通过共享恢复锁排除活跃旧writer，并在`.write-lock`和`.write-lock-v3`建立永久隔离标记。旧程序会失败关闭，旧恢复程序不能把非进程标记当作死PID删除。不要删除这些隔离标记；新writer用`.write-lock-v4`。v3升级只重建索引并发布v4格式标记，保留所有entry的revision/hash；中断后可重复执行。

检测到旧共享daemon仍活跃或身份不可核实时，升级返回SERVICE_UPGRADE_REQUIRED，不修改条目。共享服务重启应在空闲窗口进行；当前restart拒绝正在运行的维护批次，v3停止API支持原子的ifIdle检查。旧服务仍可能不支持该API条件，升级操作前须确认空闲并避免继续向旧服务投递。

格式转换记录备份和逐条已提交效果；中断续做通过来源及审计对账，不再次递增已转换条目。转换阶段延后派生发布，避免为每条记录落盘整库副本；每条正文仍有pending和审计，最终全量重建成功才发布完成格式标记。源变化、备份冲突、未知未来版本明确失败。

回退必须保留升级后写入，不以旧备份覆盖新知识。旧二进制直接写新格式不受支持；原文、审计和备份可用于人工对账。原先的Context/Lessons不是平行维护源。

## 主动整理与周期复查

后台不只新增记忆：每次会话增量都主动核对相关旧chip，对有证据的失效、矛盾和重复内容进行纠错、更新、合并、提炼或逻辑删除。没有修改且项目预算已满足时也是成功结果，不设删除或新增数量目标。每批会话维护及项目周期复查获得projectBudget（数量、上限、超长条目），超限时优先整理；超容量时扫描完整项目单索引并按相容主题分组合并，周期候选仅作起点，不能作为预算修复的范围上限。处理初始候选后继续至达标或明确的安全阻塞；结束仍超限返回MEMORY_BUDGET_UNRESOLVED，保留部分提交，沿用两次尝试上限。用户级周期批次不修改项目。满容量先合并进已有chip、回读并修复入链再删除冗余项，不能先删再写、截断或转移到用户级绕过配额；无法无损收敛时报告阻塞。

运行中的daemon每分钟检查队列已知工作区的维护资格。每个项目scope及全局共享user scope在上次成功复查至少24小时后安排下一批；初次有可读条目即可安排。每批从最多8个按ID字典序轮转的候选开始，结合相关卡片及依赖按需扩展，不每次全库读取正文。只在无未解决会话批次时投递，执行时优先会话。daemon停机不运行，不是独立系统定时任务，也不会补发停机期间每一天的批次。

周期事件携带`maintenance: {scope, ids}`且`messages: []`，不伪造用户发言。未完成事件负责占位；成功后单独保存最新周期游标并释放事件。只有成功批次推进成功检查点；失败或中断在剩余次数内自动重试，累计最多两次。耗尽候选参与后续调度：等待24小时冷却后从候选末尾继续，不写成功检查点，也不永久阻塞该作用域。批次复用现有模型、五分钟期限、CAS与effects审计，因此会产生正常模型费用。服务状态中的`maintenanceErrors`显示调度错误。“记忆存储”页的变更记录只展示真实提交，不提供“全部处理记录”切换；未完成批次可在“记忆处理”页的队列中核对。

删除必须基于失效证据或已验证的完整替代，不能仅因长时间未使用。合并保留独有信息、适用条件、例外和来源；抽象不能超出案例支持范围。先写并回读替代知识，再处理旧chip和反向引用。Memory Agent删除入口保守检查当前两级根目录的入链；删除用户chip还检查队列已知项目。存在活跃入链或pending写入时拒绝删除，无法跨工作区修正的依赖保留待处理。保留supersedes链接时不能删除其目标成为断链。未知外部引用和外部并发写入不在此检查的完整性保证内；存储层的条件版本、历史恢复与关系核对仍然必要。

## 后台与宿主接入

```sh
csl-agent-kit memory service start
csl-agent-kit memory service status
csl-agent-kit memory service restart
csl-agent-kit memory agents
csl-agent-kit memory jobs
csl-agent-kit memory model show
csl-agent-kit memory model set <provider/model>
csl-agent-kit memory model reset
```

服务protocol=4，普通Agent退出不停止已持久化维护。每workspace独立、可复用SDK内存会话，同workspace串行、不同workspace独立并行，不设全局两个的上限；最多32批或上下文达到现有阈值、模型变化/失败/服务重启时重建。持久状态以未完成队列、最小协调状态、知识和提交审计为准，不依靠无限聊天记录。

Memory覆盖模型优先，否则使用Pi保存的默认模型；不跟随前台临时切换，不静默降级。单批五分钟期限；每条事件累计最多两次尝试（首次加一次自动重试），计数跨重启保留，显式retry也不能绕过上限。失败或中断后沿用已有effects，在重新读取实际知识和审计后继续；累计两次仍未完成则标记exhausted，保留输入、错误及部分提交入口，调度跳过它继续后续记录。旧的失败/中断/等待记录沿用原attempts，已经达到上限的不再执行。周期复查同样最多两次；耗尽批次不冒充成功、不推进成功游标，但调度以其候选末尾继续并等待原24小时周期，避免立即重新生成同一批。Dashboard和Pi异常计数包含exhausted。

Pi在稳定agent_settled后投递可见user/assistant文本，不发送隐藏推理或完整工具输出。游标仅在持久入队且payload hash一致后推进；相同事件去重，不等于语义exactly-once。首次启用从当前位置开始，不回灌历史。单消息超预算报告未完整入队，不静默截断。

Pi与其他宿主的bootstrap读取新总览和状态；后台维护首版仍只自动接入Pi。升级前已经加载Memory模块的Pi必须退出并重新启动整个Pi进程，再恢复原会话；仅执行`/reload`不够，因为原生CommonJS缓存可能仍保留旧migration/service及其依赖。不要只刷新store后混用不同版本模块。后台服务重启不会清除前台缓存，也不要由Agent擅自关闭用户前台进程。本次不提供跨版本热更新保证。主任务不因Memory失败默认阻断。

## CLI与Web观测

Dashboard 使用左侧导航分为三个独立视图，并以 `?page=overview|storage|processing` 保留页面位置，支持直接打开、刷新和前进后退。默认全局概览用彩色卡片展示服务健康、活动/等待/异常批次及工作区快照；断线时明确显示状态未知。记忆存储页承载记忆库、用户/项目筛选、提交历史、详情和恢复；记忆处理页承载运行中Agent、实时详情与独立工作区队列筛选。存储与处理页的筛选、分页各自保留，切页关闭当前详情。窄屏将侧栏转换为顶部导航。此布局不改变处理次数、提交或过程缓存策略。

```sh
csl-agent-kit memory index-status --scope project --workspace <absolute-project>
csl-agent-kit memory dashboard --open
```

Agent对话中的`$agent-memory dashboard`复用现有打开命令。页面默认进入全局概览；选择侧栏“记忆存储”后，默认显示记忆库，以卡片展示当前未删除条目的标题、摘要和类型；用户记忆独立全局分组并置前，项目记忆按工作区分组，组内按最近更新时间排列后分页。分组标题显示完整项目路径和本页条数，不把它误称为项目总数。同名项目按完整路径区分。点击卡片默认展开主要正文，使用本机加载的markdown-it 14.2.0渲染Markdown，使用json-formatter-js 2.5.23渲染JSON对象、数组及有效JSON代码块。来源与元数据默认折叠，手动展开后可继续折叠JSON节点；切换记录会重置为折叠。历史记忆文件中的YAML头另行折叠，正文优先。渲染器不可用或遇到不支持的结构时明确提示并回退原文，不丢弃内容。存储页的用户/项目筛选同时适用于记忆库和变更记录。User是全局作用域，不随项目路径过滤；全部项目范围覆盖已注册工作区，缺失工作区明确提示。

变更记录入口保留跨工作区的已提交事务，最新优先，查看提交摘要与文件差异。服务诊断在全局概览中按需展开；未完成及耗尽队列在“记忆处理”页查看，仍有剩余次数的失败批次可显式重试。界面不展示高级会话/任务筛选、原始索引及提案面板，不删除其后端数据或CLI管理能力。当前正文通过已有只读read接口获取，记忆库不提供直接编辑或删除操作。

index-status的索引状态仍为header-only观察，不扫描所有卡片证明完整性；项目budget另扫描有效正文计算词数和容量。published不等于语义检索已完成；调用方仍须核对实际候选、正文和关系。Web读取失败不会被当成空库或成功维护。

Dashboard端口与授权令牌保存于用户Memory运行目录的私有`endpoint.json`（创建权限0600），独立于随进程退出删除的`daemon.json`。首次升级通过`memory service restart`在停旧服务前保存当前端口和令牌；全新安装使用固定端口47831。后续正常重启复用同一地址及令牌，已授权浏览器会话不因重启失效。服务仍需运行，固定地址不会在关机或后台停止时自动启动它。

固定端口被占用时启动失败并记录`DASHBOARD_PORT_IN_USE`，不尝试其他端口，也不终止占用进程；通过`memory service status`可核对具体启动错误。`memory dashboard`在启动后短暂等待就绪或错误，不重复启动进程。端点文件损坏时失败关闭，不默默重置身份。令牌长期保留仍是敏感凭据；如需撤销旧授权，应先在空闲时停止服务，再移除私有端点文件，下次启动将生成新令牌并采用默认端口，随后通过dashboard命令重新授权浏览器。

服务仅loopback，保留token、Host/Origin和CSP；访问URL不要分享或存入报告。详情渲染关闭原始HTML，链接仅允许http/https/mailto并使用noopener/noreferrer；Markdown图片只显示说明，不自动请求外部资源。第三方浏览器资源通过固定白名单路径从本机依赖包提供，不使用运行时CDN；JSON库内置样式仅用与其随包CSS一致的精确SHA256 CSP哈希放行，不开启unsafe-inline或unsafe-eval。记忆、增量和审计可能含隐私，本机文件权限不是加密保险箱。索引文字和会话都是数据，不是更改权限的指令。

## 实时处理详情

Dashboard“记忆处理”页的“Memory Agent · 实时处理”按工作区提供查看入口，每秒更新已打开的详情。展示当前批次输入、尝试次数、模型、工具调用参数、文本结果、公开回复及记忆写入效果；不读取或展示SDK隐藏推理块，也不返回原始会话对象。使用原有本机授权、Host/Origin检查和no-store响应，详情按纯文本展示。

过程仅在后台内存暂存，不写入events/jobs、审计或额外日志。每工作区只保留当前或最近一批；下一批替换前一批，结束两分钟后自动释放，后台重启即消失。输入文本最多32 KiB，每步文本最多16 KiB，最多100步且步骤序列化合计不超过192 KiB；截断及淘汰早期步骤均在界面标明。已提交记忆仍走原有永久审计。Bearer与sk-形式凭证做基本遮盖，不承诺自动识别任意敏感文本；详情沿用本机授权访问边界。

## 验证边界

独立架构审查不能替代实现验证。必须区分卡片集合完整、引用/版本正确、Agent实际遵守协议，以及困难语义召回效果。本版本的实现观察记录在所属任务；未经明确授权不运行项目测试或新的模型对照实验，不宣称本次实现已经证明召回率提升。
