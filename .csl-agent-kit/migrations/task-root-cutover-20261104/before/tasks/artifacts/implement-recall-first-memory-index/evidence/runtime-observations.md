# 召回索引实施观察

本记录只陈述实际操作；没有运行单元测试或项目测试套件，没有发起新的模型评测。隔离观察全部使用合成资料，真实升级按用户明确批准的共享服务空闲窗口执行。

## 隔离CLI与旧版本保护

临时根为`/tmp/csl-recall-v3.3QlnMp`，用户数据根独立于真实用户根。

1. 新项目旧资料通过正式upgrade入口导入为store version=3、entry v2、overview v3；包含前言及正文两条基础卡片。
2. 使用本任务保存的旧版migration/store源码建立真正的store v2合成目录，再用新CLI升级；2条记录revision从1到2，effects为空、converted=2。备份hash与转换登记相同，两条正文的原始尾部字节均完全一致；重复upgrade返回current。
3. 使用保存的旧store实际尝试写入新格式目录，返回LOCKED；旧recover同样返回LOCKED、无法证明隔离标记属于死亡本机writer。没有创建尝试写入的条目。
4. 新增old-note，包含两个动态主题路径；再新增new-note完整替代old-note。得到4张卡片、2条未分类基础知识、4个父子主题。旧正文hash仍为932d77cb3256dd7b86b4ae43cf4cea91be7b9194dcac01099cc480ba9910e6ee，当前卡片出现new-note反向链接。
5. 对该代manifest中的Markdown链接逐一解析，missingLinks为空。通过正式put提交反向替代环，返回RELATION_CYCLE；旧条目revision仍为1、hash未变，pending=false。

## 恢复观察

只在上述临时数据中构造持久状态，调用正式CLI，不启动测试runner：

- 将已提交new-note的审计状态改为prepared并补上pending标记，保留实际正文为afterHash对应内容。recover完成审计和新代发布，pending清除，new-note/old-note的revision均未重复递增。
- 在旧版本转换合成目录中，恢复version=2标记并清空迁移登记中的converted数组，保留已经转换的条目、备份及审计，模拟“正文/审计已提交、迁移登记及完成标记未提交”。upgrade从原审计重建2条converted效果，revision仍为2，无重复导入，最终published且pending=false。

以上仅覆盖所列窗口，不代表所有崩溃或并发排列已遍历。

## API、浏览器与bootstrap

隔离daemon启动后返回protocol=3、无队列任务，GET /api/index显示project的4张卡片及4个主题。用本机Chrome独立临时配置打开实际面板、填写合成项目路径并提交筛选，DOM中的index-status显示published、formatVersion=3、cardCount=4、topicCount=4；页面错误区为空，Runtime.exceptionThrown为0。未读取日常浏览器配置或向报告保存授权token。临时浏览器和daemon已停止。

实际执行read-agent-memory bootstrap脚本，隔离user/project均返回overview v3、published；user空库cards=0、project cards=4。该观察证明bootstrap脚本输出，不替代完整Pi新会话端到端验证。

## 真实升级与共享服务

用户明确允许代码验证后在空闲窗口重启共享服务并兼容升级。停止旧协议前读取status：protocol=2、active=[]、仅88条completed，无queued/running。通过正式restart停止旧服务并启动protocol=3；没有中断运行中的批次，持久队列completed仍为88。

随后升级真实user和当前project根：user converted=1、project converted=52、两者imported=0。逐条核对转换审计before/after正文原始尾部字节，bodyByteMismatches均为空。原条目身份、来源及知识保留；备份和审计实际落盘。

当前编译器版本身份加入generation后，对两级实际reindex并核对manifest：user有效条目/manifest记录/卡片均为1，project均为52；两级missingFiles=0、hashMismatches=0、pending=false、state=published。既有资料都是基础卡片，不声称已经由LLM完成语义增强或形成完整主题。

源代码冻结前再次在active=[]、无queued的窗口重载protocol=3服务，使当前进程载入最新编译器。随后status显示running=true、protocol=3、active=[]、completed=88、schedulerError=null。没有开启新的合成模型请求；正常后续会话维护仍由既有后台处理。

## 独立审查TR-1修正与追加观察

首轮独立实现审查确认：手工提案批准的preserveLegacy预算例外误跳过新增引用存在性检查。主Agent核对调用链后将预算保真与restoreHistoricalReferences分离；只有精确历史恢复可以保留失效历史引用，批准入口必须在当前两级reference roots核对新增目标。

在新的隔离根`/tmp/csl-recall-approval.csTbQ4`通过正式CLI创建两个合成提案；第一项目标从未存在，第二项目标在提案产生后经正式delete删除。启动隔离服务，通过实际/api/proposal与/api/decision请求检查批准路径，两项均返回REFERENCE_NOT_FOUND，提案仍pending，来源chip不存在。审计计数保持2（仅目标创建/删除），pending事务为false。没有批准真实用户提案；临时服务随后停止。新增目标丢失、跨级有效引用与精确恢复的测试源码已补充，但未运行测试套件。

修正后store及测试源码语法检查、diff检查通过；agent-memory质量门0失败，预算警告更新为2743估算tokens。共享服务在active为空且无queued时再次空闲重载，载入修正代码。

