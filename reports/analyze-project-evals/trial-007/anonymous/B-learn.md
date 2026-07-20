# 掌握 `bin/csl-agent-kit.js`

## Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-19T23:56:41+0800`
- **Learner assumption**：读者会阅读基础 CommonJS JavaScript，理解 CLI、环境变量、退出码、同步文件操作和测试断言，但没有本仓库的安装心智模型。
- **Material status**：`学习材料就绪`

这个 npm bin 把 `install` argv 或交互答案转成 registry 中的有序 integrations，调用 Cursor filesystem、Codex CLI、Pi CLI 的真实 handler，再将统一 results 投影为机器或人类输出并决定 exit（`package.json#bin`、`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets`）。它的直接上游还包括把参数原样转交给该入口的 `scripts/install.sh`；被安装的 skills/hooks/extensions 内容以及外部客户端内部行为不在本文件内（`.codex-plugin/plugin.json#skills`、`package.json#pi`）。

### Target registry（源码声明顺序）

| Order | Stable id | Default | External consent | Handler | 主要可观察职责 | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cursor` | `false` | `false` | `installCursor` | 维护 `~/.cursor/plugins/local/csl` 指向仓库根的 link | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installCursor` |
| 2 | `codex-plugin` | `true` | `true` | `installCodexPlugin` | 迁移 Codex marketplace/plugin identity，成功后清理本仓库拥有的旧 skill links | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installCodexPlugin` |
| 3 | `pi` | `false` | `true` | `installPi` | 调用 `pi install <repoRoot>` | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installPi` |

此顺序直接决定 `--all`、交互 choices、selection 过滤/保存、help target 列表以及相应派发/结果顺序；`default` 决定 `--yes` 与无有效 saved selection 时的预选，`external` 决定交互 confirm 是否出现（`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#saveInstallSelection`、`bin/csl-agent-kit.js#printInstallHelp`）。

### Learning Targets

1. 对给定 argv 与环境，依 gate 顺序判断何时直接退出，以及哪些 state/effect 因此前不可达。
2. 从 registry 的声明顺序和 policy 推导 all/default/explicit/interactive selections、help 与 consent。
3. 解释 handler、effect primitive、dispatcher results 的因果关系，区分异常失败与正常 `skip`。
4. 追踪 Codex 命令阶段和 legacy cleanup 的先后、允许失败与状态边界。
5. 精确定位统一 results、JSON/human 分流、formatter、color/verbosity 和共享退出谓词。

必需前置：JavaScript 分支/迭代、`spawnSync`、symlink 与 realpath、JSON/ANSI、隔离 HOME/PATH 的测试思路。不覆盖 `prompts` 通用教程、平台安装原理、完整 API/测试清单、审计或改进计划。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1：判断 admission 与不可达状态 | command gate、parser/direct exit、environment admission、state load、authorization、dispatcher boundary | B1 gate sequence | P1、P2、T1；K1、K2、K6 |
| LT2：由 registry 推导选择 | declaration order、default、external、strategy、selection precedence | B2 `--all --dry-run --json --color` 与交互对照 | P1、P2、T1、T2；K2、K3、K6、K7 |
| LT3：解释派发与 skip | ordered dispatcher、handler exception、effect primitive、successful skip | B3 Cursor 前置失败 + Codex 后续参与；Codex skip + Pi 后续参与 | P3、T3；K4、K8 |
| LT4：解释 Codex 两阶段迁移 | allowed failure、required add、owned link、cleanup boundary | B4 required add 成败对照 | P3、T2；K4、K7 |
| LT5：精确推导输出与退出 | unified results、exact branch、JSON serializer、human renderer、color、verbose、shared predicate | B2/B3 的 success/failure results 输出对照 | P4、T4；K5、K9 |

## Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | Command admission：只有首 token `install` 进入安装；其他 token/空调用只显示顶层 help | `main` 的唯一 command 分支 | 先区分根本不会进入 parser 的输入 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printHelp` |
| 2 | Parser/direct exits：options 有固定 shape；install help 与错误在 parser 内直接退出 | `parseInstallArgs` 边扫描边处理 help/错误 | 这些 exit 使 resolver、state 与 effects 全部不可达 | `bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#printInstallHelp`、`bin/csl-agent-kit.js#die` |
| 3 | Registry policy：稳定 id、声明顺序、default、external 与 handler 共处一处 | 多个消费者都迭代 `targets` | 选择和执行不能只靠命令示例推断 | `bin/csl-agent-kit.js#targets` |
| 4 | Selector precedence：all → explicit → yes → interactive | `resolveInstallTargets` 的连续 early returns | 先确定是否进入环境/state gates | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets` |
| 5 | Interactive gates：TTY/CI admission、prompt dependency、state load、selection、external authorization、save 依序发生 | 源码语句顺序与多个 `die` | 明确某个拒绝点之后哪些状态和 effect 不可能发生 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#saveInstallSelection` |
| 6 | Effect primitives：symlink、commands、legacy removal 在自身边界实现 dry-run | handler 将 options 传给 primitive | 理解 changes 是计划/完成记录而非第二次执行 | `bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 7 | Per-target isolation：每个 registry handler 在循环内独立 try/catch，成功/异常都产生一个同序 result | `installTargets` 是统一 results 的生产点 | 这是继续策略与最终成功的共同因果节点 | `bin/csl-agent-kit.js#installTargets` |
| 8 | Successful skip：Codex/Pi 缺失时 handler 正常返回 `skip` change，没有异常 | CLI availability branch 的 `return` | 防止用“无外部调用”替代失败判定 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi` |
| 9 | Codex two-phase transaction boundary：ordered CLI commands 全部返回后才清理 owned links，但全局没有 rollback | cleanup 位于 `runCommands` 之后 | 用 required add failure 解释保留旧状态 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 10 | Output projection：`options.json` 精确分流 inline serializer 与 `printResults`；color/verbose 只在 human renderer 内生效 | results 已生产后才进入该分支 | 将业务语义、格式与呈现控制分层 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printResults`、`bin/csl-agent-kit.js#createColors`、`bin/csl-agent-kit.js#printChangeDetails` |
| 11 | Shared completion predicate：JSON 顶层 `ok` 与 exit 0/1 都计算 `results.every(item.ok)` | `main` 中两次同义表达式 | 确保两种格式不产生不同成功定义 | `bin/csl-agent-kit.js#main` |

## Guided Code Walkthrough

### B1：安装前 gates 与不可达边界

选择理由：先把直接退出与 admission 顺序读清，才能避免把没有 effect 的多个原因混为同一失败。

| Gate order | 条件 | 输出通道 / exit | 后续不可达 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1. command | 首 token 不是 `install`（含空调用） | `printHelp` 写 stdout；函数正常结束 | install parser、state、prompt、dispatcher | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printHelp` |
| 2. parser help | install args 含 `--help/-h`，且扫描在此前未先遇错误 | `printInstallHelp` 写 stdout，exit 0 | resolver、state、prompt、dispatcher | `bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#printInstallHelp` |
| 3. parser error | 未知 option 或 `--target` 缺值 | `die` 写 stderr，exit 2 | resolver、state、prompt、dispatcher | `bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#die` |
| 4. selector resolution | all/explicit/yes 命中；显式未知 target 在 validation 中失败 | 合法者直接返回 selection；未知者 stderr/2 | 合法者跳过全部 interactive gates；非法者也不派发 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets` |
| 5. environment admission | 进入 interactive，但 stdin 非 TTY 或 `CI` 存在 | stderr/2 | prompt dependency、state load、authorization、save、dispatcher | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| 6. prompt dependency | `require("prompts")` 失败 | stderr/2 | state load、authorization、save、dispatcher | `bin/csl-agent-kit.js#resolveInstallTargets` |
| 7. selection/state load | `loadInstallSelection` 读 v1 state；无效/缺失回退 default choices | 尚无 completion 输出 | 不阻断 prompt；未知 saved ids 不进入 choices | `bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#buildInstallChoices` |
| 8. authorization | prompt 取消，或选择含 external target 且未确认 | stderr/2 | selection save、dispatcher、普通 completion | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#targets` |
| 9. state save | 已授权 selection 原子写入；写失败仅 warning | warning 写 stderr，但不退出 | 仅持久记忆可能缺失；dispatcher仍可达 | `bin/csl-agent-kit.js#saveInstallSelection`、`bin/csl-agent-kit.js#resolveInstallTargets` |
| 10. dispatch | selection 返回 `main` 后才调用 | result output；exit 0/1 | — | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets` |

### B2：`install --all --dry-run --json --color`

选择理由：无副作用地覆盖 registry 声明顺序、三个 handler 的策略、统一 result 和机器输出隔离。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| B2.1 | all 顺序是否由帮助文本写死？ | `targets`、`resolveInstallTargets`、`printInstallHelp` | all 与 help 都由 `Object.keys/Object.entries(targets)` 派生 | selection/results 为 `cursor, codex-plugin, pi`（`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`） |
| B2.2 | dry-run 是否仍探测 Codex/Pi？ | 三个 handler 与 primitives | Cursor primitive直接返回计划；Codex/Pi availability check 被 `!dryRun` 短路；commands 不 spawn | changes 依序为一个 symlink plan、八个 Codex command plans、一个 Pi command plan（`bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#runCommands`） |
| B2.3 | `--color` 会污染 JSON 吗？ | `main`、`createColors` | JSON branch 直接序列化，完全不调用 color/human renderer | JSON 可解析、无 ANSI；三项均 ok，顶层 ok true，exit 0（`bin/csl-agent-kit.js#main`；`tests/cli-install-output.test.js:222`） |

