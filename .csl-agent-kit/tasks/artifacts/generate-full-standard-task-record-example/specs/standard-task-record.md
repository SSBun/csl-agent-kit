# 导出当前筛选结果为 CSV（完整标准 Task 展示样例）

Status: Blocked (2026-09-11 17:24)
Kind: Task
Parent: none

> **这是虚构的展示样例，不是真实业务任务，也不是可直接复制后宣称完成的记录。** 本文件依据当前工作树中的新标准编写，包含 `Review Assessment` 与 R0／R1／R2；不代表这些更新已提交或发布。正文展示一条审查停滞、尚未完成的 Task；后半部分列出不能同时生效的字段和分支。
>
> “完整”指当前 Task 家族契约定义的内容全集，不是每条任务都必须保留全部章节，也不包括任意项目自定义字段。下面的业务、时间、检查、审查轮次与 finding 均为虚构；只有字段格式及文档结构接受了实际核验。`Task fingerprint` 由当前核心在隔离的示例工作区生成，不是业务证据或本文件的 SHA256。

## Scope

- 【虚构】包含：将当前筛选结果导出为 CSV，保留页面的筛选与排序行为，并排除未授权字段。
- 【虚构】不包含：导出全部历史数据、后台批量导出、云端上传、权限策略调整。
- 【虚构】只生成本地文件，不写回数据源、不改变服务端记录。

## Target

- [x] T1: 当前筛选结果可导出为可读取的 CSV，中文、引号、逗号与换行内容保持完整。
- [ ] T2: 导出内容不包含当前用户无权查看的字段。
- [x] T3: 原有页面筛选与排序行为保持不变。

## Decisions

- 【虚构】导出对象是“当前筛选结果”，不是全部数据；用户已选择 CSV，不增加其他格式。
- 【虚构】权限要求沿用当前用户可见字段，不因导出新增权限。
- 【虚构】不自动上传产物；任何新的外部副作用必须另行处理授权边界。

## Plan

1. 在获得可用的权限边界复现材料后，修复导出范围与页面可见字段不一致的问题。
2. 重新验证三个 Target，撤换失效证据，并依据当前产物刷新审查分级。
3. 由新的只读 Reviewer 复核未解决项与修复影响；无阻断项后执行最终核验。

## Result

- T1: 【虚构证据】在示例快照 example-csv-v3 上对照筛选页面与本地 CSV，行列与顺序相符，中文及 CSV 转义内容可读；此项仅覆盖普通可见字段，不证明 T2 的权限边界。这里没有真实文件、运行日志或已执行的业务检查。
- T3: 【虚构证据】在 example-csv-v3 的导出前后对照页面，筛选条件、排序规则与显示顺序保持不变；仅演示保留行为的独立验收项，并非本次实际运行结果。
- Review gate: Required — 【虚构状态】R2 独立审查义务仍在；TR-1 尚未解决，不能记录 Passed、Approved 或 Skipped。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Stale
- Reason: 【虚构】涉及字段权限边界，错误可能泄露无权查看的数据，不能凭改动小认定 R1。
- Snapshot: 【虚构占位】example-csv-v3；仅演示历史分级字段，不是实际可恢复的业务产物身份，不可用于真实完成门禁。
- Evidence: 【虚构占位】示例原有自检结论已因 T2 被撤回而失效；这里不声称执行过业务检查，当前限制见 Result 与 Block。
- Task fingerprint: 595ed6ba8ae0304ac6cf6498c1a50736e3577395dc1c01a767ab43d55e1602e2

## Review

- Schema: task-review-ledger/v1
- Pass: 3
- Next finding: 2
- `TR-1` | no-progress=2 | 【虚构】T2／导出字段范围 | 排除无权查看的字段，并提供同一快照下页面与导出字段一致的可复核证据。

## Verification

- Failed: 【虚构】最终完成条件不成立：T2 未满足，assessment 已失效，Required 义务和 TR-1 仍在；没有实际执行产品检查，不宣称样例业务通过。

## Block

- Reason: 【虚构】TR-1 连续两次复审没有实质进展，no-progress 已达 2；T2 的原有结论被撤回，权限边界尚未满足。停止继续派发审查，不以重复检查或措辞变化充当修复。
- Unblock when: 【虚构】取得不含敏感数据的可复现材料或实际修复，并有新证据表明 TR-1 获得实质进展；主 Agent 核实后将对应 streak 重置为 0，再恢复任务。恢复后仍须重新验证 T2 和执行 fresh 审查，不能直接完成。

## 使用说明：正文与附录的边界

