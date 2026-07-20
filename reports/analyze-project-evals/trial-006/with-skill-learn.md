# `bin/csl-agent-kit.js` 源码学习指南

## Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-19T23:36:38+0800`
- **Learner assumption**：读者能阅读基础 CommonJS JavaScript，理解 CLI 参数、进程退出码、同步文件系统调用和测试断言，但尚不了解本仓库的安装模型。
- **Material status**：`学习材料就绪`

该文件是 `package.json#bin` 暴露的 npm CLI：它把 `install` 参数或交互答案解析为 registry 中的有序 targets，通过每个 target 的 handler 对 Cursor 用户目录、Codex CLI 或 Pi CLI 产生安装 effect，再从统一 result 列表输出 JSON 或终端摘要并决定退出状态（`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installTargets`）。边界之外是被分发内容本身与各客户端内部安装语义；例如 Codex plugin 暴露根 `skills/`，但该声明属于 `.codex-plugin/plugin.json#skills`，不是本文件构造的内容。

### Learning Targets

完成本指南后，读者应能：

1. 从任意 install invocation 推导规范化 options、最终 target 顺序，以及交互 consent/selection persistence 是否参与。
2. 解释 registry handler 如何产生 changes，dispatcher 如何逐项隔离异常，并区分 failed result 与正常返回的 `skip`。
3. 追踪 Codex plugin 的有序迁移命令、失败边界和旧 skill link 清理条件。
4. 从同一 results 推导 JSON/人类分流、formatter、color/verbose 控制和复用的整体成功谓词。

必需前置：JavaScript 控制流与数组方法、`spawnSync` 返回值、symlink/realpath 基础、JSON 与 ANSI escape 的区别。本文不覆盖 `prompts` 库通用教程、npm/Codex/Cursor/Pi 内部实现、被安装 skills/hooks 内容、架构审计或修改计划。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1：推导目标选择与交互状态 | request grammar、registry default、selection precedence、external consent、atomic preference | B1：`install --yes --dry-run --json --color`；B2：无选择参数的交互确认/拒绝 | P1、P2、T1；Key K1、K2、K5 |
| LT2：解释 effect 与逐项隔离 | target strategy、change record、ordered dispatcher、exception-to-result、successful skip | B1 的 Codex dry-run；B3：Cursor handler 失败后 Codex handler 是否仍参与；B4：Codex 缺失后 Pi 是否仍参与 | P3、T3；Key K3、K7 |
| LT3：追踪 Codex 安装迁移 | allowed failure、required command、cleanup ownership、dry-run boundary | B1：完整 command plan；B3：required add failure/handler failure的边界 | P3、T1、T3；Key K3、K5、K7 |
| LT4：推导结果呈现与退出 | unified results、exact format branch、JSON serializer、terminal renderer、color/verbosity、shared success predicate | B1：JSON 与 color 正交；B3：混合成功/失败结果；终端 verbose 对照 | P4、T2、T3；Key K4、K6、K7 |

## Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | Request grammar：首 token 选择 command，其余 token 归一为固定 shape 的 install options | 所有后续路径只消费 `parseInstallArgs` 的返回值 | 先固定输入模型，避免把格式或 effect option 混成 target | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#splitTargets` |
| 2 | Target registry：每项同时声明用户语义、默认性、是否 external 及 handler strategy | 选择、prompt 与派发都读取同一 `targets` | registry 是默认选择、授权和执行之间的共同事实源 | `bin/csl-agent-kit.js#targets` |
| 3 | Selection precedence：`all` → 显式列表 → `yes` → interactive；只有最后一路读取/写入偏好 | 每个命中分支立即 return | 理解优先级后才能准确预测 selection state 是否改变 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#saveInstallSelection` |
| 4 | Consent gate：只有交互选择包含 external target 时才出现，拒绝会在派发前 exit 2 | prompt 的动态 `type` 与确认后的显式检查 | 将“选择 target”与“授权外部命令”分开 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#targets` |
| 5 | Effect primitives：handler 把安装意图降为 symlink、command、remove 或 skip change；dry-run 在 primitive 处截断副作用 | `ensureSymlink`、`runCommands`、`removeLegacyCodexSkillLinks` 各自检查 `dryRun` | 先认识 effect 返回值，才能读懂统一 results | `bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 6 | Ordered failure isolation：dispatcher 为每个真实 target 单独 `try/catch`，异常变成 `{ok:false,error}` 后继续循环 | `installTargets` 唯一生产统一 result list | 这是后续输出、退出和 fail-fast transfer 的因果中心 | `bin/csl-agent-kit.js#installTargets` |
| 7 | Successful skip：Codex/Pi CLI 缺失由 handler 正常返回 `skip` change，所以 dispatcher 仍赋 `ok:true` | handler 没有 throw，dispatcher 走成功 push | 防止把“没有执行外部命令”误判为 install failure | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#installTargets` |
| 8 | Codex two-phase effect：先完成有序 CLI migration，再清理本仓库拥有的旧 links；required add 失败会阻止 cleanup | cleanup 的调用位于 `runCommands` 返回之后 | 解释为什么某些 allow-failure 不阻断，而 plugin add failure 会保留旧链接 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 9 | Exact output split：统一 results 之后，`options.json` 精确选择 inline `JSON.stringify`；否则进入 `printResults` | `main` 中单一 `if (options.json)` | 先找分流点，再分别定位 formatter，避免把 color/verbose 误投到 JSON | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printResults` |
| 10 | Orthogonal presentation controls：`createColors(colorMode)` 只服务人类 renderer，`verbose` 只控制 `printChangeDetails`；退出复用 `results.every(item.ok)` | JSON branch 不调用两者；退出谓词与 JSON 顶层 `ok` 相同 | 为输出模式 transfer 建立语义等价与呈现隔离基线 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printResults`、`bin/csl-agent-kit.js#createColors`、`bin/csl-agent-kit.js#printChangeDetails` |

