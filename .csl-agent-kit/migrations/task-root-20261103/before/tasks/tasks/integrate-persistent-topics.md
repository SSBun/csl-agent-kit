# 规划长期 Topic 与现有任务工作流集成

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-12 18:04) |
| Artifacts | [Artifacts](../artifacts/integrate-persistent-topics/) |
| Kind | Plan |

## Scope

将 Topic 作为有边界的长期维护主题集成进现有工作流：保存当前有效规格、共同约束与决策，并持续关联实现、改进、Bug 修复和审查任务。支持同仓及显式配置的跨仓使用，不以多平台为前提。

用户已在确认目录与 Topic 索引后明确授权实施本计划。实现共享 core/CLI、Topic Skill、流程与分发接入；不创建真实业务 Topic、不修改旧任务或已保存讨论。排除后台同步服务、自动跨仓扫描、自动并行调度、Topic 层级树、批量历史迁移，以及把所有独立任务强制纳入 Topic。用户随后明确授权运行相关单元测试；除语法、质量、结构检查和临时 CLI 演示外，执行 Topic、共享 core 与 Task 工作流的聚焦测试。

## Decisions

### 1. 对象与职责

- Topic 是长期领域对象，不是新的 Task Kind、Queue parent、标签或聊天归档。采用名称 `Topic`，不再并列创建 Requirement/Feature 类型。
- Task 保持 Task／Plan／Queue 三种既有 Kind；实现、Bug 修复和审查是任务用途，不扩展 Kind 枚举。
- 每个任务可选属于一个 Topic；没有 Topic 的独立任务具备同等生命周期、证据和恢复能力，不称为临时任务。
- 同一 Topic 可以包含一个或多个平台、一个或多个仓库、持续增加的独立任务。是否共享公共规格决定归属，文件或平台相同本身不能自动建立归属。
- Queue 继续管理本地串行执行与父子集成验收；Topic 关联使用独立字段，不复用 Parent/Children。Queue 与子任务分别关联，创建时可提出继承建议，但不得隐式改写已有子任务。
- Topic 保存当前应该满足的约定；Task 保存一次具体结果；Project Context 保存长期项目事实；Lessons 保存可复用的行为防错规则。Task Summary 仍仅描述实际修改的代码或组件。

### 2. 存储与身份

- 在 owning workspace 的 Task 数据区新增 `tasks/topics/<topic-id>.md` 与 `tasks/topics.md` 导航索引；任务继续使用原来的 canonical 路径。以上为待实施的相对布局，不是本次创建的文件。
- Topic ID 为稳定 ASCII slug；跨仓身份为已确认的项目 ID 加 Topic ID。任务引用同理使用项目 ID 加 Task ID，防止不同仓库内同名冲突。
- 同仓引用可以解析为本工作区；跨仓通过现有 project-index 的已确认映射解析，并核对仓库身份。绝对路径用于本机展示，不作为可移植身份。项目未登记、路径搬迁或映射有歧义时明确请求确认，不自动扫描、clone 或注册。
- Topic 文件采用版本化 schema，头部保留 ID、生命周期状态及由工具计算的规格 digest。正文固定职责为 `Scope`、`Spec Context`、按需 `Decisions` 和 `Tasks`。
- Spec Context 保存公共行为、稳定条款编号、必要接口/数据契约及允许的差异；现有权威规格可以通过带版本的引用复用，不能形成两份互相竞争的全文。
- Tasks 仅保存任务的完整定位和简短职责，不复制状态、Target、Result 或 Task Summary。状态按需读取；无法访问的成员明确显示 unknown，不缓存为 Completed。
- 长期维护默认不移动、删除或重命名 Topic ID。归档只改变状态；旧引用和证据仍能定位。

### 3. 任务关联与一致性

