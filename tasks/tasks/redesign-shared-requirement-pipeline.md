# 研究跨平台需求共享上下文与任务流程重设计

| Field | Value |
| --- | --- |
| Status | Pending (2026-10-12 11:32) |
| Kind | Plan |

## Scope

分析当前工作区的 Task、Queue、Context、共享 core 与跨仓库定位边界；参考官方资料提出跨平台需求共享上下文方案。仅形成规划，不修改规则、实现、项目索引或历史任务，不运行测试，不启动独立审查或委派执行。

## 现状与依据

### 当前流程

项目 Core → 激活并对齐 Task Target → 读取相关 Context Packs 与 Lessons → 执行独立任务，或由 Queue 串行推进子任务 → 自检、审查分级、验证 → 完成与 Task Summary。

- Task 负责一个可独立验收 outcome；同一需求可以有多个任务，但当前没有机器可识别的需求成员关系。Task Summary 只记录各任务实际修改的组件，不承载共享需求。
- Queue 已有父级集成目标、子任务链接、父子完成门禁与子任务重开导致父证据失效的机制。因此不能说当前完全没有多任务能力。
- 但 `linkChild(workspace, ...)` 只在同一 workspace 读取父子，限制单一 Queue parent；`nextChild` 顺序返回第一个未完成子任务。其所有权与执行顺序是耦合的，不是跨仓库需求分组或依赖调度器。
- Context 只容纳长期稳定、决策相关的项目事实；某次需求的澄清、平台范围、临时约束和实施进度不应混入 Project Core 或普通 Packs。
- 已有 Task Artifacts 的 specs 类别能保存权威需求文档；普通链接也能人工共享。因此缺口不是“没有 Markdown 容器”，而是引用发现、读取时机、版本绑定和跨任务变更检查。
- `reviewTaskFingerprint` 计算任务正文，排除部分生命周期区块；它不读取外部链接内容。仅给任务贴需求链接，不能自动发现文档已更新。现有协议把外部证据漂移核对交给 Agent，不是完全没有失效要求。
- project-index 已提供稳定项目 ID 与本机仓库 root 映射，但索引可能不完整；它不是需求存储，也不保证其他机器能解析相同 ID。当前不得擅自新增索引或扫描其他仓库。
- 目标对齐协议禁止把持久文档当成用户接受证据；跨会话读取同一需求不等于继承执行授权。

### 权威本地来源

- [Task 契约](../../skills/meta/task/SKILL.md)：Activation and Ownership、Task Artifacts、Task Summary、Result、Completion。
- [Queue 契约](../../skills/meta/task-queue/SKILL.md)：Build the Task Graph、Sequential Execution、Parent Final Gate。
- [Context 契约](../../skills/meta/task-context/SKILL.md)：Admission Gate、Route Elsewhere、Authority and Writes。
- [任务 core](../../skills/meta/csl-tasks/shared/lib/task-core.js)：`taskPath`、`reviewTaskFingerprint`、`linkChild`、`nextChild`、`completeTask`、`reopenTask`。
- [对齐协议](../../skills/meta/csl-tasks/shared/protocols/task-target-alignment.md)：Authorization Sources and Goal Acceptance、Pre-Alignment Boundary、Delegated Execution。
- [审查分级协议](../../skills/meta/csl-tasks/shared/protocols/task-review-grading.md)：Record the Assessment、Invalidation and Recovery。
- [项目定位](../../skills/dev/project-index/SKILL.md)：CLI and Data、Route a Task、Maintain the Index。

本次依据当前工作树，而不是只依据 HEAD；其中有本次研究前已存在的未提交修改。结论是源码与契约分析，不是已运行端到端行为测试。

### 外部研究

