# 优化 Context 新项目建档、检索与更新设计

| Field | Value |
| --- | --- |
| Status | Blocked (2026-10-22 20:17) |
| Artifacts | [Artifacts](../artifacts/optimize-context-lifecycle/) |
| Kind | Plan |

## Scope

实施已确认的 task-context 新项目建档、任务检索与日常更新方案，同步相关 CLI、用例、工作流入口和正式 Context Pack。仅修改本任务所需范围及所属记录，保留其他任务的并行改动；不批量迁移历史知识、不发布。

## Plan

1. 在 `skills/meta/task-context/SKILL.md` 定义两阶段建档、覆盖检查与事实来源要求，并同步 package description、`agents/openai.yaml` 和触发案例。保留对齐前的最小 Core 恢复；完整调查与种子 Packs 建立放在具体任务对齐后。先用新项目、Core-only 项目及证据不足项目逐项核对预期行为，防止把全面建档放进目标对齐前的执行阶段。
2. 在同一 Skill 内补齐检索充分性、Change Gate、事实变化驱动的维护与局部修复流程；在 `scripts/context.js` 的 index 增量返回已有 Authority/Recheck，并为未进入索引的顶层内容提供可见 warning。复用现有只读解析器，不增加检索服务或持久缓存；同步 `tests/task-files.test.mjs` 中的索引字段、旧重写语义及混合历史内容断言。
3. 将维护检查接到 `skills/meta/task/SKILL.md` 的自检前，并在 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 保留一句稳定触发要求。Queue 子任务继承 task，不复制详细流程；核对 task-plan 的只读范围仍然成立。相应更新 task-context 的调用契约案例、README 简述和本仓库已受影响的正式 Context Pack；不借此批量清理历史 Context 或任务。
4. 扩展 `skills/meta/task-context/evals/query_cases.json`、`context_value_cases.json` 与必要的 package-local 场景数据：除事件/动作外，提供任务输入、源事实、候选 Packs、必须覆盖的决策、不能采信的结论和预期维护集合。确定性检查覆盖结构及 CLI；Agent 的覆盖率、召回和语义准确性用另行授权的真实场景执行验证，不能由动作标签断言替代。
5. 对所有实际修改的 Skill package 逐包运行 Skill Quality，运行语法检查、实际 Context 校验、所属任务 check 与 diff whitespace 检查；只有取得当前请求的测试授权后才运行聚焦测试或 self-test。实施时根据实际 diff 执行 Task 的自检、分级和必要审查；本规划不预先宣称验证或实现完成。

## Target
- [x] T1: 新项目的 Context 生成能够覆盖建立项目理解所需的关键事实，并能核对事实来源与遗漏。
- [x] T2: 具体任务能够检索到准确、充分的相关 Context，明确处理缺失与过期信息。
- [x] T3: Context 后续更新具有清晰的触发条件、影响范围和增删修订规则。

## Decisions

### 设计依据与边界