## Guided Code Walkthrough

### B1：默认 target 的 dry-run JSON

选择理由：一个无副作用 invocation 同时经过参数解析、默认 strategy、Codex command planning、统一 results、机器输出和退出谓词，是覆盖 LT1–LT4 的最短主干。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| B1.1 | `--yes` 是否等价于所有 targets？ | `targets` 与 `resolveInstallTargets` | 只过滤 `default: true`，当前仅 `codex-plugin`；`--all` 才返回 registry 全集 | selection 为 `["codex-plugin"]`，不会读取偏好文件（`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`） |
| B1.2 | dry-run 是否仍先要求本机存在 Codex？ | `installCodexPlugin` | `!options.dryRun && !hasCommand("codex")` 才探测 | dry-run 进入完整命令计划而不是 `skip`（`bin/csl-agent-kit.js#installCodexPlugin`） |
| B1.3 | 八条命令中任意失败是否都让 target 失败？ | `installCodexPlugin`、`runCommands` | 六个 remove 允许失败；marketplace add 与 plugin add 不允许；dry-run 不 spawn | 产生八个 ordered command changes，均带 `dryRun:true`（`bin/csl-agent-kit.js#runCommands`；`tests/cli-install-output.test.js:59`） |
| B1.4 | `--json --color` 会否包含 ANSI？ | `main`、`createColors` | JSON 分支直接 `JSON.stringify`，不调用 human renderer/colors | 输出可被 JSON.parse，顶层与 target 均成功，退出 0，无 ANSI（`bin/csl-agent-kit.js#main`；`tests/cli-install-output.test.js:222`） |

### B2：交互选择与 external consent

选择理由：非交互主干看不到 selection memory 与授权 gate；该行为补足 LT1 的状态与拒绝边界。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| B2.1 | 无 flags 是否直接使用默认 Codex target？ | `resolveInstallTargets` | 无命中分支时先要求 TTY/非 CI，再加载 `prompts` 和 saved selection | 默认值只是 checklist 预选，不是自动授权执行（`bin/csl-agent-kit.js#resolveInstallTargets`） |
| B2.2 | 保存文件中的未知/过期 target 是否进入 choices？ | `loadInstallSelection`、`buildInstallChoices` | 读取结果按当前 registry 过滤；过滤后为空则返回 `null` 并回退默认 | 过期 selection 不扩张 registry，仍只预选当前默认（`tests/cli-install-output.test.js:250`、`tests/cli-install-output.test.js:288`、`tests/cli-install-output.test.js:306`） |
| B2.3 | 选择 Codex/Pi 后拒绝确认会否仍保存选择？ | prompt 定义及确认检查 | external confirm 在 `saveInstallSelection` 之前；拒绝调用 `die` | exit 2，既不派发也不保存本次选择（`bin/csl-agent-kit.js#resolveInstallTargets`） |
| B2.4 | 保存失败会否取消已确认安装？ | `saveInstallSelection` 外层 `try/catch` | 写入内部用临时文件 + rename；外层只打印 warning | 偏好持久化失败不改变当前 `selected` 返回值（`bin/csl-agent-kit.js#saveInstallSelection`、`bin/csl-agent-kit.js#resolveInstallTargets`） |

### B3：真实 handler 失败后的后续参与者

