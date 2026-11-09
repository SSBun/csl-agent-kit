# 让 L2 Task Target Guard 更智能

Status: Completed (2026-09-08 14:55)
Kind: Plan

## Scope

- Included: 实施最新的 L2 条目级确认继承方案，同步共享协议、评测 fixture／scorer、静态契约和必要说明，保留明确依据的来源、适用范围和失效边界。
- Excluded: 运行测试或付费模型评测，全面取消 L2 等待、扩大 L0、放宽 Queue／Safety 边界，修改 task core schema、任务状态机或 Pi UI，新增全局确认数据库。

## Target
- [x] T1: 主会话的首次明确请求、完整用户修订及澄清收敛后，非平凡等价 Target 的条款均有当前有效的明确用户依据时，展示后继续而不重复确认。
- [x] T2: 仅部分等价验收解释尚未直接确定时，只核对该部分并完整继承已定约束；事实证据、失效或跨范围依据及组合产生的新效果不会被误当作有效授权。
- [x] T3: L3 用户歧义、L4 授权变化、S1 独立安全门、material Plan graph checkpoint、确认依据无法恢复时的门禁，以及任务核心与完成状态模型保持不变。
- [x] T4: 共享协议、评测、静态契约和必要说明对新语义保持一致，评测能够区分 Target 可见性、重复等待及错误继承。

## Decisions

- 用户已要求执行最新优化，工作范围从只读建议转为上述实施结果；不包含测试运行或付费模型评测。
- 优化前共享协议已有逐 commitment atom 的 Authorization Ledger 和 source message；免重复确认主要覆盖整个已接受且未变化的 Target，完整用户修订和 material Plan graph 变化仍要求新 checkpoint。本次只扩展有效条款依据覆盖的 L2 路径，保留 graph 门禁。
- 事实证据与行动授权必须分开。Context 和源码能够支持项目事实，不能证明用户同意修改、删除、上传或扩大目标；Agent 写入的 Decisions 或完成勾选本身也不是用户接受证据。
- 保持 L3 用户歧义、L4 承诺差异、S1 独立安全边界，以及规划不授权执行和 delegated child 返回主会话的规则。不能把模型置信度或文本相似度当作已确认依据。

## 实施方案

### P0：条目级确认继承

- 优先扩展既有 Authorization Ledger，不建设新的全局记忆或确认数据库。每个待复用条目保留简短语义、可恢复来源、适用对象／范围和使它失效的相关变化。
- 本次用户直接表达的确定条款，以及此前明确接受且本次仍适用的条款，进入“已确定”集合；未接受的 Agent 建议、从宽泛意图推导出的验收解释、过时或无法恢复的摘要不能进入该集合。
- 已证实的技术事实，如既有框架或存储方式，通常留在 Context／Plan，不作为待用户批准的 Target 条款。若用户明确要求保留某行为，它才是应从用户授权中追踪的承诺；“当前如此”不自动变成“必须如此”。
- 待核对集合只包含尚无有效确定依据的结果承诺。部分条目已确定时，只询问剩余部分，其他条款作为不可静默丢失的继承边界；没有剩余项、整组承诺仍等价且当前阶段已获授权时，才免除这次 L2 等待。这比所有等价 Target 一律直行更窄。
- 对首次归纳但尚未直接给出或接受的等价验收解释，仍保留 L2，并指出具体待核对项；仅改变措辞或排版不产生新项。如果剩余项其实是用户决策歧义或承诺变化，分别走 L3／L4，而不是用局部确认模糊它们的授权语义。
- 第一版免重复确认只覆盖主会话的首次明确请求、完整用户修订及澄清答案收敛后的 Target。保留 material Plan graph change 返回主会话并执行现有 checkpoint 的规则，不把 Target 条款已定当作批准新分发图；确认来源无法恢复时也不扩展跨会话免确认。

### P1：定向失效与证据恢复

- 复用前同时检查对象／环境／范围一致、没有后续用户修订或权威证据冲突，以及多个条款组合后未新增效果。测试环境的确认不能移植到生产；分别允许本地导出和测试数据上传，不等于允许生产数据上传。
- 某条事实变化时重新读取来源；某条用户承诺的适用条件变化时，只重开受影响条款及其依赖关系，不重问全部既定条件。安全动作仍在其独立边界确认。
- 先限定在同一可恢复会话和明确继承的任务范围；compaction 后可恢复原消息／已接受 Target 时再继承，不能只靠无来源摘要或 `confirmed=true`。若以后支持对齐前证据读取，应明确限制为恢复既有依据，不借机开放调查、实施或外部调用。

### 示例与验证边界

- 已确认“仅本地处理、不修改原数据”，用户明确补充“把当前筛选结果导出为 CSV”：继承前两项，最后一项直接来自当前请求；没有组合差异和独立安全门时，不应再次问同义 Target。
- 相同已知条件下，用户只说“加导出功能”，且格式是阻塞结果的用户选择：只问格式，不重新问本地处理或原数据保留。若格式本就是获授权的实现选择，则由 Agent 决定，不能人为制造澄清。
- “已确认不得上传”与 Agent 提议云端导出：不能把既有技术事实或其他任务的上传许可用作免确认依据；未经授权的副作用仍进入 L4／S1。
- 后续评测需增加同义改写、部分继承、明确修订、相关事实失效、跨任务／环境误复用、摘要缺少来源、条款组合效应和规划到执行的 contrast cases。分开统计已确定条目重复询问率、无证据误继承率、遗漏继承约束率及组合授权误判率；继续独立检查 L3／L4、S1 和 child 边界，不把结构校验当作模型行为证明。

## 实施范围

