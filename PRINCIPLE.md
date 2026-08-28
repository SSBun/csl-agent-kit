# CSL Agent Kit：工作流与设计思想

CSL Agent Kit 把规则注入、任务管理、上下文恢复、纠错学习和验证门禁组织成一套工作流。它让 Agent 在不同任务和会话中持续遵守规则、理解目标、保留必要上下文，并用证据证明工作已经完成。

整个系统以两族 meta 工作流为核心：

- **`agent-*`** 管理“Agent 应当如何长期行动”：无条件规则、条件触发、脚本自动化和按需 SOP；
- **`task-*`** 管理“一个结果如何被承诺、执行、验证和恢复”：任务激活、Target 对齐、计划、队列、评审、Context 与 Lessons。

`task-context`、`task-lessons`、`skill-quality`、`archive` 以及共享 task core/protocol 提供定向、记忆、质量与历史支撑。

---

## 1. 为什么设计 CSL Agent Kit

单次 Agent 对话很容易工作，长期协作却会遇到一组稳定的问题：

1. **规则没有合适的载体。** 一次性要求、跨项目偏好、项目约束、条件自动化和标准操作流程混在同一份指令里，既浪费上下文，又难以判断什么时候生效。
2. **Agent 太早进入实现。** 用户刚提出结果，Agent 就开始搜索、规划甚至编辑，却还没有确认“什么算完成”。
3. **任务记录变成过程日记。** 文件里堆满步骤、对话和勾选项，但真正的完成条件与证据反而不清楚。
4. **详细计划快速腐烂。** 实现路径一变，计划立刻过时；后来接手的 Agent 要么盲从，要么无视。
5. **会话恢复依赖重新探索。** 项目事实、当前任务和纠错经验没有分开，新 Agent 只能重新阅读整个仓库。
6. **完成依赖 Agent 自我判断。** “看起来没问题”被当成完成，没有可复现验证，也没有结构化门禁。
7. **昂贵流程容易被自动触发。** 高风险或大改动被误解为必须进入多 Agent 评审，成本不断扩大，却未必提高正确性。

CSL Agent Kit 由此建立了一条短而可信的工作路径：

> 把规则放到正确的载体；先对齐结果，再理解流程；只记录必要状态；做最小正确改动；最后用证据完成，而不是靠自信完成。

---

## 2. 系统全景

### 2.1 工作流分层

| 层 | 核心能力 | 解决的问题 |
|---|---|---|
| **持久指令层** | `agent-rules`、`agent-hooks`、`agent-sops` | 什么行为长期生效、何时注入、按什么条件执行 |
| **任务执行层** | `task`、`task-plan`、`task-queue`、`task-review`、`task-grill` | 一个或多个结果如何对齐、执行、审查和交接 |
| **任务记忆层** | `task-context`、`task-lessons` | 项目事实与防复发规则如何跨会话保留 |
| **共享状态层** | `csl-tasks` core、Task Target Alignment Protocol | 状态、证据、父子关系、索引和对齐语义如何保持一致 |
| **辅助质量层** | `skill-quality`、`archive` | Skill 包如何确定性检查；原始会话如何逐字保存 |

### 2.2 端到端工作流

```text
用户请求
  │
  ├─ 会话开始：Agent Hooks 注入 Rules、工作流契约与 SOP 摘要
  │
  ├─ Orient：加载 Project Core，恢复最小项目模型
  │
  ├─ 是否形成具体结果？
  │    ├─ 否：普通问答或开放讨论，不创建任务
  │    └─ 是：创建/恢复 canonical task，并绑定 task_focus
  │
  ├─ Align：对齐 Task Target，只承诺结果与完成条件
  │
  ├─ Prepare：按需读取 Context Packs、Lessons、SOP 与任务直接来源
  │
  ├─ Execute：按当前路线做最小正确改动
  │
  ├─ Verify：记录每个 Target 的 Result、验证证据与评审门状态
  │
  ├─ Complete：fail-closed 门禁确认所有条件满足
  │
  └─ Maintain：必要时更新 Context 或经确认更新 Lessons
```

这条链路依赖固定顺序：先获得授权，再调查；先调查，再编辑；验证通过后才完成任务。