- [Linear Projects](https://linear.app/docs/projects)：项目可以跨团队，聚合 issues，并有共享 documents 与 links。借鉴“共享需求说明 + 独立工作项”；不照搬完整 Initiative/Project/Issue 管理层级。Linear 的 Project 在这里更接近需求交付组，不等于 Git 仓库。
- [GitHub sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues)：支持从其他仓库选择子 issue；[issue dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies) 另外描述 blocked-by/blocking。借鉴“属于同一需求”和“必须先后执行”是不同关系。
- [GitHub Spec Kit 规格模板](https://github.com/github/spec-kit/blob/main/templates/spec-template.md)：用户场景、独立验收、稳定需求编号、功能要求与技术无关的成功条件；[SDD 文档](https://github.com/github/spec-kit/blob/main/spec-driven.md) 将规格与技术计划分开。借鉴需求先于平台实现；不采用重新生成全部代码或要求所有任务都经过重型规格流程。

以上为读取到的官方文档模式，不是对本项目落地效果的实测保证；链接内容可能继续变化。

## Decisions

以下是本次研究的推荐设计，不代表用户已经批准实施。

### 1. 分离三种信息和两种关系

- Project Context：长期项目事实，保持原职责。
- Requirement：同一需求当前有效的公共行为、共同接口契约、明确平台差异、需求级验收与决策；是权威规格，不叫另一个项目 Context Pack。
- Task：平台或阶段的独立交付、局部 Target、Plan、Result、审查、Verification 和 Task Summary。
- `Requirement membership` 只表达属于同一需求，不决定串行顺序或审批权。
- `Execution dependency` 表达实际前置条件；Queue 保留本地串行执行用途。共享需求并不自动启动并行 Agent，也不意味着每个平台只能有一个 Task。

### 2. 最小存储：复用产物，不先建第四种任务

- 为跨任务需求指定一个拥有者工作区和需求主任务；复用该任务的 specs 产物保存单一权威需求文档。已有权威 PRD/规格时优先引用，不机械复制。
- 首版不增加 `Kind: Requirement`、全局需求数据库、后台同步器或新的公开 Skill。共享需求在语义上是独立对象，存储上先使用已有产物能力。
- 主任务维护需要交付的平台/能力范围、成员任务引用与总体验收；同工作区且确需串行时可以是现有 Queue，否则是独立的集成任务，不伪造跨仓库 Parent/Children。
- 各平台任务继续保存在各自工作区；通过轻量 Requirement 引用关联主规格，不复制全文。普通独立任务无需强制新增需求文档。
- 需求文档只放目标和范围、稳定的需求编号、共同交互/接口/数据约束、已确认平台差异、共同决策及必要来源。不放完整对话、所有平台代码细节或成员运行状态。
- 成员登记放主任务，不放规格正文；状态由任务现场读取，避免第二份进度台账与状态更新导致规格版本频繁变化。

### 3. 引用最小模型

建议任务持有：权威规格 locator、已采用的内容 revision/digest、适用需求编号或平台范围。locator 由项目/仓库身份加仓库内路径构成；任务成员引用由项目身份加 task ID 构成。字段名与机器 schema 在实施时统一到共享 core，不依赖任意自由文本提取。

- 仓库内使用可移植的相对定位；跨仓库复用已确认的 project-index 映射作为本机 resolver，并校验映射的仓库身份。绝对本机路径可用于展示，不作为唯一跨机器身份。
- 若项目尚未登记或路径无法解析，明确请求确认映射；不能扫描其他仓库、猜测同名项目或自动 clone。
- 共享 PRD 的 URL 也可以是来源，但必须能取得可核验版本；不可访问时不能把旧本地副本默认为最新。
- revision 是内容身份，不是审批标志。Git commit 可提供不可变版本；未提交规格需内容摘要及可恢复的对应正文。只保存一个无法找回原文的 hash 不足以恢复工作。
- 规范性依赖，例如引用的 API schema，应绑定具体版本或摘要；不能只固定主文档而让接口链接偷偷变化。
- 首版每任务一个主需求归属；公共契约可作为关联来源。真正独立的多需求结果应拆任务，不先实现多对多标签系统。

### 4. 新的操作顺序

1. 加载当前工作区 Project Core，解析用户指定需求或已有任务的明确 Requirement 引用。
2. 若要形成准确 Target，允许只读取得该指定规格的公共范围与适用平台要求；禁止借此提前扫描实现或进行广泛探索。此项是需要显式修改对齐协议的边界，不是当前已支持行为。
3. 激活、聚焦 owning Task，将共享需求中适用的条款映射为局部可观察 Target，然后由主交互 session 完成目标对齐。
4. 对齐后读取完整适用规格、相关 Project Context Packs、Lessons、权威接口和本任务状态；执行前核对采用版本。
5. 执行平台任务，按原有自检、R0/R1/R2 和验证流程推进。审查材料包含采用的需求版本，不只给作者概述。
6. 在 resume、审查交接和 complete 前重新读取权威版本。摘要仍只记录当前任务实际修改的组件；不能把共享需求说明塞回 Task Summary。
7. 集成主任务按当前采用的需求版本核对平台覆盖及跨平台一致性，不能把“所有已登记任务完成”当成“需求完成”：缺少平台任务、未覆盖条款和接口版本不一致都必须暴露。

### 5. 共享变更与并发

- 单一明确 owner 负责修改共享规格；平台任务提出调整建议，但不能静默改成仅满足本平台的契约。
- 实施可独立进行，规格写入采用预期旧版本核对，防止并发覆盖；首版无需常驻服务。
- 新版本出现时，读取其内容并比较语义与适用范围。修正文案或不影响本平台的变更可以记录核对后更新引用；行为、平台范围或验收变化必须重新对齐并刷新受影响证据。
- 不能仅改版本字符串“消除过期”：必须记录差异处置，更新 adopted snapshot，再按现有 sync 和评估失效规则重建相关证据。跨仓库关系不自动授予修改另一个仓库的权限。
- 首版采用关卡式检查，不承诺实时广播：启动/恢复、审查交接、完成及集成验收时现场核对。关卡间仍可能存在短暂版本差异；需要严格实时协调时再单独规划通知机制。
- 需求不可访问或有未处理的实质变更时，停止依赖该内容的工作与终态 gate；已有离线副本只能作为明确版本的材料，不得声称当前同步。
- 已完成任务保留其原版本的历史证据。修正同一 outcome 时显式 reopen；新增需求版本形成独立结果时新建后续任务。集成主任务对当前版本的覆盖状态需重新核对，不能静默沿用旧完成结论，也不远程批量重开历史任务。

### 6. 保留授权和职责边界

- 所有任务读到同一规格，不等于所有任务都已获准执行。已有可恢复接受证据与完整 delegation packet 才能复用对齐；没有则保留正常用户 checkpoint。不能往文档写一个 `approved: true` 就跨会话继承授权。
- 不为了共享上下文改变单任务完成门禁、降低独立审查要求，或把本地 Queue 一次性重写为跨仓库 DAG 调度器。
- 运行契约放入可分发 Skills 与共享协议，不要求安装后的用户读取本仓库这份研究记录。

### 备选方案比较

- 每个平台复制需求：落地快，但修改后易分叉，不推荐作为默认。
- 把需求写入 Project Context：无需新引用模型，但混淆稳定事实与临时需求，不推荐。
- 所有任务统一塞进 Queue：可复用父级验收，但把共享归属强绑本地串行图；仅适合已有同仓串行场景。
- 新建完整 Requirement/Feature 管理系统：长期可行，但当前不需要新全局存储、状态机和调度器；先验证轻量引用能否满足恢复与一致性。
- 推荐：单一需求规格 + 版本化任务引用 + 独立执行与集成核对。

## Plan

1. 固化最小契约：明确规格所有者、任务引用格式、成员登记、采用版本、不可访问和已完成记录语义。用同仓与跨仓多平台示例核对，保持独立任务零额外负担。
2. 实现引用解析与只读核对：扩展共享 core/CLI 以解析 locator、核对版本并显示缺失或过期；复用 project-index，不新增全局 registry。先覆盖重复 task ID、仓库搬迁、错误映射、未提交规格及规范性外链。
3. 接入 workflow：同步 task-plan、task、task-queue、对齐协议、task-review 事实包和稳定路由契约；补足指定规格在 Target 形成前的窄读取边界。需求引用变化纳入既有证据失效；不将内容 hash 当授权证据。
4. 完善集成核对：由主任务按需求编号、必要平台、采用版本和实际证据逐项核对；保持成员状态现场读取。跨仓引用不复用现有仅同 workspace 的 Parent/Children API。
5. 获得实施及测试授权后，运行聚焦解析与生命周期测试、跨会话回放、跨仓恢复场景、受影响 Skill 质量检查；复杂 core/协议变更按 R2 完成独立 task-review。没有测试授权不能把用例清单写成通过。
6. 选一个真实多平台需求试用后再评估是否需要独立 Requirement kind、专用 Skill 或依赖调度。保留历史任务；只对新建或显式重新处理任务应用新契约。

### 未来验证场景

- 同仓与跨仓 iOS/Android/Web 任务引用同一规格，平台实现不同但公共要求一致；同一平台允许多个阶段任务。
- 共享规格变化但 task 文件没变，审查/完成关卡仍能识别版本差异；格式变化和语义变化分别处理。
- 一个平台已完成、另一个未开始时公共契约变化，不把历史完成误当成新版本满足，也不擅自重开其他仓库任务。
- 两个 session 同时更新规格不会静默覆盖；错误仓库映射、重名 task ID、失联来源与缺失本地 checkout 能明确失败。
- 任务全部标记完成但某必要平台/条款没有成员覆盖时，需求集成验收不能通过。
- 已有本地 Queue 继续串行运行；独立 Task、历史记录、Task Summary 和既有权限/审查门禁不退化。

## 待实施时确认

- 针对第一个真实多平台需求，选择权威规格的 owning workspace 与可访问来源；本次不创建新共享仓库。
- 确认实施范围与允许运行的测试；本次仅研究，不推定授权。
- 推荐的引用与同步模型不要求现在选择新产品名、公开 Skill 名或全局目录；避免在验证需求前引入这些决策。

## Target

- [ ] T1: 基于现有工作流和权威实现，说明需求、任务、Queue 与项目 Context 的职责及多平台多任务共享上下文的现有能力与缺口。
- [ ] T2: 调研相关设计模式并提出适合本项目的流程重设计建议，覆盖共享信息归属、平台任务关联、变更同步和恢复上下文，区分事实、建议与待决策项。
- [ ] T3: 给出可执行的分阶段改造与验证计划；本次不修改工作流实现或迁移历史任务。