- 核心差异：保留原有语义等价检查，新增的是 L2 的明确依据覆盖检查。原来“新的非平凡等价 Target”默认必须等待；候选方案允许条款均已明确给定或有效确认时展示后继续。它不是新增事实数据库，也不是放宽授权来源。
- 对既有行为不重复开发：同一已接受且未变化的 Target 不再确认、同一计划在明确执行授权后继承、只问用户拥有的歧义、源码事实不等于授权、L4 与 S1 独立等都已存在。
- 运行时核心只改 ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md)：在现有 Ledger 中区分直接用户表达、已接受承诺与尚未直接确定的等价解释，保留可追溯来源与适用范围；同步初次 L2、展示／等待 footer、完整修订、澄清后转移及 compact packet。只有实际等待中的 checkpoint 才消费确认回复；自动继续基于已有授权，不基于用户沉默。
- 交互保留完整 Target 的结果和约束，已定部分只用于展示与继承，等待提示只针对未定解释。没有待核对项时使用 `show_continue`；原 `show_checkpoint` 继续表示等待，`continue_unchanged` 继续服务已对齐且未变的 Target，不借该 action 绕过 initial／revision 的现有 phase 限制。
- 评测需要修改 ["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/cases.json"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/cases.json) 与 ["/Users/caishilin/Desktop/personal/skills/evals/scripts/evaluate-task-target-alignment.js"](file:///Users/caishilin/Desktop/personal/skills/evals/scripts/evaluate-task-target-alignment.js)：版本化升级 action／packet／oracle，支持 `show_continue` 和条目依据／待核对内容；分别验证可见性、是否等待、错误继承和遗漏边界。仅现有 action 总分不足以证明 Agent 没有重问已确定条款；语义覆盖仍需人工审定的正反例，不能只检查字段非空。
- 静态契约需要修改 ["/Users/caishilin/Desktop/personal/skills/tests/task-files.test.mjs"](file:///Users/caishilin/Desktop/personal/skills/tests/task-files.test.mjs)：替换无条件新 L2 checkpoint 和禁止自动继续的断言，增加有依据免等待、无依据保留核对、scope／Safety 不可复用等断言。编写或调整测试不等于获准运行测试。
- 同步必要摘要：["/Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md) 只声明已定承诺不重复确认，细则仍由共享协议持有；["/Users/caishilin/Desktop/personal/skills/tasks/context.md"](file:///Users/caishilin/Desktop/personal/skills/tasks/context.md) 仅更新受影响 Packs，不存确认状态；["/Users/caishilin/Desktop/personal/skills/PRINCIPLE.md"](file:///Users/caishilin/Desktop/personal/skills/PRINCIPLE.md) 的旧“等价即直行”表述需要与采用后的窄例外对齐。评测说明与项目本地评测 Skill 同步新 action 和验证边界，不重写历史任务或会话归档。
- 不改 task core schema、状态机、Task Target checkbox／Result／Review／Verification、Pi UI、宿主 adapters 或全局权限设置。三个 task-family Skill 已委托共享协议，不复制新算法；除非发现直接矛盾文案，否则不改它们的主体流程。

## Plan

1. 对照共享协议、consumer、scorer 与静态契约，列清真正新增的等待条件及原来已经存在的行为。
2. 按拟修改范围形成最小方案，说明 initial、明确 revision、澄清后收敛、未定解释和既有 Queue／Safety 门禁的正反例；核对全量承诺和组合效果，不只比较个别条目。
3. 实施共享协议与 provisional／report-only eval oracle，再同步 scorer、静态断言和必要摘要；保留独立的等待、可见性与误继承指标，未经人工审定不声称 gold labels 或上线行为已获证明。
4. 运行允许的非测试检查、受影响 Skill Quality 和 Context 校验；记录结果后完成 mandatory task-review 修复循环与最终校验。测试、自检中的测试模式和付费模型评测均须另行明确授权，不以静态证据冒充模型行为验证。

## Result

- T1: 共享协议已增加条款来源与覆盖检查：首次明确请求、完整修订及澄清收敛可 show_continue；源代码检查和 v4 fixture validate 通过，未运行真实模型评测。
- T2: 协议保留完整约束并仅核对未定解释；92-case fixture 包含局部用户核对、跨环境／任务、撤销条件、组合效果及事实／未接受摘要对照。Scorer 已分离重复确认、错误复用和覆盖遗漏；语法／fixture 校验通过，语义 oracle 仍 provisional，测试未运行。
- T3: Diff 保留 L3/L4、S1、graph checkpoint、恢复依据不足及 planning/delegation 门禁；task core／状态机／Pi 未改。修正旧 fixture 的 assistant-only acceptance 和把 child 重排当实现变化的不一致标注；全部旧场景 ID 保留。
- T4: 协议、静态契约、v4 fixture/scorer 与摘要一致；46 scenarios/92 cases，24 个 show_continue 正例已逐项核对。TR-1 的旧正例明确依据不足已修复，fresh task-review Pass 2 确认 resolved、无新增问题或 Target-blocking risk。语义 oracle 仍 provisional/report-only；未运行测试或模型评测。
- Review gate: Passed — 独立只读 task-review Pass 2（workflow 488727a1-ae20-4666-bc23-963f17dd2cee，child 7ceb2704-99b7-49c6-8f56-52ae96e51a8c）确认 TR-1 resolved，无 Critical/Concern 或阻止静态交付核验的 Unverified Risk；owner 核销 ledger。测试、模型评测与独立自然语言 unsettled 标注仍未获证明，两个上下文预算警告保留。

## Verification

- Passed: 最终 Review gate 写入后重跑允许检查：evaluator/MJS 语法、eval layout、v4 validate（46/92）、prepare、两个 Skill Quality（零失败，1311/1179-token 预算警告）、Context validate 和 diff --check 全部成功；已确认 task_focus 正确。未运行测试、自检测试或真实模型评测。