- 保留一个 canonical Context 文件、四段 Project Core 与按需加载的 Context Packs；Core 提供全局定位，Pack 承载完整的组件或跨组件模型。完善发现、取证、检索与维护流程，第一版不引入数据库、向量检索、文件监听、定时巡检、源文件哈希库、持久查询缓存或新的全库状态文件。
- 当前建档仅允许四段最小 Core，且旧 Core 无效时整文件替换为 Core-only，依据 `skills/meta/task-context/SKILL.md:201`、`:207`、`:214`。这能得到格式合格的文件，但没有给首批 Packs、覆盖维度与调查停止条件规定结果；不能据此推断所有真实项目都已发生遗漏。
- 当前检索只有一轮 index/show 和通常一至三包的建议，完成门只检查 selected Pack，依据同一 Skill 的 `:102`、`:105`、`:117`。Add 虽获准，却没有明确的新事实发现步骤；影响分析需要独立于本轮读取集合。
- 当前 index 没有输出已经解析的 Authority/Recheck，依据 `scripts/context.js:234`。当前 parser 对非 Core、非 CTX 的顶层段落不索引且无 warning，依据 `scripts/context.js:192`。本仓库的 `tasks/context.md:320`、`:328`、`:336` 三段即是实际例子，现场 validate 返回 valid=true、errors=[]、warnings=[]；该观察仅证明静默遗漏，不代表这些旧内容全部错误或均应迁移。
- 现有 `evals/query_cases.json` 与 `tests/task-files.test.mjs:545` 覆盖事件/动作名称，另有 CLI 格式及错误检查；它们不能证明完整建模、语义召回或来源支持程度。后续报告必须区分契约检查、结构检查与真实 Agent 行为证据。
- 保留缺失 Context 创建和有效 Core 语义变更的现有确认政策；不调整 confirm/SOLO，不把同任务维护扩大成历史清理或跨工作区写入。Core 局部修复替代无条件整文件重写属于明确的行为调整，应同步相关案例与消费者。
- 当前另有 Task 证据工具工作并行修改共享 core 和 `skills/meta/task/SKILL.md`；本任务只在 task 的完成入口接入 Context 维护，未修改共享 core，保留了其他任务新增的快照与审查报告能力。README、Context 与共享测试文件同样仅修改本任务相关区域。

### 新项目生成

- 启动阶段只恢复或建立足以理解用户目标的最小 Core。任务目标对齐后，当尚无可信相关 Packs、仅有 Core，或来源探索显示模型缺口时，完成有界覆盖调查，并建立有证据且符合准入条件的首批 Packs。显式全项目建档任务按其范围调查；普通任务不因此深读每个模块。
- 调查至少考虑七类问题：项目解决什么问题及领域术语；主要组件职责与边界；运行入口及产物；关键控制流、数据流与状态归属；源文件、生成物和外部依赖的关系；跨组件约束与兼容边界；真实成功信号及验证入口。语言、框架、目录清单只作为发现线索，不替代对这些问题的回答。
- 对每个适用维度形成临时覆盖表：已确认且有来源、不适用且有依据、未确认且说明缺口。未确认不等于不存在，不写成 Context 事实；有 owning task 时将尚影响结果的缺口留在该任务，纯启动阶段直接披露降级，不另建 Context 状态库。
- 停止条件是：已发现的主要边界都有职责与权威入口；与当前任务相关的关键链路、约束和成功信号已有来源支持；剩余缺口已明确，且不会影响即将作出的决策。若缺口影响正确性，继续定向探索或仅暂停受影响工作，不能以四个段落非空结束。小项目可无 Pack，前提是 Core 已足够表达全部相关稳定知识，不能为凑数量生成空洞包。
- Core 关键断言及 Pack 内改变决策的结论附具体来源路径和符号/章节，Pack Authority 保留来源集合；多条来源必须能辨认各自支持什么。规范要求、实际实现和历史说明冲突时先辨认各自权威范围，不能默认 README 或代码永远胜出。无法核实时不补造结论，不缓存实时配置、版本或秘密。

### 任务检索

- 将一至三包定义为初始批次建议；读取后按任务需要检查职责边界、上下游关系、约束和验证方式是否得到覆盖。相关内容超过三包时继续按需取回，不以数量停止，也不默认加载全部正文。
- 空结果、业务别名未命中、现有包只覆盖部分任务时，转向任务直接来源建立术语与边界，修正 Task Fingerprint 并再次查询。任务范围、实际触及组件或新发现的依赖发生实质变化时同样重查；普通未变化的跟进复用当前选择。
- 在重要依赖前或 Recheck 触发后核实 Authority。来源缺失或矛盾只使对应结论暂停使用，不能凭格式合法继续信任，也不能仅凭无法访问就删除；使用权威直接探索并报告局部缺口。发现可复用稳定事实后进入同次维护检查。
- index 增加已存在的 authority、recheck 字段，不新增 Markdown metadata 或语义匹配算法；仓库已知 exact-key 断言必须同步。对未索引顶层内容给出包含位置和原因的 warning，并在正常查询路径可见；保留原文、继续读取有效 Core/Packs，不能自动转换或删除。历史混合内容的既有检查改为明确核对诊断，不能粗暴忽略所有 warning。

