---
title: CSL Agent Kit 宣讲大纲——Task 系统与设计思想
type: doc
created: 2026-09-11
updated: 2026-09-11
tags:
  - CSL Agent Kit
  - Coding Agent
  - Task 系统
  - 宣讲大纲
---

# CSL Agent Kit 宣讲大纲——Task 系统与设计思想

Agent 说“完成了”，并不代表需求真的完成了。它可能写出了代码，却漏掉一个边界；也可能在几轮对话后，已经在解决另一个问题。这次宣讲从这些日常协作问题切入，介绍 CSL Agent Kit 如何把一次聊天请求变成**可验收、可恢复、有证据的工作**。

> **编排建议：** 面向用过 Coding Agent 的开发者，40 分钟主讲＋10 分钟问答；受众和时长尚未指定，可据实际安排调整。这是一份可拆成幻灯片的提纲，不是逐字讲稿。
>
> **事实口径：** 系统说明依据截至 **2026-09-11 的本机工作区源码与运行时契约**，包括尚未发布的新 review 改动；公开 README 已于同日联网核对。不能据此宣称新设计已发布，或各宿主具有完全相同的执行能力。章节安排、案例和演示步骤是宣讲建议，不是产品实测结论。来源见文末。

## 宣讲主线与节奏

**协作失误 → 明确结果 → 分开保存状态与知识 → 可靠接续 → 自检和独立查漏 → 有边界地完成。**

| 章节 | 要回答的问题 | 建议用时 |
| --- | --- | ---: |
| 1. 为什么需要 Task 系统 | Prompt 已经能写代码，还缺什么？ | 3 分钟 |
| 2. CSL Agent Kit 放在哪一层 | Skills、Rules、SOP、Hooks 和 Task 怎么配合？ | 3 分钟 |
| 3. 从请求到可验收目标 | 如何防止“做了很多，但没做到点上”？ | 7 分钟 |
| 4. 三种记录，不是一份大记忆 | 哪些信息应该留下，留下在哪里？ | 5 分钟 |
| 5. 执行、恢复与 Queue | 中断后接什么，多任务如何收尾？ | 5 分钟 |
| 6. 主 Agent 自检，Reviewer 查漏 | 为什么不让作者再读一遍就算审查？ | 6 分钟 |
| 7. 贯穿案例与现场演示 | 在真实交互里，这些设计长什么样？ | 8 分钟 |
| 8. 取舍与边界 | 它不解决什么，成本是什么？ | 3 分钟 |

听众离开时，最好能回答三件事：**现在究竟要交付什么？中断后凭什么接上？凭什么认为已经完成？**

## 1. 为什么需要 Task 系统：代码生成之外的协作问题

**开场问题：** “你有没有遇到过：Agent 改完一大批文件，最后才发现它理解的需求和你不一样？”

用四个场景建立问题，不急着介绍命令：

- **目标漂移：** “加导出”被做成“全量导出”，实际需要的是当前筛选结果。
- **上下文中断：** 换会话或压缩后，能找到代码，却说不清还有什么没做、哪些决定已经确定。
- **假完成：** 文件已修改、命令退出成功，被当成用户结果已经满足。
- **纠错不复用：** 这次提醒过的错误，下次换个 Agent 又出现。

**关键判断：** Task 系统不替代模型能力；它把原本只存在于聊天里的目标、边界、进度和证据，变成可以检查、可以接续的工作约定。〔S1、S2〕

## 2. CSL Agent Kit：能力包之外，还有协作约定

用一张职责表定位，不展开安装教程：

| 层次 | 负责什么 | 不应混淆成什么 |
| --- | --- | --- |
| Skills | 针对具体任务的操作能力与流程 | 一份永远全量加载的大 Prompt |
| Rules / SOP | 稳定行为约束 / 特定场景的操作规程 | 当前任务的进度记录 |
| Hooks | 在受支持的宿主时机注入提示或运行规则；内置 Contract 提供稳定工作约定 | 能保证模型永不违反规则的安全沙箱 |
| Task 家族 | 目标、计划、状态、证据、恢复与完成门禁 | 单纯的待办清单 |
| 宿主与工具 | 实际读写、执行、授权边界及 subagent 隔离 | 由一份 Skill 文本凭空实现的运行环境 |