---

## 3. 核心一：`agent-*` 持久指令工作流

`agent-*` 解决的是：哪些行为需要长期存在，应该存在哪里，以及在什么时候进入 Agent 上下文或执行环境。

### 3.1 三种载体，各管一种时机

| 载体 | 生效方式 | 适用内容 | 不适用内容 |
|---|---|---|---|
| **Agent Rules** | 会话开始时无条件注入 | 简短、明确、始终适用的行为规则 | 条件判断、脚本、长流程 |
| **Agent Hooks** | 在 lifecycle timing、文件变更或命令匹配时注入 Prompt 或运行脚本 | 跨会话指令、通知、守卫、自动化 | 一次性操作、Git 原生可强制的规则 |
| **Agent SOPs** | 当前任务匹配 `name` / `when_to_use` 时完整加载 | 稳定流程、异常处理、判断规则、完成标准 | 所有会话都必须注入的短规则 |

载体按注入时机选择。

如果程序性知识写进 Rules，每次会话都要承担上下文成本；如果无条件约束写进按需 SOP，关键时刻可能没有加载；如果一次性偏好写成 Hook，它会污染未来所有会话。

### 3.2 Agent Rules：短、无条件、可预测

Agent Rules 使用 Built-in、User、Project 三层来源：

1. Built-in：随包分发的只读默认规则；
2. User：跨项目生效的用户规则；
3. Project：只对当前工作区生效的项目规则。

`inner:agent-rules` 按 Built-in → User → Project 顺序合并，统一注入一个 `## Agent Rules` 区块。每条规则是一个简短的命令式列表项，不添加 YAML，不承载长流程。

规则可以叠加，但来源必须透明。用户可以补充内置行为，项目可以增加本地约束；`AGENTS.md` / `CLAUDE.md` 仍由宿主管理，不与 Agent Rules 系统混为一谈。

### 3.3 Agent Hooks：把不同 Agent 的 Hook 能力聚合成一个统一系统

Agent Hooks 把 Codex、Claude Code、Pi 等宿主原本不同的 Hook 能力聚合为一套事件、条件、动作和状态模型。用户面对的是同一个 Skill 和同一种规则语义，无需先记住每个宿主的配置文件、payload 结构和生命周期 API。

#### 统一事件、条件与动作

每条 Hook 都可以被表达成四个部分：

| 部分 | 含义 | 示例 |
|---|---|---|
| **Timing / Event** | 什么时候观察 | `session-start`、`prompt-submit`、工具调用前后 |
| **Condition** | 什么情况下触发 | command、changed files、精确 JSON Pointer；可组合 `all` / `some` |
| **Action** | 触发后做什么 | 注入 Prompt、运行脚本、在宿主支持时阻止操作 |
| **Scope** | 规则归谁管理 | global、project metadata、随包分发的只读 inner hook |

条件只有明确计算为 `true` 才触发；事件里缺少的数据是 `unknown`，不会被猜成命中。复杂策略放进经过审查的脚本，简单文件或命令匹配留在声明式条件中。

统一层不要求所有宿主原生事件完全相同。Adapter 把宿主事件转换成统一协议，再明确报告当前 host 是否支持这个 event/action：

- **Codex** 是参考宿主，支持统一协议覆盖的 inject/script，以及协议允许位置的 block；
- **Claude Code** 共享同一 Hook 协议，按当前实现与 Codex 保持一致；
- **Pi** 由 `csl-context-hooks` extension 映射生命周期，在可改写模型上下文的位置支持 inject，并对支持事件执行 best-effort script；block、permission/subagent 类事件在 Pi 上不可实现，会明确显示 unsupported；
- **Cursor V1** 缺少 Prompt 注入通道，对应规则保持 unsupported / inactive，不用文件替换或其他回退伪装为 active；
- 其他宿主缺少所需通道时，同样保持 inactive，而不是悄悄假装生效。

统一层用同一种语义描述能力，并把宿主差异转成可观察状态。

#### 比 enabled / disabled 更丰富的状态模型

一个 Hook 是否真正生效，不能只看文件是否存在或开关是否打开。Agent Hooks 会聚合并展示：

