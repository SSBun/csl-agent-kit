# 分析 Task Target 确认等级与优化空间

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-22 20:57) |
| Kind | Task |

## Scope

只读分析 Task Target 的 L0–L4、confirm/SOLO、delegation 与 Safety 关系，以及运行时、调用入口和现有评测的保障边界；仅更新本任务记录与精确索引项，不修改确认策略、模式配置、代码或评测数据。

## Plan

1. 梳理协议的分支顺序、状态语义、确认复用和重新对齐条件。
2. 核对模式解析、宿主注入、task core 与评测实现，区分提示契约和机械保证。
3. 结合具体交互场景形成优化建议、优先级和兼容取舍，验证来源后交付分析。

## Target
- [x] T1: 说明当前 Task Target 各确认等级的触发条件、判定顺序、交互行为与相关模式的关系。
- [x] T2: 基于当前协议、实现与评测识别确认机制的优化空间，并说明依据、取舍及优先级；只做分析，不修改确认机制。

## Decisions

本轮分析结论：保留不同交互分支，优先澄清再确认条件、恢复真实接受证据并补齐行为评测。L0–L4 不是递增风险等级；是否等待还取决于模式、会话角色、动作及独立 Safety 边界。

工作原理以 [共享协议](../../skills/meta/csl-tasks/shared/protocols/task-target-alignment.md) 为准：先解析 session > project > global > 默认 confirm；SOLO 不选 L 级，展示目标后直接推进，但不扩大授权、跳过用户明确暂停或真实安全限制。confirm 的主会话依次检查是否需要 task、用户拥有的关键歧义、候选与授权的双向实质等价、琐碎编辑条件，再决定确认动作。L0 直接回答；L1 仅纯琐碎确定性等价编辑可继续；L3 先问一个关键问题；L4 展示实质承诺差异并等待；其余为 L2，首次完整展示并等待，真实接受过且未变的目标可以 continue_unchanged。有完整委派包的子会话不自行向用户确认，超范围时返回主会话。

授权分解为 outcome、done_conditions、scope、preserved_behavior、compatibility、side_effects、tradeoffs，并保留用户消息来源。候选不能漏掉、削弱或增加承诺；资料发现与实现偏好不能制造授权。L2 的目标复核与 L4 的变更批准不同；用户明确修订先更新授权，因此忠实的新 Target 通常重新走 L2。接受证据必须能恢复完整旧 Target 及后续用户接受消息，并验证对象、环境、范围仍适用。任务勾选、Agent 摘要或 confirmed 布尔值不能替代。计划到执行在后来明确授权实施且目标未变时复用确认；仅接受规划目标不授权实施。S0/S1 是独立行动边界，R0/R1/R2 是完成审查，两者都不是 L 级的延伸。

[模式解析器](../../skills/meta/csl-tasks/shared/lib/task-mode.js) 57–101 行实际实现优先级、旧 autonomous 兼容、配置错误回退 confirm 与提示生成；[Hook](../../skills/meta/agent-hooks/scripts/read-csl-agent-kit-contract.js) 10–24 行注入 Contract 和模式提示。[任务核心](../../skills/meta/csl-tasks/shared/lib/task-core.js) 805–817 行进入 In Progress 检查 Target 存在，1010–1033 行检查完成证据，没有实现用户接受证据或 L0–L4 工具前硬门禁。当前机制的语义判定依赖 Agent 遵循协议。

建议按以下顺序推进，均为待实施建议：