CSL Agent Kit 面向 Codex、Claude Code、Cursor、Pi 分发这些能力；**跨宿主复用工作流，不等于宿主能力一致**。例如，公开 README 描述的 Cursor V1 集成不支持 Prompt 注入，不能把该集成限制外推为 Cursor 产品永久不支持。〔S0、S1〕

**设计思想：** 稳定约定放在 Contract，易变的具体步骤留在 Skill；模型负责理解，确定性代码负责能机械检查的状态与结构，宿主负责真实执行。

## 3. 从请求到可验收目标：先知道“做成什么”

### 3.1 Target 和 Plan 分开

以虚构的列表 CSV 导出需求说明：

- “完成导出交互、核对边界结果、准备交付证据”是 **Plan** 的工作节点，描述怎样推进；不把具体函数或算法锁进计划。
- “导出的记录与用户确认的筛选范围、排序一致”是 **Target**，描述做成什么。
- “原列表交互保持不变”只有在适用要求或约束支持时才成为验收承诺，不能由 Agent 偷换或漏掉。

Target 应有可观察的完成条件。Plan 可以随着源码发现而调整，但不能借“实现细节”悄悄改掉用户要的结果。〔S2、S5〕

### 3.2 按结果选择工作流，不按文件数

| 请求 | 进入哪条路线 | 边界 |
| --- | --- | --- |
| “先研究怎么做，给我可实施方案” | `task-plan` | 形成计划，不改请求的交付物；计划对齐不等于执行授权 |
| “把这个功能做好” | `task` | 管理一个可独立验收的结果，改十个文件也未必需要 Queue |
| “把这几个可独立验收的结果按顺序推进并整合” | `task-queue` | 有序子任务＋父任务整体验收，不只是长清单 |

明确要求实施已有计划时，继续同一 canonical task（权威任务记录）；已有目标及授权依据仍适用就不重复确认。〔S2、S3、S4〕

### 3.3 对齐不是每次都追问“确认吗”

- 明确、完整的请求：在没有强制等待条件时，展示目标后可以继续，不凭空增加一次批准。用户明确要求先确认、任务分解关系实质改变、恢复时无法找回对齐依据，仍需保留相应检查。
- 需求有真正歧义：先问一个聚焦问题，例如“导出全量数据，还是当前筛选结果？”
- Agent 提议扩大或改变承诺：说明变化，等待批准。
- 已对齐且未改变的目标：保留已有依据；不能把 Agent 自写的摘要当成用户同意。
- 删除、发布、支付、隐私等若触发独立安全门，仍须单独处理；目标对齐不是通行证。

**要讲透的取舍：** 既不能擅自猜需求，也不应该让用户反复批准已经明确说过的话。保留必要确认，比堆叠确认更重要。〔S5〕

## 4. 三种记录：Task、Context、Lessons 各司其职

| 载体 | 回答的问题 | 应该放入 | 不应该放入 |
| --- | --- | --- | --- |
| Task | 这次要做什么，现在到哪里了？ | 目标、计划、决定、结果证据、阻塞条件 | 与本次结果无关的项目知识堆积 |
| Context | 这个项目有哪些会改变判断的事实？ | 组件边界、权威来源、非显然依赖、重要不变量 | 当前进度、实时版本值、猜测 |
| Lessons | 下次怎样防止同类错误？ | 可提前识别的 Trigger、阻断错误的 Rule、可观察的 Check | 纠错聊天流水账、普通偏好、一次性细节 |

### Context：先建立项目模型，再按需读取

会话开始、恢复或压缩后先读 **Project Core**，形成项目最小模型；目标对齐后，再按任务选择相关 **Context Packs**。它帮助少走重复探索的路，但不能替代源码、配置和正式约束；发生冲突，以权威来源为准。〔S6〕

### Lessons：纠正先落到当前工作，持久化要有门槛