- Task 新增可选、唯一的 `## Topic` 区块，记录规范化 Topic locator、采用的规格 digest、适用范围/条款。无关联时整个区块缺省，不增加空字段。
- 第一版不改 Task 头部元数据白名单；新的 Topic 区块由共享 core 显式解析、校验，并自然纳入任务指纹。重复区块、未知 schema、非法路径和重复身份应拒绝。
- Task 的 Topic 字段是归属权威；Topic 的 Tasks 是由关联操作维护并验证的反向索引。双向引用不能被视为两个独立真相。
- 关联、解除、重新关联通过一个显式操作执行：先验证两侧身份、写权限、原版本和生命周期，再更新任务权威关系及相关 Topic 反向索引。同仓沿用现有写入与回滚能力，但不得未经验证就声称具备崩溃原子性。
- 跨仓不承诺分布式原子事务：单侧失败需报告具体已写/未写部分，标记关联不完整，阻止依赖完整关联的终态关卡；修复命令在已授权的确切引用范围内，以任务权威字段为依据幂等补齐或删除索引，不猜测用户意图、不扫描全部仓库。
- 写入前比较预期旧内容，处理两个会话同时追加成员或改规格的冲突，不能静默覆盖。只读 show/check 不修复文件。
- 已完成任务的补关联不得绕过既有不可变证据规则；第一版要求显式 reopen、修改后重建必要证据再完成。只需要追溯但不改归属的旧任务，可以作为普通历史来源链接，不伪装成已双向关联成员。不得自动批量重开。

### 4. Topic 生命周期

- 采用 `Draft`、`Active`、`Archived`。Draft 允许需求澄清和规划；Active 表示有可采用的有效规格，绝不表示已交付、没有 Bug 或自动获得执行许可。
- 创建 Topic 时保持 Draft；在用户接受该维护主题的规格与范围后进入 Active。状态本身不是授权证明，仍需可恢复的真实确认来源。创建/澄清/归档等 Topic 维护任务可以在其目标要求的 Draft 或 Archived 状态完成，不能被产品实现的 Active 前置条件阻塞；实际能力实现任务必须采用有效规格并取得执行授权。
- 所有关联任务完成不改变 Topic 状态。某次版本或需求交付的完成由对应 Task／Queue 记录，不增加 Topic Completed 状态。
- 只有用户明确不再维护或能力废弃时归档；归档前展示活动成员影响。有活动工作时先处理取消、转移或恢复策略，不自动取消任务。
- Archived 可查询及审阅历史；新增维护任务或更新有效规格前显式恢复为 Active，并重新核对规格。恢复不自动恢复全部旧任务。
- 新 Bug、增强或重新审查通常创建同 Topic 的新任务。只有直接修正、补全或重新验证同一 outcome，且原记录保留会误导时才重开原任务，继续遵守现有 Queue parent 门禁。

### 5. 公共规格的版本与变化

- 规格 digest 只覆盖影响任务决策的规范性正文：Scope、Spec Context、公共 Decisions 及带版本的规范性依赖。Tasks 反向索引、成员状态、展示时间等不进入规格 digest；追加任务不应令其他任务过期。
- 第一版采用整个规范性正文的保守摘要，不先建设条款级自动影响图。摘要能检测文本变化，不能证明语义变化或判断审批。
- 每次采用或更新规格保留可恢复的规范正文快照，以内容 digest 去重，放在 Topic 自己的 revisions 目录；快照不包含成员进度、聊天或私密数据。其确切布局由同一 schema 管理，不占用任意平台任务的 evidence 目录。
- 跨仓任务记录 locator 与 digest，读取同一 Topic 的只读 revision；不复制可编辑规格。规范性外部接口引用需固定内容身份，主文档未变不代表外链未变。
- Topic 维护者是每次变更的明确 owning Task/主交互 session，不新增常驻 daemon。平台任务可提出公共修改建议，但不能静默覆盖共同规格。
- 规格修改先形成候选变更，经适用 Target 对齐及用户决策后发布新有效版本；不能在普通 Bug 修复中把规格改得迎合错误实现。已有文档里的“已批准”文本不替代授权来源。
- 启动/恢复、审查交接、终态 review/verify/complete 前核对外部 Topic 当前内容与采用版本。共享 core/CLI 的写入关卡必须执行只读 freshness 检查；不能仅依赖提示词或任务正文指纹。
- 发生差异时停止依赖旧版本的终态推进。Agent 比较旧快照与新规格：无实质影响的变更记录核对依据，显式采用新版本并按 sync 刷新证据；实质变化重新对齐并更新受影响 Target、实现和验证。保留既有 Required 审查义务，不能通过重新绑定 Topic 规避。
- Topic 无法访问、快照缺失、digest 与正文不匹配或双向关系不一致时报告阻塞。只读历史查看仍可进行，但不能声称当前版本满足或自动降级成独立任务。
- 已完成任务保留原采用版本与当时证据。新规格出现不自动重开历史任务；当前满足性由新任务或显式重开的任务提供。Topic 聚合界面区分“历史完成”和“满足当前规格”，不能以历史状态替代兼容结论。
- 使用关卡式核对，不承诺实时广播。修改本仓 Topic 不自动授予修改其他仓库任务的权限。
- 修改 Topic 自身的 owning Task，在提交规范变更后、开始自检与审查前，显式采用最终版本并同步证据；不允许修改共享规格的任务因自己的旧引用陷入无法完成的循环，也不允许因此跳过版本、授权或审查检查。

