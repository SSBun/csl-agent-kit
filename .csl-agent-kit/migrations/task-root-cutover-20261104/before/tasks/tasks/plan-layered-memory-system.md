# 设计用户级与项目级分层记忆系统

| Field | Value |
| --- | --- |
| Status | In Progress (2026-10-30 15:45) |
| Artifacts | [Artifacts](../artifacts/plan-layered-memory-system/) |
| Kind | Task |

## Scope

实现已讨论的独立 Memory 子系统，覆盖 User/Project 存储、统一 CLI、派生索引、按需后台服务、独立 Memory Agent、Pi built-in hooks 接入、本地审计面板，以及旧知识一次性导入和旧机制替换。首版自动接入范围为 Pi，其他宿主后续扩展；服务与存储协议保持宿主无关。不引入 Core/Normal、专用 Pi 启动器或严格环境隔离，不防护本地文件修改绕过。不发布、不提交 Git，不改无关任务、规则或用户设置。按本会话确认的新版目标实现自动升级迁移：备份、去重、对账及恢复，不再逐次要求导入确认；不擅自删除原始资料。普通Agent退出不影响后台处理，用户级记忆不再逐条审批。

## Target

- [ ] T1: CSL Agent Kit 的记忆系统区分用户级与项目级作用域，明确各自保存和使用的信息。
- [ ] T2: Context 与 Lessons 的独立记忆机制由 Memory 完全替代，仍有效的旧知识一次性导入新 Memory；新系统不保留并行运行的旧读写维护流程或长期兼容层。
- [ ] T3: 所有纳入记忆系统的文件由用户级与项目级各自的 CSL Agent Kit 数据根目录中的专用 memory 目录承载，项目记忆可随所属仓库管理。
- [ ] T4: 记忆系统及记忆文件具有可识别的版本契约，读取、写入与迁移的兼容性边界明确。
- [ ] T5: 用户级与项目级记忆均由Memory Agent按读写规范自主维护，不要求用户级逐条审批；保留来源、适用条件、并发校验、审计与恢复，不将上下文隔离宣称为操作系统沙箱。
- [ ] T6: 存储与维护权限仅区分 user/project，不设置 Core/Normal。内容采用 fact/preference/experience/reference 四种主要类型，仅作为元数据辅助检索，不增加分类目录、不改变权限，也不因类型不匹配就排除相关记忆。
- [ ] T7: 每个记忆文件具有版本与文件 hash，写入能够识别并拒绝基于过期内容的覆盖，防止并发修改丢失。
- [ ] T8: 项目级记忆持续维护当前有效内容，而非仅追加历史记录。
- [ ] T9: 每轮完整回复后异步持久化可见会话增量；后台服务为每个workspace管理独立、可复用的Memory Agent会话，同workspace串行、不同workspace可并行；Task Agent不承担例行维护、不等待处理，后台可恢复未完成事件。
- [ ] T10: 有 Agent 激活并需要 Memory 服务时，存在的服务可被复用，不存在时按需启动；任务会话或终端关闭后，服务仍能继续处理已入队工作。
- [ ] T11: Memory Agent 使用独立于 Task Agent 的模型配置，用户可以通过命令单独配置该模型。
- [ ] T12: 用户级与项目级均提供精简索引，Agent使用普通read/grep/find工具自主按需读取Markdown；无需专用检索接口，索引过大时分页且不静默截断；读取不进入维护队列、不等待后台。
- [ ] T13: 项目级记忆可自动整理，但必须保留变更理由、差异与恢复能力；不因近期未使用就删除，不丢弃仍有效的独有信息。
- [ ] T14: 本地Web与CLI可观测各workspace的Memory Agent、处理状态、积压、失败、变更、来源与历史，并发起恢复；不以用户级提案审批作为日常维护的前置条件。
- [ ] T15: Memory 服务或模型故障不默认阻断主任务；可读取有效本地记忆并暂存能够持久化的维护事件，失败和延迟必须如实可见。
- [ ] T16: Memory 条目是权威内容，CLI 根据条目确定性生成并可重建索引；Memory Agent 不独立编辑索引。文件规范支持检索与渐进披露，Agent 无需先读取全部正文才能定位相关记忆。

