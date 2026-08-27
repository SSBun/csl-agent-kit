# Analyze Project v2：Learn 模式产品需求文档

## 文档状态

- 状态：Learn 独立产品已退役；仅保留为历史设计依据
- 日期：2026-07-19
- 退役日期：2026-08-10
- 当前合同：`skills/analyze-project/SKILL.md` 与 `skills/analyze-project/references/report-contract.md`

## 1. 问题

结构清单、模块地图或逐文件导览只能帮助读者“找到代码”，不能证明其已经理解并会运用项目知识。`learn` 必须回答：

1. 应按什么认知顺序理解这个项目或组件？
2. 哪条代表行为能建立正确的因果模型？
3. 如何通过回忆、预测和迁移检验理解，而不是复述报告？

## 2. 产品目标

`learn` 针对一个明确 scope 生成一份源码驱动的掌握指南。

人类完成报告内检验后，应能：

- 不查看报告或源码，解释 scope 的关键职责与概念关系。
- 回到源码追踪代表行为、状态变化和主要失败分支。
- 预测输入、配置或分支变化的结果，并用源码核对。
- 面对相邻改动，定位入口、影响边界和验证位置并解释原因。

Agent 的目标不同：读取报告后，无需重新全仓扫描，即可用源码锚点回答生成报告时未见的相邻预测或迁移问题。不得宣称 Agent 形成记忆、完成主动回忆或“已经学会”。

报告生成只表示 `学习材料就绪`；不自动证明人类或 Agent 完成学习。

## 3. 模式边界与默认学习者

| 能力 | 核心问题 | 产物 |
| --- | --- | --- |
| `repo-map` | 现在应该去哪里看？ | 即时轻量定向 |
| `develop` | 这个 scope 客观上如何组成和工作？ | 长期 working map |
| `learn` | 应按什么顺序理解，如何检验和迁移？ | 单份掌握指南 |
| `teach` | 如何长期学习通用主题或技能？ | 多课次持久课程 |

- 通用语法、框架原理和长期技能学习路由到 `teach`。
- 框架机制在当前 scope 中的具体职责、状态和行为属于 `learn`，但只解释理解源码所需部分。
- 缺少通用前置知识导致 `learn` 无法成立时，只询问是否先转 `teach`。

不增加 level flag、学习者画像或配置文件。默认人类能阅读目标语言的基本语法，理解 Git、测试和常见工程术语，但不熟悉当前仓库。默认 Agent 能读取 Markdown 与源码锚点，但没有现成仓库心智模型。

只有 scope 不唯一、`learn`/`teach` 路由不清，或用户要求定制却未说明背景时，才提出一个聚焦问题。

## 4. 分析 Scope

计划调用方式：

```text
/analyze-project [target_path] learn
```

- `target_path` 为 Git 根时分析整个项目，为根内目录或文件时分析对应组件。
- 读取前解析 Git 根与 target 的 canonical path；target 必须等于 Git 根或位于其内。
- 仓库外 symlink、路径逃逸和不可安全表示的路径直接拒绝。
- 自然语言组件名存在多个候选时询问用户。
- target 包含多个独立 Git 根时列出候选；用户选择前零写入。
- 一次调用只分析一个 scope。
- 组件 scope 只覆盖内部行为、直接上下游及理解该组件所需的项目概念。

## 5. 输出文件

每次调用只生成一份报告：

| Scope | 输出路径 |
| --- | --- |
| 整个项目 | `docs/analysis/learning/project-guide.md` |
| 目录组件 | `docs/analysis/learning/dir/<repo-relative-dir>/guide.md` |
| 文件组件 | `docs/analysis/learning/file/<repo-relative-file>.md` |

`learning/` 与 Develop 输出隔离；`dir/` 与 `file/` 防止同名目录和文件冲突；文件 scope 保留完整文件名和扩展名，不使用 hash fallback。

写入前验证规范化路径仍位于 canonical `docs/analysis/learning/`，且现有父目录 symlink 不会使其逃逸。对最终目标执行 `lstat`：symlink、目录、设备或其他非普通文件直接拒绝；不存在时可创建，普通文件已存在时只询问是否**完整替换**，不提供增量更新。

完整替换必须重新分析整个 scope 并重建全部内容，经验证后使用同目录临时文件原子替换，不跟随目标链接；当前文件系统无法保证安全替换时零写入。除目标报告、同目录临时文件和必要父目录外，不修改源码或其他项目文件。

## 6. Freshness 与材料状态

报告开头记录：

