---
title: 任务与协作
summary: Task、Plan、Queue与长期Topic的职责、目标及安全确认表达、证据失效和协作审查；界面展示归交互主题。
---

- [2026-11-06] task管理单一可验收结果，task-plan调查并交接后续实现，task-queue串行子任务及集成验收；Topic是可选共享规格，不是第四执行族。计划Target接受不授权执行；独立可验收分析也走Task。权威为各技能及csl-tasks共享对齐/风险协议，共享协议不参与技能发现。
- [2026-11-06] 新结果 MUST 建新任务，明确执行已有计划复用原记录，同组件不建立ownership。任务正文权威、索引导航，MUST 仅修改所属记录和精确索引项；路径由活动根解析，不批量迁移历史。Queue父子/兄弟标题互异，重开完成child先激活parent并失效集成证据。core不保存会话对齐或启动验证/嵌套宿主；Kind Auto仅兼容旧记录，新建用Queue。持久计划不强制宿主plan mode或subagent。
- [2026-11-06] Target是唯一checkbox并使用稳定Tn；Plan写当前步骤，Result写逐Target证据。Execution Log记重要发现、决定和结果，恢复时 MUST 核对实际产物；JSON recovery仅兼容旧字段，缺日志不证明动作未发生。规格、Result、日志、相关产物或Queue关系变化会失效证据，审查冻结范围。快照只证明登记范围在检查时的身份，不证明语义风险、隔离、检查执行或完整范围；Task Summary和自评契约查Task技能，CLI不强制自评存在。
- [2026-11-06] R0/R1免独立审查 MUST 有当前assessment且无显式或既有义务；R2 MUST 使用fresh只读task-review，失败Block，MUST NOT 降级或自审冒充。adversarial-review仅显式请求，R2仍先普通审查。Finding是证据化问题，Required Outcome决定关闭；Suggested Remedy可调整或拒绝，关闭依据是结果满足或问题被证伪。
- [2026-11-06] finding连续两轮无实质进展则Block，不设总pass上限；最终ledger清理由review passed --resolve-ledger --snapshot原子完成，每轮反馈存Review Reports，不手删账本绕过。证据登记、恢复与finalize边界查Task及task-evidence/task-reports。
- [2026-11-06] Task回归入口为csl-tasks-core及task-files测试，源码存在不证明执行通过。三维自评和证据留记录，默认不向用户展示等级，明确要求除外；重要验证、风险、局限和未完成事项仍报告。读取当前Memory，不恢复Context/Lessons日常工作流。
- [2026-11-06] 用户取消轮次、次数或预算等限制时，只移除点名限制，保留流程；只有明确停止整个流程才终止。
- [2026-11-05] 对抗审查的BLOCKER MUST 有违反要求、证据、风险和Required Outcome；QUESTION只问缺信息，NOTE非阻塞。排除纯偏好、顺手重构和推测需求；Editor选择满足结果且范围更小、成本更低、假设更少的修复。每轮覆盖完整scope与既有finding，不刻意分批释放；新问题说明新证据或此前不可行动原因。不中途写报告，账本交接，结束/暂停写唯一任务报告；用户决定或客观停滞时暂停，不能普通复审绕过。
- [2026-11-05] 答案形成和方案讨论使用Synthesizer/Challenger等职责名；Editor/Reviewer用于成稿修改与验收，不能因拓扑相似混用阶段语义。
- [2026-11-07] Topic是跨任务共享规格，不限多平台，不等于Task Kind或Queue父子关系；成员完成不自动归档。Active不证明规格完整或执行授权；正常状态Active/Archived，旧Draft仅兼容读取或显式激活。维护模式不绕过Archived/Draft实现限制；归档仅可豁免明确指定且关联fresh的当前归档维护任务，其他活动或不可访问成员仍阻止归档。
- [2026-11-07] Topic以topic技能及共享实现为准，存于唯一活动Task根，不双写；规范快照不可变，成员状态现场读。Task binding是正式归属权威，member为反向索引；history只引用旧任务，不建立绑定、修改证据或要求完成任务reopen，不参与归档门禁，缺失仅警告。旧JSON-line Tasks仅显式format所选Topic。
- [2026-11-07] Topic Resources放跨任务资料，任务记录放Tasks，专属产物留任务；已有资料原地引用。update-resources替换索引，不搬移/删除文件或初始化旧记录。normative固定摘要参与规格和freshness；reference默认不参与，同源另列Dependency除外。HTTP(S)仅无凭证引用，CLI不抓取；外部规范先取获准本地副本。
- [2026-11-07] Topic规格变化先影响分析并adopt，失效旧assessment/verification且保留Required审查，不改历史Completed；成员列表与状态不入规格摘要，过期仍可记录Failed或取消。写入前完整解析/round-trip、whole-file版本核对和工作区锁。跨仓 MUST 有授权及allow-cross-workspace、核实Git根和origin，不猜测或自动修复。关联失败保留pending并据binding修复两侧；detach不绕终态门禁，多文件回滚不保证分布式崩溃原子性。check仅查列出的结构和成员，freshness另报，不证明历史符合现规或发现跨仓遗漏。
- [2026-11-10] 常规Task Target确认 MUST 仅含完整目标及一句确认问题，MUST NOT 附带依据、协议原文、Skill来源或流程解释；MUST 保留真实阻断、必要权限及更高优先级披露。L4变更清单依现规；精简不取消确认。confirm安全确认 MUST 暂停依赖执行，展示动作、对象、后果和一句确认问题；MAY 省略阻断原因、规则名及来源，更高优先级要求除外。