- 规则是否成功存储；
- schema、condition 与 action 是否通过 validation；
- configured 状态以及 inner hook 的 default / override；
- 当前宿主是否 support 对应 event/action；
- 宿主是否 trust 该执行路径；
- `run-script` 是否具有合法路径、shebang 与可执行状态；
- 最终 effective 状态以及未生效的 reasons。

Hook 的完整工作流是：识别 timing/action/scope/condition → 用 CLI 创建或更新 → `show` 检查 validation、trust、support、configured、script readiness、effective 与 reasons。成功保存只说明规则已存储；是否生效要看 effective 状态。

#### 用户只需要说出“想 Hook 什么”

用户不必直接编写事件 JSON 或宿主配置，可以通过 `agent-hooks` Skill 用自然语言表达意图。Skill 负责识别事件、选择最小条件、生成或更新规则、执行校验，并报告各宿主上的有效状态。

| 用户可以直接说 | Skill 转换后的统一 Hook |
|---|---|
| “以后每次新会话开始，都提醒我先检查最终远端 CI。” | global `session-start` + `inject-prompt`；作为一条经确认的持久指令 |
| “只要 `tasks/tasks/*.md` 被修改，就发一个可点击的 macOS 通知。” | after-tool + `changed_files` 条件 + `run-script` |
| “执行 `git push --force` 前阻止操作并说明风险。” | command 条件 + block；Codex/Claude Code 可启用，Pi 明确显示 unsupported |
| “工具改动 Swift 文件后运行检查脚本，并把脚本输出反馈给 Agent。” | after-tool + changed-file 条件 + `run-script`；在可注入事件上设置 `inject-output: true` |
| “关闭内置的 workspace workflow gates。” | 修改 inner hook 的 configured override，保留只读源文件，并用 `show` 确认 effective 状态 |
| “为什么这个 Hook 没有触发？” | `list` / `show` 审计 validation、trust、support、configured、script readiness、effective 与 reasons |

用户只需说明事件、条件和期望动作，Skill 会把意图翻译成统一规则。

#### 持久指令仍然需要明确授权

统一 Hook 系统扩大了自动化范围，因此持久化必须明确授权：

- 只有用户明确要求未来会话继续生效时才持久化；
- 一条原子指令对应一条独立的 global `session-start` / `inject-prompt` 规则；
- 不保存秘密、权限绕过或层级覆盖；
- 正文必须保留“高优先级规则和当前更具体请求优先”的边界；
- 创建前展示准确 ID 与正文并等待确认；
- 持久指令不按用户 Prompt 关键词猜测是否注入。

Agent Hooks 统一分散的宿主能力，同时显式保留能力差异和用户授权边界。

### 3.4 Agent SOPs：按需加载完整流程

SOP 是 Agent 的标准操作程序或判断规则。它不会无条件占用上下文，而是在任务匹配 `name`、`when_to_use` 或 `globs` 时成为候选，再由 Agent 读取完整正文。

SOP 分为两类：

- **Process SOP**：稳定步骤、确认点、异常处理与完成标准；
- **Rule SOP**：设计、评审、命名、权衡与判断顺序。

SOP 来源优先级固定为 Project > User > Built-in；同名只暴露最高优先级版本。`do_not_use_when` 用于明确排除相邻场景，避免路由误命中。

SOP 遵循四条边界：

1. **程序只在需要时加载；**
2. **项目流程优先于个人流程，个人流程优先于内置通用流程；**
3. **路由字段必须描述真实触发场景，而不是堆泛化关键词；**
4. **SOP 不能覆盖系统、用户、安全或仓库规则。**

### 3.5 `agent-*` 的共同原则

三种能力看起来都在“管理规则”，但职责不能合并：

- Rules 回答“是否始终适用”；
- Hooks 回答“什么时候自动发生”；
- SOPs 回答“匹配到任务后应该怎样做”。

这套分工让行为可预测、可禁用、可覆盖、可检查，也避免把所有知识塞进每次会话的 system prompt。

---

## 4. 核心二：`task-*` 结果驱动工作流

`task-*` 解决的是：一个用户结果如何从请求变成承诺、从承诺变成实现、从实现变成可验证完成。

### 4.1 一个结果，一个 canonical task