- [ ] T17: agent-memory Skill仅定义读写规范，不包含预设主题、主题示例或分类模板；使用title表示动态主题，按主题聚合而非每个事实创建一个文件。
- [ ] T18: 文件及索引有明确大小预算和整理/分页行为；不以限制总文件数或总知识量丢弃有效内容，拆分与合并保持有效知识及来源。
- [ ] T19: 升级后用户级首次启动、项目级首次进入workspace时自动转换旧Context/Lessons；迁移有版本、备份、幂等性和中断恢复，正确对照已导入内容并退出旧读写维护入口。

## Decisions

### 当前生效决策（本会话完整Target经用户yes确认）

- 保留Markdown权威内容和user/project独立数据根，不引入数据库正文、固定主题或Core/Normal；title即主题。
- 新建agent-memory仅承载通用读写规范；普通文件工具读取，受控变更提交负责一致性，不强制专用检索接口。
- 两级均自动维护，取消用户级逐条审批；模型判断语义，程序保证版本、并发、审计、恢复。
- 后台服务独立于前台Agent存活，按workspace复用隔离会话，持续消费落盘增量；会话可重建，文件与队列才是持久权威。
- 自动升级迁移替代手动逐清单确认；保留原文及备份，不覆盖迁移后的有效更新，不重复导入此前48条。用户级首次启动、项目级首次进入时检查，不扫描全盘。
- 首版Pi自动接入；独立模型覆盖优先，否则使用Pi保存的默认模型；保留故障降级、审计面板和CLI管理，不静默换模型。
- 初始实现预算采用讨论建议：title最多60字符、summary最多200字符、正文目标4000字符/整理阈值8000字符；索引分页不丢内容。历史导入不得因新预算丢知识，先保真保存并标出待整理。
- 本轮不发布、不提交Git、不删除无关内容；未经当前请求明确授权不运行单元测试或项目测试套件。完成需实际自检与R2独立审查。

### 旧版决策记录（仅历史；与上方冲突的审批、检索、会话及迁移条款已被替代）

