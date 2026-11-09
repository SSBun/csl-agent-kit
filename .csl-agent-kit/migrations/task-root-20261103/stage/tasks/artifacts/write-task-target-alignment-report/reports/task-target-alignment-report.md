# Task Target 对齐系统分析报告

- 分析日期：2026-09-11。
- 来源基线：Git 提交 `0f14393430bcae1bb8d807542f2841151c2619e4`；报告编写时，所引用的协议、工作流、核心实现和评测文件与该提交一致。
- 分析范围：当前 CSL Agent Kit 的 Task Target 授权语义、分级交互、任务交接、实现保障与评测边界。
- 文档性质：现状分析，不是运行时规则、实现方案或模型可靠性认证。下文区分协议规定、源码事实与分析判断。

## 摘要

Task Target 对齐系统将用户请求转换为可验收目标，并在执行前检查目标是否完整保留用户授权。它不是“每个任务开始前都问一次确认”，而是根据承诺是否明确、是否发生变化以及确认依据是否仍然有效，选择直接继续、局部核对、澄清或请求变更批准。

当前设计最重要的变化，是把“让用户看见目标”与“等待用户回复”分开：明确请求可以展示 Target 后立即执行，不把重复确认当作安全性的替代品。

系统同时保留三条相互独立的边界：

1. **目标对齐**：Agent 理解的结果是否与用户授权一致。
2. **阶段授权**：用户允许的是规划，还是实际执行。
3. **操作安全**：具体发布、付款、破坏性操作等是否还有独立权限门。

实现层面，授权语义主要由 Agent 按协议判断；Task Core 负责持久化状态、证据、父子关系和完成门禁。因此，当前系统属于“行为协议约束 + 记录状态校验”，不是端到端的机械授权引擎。

## 1. 对齐对象与职责边界

### 1.1 Target、Plan 和证据不是同一件事

| 对象 | 回答的问题 | 典型内容 |
| --- | --- | --- |
| Task Target | 最终得到什么，怎样算完成 | 用户可见结果、可观察完成条件、必须保留的行为与必要边界 |
| Plan | 准备怎样实现 | 当前结果节点、依赖、实施与验证安排 |
| Result | 实际得到了什么 | 与每个 Target 对应的观察和证据 |
| Verification | 当前结果经过什么检查 | 检查内容、观察结果及局限 |

用户可见的 Target 使用固定标题 `Task Target`，包含目标、完成条件，以及必要时的边界。它不应混入命令序列、实现文件清单、算法或内部过程说明。[S1][S3]

对话中的 Target 不替代 canonical task 中的 Target；两者表达的承诺应保持一致，但不会因此创建持久化的“已确认”字段。

### 1.2 三个工作流使用同一套对齐语义

| 工作流 | Target 的含义 | 授权边界 |
| --- | --- | --- |
| `task` | 一个可独立验收的结果 | 在已接受结果与边界内执行 |
| `task-plan` | 所规划任务最终要实现的结果；若唯一具体产物就是计划，则诚实地以计划为目标 | 对齐不授权实施，只允许只读规划和任务记录维护 |
| `task-queue` | 多个任务共同形成的集成结果 | 子任务分别完成不等于父级集成目标已完成 |

三个工作流共享同一份详细协议，而不是各自维护一份分级和确认规则。[S1][S3][S4][S5]

## 2. 授权如何转成候选 Target

### 2.1 先建立 Authorization Ledger

协议要求 Agent 在会话内把用户明确作出的承诺拆成授权原子，每项有临时稳定 ID、归一化含义和消息来源。类型包括：[S1]

- `outcome`：结果。
- `done_conditions`：完成条件。
- `scope`：范围。
- `preserved_behavior`：必须保留的行为。
- `compatibility`：兼容性。
- `side_effects`：副作用限制。
- `tradeoffs`：已接受的取舍。

有效授权来源只有原始请求、聚焦澄清的回答、明确修订，以及此前已接受的 Target。后来的明确用户表达覆盖冲突的旧表达。

源码事实、Agent 自己的总结、未接受的方案、实现便利性和推测偏好不能充当授权。知道项目支持某种功能，不等于用户允许启用它；在任务文件里写下“用户已确认”，也不能替代真实的确认依据。