主记录到本节前结束。以下各节是**展示附录，不是新增的标准任务字段**。代码块中的替代写法不能同时粘进主记录；实际使用时只保留适用内容，然后由 CLI 同步并重新生成分级、门禁与最终验证。

主记录选择 `Blocked`，是为了合法展示未解决的 Review ledger 与 Block。T1、T3 的勾选表示有对应 Result，T2 仍未满足；整条任务当然不能完成。曾有的评估因修订变为 `Stale`，只能作为失效标记保留，不能授权终态门禁。真实记录不能用本文件的虚构证据办理完成。

## 附录一：全部标准字段与章节

| 项目 | 是否必需／何时出现 | 内容与维护责任 |
| --- | --- | --- |
| `# 标题` | 新记录必需 | 单一结果的标题；规范标题从行首开始，不放进引用或列表容器。 |
| 任务 ID | 必需，但不另写 `ID:` 行 | 来自 canonical 文件的 lower-kebab-case 文件名；引用关系使用同一 ID。 |
| `Status` | 必需 | CLI 写入当前状态和本地分钟级时间，格式 `Status: 状态 (YYYY-MM-DD HH:MM)`；不是完整时间线。 |
| `Kind` | 新建、重开工作必需 | `Task`、`Plan`、`Queue` 三选一；表示记录类型，不是当前阶段。 |
| `Parent` | 有父任务时需要；无父可省略 | 写父 Queue 的 ID；无父可以写 `none`。由图关系操作维护。 |
| `Scope` | 存在重要边界时 | 包含、排除、保持行为与副作用边界；不罗列实施方法。 |
| `Target` | 必需，至少一项 | 唯一的 checkbox 列表；稳定、不重复的 Tn 与可观察验收结果。 |
| `Decisions` | 有需保留的已定选择时 | 保存后续执行必须遵守的决定与约束，不写访谈流水账。 |
| `Plan` | 按当前工作需要 | 有序结果节点、依赖与下一步；无 checkbox，不保留已过期的行动流水账。 |
| `Children` | Queue 有子任务时 | 有序、真实的子任务链接，必须与子任务 `Parent` 双向一致。 |
| `Result` | 有已验证结果时 | 每个 Tn 最多一条证据；由 `result` 写入并勾选 Target。不能为未达成结果占位。 |
| `Result` 中的 `Review gate` | 选择审查路线后 | 唯一门禁行，值为 `Skipped`、`Required`、`Passed`、`Approved`。 |
| `Review Assessment` | 新终态审查门禁与完成前必需 | CLI 维护的当前分级记录；planning-only 的 Pending 记录无需提前生成。 |
| `Review` | 当前审查循环尚有未解决项或停滞时 | 唯一版本化 ledger，不是审查全文；解决全部阻断项后移除。 |
| `Verification` | 有当前最终核验结果时 | 单行 `Passed` 或 `Failed`，注明实际检查、观察与局限；由 CLI 记录，不自动执行检查。 |
| `Block` | 仅 Blocked 时 | 具体 Reason 与可观察的 Unblock when；先写章节再进入 Blocked，恢复时移除。 |

新记录的标准顶层元数据只有 `Status`、`Kind` 与适用时的 `Parent`；不要自行声称 `Owner`、`Priority`、`Deadline`、`Created`、`Accepted`、`AlignmentLevel` 是 core 固定字段。`Deliverable`、`Artifacts` 等可以是有明确用途的业务自定义章节，但不是统一必填项。

## 附录二：Review Assessment 的字段全集

本节是正文 R2 分支的补充：**R1 才需要额外的四项豁免依据**。以下为替换片段，不是另一条生效的 assessment；哈希占位符不能用于真实记录。

```markdown
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 【虚构】仅修正一处展示文案，含义与保留行为明确，无其他行为变化。
- Snapshot: 【填写实际、可恢复的产物内容身份；脏工作树不能仅写 HEAD】
- Evidence: 【填写主 Agent 已实际执行的逐 Target 自检及证据引用】
- Result clarity: 【虚构】预期文案和必须保持不变的行为均明确，无待定解释。
- Bounded impact: 【虚构】只影响一个已定位的展示出口，直接消费方和失败路径已检查。
- Low risk: 【虚构】错误后果局限于展示且可恢复，不涉及权限、隐私、财务或不可逆数据操作。
- Sufficient verification: 【虚构】已逐字比对预期与产物并检查全部引用；这里不是本次执行事实。
- Task fingerprint: <由 assess-review 生成的 64 位小写十六进制值，不能复制本占位符>
```

