# Learn 模式

目标：生成一份源码驱动的掌握指南，建立理解顺序、代表行为的因果模型，以及严格的 recall、prediction、transfer 检验。生成报告只表示“学习材料就绪”。

默认人类会读目标语言基本语法，理解 Git、测试和常见工程术语，但不熟悉本仓库；默认 Agent 能读取 Markdown 与源码锚点，但没有现成心智模型。只有用户明确要求定制时才改变假设。

只有 scope 不唯一、Learn/通用教学路由不清，或用户要求定制却未提供背景时，才问一个聚焦问题。缺少通用前置知识会使本次 Learn 无法成立时，只询问是否先转对应教学能力。

v1 独立从源码取证，不读取或自动生成 Develop map，不生成 Mermaid，不创建课程、进度或完成状态。

## 报告顺序

### 1. Learning Orientation & Targets

先记录：

- `Scope`：仓库相对路径；project 写 `.`。
- `HEAD`：commit SHA 或 `unborn`。
- `Working tree`：`clean` 或“包含本次分析读取的未提交改动”。
- `Generated at`：带时区时间。
- `Learner assumption`：实际采用的假设。
- `Material status`：`学习材料就绪`。

用数句源码锚定的内容说明 scope 对项目的贡献、可观察输入/输出及直接边界；不展开 Develop 的完整 Summary、Module Map 或 Working Flows。

随后列出可检验 Learning Targets、必需前置和明确不覆盖内容，并给出覆盖表：

```markdown
| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
```

每项主要可观察职责必须经 target、behavior/checkpoint、check 与 Key 形成完整覆盖链；同一行为可覆盖多个 target，仅为覆盖缺口增加行为。

源码实际存在且会改变主要职责判断时，覆盖链还必须纳入对应对比分支：registry/strategy 的默认选择与显式选择、consent/authorization gate 的拒绝结果，以及新增或改变一个非默认职责的最小迁移入口与验证链。Transfer 的验证位置优先锚定仓库已有的聚焦检查配置或命令；不得用无关错误分支替代这些边界。

registry 的声明顺序或 metadata 会直接决定可见选择、help、派发或输出时，Orientation 或 Concept Ladder 必须用紧凑表格列出按源码声明顺序排列的精确稳定标识、会改变行为的 policy 字段及具体 handler 锚点；不能只写“由 registry 驱动”。

parser error、环境 admission、selection/state load、authorization 与 direct exit 先于主要行为时，Walkthrough 必须区分各 gate 的顺序、条件、输出通道/退出状态和因此不可达的后续状态或 effect，并分别锚定 parser、state loader、exit primitive 与 dispatcher。

顶层 command front door 位于子命令 parser 前时，Walkthrough 还必须精确列出 argv 首 token 的缺失默认、全部 help aliases、已接纳 command、像 target 的未知词、像 option 的未知词，以及子命令 help/未知 option；逐项给出实际分支、renderer/exit primitive、stdout/stderr、退出状态和不可达的 parser、state、effect、results。command admission、help renderer 与子命令 parser 的职责不得混写。

authorization/consent 只适用于部分 selection 路径时，Walkthrough 必须按每种 execution selector 与 interactive 路径列出：parser 字段、resolver precedence/validation/dedup、是否读写 state、是否 prompt、policy metadata 如何从最终 selected 顺序派生、authorization gate 的位置、拒绝的 channel/exit 与不可达后续。授权 option 是否只授权而不选择、无 selector 时如何处理，也要明确。

多种输入语法汇入同一 identifier、selector 或 request 集合时，Concept Ladder 或 Walkthrough 必须用紧凑表格列出每种精确语法、负责拆分/归一化的 helper、共同字段和顺序语义，并明确 canonicalization、validation、稳定去重与派发的当前先后顺序；不能把 helper 隐藏在笼统的“parser 处理”中。

带值 option 的语法接受与语义验证分层时，Walkthrough 必须区分 parser 的 token/缺值职责，与 main 或 command boundary 在 resolver、state 或 effect 前执行的 normalization/validation（如 realpath、stat、范围检查）；同时列出默认值、最终 consumer、传播路径，以及无效值的输出、退出状态和零后续 effect，不能把语义校验塞进 parser。

源码存在共享结果之后分离的机器/人类输出路径，或多个会相互作用的呈现选项时，覆盖链还必须指出统一结果的生产点、精确分流条件、各 formatter/renderer 与 color/verbosity 控制点，以及复用的退出谓词；每个控制点都给出源码锚点，不得只写笼统的“输出阶段”。

源码存在按顺序派发多个真实职责、逐项隔离失败的 dispatcher 时，覆盖链还必须连接 dispatcher、一个可重复制造失败的真实 handler/effect primitive、失败后本应参与的可观察 handler，以及一个“正常返回但不算失败”的分支；不能只用抽象 fake adapter 说明控制策略。

