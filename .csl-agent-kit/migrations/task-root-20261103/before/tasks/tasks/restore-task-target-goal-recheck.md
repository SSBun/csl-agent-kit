# 规划恢复 Task Target 的用户目标复核职责

Status: Completed (2026-09-14 17:20)
Kind: Plan

## Scope

- 用户已明确要求执行本方案；实施结果是恢复用户目标复核，不是单纯提高提示出现率或让 Agent 更确信自己的理解。
- 修复范围为主会话非平凡 Task Target 的首次复核、实质修订、有效确认复用，以及对应协议、注入摘要和评测的一致性。
- 保留既有 L0／L1 适用范围、有效 delegated child 继承、Queue 分发图门禁、L3／L4、安全确认和规划不授权执行的边界。不把小 diff、低风险或请求详细当作新的 L1 豁免。
- 不新增 Pi 专用拦截器、确认工具、全局确认数据库或 canonical task confirmation 字段；不修改任务状态机、R0／R1／R2 Review 协议及历史任务。若以后要求工具层不可绕过的保证，需要单独设计跨宿主执行门。
- 本次实施已规划的协议、评测与必要说明修改；用户已授权本地聚焦测试／自检及六个子 Agent 的有限模型策略测试，均已执行。授权不包含完整模型 corpus 或真实主会话端到端回放，不扩大到全项目测试。

## Target
- [x] T1: Task Target 协议与消费者落实首次及实质修订目标的用户复核，不以明确授权替代用户接受；完成本次限定的本地与模型策略验证，并明确保留真实主会话端到端未验证说明

## Decisions

### 当前验收与提交范围

- 用户要求“commit all changes and mark the task finished”，并在主会话明确询问“是否接受将真实主会话端到端验证移出本次完成条件，保留未验证说明；补做最终独立复审，通过后标记完成并提交全部未忽略本地改动，不推送远端”后回答“yes”。
- 本次按协议实现、现有本地聚焦验证与限定模型策略验证验收；真实主会话端到端验证移出完成前置条件，仍如实记为未验证。这只调整本任务的验收范围，不修改默认协议，不把未执行检查写成通过，也不取消 R2 最终独立复审。
- 本地提交包含当前全部未忽略改动，包括已有其他任务记录变更；仅提交其现状，不改写其他任务状态。忽略的模型运行目录不强制加入 Git，不 push、不发布、不自动追加模型测试。

### 核心修复

1. 将授权自检与用户目标复核分开。Authorization Ledger 和双向语义等价检查继续负责发现遗漏、弱化、擅自增加与组合越界；它们通过只表示 Target 可以交给用户核对，不表示核对已经完成。
2. 新的非平凡主会话 Target 必须完整展示 Outcome、Done when 和必要 Boundaries，询问这是否准确表达用户想要的结果，并结束当前轮等待回复。用户原话详细、条款均有 `direct_user` 来源、模型有高置信度，都不能跳过首次用户复核。
3. 移除 `show_continue` 作为合法的初次／修订目标对齐路径。免重复核对只使用既有 `continue_unchanged`：能恢复此前展示的完整 Target 及用户接受消息，当前结果、完成条件、边界、适用对象和环境仍一致，且没有独立强制门禁。用户请求本身、任务勾选、Agent 摘要或旧 `show_continue` 记录不构成这种证据。
4. 用户接受目标与授权当前阶段仍分开：规划时的确认只允许方案研究；现已获得明确实施请求，Target 未变且确认依据可恢复，因此复用本记录与已有接受，不再次核对同一目标。
5. 不回退整个历史提交。只移除把明确授权升级为已完成目标复核的逻辑，保留该次及其他修改中关于来源、范围、组合效果、用户纠正、delegation 与 Safety 的有效保护。

### 交互与失效规则