### 6. 启动入口与工作流接入

- 新增一个公共 `topic` Skill，负责 Topic 专属的查找、创建、规格维护、任务关联及归档操作；不建立第四套任务执行流程。其最小默认行为是解析明确主题与用户当前授权，不自动执行所有关联任务。
- 用户可直接说“创建一个 Topic：账号注销，先讨论需求”“在这个 Topic 下修复注销失败”“继续账号注销 Topic”“审查该 Topic 当前实现”。命令是可发现的入口，不要求用户记忆内部命令。
- `topic` 对只读查询直接返回当前内容；对具体维护结果先调用现有 task-plan/task 路由激活一个 owning record，避免为每个内部 CLI 子命令递归创建任务。创建 Topic 的任务在成功创建后关联该 Topic；Topic 不要求永久保持一个总任务 In Progress。
- “继续 Topic”只恢复共享上下文并展示当前相关任务；有唯一明确的现有请求时恢复对应任务，否则询问要推进的结果，不能按成员列表自动取下一项。
- “审查 Topic”默认映射为该主题下的一次有边界审查结果，不自动修复全部发现。普通 task-review、adversarial-review 和 deliberate 的现有授权边界不变；不因出现 Topic 就触发多 Agent。
- 流程入口先加载 Project Core，再读取用户指定的 Topic 或已有任务的明确引用所需的最小范围以形成诚实 Target；只允许窄范围只读规格/任务引用读取，不允许在对齐前广泛研究或实施。这是对共享对齐协议需要新增的明确边界，不能假装现有协议已允许。
- 激活、聚焦 Task 后展示完整局部 Target；对齐后读取采用版本、相关 Context Packs、Lessons 与权威实现。审查事实包携带适用 Topic 规格与快照，先看需求而不是作者解释。
- 跨 session 的一致规格不等于跨 session 执行授权。只有真实可恢复接受来源与有效 delegation packet 才能复用对齐；缺失则按现有 gate 重新核对，不持久化可绕过检查的 confirmed 标志。
- task-plan 输出仍是 Pending，规划确认不等于实施许可；task-queue 的串行语义与独立的集成验收保留。Topic 自身不要求每次任务完成都对整个主题重做交付验收。
- Pi 的 task_focus 仍聚焦 canonical Task，不拿 Topic ID 冒充 Task ID；首版不增加独立 Topic 焦点或 dashboard。必要导航通过任务区块和 Topic 索引提供。

### 7. 实现与分发边界

- 复用 csl-tasks 共享 core/CLI，提供 Topic create/show/list/update-spec/activate/archive/restore、task attach/detach、freshness check 和受限 repair 能力；确切命令拼写由实现统一，能力和失败语义是本计划承诺。
- 存储、定位、版本与双向关联属于确定性 core；具体规格含义、影响分析、任务归属建议和用户决策属于 Agent。不要让 CLI 猜语义，也不要把可验证的不一致仅留给提示词。
- 可分发的运行契约必须位于 Skill/共享协议，不能依赖这份仓库内计划或旧讨论文件。稳定注入契约只增加 Topic 路由和边界，不复制全部字段与操作步骤。
- 安装与 discovery 同步新增 topic Skill；检查显式插件 manifest、README 入口、宿主技能发现与对应测试，不假定所有宿主自动发现。没有新增 Topic 专属 UI 的要求。
- 独立 Task、已有 Kind/Parent/Children、Task Summary、Context 与 Lessons 均保持原职责。历史无 Topic 记录继续可读；不批量补写字段，不把旧多平台讨论或图片当作当前完整契约。

## Plan