选择理由：抽象 fake adapter 不能证明此文件的控制策略；Cursor 的真实 `ensureSymlink` 可稳定制造前置失败，Codex CLI 调用可作为后续真实 handler 的可观察证据。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| B3.1 | 如何不改源码地稳定让首个 target 失败？ | `installCursor`、`ensureSymlink` | 在隔离 HOME 的 `~/.cursor/plugins/local/csl` 预置普通文件；非 dry-run 时函数明确抛错 | `cursor` handler 抛出 “already exists and is not a symlink”，预置文件保持原样（`bin/csl-agent-kit.js#ensureSymlink`） |
| B3.2 | Cursor 失败后 Codex 是否被调用？ | `installTargets` | catch 位于 `for` 循环内部，失败只 push 一项 result | 选择 `cursor,codex-plugin` 时仍进入 Codex handler；记录参数的隔离 fake Codex 可观察到后续八条命令（`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCodexPlugin`） |
| B3.3 | 混合结果如何排序和退出？ | `installTargets`、`main` | 每次循环只 push 当前 target；整体谓词要求所有项 `ok` | results 保持 cursor 失败、Codex 成功的选择顺序；已完成 Codex effect 保留，JSON `ok:false`，退出 1（`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#main`） |

### B4：正常 skip 不停止 dispatcher

选择理由：它是 B3 的必要对照，防止把“没有外部命令执行”错误等同于 exception failure。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| B4.1 | Codex CLI 缺失时 `codex-plugin` 是否失败？ | `installCodexPlugin` | 非 dry-run 探测失败后正常 `return [{action:"skip",...}]` | dispatcher 生成 `ok:true` 的 Codex result（`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installTargets`） |
| B4.2 | 后续 Pi 是否参与？ | `installTargets`、`installPi` | 没有异常，且 dispatcher 无论成功失败都会推进循环 | 选择 `codex-plugin,pi`，PATH 中仅提供记录调用的 fake Pi 时，Pi 被调用；结果保持两项顺序（`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installPi`） |
| B4.3 | 整体退出为何仍为 0？ | `main` | 成功谓词检查 result 的 `ok`，不检查 change action | `skip` 与 Pi 成功都为 `ok:true`，顶层 `ok:true` 且退出 0（`bin/csl-agent-kit.js#main`） |

## Human Recall, Prediction & Transfer Checks

### 材料开放顺序

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Verification Key 和源码，只看 Recall prompts 并独立作答。
2. **Prediction**：正文可见，Verification Key 与源码仍隐藏；先固定每项预测及理由。
3. **Transfer**：正文与源码可见，Verification Key 仍隐藏；先固定入口、影响边界、验证位置与理由。
4. Recall、Prediction、Transfer 的初始答案全部固定后，才打开 Verification Key，用报告和源码逐项核对并补充解释。

任何阶段提前查看 Key，本轮只算复习；重新测试必须换用等价 prompts。对 Agent，不设置“主动回忆通过”：Agent 可持续读取报告，只有报告外 sealed held-out prediction/transfer task 才能评价本报告是否支持其推理，不能据此声称 Agent 已形成记忆或已经学会。

### Recall prompts

- **R1**：这个文件从 install 输入到最终输出承担哪四段主要职责？哪些内容明确不归它负责？
- **R2**：`--all`、显式 target、`--yes` 与交互选择的优先级是什么？哪一路会读写保存的选择？
- **R3**：逐项 dispatcher 如何处理 handler 异常？为什么 `skip` 不等于失败？
- **R4**：统一 results 在哪里产生，JSON 与人类输出的精确分流条件是什么；各自 formatter、color、verbosity 与退出谓词在哪里？

### Prediction prompts

- **P1**：selection file 保存 `cursor,pi` 时执行 `install --yes --dry-run --json`。预测选择目标、selection file 是否改写、results 顺序与退出状态，并解释原因。
- **P2**：在 TTY 中只勾选 `pi` 后拒绝 external confirmation。预测是否保存选择、是否调用 Pi、stdout/stderr 类别和退出状态。
- **P3**：真实执行 Codex handler 时，旧 identity remove 中一条返回非零，与最后的 `codex plugin add` 返回非零分别会怎样影响后续命令、legacy-link cleanup、target result 和整体退出？
- **P4**：同一成功 results 分别用 `--json --color --verbose` 与 `--no-color --verbose` 呈现。预测两边的语义、ANSI、detail 和退出状态；指出每个控制点的函数。

### Transfer prompts

#### T1：增加一个非默认安装职责