本次重载前发现真实队列已有1条failed事件：37e20520447a979cfc18d595f7bb831cbbff41c7a6bd807636a0c93d162ff0cc，workspace为当前仓库，attempts=1，started=2026-11-03T08:25:12.813Z，错误为MODEL_FAILED: Memory run did not finish (error)。无该事件的记录内effects；逐页扫描两级审计未找到该事件来源的事务。daemon日志为空，没有足够证据进一步诊断底层原因，不能断言它与实现无关或称维护成功。没有自动重试。当前服务running=true、protocol=3、active=[]、completed=88、failed=1、schedulerError=null；按既有队列协议，这个失败会阻挡同workspace后续维护，需明确检查和显式retry。该限制交给复审及最终交付，不隐藏或清除失败记录。

## TR-2授权恢复与当前结果

用户明确同意“补充错误诊断，并显式重试这个失败批次一次；成功后恢复积压维护，再次失败即停止”。未扩展为模型评测或测试套件授权。

补充agent.js失败消息：读取SDK AssistantMessage.errorMessage，限制到2000字符，并遮盖常见Bearer/sk-凭据模式；不读取或持久化完整消息/思考内容。缺失底层诊断仍明确说明。该分支通过语法及diff检查；本次恢复成功，未人为制造额外模型失败验证此分支，不能追回首轮丢失的底层错误。

重试前再次逐页检查user/project审计，都没有原失败事件来源事务；事件仍failed且attempts=1。共享服务active=[]，唯一queued事件被同workspace失败阻挡；空闲重载最新诊断代码，随后只调用一次显式retry。

- 事件37e20520447a979cfc18d595f7bb831cbbff41c7a6bd807636a0c93d162ff0cc：completed、attempts=2、error=null，2026-11-03T09:03:07.524Z开始、09:04:15.922Z完成。记录project事务36cccfca-1dac-4921-8857-ee75f9c40673，状态committed，事件source匹配且afterHash核对一致。
- 更新的既有chip为recall-first-index-design-reference，schema v2、revision=5，包含2个aliases、2个situations、1条topic路径。这是实际维护产生元数据的观察，不是语义召回率证明。
- 被阻挡的后续事件dd5f5dc4538bd3d088b56b6b30195310000407c2a3f60c8413b98cffcafb2310随后按正常队列完成，attempts=1、effects=[]、error=null。两个批次复用同一Memory Agent会话ec5d6614-3a0b-42ac-8fff-b4f783145c98。
- 最新服务running=true、protocol=3、active=[]、仅91条completed，无failed/queued或schedulerError。未第二次重试，没有删除失败来伪造恢复；第一次错误保留在上述证据。

恢复后重新逐文件核对当前manifest与chip：user 1/1/1，project 52/52/52；两级均published、pending=false、missingFiles=0、hashMismatches=0，检查前后generation一致。project basicCount=51、topicCount=2（一个主题路径及其父级），其余基础卡片仍完整可发现。原模型失败根因仍未知；本次证明正常维护已恢复，不声称已修复某个未经诊断的底层原因。

## TR-3前台升级指引修正

第三轮独立审查指出：前台bridge仅刷新store的原生CommonJS缓存，旧migration/service仍可能被复用。主Agent对照基线确认migration.VERSION=2、service要求protocol2；当前安装SDK的clearExtensionCache只清除其extensionCache，不删除这些原生缓存。因此此前“/reload或重启均可”的表述不成立，本文及历史日志中的该旧建议以本节为准。

采用最小方案，不新增依赖图热更新机制：docs/memory.md、agent-memory Skill及bridge的版本不匹配提示统一要求升级前已加载Memory模块的Pi退出并重新启动整个进程，再恢复原会话；仅/reload不够。后台重启不能替代前台进程重启，Agent未擅自关闭用户会话。本次不承诺跨版本热更新。

使用一个实际新Node进程（PID21486）读取当前依赖：storeVersion=3、migrationVersion=3、服务protocol=3且running，双级store version=3、published、pending=false。彼时队列93 completed、active为空，没有failed/queued。该观察验证新进程加载当前模块及读取能力，不是完整Pi UI会话验证，也没有声称旧进程通过/reload可恢复。

Pi全局tsc及diff检查通过；修改后agent-memory质量门0失败，预算警告2849估算tokens。未运行测试套件或模型实验。

## 静态检查与限制

所有Memory JavaScript、Web脚本、bootstrap及修改后的测试源码通过node --check。Pi扩展及lib通过tsc --noEmit（ESNext/Bundler/ES2022、skipLibCheck、allowImportingTsExtensions、esModuleInterop）。TR-2恢复后的复核使用已有全局tsc：项目本地node_modules/.bin/tsc入口不存在，没有新装依赖；全局命令实际完成且无错误。git diff --check通过。

agent-memory、agent-hooks逐包质量门均0失败，各有context-budget警告（2668、1923估算tokens）；为保留完整读写与失败约束接受这些警告，不通过删安全要求规避。

未运行测试套件、未测召回提升、未启动正式432次实验。升级前加载旧模块的前台Pi必须由用户退出并重启整个进程；仅/reload不足，后台重启也不能替代此步骤。程序只提供检索协议和结构保障，不证明Agent必然执行每一步或任意语义查询零遗漏。