- scope 的仓库相对路径。
- `HEAD` commit SHA；首次提交前写 `HEAD: unborn`。
- 工作树为 clean，或本次明确包含未提交改动。
- 带时区生成时间。
- 实际采用的学习者假设。
- 材料状态：`学习材料就绪`。

不得记录“人类已通过”“Agent 已掌握”或类似完成状态。

freshness 在创建或替换报告前采样，描述本次分析读取的输入状态，而不是报告写入后的工作树。

## 7. 报告内容契约

### 7.1 Learning Orientation & Target

先用数句源码锚定的内容说明：

- scope 对项目的贡献。
- 可观察输入和输出。
- 直接上游、下游或外部边界。

这只是最低学习定向，不展开 Develop 的完整 Scope Summary、Module Map 或 Working Flows。

随后列出可检验 Learning Targets、必需前置和明确不覆盖的内容，并给出紧凑覆盖表：

```markdown
| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
```

- 每个 target 至少映射一个行为检查点和一项检查。
- scope 的每项主要可观察职责均由 target、行为和检查覆盖。
- 同一行为可覆盖多个 target；只有覆盖缺口才增加行为，不固定数量。
- 是否要求缩小 scope 只按第 8 节的覆盖图连通性判断，不使用篇幅、条目数或“感觉过大”等主观阈值。

### 7.2 Concept Ladder

```markdown
| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
```

- 项目含义、行为关系和因果结果必须由源码支持。
- 学习顺序属于基于已证事实的教学决策，只给最短理由；不得声称源码证明唯一顺序。
- 只保留覆盖 Learning Targets 所需的概念，不生成完整 glossary、类型清单或目录导览。

### 7.3 Guided Code Walkthrough

选择覆盖目标的最小 representative behavior 集合：

```markdown
| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
```

- 从真实入口或边界开始，到可观察输出结束。
- 展示控制、数据或状态变化，并包含会改变理解的主要失败或对比分支。
- 项目事实就地附源码锚点。
- 简短说明选择该行为的教学理由，不把选择写成源码事实。
- 不复制 Develop 的完整 Module Map 或 Working Flows；仅为覆盖缺口增加行为。

### 7.4 Human Recall、Prediction & Transfer Checks

人类必须按以下顺序完成三类检查；全部初始答案完成前，整个 Verification Key 保持关闭：

1. **Recall**：只读 recall prompt；隐藏 Orientation、Concept Ladder、Walkthrough、Key 和源码，独立写出答案。
2. **Prediction**：正文可见，Key 与源码仍隐藏；记录预测及理由，不立即核对。
3. **Transfer**：正文与源码可见，Key 仍隐藏；提交入口、影响边界、验证位置及理由。
4. 三类初始答案均固定后，才打开 Key，并使用报告与源码逐项核对、补充解释。

Recall 只要求解释核心职责、关键概念关系、代表行为的主要因果链及一个关键边界或失败条件；不要求背诵路径、符号名或全部流程细节。任何阶段提前查看 Key，整轮只算复习，不算通过。

报告内不设置“Agent 主动回忆通过”检查。Agent 可以持续读取报告；不因复述正文而算掌握，只通过报告外的 held-out prediction/transfer task 衡量。

### 7.5 Verification Key & Completion Standard

Key 与练习分开放置，每项只包含：

- 必须出现的判断。
- 可接受的替代表述。
- 源码锚点。
- 必要的对比分支。

只有 issue、测试或文档能证明某种误解实际存在时，才能称为“常见错误模型”；否则使用源码分支揭示的“易错判断”或省略。

人类只有同时满足以下条件才算完成：

- 隐藏正文、Key 和源码后先完成 Recall。
- 在 Key 与源码隐藏时完成 Prediction 初始答案。
- 在 Key 隐藏时使用正文与源码完成 Transfer 初始答案。
- 三类初始答案均固定后才打开 Key，并逐项满足关键判断与因果解释。
- 所有关键检查通过。

若提前查看 Key 或违反任一阶段的可见材料顺序，本轮只算复习；重新隐藏材料并换用等价的三类 prompts 后才能再测。不创建完成记录、进度状态、学习画像或其他文件。

Agent 只能声明“报告支持”或“未支持”其完成 held-out task；报告内练习和 Key 不能替代外部评测。

## 8. 覆盖规则

```text
主要可观察职责
  → Learning Target
  → 必需概念
  → Representative behavior/checkpoint
  → Human prediction/transfer check
  → Verification Key
```

Human recall 覆盖整体心智模型；Agent 能力由外部 held-out task 检验。

最低要求：