在 registry 增加非默认 `claude-plugin` target，使用一个新的真实 handler 调用既定外部安装命令。先固定最小修改入口与边界：`targets` 的 metadata/strategy、handler、`printInstallHelp` 可发现性；不得改变现有默认选择或 Codex/Pi consent 行为。验证必须成对比较：

- 基线 `install --yes --dry-run --json` 与修改后同命令解析出的 target/results/退出均不变，证明非默认 target 未进入默认集合。
- `install --target claude-plugin --dry-run --json` 只产生该 target 的预期 ordered command changes，零外部调用、退出 0。
- 交互勾选它时，依据其 `external` metadata 证明 consent gate 显示；拒绝后不派发、不保存。
- 未知 target 仍在 effect 前退出 2；help 新增该名称。验证位置为 `tests/cli-install-output.test.js` 的 CLI focused suite，以及 `package.json#scripts.test:cli` 所指命令；这里只定位，不执行。

#### T2：增加 `--ndjson` 机器输出模式

先固定最小入口：`parseInstallArgs` 新 option、`main` 中统一 results 之后与 `options.json` 并列的精确分流、新 formatter；不得把 target handler 或 `printResults` 变成机器格式生产者。建立成功与失败两组数据，对现有 `--json` 基线和新增 `--ndjson` 变化模式都分别叠加每个相关正交选项 `--color`、`--no-color`、`--verbose`：

- 每个机器输出 case 都必须被对应 parser 成功解析；归一化后比较完整 `{ok, results}` 语义、results 顺序与每项 changes/error，不能只比较文本。
- 成功组两种模式退出 0；用 fake Codex 令 required plugin add 失败的失败组，两种模式退出 1，解析后顶层失败语义一致。
- `--color`/`--no-color` 不得改变机器输出语义或注入 ANSI；`--verbose` 不得插入额外非数据行。
- 保留一个未启用 `--json/--ndjson` 的 `--no-color --verbose` 人类输出回归：仍有标题、summary 与 change details，无 ANSI，且不是合法 JSON/NDJSON。

验证位置为 `tests/cli-install-output.test.js:44`、`:78`、`:200`、`:208`、`:215`、`:222` 附近的聚焦输出检查；这里只设计断言，不运行测试。

#### T3：把 dispatcher 从 continue-on-error 改为 fail-fast

必须用隔离 HOME/PATH 中的现有真实参与者成对验证修改前基线与修改后行为，不能把 registry 替换成抽象 fake adapter：

1. 选择 `cursor,codex-plugin`；在 `~/.cursor/plugins/local/csl` 预置普通文件，让 `ensureSymlink` 稳定制造首项失败；PATH 中放记录每次参数的 fake `codex`。
2. 当前基线应得到按选择排序的两个 results，Cursor 失败、Codex 成功，fake Codex 记录八条命令，预置普通文件保持不变，已完成 Codex effect 不回滚，整体退出 1。
3. 修改为 fail-fast 后，同一前置条件应只产生 Cursor 失败 result，fake Codex 调用记录为空，预置文件仍不变，整体退出 1；这组差异证明停止策略，而不是只检查数组长度。
4. 正常返回对照：选择 `codex-plugin,pi`，PATH 中不提供 Codex、只提供记录调用的 fake Pi。Codex 产生 `skip` change 且 `ok:true`，Pi 仍被调用，results 顺序不变、退出 0；fail-fast 不得把 successful skip 误判成失败。

验证应放在 `tests/cli-install-output.test.js`，复用该文件的隔离临时目录、fake executable 与 JSON parse 模式；固定检查结果顺序、退出状态、调用日志、预置状态和已完成副作用。这里只设计断言，不执行测试。

## Verification Key & Completion Standard

### Recall / Prediction Key

| Key | 必须判断 | 可接受替代表述 | 源码锚点及必要对比分支 |
| --- | --- | --- | --- |
| K1（R1/P1） | 四段为参数入口、target 选择/授权与交互偏好、逐 target effect/隔离、results 呈现/退出。P1 只选择默认 `codex-plugin`，不会读写保存选择，单一成功 result，退出 0 | 可把 registry 与 dispatcher 合称安装编排，但必须保留“统一 results”边界 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#installTargets`；`yes` 分支早于 interactive |
| K2（R2/P2） | 优先级为 all、显式、yes、interactive；仅 interactive 读写 selection。拒绝 Pi external consent 时在保存和派发前由 `die` 退出 2，stderr 为 Error，Pi 不调用 | “显式”可包括位置 target 和 `--target` | `bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| K3（R3/P3） | dispatcher 单项 catch 后继续；handler 正常 `skip` 得到 `ok:true`。允许失败的 remove 仍记录 command 并继续；required plugin add 失败使 Codex result 失败、阻止 cleanup、整体退出 1 | 可称 best-effort remove 与 required add | `bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`；`tests/cli-install-output.test.js:426` |
| K4（R4/P4） | `installTargets` 生产统一 results；`if (options.json)` 精确分流，机器 formatter 是 inline `JSON.stringify`，人类 renderer 是 `printResults`。color 由 `createColors`、verbose 由 `printChangeDetails` 控制且仅影响人类路径；JSON 顶层 ok 与退出都复用 `results.every(item.ok)` | “JSON serializer 在 main 内”可替代 inline formatter | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printResults`、`bin/csl-agent-kit.js#createColors`、`bin/csl-agent-kit.js#printChangeDetails`；`tests/cli-install-output.test.js:222` |