只要请求要求创建、修改、移动、重命名或删除文件，或形成了一个具体、非平凡、可独立验收的结果，就要创建、恢复或重开归属任务。

基本规则：

- 每个可独立验收结果对应一个任务；
- 组件、文件、主题或实现重叠不自动表示属于旧任务；
- 激活发生在实质讨论、探索、规划、委派和编辑之前；
- 宿主提供 focus 机制时，必须真实调用 `task_focus(<id>)`；
- 创建、恢复、聚焦、同步与对齐所需的任务写入是启动例外，但不授权编辑交付物；
- `tasks/tasks/<slug>.md` 是权威记录，`tasks/tasks.md` 只做最新优先索引。

先确定结果归属，再开始工作。否则状态、证据和会话会彼此脱离。

### 4.2 Task Target 是会话承诺门

Task Target 只描述三件事：

- 预期结果；
- 可观察完成条件；
- 避免误解所必需的范围边界。

它不包含文件、算法、命令、内部计划或复选框。

对齐只确认实质差异：

- 如果候选 Target 与用户当前授权双向实质等价，直接继续；
- 如果增加、删除、弱化、遗漏或改变了结果与边界，才展示并等待确认；
- 如果用户才知道的关键决策不明确，只问一个聚焦问题；
- 用户完整明确的修订直接进入授权，不再确认同一句话；
- Agent 或调查带来的实质范围变化必须重新对齐；
- 文件路径、函数、算法等实现变化不需要重新对齐。

这套语义同时防止未对齐就动手，以及反复要求用户确认同一件事。

### 4.3 任务文件只记录结果契约

| 小节 | 记录什么 | 不记录什么 |
|---|---|---|
| **Scope** | 容易误纳入的边界、明确排除项 | 实现方案 |
| **Target** | 唯一 checkbox 列表；可观察的过/败结果 | 实现步骤、命令、评审过程 |
| **Plan** | 当前结果节点、依赖、下一步动作 | 算法、函数、逐行修改清单，除非用户要求 |
| **Decisions** | 执行必须保留的已定选择与约束 | 问答历史和推理过程 |
| **Result** | 每个 Target 的当前证据 | 过时验证和过程叙述 |
| **Verification** | 宿主执行的当前验证结果 | “看起来正确” |
| **Block** | 阻塞原因与可观察解除条件 | 模糊的“等待中” |

可审计性来自“每个可观察结果挂一行证据”。Target 是唯一完成面；如果计划步骤也变成 checkbox，任务会同时拥有两个可能分叉的“完成定义”。

### 4.4 为什么不默认强制详细实现计划

任务工作流强制三个前置动作：Target 对齐、读完真实流程、记录当前路线。这已经覆盖详细计划最有价值的部分。

不默认强制详细实现计划，有三个原因：

1. **计划比 diff 还长的任务，写计划就是浪费。** 一个根因明确的小修，先写 20 行分步计划再改 3 行代码，是纯仪式。
2. **详细计划的主要价值是想清楚方案，薄 Plan 已经完成这件事。** 真正防止改错的是“追踪完整流程后决定改哪里、为什么”。“第 3 步改第 42 行”级别的明细写下就开始过时；过时的计划要么被盲从，要么被无视。
3. **强制产出会催生计划剧场。** Agent 会把注意力放在形式完整的计划上，忽略真正需要记录的决策。检查是否写过计划是流程检查，不产生正确性。

判定式只有三个问题：

- 方案唯一吗？
- 改错代价大吗？
- 路径需要跨会话保留吗？

三个都“否”，读完代码后直接改，Plan 记录一行路线；任一为“是”，把方案级选择写进 Plan / Decisions；步骤本身可独立验收时，升格为子任务；用户要求完整规划交付物时，进入 `task-plan`。

编辑前必须理解真实流程，文档不能替代理解。

### 4.5 `task-*` 家族分工