- 每项主要职责进入覆盖链。
- 每个 target 有行为证据和检查。
- 每项检查有可核验答案。
- 不用额外背景段落替代覆盖。
- 为每项主要职责建立学习链；两条链若共享必需概念、状态/数据边界或 representative behavior，则在覆盖图中相连。
- 连通性是唯一 scope 过大判据，且只适用于 project 和目录 scope。覆盖图存在多个连通分量时，列出各分量的职责与代码锚点，要求用户选择能解析到单一目录或文件的更小组件；选择前零写入。
- 文件是最小支持 scope。文件覆盖图不连通时不再缩小或阻塞；在同一报告内按连通分量分组，但仍覆盖该文件的全部主要职责。

## 9. 分析流程

1. 解析唯一 Git 根、canonical target 和 scope，并处理路径、歧义与已有报告保护。
2. 记录 freshness，采用默认或用户明确提供的学习者假设。
3. 读取适用规则、README、manifest、入口、直接上下游和测试。
4. 确认 scope 的贡献、输入、输出和直接边界。
5. 从主要职责推导 Learning Targets，确认必需概念及行为关系。
6. 选择最小 representative behavior 集合，追踪入口、状态、输出、主要失败和对比分支。
7. 设计 human recall、prediction 和 transfer checks，再编写 Verification Key。
8. 构建覆盖链，分别核验源码事实和教学理由。
9. 检查秘密、scope 泄漏、重复、空章节、覆盖缺口及邻近能力复制。
10. project/目录覆盖图不连通时请求缩小 scope；文件覆盖图不连通时按分量组织并继续；全部通过后写入唯一报告。

## 10. 与 Develop 解耦

Learn 不要求或自动运行 Develop。v1 不读取现有 Develop map，即使其 scope 与 `HEAD` 相同；所有事实、概念顺序、走读与检查均独立从源码建立。两种报告可以共存，但互不作为输入或事实证据。

## 11. 证据与教学决策

必须由源码证明：

- scope 的贡献、输入、输出和边界。
- 概念的项目内含义。
- 调用、数据、状态和失败关系。
- 走读中的因果结果。
- 检验题和 Key 中的项目答案。

属于教学决策：概念顺序、representative behavior、对比分支和题型选择。教学决策必须基于已证事实并给最短理由，不得冒充源码结论。

- 使用 `path#symbol`；配置使用 `path#key`；没有稳定符号或键时才使用行号。
- README 和设计文档只能补充意图，不能单独证明运行行为。
- CodeGraph 只作导航。
- 一个事实只定义一次；其他位置用 target、概念名或 checkpoint 引用。
- 顺序行为使用短步骤，不写长篇背景；不生成空章节、占位符或固定数量条目。
- 默认使用用户语言；代码、命令、符号和既有领域词保持原文。
- 可选事实无证据时省略；核心事实或 Key 无法确认时零写入。

## 12. 安全、运行与图表边界

- 报告不得包含疑似秘密的值、片段、hash、位置或安全章节。
- 最终回复是唯一例外，只允许疑似类别、仓库相对路径和“未记录秘密值”声明；不得输出值、片段或 hash。
- 无直接测试不阻塞源码驱动学习，但不得声称该行为已被测试覆盖。
- 只引用仓库已有的权威命令，不编造测试、构建或运行命令。
- 核心行为只能运行确认、未获授权且静态证据不足时零写入。
- 不默认安装依赖、运行测试、构建或项目进程。
- v1 不生成 Mermaid；使用表格、编号步骤或纯文本箭头。

## 13. 失败契约与最终回复

| 条件 | 行为 |
| --- | --- |
| Git 根、scope 或组件名不唯一 | 零写入，询问选择 |
| canonical path 逃逸或输出不安全 | 零写入，报告错误 |
| 目标是 symlink 或非普通文件 | 零写入，报告错误 |
| 目标普通文件已存在 | 零写入，询问是否完整原子替换 |
| 文件系统无法保证安全原子替换 | 零写入，报告错误 |
| 核心事实、关系或 Key 无法证实 | 零写入，列出阻塞问题 |
| project 或目录覆盖图存在多个连通分量 | 零写入，列出分量并请求缩小 scope |
| 文件覆盖图存在多个连通分量 | 正常生成一份报告，按分量组织全部学习链 |
| 无测试但静态行为可证 | 正常生成源码驱动检验 |
| 核心行为必须运行确认且未获授权 | 零写入 |
| 可选事实无证据 | 省略 |
| 无法覆盖 recall、prediction 或 transfer | 零写入 |
| 发现疑似秘密 | 不写秘密；最终只给允许的脱敏警告 |

最终回复只包含报告路径、阻止正确学习的问题和允许的脱敏警告；不复述 orientation、概念、走读或答案。

## 14. 非目标

Learn 不生成：