### B3：真实失败、后续参与与正常 skip

选择理由：一组可重复的真实 handler 对照能证明 dispatcher 的 continue 策略，而非只观察抽象数组操作。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| B3.1 | 如何让第一项稳定失败？ | `installCursor`、`ensureSymlink` | 隔离 HOME 中预置普通文件 `~/.cursor/plugins/local/csl`；真实模式拒绝覆盖并 throw | cursor 形成失败 result，预置文件不变（`bin/csl-agent-kit.js#ensureSymlink`） |
| B3.2 | 后续 Codex 是否仍参与？ | `installTargets` | catch 位于 `for` 内部 | 选择 `cursor,codex-plugin` 且 PATH 提供记录调用的 fake Codex 时，仍记录 Codex availability 与八条生命周期命令；results 同序，整体 exit 1（`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#installCodexPlugin`） |
| B3.3 | Codex CLI 缺失是否也停止后续项？ | `installCodexPlugin`、`installTargets`、`installPi` | 缺失返回 `skip`，未抛错 | 选择 `codex-plugin,pi`、PATH 只提供记录调用的 fake Pi：Codex result `ok:true/skip`，Pi 被调用，results 同序且 exit 0（`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#main`） |

### B4：Codex required add failure

选择理由：该行为同时揭示 command allow-failure、cleanup 前置条件和失败 result 到 exit 的链。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| B4.1 | 旧 identity remove 失败是否终止？ | `installCodexPlugin` 的 command tuples、`runCommands` | 前六条 `allowFailure:true`，非零仍 push command change | 后续 marketplace/plugin add 继续（`bin/csl-agent-kit.js#runCommands`） |
| B4.2 | required plugin add 失败后是否清理旧 links？ | `installCodexPlugin` 调用顺序 | 两条 add 为 `allowFailure:false`；throw 发生在 spread cleanup 之前 | cleanup 不可达，旧 owned link 保留；Codex result `ok:false`，exit 1（`tests/cli-install-output.test.js:426`） |
| B4.3 | 成功 cleanup 如何限定 ownership？ | `removeLegacyCodexSkillLinks`、`isWithin` | 仅遍历真实目录中的 symlink，并检查词法/解析来源处于仓库 skills 根 | owned links 删除或在 dry-run 报告；普通/外部对象保留（`tests/cli-install-output.test.js:324`、`:354`、`:377`） |

## Human Recall, Prediction & Transfer Checks

### 材料开放顺序

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Verification Key 和源码，只看 Recall prompts 后独立作答。
2. **Prediction**：正文可见，Key 与源码仍隐藏；先固定预测与理由。
3. **Transfer**：正文和源码可见，Key 仍隐藏；固定入口、影响边界、验证位置与理由。
4. 三类初始答案全部固定后才打开 Key，逐项用报告和源码核对并补充解释。