| Workflow | 职责 | 明确边界 |
|---|---|---|
| **task** | 执行一个结果的完整生命周期 | 不管理多个独立结果 |
| **task-plan** | 调查并形成 implementation-ready、decisions-only 交接 | 请求的交付物保持只读；计划结束时不伪造 Result 或完成状态 |
| **task-queue** | 用有序父子任务串行执行多个结果 | 不为单任务使用；父任务不复制子任务内容 |
| **task-review** | 对任务、PR、diff、文件或无文件结果做一次只反馈评审 | 不修改、不补救、不重审、不批准 |
| **task-grill** | 逐题压测计划、决定或话题 | 不把拷问过程污染进已有任务记录 |
| **task-context** | 恢复 Project Core，按任务选择 Context Packs | 不保存进度、秘密、推测和实时缓存 |
| **task-lessons** | 查询和维护 Trigger / Rule / Check 防复发规则 | 不保存任务历史、一次性细节和普通偏好 |

### 4.6 Queue 的关键是集成门

`task-queue` 只为可独立验收或可独立阻塞的结果创建子任务。子任务按有序列表串行执行，列表本身就是恢复游标，不再创建第二份 cursor 状态。

所有子任务 Completed 仍不代表父级结果成立。Queue 必须最后验证父任务自己的集成 Target，并记录独立 Result、review gate 与 integration verification。

父级集成结果必须单独验证。

### 4.7 Task core 是纯状态层

共享 task core 只维护：

- Markdown 状态；
- Target 与 Result 证据；
- 父子关系；
- 索引一致性；
- fail-closed 完成条件。

它不执行任意 shell 命令，不替 Agent 跑验证，不启动嵌套 CLI，也不持久化对话中的 Target 确认状态。实际调查、实现和验证由当前宿主 Agent 完成，core 只记录可检查结果。

这种分离让任务状态可移植、可恢复，也避免状态机拥有不可控执行副作用。

---

## 5. Context、Lessons 与其他支撑能力

### 5.1 Context：恢复项目模型，不替代权威来源

`tasks/context.md` 有两层：

- **Project Core**：每次 session start、resume 或 compaction 都加载的最小项目模型；
- **Context Packs**：理解具体任务后按需选择的一到三个完整组件或跨组件模型。

Context 只存已确认、项目特有、稳定、会改变未来决策且能指向 Authority 的事实。它不保存任务进度、规则、流程、秘密或实时环境值。

Context 帮助新 Agent 跳过宽泛探索，但任务直接源码仍需检查。Context 与 Authority 冲突时，Authority 永远优先。

### 5.2 Lessons：保存防复发控制，不保存纠错历史

Lesson 只有同时满足可复用、可预判、可预防、可验证、需要 Agent 判断且载体正确时才应进入 `tasks/lessons.md`。

固定结构：

- **Trigger**：复发前可识别的条件；
- **Rule**：直接阻断失败机制的动作或边界；
- **Check**：证明控制覆盖当前范围的证据。

用户纠正后先立刻修正当前任务，再判断是否需要更新 Lesson。持久化 Add / Update / Merge / Replace / Delete 都必须先展示准确变更并取得确认。若 schema、测试、lint 或强制工作流可以彻底防住问题，应优先用更强机制，而不是再写一句提醒。

### 5.3 Skill Quality：确定性门禁，不冒充测试

`skill-quality` 检查 Skill package 的 frontmatter、JSON/YAML、资源引用、上下文预算和 routing fixtures。失败阻止完成，warning 需要结合语义判断。

它不运行 package 脚本、项目测试、构建或发布，也不验证普通文档、SOP、Hooks 和 AGENTS 文件。质量门只证明它声明覆盖的结构事实，不冒充完整行为验证。

### 5.4 Archive：保存原始历史，不制造新的权威状态

`archive` 把用户指定的一段 Pi 对话按原始顺序逐字保存到 `tasks/conversations/`。它不总结、不翻译、不修正，也不包含系统提示、thinking、工具调用或压缩摘要。

归档文件只作为历史上下文，不是任务状态、决定或实施指导。没有可靠原始 session 边界时直接失败，不凭记忆重建。

---

## 6. 贯穿整个系统的设计思想

### 6.1 明确授权，拒绝推断

需要文件修改时，先激活任务；Target 有实质差异时才确认；跨会话持久化、破坏性操作、发布和独立评审都有各自明确授权门。一次授权不自动扩展成另一种副作用。

### 6.2 正确载体优先于更多内容

