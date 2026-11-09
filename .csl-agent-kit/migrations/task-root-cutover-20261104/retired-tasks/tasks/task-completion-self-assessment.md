# 为 Task 完成流程增加自动质量自评

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-02 15:26) |
| Artifacts | [Artifacts](../artifacts/task-completion-self-assessment/) |
| Kind | Task |

## Target
- [x] T1: 每个任务完成时 Agent 自动进行质量自评，并在任务记录和最终交付中呈现。
- [x] T2: 自评覆盖修改最小性、稳定性、目标符合度、验证充分性及完成置信度，五项均使用 1～5 整数评分，并附证据和未验证项，不替代现有验证与 Review。
- [x] T3: 普通任务、无文件交付任务、Queue 子任务与父级集成收尾均有适用规则；仅规划并保持 Pending 的任务不被误报为实施完成。
- [x] T4: 自评与当前结果保持一致；修复、重开或证据变化后重新核对，既有审查、验证及历史记录兼容边界不被削弱。

## Scope

用户在计划阶段之后明确要求执行，并接受完整实施 Target。当前执行范围为 Task／Queue／Plan 工作流、常驻契约的自评触发、相关验收样例与必要 Context 更新；不改核心 CLI 和其他任务记录。

实施范围是 Agent 自动收尾行为及其记录与展示契约，不建设独立评分服务、后台任务、排行榜、加权总分或新的审批流程，不批量回填历史任务。现有工作区有多项未提交改动，后续实施必须以当时内容为基线，不能覆盖或归属其他任务的改动。

## Decisions

### 行为与触发

用户目标是让 Agent 每个任务收尾时主动评价实际结果，而不是仅增加可选字段。采用最小的工作流层实现：扩展现有 owner self-check，明确自评为必做动作，并在最终交付展示。首版不新增 CLI 评分命令或完成状态，不让脚本代替 Agent 作语义判断。

主 Agent 在 Task Summary、Execution Log 与逐 Target 证据准备好之后、Review Assessment 之前写入唯一的 `## Self Assessment`。先评价实际产物，再做既有 R0/R1/R2 分类。独立 Review 不读取自评分数作为可信结论，也不能因高分减少检查范围。

最终验证后再次核对自评是否仍成立：不变则直接完成并展示；Review 修复、结果漂移或新增证据改变评价时，先返回正常更新路径，更新该章节并执行 sync，重新生成受影响的 assessment、Review 与 Verification，再完成。不得在 Completed 后直接补写自评，也不将此章节排除于现有内容指纹之外。

### 维度与标尺

全部五项（包括完成置信度）统一使用 1～5 的整数，越高越好；不使用高／中／低、百分比或 N/A 代替数字。置信度是证据等级，不是统计概率。每项都要有简短依据、证据引用和局限；没有已知缺口也需说明已检查的边界，不得声称绝对安全。

| 维度 | 评价内容 | 无文件任务与评分边界 |
| --- | --- | --- |
| 修改最小性 | 是否用最小必要范围解决根因，避免无关改动、过度抽象和额外依赖；不按行数计分 | 确实无需且没有交付物修改时可评 5，说明无多余修改；遗漏必要修改不能据此得高分 |
| 稳定性 | 崩溃、异常、数据损坏、兼容性及行为回归；文档或流程任务评价矛盾、误导与执行回归 | 纯信息交付评价结论误导或后续执行风险；无运行时变更不等于自动满分 |
| 目标符合度 | 对照当前有效要求与每个 Target 核对实现及边界 | 不允许 N/A |
| 验证充分性 | 实际检查是否足以支撑关键结论，明确未运行或无法运行的检查 | 不允许 N/A |
| 完成置信度 | 综合目标证据和剩余不确定性，不计算平均分 | 不允许 N/A |