1. **建立 Topic 存储与可恢复规格。** 完成版本化 Topic schema、索引、Draft/Active/Archived 状态和只读查询；规范正文与成员索引分离，保留不可变规格 revision。验收点：索引可重建、重复 ID/非法 schema/路径越界拒绝，成员变化不改变规格摘要。
2. **建立可选任务归属和双向一致性。** 增加 Task Topic 区块解析、关联/解除/变更归属、显式跨仓 resolver 与受限 repair；执行写前版本核对。验收点：同名跨仓任务可区分，旧任务不变，半完成关联可检测和幂等恢复，未授权外部写入不会发生。
3. **接入版本与证据门禁。** 将 freshness 纳入 resume 的恢复信息及 review/verify/complete 写入关卡，处理不可访问、归档、版本变化、规范性依赖变化；保留 Required 不可降级和旧任务历史完成语义。验收点：仅外部 Topic 改变而 Task 正文未变也能阻止旧证据完成，成员追加不误判过期。
4. **接入自然语言和现有流程。** 新增 topic Skill，更新 task-plan/task/task-queue/task-review、对齐协议和稳定注入路由；明确创建 Topic 的 owning Task、继续 Topic 的非自动执行、Bug 与规格变化、一次审查与自动修复的区别。验收点：同一能力多轮实现—Bug—审查—增强任务都能恢复共同约定，独立任务不增加 Topic 门槛。
5. **同步分发与可见文档。** 更新显式 manifest、发现与安装覆盖、README，并按确认后的稳定事实维护相关 Context Packs；Core 结构变化需要按 Context 自身确认门。展示 Topic 与 Task 文件样例及独立任务反例。验收点：支持的宿主能发现入口，所有运行契约自包含，task_focus 仍绑定任务。
6. **完成端到端验证及独立审查。** 在获得测试授权后执行下面的矩阵，逐包运行 skill-quality，执行 schema/语法/一致性检查。此变更涉及跨仓写入、共享格式和证据门禁，实施结果按 R2 进入 fresh task-review；记录每轮证据、修复并重审，最终完成前重新核对实际快照。实际测试与审查结果以当前 Result 和 Review Reports 为准，不预先声明用例通过。

步骤有顺序依赖，但这不是自动 Queue 执行授权；实施时可在同一任务内推进，是否拆独立任务取决于实际可独立验收边界。

## 验收与验证矩阵

| 对应目标 | 场景 | 预期结果 |
| --- | --- | --- |
| T1 | 单平台长期能力先实现，再 Bug 修复，再审查与增强 | 同一 Topic，独立任务与证据，不要求多平台 |
| T1/T3 | 所有关联任务完成 | Topic 仍 Active，无自动归档 |
| T1/T4 | 只创建 Topic 并讨论 | Draft/规划可保存，不自动实施、不启动子 Agent |
| T2 | 没有 Topic 的既有或新任务 | 现有生命周期无额外门槛 |
| T2 | Queue 与 Topic 同时存在 | Parent/Children 与 Topic 分离，不自动串行全部成员 |
| T2/T4 | 跨仓、同名任务、路径搬迁、错误映射 | 使用完整身份解析；不猜测、不擅自扫描或注册 |
| T2 | 关联时第二次写入失败；并发追加成员 | 显式不完整/冲突，可幂等修复，无静默丢失 |
| T3 | 只追加 Task References | Topic 规格 digest 不变，现有证据不误失效 |
| T3 | 公共行为或规范性接口变化，Task 正文未变 | 当前版本检查阻止旧证据过关；人工分析与重新采用可追溯 |
| T3 | 无语义影响的规格编辑 | 显式核对并采用新版本，按现有同步规则刷新证据，不伪造批准 |
| T3 | 新版本发布时旧任务已完成 | 保留旧证据，不自动重开；不把旧完成等同当前规格满足 |
| T3/T4 | Topic 不可达、快照缺失、未知 schema | 当前工作/终态门禁明确阻塞；历史只读展示不声称最新 |
| T4 | session 恢复时只有 Topic 文档，没有接受证据 | 能恢复上下文但不自动获得实施授权 |
| T4 | 归档仍有活动任务或继续归档 Topic | 显示影响并由用户决定，不静默取消或自动恢复成员 |
| T4 | 历史任务补关联或重分配 Topic | 显式 reopen 与证据更新；普通来源链接不伪装归属 |
| T4 | 只要求审查 Topic | 只给有边界反馈，不自动修复或 adversarial loop |
| T1-T4 | 可分发安装与无本仓库计划文件的宿主 | Skill/共享协议自包含，可发现入口；不依赖这份计划运行 |

