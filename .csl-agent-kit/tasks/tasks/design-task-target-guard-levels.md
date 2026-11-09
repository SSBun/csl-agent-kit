# 实现分级 Task Target Guard

Status: Completed (2026-08-29 20:55)
Kind: Plan

## Scope

- Included: 共享生产协议、稳定 Agent 规则、project-local eval schema／scorer／fixtures、静态断言与 Context 的分级迁移。
- Excluded: 增加用户可选 relaxed／strict profiles、把 level 持久化到 canonical task core、修改独立 safety workflow 的执行逻辑，或让数值模型置信度直接决定 gate。

## Target
- [x] T1: 共享协议实现 Authorization Ledger、L0–L4 ladder、compact decision packet 和 S0／S1 overlay，并成为唯一详细 Authority。
- [x] T2: canonical task record 激活后，每个新的或修订后的非平凡等价 Target 都以 L2 checkpoint 展示并等待一次用户确认；L4 使用独立 change-approval 样式，L3 与 S1 保持不同交互。
- [x] T3: 三个 consumer 不复制 level 细节，稳定 Agent 规则、project-local v2 fixtures／scorer、静态断言和 Context 与新语义一致，task core schema 保持不变。

## Decisions

- 不按业务领域给任务分类。每次对齐从当前用户授权提取 outcome、done conditions、scope、preserved behavior、compatibility、side effects、user-owned trade-offs 七类 commitment atoms，并把候选 Target 对每个 atom 标为 `preserve`、`add`、`omit`、`weaken`、`change` 或 `unknown`。
- Agent 先构造仅会话内存在的 Authorization Ledger：每个 atom 使用稳定临时 ID、类型、规范化语义和来源消息；后出现的明确用户表达覆盖冲突的旧 atom。Clarification answer 与已接受 Target 可进入 ledger，Agent 假设、实现便利、repository discovery 和未接受建议不得进入。
- Candidate Target 应优先由 ledger 投影，而不是自由改写：Outcome 只来自 outcome atoms；每个明确验收 atom 至少映射到一项 Done when；显式排除、保留行为、兼容性和副作用限制进入 Boundaries 或对应完成条件。数量、阈值、`all`／`only`／`must not` 等强语义不得自行具体化；Agent 自选的“三种方案”等内容属于 Plan，不得提升为 Target commitment。
- L2 的充要条件是 `targetReady = true`、任务非琐碎、`missingAuthorizedAtoms = []`、`untraceableCandidateAtoms = []`、`differences = []` 和 `unresolvedUserDecisions = []`。每个 candidate atom 必须可追溯到一个或多个授权 atoms；每个授权 atom也必须被 Target 保留，允许多个 atoms 合并为不失真的自然语言条目。
- `preserve` 使用双向可接受集合判断，而不是文字相似度：若 Candidate 可满足但授权仍未满足，则存在 omit／weaken；若用户可接受授权但合理拒绝 Candidate，则存在 add／change。两种反事实都为 false 才是 preserve。
- `unknown` 不能来自泛化的低置信度。Agent 必须指出具体 atom 和一个可成立的反事实差异；能指出时按 L4，无法指出具体语义差异时不得用“我不确定”升级。若连诚实 Target 都无法形成，则是 L3 而非 L4。
- 对齐决策生成一个不持久化、默认不向用户展示的 compact packet：`level`、`preservedAtomIds`、`missingAtomIds`、`addedAtomIds`、`changedDimensions`、`unresolvedQuestion`、`safetyOverlay` 和 `reasonCodes`。L2 packet 必须只有 preserved IDs，其他差异／问题数组为空；该 packet 用于自审与 eval，不保存 chain-of-thought。
- Alignment ladder 固定为：`L0 NO_TASK`（不进入 task）、`L1 TRIVIAL_PASS`（仅琐碎确定性文件编辑且等价，可省略展示）、`L2 VISIBLE_CHECKPOINT`（非平凡且等价，展示后暂停并等待用户确认／修正）、`L3 CLARIFICATION_HOLD`（用户歧义导致无法形成诚实 Target，只问一个聚焦问题）、`L4 TARGET_CHANGE_APPROVAL`（Target 已 ready，但存在或无法排除具体 commitment 差异，展示差异并等待用户批准新的承诺）。
- Safety 不并入线性 level，而使用正交的 `S0 NONE`／`S1 REQUIRED` overlay。发布、付费、破坏性操作、权限、凭据、隐私数据和外部副作用命中独立 workflow 时设置 `S1`；L2 或 L4 确认不能清除 S1，真正执行副作用前仍须走独立确认。
- 推导顺序固定：先判断是否需要 task；再判断是否能诚实形成 Target；随后做双向 material-equivalence comparison；最后按琐碎边界选 L1／L2，并独立计算 Safety Overlay。`TargetReady = false` 优先 L3；Target ready 后 equivalence 为 `unknown` 时按 L4，不能靠低置信度自动放行。L2 和 L4 都暂停，但语义不同：L2 是核对已授权意图，L4 是批准新增／改变的承诺。
- 每个 hold 必须携带可审计 reason：L3 指出唯一 user-owned question；L4 至少指出一个具体 commitment dimension 和 delta；S1 指出独立 safety workflow／action boundary。没有具体理由时不得仅凭“风险高”或“模型不确定”升级，防止 guard 变得过紧。
- 生产详细逻辑只写入 `skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`：level 定义、输入、优先级、转移、用户文案规则、reason contract 和 Safety Overlay 都由该文件独占。它继续是唯一详细 Authority，不新增第二份 level 配置或生成器。
- `skills/meta/task/SKILL.md`、`task-plan/SKILL.md`、`task-queue/SKILL.md` 只保留各自激活时机、workflow-specific Target 含义、允许 lifecycle writes 和对齐后下一步；不得复制 level table。`super-agent/AGENTS.md` 与 `super-agent/workspace-workflow-gates.md` 只保留稳定门禁摘要：非平凡 Target 可见、L3／L4 必须停、Safety 独立、对齐前禁止实质工作。
- `skills/meta/csl-tasks/shared/lib/task-core.js` 不保存 level、alignment 或 confirmation。Level 是每次对齐尝试的会话决策，避免 stale state 污染 resume；canonical record 仍只保存 Target、Result、Verification 和生命周期状态。未来需要观测时优先记录 session event，而不是扩展 task schema。
- 采用用户选择的 A 方案：先创建／恢复并聚焦 canonical task record，再展示 L2 checkpoint；在用户确认前，除 lifecycle writes 外不得读取 task-direct sources、研究、规划实现、委派或修改交付物。内部 task record 创建不是执行授权。
- 每个新的或实质修订后的 L2 Target 必须确认一次。用户修正后重新生成并展示 checkpoint，再等待确认；用户自己的明确修订不需要额外的“是否允许修改”确认，但规范化后的最终 Target 仍需一次核对。已确认 Target 在内容未变化时不得在同一会话中重复确认；resume／compaction 后若无法恢复可验证的接受证据，则重新展示 checkpoint。
- L2 与 L4 保持相同的 `**Task Target**` 标题和 Outcome／Done when／可选 Boundaries 主体，避免用户学习两套 Target 格式；差异只出现在解释区和 footer，不向用户显示 L-code。
- L2 在主体后显示本地化 `Checkpoint` footer：要求用户核对 Agent 对既有意图的理解，并明确说明确认前不会开始实质工作；不得显示 difference list 或暗示用户扩大了授权。推荐语义为“请确认以上内容准确表达你的意图，或直接说明需要修改之处；确认后我才会开始执行。”
- L4 在主体后增加必填 `Changes requiring approval` section，只列 commitment dimension、原授权和 Candidate 变化，例如 `Scope — adds production deployment`；随后使用 change-approval footer，明确该 Target 改变当前授权且确认前不会执行。不得把实现方案、风险分析或私有推理混入 difference list。
- L2 接受只确认“理解正确”，不改变 current authorization；L4 接受把新 Target 加入 authorization。两者继续沿用显式肯定及未公开的 `1`／`y` 快捷输入。用户修正后若新 Target 已与修订授权等价，应回到 L2 checkpoint，而不是继续显示 L4 change warning。
- S1 使用独立的 `Safety Confirmation` block，说明即将发生的外部动作、影响对象和独立规则；不得附着在 L2／L4 footer 中，以免用户误以为 Target 确认已经授权副作用。
- 用户只看到 Task Target／clarification／change approval／safety prompt，不显示 L-code。L-code 和 reason codes 只用于协议执行、自审、eval predictions 和调试。
- Project-local eval 升级到新 schema：oracle 存 `alignmentLevel`、`safetyOverlay`、`differenceDimensions` 与 `allowedDecisions`；actions 区分 `show_checkpoint`（L2）和 `show_change_wait`（L4），不再用一个 `show_wait` 混合两种授权语义。Scorer 分别报告 under-guard、over-guard、L2 acknowledgement miss、L3↔L4 mode mismatch、Safety miss、visibility miss 和 transition errors。琐碎等价 case 允许 L1 或 L2，其他 case 使用确定 level。
- 不提供全局 relaxed／standard／strict 模式。若未来确需策略差异，只允许独立 safety workflow 调整自己的确认边界，不改变 material-equivalence 定义或允许显式用户授权被重复确认。