### 2.2 再进行双向语义等价检查

候选 Target 与授权原子的关系被分为 `preserve`、`add`、`omit`、`weaken`、`change` 和具体的 `unknown`。

只有两个反问都不能成立，才算保留原授权：

1. **候选 Target 已完成，但用户原始要求是否仍可能没有完成？** 若可能，说明遗漏或弱化了要求。
2. **用户接受原始请求，却是否可能合理地拒绝这个候选 Target？** 若可能，说明增加或改变了承诺。

例如，用户要求“分析现有机制”，候选目标却变成“分析并实现优化”，就是新增执行承诺；用户要求“保留全部现有兼容性”，Target 只保留“主要兼容性”，则是弱化约束。

`unknown` 必须指出具体承诺及合理的差异情形。一般性的低信心不能成为升级确认的理由。

### 2.3 等价之后，才检查确认依据是否覆盖

每条承诺的确认依据分为：

- `direct_user`：用户已明确表达。
- `accepted_target`：有可恢复的方案及用户接受依据，且适用于当前范围。
- 仍需核对的等价解释：准确指出待核对项；若实际上构成用户歧义或承诺变化，应转入 L3 或 L4。

复用旧依据时还要检查对象、环境、范围和条件。不同授权不能任意组合：允许本地导出数据，加上允许上传测试数据，并不等于允许上传生产导出数据。

**确认覆盖不能替代完整等价检查。** 即使所有现存条目都能找到来源，遗漏了一条原始约束也不能直接继续。

## 3. L0–L4 分级交互

| 级别 | 触发条件 | 用户交互 |
| --- | --- | --- |
| L0 `NO_TASK` | 不涉及文件修改，也没有具体非平凡结果 | 不展示 Target，直接回答或继续讨论 |
| L1 `TRIVIAL_PASS` | 仅涉及琐碎、确定性的文件操作，且 Target 等价 | 激活任务后可不展示 Target，直接继续 |
| L2 `VISIBLE_CHECKPOINT` | 非平凡目标已就绪，完整保留授权且无无法追溯的候选承诺 | 展示 Target，按确认覆盖决定继续或等待 |
| L3 `CLARIFICATION_HOLD` | 用户拥有的歧义阻止形成诚实目标 | 只问一个聚焦问题，不展示猜测的 Target |
| L4 `TARGET_CHANGE_APPROVAL` | 目标已可表达，但新增、遗漏、弱化或改变了授权 | 展示 Target 和具体承诺差异，等待明确批准 |

这些是对齐交互分类，不是从低到高的操作风险等级。L2 与 L4 都不能清除独立安全门。[S1]

还有一个容易遗漏的例外：L1 可以省略展示；但如果选择展示，则按 L2 的 `trivial_display` 等待路径处理，不能再把它当作“展示后自动继续”。

## 4. L2 的三条主要路径

### 4.1 `show_continue`：展示后继续

对于主会话的明确首次请求、完整用户修订或澄清后就绪的目标，如果全部承诺都有有效依据，且没有强制等待事件：

1. 展示完整 Target。
2. 不附确认请求。
3. 在同一轮继续实质工作。

这是使用已有用户授权，不是把沉默当作同意。后续继承这次对齐时，展示过的 Target 及其用户来源仍须可恢复。

### 4.2 `show_checkpoint`：只等待必要核对

若只有部分解释仍需核对，保留完整 Target 和已明确约束，只问尚未确定的部分。用户补齐最后一项后，不因为改写了 Target 的措辞就再问一次。

以下事件即使不改变目标承诺，也仍然要求等待：

| 原因 | 含义 |
| --- | --- |
| `user_requested` | 用户明确要求先检查再继续，且检查尚未完成 |
| `plan_graph_change` | 子任务分发图发生实质变化 |
| `acceptance_unavailable` | 恢复或压缩后无法找回对齐依据 |
| `trivial_display` | 原本可走 L1，但选择展示 Target |

多个等待原因同时存在时，必须全部保留；完成其中一个不能自动解除其他原因。用户指定了检查项时，以该检查为主要原因；否则图变化优先于依据恢复问题。

### 4.3 `continue_unchanged`：继承未变目标