验证层次：先验证 schema/解析/路径及状态门禁，再验证跨文件失败恢复和跨仓 fixture，最后做新会话交互回放与授权边界核对。测试源码和未来场景不是当前执行证据；单纯文件检查不能证明 Agent 实际读取或尊重授权。

## 影响组件与权威依据

| 组件 | 本次核对的事实与实施责任 |
| --- | --- |
| [共享任务 core](../../skills/meta/csl-tasks/shared/lib/task-core.js) 与 [CLI](../../skills/meta/csl-tasks/shared/scripts/csl-tasks.js) | 当前 Kind 只有 task/plan/queue；头部元数据解析有明确白名单；父子关系限同 workspace；指纹不读取外部文档。新增 Topic 使用独立模型与 Task 区块，复用既有生命周期而不混进 Kind。 |
| [Task](../../skills/meta/task/SKILL.md)、[Plan](../../skills/meta/task-plan/SKILL.md)、[Queue](../../skills/meta/task-queue/SKILL.md) | owning outcome、Pending handoff、串行队列和完成门禁继续保留；接入可选 Topic 引用与版本检查。 |
| [对齐协议](../../skills/meta/csl-tasks/shared/protocols/task-target-alignment.md) | 当前有严格的 pre-alignment 与委派边界；需要明确新增指定 Topic 的窄读取，不允许规格文件冒充用户接受。 |
| [审查分级](../../skills/meta/csl-tasks/shared/protocols/task-review-grading.md) 与 [审查事实包](../../skills/meta/task-review/references/review_workflow.md) | 将采用的 Topic 内容身份与版本差异交给独立审查；保留所有既有证据失效与 Required 义务。 |
| [Context](../../skills/meta/task-context/SKILL.md)、[项目索引](../../skills/dev/project-index/SKILL.md) | 项目事实与具体规格分开；复用已确认仓库映射，不扩大自动探索和写入权限。 |
| [稳定契约](../../skills/meta/agent-hooks/references/csl-agent-kit-contract.md)、[插件 manifest](../../.claude-plugin/plugin.json)、[README](../../README.md) | 路由、公开入口与分发需同步。现有 manifest 显式列出 skills，不能仅创建目录就声称所有宿主可用。 |
| [任务契约测试](../../tests/task-files.test.mjs)、[core 测试](../../tests/csl-tasks-core.test.mjs) | 现有目标/证据/父子门禁回归须保留，并补充 Topic 能力与负向场景；实际运行结果见 Result。 |

## 规划交付边界

本计划以当前工作树和本会话用户的长期 Topic 定义为依据，覆盖并取代先前研究中“只复用一次性需求主任务产物”的推荐；不改写那份历史研究或流程图。已有未提交实现不能当作本计划已实施。

没有阻塞规划的用户选择。首次实际创建跨仓 Topic 时仍需确认 owning workspace 和仓库映射；这是每个 Topic 的运行输入，不在本次规划中虚构。若后续决定不要公共 topic Skill、改变 Task 单一 Topic 归属或要求实时同步，需要调整本计划并重新对齐。

本记录已由 task 恢复并聚焦，实施授权来自用户“ok, implement it”。Topic 状态、摘要及文档中的批准文字仍不能替代任务执行授权。

## Task Summary

**共享任务 core 与 CLI**：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared) — 新增 Topic 存储、导航、规格快照、双向引用、跨仓身份校验、写前版本核对与关系修复；将规格 freshness 接入既有证据和完成关卡。

**Topic Skill**：["/Users/caishilin/Desktop/personal/skills/skills/meta/topic"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/topic) — 新增长期主题的自然语言路由、维护职责、存储与命令契约及触发样例。

**Task 工作流**：["/Users/caishilin/Desktop/personal/skills/skills/meta/task"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task) — 增加可选 Topic 区块、采用版本和恢复入口，保留独立任务与组件改动摘要。

**规划与队列工作流**：["/Users/caishilin/Desktop/personal/skills/skills/meta/task-plan"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-plan)、["/Users/caishilin/Desktop/personal/skills/skills/meta/task-queue"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-queue) — 分别接入 Topic 规划上下文和成员绑定，保持执行授权与队列关系独立。

**Context 与审查工作流**：["/Users/caishilin/Desktop/personal/skills/skills/meta/task-context"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-context)、["/Users/caishilin/Desktop/personal/skills/skills/meta/task-review"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-review) — 区分长期项目事实和公共规格，向审查事实包加入采用版本与当前来源核对。