共同锚点：1 表示明显不满足；2 表示有重大不足；3 表示基本成立但有实质局限；4 表示证据充分且仅有非关键局限；5 表示在明确范围内证据充分、无已知实质缺口。具体维度必须据其评价内容解释，不能为了整齐而全部打满分。

完成置信度采用独立的五档证据锚点，不平均其他维度：

| 分数 | 判定依据 |
| --- | --- |
| 1 | 已有证据表明核心目标未达成，不能声称完成。 |
| 2 | 核心目标可能实现，但关键证据缺失或存在重大未决风险，不能确认完成。 |
| 3 | 验收条件有证据支持，但仍有实质、非阻断性的验证局限，必须具体披露。 |
| 4 | 全部验收条件有充分证据，仅余影响有限的非关键局限。 |
| 5 | 全部验收条件及相关关键风险均经适当验证，明确范围内无已知实质缺口；不代表绝对无缺陷。 |

采用证据能够完整支持的最高档；不能满足该档条件时下调，不用主观感觉补足证据。任何明确 Target 失败或阻断性证据缺口仍依现有规则禁止完成，不设置加权总分或新的分数及格线。

### 记录与交付

任务记录使用单一五行评价表，列为维度、评分、依据与证据、局限；引用已有 Result／Verification 或权威证据，避免复制日志。最终答复给出紧凑五项摘要与最重要局限，完整依据保留在 canonical record。自评不是独立 Review 的 Passed 或 Approved。

Queue 每个子任务评价自身结果，父任务评价集成结果，不平均子任务分数，不将子任务变更归为父任务所有。无文件任务照常评价目标与证据。task-plan 仍保持 Pending，不给未实施的结果打完成分；之后显式执行同一记录时进入正常收尾。历史记录保持原样；重开时对当前结果重新自评。

### 首版保证边界

首版由自动加载的行为契约和 Skill 规定强制自评，但现有 CLI 不会因为缺少该章节而自动拒绝 complete/finalize。结构检查或契约断言可以验证规则存在，不能证明真实 Agent 每次都会遵守；必须如实披露这一边界，不宣称已有机械防绕过保证。若后续要求 CLI 强制检查，另行明确该扩展，不在本次默认增加 schema、失效状态或存储 API。

## Plan

1. 核对实际执行基线与消费者。检查 Task、Queue、Plan、注入契约、核心 fingerprint／complete／finalize 及记录解析方，确定自评接入顺序；保持现有未提交改动及其他任务不变。
2. 完成统一的自评行为契约。以 Task 为详细规则权威，定义触发、五维整数标尺、无文件任务评分依据、证据要求、阻断性缺口和最终展示；常驻契约只增加稳定的必做动作及引用，避免重复评分细节。
3. 对齐收尾路径。覆盖普通 complete、低风险 finalize、R2 审查修复、Queue 子任务与父级集成、无文件任务、重开和 Pending plan；保持自评写入在 assessment 前，最终结果变更时遵守已有证据失效机制。
4. 准备针对性验证材料。同步受影响契约断言或路由样例，覆盖五项均为 1～5 整数、无文件任务评分理由、低分不掩盖失败、未运行检查明确披露、Review 后更新、历史无自评记录仍可读、Pending plan 不误完成；不得以样例存在声称实际 Agent 行为已验证。
5. 自检和交付。运行获准的结构／语法检查、变更包 skill-quality、Task／Context 校验及 diff whitespace 检查；依据实际修改分级，需要 R2 时执行独立 task-review。最终报告规则层保证、实际执行过的检查及未验证部分，并用本任务自身的自评示范最终输出。

## Verification Plan

规划依据已核对：`skills/meta/task/SKILL.md` 的 Owner Self-Check、Record Contract、Completion 和 finalize；`skills/meta/task-plan/SKILL.md` 的 Pending 交接；`skills/meta/task-queue/SKILL.md` 的 Sequential Execution 和 Parent Final Gate；`skills/meta/csl-tasks/shared/lib/task-core.js` 的 reviewTaskFingerprint、requireCompletable、completeTask 和 finalizeTask。