| 字段 | 合法内容与限制 |
| --- | --- |
| `Schema` | 固定为 `task-review-assessment/v1`。 |
| `Level` | 仅 `R0`／`R1`／`R2`；与对齐 L0–L4、安全 S0／S1 分别独立。 |
| `State` | `Current` 或 `Stale`；Stale 不得办理新终态门禁或完成。 |
| `Reason` | 当前实际结果的具体分级理由，不能只说“改动很小”“有信心”。 |
| `Snapshot` | 干净 Git 内容可用确切 revision；脏／未跟踪／删除／重命名内容需可恢复的范围与身份，或等价非 Git 内容标识、清单引用。R0 标识无文件结果及证据。 |
| `Evidence` | 主 Agent 对当前版本做过什么、观察到什么、证明什么、限制是什么。 |
| `Result clarity` | R1 必需：结果和保留行为清楚，没有未解决的需求解释。 |
| `Bounded impact` | R1 必需：影响、直接消费方及失败路径可界定。 |
| `Low risk` | R1 必需：失败后果有限且可恢复，不忽略高后果边界。 |
| `Sufficient verification` | R1 必需：当前允许的检查足以证明 Target 与保留行为，未执行检查不能写为通过。 |
| `Task fingerprint` | core 生成的任务实质内容指纹；不是外部交付物哈希，也不会监控外部文件。 |

R0、R2 至少含 Schema、Level、State、Reason、Snapshot、Evidence、Task fingerprint；R1 还必须含全部四项依据。不要手改这个章节，也不要把它并入 Review ledger。

`sync`、Result 更新、重开、相关 Queue 图变化会使 assessment 失效并清除 Verification；先前 Skipped 被移除，Passed／Approved 退回 Required。直接实质内容漂移也会被终态门禁的指纹比较拦截，但外部产物是否变化仍由主 Agent 实际复核。审查期间内容漂移必须重新自检、分级并 fresh review，不能复用原来的“无发现”。

## 附录三：分级、门禁与状态的互斥分支

### R0／R1／R2 与 Review gate

| 场景 | 合法路线 |
| --- | --- |
| R0：没有请求交付物文件变化 | 当前 assessment → Skipped → 最终 Verification → complete；Task／Context／Lessons 生命周期写入本身不算交付物修改。 |
| R1：简单低风险，四项豁免依据全部具体成立 | 当前 assessment → Skipped → 最终 Verification → complete；小逻辑变更也可能是 R1，不能只凭文件类型或行数判断。 |
| R2：复杂、高后果或有重要不确定性 | 自检与 Result → 当前 assessment → Required → In Review → fresh 只读 task-review → 主 Agent 核实并记录 Passed → 最终 Verification → complete。 |
| 任意等级，用户明确要求普通审查 | 不能豁免；Required → In Review → fresh 普通审查 → Passed → 最终核验。 |
| R0／R1，用户明确要求 adversarial-review | Required → In Review → 显式请求的对抗审查 → Approved → 最终核验；不自动增加普通审查。 |
| R2，用户明确要求 adversarial-review | 先完成 mandatory task-review 并记录 Passed，再完成对抗审查；Approved 的证据同时标明两者，之后最终核验。 |

`Skipped` 是有依据的豁免，不是“审查通过”；`Required` 是未履行的审查义务，不是失败结论；`Passed` 由主 Agent 根据独立普通审查反馈记录；`Approved` 只对应用户明确请求的对抗审批。Reviewer 只反馈，不能写任务状态或授予完成许可。

已有 Required 义务不能改成 Skipped；不能因为 Reviewer 不可用、启动失败、耗时或发现问题而降级。缺少必要验证可能直接 Block，不能仅靠升为 R2 代替缺失证据。必需 Reviewer 失败时记录实际故障与恢复条件并 Block，不以自审冒充独立审查。

### 六种状态

| Status | 适用记录内容与门禁 |
| --- | --- |
| `Pending` | 等待执行或 implementation-ready Plan；未实施的 Target 不勾选，不伪造 Result／Review／Verification／完成。 |
| `In Progress` | 主 Agent 准备、执行、自检或修复；也用于 R0／R1 的豁免与完成前核验。 |
| `In Review` | 先有 Required，再派发当轮审查；冻结相关范围，有确认问题回 In Progress 修复。 |
| `Completed` | 所有 Target 有当前 Result；assessment Current；有效 Skipped／Passed／Approved；最终 Verification Passed；无 Block 或活动 finding；Queue 子任务全部完成。只能通过 complete 进入。 |
| `Blocked` | 有具体 Block；停止越过阻断条件继续执行；Review ledger 可保留以支持恢复。 |
| `Cancelled` | 可恢复的软停止，不等于完成，不伪造通过证据；恢复后重新核对适用范围与证据。 |