提前查看 Key 时本轮只算复习；重新测试要换等价 prompts。Agent 可持续读取本报告，不设“主动回忆通过”；只有报告外 sealed held-out prediction/transfer task 可评价报告是否支持推理，不能声称 Agent 已形成记忆或已学会。

### Recall prompts

- **R1**：按顺序说出 install 主要行为前的 gates，以及 parser、environment、authorization 失败各让哪些 state/effect 不可达。
- **R2**：列出三个稳定 target 的源码顺序、default/external policy 与 handler；这些字段分别控制哪些可观察行为？
- **R3**：dispatcher 如何把 handler 返回/异常变成 results？为什么 `skip` 是成功而不是失败？
- **R4**：Codex command stage 与 legacy cleanup 的边界是什么？allow-failure remove 与 required add 的结果有何不同？
- **R5**：统一 results 的生产点、JSON/human 精确分流、两类 formatter、color/verbose 控制点和退出谓词分别是什么？

### Prediction prompts

- **P1**：在 CI 环境无 selectors 调用 `install --json`，且 selection file 已保存 `cursor,pi`。预测 state 是否读取、prompt/dispatcher 是否触发、输出通道及 exit。
- **P2**：selection file 保存 `pi,cursor`，调用 `install --yes --dry-run --json`。预测选择与结果顺序、selection file 是否修改、exit，并解释 registry default 的作用。
- **P3**：依次选择 `cursor,codex-plugin`，Cursor path 是普通文件，而 fake Codex 所有命令成功。预测两个 results、Codex 调用、持久状态与整体 exit；再说明 Codex CLI 缺失为何不是同类失败。
- **P4**：同一成功 results 分别使用 `--json --color --verbose` 与 `--no-color --verbose`。预测解析语义、ANSI、details 与 exit，并标出每个 renderer/control。

### Transfer prompts

#### T1：新增只读 `list-targets` discovery 控制模式

新增顶层 `list-targets`，输出必须严格由 `Object.entries(targets)` 的声明顺序派生，每项只含稳定 id、title、description、default、external；它不得进入 install 的 state/effect pipeline。固定以下 selector 冲突矩阵：

| Invocation class | Expected admission |
| --- | --- |
| `list-targets` | 成功输出三项，顺序为 `cursor,codex-plugin,pi`，正常结束 |
| `list-targets --all` 或 `list-targets all` | stderr + exit 2 |
| `list-targets --target X`、`--targets X` 或 `--target=X` | stderr + exit 2 |
| `list-targets --yes` / `-y` | stderr + exit 2 |
| `list-targets cursor` 等位置 target | stderr + exit 2 |

早退点必须位于 `main` 中 install parser、`resolveInstallTargets`、任何 state load 与 `installTargets` 之前；若采用独立 `parseListTargetsArgs`，它只验证 discovery 自己的参数，不复用 install selector resolution。验证在隔离 HOME/PATH 下分别设置 CI 与非交互 stdin，并放置 selection sentinel、可记录加载的 prompt stub、可记录调用的 Codex/Pi executables 与 Cursor path sentinel。每个 discovery 成功/冲突 case 都断言：selection state 字节不变、prompt log 为空、Cursor sentinel 不变、外部调用 log 为空、stdout 不含普通 `install preview/complete` completion；冲突 case 还应无 registry payload。另保留 `install --yes --dry-run --json` 的现有主流程回归。

#### T2：增加非默认 `claude-plugin` integration

最小迁移入口是 `targets` 新条目和对应真实 handler；`printInstallHelp`、all、choices、validation 与 dispatcher 应继续由 registry 派生，不复制第二份名称清单。设定 `default:false`，按是否调用外部 CLI 正确设置 `external`。成对验证：原有 `--yes --dry-run --json` 的 target/results/exit 不变；显式 `--target claude-plugin --dry-run --json` 只产生其计划 changes 且零调用；交互选择时 consent 与 `external` 一致，拒绝时 state 不变、handler log 为空、exit 2；all/help 中新 target 位于按声明位置派生的顺序。验证位置为 `tests/cli-install-output.test.js` 与 `package.json#scripts.test:cli`，这里只定位而不执行。