已确认核心指纹默认覆盖普通章节，直接改写自评会影响 assessment；complete 与 finalize 共用完成条件，但目前没有自评结构或评分校验。保留现有机制比增加事后写入豁免更简单。

未来执行需检查的结果：规则可从分发包完整加载，所有收尾路径都有动作引用，评分有证据和局限，现有状态与指纹行为保持一致，记录消费者可接受普通新增章节。确定性静态检查只能验证结构，不证明 Agent 实际反思质量。

当前请求未授权运行单元测试或项目测试套件，本轮不运行；实施时若仍无授权，也不得擅自执行。涉及真实 Agent 行为回放、fresh subagent 或核心回归测试的验证，应在执行阶段核实工具与当前授权，不能把尚未执行的检查标为通过。若关键验证缺口阻止验收，应报告阻塞，不能通过自评分数绕过。

## Execution Log

### 001 — 从实施对齐转为先规划

用户要求先为 task-completion-self-assessment 编写 task-plan。复用原任务，将其设为 Pending 并标记 Plan；未开始实现，也未将此前展示的 Target 记为已接受。

### 002 — 确定最小接入与失效边界

核对现有 Task 自检、Queue 集成、Plan 交接与核心完成路径后，确认当前缺口是统一的主动评价与展示，而不是缺少 Review。计划采用工作流层自评，不新增评分运行时；自评须在 assessment 前写入，内容变化遵守既有指纹失效规则。仅记录规划结论，尚未修改运行时或证明实际 Agent 自动执行效果。

### 003 — 统一五项数字评分

用户明确要求全部维度使用 1～5 数字评分。完成置信度改为五档证据锚点，不再使用高／中／低；其他维度也不以 N/A 替代数字，无文件任务按实际必要修改和信息／流程风险给出评分依据。本次仅修订计划，未实施评分机制。

### 004 — 落实工作流层自评

在用户接受完整实施目标后，按工作区现有内容保留既有改动，新增 Task Self Assessment 规则并接入自检、complete 与 finalize 前置流程；Queue 子任务及父集成复用规则，Pending Plan 明确不评分未实现结果，常驻契约加入自动触发。新增 13 个验收场景作为后续手工或获准 Agent 回放的输入，没有执行测试套件。独立只读 reviewer 能力已查到，采用 R2 审查路径覆盖跨工作流规则衔接。

### 005 — 完成初步静态核对

逐项核对 task-owned diff 与目标，4 个变更 Skill package 的 skill-quality 均无失败；存在初始加载预算警告，Task 另有长文件警告，保留必要规则而不删减。Context 校验通过，保留原有 3 个非索引章节警告；Task check／workspace validate 与范围内 diff whitespace 检查通过。13 个场景仅是验收输入，未执行测试或 Agent 行为回放。实际差异保存在 [implementation.diff](../artifacts/task-completion-self-assessment/evidence/implementation.diff)，不把其他任务的已有改动归入此次实现。

## Task Summary

**Task 工作流**：[task](../../skills/meta/task/) 增加统一五维评分、置信度锚点、证据及失效规则，接入普通与低风险收尾，并提供 13 个验收场景。

**Queue 工作流**：[task-queue](../../skills/meta/task-queue/) 将子任务与父级集成接入独立自评及最终展示，不平均子分数。

**Plan 工作流**：[task-plan](../../skills/meta/task-plan/) 明确 Pending 交接不评价未实现结果，后续实施遵循 Task 评分要求。

**Agent Hooks 契约**：[agent-hooks](../../skills/meta/agent-hooks/) 增加稳定的自动自评触发要求，细节继续由 Task 持有。

## Self Assessment