| 场景 | 预期行为 |
| --- | --- |
| 首次明确、非平凡请求 | 形成最小忠实 Target，完整展示，询问目标理解是否准确，等待用户；不得展示后继续研究或执行 |
| 用户拥有的关键结果选择尚不清楚 | L3 只问一个聚焦问题；答案使 Target 就绪后展示完整 Target 等待，不能把回答局部问题自动当作接受整个目标 |
| 用户回答 `confirm`、明确肯定或现有有效接受快捷回复 | 仅接受当前实际等待的已展示 Target；目标没变时继续当前获授权阶段，不再制造同义确认循环 |
| 用户回复同时包含认可和结果变更，例如“确认，但只处理当前目录” | 作为授权修订而非接受旧 Target；完整展示修订后的目标并突出变化，等待用户核对 |
| 用户只是换措辞，或调整不改变结果的实现方法 | 依据可恢复的已有目标接受继续；不得以内部命令、文件或算法变化制造重复目标关卡 |
| Agent 提议改变结果、验收或边界 | L4 展示具体差异并等待批准；批准不能清除独立安全门 |
| 用户只提问、犹豫、部分接受或回复无关内容 | 不视为完整接受；保留当前目标及未完成的核对，不进入实质工作 |
| 压缩／恢复后只能找到原始请求或 Agent 自称已确认 | 重新展示并等待；不迁移旧自动继续为新协议下的用户接受，不改历史记录 |
| 已确认 Target 不变，但用户明确要求再核对或 Queue 分发图实质变化 | 保留各个强制门禁；一个回复不能静默清除未说明的其他门禁 |
| 有效主 Plan 覆盖的 delegated child | 继续继承主会话已完成的目标核对；缺失覆盖、改变图、用户决定或安全边界回到主会话，子 Agent 不直接询问用户 |
| L0／既有纯琐碎确定性 L1 | 保持现有跳过边界；L1 若主动选择显示确认关卡，仍按现有规则等待 |

- 每次新的或实质修订后的 Target 都核对完整的当前目标；提示可以强调改变之处，但继承约束不能消失。用户核对的是 Agent 归纳后的整体结果，而不只是新增字句的权限。
- 对齐前只允许 Project Core、最小 ownership 查询、Task 激活／focus／sync／check 等既有引导操作，以及协议允许的目标形成澄清。展示 Target 后不能借“只是只读”继续源码调查、设计方案或委派。
- 完成核对需要明确接受已展示目标的证据，不把沉默、工具成功或一条来源索引当作接受。来源顺序、关联目标、对象、范围与组合效果都必须成立。

### 修改位置与职责