#### T3：把 dispatcher 改为 fail-fast

用隔离环境的现有真实参与者成对比较修改前后：

1. `cursor,codex-plugin`：在隔离 HOME 的 Cursor target 预置普通文件，经 `installCursor` → `ensureSymlink` 制造首项失败；PATH 中提供记录调用的 fake Codex。
2. 当前基线必须得到 `[cursor failed, codex-plugin ok]`，Codex availability/八条 lifecycle calls 可观察，Cursor 普通文件不变，已完成 Codex effects 不回滚，exit 1。
3. fail-fast 后只得到 Cursor failed result，Codex log 为空，Cursor 文件仍不变，exit 1；必须同时断言 result 顺序、外部 log、状态与已完成副作用。
4. successful skip 对照：选择 `codex-plugin,pi`，PATH 中没有 Codex、只有记录调用的 fake Pi。Codex 正常返回 `ok:true` 的 skip，Pi 必须继续、results 保序、exit 0；新策略不得将 skip 误当失败。

#### T4：新增 `--jsonl` 机器输出格式

最小入口是 `parseInstallArgs` 的 option 与 `main` 在统一 results 之后的精确 formatter 分支，不修改 handlers。对 success 与 required Codex add failure 两组 results，现有 `--json` 基线和新 `--jsonl` 变化模式都分别叠加 `--color`、`--no-color`、`--verbose`：每个 case 用对应 parser 解析，归一化后比较顶层成功、完整 ordered results、changes/error 与 exit；成功组均 exit 0，失败组均 exit 1。两种机器模式都不得因 color 出现 ANSI，也不得因 verbose 插入非数据行。保留未启用两种机器格式的 `--no-color --verbose` 人类回归：标题、summary、change details 均存在，无 ANSI，且不是合法 JSON/JSONL。

## Verification Key & Completion Standard

### Recall / Prediction Key

| Key | 必须判断 | 可接受替代表述 | 源码锚点及必要对比分支 |
| --- | --- | --- | --- |
| K1（R1/P1） | gate 顺序为 command → parser/direct exit → selector → interactive environment → prompt dependency → state load/selection → authorization → save → dispatcher。CI 无 selector 在 state load 前 stderr/exit 2；既不读 sentinel，也不 prompt/dispatch，`--json` 不会把 admission error 变成 JSON | 可把 prompt dependency 与 environment 合称 interactive admission，但必须保留 state 在其后 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| K2（R2/P2） | registry 顺序/策略必须精确为 cursor(false,false,installCursor)、codex-plugin(true,true,installCodexPlugin)、pi(false,true,installPi)。`--yes` 只选 codex-plugin，不读取或改写 saved state，单 result、exit 0 | false/true 可表述为非默认/默认与本地/需外部确认 | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`、`tests/cli-install-output.test.js:450` |
| K3（R2） | 声明顺序驱动 all、choices、state 过滤/保存、help 和派发/结果；default 驱动 yes/预选；external 只驱动交互 consent；run 驱动 handler | 可把 title/description 归于可见 choices/help | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#saveInstallSelection`、`bin/csl-agent-kit.js#printInstallHelp`、`bin/csl-agent-kit.js#installTargets` |
| K4（R3/R4/P3） | dispatcher 循环内 catch，所以 Cursor 普通文件冲突只令首项失败，Codex 仍执行；results 保序、文件不变、exit 1。Codex/Pi CLI 缺失正常返回 skip，result 仍 ok。Codex allow-failure remove 继续；required add 抛错并阻止 cleanup | 可称 continue-on-error 与 successful no-op | `bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#runCommands`、`tests/cli-install-output.test.js:426` |
| K5（R5/P4） | `installTargets` 生产 results；`if(options.json)` 分流 inline `JSON.stringify` 与 `printResults`。`createColors` 和 `printChangeDetails` 只服务 human；JSON 顶层 ok 与 exit 均用 `results.every(item.ok)`。JSON+color+verbose 无 ANSI/details，human no-color+verbose 有 details 无 ANSI，两边语义/exit 相同 | inline serializer 可称 main 中的 JSON formatter | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printResults`、`bin/csl-agent-kit.js#createColors`、`bin/csl-agent-kit.js#printChangeDetails`、`tests/cli-install-output.test.js:78`、`:208`、`:222` |