用户纠正后立即调整当前工作；值得复用的控制再进入 Lessons，持久写入须展示精确变更并得到同意。能用类型、schema、测试、lint 或强制流程彻底阻止的错误，优先交给这些机制，不把 Lessons 当成万能补丁。〔S7〕

**与上下文压缩的区别：** 压缩关注如何在有限窗口内继续对话；这套记录关注什么是工作状态、什么是项目事实、什么是防复发控制。二者可以配合，但 Task 文件不是聊天的无损副本，也不保存隐藏推理。

## 5. 执行与恢复：接续的是工作，不是复述聊天

### 5.1 一个结果只有一个权威记录

索引负责找任务，canonical record 负责说明任务。核心内容是 Scope、Target、Plan、Decisions、Result、Verification；遇到问题才增加相应 Review ledger 或 Block。

建议展示一份脱敏记录，重点看三组关系：

- **Target → Result：** 每个完成条件都有对应观察与证据，不是只打一个勾。
- **状态 → 下一步：** Pending 是待处理，In Progress 是执行中，In Review 是审查中；Blocked 需要可观察的解除条件，Cancelled 是可恢复的停止，Completed 才表示通过完成门禁。
- **内容变化 → 证据失效：** 规范或相关交付物改变后，旧验证不能继续证明新结果；完成后的同一结果需要修正时，要重开而不是偷偷改写完成证据。

恢复时读记录、重查适用授权和当前源码，再接续未完成项；不能只凭历史“已通过”就忽略现场变化。〔S2、S10〕

### 5.2 Queue 的价值是分段验收和整合

用旁支例子说明：“数据导出、导入校验、端到端迁移”若分别有独立验收结果，又需要顺序整合，就适合 Queue。

- 父任务定义整体结果，子任务各自管理完整生命周期。
- 按顺序推进；子任务阻塞就停止，不假装剩余工作可以照常完成。
- 子任务全部完成不等于父任务完成，还需要父级整合证据与适用门禁。
- Queue 不意味着并行 subagent，更不是无限后台自治。〔S4〕

**设计思想：** 把大结果拆成可定位失败、可恢复执行的小结果，同时保留一处整体责任。

## 6. 新 review 设计：主 Agent 证明已做到，Reviewer 找遗漏

这部分讲协作分工，不讲“多一个 Agent 就更聪明”。〔S2、S8、S9〕

### 6.1 两个角色，各有信息优势

| 主 Agent：自检验证与交付责任 | 独立 Reviewer：一次只读查漏 |
| --- | --- |
| 掌握实际修改过程，逐 Target 比较要求和结果 | 从原始要求、约束、实际产物重新检查 |
| 先修复已知失败，记录版本、观察、证据与局限 | 找作者漏掉的边界、无依据假设、证据缺口 |
| 核实审查反馈、整改、组织后续复审 | 反馈问题，不编辑、不改任务状态、不批准完成 |
| 最终确认当前内容与审查一致，并完成终验 | 区分自己做过的检查和仅阅读的作者证据 |

### 6.2 独立上下文不是“什么都不给”

Reviewer 获得一个**事实包**：原始请求及有效修订、Target、适用约束、实际文件或 diff、内容身份、允许的检查、已知局限、作者证据引用；复审时还要有未解决问题的稳定 ID。

不传作者的实现对话、辩护、信心评价或期望结论。检查顺序是：**先要求和产物，再作者证据**。这能减少被作者叙述带偏的机会，但不是严格盲审，也不能消除同模型偏差。

固定提示词复用现有 review workflow 参考文件；**提示词载体不等于 Agent 注册文件，更不等于隔离机制**。fresh context 和只读工具权限必须由宿主真正建立，不能 fork 作者会话后声称独立。〔S9〕

### 6.3 问题怎样回到交付闭环

主 Agent 自检 → Required / In Review → fresh 只读审查 → 主 Agent 核实反馈：

- 有确认问题，或证据缺口阻止目标验证：回到 In Progress，整改、刷新证据，再派发 fresh pass。
- 怀疑误报：提供反证供新 pass 核对，不能作者自己删掉问题就算通过。
- 无阻断项且内容一致：由主 Agent 记录 Passed，再做最终验证。
- mandatory Reviewer 不可用或失败：Blocked，不能静默降级成自审后 Passed。