目标此前已对齐、承诺没有变化、适用依据仍可恢复时，不再重复展示或确认。

它不适用于新的或已修订的 Target，也不能覆盖强制等待事件。用户明确修订先更新授权，再重新判断；不能一律把用户修订当成 Agent 越权，也不能遗漏未被修订的原有约束。

## 5. 激活、交接、委派与安全

### 5.1 激活记录不等于批准执行

具备具体结果后，先激活并聚焦 owning task，再进入对齐。创建、恢复、聚焦、同步和一致性检查等生命周期写入是引导例外，不授权修改请求交付物。[S1][S2]

对齐前不能通过读取任务直接源码、研究实现或分解队列来制造授权依据；对齐后再检查实现事实。确实属于用户的决定才向用户询问，不要求用户认证 Agent 可以自行检查的技术事实。

### 5.2 规划到执行不必重建确认

`task-plan` 转入 `task` 时，如果用户后来明确授权执行，使用同一 canonical record，Target 没变且对齐依据可恢复，就继承原对齐，不额外确认一次。

这里必须同时成立的是“目标语义没变”和“执行已获授权”。仅仅接受规划目标，仍然不能实施。

### 5.3 子 Agent 继承覆盖，不继承无限权限

主会话是 `interaction owner`，负责用户可见确认。委派包包含主任务 ID、所属子任务或 Plan 节点、具体结果、完成条件和边界。

- 当前 Plan 完整覆盖：子 Agent 使用 `continue_delegated`，不重复向用户确认。
- 缺少或过期的委派包、超出范围、需要用户决定或到达安全门：使用 `return_to_main`，停止并返回主会话。
- 子 Agent 不自行展示 L2、L3、L4 或 Safety Confirmation。

新增、删除、重排子任务，或改变子任务结果、完成条件、范围，属于实质分发图变化。即使父级目标仍等价，也需主会话重新检查图后再执行；同一未变节点内的文件、函数、算法和验证方法调整则不触发重新对齐。

### 5.4 Safety Overlay 独立成立

- `S0 NONE`：没有另外适用的安全或权限门。
- `S1 REQUIRED`：具体发布、付款、破坏性操作、凭据、权限、隐私数据或部署等，受独立工作流约束。

在真实操作边界，由主会话单独展示 `Safety Confirmation`，说明动作、对象、后果和适用规则。不能把它混入 Target 的确认尾注；安全确认也不能反过来对齐一个已改变的目标。

## 6. 架构与实际保障

### 6.1 职责分层

| 层次 | 责任 | 不负责的事 |
| --- | --- | --- |
| 注入 Contract | 稳定路由、激活顺序、跨工作流门禁 | 复制全部分级和确认细节 |
| Task 家族工作流 | 激活记录、定义各自 Target 含义、推进后续生命周期 | 各自重写授权语义 |
| 共享对齐协议 | 授权来源、等价、分级、确认、继承与安全边界 | 持久化状态或直接拦截工具 |
| Task Core | Markdown 记录、索引、状态、证据、父子图与完成门禁 | 判断自然语言授权、证明用户同意 |
| 项目评测套件 | 给定场景下的决策、条款依据与展示一致性评分 | 生产运行时授权执行或发布批准 |

共享协议是普通运行时文档，不是独立 Skill，不参与 Skill 发现和路由。[S1][S2][S6][S8]

### 6.2 Task Core 能机械检查什么

源码中的 `parseTask`、`recordResult`、`setReviewGate`、`recordVerification` 和 `completeTask` 表明，核心可以检查：[S6]

- Target 是否存在，ID 是否唯一，是否已有对应 Result。
- 当前状态是否允许进入审查或完成。
- 是否已有符合状态要求的 Review gate 和通过的 Verification 记录。
- 是否还有 Block、活动 Review ledger 或未完成的 Queue 子任务。
- 指定记录变更后，旧审查和验证记录是否按生命周期失效。

这些检查提高状态一致性，但不证明证据内容真实。核心接收的是记录与证据文本，并不会自行执行其中描述的检查。

### 6.3 Task Core 不能独立证明什么

- Target 是否完整表达用户原始意图。
- 某条引用是否真的构成接受。
- 旧授权是否仍适用于当前对象和环境。
- Reviewer 是否实际独立，检查是否实际执行。
- Agent 是否绕过了应有的确认，或后续工具操作是否偏离 Target。