外部 process 是主要 effect 边界时，Orientation 或 Concept Ladder 必须用紧凑契约表连接具体 handler、availability probe 及其参数、实际 operation、dry-run guard、missing/普通非零/允许失败/抛错分类、cleanup 顺序和当前 resource limit/cancellation 状态；底层 spawn primitive 与每个调用点都要有锚点，缺少 timeout 或 retry 也应明确写 `无`，不能只写“调用外部 CLI”。

上下文会影响 effect 时，再用一张紧凑 matrix 逐项列出 effect/handler、primitive、argv、cwd、env、path/source/ownership root、guard、dry-run、默认上下文、失败结果与 cleanup。必须区分 availability probe 的继承 cwd、operation 的显式 cwd 或默认 repo root，以及不经过 process 的文件、链接或清理路径；上下文只能随单次调用传播，不得暗示修改全局 cwd/env。

主要职责含有状态 filesystem mutation 时，还须给出目标状态矩阵：absent、已正确（含不同文本但同一 canonical 目标）、mismatched、broken、普通文件与目录分别经过哪些 type/canonicalization helper、exact fs primitive 和 mutation 顺序，何时经过 dry-run/mkdir gate，返回什么 change/result。显式标出 unlink/rename/write 等 destructive window、原值是否仍可恢复、temp 的 ownership/cleanup，以及外层 dispatcher 只能投影失败还是能回滚；锚定 handler、primitive、type helper 与最终 renderer。

### 2. Concept Ladder

```markdown
| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
```

项目含义、行为关系与因果结果由源码证明；顺序是基于证据的教学决策，只给最短理由，不声称源码证明唯一顺序。只保留覆盖 targets 所需概念。

### 3. Guided Code Walkthrough

选择覆盖 targets 的最小 representative behavior 集合，从真实入口/边界走到可观察输出，包含改变理解的主要失败或对比分支。

```markdown
| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
```

事实就地附源码锚点；另用一句话说明选择该行为的教学理由。不得复制 Develop 的完整流程地图。

### 4. Human Recall, Prediction & Transfer Checks

报告必须明确下面的材料开放顺序，且把 prompts 与 Verification Key 分开：

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Key 和源码，只看 recall prompt 并独立作答。
2. **Prediction**：正文可见，Key 与源码仍隐藏；先固定预测和理由。
3. **Transfer**：正文与源码可见，Key 仍隐藏；固定入口、影响边界、验证位置与理由。
4. 三类初始答案全部固定后才打开 Key，用报告和源码逐项核对并补充解释。

Recall 只检查核心职责、关键概念关系、代表行为因果链及一个关键边界/失败，不要求背路径或符号。任何阶段提前查看 Key，本轮只算复习；重新测试必须换用等价 prompts。

Transfer 的 prompt 与 Key 还必须把最小验证写成可观察断言：成对比较基线与变化场景，隔离并核对会被修改的持久状态，并在相关时覆盖拒绝或失败分支；不适用项直接省略。

当 Transfer 新增或改变输出模式、格式或呈现 option 时，成对验证必须让基线模式和变化模式都叠加每项相关的正交呈现 option，比较解析后的语义结果与退出状态，并保留一个不启用目标模式的人类输出回归断言；不能只在变化侧检查 color、verbosity 或同类选项。

当 Transfer 新增或改变 dispatcher 的停止、继续、重试或回滚策略时，成对验证必须使用隔离环境中的真实现有参与者：由具体 handler/primitive 制造前置失败，以可观察调用或持久状态证明后续参与者是否执行，并核对结果顺序、退出状态及已完成副作用；源码若存在 successful skip、empty 或同类正常返回分支，还必须证明它不会被误当成失败。Prompt 与 Key 都要给出这些具体锚点和断言。

当 Transfer 新增或改变 timeout、retry、cancellation 或其他外部 process policy 时，Prompt 与 Key 必须分别覆盖 probe 与 operation，并让可观察 fake executable 记录每次精确参数和调用次数；按具体 handler 验证 missing、普通允许失败、resource-policy failure、dry-run、cleanup、后续 dispatcher 参与者、结果和退出状态。分类必须先基于 runtime 的 error contract，再处理普通 status；报告没有证明的 runtime 字段必须要求实现时核对，不能猜测。

当 Transfer 新增或改变 cwd、env 或其他 effect context 时，Prompt 与 Key 必须要求在正确的语义 gate、且在 resolver/state/effect 前验证输入，只把上下文传给目标 operation primitive，并保持 probe、canonical argv/root 与非 process effect 的既有来源不变。验证须隔离 HOME/PATH，以 fake executable 的精确 argv、PWD 和逐 handler 调用次数证明传播边界；invalid、missing、not-directory 等输入直接失败且 state/effect 为零，并明确已完成 effect 不回滚。

当 Transfer 改变 filesystem effect 的原子性、替换或失败安全时，Prompt 与 Key 必须给出 exact staged-publication primitive 顺序、同边界临时项的唯一命名/ownership/payload、publish 点与 finally cleanup，并区分仓库内其他 temp→rename 协议的路径、内容和失败语义。验证覆盖上述全部目标状态，分别在每个新 primitive 注入失败，比较原始 bytes/link text、正式 target、temp 残留与不得调用的 destructive primitive；再用一个真实后续参与者证明 results 保序和继续策略，同时各保留一条 JSON 与 human 投影回归。selection/consent/persistence、source/target roots、其他 handler 的 argv/cwd/env、已完成 effect 与退出契约都须显式保持。