- Develop 的完整 Scope Summary、Glossary、Module Map 或 Working Flows 副本。
- MISSION、RESOURCES、HTML lessons、assets、学习记录或长期进度。
- 通用语言或框架课程。
- 完整 API、类型、文件或测试 inventory。
- 架构审计、风险、改进建议或 change plan。
- 源码修改、练习分支或 sandbox。
- 学习者画像、level 配置或完成状态文件。
- Mermaid 图。

## 15. 验收标准

- 一次调用只分析一个 project/component scope，并只生成一份正确路径的 learning guide。
- project、目录和文件 scope 具有稳定无碰撞路径，且路径逃逸时零写入。
- 最终目标 symlink、非普通文件和无法安全原子替换时零写入；现有普通报告只允许完整重分析后替换。
- 报告记录 scope、revision、工作树状态、生成时间、学习者假设和材料状态。
- 报告默认使用用户语言，代码、命令、符号和既有领域词保持原文。
- Orientation 只提供最低定向，不复制 Develop 的完整结构。
- 每项主要职责和 Learning Target 都有完整覆盖链。
- Concept Ladder 明确区分源码事实与教学顺序。
- Walkthrough 使用覆盖目标所需的最小 representative behavior 集合。
- Human recall、Prediction 与 Transfer 分别规定正文、源码和 Key 的开放顺序；提前查看答案材料不算通过。
- Agent 文案不声称主动回忆、记忆形成或已经学会。
- 项目事实、练习与 Key 均由源码支持；无法支持的核心内容导致零写入。
- 报告不包含秘密信息、空章节、占位符、重复事实、Develop 副本或 teach 课程结构。
- project 或目录覆盖图存在多个连通分量时先请求缩小；文件 scope 保留一份报告并按分量组织，不自动拆文件。

## 16. Learn 输出 Eval

只建立一个可审计重放的 component-scope trial 协议，不建设通用教学评测框架。

### 16.1 固定生成输入

- 仓库快照：`05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Scope：`bin/csl-agent-kit.js`。
- 请求：“使用 learn 模式帮助我学会这个 CLI 安装组件；不要修改源代码。”
- 使用默认学习者假设。
- with-skill 与 baseline 使用相同模型、版本、参数、快照和请求；唯一变量为是否加载新版 `analyze-project`。
- 两个 arm 分别运行在从同一提交创建的独立、干净工作区；源码只读，只有各自预期报告路径、必要父目录和同目录临时文件可写。
- 预期报告在两个工作区中均不存在；freshness 在任何输出写入前采样，因此两臂都记录同一 clean 输入状态。
- 完成后由 harness 将候选报告复制到工作区外的评测 artifact store；没有报告时记录标准 `NO_OUTPUT` 标记。两臂不共享文件或 Git 状态。

### 16.2 第一层：报告 Verifier

独立 Verifier 可读取冻结源码，核验：

1. 全部项目事实、答案及源码锚点。
2. Orientation、Concept Ladder、Walkthrough、checks 和 Key。
3. 主要职责到 Key 的覆盖链。
4. 源码事实与教学理由的分离。
5. Human recall 的隐藏要求与 Agent 的非回忆语义。
6. 无证据误解、秘密信息和邻近能力复制。

任一项目事实或 Key 不受源码支持时，该候选 Verifier 失败。

| 能力 | 可见覆盖要求 | 黄金证据 |
| --- | --- | --- |
| 概念关系 | 区分 install target 与 install result | `#targets`、`#installTargets` |
| 因果追踪 | 参数到选择、执行、输出和退出 | `#main`、`#parseInstallArgs`、`#resolveInstallTargets`、`#installTargets` |
| 行为预测 | `--yes` 只选择 `spec.default` 为真的 target | `#resolveInstallTargets` |
| 失败理解 | 未知 target 与交互外部 target 未确认 | `#validateTargets`、`#resolveInstallTargets` |
| 基础迁移 | 新增默认关闭 target 的入口与 CLI 检查 | `#targets`、对应 installer、`package.json#scripts.check:cli` |

with-skill 必须通过五项，但本层不能单独证明 Agent 的迁移能力。

### 16.3 第二层：Agent Held-out Transfer

本 PRD 只公开评测协议与能力维度，不公开实际题目、答案或代码触点。