核心允许的普通状态转换如下；`Completed` 由专用完成门禁处理：

```text
Pending     → In Progress / Blocked / Cancelled
In Progress → Pending / In Review / Blocked / Cancelled
In Review   → In Progress / Blocked / Cancelled
Blocked     → In Progress / Cancelled
Cancelled   → In Progress
Completed   → 通过 reopen 回 In Progress，并补充后续 Target
```

这些是状态入口，不是执行授权：例如恢复 Cancelled 不能绕过已变化的 Target 或独立安全确认。再次设置同一状态可以无变化返回，但不会代替缺失的检查。Completed 的子任务要先激活父任务才能 reopen；重开子任务会失效父级的完成证据。

### Review ledger 与 Verification 的全部变化值

- `Pass` 是当前 review pass 的正整数编号；`Next finding` 是下一未用正整数编号，始终大于所有活跃 TR 编号，不能复用旧 ID。
- `no-progress=0`：首次发现，或有证据表明实质进展／有效重新分类后重置。
- `no-progress=1`：同一根因与所需结果在下一次复审无实质进展。
- `no-progress=2`：连续两次无进展，停止复审并 Block；不是第三次自动通过，也不是全任务最多三轮。
- 新 finding 不重置旧 finding；换位置、改措辞、重复同样检查不算进展。已解决项移出当前 ledger；无阻断项时移除整个 Review。
- `Verification` 的值仅为 `Passed` 或 `Failed`，每次保留当前结果，不追加历史。任何 assessment 或 review gate 写入均清除它，因此**最后一次门禁决定之后还要执行并记录最终核验**。

## 附录四：Plan、Queue 与父子记录

### Plan：只规划、不实施

以下是独立替代记录，不与主 Task 合并。文件名示意为 `example-csv-plan.md`；此处只是 schema 样例，不对应已创建的本地任务。

```markdown
# 为当前筛选结果准备 CSV 导出方案（虚构 Plan）

Status: Pending (2026-09-11 17:30)
Kind: Plan

## Scope

- 只研究并形成可执行决策，不修改产品代码、配置或目标产物。

## Target

- [ ] T1: 当前筛选结果可导出为 CSV，数据与显示顺序一致。

## Decisions

- 导出使用 CSV；只覆盖当前筛选结果；不得上传。

## Plan

1. 在收到明确执行授权后实现导出结果。
2. 验证数据与页面一致，并核查不产生额外副作用。
```

planning-only 保持 Pending，不因“计划写好了”勾选实现 Target；若用户决策未定且阻止计划就绪，添加 Block 后进入 Blocked。用户后来明确授权执行时恢复同一记录交给 `task`，`Kind: Plan` 不等于永远禁止执行。既有 Target 等价且接受依据仍可恢复时不重复确认；仅接受规划 Target 不是实施授权。

### Queue：一条父记录加真实子记录

Queue 的 `Children` 是主 Task 不适用的唯一专属标准章节。以下仅展示父记录的差异字段；不是一条可直接完成的完整 Queue，也未创建任何示例子任务。

```markdown
Kind: Queue
Parent: none

## Plan

1. 完成 example-csv-export 的导出结果，作为后续集成基础。
2. 完成 example-csv-integration 的多角色集成结果。
3. 验证父级整合 Target，再完成父任务自身的分级与最终门禁。

## Children

1. [实现本地 CSV 导出](example-csv-export.md)
2. [验证多角色导出集成](example-csv-integration.md)
```

对应子记录分别拥有自己的标题、Status、Kind、Target、Plan、证据和完成门禁，并使用：

```text
Parent: example-csv-queue
```

这里假设父文件名为 `example-csv-queue.md`。`Parent` 写 ID 而不是标题或路径。代码块里的相对链接是 core 要求的**字面记录语法**，不是本机可点击的实际文件引用。

父子关系必须通过真实图关系维护：双向对应、单父、无环；Queue、子任务及同级兄弟的规范化标题互异。父级 Plan 必须按顺序列出每个 child ID，承载依赖与委派来源，不复制子任务的 Target、Plan、Result 或状态；Children 本身就是恢复游标，不再创建 cursor 字段。

按 Children 顺序执行，当前 child Blocked／Cancelled、验证失败、需要用户决策或到达独立安全边界时停止，返回主会话；不跳过它去运行后续 child。取消父任务是软停止，不会隐式取消或删除 children。仅步骤多或文件多不自动构成 Queue。

每个 child 独立分级与完成，父级仍须验证自己的整合 Target。父级没有自己交付物变化可为 R0，但“子任务全完成”不等于父级整合已验证。子任务重开或图关系变化会失效父级 assessment、审查与 Verification；图分发的实质改变还需回主会话处理对齐检查。