当 Transfer 新增 discovery、preflight 或其他不得进入主要 effect 流水线的控制模式时，Prompt 与 Key 必须给出它与所有执行 selector 的冲突矩阵、位于 state load/resolver/dispatcher 前的早退点，以及从源码声明顺序和 metadata 精确派生的输出。验证须隔离 HOME/PATH 及适用的 CI/非交互环境，断言 state、prompt、adapter、外部调用日志与普通 completion 均未产生，并保留未启用新模式的主流程回归。

当 Transfer 新增或收紧顶层 command admission 时，Prompt 与 Key 必须用表格覆盖无首 token、每个 help alias、每个合法 command、target-like 与 option-like 未知 token、子命令 help、子命令未知 option 及一个合法主流程；精确断言 message、stdout/stderr、退出状态，并以隔离 HOME/PATH 下的 selection、prompt、filesystem、process、results/completion sentinels 证明错误分支零后续。策略放在 front door，不借 help renderer 或子命令 parser 改类；同时保留子命令 selector precedence、consent/persistence、effects、machine/human output 与退出契约。

当 Transfer 新增或改变 authorization/consent policy 时，Prompt 与 Key 必须逐项覆盖每种 selector 语法及 all/yes/interactive：授权 absent/present、授权单独出现、只选无需授权职责、mixed/duplicate、unknown 与 all+unknown precedence。授权对象必须从 validation/dedup 后的 selected 顺序和 registry metadata 派生；错误在 dispatcher 前直出且 execution selectors 零 state/prompt/effect/results，interactive 原 confirm、拒绝零保存、接受后原子持久化均保持。验证须锁定 help 与其他 parser error，并对 all/explicit/yes 分别做 dry-run 与至少一个 live fake/真实 effect 对照；隔离 HOME/PATH，精确断言 message、stdout/stderr、exit、全部 sentinels，并引用 parser、help、registry、resolver、validator、authorization、dispatcher 与 exit primitive 的实际锚点。

当 Transfer 新增 alias、重命名或其他 identifier canonicalization 时，Prompt 与 Key 必须覆盖所有汇流语法，要求在 validation 与稳定去重前完成规范化，并证明 registry、默认/全部/交互/state、handler 与 result 只使用 canonical id。验证还要用一个具体真实 handler 的 dry-run 与 actual 可观察调用序列证明只派发一次，同时保留 unknown identifier 的 state/effect 前直接失败。

不要给 Agent 设置“主动回忆通过”。Agent 可持续读取报告；只有报告外 sealed held-out prediction/transfer task 才能评价“报告支持/未支持”其推理，不得声称 Agent 形成记忆或已经学会。

### 5. Verification Key & Completion Standard

每项 Key 只包含必须判断、可接受替代表述、源码锚点及必要对比分支。没有 issue、测试或文档证据时，不称“常见错误模型”；改写为源码分支揭示的“易错判断”或省略。

人类只有按上述可见材料顺序完成三类初始答案、再打开 Key，并满足所有关键判断与因果解释时才算本轮完成。提前看 Key 只算复习。不写完成记录、学习画像或进度文件。

## 覆盖图与 scope 门

```text
主要可观察职责 → Learning Target → 必需概念
  → Representative behavior/checkpoint → Prediction/Transfer check → Verification Key
```

两条学习链共享必需概念、状态/数据边界或 representative behavior 时相连：

- project/目录 scope 有多个连通分量：零写入；列出每个分量的职责与锚点，请用户选择可解析到单一目录或文件的更小组件。
- file scope 有多个分量：仍生成一份报告，按连通分量组织并覆盖该文件全部主要职责。
- 不以篇幅、条目数或主观“过大”判断 scope。

## 失败门

以下情况零写入：核心事实、因果关系或 Key 无法由源码证明；无法覆盖三类检查；核心行为必须运行才能确认但未获授权；project/目录覆盖图不连通。无直接测试不阻塞静态可证内容，但不得声称已被测试覆盖；可选事实无证据时省略。

## 排除项

不生成 Develop 的完整结构、通用语言/框架课程、MISSION/RESOURCES/HTML/assets、完整 API/类型/文件/测试 inventory、审计/风险/建议/change plan、练习分支、sandbox、学习者配置或 Mermaid。

## 交付自检

- 一 scope、一 guide、正确路径、freshness、学习者假设与“学习材料就绪”。
- 主要职责到 Key 的覆盖链完整；事实与教学理由清楚分离。
- Walkthrough 为最小充分行为集合；Recall/Prediction/Transfer 的材料顺序明确且 Key 分离。
- Agent 只使用 held-out 语义；无 Develop 复制、课程状态、秘密、空章节或占位符。