- **唯一详细协议：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md)。同步目的、L2 表格与决定顺序、首次展示／等待、确认与修订、恢复／复用及 compact packet；把 `direct_user` 留在授权来源层，不再作为完成用户目标复核的证据。
- **默认注入摘要：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md)。用简短稳定规则说明目标复核的目的、首次等待、未变已接受目标不重复核对；删除“明确提出即免确认”的摘要，详细算法仍委托共享协议。
- **三个消费者：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md)、["/Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md)、["/Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md)。当前均已要求激活后、实质工作前读取共享协议；原则上复用，不在三个包复制一份门禁算法。只修正与新协议直接冲突的措辞。
- **评测与静态契约：** ["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/cases.json"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/cases.json)、["/Users/caishilin/Desktop/personal/skills/evals/scripts/evaluate-task-target-alignment.js"](file:///Users/caishilin/Desktop/personal/skills/evals/scripts/evaluate-task-target-alignment.js)、["/Users/caishilin/Desktop/personal/skills/tests/task-files.test.mjs"](file:///Users/caishilin/Desktop/personal/skills/tests/task-files.test.mjs)。共同维护行为预期、字段语义、来源检查、动作判分和回归断言；不能仅修改协议却留下旧正确答案。
- **当前说明：** ["/Users/caishilin/Desktop/personal/skills/PRINCIPLE.md"](file:///Users/caishilin/Desktop/personal/skills/PRINCIPLE.md)、["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/README.md"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/README.md)、["/Users/caishilin/Desktop/personal/skills/evals/skills/task-target-alignment-eval/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/evals/skills/task-target-alignment-eval/SKILL.md)。同步定义、命令 schema 和证据局限，保留项目评测仅本仓库发现的边界。
- **Context：** 实施时更新 ["/Users/caishilin/Desktop/personal/skills/tasks/context.md"](file:///Users/caishilin/Desktop/personal/skills/tasks/context.md) 中 CTX-task-workflows、CTX-task-context 与 CTX-project-evals 的受影响结论；不改 Project Core，不把当前候选方案提前写成已实施事实。
- **不变实现：** ["/Users/caishilin/Desktop/personal/skills/pi/extensions/csl-context-hooks.ts"](file:///Users/caishilin/Desktop/personal/skills/pi/extensions/csl-context-hooks.ts) 与 ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js) 当前分别负责提示接入和持久状态，不伪装成已有目标确认硬拦截。协议修复保持跨宿主，不扩展上述组件职责。

### 评测变更约定

- 当前只读校验通过：布局有效，v4 fixture 为 46 个场景／92 个案例；其中首选动作包含 24 个 `show_continue` 和 3 个 `show_checkpoint`。这是 fixture 标签分布，不是实际用户会话触发率。
- 评测升级为 v5：cases、request、prediction、report、comparison 及 reader／writer 同步版本，防止旧语义报告冒充修复后的行为证明。保留既有稳定 case ID、对照结构与非本次修改的行为覆盖；重新核对 24 个旧自动继续正例，不进行无语义依据的机械全量替换。旧报告留作历史，不自动迁移，不新增通用旧版兼容层。
- 将原 `settledClauses` 改为 `authorizedClauses`，仍保存条款、`direct_user`／`accepted_target` 依据及来源索引，明确这组字段只证明内容的授权来源。`confirmationItems` 独立表示本次请用户核对的条款；首次／实质修订时可以与已授权条款重叠，不再用二者互斥分区推导免等待。
- 新增 `goal_recheck` 原因表示目标理解需要用户复核，替代把首次核对解释为“尚未明确的授权条款”。首个完整目标和实质修订目标用完整条款集合；用户显式要求的局部再次核对继续只点名其指定项。图变化、接受依据缺失、trivial display 等保留事件原因，不制造条款歧义，多重门禁保持完整。
- `continue_unchanged` 的评测证据不再恒为空：候选目标各条款都必须有适用的 `accepted_target` 来源，包含此前提案和用户接受消息；仅有 `direct_user` 或 assistant-only 摘要须判为错误复用。Whole-Target 适用范围和组合效果仍由语义核对及人工样例支持，字段非空不是证明。
- `show_continue` 不再出现在合法 oracle 决策中；评测 reader 仍能识别模型输出这一已知错误动作，并计入漏等待／under-guard，不能把它当作基础设施失败排除。策略错误与 JSON 损坏、模型调用失败分别报告。
- 保留并重新解释独立指标：目标遗漏／失真、未展示、未等待、未经接受的复用、已确认不变目标的重复核对、L3／L4 错分、Safety 漏门、child 越界、修订后旧证据复用。首次必要复核不得继续算作 redundant confirmation。维持 provisional／report-only，不将固定 reference 匹配包装成模型理解能力证明。
- 对比只接受相同 v5 数据集内容身份的报告；旧 v4 与新 v5 总分不能直接比较。若实际比较修复前后模型行为，使用同一组新判定标准和场景，分别记录所用协议与模型身份，不将人工改写 prediction 当作真实运行。

### 验收与验证边界

- **协议层：** 首次明确请求仍等待；授权来源检查和用户接受检查分别成立；接受后不变继续；修订、来源缺失和独立门禁重新阻止工作；没有额外丢失授权约束。
- **回归场景：** 明确详细请求、宽泛请求先澄清、用户确认、确认同时修订、只接受局部、无关回复、仅实现变化、plan → task、有效子任务继承、跨对象／环境错误复用、旧 show_continue 恢复及多门禁同时存在。为等待与不等待各保留对照，防止只降低漏确认而造成处处重复确认。
- **真实交互限制：** 固定候选 Target 分类评测不足以证明完整流程；本次未验证 Agent 自行归纳目标、真实结束该轮和用户回复前后的工具时序。用户已明确将这项端到端检查移出本次完成条件，保留限制说明；以后若验证，仍应在安全的新上下文中区分引导操作与实质调查，不仅检查 `Task Target` 字样。
- **允许的非测试检查：** 语法检查、eval layout、fixture validate、受影响包的 Skill Quality、Context validate 和 diff 空白检查。它们证明结构及消费一致性，不证明真实模型会等待。用户未授权行为运行时必须披露缺口，不能将 T1 的实际行为标为已经验证。
- **实施审查：** 这是跨消费者的交互门禁语义变更，按 R2 执行既有 fresh task-review，不能以改动主要是 Markdown 或验收范围调整为由免审；不调用 adversarial-review。

### 最可能的失败及防护

1. **只改默认提示，协议仍允许自动继续。** 在唯一详细协议、注入摘要、评测和当前说明中同步移除这条合法路径，并检查旧路径仅残留在历史和明确负例。
2. **用 `continue_unchanged` 绕回原漏洞。** 要求完整目标的真实提案与用户接受来源，加入“原始请求／旧自动继续／Agent 自称确认”的负例，并核对来源时序、对象和组合效果。
3. **过度修复导致每轮都问。** 已确认不变目标、实现调整、明确执行同一计划与有效 delegated child 保留对照；接受回复不生成新的同义目标关卡。
4. **目标形式出现了，但用户没有纠偏机会。** 真实交互观察等待与首个实质工具调用的先后关系，并核对生成目标的结果、完成条件和边界，不能只用文本匹配验收。
5. **静态全绿被当作模型可靠性。** 分开记录结构校验、人工语义审定和真实交互结果；未授权或失败的行为检查保持未验证，不能以合成预测、旧版本报告或字段齐全替代。

### 小规模多 Agent 模型验证安排

- 用户现要求使用多个子 Agent 测试修复。先进行聚焦的模型策略验证，不把多个 Reviewer 的主观认可当作行为测试，也不把给定候选的判断或角色模拟说成主会话端到端验证。
- 实际使用 `openai-codex/gpt-6-astra:high`，选择 8 个聚焦案例，每批最多 4 个互不关联的案例，3 次 fresh 重复，共 6 个测试子 Agent／24 条模型判断，实际峰值并发 2。只使用 oracle-free 输入，不提供标准答案，结果保存在现有 ignored results 中；未运行完整 110 案例模型评测。
- 覆盖首次明确请求、真正接受、确认同时修订、局部接受、旧自动继续恢复、目标越界、独立 Safety 与有效 delegated child。单独报告等待、错误复用、重复确认、边界遗漏与基础设施失败，不只看总分。
- 这种自动验证只检查模型在新上下文中的策略判断，不证明 TR-2 所指的真实主会话行为。用户已调整本次验收范围，TR-2 应由最终 fresh Reviewer 核对其当前阻塞性，而不是用模型抽样冒充端到端证据；子 Agent 正常继承对齐也不能被误判为漏门禁。
- 模型额度边界已由本轮独立 Safety Confirmation 及用户回复确认：最多上述 6 个测试子 Agent，会消耗当前 Codex 模型额度；尚无可核验的精确费用报价，不承诺货币硬上限，不自动扩大评测或重试失败任务。
- 本次运行使用冻结的 oracle-free 输入、随机分批、每波最多 2 个 fresh 只读 evaluator，模型为 `openai-codex/gpt-6-astra`。生成输入和调度已保存于 ["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/results/astra-goal-recheck-smoke-20260914-164433"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/results/astra-goal-recheck-smoke-20260914-164433)；完整 corpus 为 110 案例，仅上述授权的 8 案例参与本次模型判断。评分器若按全 corpus 报告未执行的其他 102 案例，需与所选案例缺失或真实基础设施失败分开披露，不声称全套模型评测通过。

### 多 Agent 验证结果与编排恢复

- Workflow `2abbdf5f-8264-4b4f-9c36-4da789704f0b` 已因基础设施错误停止：`emit[0].outputPathMapping must be a JSON value; received undefined.`，位置为生成调度脚本第 26 行。原因是主 Agent 的汇总对象包含可选 undefined 字段，不能作为 JSON 交给 emit；不是被测 Task Target 的判定失败。
- 初始 workflow 只启动首轮两个 fresh 子 Agent（`c34e53b9-0781-4454-b7b1-b414b766a100`、`3635fd64-cd6f-461a-b543-cfe9c70342b9`），各产生四条结构化预测后停止；没有自动重试或切换执行方式。后四个批次在用户随后授权修复后才启动，现已完成。
- 两个指定输出文件为空，但工具的 `structuredOutputPath` 保有有效模型输出，已逐字恢复到运行目录中的 `repeat-1-batch-1.structured.json` 与 `repeat-1-batch-2.structured.json`，保留原始来源路径及 SHA-256，不伪造预测。
- 子运行另报告 inferred acceptance rejected：宿主误套用了“实现变更／运行命令”的 writer 验收模板，而本次是只读预测任务。补跑已显式设置只读 evaluator 的无代码验收策略，四个后续 child 均报告 not-required；不能把首轮 rejection 当作模型政策判断结果，也不能取消 owning task 的 R2 review。
- 现场：共享 cwd `/Users/caishilin/Desktop/personal/skills`、branch `main`、HEAD `20583fbcf0f0cae3f9e53496d94e2175eb4a1a13`，未分配 managed worktree；工作区含先前未提交变更。与测试前内容清单相比，交付物哈希无漂移；相关 dirty diff 已保存为运行目录的 `blocked-worktree.patch`，运行 metadata 已标注基础设施阻塞。
- 用户回复 `fix` 已授权按所提范围修复并补跑。已创建独立的 remaining-workflow.js，保留失败脚本不覆盖；从第 3 个批次开始，返回／emit 均使用 JSON-safe 投影，并显式声明 evaluator 无代码实现验收义务（不改变 owning task 的 R2 review）。离线校验发现并修正一个多余右括号，随后静态 validate 通过；这次校验没有模型调用。补跑 workflow `49c819af-26c4-4e3c-87e1-8e41b72f9c4f` 已完成，新增四个 fresh 子 Agent，复用首轮八条真实预测，累计正好六个。
- 当前模型结果：8 案例各 3 次，共 24／24 个门禁动作符合当前参考答案；15 次应等待判断无漏门，18 次展示判断无内容遗漏，6 次适用 Safety 判断无漏门，错误复用／重复确认均为零。按参考标签逐字段比较为 21／24 一致：遥测上传越界案例三次都额外标了 done_conditions／scope，暂作 provisional 标签粒度分歧，不修改 oracle。
- 当前评分器使用全 110 案例，因此原始全 corpus 报告因 102 个有意未执行案例返回退出码 2；所选八案例全部有三次有效预测，无模型输出缺失或解析失败。范围汇总与原始报告分开保存，不能宣称全量 PASS。源文件哈希前后无漂移；运行时报告费用估计合计约 $1.24383，不是账单证明。
- 完整报告：["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/results/astra-goal-recheck-smoke-20260914-164433/summary.md"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/results/astra-goal-recheck-smoke-20260914-164433/summary.md)。原始预测、结构化来源哈希、子运行身份、错误恢复与范围统计位于同目录。模型输出是固定候选策略判断，未提供 TR-2 所需的真实主会话工具时序。

## Plan

1. 实施获明确授权后，沿用本记录和已核对的 T1；先重查相关源码与未提交修改，按上述核心决策修订共享协议，形成首次、确认、修订和复用的闭环，不改变其他安全与任务生命周期边界。
2. 同步默认注入摘要、必要消费者措辞、当前说明及受影响 Context Packs；具体门禁只保留一个详细权威，避免三个 Skill 各自演化。不要回滚整次历史提交或改写无关任务。
3. 将评测及静态契约升级到分离授权与用户接受的新语义，补齐正反例、修订／恢复时序与错误直行计分；保证同一候选数据能被所有新 reader／writer 一致消费。
4. 完成允许的非测试检查；仅在当前另获明确授权后运行聚焦测试与真实交互回放。对照 T1 记录哪些证据证明规则一致、哪些证明实际等待与纠偏，未取得的行为证据不能标为通过。
5. 按用户已确认的当前验收边界完成 owner 自检、R2 fresh task-review 与最终验证，核销已有 finding，保留未做端到端检查及其他已披露限制后完成任务。
6. 复核全部未忽略本地改动与暂存内容，将本任务完成记录及其他现有改动一起本地提交；不推送远端，检查提交后无未提交的未忽略改动。

## 交接

- 当前阶段已完成实现、本地聚焦验证和有限模型策略验证；保留真实主会话交互验证缺口。若用户要求不可绕过的程序强制门，先重对齐范围，不能假称本方案已提供这种保证。

## 当前实现与自检

- T1 的协议实现：共享协议已将首次／实质修订的非平凡目标改为完整展示、结束当前轮并等待；授权条款与目标复核分离，旧自动继续不能用作接受证据，未变目标复用需要真实提案和后续接受。默认注入摘要、当前说明与三个受影响 Context Packs 已同步；三个 task-family 消费者保持共享协议委托，未改宿主或 task core。
- T1 的评测实现：v5 cases／request／prediction／report／comparison 同步，`authorizedClauses` 与复核项允许重叠，`continue_unchanged` 要求完整候选及 accepted_target 依据；已知 `show_continue` 错误仍可读取并计分。24 个旧直接继续正例转为目标复核，补齐接受、局部接受、修订、恢复与组合门禁，共 55 场景／110 案例。用户后续授权后已运行 scorer 自检和本地任务契约测试，结果见下述当前证据。
- 已执行且通过：两个改动 JS／MJS 的 `node --check`，eval layout，v5 fixture validate，oracle-free request prepare，Context validate 与 `git diff --check`。检查项目 package scripts 后没有运行包含测试的 `npm run check`。
- Skill Quality：agent-hooks（1311 tokens）、task-target-alignment-eval（1405）、task（5528）、task-plan（1512）、task-queue（1994）均零失败，仅 context-budget warning。三个 task-family 包未改，作为共享协议消费者补查；保留必要工作流完整性，不通过删除门禁消除预算警告。
- 已检查最可能的五类失败：默认摘要与协议冲突、unchanged 绕过、每轮重复确认、只展示不等待、静态结果冒充实际行为。前三类有当前规则和 fixture 来源对应；后两类的真实交互证据尚未取得。
- 限制：本地聚焦测试、自检及固定候选模型策略测试已执行，但真实主会话回放未运行，不能声称实际等待／自由生成目标／纠偏行为已经验证。用户明确接受在保留此说明的情况下移除该完成前置条件；最终独立审查核对当前实现和验收范围，不替代未执行的行为检查。
- 独立只读 task-review Pass 1 已返回（workflow `66caaa13-3619-42ee-bad6-cfc546787d7e`，child `8ec71448-867f-4f78-9fae-0875df7e1d60`）；接收时重算全部快照文件哈希，无内容漂移。报告指出 TR-1 组合必需原因遗漏被普通 5% 容差稀释，TR-2 实际交互证据缺失阻止 T1 验证。原始报告：["/Users/caishilin/.pi/agent/sessions/--Users-caishilin-Desktop-personal-skills--/subagent-artifacts/outputs/66caaa13-3619-42ee-bad6-cfc546787d7e/tasks/artifacts/restore-task-target-goal-recheck/reports/task-review-pass-1.md"](file:///Users/caishilin/.pi/agent/sessions/--Users-caishilin-Desktop-personal-skills--/subagent-artifacts/outputs/66caaa13-3619-42ee-bad6-cfc546787d7e/tasks/artifacts/restore-task-target-goal-recheck/reports/task-review-pass-1.md)。报告中的合并措辞不作为任务审批或完成授权。
- TR-1 已作代码修正：独立统计 `requiredReasonMiss` 并采用零容差失败判定，普通 `reasonIncompleteRate` 的 5% 容差保持不变；报告／比较输出该独立指标，组合门禁自检覆盖两种统计。授权后的 scorer 自检已实际通过；仍待 fresh Reviewer 核销，未将 TR-1 单方面标为 resolved。
- 本地验证前重算 snapshot-after-tr1 的全部文件哈希，无漂移；`node evals/scripts/evaluate-task-target-alignment.js --self-test` 成功，110 案例合成基线与漏门、重复确认、错误复用、组合原因等回归检查通过。该合成检查只证明评分器，不是真实模型行为。原始日志：["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/local-scorer-self-test.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/local-scorer-self-test.log)。
- `node --test tests/task-files.test.mjs` 实际结果为 21／22 通过；唯一失败是 Task Maintenance 的小写 `delete quarantine only after every postcondition passes` 断言，与正文大写 `Delete` 不符。对照基线 `20583fbcf0f0cae3f9e53496d94e2175eb4a1a13`，该断言已存在，maintenance Skill 字节未变，基线正文同样只有大写。未运行基线测试、未宣称整个文件全绿，也未修改无关 maintenance 契约。证据：["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/local-task-contract-tests.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/local-task-contract-tests.log) 与 ["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/unrelated-maintenance-baseline.json"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/unrelated-maintenance-baseline.json)。
- 按 test-name-pattern 单独复跑 task workflow、注入 Contract、当前 Context 与 CSL task contract 四项，本次目标复核相关契约 4／4 通过，未改测试内容或添加 skip。日志：["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/local-goal-recheck-tests.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/restore-task-target-goal-recheck/evidence/local-goal-recheck-tests.log)。

## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 跨消费者的目标复核与v5评分策略变更；按用户已确认的限定验收范围执行最终独立复审，不降级审查
- Snapshot: snapshot-sha256:bc2926820b1748ef9d60a7b5e0bb9f2d841cd469080a8a32024d886bbd62c50a; tasks/artifacts/restore-task-target-goal-recheck/evidence/snapshot-after-model-smoke.json
- Evidence: 当前验收与提交范围、当前实现与自检及T1 Result；本轮重跑非测试语法/fixture/Context/diff检查并核对22项源文件和证据哈希。先前本地测试和模型原始日志可访问；不声称端到端已运行；TR-1修正与TR-2新验收分类待fresh复核
- Task fingerprint: d7e98bebc50942bf0fbda06befac5a291dae8bb44cf500ac7d730ded7ad1100f
## Result

- T1: 共享协议和消费者已落实首次/实质修订目标展示后等待及真实接受复用；目标相关本地契约4/4、110案例scorer自检通过，6个fresh子Agent的24个门禁动作全部匹配（完整参考字段21/24）。用户已明确将真实主会话端到端验证移出本次完成条件，仍保留未验证说明；无关maintenance基线断言失败未改。源文件和全部已用证据22项哈希复核无漂移
- Review gate: Passed — Fresh只读Reviewer b83fc642-b015-4c31-8870-5d86d9094e29 的Pass 2报告无新增finding；TR-1 resolved，TR-2依据用户明确移出端到端前置条件的验收调整解除阻塞但仍未验证。报告 tasks/artifacts/restore-task-target-goal-recheck/reports/task-review-pass-2.md；owner在接收时重算22项文件及证据哈希无漂移

## Verification

- Passed: 最终复审后语法、110案例fixture validate、Context validate、diff检查通过；22项文件/证据身份未变，复用已运行的4项相关契约、自检和24条实际模型预测。按用户确认的限定验收完成；保留端到端未验证、21/24字段一致及无关maintenance基线断言失败说明
