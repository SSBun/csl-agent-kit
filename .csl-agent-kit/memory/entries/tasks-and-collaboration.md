---
title: 任务与协作
summary: Task、Plan、Queue与长期Topic的职责、目标及安全确认表达、证据失效和协作审查；界面展示归交互主题。
---

- [2026-11-06] task管单一可验收结果，task-plan调查交接实现，task-queue串行子任务并集成验收；Topic为可选共享规格，非第四执行族。接受计划Target不授权执行；独立可验收分析也用Task。技能及csl-tasks共享对齐/风险协议为权威，共享协议不参与技能发现。
- [2026-11-06] 新结果 MUST 建新任务；明确执行已有计划复用原记录，同组件不建ownership。正文权威、索引导航，MUST 仅改所属记录和精确索引项；路径按活动根解析，不批迁历史。Queue父子/兄弟标题互异；重开完成child先激活parent并失效集成证据。core不存会话对齐、不启动验证/嵌套宿主；Kind Auto仅兼容旧记录，新建用Queue。持久计划不强制宿主plan mode或subagent。
- [2026-11-12] Target为唯一checkbox，使用稳定Tn；Plan写当前步骤，Result写逐Target证据，Execution Log记重要发现、决定、结果。恢复时 MUST 核对实际产物；缺日志不证明未行动。JSON恢复字段以当前CLI为准，旧「仅兼容旧字段」描述已不适用。规格、Result、日志、产物或Queue关系变化使证据失效，审查冻结范围。快照仅证明登记范围检查时的身份，不证明语义风险、隔离、检查执行或范围完整；Task Summary/自评契约查Task技能，CLI不强制自评存在。
- [2026-11-06] R0/R1免独立审查 MUST 有当前assessment且无显式或既有义务；R2 MUST 用fresh只读task-review，失败Block，MUST NOT 降级或冒充自审。adversarial-review仅显式请求，R2仍先普通审查。Finding为证据化问题，Required Outcome决定关闭；Suggested Remedy可调或拒绝，关闭依据为满足结果或证伪问题。
- [2026-11-06] finding连续两轮无实质进展则Block，无总pass上限；最终ledger由review passed --resolve-ledger --snapshot原子清理，反馈存Review Reports，不手删账本绕过。证据登记、恢复及finalize边界查Task与task-evidence/task-reports。
- [2026-11-06] Task回归入口为csl-tasks-core/task-files测试，源码存在不证明通过。三维自评与证据留记录，默认不展示等级，明确要求除外；仍报告重要验证、风险、局限与未完成项。读取当前Memory，不恢复Context/Lessons日常流程。
- [2026-11-06] 用户取消轮次、次数、预算等限制时，仅移除点名限制并保留流程；明确停止整个流程才终止。
- [2026-11-05] 对抗审查BLOCKER MUST 含违反要求、证据、风险、Required Outcome；QUESTION问缺信息，NOTE非阻塞。排除纯偏好、顺手重构、推测需求；Editor选满足结果且范围小、成本低、假设少的修复。每轮覆盖完整scope及既有finding，不分批释放；新问题说明新证据或此前不可行动原因。不中途写报告，以账本交接，结束/暂停写唯一任务报告；用户决定或客观停滞时暂停，不用普通复审绕过。
- [2026-11-05] 答案形成/讨论用Synthesizer/Challenger等职责名；Editor/Reviewer用于成稿修改/验收，不因拓扑相似混用阶段语义。
- [2026-11-07] Topic为跨任务规格，不限多平台，不等于Task Kind或Queue关系；成员完成不自动归档。Active不证明规格完整/执行授权；正常状态Active/Archived，旧Draft仅兼容读取或显式激活。维护模式不绕过Archived/Draft实现限制；归档仅豁免明确指定且关联fresh的当前归档维护任务，其他活动/不可访问成员仍阻止归档。
- [2026-11-07] Topic以topic技能及共享实现为准，仅存唯一活动Task根；规范快照不可变，成员状态现场读。Task binding为归属权威，member为反向索引；history仅引用旧任务，不绑定、不改证据、不要求完成任务reopen、不参与归档门禁，缺失仅警告。旧JSON-line Tasks仅显式format所选Topic。
- [2026-11-07] Topic Resources存跨任务资料，Tasks存任务记录，专属产物留任务；已有资料原地引用。update-resources替换索引，不搬删文件或初始化旧记录。normative固定摘要参与规格/freshness；reference默认不参与，同源另列Dependency除外。HTTP(S)仅无凭证引用，CLI不抓取；外部规范先取获准本地副本。
- [2026-11-07] Topic规格变化先影响分析/adopt，失效旧assessment/verification，保留Required审查，不改历史Completed；成员列表/状态不入规格摘要，过期仍可记Failed或取消。写前完整解析/round-trip、whole-file版本核对及工作区锁。跨仓 MUST 有授权与allow-cross-workspace、核实Git根/origin，不猜测或自动修复。关联失败保留pending并据binding修两侧；detach不绕终态门禁，多文件回滚不保证分布式崩溃原子性。check仅查列出结构/成员，freshness另报，不证明历史合规或发现跨仓遗漏。
- [2026-11-11] Task Target确认 MUST 仅完整目标及一句问题；MUST NOT 主动附原因、模式、依据、流程、协议/Skill、内部阻断原因、规则名/来源；仅用户明确询问时 MAY 回答，后续 MUST NOT 例行重复。偏好不覆盖上级指令，未验生效。MUST 保留真实阻断、权限、必要确认及L4清单；confirm MUST 暂停依赖执行，展示动作、对象、后果及一句问题。
- [2026-11-12] 会话报告暂停入口要求完整恢复摘要，与Paused状态一并写入原任务，CLI JSON返回恢复字段；暂停和恢复均使旧验证失效，保留Required审查及未解决问题。临时工作区CLI验证报告审查中暂停保留Required义务，Queue不跳过暂停子任务，摘要可完整回读，复制任务与成果到另一目录后新CLI进程可恢复原任务；这是会话报告，本批未独立核验，MUST NOT 等同真实第二台电脑、全新Agent完整接续、运行中Pi界面或最终验收通过。未运行单元或项目测试套件；恢复资料与跨机依赖边界见项目基础信息。
- [2026-11-13] 主动搁置Task时 MUST 保存完整恢复摘要，通过pause入口将原任务设为⏸️ Paused，并回读状态、摘要和索引后才能报告成功；MUST NOT 用Pending或仅停止工作代替暂停。会话报告pause、suspend、stash共用该入口；仅暂停时 MUST 维护原任务，MUST NOT 先恢复或重开，Completed、Blocked、Cancelled及已Paused分别处理。运行时保留 `In Progress → Pending`，Pending仍表示待执行，不表示暂停；没有Suspended状态，Completed通过reopen回到In Progress，不能普通resume。暂停/恢复保留按名称定位、原身份、Required审查和未解决问题，旧验证不能直接复用。会话报告运行时、命令入口及Agent指引已按状态图统一；本批未独立核验实现，真实Agent自然语言回放及旧会话加载仍未验证。诊断仅搁置未暂停时 SHOULD 核对实际加载技能与工具调用，MUST NOT 把旧版技能仍在加载或未遵循说明判定为已确认根因；原截图问题根因仍未确认。