源码分支揭示的易错判断：saved selection 会影响 `--yes`；`external` 会阻止显式调用；无 CLI 的 skip 是失败；handler 抛错会中止全部 targets；`--color` 会污染 JSON；parser/admission 错误会服从 `--json` formatter。

### Transfer Key

#### K6（T1）

- 必须从 `bin/csl-agent-kit.js#targets` 按 `Object.entries` 顺序派生精确字段，不重新编码 id 顺序；可接受独立 formatter，但不可执行 handler。
- 所有 install execution selectors（all flag/位置 all、target/targets 三种写法、yes、位置 target）与 discovery 同现时都必须在 state/resolver/dispatcher 前 exit 2；不可只覆盖一种 `--target` 拼写。
- 早退必须位于 `bin/csl-agent-kit.js#main` 的独立 command 分支。成功与冲突的 HOME/PATH/CI/非交互断言都要证明 selection sentinel、prompt log、Cursor sentinel、Codex/Pi logs 不变，且没有 `printResults` completion；未启用 discovery 的 install 回归仍消费 `resolveInstallTargets` → `installTargets`。
- 可接受替代：实现为 `install --list-targets`，但必须在 install parser 中明确冲突矩阵，并在调用 resolver/state/dispatcher 前返回；零副作用断言不变。

#### K7（T2）

- 新 target 必须在 `targets` 声明稳定 id、default、external、run 和可见文案，handler 使用现有或具体的新 effect primitive；help/all/choices/validation/dispatch 应从 registry 自动派生（`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#printInstallHelp`）。
- `default:false` 的 baseline/changed comparison 必须证明 `--yes` 语义未变；显式 dry-run 要核对 ordered changes 和零调用；拒绝 gate 要核对 state、handler log 与 exit，不得用未知 target parser error 代替 authorization。
- 可接受替代：若该职责只建本地 link，可设 `external:false`，但必须将“交互无 confirm 且仍保存/派发”的对照写成可观察断言。

#### K8（T3）

- 控制策略修改点是 `bin/csl-agent-kit.js#installTargets` 循环内 catch；失败必须由真实 `installCursor`/`ensureSymlink` 的普通文件冲突制造，后续参与由真实 registry 的 Codex handler及其 fake executable log 证明。
- baseline 是两项同序 results、Codex calls 存在、Cursor sentinel 不变、exit 1；fail-fast 是仅一项、Codex log 空、sentinel 不变、exit 1。已经发生的 effects 无 rollback 语义。
- Codex 缺失的 `skip` + 后续 Pi log 必须保持两项 ok、顺序与 exit 0，证明正常返回不会触发停止。
- 可接受替代：交换真实 target 的先后，只要仍以具体 primitive 失败、后续真实 handler log、skip 对照和相同状态断言证明策略。

#### K9（T4）

- JSONL formatter 必须只消费 `installTargets` 已产生的 results，位于 `bin/csl-agent-kit.js#main` 的机器/人类分流，不得重跑 targets 或解析 `printResults` 文本。
- JSON 与 JSONL 的 success/failure 两侧都必须各自覆盖 color、no-color、verbose；比较解析后的完整语义与 exit，不能只断言 target name 或无 ANSI。
- 机器路径不调用 `createColors`/`printChangeDetails`；无机器 flag 的 human regression 仍检查标题、summary、details、无 ANSI与不可按机器格式解析。
- 可接受替代：JSONL 采用单 envelope 行，或 ordered result 行加 completion 行；只要 parser contract 固定、归一化结果与 `results.every` 的成功语义一致。

### Completion Standard

人类只有遵循材料开放顺序，先固定 Recall、Prediction、Transfer 三类初始答案，再打开 Key，并满足 K1–K9 的关键判断、因果解释和必要对比分支，才算本轮完成。提前查看 Key 只算复习；本文不创建完成记录、学习画像或进度文件。