1. 完整 skill artifact 先冻结并记录 fingerprint。
2. 未参与 skill 编辑的独立评测方随后基于冻结源码创建一个相邻变更 prompt 与五项二元 rubric；场景不得重复第 16.2 节的可见检查。
3. rubric 必须分别衡量：识别当前约束、定位至少两个协作触点、保持既有行为或不变量、提出最小验证、用报告锚点解释因果。
4. prompt 与 rubric 封存在仓库、skill 资源、生成工作区和生成器均不可访问的位置；候选生成前只记录 fixture ID、SHA-256 与冻结时间。
5. 候选生成后，Verifier 先确认其练习与 Key 未包含 sealed fixture 的具体场景或答案；发生偶然重合时当前 trial 作废，换用新的 sealed fixture 并重新生成两份候选。
6. with-skill 通过 Verifier 后进入 downstream；baseline 仅在通过 Verifier 时进入，`NO_OUTPUT` 或失败时按第 16.4 节固定为 `0/5`。
7. 进入 downstream 的候选匿名化后，配置相同的全新 Agent 各自只读取一个候选与 sealed prompt，不得扫描仓库或读取其他资源。
8. Agent 回答固定后才解封 rubric，由独立 scorer 逐项记 `0/1`；部分正确记 `0`。

### 16.4 分支、匿名与通过条件

1. artifact collector 在 Verifier 和 scorer 看到候选前随机标记为 `A`、`B`；arm 身份映射在全部评分完成前保持隐藏。
2. with-skill 为 `NO_OUTPUT` 或 Verifier 失败时，整个 eval 失败，不进入第二层。
3. baseline 为 `NO_OUTPUT` 时，其 held-out 分数定义为 `0/5`，不调用 downstream Agent。
4. baseline 有输出但 Verifier 失败时，其 held-out 分数定义为 `0/5`，失败报告不进入第二层。
5. baseline 通过 Verifier 时，按第 16.3 节取得 `0–5` 分。
6. with-skill 必须通过 Verifier、held-out 得到 `5/5`，且至少领先 baseline `1` 分；baseline 也为 `5/5` 时 eval 不通过。
7. 该结果只证明报告支持 held-out 推理，不证明 Agent 形成记忆。
8. 保存生成配置、隔离工作区身份、匿名候选或 `NO_OUTPUT`、Verifier 记录、fixture ID/hash/冻结时间、解封后的 prompt 与 rubric、Agent 原始回答、匿名映射和评分。

### 16.5 审计重放与新 Trial

- **审计重放**不调用模型或重新生成候选：使用已保存的候选、Verifier 记录、解封后的 prompt/rubric、Agent 原始回答、匿名映射和 scorer 规则，必须复现原分数与 verdict。
- **新 trial**指任何重新生成候选或 downstream Agent 回答的运行；必须分配新 trial ID，并在模型调用前创建新的 sealed fixture。
- 尚未发生任何模型调用且 fixture 从未解封时，纯基础设施失败可以在同一 trial 内重试。

## 17. 完整实现质量门

- `learn`、`develop`、`repo-map`、`teach` 与单次工程任务的 trigger eval 通过。
- 通用框架学习路由 `teach`，当前 scope 的框架行为路由 `learn`。
- project、dir、file、多 Git 根、已有报告、最终目标 symlink/非普通文件、路径逃逸和原子替换失败行为均有 fixture。
- project/dir scope 过大 fixture 含至少两条无共享概念、状态/数据边界或行为的学习链；对应连通 fixture 不得触发缩小；file scope 的断开图必须仍生成一份分组报告。
- clean、dirty、unborn freshness metadata 均有验证。
- 每项主要职责与 target 的覆盖链有自动或人工核验记录。
- 源码事实和 Key 均有证据，教学理由不冒充项目事实。
- Human recall 指令和 Agent held-out 语义通过文本契约检查。
- Prediction 与 Transfer 的 Key/源码开放顺序通过文本契约检查。
- 无测试 fixture 不编造命令；必须运行才能确认的行为在未授权时零写入。
- 合成秘密 fixture 证明报告不含秘密值、片段、hash、位置或安全章节，最终警告仅含允许字段。
- 第 16 节的两层输出 eval 通过。
- eval harness 证明两臂隔离、只开放目标写入、baseline 三种分支确定、匿名映射延迟揭示，且 sealed fixture 在 skill 冻结前不存在、生成器始终不可访问。
- 保存 artifact 的审计重放必须复现原 verdict；任何新模型生成必须使用新 trial ID 与新 sealed fixture。
- OpenAI skill 结构校验、local quality gate resource boundary 和最终独立审查通过。
- 删除旧 prompts、templates 和 workflow 后没有失效引用或孤立资源。

## 18. 实施顺序

1. 批准本 PRD。
2. Develop 与 Learn PRD 均批准后，一次性重写完整双模式 skill。
3. 删除旧多报告资源，只保留两个模式共用的最小 reference 与必要 eval。
4. 运行完整实现质量门和最终独立审查。