用一条补充说明停滞保护：同一问题首次出现记 0，连续复审无实质进展会递增，到 2 就阻塞并请求介入；**不是整个任务最多审两轮**。〔S2、S8〕

### 6.4 审查绑定内容，而不只是任务名

审查期间冻结相关修改，接收反馈和完成前复核同一范围。对于未提交工作区，HEAD 或文件名列表不足以识别内容；非 Git 文档也需要相应内容身份。变动后刷新自检并重新独立审查。

**适用边界：** 请求的交付文件发生变化，才触发 mandatory `task-review`；只写 Task、Context、Lessons 生命周期记录不算交付物变化。无交付文件变化的任务可按规则跳过；显式独立对抗审查 `adversarial-review` 是另一条按需流程，不能与普通查漏混为一谈。〔S2、S8〕

## 7. 贯穿案例与现场演示：列表 CSV 导出

使用虚构、无敏感数据的小项目。八分钟内展示关键证据，不等待现场完成全部开发。

| 演示段落 | 操作或准备材料 | 让观众看到什么 |
| --- | --- | --- |
| 请求与澄清，1 分钟 | 输入“先规划列表 CSV 导出”；针对范围歧义回答“当前筛选、当前排序，保留原列表交互” | 用户决定边界，Agent 不静默猜范围 |
| 计划转执行，1 分钟 | 展示计划；再明确说“按这个计划实施” | 同一记录接续，规划不越权执行，也不重复批准未变目标 |
| 实现与恢复，2 分钟 | 切到预先准备的实施中记录；展示中断后的下一步 | 目标、未完成项、当前源码可以重新核对，不依赖复述整段聊天 |
| 自检证据，1 分钟 | 展示筛选和排序观察、空结果、逗号／引号／换行及中文内容的检查记录 | 每项检查证明什么；未检查的不能报通过 |
| 独立查漏，2 分钟 | 展示实际 fresh dispatch、只读权限和反馈；可使用明确标注的教学预置缺陷 | Reviewer 如何从原始要求查漏，作者如何核实整改 |
| 完成，1 分钟 | 展示修复后的新 pass、内容复核与终验 | “完成”需要当前证据，不只是一句结论 |

**演示准备要点：**

- 提前验证主讲宿主具备 fresh、只读 subagent 能力；缺失时如实展示 Blocked，或改讲事先验证的录屏，不伪装实时成功。
- 预置缺陷、截图、录屏均标为教学材料，不编造真实事故或审查结果。
- 检查与测试遵守当次授权；若要现场跑测试，事先取得明确授权；未运行的检查明确标注。
- 只展示教学仓库和脱敏内容，不公开私人路径附录、账号或业务日志。
- 这个单一功能本身不必使用 Queue；用第 5 节旁支例子解释多结果场景即可。

## 8. 收束：它改善的是工作约定，不是提供正确性保证

用三个取舍结束：

1. **可恢复性与维护成本。** Markdown 记录便于阅读和接续，但仍需维护当前事实；过量历史会重新制造上下文负担。
2. **独立视角与时间成本。** 自检＋fresh review 增加耗时和上下文消耗；值得检查重要遗漏，不值得为了显得严格而制造问题。本提纲没有漏检率或效率提升的模型实测数据。
3. **自动推进与用户决定权。** 系统可以在授权范围内继续工作；不清楚目标、授权改变、必要审查失败时，正确动作是停下来。

确定性 task core 检查记录结构、状态、证据条目和完成条件；**它不独立证明需求语义正确、命令真的执行、subagent 确实隔离或文件没有变化**。这些仍依赖主 Agent、宿主权限和可核对的实际证据。〔S2、S10〕

**建议结束句：** “先让结果可验收，再让过程能接续，最后用证据支持完成。自动化应该建立在这三件事上。”

## 附录 A：Task 家族速查

主讲只展开前三条路线和记忆、审查机制，其余放在问答页。