协议明确不将 guard level、alignment 或 confirmation 持久化到 canonical task core。状态门禁存在，不意味着自然语言授权语义已被机械强制。

## 7. 代表场景

以下是说明协议的示例，不是实际模型测试结果。

| 场景 | 应有行为 |
| --- | --- |
| 用户明确要求分析现有对齐机制，候选 Target 只表达该分析结果 | 无其他等待原因时，L2 展示后继续 |
| Agent 自行将分析扩展成实现优化 | L4 列出新增执行范围，等待批准 |
| 用户拥有的选择使完成条件无法确定 | L3 提出一个聚焦问题，不先猜 Target |
| 用户已明确修订报告格式，其他约束仍有效 | 重算目标与覆盖，不重复确认已经明确的格式要求 |
| 用户明确要求先看某个拟定条目再继续 | 保留该条目的等待，不用其他条款已明确作为跳过理由 |
| 已确认计划，用户随后明确要求执行同一计划 | 语义未变、依据可恢复时继承对齐，但仍检查具体操作的安全门 |
| 子 Agent 在既定节点内调整实现方法 | 保持委派范围内继续，不重新确认 |
| 子 Agent 需要新增或重排子任务 | 返回主会话，检查变更后的分发图 |
| 恢复会话后只剩任务文件中的“已确认”描述 | 不能据此认定对齐；找不到有效依据时重新检查 |

## 8. 现有评测覆盖与不能推出的结论

### 8.1 已观察到的事实

本次执行评测布局检查和离线 `validate`，结果如下：[S8][S9][S10][S11]

| 项目 | 观察结果 |
| --- | --- |
| 评测结构版本 | v4 |
| 对照场景 | 46 组 |
| 展开 cases | 92 个 |
| 主会话等级 | L0–L4 均有覆盖 |
| 会话角色 | main、delegated |
| Plan 变化分类 | none、implementation_only、material_graph |
| Oracle 状态 | `provisional` |
| 门禁用途 | `report-only` |
| 布局与数据结构校验 | 通过，校验错误为空 |

评分分别观察 under-guard、over-guard、可见性遗漏、重复条款确认、错误来源复用、已定与待定覆盖遗漏、展示 Target 不一致、Safety 遗漏以及子会话确认泄漏等，而不是只给一个总分。

### 8.2 评测的四个限制

1. **提供候选 Target，不评估自由生成。** 展示类输出须原样返回给定候选，防止偷偷改写后得到正确动作分数；但因此尚未覆盖“用户请求 → 自由生成 Target → 选择动作 → 实际工具执行”的完整链路。
2. **来源匹配不是语义证明。** Scorer 比较条款、依据类型和消息索引是否与 provisional reference 一致；另一组同样有效的来源仍需人工裁定。
3. **局部解释边界的证据有限。** `unsettled_interpretation` 的分区逻辑有合成自检，但套件文档明确说明，该边界尚不能声称具有独立人工标注覆盖。
4. **结构校验不等于模型实测。** Oracle 仍为 provisional，结果保持 report-only。合成 perfect prediction、字段存在或 validator 通过，均不能作为模型可靠性证据，也不是发布批准。

本次没有运行单元测试、项目测试、`--self-test` 或模型评测，没有得到新的实际对齐准确率、重复确认率或越权率。

## 9. 设计价值与主要局限

本节是基于前述证据的分析判断，不是已复现缺陷清单。

### 9.1 设计价值

- **同时防止少做与多做。** 双向等价检查不仅阻止新增范围，也识别遗漏和弱化要求。
- **让可见性与等待各司其职。** 用户可以看到 Agent 的理解，而不必为明确要求机械回复。
- **避免工作流交接产生重复确认。** 对齐跟随结果语义，不因切换 Skill 或委派就自动失效。
- **保留独立安全边界。** 不把目标接受当成对所有后续动作的无限许可。
- **详细规则集中。** 消费入口共享单一协议，降低多份确认逻辑分叉的维护风险。

### 9.2 四个主要局限