| 维度 | 评分 | 依据与证据 | 局限 |
| --- | --- | --- | --- |
| 修改最小性 | 5 | implementation.diff 仅包含必要的流程规则、消费入口、验收场景及一条 Context 事实；未改 CLI 核心 | 现有长 Skill 中新增了必要评分说明，未另行重构 |
| 稳定性 | 4 | 保留原有 fingerprint 与完成门槛；四个包质量检查无失败，逐条核对新增规则衔接 | 工作流文字依赖 Agent 遵守，没有 CLI 防绕过校验 |
| 目标符合度 | 5 | T1–T4 的规则入口、五项整数、范围例外和失效规则均已对应到实际内容 | 评价限于已接受的工作流层实现，不保证每次模型运行行为 |
| 验证充分性 | 3 | 质量门禁、Context／Task 结构校验、任务内差异检查均通过 | 未运行测试套件及真实 Agent 场景回放；静态检查不能证明评分质量 |
| 完成置信度 | 3 | 工作流层验收有直接内容和结构证据支持，现有完成机制未变 | 存在未回放真实 Agent 行为的实质非阻断局限；这是产物自评，不是审查通过声明 |

## Result

- T1: 核对 task Self Assessment、自检/Completion/finalize 入口及常驻契约：均要求自动记录并在完成交付展示；implementation.diff 标识本次实际范围，规则层不等同于 CLI 强制检查。
- T2: 逐行核对五维表与置信度 1–5 锚点：全部整数、依据与局限必填、禁止平均分替代置信度，失败 Target 和既有 Review 门槛保持；四包 skill-quality 无失败。
- T3: 核对 Task 的 R0/no-file、complete/finalize、Queue 子任务与父级引用、Plan Pending 例外及 13 个验收场景，覆盖范围一致；样例未回放，不声称实际行为测试通过。
- T4: 对照未修改的 reviewTaskFingerprint 与完成路径，新增章节沿用普通内容失效规则；规则明确冻结、修复/重开重新评价、禁止 Completed 后补写且不迁移历史；Task/Context 校验与 diff --check 通过。
- Review gate: Passed — 独立 fresh/read-only reviewer 98477e5f-6827-4d8b-a51a-60cb2581c6ac 的 round-01 无发现或 Target 阻断项；主 Agent 已核对覆盖范围与当前快照，check-evidence verified。未执行 Agent 回放的非阻断局限保留。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 跨 Task、Queue、Plan 和注入契约的收尾行为变更，需要独立检查顺序、评分边界与失效衔接。
- Snapshot: snapshot:tasks/artifacts/task-completion-self-assessment/evidence/0a5699e7786b67ff7ec6dd1a4f87902c9c8ade2a1d8d6d16298713e982b54bfa.json#0a5699e7786b67ff7ec6dd1a4f87902c9c8ade2a1d8d6d16298713e982b54bfa
- Evidence: Result T1–T4；Execution Log 005；task-owned implementation.diff；四包质量门禁无失败，未运行测试或 Agent 回放。
- Task fingerprint: 912c7c1dc2cde86c92853467b0f6e6060751ffba99f00e97e8458cc21278dc56

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/task-completion-self-assessment/reviews/round-01.md) | snapshot:tasks/artifacts/task-completion-self-assessment/evidence/0a5699e7786b67ff7ec6dd1a4f87902c9c8ade2a1d8d6d16298713e982b54bfa.json#0a5699e7786b67ff7ec6dd1a4f87902c9c8ade2a1d8d6d16298713e982b54bfa | no blocking findings | 41e70f93255a317d189e3c9c590bdaf3a99ff7dd5add0575b917a930f950bc1f |

## Verification

- Passed: 独立审查后再次运行四包 skill-quality 无失败（预算/长文件警告保留）、Context validate 通过（3 个既有警告）、范围 diff --check 与 Task check 通过；check-evidence 核对7文件快照和1份审查报告一致。最终观察不改变 Self Assessment：5/4/5/3/3；未运行测试套件或 Agent 回放，不宣称 CLI 强制执行。