- 用户要求以新的多层 Memory 系统完全替代 Context 与 Lessons 机制，而不是扩展、包装或长期兼容旧机制。仍有效的旧知识一次性保真导入新格式，切换后再由 Memory Agent 持续整理；实际执行前展示准确迁移内容并取得确认，不将本轮实施请求视为未展示的资料删除批准。
- 用户已认可用户级与项目级分别存储的目录结构，而非将所有项目集中存储到单一用户目录。
- 用户级默认目录为 ["/Users/caishilin/.csl-agent-kit/memory/"](file:///Users/caishilin/.csl-agent-kit/memory/)，实际用户数据根仍遵循现有 CSL_AGENT_KIT_HOME 配置；当前项目目录为 ["/Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/"](file:///Users/caishilin/Desktop/personal/skills/.csl-agent-kit/memory/)。此处记录已认可的设计，不表示目录已创建。
- 用户已确认取消 Core/Normal 层级，仅保留 user/project 作用域。全部项目级记忆，包括原先属于 Project Core 的内容，都允许 Memory Agent 在来源、审计和恢复约束下自动维护；只有用户级修改必须明确授权。不能因项目内容重要就将其提升为全局记忆。
- 用户已确认第一版使用 fact/preference/experience/reference 四类，每个条目选一个主要 type；只写在元数据中，不增加分类目录、不影响作用域权限。检索时类型是辅助线索，不作排除相关记忆的硬过滤。
- Agent 的标准读写入口采用统一 Memory 接口，底层保留可读的 Markdown 文件。
- 权限采用 Prompt 与适当的 Memory CLI 约束，不要求操作系统级或严格执行环境隔离，不改变 Pi 的正常启动方式，也不防护本地文件修改绕过。Task Agent 自主读取但不承担维护；Memory Agent 自动维护项目级记忆，对用户级只提出待授权变更。
- 用户级修改前必须说明具体修改内容和理由，取得明确授权后才能执行；项目记忆提升为用户级同样需要授权。项目正式规则与决定仍以既有权威来源为准，修改记忆不能擅自改变它们。
- 文件保存内容修订号；读取接口根据返回正文对应的同一份完整文件字节计算并返回 hash，不将完整文件 hash 嵌入文件自身。写入时在锁内重新核对版本与 hash，拒绝基于过期内容的覆盖；系统版本和 Schema 字段形式仍待细化。
- 两级记忆都使用索引文件：启动先加载简短索引，正文由 Task Agent 经统一接口自主、并发、按需检索读取；索引过大时分页或搜索，不静默截断。Memory Agent 专注后台维护，读取不进入维护队列；用户级记忆不因修改保护而全文常驻。
- 用户已确认条目是权威来源，索引由 CLI 根据条目元数据确定性生成和重建，不由 Memory Agent 独立编辑；用户级索引只反映已批准的内容。具体必填字段与加载预算仍待细化。
- 项目级记忆持续维护当前有效内容，不采用仅追加事件历史的模式。可自动合并重复内容、移除有证据证明已失效的内容和删除空文件，但须保留理由、diff 与可恢复版本；历史不参与日常检索。不得仅因近期未用而删除，也不得丢弃仍有效的独有信息。
- 记忆维护职责从 Task Agent 移出：通过 built-in hooks 触发编排器，调用独立 Memory Agent，根据会话和 response 判断、决策记忆更新。Task Agent 不承担日常记忆候选识别或更新流程。
- 每轮完整回复结束后投递事件，后台异步处理未消费的会话增量；允许合并事件，Task Agent 不等待维护完成。
- 同一项目的多会话共用维护队列并串行执行，不同项目可以并行；排队维护不限制任务会话自身的并行工作。
- 编排器持久保存事件和处理进度；Memory Agent 每批以全新上下文独立执行，需要时可以回查相关历史，不维持长期 Agent 对话作为状态权威。
- 采用独立于任务会话的本机用户级后台服务：Agent 激活且需要 Memory 时检测服务，无服务则按需启动，有服务则复用。关闭任务会话或终端不终止已入队工作的处理。
- Memory Agent 使用服务独立的模型配置，不沿用触发会话的临时模型；用户已确认默认使用 Pi 的默认模型。未设置 Memory 覆盖时读取 Pi 用户级保存的 defaultProvider/defaultModel；设置独立覆盖后优先使用覆盖，reset 恢复跟随 Pi 默认。CLI 为 memory model show/set/reset，不修改 Pi 设置；模型不存在或不可用时明确失败，不静默切换。
- 首版包含本地 Web 审计面板及 CLI：面板按项目、任务或会话展示处理状态、自动修改的 diff/理由/来源、受保护提案的批准或拒绝及历史恢复；CLI 用于打开面板、状态查询和模型配置。界面和 CLI 提供工作流级授权约束，不承诺不可绕过的操作系统安全边界；Memory Agent 自行调用批准操作不构成用户明确授权。
- 首版先接入 Pi，验证完整读写、后台维护、审计审批与 CLI 权限约束链路；Codex、Claude Code 等后续扩展，不纳入首版接入承诺。
- Memory 服务或模型暂时不可用时降级继续：Task Agent 仍可通过统一 CLI 读取可用且格式有效的本地记忆，可持久化的维护事件先排队，恢复后处理。明确展示延迟或失败，不虚报成功、不擅自切换模型；无法保存事件时报告未入队，不承诺自动补处理。
- 文件规范优先服务于检索与渐进式披露；四类 type 和派生索引机制已确定，其他必填字段、摘要和正文分段契约仍待收敛。
- 用户已确认讨论的流程并请求开始实现。结束 task-grill，继续同一记录的实现阶段；数据迁移预览与确认、用户级记忆授权、验证和审查要求仍然保留。尚未实际验证模型调用与后台运行，不把文档能力或规划当成已实现结果。

## Plan

1. 先固定本轮改动基线，核对并更新Topic规范与任务绑定，保留其他会话的既有修改。读取Pi SDK及相关规则，预检独立审查能力。
2. 实现agent-memory规范、Markdown主题预算与分页索引、两级自动维护及旧数据版本迁移；保留来源和恢复能力，避免把此前48条重复导入或覆盖。
3. 将后台改为workspace隔离可复用会话，完善状态与恢复，接通Pi首次使用自动迁移及退出后处理链路；任务读取走普通文件工具。
4. 完成Web/CLI观测与恢复入口、旧Context/Lessons消费者替换和包分发表面同步。旧原文保留备份，旧机制不再作为并行维护来源。
5. 运行允许的语法/类型/质量与隔离环境行为检查，逐Target记录证据；完成R2独立task-review、必要修正与最终验证。测试套件未经授权不运行，无法满足的验收明确Blocked。

## Execution Log

### 001 — 用户请求进入实现

用户确认已讨论流程并请求开始实现，沿用本记录，不另建任务。已恢复任务并绑定当前会话。此时本任务仅维护了任务记录，尚未修改产品代码、创建 Memory 存储、运行服务或迁移旧资料；后续不得将已讨论的方案或查阅的文档能力当作实施证据。

### 002 — 从工具接口丢失的会话接管

用户要求当前会话读取原会话并接管工作。已恢复并聚焦本记录，核对原会话 01a18778-0aaa-71a0-abc9-b46cf09ebb31 的用户消息、完整实现 Target 与调用记录：第 318 行展示完整 Target，第 321 行用户明确回复“确认开始执行”，与当前 Scope/Target 一致，无需重复确认。第 347 行原生压缩后工具调用停止；原会话的 edit 仅修改本任务记录，未启动实现子 Agent。当前 git status 中的既有修改与原会话开始实现前的状态相符，不能归为 Memory 实现成果。

接管时仍处于实现准备阶段，尚无 Memory 产品代码或迁移结果。本次仅更新接管日志，保留原会话；后续从存储与统一 CLI 开始，保留原有迁移预览确认、用户级授权、不发布及未经当前请求明确授权不运行测试的边界。

### 003 — 存储与 CLI 首批实现

新增 bin/memory/store.js 和 cli.js，并在 bin/csl-agent-kit.js 接入 memory 命令。实现两级目录、Markdown 条目、四种 type、revision/SHA256 条件写入、确定性索引、分页与全文检索、提纲与章节读取、用户级提案与交互审批、before/after 审计、删除墓碑、恢复提案及 pending 事务收尾。写入采用短期排他锁与原子替换，读取不进入维护队列。recover 只处理能够证明已经退出的同机 writer，未知锁不自动删除。文档位于 docs/memory.md，明确当前只是存储阶段，不声称后台、Pi 或迁移已经完成。

新增 tests/memory-store.test.js 覆盖上述边界，但没有执行单元测试或项目测试套件。对三个实现文件和测试源码执行 node --check，均通过；git diff --check 通过。在 /tmp/csl-memory-smoke.yqONZ7 隔离目录实际通过 CLI 写入中文条目、读取索引/提纲/章节、查询历史和运行无 pending 的 recover；重复创建返回 CONFLICT，用户级直接写入返回 APPROVAL_REQUIRED，非法 ID 返回 INVALID_ID；用户级提案创建成功但普通索引仍为空，非交互批准返回 HUMAN_CONFIRMATION_REQUIRED。没有修改真实用户记忆或项目 Memory，没有迁移旧资料。尚未完成真实崩溃/多进程竞争、交互批准及独立审查，当前不得宣称完整系统可用。

### 004 — 后台 Agent 能力差异

只读导入项目安装的 @earendil-works/pi-coding-agent，实际版本 0.80.6，createAgentSession 可用但 ModelRuntime 未导出；本机 CLI 是 1.4.0，其 SDK 文档使用 ModelRuntime。不能直接照搬当前宿主示例并声称后台 Agent 能运行。下一阶段须统一依赖与 API 使用，并明确独立 Memory Agent 的初始 provider/model 后再进行真实模型调用；当前未启动后台服务、未发起模型请求。

### 005 — 默认模型采用 Pi 配置

用户确认默认使用 Pi 的默认模型。新增 bin/memory/model-config.js 与 memory model show/set/reset：未覆盖时读取 Pi 用户级默认，独立配置优先；不读取任务会话的临时切换、不修改 Pi 设置。真实配置只读 show 返回 openai-codex/gpt-6-astra、source=pi-default；隔离临时目录中 set/show/reset/show 验证覆盖优先级与恢复默认成功。三个相关实现文件 node --check 和 git diff --check 通过；未运行测试套件，未发出模型请求。

进一步核对项目 SDK 的 ModelRegistry.find，当前 SDK 0.80.6 未注册本机默认 gpt-6-astra，不能据配置解析成功就宣称后台可运行。接下来需统一 SDK 依赖/API 并接入后台服务；此处没有更换默认模型或私自写入用户的模型覆盖。

### 006 — SDK 升级与后台链路

通过 npm install --save-peer --ignore-scripts 将 Pi coding-agent/pi-ai peer 下限设为 ^1.4.0 并更新锁文件，实际安装均为 1.4.0。ModelRuntime 能识别默认 gpt-6-astra；createMemorySession 成功创建无持久 sessionFile 的独立会话，实际工具为 read/grep/find/ls/memory_list/memory_read/memory_apply，没有 shell、普通文件编辑或审批接口。SDK 升级引出的 TypeScript union 收窄问题在 csl-context-hooks 与 task overlay 做了最小修正；全体 pi/extensions/*.ts 和 pi/lib/*.ts 使用 tsc --noEmit 通过。

新增 runtime-files、queue、agent、service、daemon：用户根中持久事件与状态，项目串行及最多两个项目并行，显式失败重试，已有 effects 保留，工具失败不被最终文字掩盖，按需启动及正常停止。模型身份显式核对，不跟随任务临时切换、不静默降级。新增 memory service/enqueue/jobs/job/retry/dashboard 命令。

在独立临时 home 启动服务，提交 b70a3d332101e8861b9a04dc801edda5f49da02137acd9b5d5af1a98ea2dde90 临时事件；真实默认模型调用成功，attempts=1、status=completed，模型报告无值得保存的内容。随后实际查询确认用户记忆仍为空、项目审计仍只有前一阶段的手工冒烟记录；重复投递返回 duplicate=true，attempts 仍为1。服务曾正常停止并重启，最后已发送正常 stop 清理临时后台进程。没有向模型发送真实用户会话资料，也没有改真实 Memory 数据或激活项目。

### 007 — 面板与 Pi 定向 hook

新增本机 HTML/CSS/JS 审计面板及 API，提供队列过滤/分页、输入与处理状态、变更前后全文、提案 digest 审批和恢复提案。隔离服务的静态页面与脚本返回200，无 token 的 API 返回401，带授权 jobs 返回200，跨站 Origin 返回403。Ego Lite 页面导航命令在30秒超时，随后只读 task-space 状态查询也在15秒超时；未改用其他浏览器绕过，浏览器视觉与实际点击验证未完成，无法确认是否留下了浏览器 task space。

新增 memory-bridge，由原 CSL context hooks 注册，仅在有效项目激活标记存在时启动。agent_settled 通过 runEvent 的 onlyHooks 选项只派发 inner:memory-maintenance，不重复执行其他 stop hooks。memory-enqueue 脚本使用 stdin 传递增量，持久入队后立即返回，不等待模型。隔离环境对已有事件实际执行定向 hook，diagnostics为空且无重复模型调用。agent-hooks show 验证规则有效/可执行/宿主支持；这不代表真实项目已激活。轮询状态显示失败、待处理与未入队，不把已入队当作已维护。

### 008 — 当前检查与未完成门禁

新增 tests/memory-runtime.test.js，并将两个 Memory 测试文件接入 test:memory 和主 test 命令，但未运行任何单元测试或项目测试套件。实现文件、测试源码语法检查、全体 Pi TypeScript 类型检查及 git diff --check 通过。agent-hooks Skill Quality 为0失败、1条 context-budget warning（1795估算tokens），为保留流程完整性接受该预算警告，不据此删减契约。Context 增加源码支持的 Memory 边界 Pack，validate通过；原有3处非索引章节 warning 保留，不自动清理。

npm audit --omit=dev 报告4个依赖项告警（2中、2高），涉及 pi-coding-agent/undici、ip-address、sharp；旧锁文件同样包含受影响版本，未执行无关的大范围 audit fix。正式交付需披露并审查其影响。当前仍缺浏览器交互验证、多进程/故障恢复充分证据、旧资料迁移预览与确认、旧消费者切换和 R2 独立审查；不得宣称整体完成。

### 009 — 迁移预览与条件导入实现

新增 bin/memory/migration.js，接入 migration preview/review/inspect/report/status/apply。预览固定读取旧 Context/Lessons 源，包含完整原文和源 hash，按围栏之外的二级标题覆盖所有单元，未被旧索引收录的段落和前言也不能遗漏。逐项 import/archive 需要理由及依据，pending 阻止应用；review 支持元数据局部更新及基于原正文的唯一、不重叠精确替换。导入只允许 Project，核对完整预览 SHA256、workspace、源集合/字节和目标冲突；在写锁内保存原文快照，再经正常审计写入。重复执行同一预览不重复导入，未登记的已提交写入可由审计识别；部分失败保留 effects，不声称跨文件原子回滚。原文件不删除，激活标记不创建。

已完整读取两份旧源并整理50个单元，拟导入48条、仅备份2个纯容器标题。原索引遗漏的 Components/Relationships/Decisions and Conventions 全部覆盖。将取消的 Core 与独立 Context/Lessons 维护要求改写为新 Memory 的知识/经验边界，修订委派授权旧概括、本机过时链接状态、用户数据目录旧范围等，逐项注明理由。实际只读发现历史 .agents/AGENTS.md 链接目标不存在，仅修订迁移候选中的旧事实，没有修复或修改该用户链接。

准确清单为 [迁移清单](../artifacts/plan-layered-memory-system/specs/migration-reviewed.json)，用户阅读版为 [迁移预览](../artifacts/plan-layered-memory-system/specs/migration-preview.md)，逐项理由与修改输入为 [审核输入](../artifacts/plan-layered-memory-system/specs/migration-decisions.json)。预览身份 3e5a0b293d2275e9b93d7564396eeb81c462bdb86d750d3213a38f5c5d02ea42；Context 源 hash 为976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0，Lessons 源 hash 为9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6。这里的审核是当前 Agent 的整理，不是用户批准或独立审查。真实项目 migration status 为 not-started。

### 010 — 迁移 CLI 的隔离观察及暂停边界

在 /tmp/csl-memory-migration.zGSLMh 的合成源实际执行 preview/review/apply/status：围栏内标题没有误分，错误确认摘要返回 CONFIRMATION_REQUIRED；准确确认后创建1条记忆、归档1个容器标题；源文件仍在且与备份 SHA256 相同；重复 apply 返回 duplicate=true，审计条数仍为1、revision仍为1、无激活标记。另生成新预览后改动合成源，apply 返回 SOURCE_CHANGED，没有新增审计。新增 tests/memory-migration.test.js 并接入 test:memory，但未运行单元测试或项目测试套件。

本轮再次只读探测浏览器工具，ego-browser 已显示 command not found；其本机命令链接仍存在但目标不可执行，未安装、升级或改用其他浏览器。UI 验证限制仍在，但不阻断迁移工具实现。尚未修改真实 Context/Lessons 或真实 Memory 条目；为保留待确认预览的源身份，本轮不更新 Context 正文，一次性迁移进度只记录在此任务。

下一步是用户明确确认准确导入预览；这不是重新确认整体实现 Target。旧消费者退出和最终独立审查仍未完成，不标记任务完成。

### 011 — 获准导入并验证48条项目记忆

用户对已展示的 Safety Confirmation 明确回复 yes，批准按 3e5a0b293d2275e9b93d7564396eeb81c462bdb86d750d3213a38f5c5d02ea42 清单导入，边界是只写 Project、保留原文件和完整备份、不自动激活。执行前再次核对两份源文件与预览文件 SHA256，全部与确认范围一致，状态为 not-started；随后调用 migration apply，返回 imported、48笔提交及2个仅备份的容器标题。

随后逐条读取48条新记忆，对照已批准标题、摘要、type、sources和正文，contentMismatches为空；48个文件 hash 全部与迁移登记一致，索引与从有效条目重新推导的内容相同。审计总数48且全部 committed，没有 pending 事务；两份原文件与完整备份均匹配预览源 hash；activation marker 不存在。没有执行测试套件，也没有修改用户级记忆、删除旧资料或启动真实项目自动维护。源和快照的完整性已复核，不据此声称整个 Memory 系统或旧机制退出已经完成。

### 012 — 新版完整目标确认并进入实施

本会话用户逐步明确Markdown直读、title主题聚合、只含读写规范的agent-memory、两级自动维护、workspace独立复用会话、后台生命周期与观测、升级自动迁移以及文件预算；随后对完整新版Task Target回复yes。已恢复并聚焦原实施记录，Kind改为Task，更新当前Target与Plan，旧决策保留为明确标记的历史。现有代码仍是旧版审批/每批新会话，不能据旧观察宣称新版通过。

### 013 — 新版运行时首批修改与隔离观察

已新增agent-memory读写规范；Store允许user/project自动提交，增加写作预算和不可变代际分页索引；新增自动版本迁移、旧导入逐单元识别；Agent改为workspace会话池，普通文件读取加受控写入；后台状态及Web恢复入口已开始调整。语法检查通过，agent-memory质量检查0失败/1预算警告（1506估算tokens）。这些是阶段性代码，不代表全系统验收。

在隔离临时根中实际调用CLI：自动导入3个合成项目单元（围栏内标题未误分），重复升级返回current；用户级自动导入合成旧资料后直接put成功，无审批；再次使用0/null返回CONFLICT及当前版本/hash。paths返回两级根与预算。未运行测试套件，尚未验证全部并发/崩溃窗口、真实模型复用、UI交互或消费者退出；真实项目与真实用户数据尚未升级。

### 014 — 真实两级存储升级与完整性核对

用户再次要求继续完成系统，并询问面板入口。已告知正式命令 `csl-agent-kit memory dashboard --open`；本轮未代用户打开浏览器或宣称整体完成。

实际项目升级预览识别47个已导入单元、2个已归档容器，以及1个在此前导入后发生变化的Task工作流单元。执行自动升级后，原48个条目的完整文件hash全部不变，新增1条保真记录，总计49条；变更单元作为待后续合并的独立版本保留，没有覆盖原知识。再次升级返回current。逐一核对两份旧源与本次备份的SHA256，均与迁移登记一致。用户根没有发现待转换旧源，升级完成且effects为空。没有启动真实会话维护或向模型投递用户资料。

此前隔离模型会话复用、第二工作区隔离、面板实际恢复、质量门警告和临时服务清理见[运行观察](../artifacts/plan-layered-memory-system/evidence/v2-runtime-observations.md)。本轮migration语法检查及git diff --check通过。最终收尾仍需故障恢复/并发及宿主接入回归、逐Target自检与R2独立审查；现有禁止未经明确授权运行测试的边界仍有效，不能把静态检查当作回归通过。

## Task Summary

**Memory 运行时与 CLI**：[bin/memory](../../bin/memory/) 新增存储、条件写入、提案、审计恢复、模型配置、持久队列、独立 SDK Agent、detached 服务、本机审计面板及源 hash 绑定的迁移预览/导入；根 CLI 接入相应命令，未覆盖时使用 Pi 用户级默认模型。

**项目记忆数据**：[.csl-agent-kit/memory](../../.csl-agent-kit/memory/) 按用户确认的准确预览导入48条项目级记忆，生成可重建索引、48笔审计和完整迁移快照；保留原文件，未激活自动维护。

**Pi 接入**：[pi](../../pi/) 新增激活门控的 Memory bridge、可见增量游标和服务状态；context hooks 注册 bridge，并修正升级 SDK 所需的消息类型收窄；task overlay 增加 taskId 类型守卫。

**Agent Hooks**：[skills/meta/agent-hooks](../../skills/meta/agent-hooks/) 新增 inner:memory-maintenance 与入队脚本，runEvent 支持定向派发，不重复其他 stop hooks。

**依赖与验证入口**：[package.json](../../package.json) 提高 Pi SDK peer 下限并加入 Memory 测试入口，锁文件同步；[tests](../../tests/) 新增存储、后台队列/配置和迁移用例源码，未执行测试。

**说明与项目知识**：[使用说明](../../docs/memory.md) 记录存储、服务、模型和激活边界；[项目 Context](../context.md) 新增源代码支持的 Memory 组件 Pack，保留无关既有内容。