### 更新与恢复

- 维护触发包括：任务中确认新事实；改变组件职责、关系或约束；权威来源改变、迁移或删除；Context 与来源冲突；任务中出现新边界；临时事实退出事件；结束前的最终变化核对。只读调查也可能确认新事实，但仍受本任务的只读或文件范围约束，不借维护名义修改被明确排除的交付物。
- 维护范围取本轮选中过的 Packs、本任务实际改动路径/Authority 对应的其他 Packs、已确认上下游关系受影响的 Packs，以及相关 Core 事实和新事实的并集。扫描整个元数据索引找候选，再按需读取正文；共享工作区内其他任务的 diff 不自动归本任务，不能用全工作区脏文件列表代替本任务影响范围。
- 每个候选选择 Add、Update、Delete 或 No-op。新模块/新关系进入已有合适 Pack，只有形成独立决策单元才建包；只有来源支持、稳定且改变未来决策的事实进入 Context。不存在持久事实变化时不写入，不能每个任务都追加执行日志。
- 删除最小失效事实；仅在整包无有效知识时删除 Pack，删除稳定 ID 前核对活跃消费者。合并只在同一决策边界、全部独有有效信息与来源都能保留时进行；无法保证引用完整性则暂缓。显式跨历史批量整理仍交 task-maintenance，不扩大普通维护。
- 缺失文件走 bootstrap；Core 局部格式问题先依据来源修复 Core，并原样保留无关 Packs。旧内容只能作为待核实线索，不能作为 Authority。无法可靠划分或恢复的文件保持原件，退回定向探索并说明所需修复，禁止无条件用 Core-only 覆盖整文件。
- 写前保存准确原文并检查相关内容未被其他工作改写；只改受影响片段，运行 validate。失败恢复本次修改，遇到并发变化重新读取并核对，不覆盖他人新内容。Core 待确认的差异与已经授权的普通 Pack 维护分开呈现；不能把未确认 Core 变化报告为已完成。
- Task 完成流程在自检和风险分级前委托 task-context 做维护检查，使必要写入被同一次验证覆盖。Contract 仅保留触发与职责边界；Task、Plan、Queue 不复制详细生成、检索和增删规则。

### 验收场景与实施约束

- T1：多组件新项目能找到主要职责、入口、生成关系、主链路及真实成功信号；README 缺失/冲突时仍区分证据与推测；空项目或证据不足不填充泛化事实；Core 格式损坏时保留无关有效 Packs。来源存在不等于支持结论，必须检查对应内容。
- T2：跨四个组件的任务不会因批次数建议漏掉必要包；业务别名首轮无匹配时能补查；来源探索发现新依赖时会再次检索；过期、不可访问及矛盾 Authority 不能作为可信结论继续使用；非标准顶层知识产生可见诊断。
- T3：未选 Pack 的 Authority 改变也进入维护候选；新模块没有现成 Pack 时会判断 Add；来源重命名更新引用；一条事实失效不删除整包；有活跃引用的 ID 不被直接删除；无稳定事实变化保持 No-op；其他任务的修改不被纳入本轮写入；待确认 Core 与可自动维护的 Pack 区分处理。
- 运行时规则和 eval-facing prose 按仓库约定使用英文，用户解释和任务记录使用中文。已读 workflow 完整性 Lesson 要求保留核心判断、异常路径和完成条件，不为初始加载预算截断必要规则；预算超限仅如实报告。
- 用户已明确要求执行优化；没有待决的产品偏好。当前宿主未提供 task_focus，归属由本 canonical record 保持。测试和自测需遵守当前明确授权；实际执行证据记入 Result，不把规划阶段的静态分析当成运行验证。