1. **P1：明确首次建图与修改既有图。** 共享协议 125 行把新增、删除、重排子任务都列为 graph change；[Queue](../../skills/meta/task-queue/SKILL.md) 22–26 行要求先接受父目标再拆分初始图，40 行又以 accepted parent Target + current Plan 直接委派。没有明确初次建图是否触发第二次确认、变化相对哪个基准。最小修正是定义初始建图及既有图基准，添加初次建图／后续改图对照案例。当前 [main-plan-graph-change fixture](../../evals/task-target-alignment/cases.json) 4194–4257 行只覆盖用户已接受 current Plan 后重排。此项是协议歧义，尚无真实重复确认发生率。进一步把图调整限于有用户可见影响时才确认属于政策变化，须保留依赖、成本、交付范围变化检查。
2. **P1：让分支与动作更明确，收紧 L1 判据。** L2 表格写展示并等待，但实际上也允许 continue_unchanged；文档应直接表达首次／强制事件等待、有效未变接受继续，并把 mode、role、level、action、Safety 分开。L1 应给唯一确定变换、对象明确、无结果选择及隐含行为变化的短判据和反例。当前可选展示会升级为 L2 等待；可以明确普通进度通知不属于确认框，避免呈现方式制造额外暂停。无需增加新等级或删除必要授权检查。
3. **P1：补全评测覆盖与真实运行来源。** [评测器](../../evals/scripts/evaluate-task-target-alignment.js) 11–18、59–69、289–318 行没有 continue_solo 或 resolved mode/source，现有 55 scenarios／110 cases 只能覆盖 confirm 分支；建议保留现有案例，补 SOLO、模式切换及独立 blocker 对照。prepare 冻结协议和数据 hash，但 prediction 无来源绑定，score 979–986 行只给报告当前 datasetHash，compare 752–754 行也只核数据。补最小运行来源记录，绑定请求、protocolHash、datasetHash、model、mode；有意比较不同协议时明确双方，不强制协议相同。[历史 smoke](../../evals/task-target-alignment/results/astra-goal-recheck-smoke-20260914-164433/scope-summary.json) 是 8 cases × 3 次、动作 24/24、全部参考字段 21/24；其协议 hash 757d44… 不同于当前 4dacd8…，不能证明当前协议效果。
4. **P1：用少量真实会话补行为证据。** [评测说明](../../evals/task-target-alignment/README.md) 52–67 行承认固定候选分类不能证明自由生成目标和真实停轮。获明确测试／模型授权后，在现有宿主回放 6–8 个核心场景，观察完整目标、轮次结束、用户回复、首次实质工具调用顺序，以及未变目标继续、局部接受、修订、跨环境、委派、SOLO 切换。分别衡量漏等待、重复确认、错误复用和边界遗漏；不能只优化确认次数。scorer 468–499 行按数字计算 underGuard/overGuard，会把 L4→L3 当保护不足，尽管二者都暂停；宜主报动作错误与错误复用，单列 L3/L4 误判。
5. **P2：改善接受证据恢复。** 缩短上下文后无法恢复原 Target 和用户接受就必须重问，这是现有规则的结果。若宿主支持可靠消息检索，可用会话级 proposal/acceptance 引用、Target 身份及适用范围帮助恢复，仍回读原消息验证。先验证宿主能力，不建立全局确认数据库，也不把摘要或布尔标记升级为授权。

以下行为属于明确产品取舍，不能包装成实现 bug：详细初始请求也先 L2；L3 局部澄清后还要完整 L2；“确认，但修改目标”后再 L2；已接受图重排仍需确认；对齐前禁止 task-direct 源码调查。若要减少这些轮次，需要改变 confirm 的目标复核承诺并评估漏边界风险。show_continue 是刻意保留的违规预测标签，评测器 13–14 行已排除其合法性，不是遗留合法路径。

校验与限制：project eval 布局检查有效；fixture validate 有效，55 scenarios／110 expanded cases，5 个等级全覆盖，provisional／report-only。没有运行测试、自测、模型或真实宿主回放；分类覆盖不等于模型准确率或工具层拦截。已逐项核对协议、Queue、mode、hook、core、scorer 与历史产物。宿主无 task_focus 工具，记录已激活但没有宣称绑定成功。Context 未更新：本轮只有分析与本任务记录，无授权范围内的机制变化。

证据身份：协议 SHA256 `4dacd8ff81eda70850a4e515c42f9f11dec9084df17a424716d86a65e2caf34f`；fixture `15481185ff94865d937ace7b6494a1958984dbd16ca24c18e52680e00f37f212`；scorer `d3e5b830b79f71b07c61df08a4c0cb49ce28a4661398390ce7e86a2d3cb83da7`。这三者标识本次无文件交付分析的核心来源；工作区其他修改不属于本任务。

## Task Summary

本任务未修改代码、技能、确认策略、模式配置或评测数据，仅维护本任务记录及其索引项。

## Result

- T1: 已对照共享协议、模式解析与 Hook/Task Core 说明 mode→role→L 分支→action→Safety 顺序、L0–L4 条件、真实接受复用及 plan→task 边界；结论和来源见 Decisions。
- T2: 已核对 Queue 初次建图歧义、L1/L2 表达、SOLO/schema 缺口、运行来源绑定和真实行为覆盖，给出五项优先建议及政策取舍；布局与 55 scenarios/110 cases 数据校验有效，历史报告明确标旧。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 只读分析交付；本任务仅更新生命周期记录和精确索引，无代码、技能、策略、模式或评测数据修改，无显式或既有独立审查义务。
- Snapshot: no-file-analysis:2026-10-22; Decisions; protocol-sha256:4dacd8ff81eda70850a4e515c42f9f11dec9084df17a424716d86a65e2caf34f; fixture-sha256:15481185ff94865d937ace7b6494a1958984dbd16ca24c18e52680e00f37f212; scorer-sha256:d3e5b830b79f71b07c61df08a4c0cb49ce28a4661398390ce7e86a2d3cb83da7
- Evidence: Owner self-check 已将 T1/T2 与请求逐项比对，复核源码证据和建议范围；无机制改动，未将固定候选分类或历史 smoke 当成真实行为保证，详情见 Decisions。
- Task fingerprint: 1db405c43bfdbb3a5304b5e7cd1dfd25696434b81286d43dcf660493c26910e2

## Verification

- Passed: 完成前重读核心来源并核对 8 个来源文件 SHA256，无内容漂移；sync/check valid；非测试布局/fixture 验证有效。未运行测试、自测、模型或真实宿主回放，收益与发生频率未实测。宿主未提供 task_focus，已披露。