规则、Hook、SOP、Task、Context、Lessons、Archive 各有单一责任。放错地方的信息会污染检索、扩大上下文并制造冲突。

### 6.3 一个事实只有一个权威来源

任务正文权威于索引；Authority 权威于 Context；同名 SOP 只暴露最高优先级版本；Queue 的有序子任务列表就是恢复游标；不额外创建重复 cache、cursor 或状态副本。

### 6.4 结果优先于活动

Task 记录完成条件与证据，不记录 Agent 有多忙；Plan 记录当前路线，不记录逐步表演；Result 证明观察到什么，不证明“执行过很多命令”。

### 6.5 最小持久化

只有未来 Agent 若缺失就可能形成错误模型、做出错误决定或重复犯错的信息，才值得持久保存。一次性细节留在当前会话，实时值现场查询，秘密永不进入这些载体。

### 6.6 理解先于编辑

先知道结果归谁、什么算完成、真实调用路径在哪里，再选择最小修改点。小改动不是跳过理解的理由；详细文档也不能替代理解。

### 6.7 证据优先于自信

完成条件必须可观察；Result 必须说明检查了什么、怎样检查、观察到什么；相关变更会使旧证据失效；无法验证的部分要明确披露。

### 6.8 关键门禁 fail-closed

出现以下任一情况时都不能默认为成功：规则无效、Hook 不受支持、Context Authority 冲突、Lesson Check 失败、任务缺 Result 或验证、Queue 有未完成子任务。状态不可信时停下，比生成一个漂亮但错误的完成报告更重要。

### 6.9 独立评审只在明确要求时

普通验证、自审、测试和校对不能替代独立 Reviewer。对抗式评审或独立批准只在用户明确要求时触发；风险、复杂度和验证缺口不能代替用户决定。否则照实记录 `skipped`，验证通过后完成。

---

## 7. 它可以完成什么

| 用户需求 | 对应能力 | 结果 |
|---|---|---|
| “以后每个项目都遵守这条规则” | `agent-rules` | 用户级无条件规则 |
| “每次会话开始都提醒并执行这个动作” | `agent-hooks` | 经确认的持久 Hook |
| “发布时按固定流程做” | `agent-sops` | 按任务匹配的 Process SOP |
| “修改这个文件并证明完成” | `task` | 单结果 canonical task + 证据 |
| “先调查和规划，不要改代码” | `task-plan` | decisions-only 实施交接 |
| “按顺序完成多个独立结果” | `task-queue` | 父子任务 + 最终集成门 |
| “只审查，不要修改” | `task-review` | 一次 evidence-based feedback |
| “把这个决定问到底” | `task-grill` | 逐题决策压力测试 |
| “新会话不要重新摸索项目” | `task-context` | Project Core + 按需 Context Packs |
| “避免以后再犯同类错误” | `task-lessons` | Trigger / Rule / Check 防复发控制 |
| “检查 Skill 包是否符合结构契约” | `skill-quality` | 确定性 package gate |
| “逐字保存这段会话” | `archive` | 非权威历史归档 |

---

## 8. 这套系统刻意不做什么

- 不把 Task 变成完整项目管理软件；
- 不默认记录详细实现步骤和执行流水账；
- 不自动持久化普通偏好或一次性请求；
- 不把 Context 当作源码、测试或 Authority 的替代品；
- 不把 Lessons 当作纠错日记；
- 不因为任务大就自动触发独立评审；
- 不让 task core 执行任意命令或成为后台 worker；
- 不在没有可靠原始数据时“尽力”重建历史；
- 不为已经存在的 canonical 状态再建一份 cache、cursor 或 handoff 副本。

这些边界把复杂度限制在真正需要它的地方。

---

## 9. 总结

CSL Agent Kit 让 Agent 以可信、可恢复、可验证的方式工作。`agent-*` 管理行为何时、在什么作用域和载体中生效；`task-*` 管理结果的承诺、执行与证明；Context、Lessons、quality gate、archive 和共享 core/protocol 负责记忆、质量、历史与状态边界。

> **规则放对地方，结果先于实现，理解先于编辑，证据先于完成，持久化只保存未来真正需要的东西。**