| 局限 | 产生原因 | 当前已有约束 | 剩余不确定性 |
| --- | --- | --- | --- |
| 语义判断与执行可能一起出错 | 同一 Agent 提取授权、生成目标、判断等价并选择动作 | 来源追溯、双向检查、分级与安全协议 | 核心不能独立识别一次错误的语义放行 |
| 恢复后可能重复确认 | 授权依据保留在可恢复会话中，而非持久化确认字段 | 依据缺失时要求重新检查，禁止用任务摘要假装接受 | 恢复质量和交互成本仍取决于宿主及会话证据 |
| L2 精细边界执行成本较高 | 需区分等价但待核对的解释、用户歧义和真正承诺差异 | 禁止用泛化低信心制造问题，要求指出具体条款 | 模型能否稳定区分尚缺充分行为证据 |
| 评测尚未覆盖完整行为链 | 当前主要评估给定候选下的决策和结构字段 | 对照场景、分项指标、固定候选、report-only | 自由生成质量、长会话继承和实际工具行为不能据此证明 |

此外，分发图实质变化即使不改变父级 Target，也会要求重新检查。这是当前明确保留的治理选择，而不是重复确认规则的意外例外；它控制执行组织变化，同时带来一定交互成本。

## 10. 总结

当前 Task Target 系统已从“开工前确认提示”发展为“带来源依据、作用域和继承规则的目标授权协议”。它最有价值的原则可以概括为：

> 已经说清楚的不要再问；没有说清楚的只问缺口；Agent 自己增加的承诺必须请求批准。

协议和任务状态机制已有清晰分工，但不能把规则完整性等同于运行时可靠性。当前最大的保障缺口，是 Agent 是否正确提取和理解授权，以及这份理解是否真正约束了后续操作。

本文不提出协议修改或实现承诺；结论用于理解当前系统及其证据边界。

## 11. 来源与验证说明

以下本地链接指向报告编写时核对的文件。它们会随后续工作变化；本文结论以开头列出的提交基线为准。

- **[S1] 共享对齐协议**：授权、等价、L0–L4、确认覆盖、委派与 Safety 的详细权威。文件： ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md)。
- **[S2] 注入 Contract**：稳定路由、激活、对齐、验证与审查边界。文件： ["/Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md)。
- **[S3] 单任务工作流**：canonical Target、Plan、Result 和完成流程。文件： ["/Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md)。
- **[S4] 规划工作流**：规划目标含义、只读权限及执行交接。文件： ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md)。
- **[S5] 队列工作流**：父子目标、分发继承及父级集成门禁。文件： ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md)。
- **[S6] Task Core**：重点核对 `parseTask`、`syncIndex`、`recordResult`、`setReviewGate`、`recordVerification` 和 `completeTask` 的实现。文件： ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js)。
- **[S7] 契约断言**：协议与消费入口的静态约束；仅阅读相关断言，未运行该测试。文件： ["/Users/caishilin/Desktop/personal/skills/tests/task-files.test.mjs"](file:///Users/caishilin/Desktop/personal/skills/tests/task-files.test.mjs)。
- **[S8] 评测套件说明**：评测范围、v4 字段与尚未覆盖的语义边界。文件： ["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/README.md"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/README.md)。
- **[S9] 评测数据**：场景与 oracle 元数据，通过 validator 核对整体结构；未声称逐案完成人工裁定。文件： ["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/cases.json"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/cases.json)。
- **[S10] 评分与校验实现**：重点核对 `validateConfirmation`、`confirmationContractErrors` 和 `scorePredictions`。文件： ["/Users/caishilin/Desktop/personal/skills/evals/scripts/evaluate-task-target-alignment.js"](file:///Users/caishilin/Desktop/personal/skills/evals/scripts/evaluate-task-target-alignment.js)。
- **[S11] 评测布局检查入口**：本次运行布局检查并观察通过。文件： ["/Users/caishilin/Desktop/personal/skills/evals/scripts/check-project-evals.js"](file:///Users/caishilin/Desktop/personal/skills/evals/scripts/check-project-evals.js)。

验证方法为源码与协议交叉核对、相关文件与提交基线的一致性检查、评测布局检查和离线数据结构校验。未执行的测试或模型运行不计为通过；协议规定、源码行为与分析推断也不互相替代。