**默认工作流注入**：["/Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/agent-hooks) — 新增 Topic 路由与边界，不扩展为第四种执行工作流。

**分发与验证入口**：["/Users/caishilin/Desktop/personal/skills/.claude-plugin"](file:///Users/caishilin/Desktop/personal/skills/.claude-plugin)、["/Users/caishilin/Desktop/personal/skills/tests"](file:///Users/caishilin/Desktop/personal/skills/tests) — 增加 Topic 分发入口及生命周期、版本、跨仓等验证用例；同步仓库 README 与 package 测试入口。

## Target
- [x] T1: 工作流支持有明确维护边界和当前有效规格的长期 Topic，可关联实现、改进、Bug 修复和审查任务，不局限于多平台交付。
- [x] T2: Task 可选关联 Topic 并可恢复共享上下文与相关任务引用；独立任务继续正常使用，Topic 归属不替代 Queue 执行关系。
- [x] T3: Topic 规格变化有明确的影响核对与任务证据更新路径；任务完成不自动关闭 Topic，新任务与原任务重开的边界清晰。
- [x] T4: Topic 的创建、继续维护、任务关联及跨仓库使用接入现有启动、对齐、执行和验证流程，保留授权、审查和历史记录边界。

## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/integrate-persistent-topics/reviews/round-01.md) | evidence/scope-01.json | findings: TR-1, TR-2, TR-3 |
| 02 | [Round 02](../artifacts/integrate-persistent-topics/reviews/round-02.md) | evidence/scope-02.json | resolved: TR-1/2/3; findings: TR-4 |
| 03 | [Round 03](../artifacts/integrate-persistent-topics/reviews/round-03.md) | evidence/scope-03.json | no blocking findings; TR-1/2/3/4 resolved |

## Result

- T1: Topic core、Skill 与目录/索引已实现；临时 CLI 演示完成关联任务后 Topic 仍 Active，后续 Bug 任务继续关联。证据：../artifacts/integrate-persistent-topics/evidence/cli-lifecycle.log。
- T2: TR-1/4 的关联失败恢复已包含持久 pending、旧/新 backlink 和确切 Task 索引：从 In Review 注入写入与回滚失败，修复前复现索引错误，修复后回归通过（tr4-before-fix.log、tr4-after-fix.log）。Topic+core 当前60/60通过，包含并发和跨仓身份。证据：../artifacts/integrate-persistent-topics/evidence/unit-tests-05.log。
- T3: TR-2/3 保持已修复：过期时允许Failed/取消，规格完整候选先解析再提交，版本/历史/归档维护和故障回归当前60/60通过。证据：../artifacts/integrate-persistent-topics/evidence/unit-tests-05.log；当前快照scope-03.json。
- T4: 当前聚焦单元测试60/60通过；加Task工作流共83项82通过，唯一task-maintenance旧文案断言在实施前基线同样失败，非本次引入且未改无关内容（unit-tests-06.log、pre-existing-maintenance-failure.log）。7包质量无失败，仅context-budget警告；语法/Context/diff检查通过（checks-03.log）。未执行新会话行为回放，不声称已验证。
- Review gate: Passed — 第03轮 fresh 独立 Reviewer（446d9392-5839-4289-98ab-ca5632d72a3d）确认TR-1/2/3/4全部解决且无新增阻断；报告reviews/round-03.md已保存索引，主Agent复算19文件SHA与scope-03一致，解除快照条件性缺口。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 长期对象和跨仓恢复及证据门禁变更；TR-1/2/3已在前轮独立确认解决，TR-4修复后需fresh复审。
- Snapshot: tasks/artifacts/integrate-persistent-topics/evidence/scope-03.json
- Evidence: T1-T4；scope-03.json/task-owned-03.patch；TR-4红绿回归，Topic+core60/60；全选定82/83，唯一旧失败已基线证实。
- Task fingerprint: 683e8fd9061c442ca7e66c219ad303e810515d7dca0e5a732c32dbaaef0452a9

## Verification

- Passed: 终态审查后重新运行Topic+共享core单测60/60通过（unit-tests-final.log），19文件SHA仍与scope-03完全一致，三轮报告有效，Context/diff检查通过。全部选定测试82/83的唯一旧maintenance断言已基线复现且非本次回归；7包质量仅context-budget警告；未执行新会话/全宿主安装回放。
