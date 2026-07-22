# AI Coding Agent 单任务 Markdown Record 最佳格式研究

## 结论

### 官方来源直接事实

- GitHub issue forms 可定义结构化输入，并用 `validations.required` 把输入设为必填。[GitHub Docs: Syntax for GitHub's form schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)
- GitHub task lists 可把工作拆成可勾选任务，并显示完成进度。[GitHub Docs: About task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists)
- Linear 将 issue 定义为基本工作单元；issue 属于团队，并沿该团队的 workflow 流转。[Linear Docs: Concepts](https://linear.app/docs/conceptual-model)
- Linear issue template 可复用 issue 的结构和属性；sub-issue 可将较大 issue 拆成更小的工作项并保留父子关系。[Linear Docs: Issue templates](https://linear.app/docs/issue-templates) [Linear Docs: Parent and sub-issues](https://linear.app/docs/parent-and-sub-issues)
- Linear issue status 定义 issue 从开始到完成可经过的状态类型与顺序；workflow 按团队配置。[Linear Docs: Issue status](https://linear.app/docs/configuring-workflows)
- Scrum Guide 2020 将 Sprint Backlog 描述为 Developers 制定的计划，并说明该计划会随着更多认知出现而更新。[Scrum Guide 2020](https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf)
- Scrum Guide 2020 规定，不满足 Definition of Done 的 Product Backlog item 不能作为 Increment 的一部分。[Scrum Guide 2020](https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf)

### 因此对本仓库的推论

- 默认删除独立 `Checklist`。通用元检查属于 workflow；任务特定的兼容性、风险和副作用写入 `Target / Acceptance`。再保留 Checklist 会复制完成门禁，并产生两个可能漂移的事实源。
- `Target / Acceptance` 是任务记录中唯一使用 checkbox 的区块。每项使用稳定 ID `T1`、`T2`，描述可观察、可判真的结果。
- `Plan` 是普通有序列表，只保留当前仍需执行的 how。它可随实现认知变化而改写，不保存进度历史，也不参与完成判定。
- 记录按生命周期增量生成：`Pending` / `In Progress` 不预建空 `Result / Evidence` 或 `Review`，也不得预写 `APPROVED`；进入 `In Review` 前加入逐 Target Evidence；实际审查后才加入 `Review`；只有 `Blocked` 才加入 `Block`。
- `Result / Evidence` 逐个引用 Target ID，记录检查对象、检查方式和观察结果；每个 Target 都需要当前证据。只有存在实质偏差时才增加 `Deviation`。
- `Completed` 的必要且充分条件是：全部 Target 已勾选、每个 Target 都有当前 Evidence、实际 `adversarial-review` 的 Decision 为 `APPROVED` 且附 Report 链接。`Status` 仅投影这些事实。
- 保留五态 `Pending`、`In Progress`、`In Review`、`Completed`、`Blocked`。canonical 状态使用单一完整值 `**Status:** Pending (YYYY-MM-DD HH:MM)`；`tasks/todo.md` index 必须复制完全相同的值。
- `Scope` 按需出现；只有边界容易误解时才写。`Blocked` 时使用固定 `Block` 段，包含 `Reason` 与 `Unblock when`。任何区块均不要求至少两项。
- 只有工作能独立交付、独立阻塞或独立审查时才拆成子任务；父任务只保留链接，不复制子任务的计划、验收或证据。

## 字段职责与重复判断

| 区块 | 唯一职责 | 默认是否存在 | 格式 | 是否决定完成 | 重复判断 |
| --- | --- | --- | --- | --- | --- |
| `Status` | 投影当前生命周期阶段及其变化时间 | 是 | 单一完整值：`**Status:** <State> (YYYY-MM-DD HH:MM)` | 否 | 不拆分额外时间字段，不复制 Target、Evidence 或审查结论 |
| `Scope` | 在必要时声明 in/out 边界 | 否，按需 | 普通列表或短句 | 间接；越界应先改 Target 或拆任务 | 与 Target 不重复：Scope 管边界，Target 管可验收结果 |
| `Target / Acceptance` | 定义完成时必须为真的任务特定结果 | 是 | 唯一 checkbox；稳定 ID | 是 | 是唯一完成标准事实源，不另设 Checklist |
| `Plan` | 描述当前剩余实现路径 | 工作尚需多步执行时存在 | 普通有序列表 | 否 | 不复制 Target，不保留已完成步骤历史 |
| `Result / Evidence` | 证明每个 Target 当前已满足 | 进入 `In Review` 前加入 | 按 Target ID 记录对象、方式、观察结果；偏差按需记录 | 是 | 不重复验收文字，只记录验证事实 |
| `Review` | 记录已实际发生的独立审查 | 实际审查后才加入 | `Decision` + `Report` 链接 | 是 | 不是初始模板占位，不得预写结论 |
| `Block` | 说明为何无法前进以及恢复条件 | 仅 `Blocked` 时存在 | `Reason` + `Unblock when` | 阻止完成 | 不把阻塞叙事混入 Result |
| 子任务链接 | 指向可独立管理的工作单元 | 仅确需拆分时存在 | 链接列表 | 由父 Target 决定 | 父任务不复制子任务内容 |

## 独立 Checklist 的判断

### 官方来源直接事实

- GitHub task lists 的官方用途包括创建任务列表、把条目标记为完成以及查看列表完成进度。[GitHub Docs: About task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists)
- Scrum Guide 将 Sprint Backlog 定义为 Developers 的计划，并将 Definition of Done 定义为 Increment 满足产品质量措施时的正式描述。[Scrum Guide 2020](https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf)

### 因此对本仓库的推论

- checkbox 若同时承载执行步骤和验收条件，会混合“计划如何做”与“结果是否成立”两种职责；本仓库只让 Target 使用 checkbox。
- 通用门禁，例如“同步任务索引”“执行适当验证”“通过 adversarial review”，由 workflow 统一强制；将其复制到每个任务的 Checklist 会制造模板噪声和漂移风险。
- 任务特定门禁，例如“旧配置仍可加载”“错误路径不写入部分数据”“移动端布局无回归”，是交付物本身必须为真的条件，应成为带 ID 的 Target。
- 独立 Checklist 默认没有剩余的独占职责，应删除。只有出现既不通用、又不属于交付结果、还必须逐项留痕的真实新职责时，才重新评估。

## 推荐最小模板：按生命周期增量生成

### 1. 创建或执行中：`Pending` / `In Progress`

初始记录只包含当前已知事实，不预建空 `Result / Evidence`、`Review` 或 `Block`，不得预写 `APPROVED`。

```md
# <任务标题>

**Status:** Pending (<YYYY-MM-DD HH:MM>)

## Scope <!-- 仅边界容易误解时加入 -->
- In: <包含范围>
- Out: <排除范围>

## Target / Acceptance
- [ ] T1: <可观察、可判真的任务结果>
- [ ] T2: <任务特定的兼容性、风险或副作用约束>

## Plan <!-- 仅有多个当前剩余步骤时加入 -->
1. <当前仍需执行的步骤>
2. <当前仍需执行的步骤>
```

开始执行时只替换完整状态值，例如：

```md
**Status:** In Progress (2026-07-22 14:30)
```

### 2. 进入 `In Review` 前：加入逐 Target Evidence

先为每个 Target 写入当前证据并勾选已证实的 Target；具备完整审查输入后，在同次修改中将状态改为 `In Review`。只有出现与 Target、Scope、Plan 或预期验证路径的实质偏差时才写 `Deviation`。

```md
**Status:** In Review (<YYYY-MM-DD HH:MM>)

## Target / Acceptance
- [x] T1: <可观察、可判真的任务结果>
- [x] T2: <任务特定的兼容性、风险或副作用约束>

## Result / Evidence
### T1
- Check: <检查对象>
- Method: <命令、测试、人工检查或权威产物>
- Observed: <实际观察结果>

### T2
- Check: <检查对象>
- Method: <命令、测试、人工检查或权威产物>
- Observed: <实际观察结果>

### Deviation <!-- 仅有实质偏差时加入；否则省略 -->
- <任务级实质偏差及其影响>
```

### 3. 实际审查后：条件性加入 `Review`

`Review` 只记录已经发生的审查，不是初始占位。实际审查后加入 Decision 和可访问的 Report 链接；未得到 `APPROVED` 时不得进入 `Completed`。

```md
## Review
- Decision: `APPROVED`
- Report: [adversarial-review report](<报告路径或链接>)
```

### 4. 仅阻塞时：加入 `Block`

```md
**Status:** Blocked (<YYYY-MM-DD HH:MM>)

## Block
- Reason: <当前阻塞原因>
- Unblock when: <可观察的解除条件>
```

Target 可以只有一项；`Scope`、`Plan`、`Deviation`、`Review`、`Block` 均按条件加入，不为满足版式而预建空段，也不设置“每段至少两项”的数量下限。

## 完成判定

### 官方来源直接事实

- Scrum Guide 规定，只有满足 Definition of Done 的工作才构成 Increment；不满足的 Product Backlog item 会返回 Product Backlog 供未来考虑。[Scrum Guide 2020](https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf)
- Linear issue status 定义 issue 从开始到完成经过的状态类型和顺序，且团队可配置状态名称、颜色、描述与顺序。[Linear Docs: Issue status](https://linear.app/docs/configuring-workflows)
- GitHub task list 会根据已勾选条目显示列表完成进度。[GitHub Docs: About task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists)

### 因此对本仓库的推论

官方资料没有定义本仓库任务记录的完成谓词；本仓库据此将“完成标准”“支持证据”“生命周期状态”分离，并固定为：

```text
Completed(task) =
  every Target is checked
  AND every Target ID has current Evidence
  AND an actually completed adversarial-review has Decision == APPROVED
  AND that Review includes its Report link
```

- “当前 Evidence”指证据对应当前 Target 文本与当前实现；Target 或相关实现发生实质变化后，旧证据不得继续支撑完成状态，必须重新验证或更新观察结果。
- Target checkbox 是验收结论的可视化；Evidence 是支撑该结论的事实；实际审查产生的 `APPROVED` 与 Report 是独立审查门禁。三者缺一不可。
- Plan 是否为空、是否曾全部执行、是否发生改写，都不参与完成谓词。已不再需要的步骤直接从 Plan 删除，不保留 checkbox 历史。
- 手工把 `Status` 改为 `Completed` 不会使任务完成。完成谓词不成立时，状态必须与实际生命周期相符。

## 状态转换不变量

### 官方来源直接事实

- Linear workflow 是团队级的有序 issue status 集合，默认顺序为 `Backlog > Todo > In Progress > Done > Canceled`，团队可以配置具体状态。[Linear Docs: Issue status](https://linear.app/docs/configuring-workflows)
- Scrum Guide 说明计划会随工作中新认知的出现而更新。[Scrum Guide 2020](https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf)

### 因此对本仓库的推论

1. 本仓库状态集合固定为 `Pending`、`In Progress`、`In Review`、`Completed`、`Blocked`，不在单任务中临时创造同义状态。
2. canonical record 只保留一个完整状态值：`**Status:** <State> (YYYY-MM-DD HH:MM)`。时间为本地时间，不拆出 `Status changed`，也不维护 `started_at`、`finished_at`、`last_touched_at` 或状态时间线。
3. 每次状态变化都在同一次修改中把 canonical record 的完整状态值原样复制到 `tasks/todo.md` 对应 index 项；状态名、括号、日期和分钟必须完全相同。两处不一致时，以 canonical task record 为内容事实源修复 index；恢复一致前，该次状态变更未完成。
4. `Pending -> In Progress` 表示已开始执行；Target 必须足以指导工作。若边界容易误解，同时补充 Scope。
5. `In Progress -> In Review` 前，全部 Target 已勾选且每个 Target ID 都有当前 Evidence；`Result / Evidence` 在此时加入，而不是在创建任务时预建。
6. 实际 adversarial review 完成后才加入 `Review` 的 Decision 与 Report 链接。`In Review -> Completed` 仅在 Decision 为 `APPROVED`、Report 已链接且完成谓词成立时允许。
7. 任意未完成状态均可转为 `Blocked`；只有此时加入 `Block`，并在同次修改中写入 `Reason` 和 `Unblock when`。
8. `Blocked` 解除后转回适用状态，并删除已失效的 `Block` 段；版本控制保存历史，record 只表达当前事实。
9. Target 发生实质变化时，相关 checkbox 必须取消勾选，相关 Evidence 视为失效；若已在 `In Review` 或 `Completed`，状态回到 `In Progress`，移除已失效的 Review，并重新验证和审查。
10. `Completed` 是完成谓词的生命周期投影，不是独立真相；任何不变量被破坏时不得继续显示 `Completed`。

## 子任务拆分规则

### 官方来源直接事实

- Linear sub-issue 用于将较大的 issue 拆成更小的工作项，并保留父子关系。[Linear Docs: Parent and sub-issues](https://linear.app/docs/parent-and-sub-issues)
- GitHub task lists 支持把 issue 和 pull request 作为列表项，并显示任务完成进度。[GitHub Docs: About task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists)

### 因此对本仓库的推论

- 仅当一项工作可以独立交付、独立阻塞或独立审查时拆为子任务。这三个条件都不满足时，它只是 Plan 中的一步。
- 父任务只保存子任务链接，以及必要时描述父级整体结果的 Target；不复制子任务内容或状态，包括 Scope、Plan、Target、Evidence 和 Status。
- 父任务是否完成仍由父任务自己的 Target、Evidence 和审查结论决定，不能仅凭所有子任务状态为 `Completed` 推导。

## 迁移策略

### 对本仓库的推论（仓库策略）

- **新任务：立即采用。** 新建 record 使用生命周期增量模板，不生成独立 Checklist、checkbox Plan、空 Result/Review/Block 或预设审查结论。
- **Active 任务：下次触及时整理。** `Pending`、`In Progress`、`In Review`、`Blocked` 任务在下一次因真实工作被修改时，将任务特定门禁并入带 ID 的 Target，把 Plan 改为当前剩余的普通有序列表，并在进入审查前按 Target ID 重组 Evidence；不单独发起全量格式迁移。
- **Completed 历史：不批量迁移。** 已完成记录保持原样。只有任务因实质变更重新进入 active 生命周期时，才采用新格式并重新建立当前证据。
- 以上是本仓库维护策略，不是 GitHub、Linear 或 Scrum 的官方要求。

## 替代方案及取舍

### 方案 A：保留独立 Checklist

- 优点：收尾动作在单个 record 内可见。
- 缺点：通用门禁复制 workflow，任务特定门禁复制 Target；两套完成条件可能漂移。
- 结论：默认删除。只有出现不可归入 workflow 或 Target 的独立职责时再评估。

### 方案 B：Plan 使用 checkbox，并以全勾选代表完成

- 官方来源直接事实：GitHub task lists 支持勾选任务并显示完成进度。[GitHub Docs: About task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists)
- 因此对本仓库的推论：实现步骤会随认知变化，步骤完成也不是本仓库定义的完成谓词。Plan 使用普通有序列表，checkbox 只属于 Target。

### 方案 C：Target 不设稳定 ID，Evidence 写成总体验证摘要

- 优点：记录更短。
- 缺点：无法明确确认每项验收是否都有当前证据；Target 增删后也难判断哪些证据失效。
- 结论：不采用。`T1`、`T2` 的少量标识成本换取明确的一一对应关系。

### 方案 D：以 Status 或子任务完成率直接判定 Completed

- 官方来源直接事实：Linear status 表示 issue 在 workflow 中的位置；GitHub task list 显示列表项完成进度。[Linear Docs: Issue status](https://linear.app/docs/configuring-workflows) [GitHub Docs: About task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists)
- 因此对本仓库的推论：生命周期位置和过程进度不足以替代本仓库的 Target、Evidence 与 Review 完成谓词。Status 只能投影该谓词，父任务也必须满足自己的完成条件。

### 方案 E：一次性迁移全部历史记录

- 优点：表面格式统一。
- 缺点：成本高、无交付价值，还可能改写已完成任务的历史语义。
- 结论：不采用；新任务采用、active 下次触及时整理、completed history 不批量迁移。

### 方案 F：创建任务时预建 Result、Review 和 Block

- 优点：所有记录看起来结构一致。
- 缺点：产生空段和虚假占位，尤其容易让预写的 `APPROVED` 被误读为真实审查结果。
- 结论：不采用。按生命周期增量加入；Review 只记录实际 Decision 与 Report。

## 限制

- 官方来源提供的是 issue、task list、workflow、计划与完成定义的通用语义；`T1/T2`、五态名称、canonical 状态格式、canonical/index 同值规则、Evidence 字段和 adversarial-review 门禁均是对本仓库的设计推论，不应宣称为官方规范。
- Markdown 本身不能强制 Evidence 与 Target 一一对应，也不能验证审查结论或 Report 链接真伪；这些不变量需要 workflow 检查或审查流程执行。通用门禁应保留在 workflow，而不是复制为任务 Checklist。
- 对极小任务，结构可以只有一个 Target 和一条对应 Evidence；格式完整性不应通过人为规定每段至少两项来制造。