## Plan

1. 在共享协议中加入 Authorization Ledger、commitment atom／delta 定义、L2 充要条件、双向反事实、compact decision packet、L0–L4 table、A 方案 activation→checkpoint→confirmation→execution 顺序、reason contract、状态转移和 S0／S1 overlay；保留统一 Task Target 主体模板，定义 L2 Checkpoint footer、L4 Changes requiring approval section／footer 和独立 S1 Safety Confirmation block。
2. 精简并同步两份稳定 Agent 规则，只声明 level ladder 的触发、停止和独立安全不变量；确认三个 consumer 仍只引用共享 Authority，task core 无 schema 改动。
3. 将 project-local cases schema 从 action-only 扩展为 level＋overlay oracle，先迁移 Luna 暴露的 ambiguity 与 safety cases，再覆盖等价、琐碎、material difference、revision 和 implementation-only contrast pairs。
4. 更新 scorer，把现有 loose／tight 指标映射到 under-level／over-level，并新增 L2 acknowledgement miss、clarification-vs-change-approval mismatch、Safety Overlay miss、reason completeness 和 illegal transition；以 `show_checkpoint`／`show_change_wait` 替换旧 show actions，不保留兼容 schema 分支。
5. 用当前 64-case corpus 重新生成 provisional baseline；固定要求所有非平凡等价 case 进入一次 L2 checkpoint、L3 ambiguity 与 S1 safety 不漏判、已确认且未变化的 Target 不重复 checkpoint。人工 adjudication 前继续 report-only。
6. 运行协议静态断言、fixture validator／self-test、project-local Skill Quality、Context validate 和 diff check。项目测试与付费模型复测必须由执行请求另行授权。

## Result

- T1: 共享协议已实现 Authorization Ledger、commitment delta、L0-L4 decision procedure、compact packet、L2 充要条件和 S0/S1 overlay，task core 无 schema diff。
- T2: L2 现在在 internal task activation 后显示 neutral checkpoint 并等待一次确认；L4 使用 Changes requiring approval，L3 只澄清，L1 trivial pass，S1 独立 Safety Confirmation；稳定规则已同步。
- T3: 三个 consumer 仍只引用共享 Authority；project-local cases/scorer 已迁移 v2 levels/actions/overlays/reasons/transitions，静态断言与 Context 同步，旧 auto-continue/action schema 搜索无生产残留。
- Review gate: Skipped — 用户未要求 adversarial review、Reviewer–Editor 循环或独立批准。

## Verification

- Passed: v2 fixture validate、oracle-free prepare、scorer self-test、真实 CLI perfect/regression samples、guard ownership check、Skill Quality 1 pass 0 warning、Context validate、JS syntax 和 diff check 均通过；未运行未授权项目测试。