| 能力 | 适用场景 | 关键边界 |
| --- | --- | --- |
| `task` | 执行一个结果 | 拥有状态、整改与完成责任 |
| `task-plan` | 调研、澄清、准备可实施计划 | 不执行请求的交付物 |
| `task-queue` | 顺序推进多个独立结果并整合 | 子任务完成之外，还有父级验收 |
| `task-context` | 建立并检索项目事实 | Core＋按需 Packs，不是进度库 |
| `task-lessons` | 应用和维护防复发控制 | 有准入标准，持久修改需确认 |
| `task-review` | 显式单次反馈，或接收 owning task 的 mandatory 派发 | 一次只读查漏，不自行整改或批准 |
| `task-grill` | 用户希望压力测试计划、决定或主题 | 通过任务体系保存结论，不污染其它结果的记录 |
| `task-maintenance` | 用户明确要求清理或迁移 Task 历史资料 | 确认精确变更集后执行，不自动定期清理 |
| `archive` | 用户指定 Pi 可见对话范围并要求逐字保存 | 不是摘要，也不替代 Task 的当前状态 |

来源：〔S2–S8、S11–S13〕。

## 附录 B：常见问答与短版路线

- **和普通 todo 有什么区别？** todo 主要列动作；这里还规定目标、授权边界、状态恢复、结果证据及完成门禁。
- **每个请求都建立任务吗？** 文件变更和具体非平凡结果进入 Task；简单无文件事实回答、开放讨论等有明确跳过边界。
- **每次都要确认、每个任务都要 review 吗？** 不需要重复确认有效的明确承诺；mandatory review 以交付文件变化为边界，不是一切聊天都派 subagent。
- **为什么不直接给 Reviewer 全部上下文？** 要保留需求、约束和证据，但不把作者的叙述和期望结论作为起点。少传作者观点，不等于少传关键事实。
- **审查通过就保证正确吗？** 不能；它是限定范围、内容和工具条件下的检查结论，作者仍负责终验与已知局限。
- **各宿主都一样吗？** 工作流可复用，注入时机、授权和独立 Agent 能力需按实际集成核对。

**20 分钟短版建议：** 问题与定位 3 分钟 → Target 与三类记录 6 分钟 → 自检和独立查漏 5 分钟 → 演示 4 分钟 → 边界与收束 2 分钟。Queue 和能力地图留作备用页。

## 参考来源与更新提示

以下为事实核对入口，不是要求听众会前读完。S0 是公开资料；其余是本地工作区权威文件，可能领先公开发布。转换成公开幻灯片时，去掉私人路径附录；需要源码链接时，核对内容已公开后再替换为对应公开版本。

- **S0｜公开定位与集成说明：** [GitHub 仓库](https://github.com/SSBun/csl-agent-kit)；[联网核对的 README](https://raw.githubusercontent.com/SSBun/csl-agent-kit/main/README.md)。访问日期：2026-09-11。
- **S1｜稳定协作契约：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks/references/csl-agent-kit-contract.md)。
- **S2｜单任务生命周期、自检与完成：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md)。
- **S3｜计划与执行授权边界：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md)。
- **S4｜Queue 与整合门禁：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md)。
- **S5｜Target 对齐协议：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md)。
- **S6｜Context：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-context/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-context/SKILL.md)。
- **S7｜Lessons：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-lessons/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-lessons/SKILL.md)。
- **S8｜单次审查边界：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-review/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-review/SKILL.md)。
- **S9｜Reviewer 提示词、事实包与隔离：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-review/references/review_workflow.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-review/references/review_workflow.md)。
- **S10｜确定性状态及完成检查：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js)。
- **S11｜按需压力测试讨论：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-grill/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-grill/SKILL.md)。
- **S12｜显式历史维护：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/task-maintenance/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-maintenance/SKILL.md)。
- **S13｜可见对话归档：** ["/Users/caishilin/Desktop/personal/skills/skills/meta/archive/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/archive/SKILL.md)。

宣讲前复核：当前发布与本机工作区是否一致；Task Target、review 契约是否变化；所用宿主能否实际完成预备演示。若有差异，更新事实口径，不沿用本提纲的“当前”表述。