## Task Summary

**Task Context** [skills/meta/task-context](../../skills/meta/task-context/)：加入两阶段建档、七类覆盖检查、来源到结论的对应要求、迭代检索、Change Gate、基于事实影响的维护和局部 Core 修复；索引提供 Authority/Recheck，未知顶层段落产生可见 warning；同步触发、准入、查询案例，并新增十二个完整生命周期场景。

**Task** [skills/meta/task](../../skills/meta/task/)：在最终自检前接入 Context 维护，覆盖未选但受影响的知识。

**Agent Hooks Contract** [skills/meta/agent-hooks](../../skills/meta/agent-hooks/)：保留启动最小 Core、对齐后覆盖与检索、自检前维护的稳定触发。

**Workspace Context** [tasks/context.md](../context.md)：只更新受影响的 CTX-task-context Pack，保留 Core、历史段落及其他任务的维护内容。

**Task contract checks** [tests](../../tests/)：同步相关文本契约及索引字段断言，增加未知段落告警、原文保留、有效 Pack 隔离和生命周期语料结构检查。

**README** [README.md](../../README.md)：更新 task-context 能力说明。

## Block

- Reason: 实现与当前允许的自检已完成，但本次多环节工作流行为变更属于 R2。task-review 要求宿主实际提供 fresh context 与 read-only tools；当前 collaboration.spawn_agent 只有上下文和模型选项，未提供工具权限限制，工具发现亦未找到可配置只读权限的 Agent 入口。普通协作自检不能替代这一强制独立审查，因此未派发不符合隔离要求的最终 Reviewer，也未记录 Passed 或完成。
- Unblock when: 提供可实际限制为只读工具的 fresh Reviewer 入口后，重新核对本任务快照、自检及必要的已授权检查，执行 task-review 并处理其反馈，再完成最终验证。测试授权问题仍未收到回复，当前没有运行测试/self-test；它不被伪记为通过。

## Result

- T1: 已按已确认方案加入两阶段建档、七类覆盖调查、停止条件、来源对应和高价值seed Packs；逐项对照12个生命周期语料并完成实现交叉自检，修复别名场景矛盾及并发创建窗口。task-context质量门无失败；尚无真实陌生项目Agent回放证据。
- T2: 实际工作区执行core/index/show/validate均退出0；index的14个Packs全部返回authority/recheck；core/index/show各显示3条已知历史段落warning，validate为0 errors且精确列出同3条warning，查询前后Context SHA256相同。已补再检索、缺失与冲突Authority处理及对应测试定义，测试未运行。
- T3: 已实现事实变化驱动的候选维护范围、Add/Update/Delete/No-op、最小删除与ID引用保护、Core局部修复及并发写入边界；Task与Contract接入自检前维护并更新正式Pack。两文件node --check、限定git diff --check及三个修改包Skill Quality通过；接受加载预算warnings 5875/8715/1621 tokens与3条历史未索引warning，未以清理历史消除告警。
- Review gate: Required — R2需task-review；当前宿主缺少可配置的只读工具隔离，未将普通协作自检当作最终审查，恢复条件见Block。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 建档、检索、维护和Core修复多个行为协同变化，涉及知识保留与消费者契约，不能按简单局部变更免审。
- Snapshot: snapshot:tasks/artifacts/optimize-context-lifecycle/evidence/53b22e79c7f25d745e41c74f82abeb18140ac4bbbf8466b04f94044811535816.json#53b22e79c7f25d745e41c74f82abeb18140ac4bbbf8466b04f94044811535816
- Evidence: 见T1-T3当前Result；主Agent对照接受方案、自检实际CLI输出和全部相关差异，交叉自检发现的问题已修复；语法、Context及逐包质量检查通过但保留已说明warnings；未运行测试/真实Agent回放。
- Task fingerprint: 2a1bc88727190c40c08c1cca4ff19e128dc5b2411d227925d3178b8e03480024