### 索引与产物，不是 canonical 正文的新字段

真实任务在 newest-first 索引中只保留标题、当前状态及相对链接；示意：

```markdown
- [导出当前筛选结果为 CSV](tasks/example-csv-export.md) — Blocked (2026-09-11 17:30)
```

本样例**不加入该索引**，不建立假业务任务。索引不一致时 canonical 正文是权威；操作时仅同步 owning task 的精确条目，不改无关历史。

需要持久化产物时，使用 owning task ID 下的 `discussions`／`specs`／`reports`／`evidence` 类别，按实际需要创建；正文只链接，不复制产物全文。代码、配置及长期权威项目文档仍留在原有位置。供理解记录语法的示意链接如下，并不宣称目标文件存在：

```markdown
- T1: 已比对当前产物；详见[检查材料](../artifacts/example-csv-export/evidence/export-observation.md)。
```

## 附录五：写入职责、恢复与不应持久化的内容

| 操作 | 正确入口或约束 |
| --- | --- |
| 创建／恢复／重开／取消 | `create`／`resume`／`reopen`／`cancel`；激活后实际调用宿主 focus。 |
| 直接修改 Scope／Target／Decisions／Plan／Block／Review | 只修改当前任务，然后 `sync` 与 `check`；Completed 先 reopen，不能沿用旧通过证据。 |
| 确认 Target 有观察支持 | `result`，不要手动勾 checkbox。后续发现结论失效时撤换失效内容，再同步并刷新证据。 |
| 生成分级 | In Progress 时 `assess-review`；R1 增加 `--clarity`、`--impact`、`--risk`、`--verification`。 |
| 进入或记录审查门禁 | `review` 与 `status`；核心写状态不代表实际审查发生。 |
| 记录最终检查 | 主 Agent 先真正执行允许的检查，再用 `verify` 记录结果；参数不构成运行测试的授权。 |
| 完成与检查索引 | 最后 `complete`、`check`、`validate`；这些不是产品行为或审查独立性的证明。 |

canonical 中不持久化以下对齐内部结构：Authorization Ledger、L0–L4 判定包、settledClauses、confirmationItems、checkpointReason、委派包、`confirmed=true` 或私密推理。会话中展示的 Outcome／Done when／Boundaries 也不是必须新增的同名正文 section；它们对应实际 Target、Scope 与已定约束。接受依据需能从用户请求与确认中恢复，不能拿 Agent 自写 Decisions 或 checkbox 充当授权。

Safety Confirmation 是实际动作边界的独立确认，不由 Target 接受或 Review gate 代替；安全相关的用户约束可保留在 Scope／Decisions，但不能杜撰永久批准字段。Context 存稳定项目事实，Lessons 存可复用纠错规则，二者不应作为任务进度章节拷入。密钥、敏感数据、私密思考和无必要日志均不入记录。

兼容不等于新标准：旧记录缺少 Kind 或 assessment 可以保持历史可读；历史 `Kind: Auto` 读取时按 Queue 解释，新建不用 Auto。单个未标记的历史 free-form Review 可读，但新活动 ledger 必须采用唯一的版本化格式；不批量迁移未触及历史。新终态门禁和完成必须具备当前 assessment。

## 附录六：权威来源与核验边界

本样例依据当前工作树，若新协议后续变化，应重新核对，而不是把本文件当作新的规范来源：

- Task 主契约：["/Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task/SKILL.md)
- 分级协议：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-review-grading.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-review-grading.md)
- 对齐协议：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md)
- Plan 契约：["/Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-plan/SKILL.md)
- Queue 契约：["/Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-queue/SKILL.md)
- 单次审查契约：["/Users/caishilin/Desktop/personal/skills/skills/meta/task-review/SKILL.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-review/SKILL.md)
- 审查事实包与边界：["/Users/caishilin/Desktop/personal/skills/skills/meta/task-review/references/review_workflow.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task-review/references/review_workflow.md)
- 记录解析与生命周期核心：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js)
- CLI：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/scripts/csl-tasks.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/scripts/csl-tasks.js)

结构可解析不意味着虚构业务真的实现、审查真的运行或文件真的满足权限要求。本次没有运行单元测试、测试套件、模型评测或虚构业务检查。真实的文档核验与审查证据由本次生成工作的 owning task 保存，不写成样例业务的完成事实：

["/Users/caishilin/Desktop/personal/skills/tasks/tasks/generate-full-standard-task-record-example.md"](file:///Users/caishilin/Desktop/personal/skills/tasks/tasks/generate-full-standard-task-record-example.md)