源码分支揭示的易错判断：把 `--yes` 当作 `--all`；把 saved selection 当作非交互配置；把 allow-failure command 或 `skip` 当作 target failure；认为 `--color` 会污染 JSON；认为任一 handler 抛错都会终止 dispatcher。

### Transfer Key

#### K5（T1）

- 必须把新增职责接入 `targets` 的 title/description/default/external/run 与一个具体 handler；`printInstallHelp` 已从 registry 枚举 target description，因此可发现性应由 registry 传导，而不是复制第二份 target 清单（`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#printInstallHelp`）。
- `default:false` 保证 `resolveInstallTargets` 的 `--yes` 过滤结果不变；显式选择经过 `validateTargets` 后由 `installTargets` 派发（`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets`、`bin/csl-agent-kit.js#installTargets`）。
- `external` 必须依据是否调用外部命令设定，并由交互 prompt 的动态 confirm 与拒绝分支验证。dry-run 断言必须落在 handler 使用的 effect primitive，证明零调用而非只看成功文案（`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#runCommands`）。
- 可接受替代：若 handler 的 effect 不是命令而是 symlink，可复用 `ensureSymlink`，但必须同步把 `external:false` 的无确认对照写入验证。

#### K6（T2）

- 新模式必须消费 `installTargets` 的原始 results，并在 `main` 的输出分流处选择 formatter；不得重新执行 handler，也不得从 human summary 反解析（`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets`）。
- 基线 JSON 与变化 NDJSON 的 success/failure case 必须各自覆盖 `--color`、`--no-color`、`--verbose`。比较对象是解析并归一化后的顶层 ok、ordered results、changes/error 和退出状态；只断言无 ANSI 或包含 target name不充分。
- 机器路径不得调用 `createColors` 或 `printChangeDetails`。未开启机器模式的人类回归必须继续证明 title、summary、verbose detail、无 ANSI 与非机器格式（`bin/csl-agent-kit.js#printResults`、`bin/csl-agent-kit.js#createColors`、`bin/csl-agent-kit.js#printChangeDetails`）。
- 可接受替代：NDJSON 可用一条 envelope 或逐 result + completion record，只要 parser 规则固定，且归一化后与 JSON 语义和 `results.every` 退出谓词一致。

#### K7（T3）

- 当前行为的因果点是 `installTargets` 中位于循环内部的 `try/catch`。Cursor 的普通文件冲突必须经真实 `installCursor` → `ensureSymlink` 抛错；后续是否参与必须由 fake Codex/Pi executable 的调用日志证明（`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCursor`、`bin/csl-agent-kit.js#ensureSymlink`）。
- 基线断言：results 为 `[cursor failure, codex-plugin success]`，Codex 命令确实执行，预置普通文件未变，退出 1。fail-fast 断言：仅 Cursor failure、Codex 日志为空、预置文件未变、退出仍为 1。已完成副作用不应被描述为回滚，因为源码无回滚层。
- successful skip 对照必须让 `installCodexPlugin` 因 CLI 缺失正常返回，并用后续 Pi 日志证明 dispatcher 继续；results 为 `[codex-plugin ok/skip, pi ok]`，退出 0（`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#main`）。
- 可接受替代：可用 Pi 作为失败后的后续参与者、Codex 作为 skip，只要仍使用真实 registry handlers/effect primitives，并同样核对顺序、调用/状态、退出与已有副作用。

### Completion Standard

人类只有在遵守材料开放顺序，先独立固定 Recall、Prediction、Transfer 三类初始答案，再打开 Key，并且 K1–K7 的关键判断、因果解释和必要对比分支全部成立时，才算本轮完成。提前查看 Key 只算复习；重新测试必须换用等价 prompts。本文不写完成记录、学习画像或进度状态。
