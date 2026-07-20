# `bin/csl-agent-kit.js` 源码掌握指南

## Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-20T00:19:11+0800`
- **Learner assumption**：读者能阅读 CommonJS JavaScript，理解 CLI 参数、同步子进程、文件系统状态、JSON 与测试断言，但不熟悉本仓库安装行为。
- **Material status**：`学习材料就绪`

该文件是 `package.json#bin` 暴露的安装 CLI，也接收 `scripts/install.sh` 的参数转发。它将 argv 或交互答案解析成 registry 中的有序 target strategies，调用 Cursor filesystem、Codex CLI、Pi CLI，形成统一 results 后输出 JSON 或终端摘要并确定 exit（`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installTargets`）。被安装内容由 manifests/package 声明，外部客户端实际如何消费内容不属于该文件（`.codex-plugin/plugin.json#skills`、`package.json#pi`）。

### Target registry（精确源码顺序）

| Order | Stable id | `default` | `external` | Handler | Observable responsibility | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cursor` | `false` | `false` | `installCursor` | 管理 `~/.cursor/plugins/local/csl` 到 repo root 的 symlink | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installCursor` |
| 2 | `codex-plugin` | `true` | `true` | `installCodexPlugin` | 运行 Codex plugin/marketplace migration，成功后清理 owned legacy skill links | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installCodexPlugin` |
| 3 | `pi` | `false` | `true` | `installPi` | 运行 `pi install <repoRoot>` | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installPi` |

声明顺序直接派生 `--all`、interactive choices、saved selection 过滤/保存、help 和相应 results 顺序；`default` 决定 `--yes` 及无有效保存状态时的预选，`external` 只决定交互授权，`run` 决定派发 strategy（`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#saveInstallSelection`、`bin/csl-agent-kit.js#printInstallHelp`、`bin/csl-agent-kit.js#installTargets`）。

### External process contract（当前实现）

| Handler / primitive | Availability probe | Operation | Dry-run | Result classification | Cleanup ordering | Resource policy | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `installCodexPlugin` → `hasCommand` / `runCommands` | `codex --version`；`stdio:"ignore"`，只判断 `status === 0` | 依序 8 次 `codex`：6 个 remove、marketplace add、plugin add；operation 使用 `cwd:repoRoot, encoding:"utf8"` | 同时跳过 probe 与全部 spawn，仅返回 8 个 command plans | probe 的非 0 或非数值 status 都成为 `skip`；6 个 remove 普通非零允许并记录；两次 add 普通非零抛错。源码不检查 `spawnSync` 的 `error` 字段，因此 runtime spawn error 未被独立分类 | 8 次 operation 全部返回后才调用 legacy cleanup；required failure 时 cleanup 不可达 | timeout：无；retry：无；cancellation/signal：无 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#hasCommand`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| `installPi` → `hasCommand` / `runCommands` | `pi --version`；同上 | 一次 `pi install <repoRoot>`，不允许普通非零 | 跳过 probe 与 spawn，仅返回 command plan | probe 不成功成为 `skip`；operation 普通非零抛错。runtime `error` 同样未独立分类 | 无后续 cleanup | timeout：无；retry：无；cancellation/signal：无 | `bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#hasCommand`、`bin/csl-agent-kit.js#runCommands` |
| `spawnSync` call sites | probe 参数固定为 `["--version"]` | operation 参数来自上述 command tuples | `runCommands` 在 spawn 前 early continue | `hasCommand` 只看 status；`runCommands` 先比较 status，再用 stderr/stdout/`exit ${status}` 合成错误；未读取 runtime `result.error` | primitive 自身无 cleanup/rollback | 每个调用点均未传 timeout、signal、killSignal 或 retry policy | `bin/csl-agent-kit.js#hasCommand`、`bin/csl-agent-kit.js#runCommands` |

这里能由源码证明的是“未检查 runtime error 字段”和“未配置资源策略”；不能仅凭本文件猜测特定 Node 版本在 timeout、signal 或 ENOENT 时返回哪些字段。任何资源策略实现必须先核对实际 runtime contract，再在普通 `status` 逻辑之前分类。

### Learning Targets

1. 按真实顺序判断 command、parser、environment、state、authorization gates 的出口与不可达后续。
2. 从 registry 顺序及 policy 推导 default/explicit/all/interactive 选择、help、consent 与派发。
3. 解释 filesystem/process primitives 如何生成 changes，dispatcher 如何隔离异常，并区别 failed result 与 successful skip。
4. 逐项推导 Codex/Pi 的 probe、operation、dry-run、非零、cleanup 与当前无 resource policy 的契约。
5. 精确定位统一 results、JSON/human 分流、formatter、color/verbose controls 与共享退出谓词。

必需前置：JavaScript 分支/数组、`spawnSync` 的同步调用模型、symlink/realpath、隔离 HOME/PATH 的测试方式。本文不教授 Node/process 通用 API，不覆盖平台内部安装、完整测试清单、审计或改进计划。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1：安装前 gates | direct exit、selector precedence、TTY/CI admission、state load、consent | B1 gate ledger | P1、P2、T5；K1、K2、K9 |
| LT2：registry policy | stable id/order、default、external、handler | B2 all/default/explicit 对照 | P2、T1、T5；K2、K6、K9 |
| LT3：effect 与 dispatcher | dry-run primitive、per-target catch、successful skip | B3 Cursor failure + Codex continuation；Codex skip + Pi continuation | P3、T3；K3、K7 |
| LT4：外部 process contract | probe/operation、allowFailure、runtime error boundary、cleanup、无 timeout/retry/cancel | B4 Codex/Pi process matrix | P3、T4；K4、K8 |
| LT5：结果与呈现 | unified results、format branch、serializer/renderer、color/verbose、success predicate | B2/B3 的 machine/human success/failure | P4、T2；K5、K10 |

## Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | Command gate：非 `install` 只输出顶层 help | `main` 唯一 command branch | 先排除根本不进入主要行为的 invocation | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printHelp` |
| 2 | Parser exits：固定 options shape；install help/错误可在扫描中退出 | parser 直接调用 `process.exit`/`die` | 明确 resolver/state/effects 的不可达边界 | `bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#die` |
| 3 | Registry policy：一个声明同时持有 id 顺序、default、external 与 strategy | selection/help/dispatcher 都消费 `targets` | 建立多条行为的共同事实源 | `bin/csl-agent-kit.js#targets` |
| 4 | Selector precedence：all → explicit → yes → interactive | resolver 的 early returns | 判断是否进入 environment/state/consent | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets` |
| 5 | Interactive state machine：environment → dependency → load → select → authorize → save | `resolveInstallTargets` 的源码顺序 | 分清 admission、state 与授权失败 | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#saveInstallSelection` |
| 6 | Effect changes：filesystem/command/remove/skip 是 handler 结果；dry-run 在 primitive 前截断 | 三个 effect primitive 显式检查 dry-run | changes 描述效果，不是再次执行的指令 | `bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 7 | Probe 与 operation：Codex/Pi 在真实 operation 前各运行 `--version`，但 dry-run 两者都不运行 | handler 中 `!dryRun && !hasCommand` 条件 | 为 missing/operation/resource failure 分类打基础 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#hasCommand` |
| 8 | Runtime-result boundary：当前只判 status，未读取 `result.error`，且无 timeout/retry/cancel | 两个 spawn call 的 options 与分支 | 防止对未证明字段和资源语义作猜测 | `bin/csl-agent-kit.js#hasCommand`、`bin/csl-agent-kit.js#runCommands` |
| 9 | Ordered failure isolation：dispatcher 循环内 catch，每个 target 恰好产生一个同序 result | `installTargets` 唯一生成统一 results | 连接 handler 失败、后续参与和 exit | `bin/csl-agent-kit.js#installTargets` |
| 10 | Successful skip：probe 不成功让 handler正常返回 skip，而非 throw | Codex/Pi availability branch | “未执行 operation”不等于 target 失败 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi` |
| 11 | Codex cleanup boundary：required operations 完成后才清理 owned links | cleanup 位于 `runCommands` 返回之后 | 推导 add failure 下的持久状态 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 12 | Result projection：`options.json` 精确分流 inline serializer 和 human renderer；color/verbose 只在后者 | 分流发生在 results 完成后 | 分离业务结果与呈现选项 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printResults`、`bin/csl-agent-kit.js#createColors`、`bin/csl-agent-kit.js#printChangeDetails` |

## Guided Code Walkthrough

### B1：进入 dispatcher 前的 gate ledger

选择理由：相同的“没有安装 effect”可能来自完全不同的 gate；先按顺序定位才能预测 state 与输出通道。

| Order / gate | Condition | Output / exit | Unreachable afterwards | Evidence |
| --- | --- | --- | --- | --- |
| 1 command | 首 token 非 `install` 或缺失 | 顶层 help 到 stdout；正常结束 | install parser、state、prompt、dispatcher | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printHelp` |
| 2 parser help | 扫描到 `--help/-h` 且此前无错误 | install help 到 stdout；exit 0 | resolver、state、prompt、dispatcher | `bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#printInstallHelp` |
| 3 parser error | 未知 option 或 target 值缺失 | `die` 到 stderr；exit 2 | resolver、state、prompt、dispatcher | `bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#die` |
| 4 selectors | all/explicit/yes early return；未知显式 id validation 失败 | 合法者返回 selection；非法者 stderr/2 | 合法者绕过 interactive；非法者零 state/effect | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#validateTargets` |
| 5 environment admission | interactive 且非 TTY 或 CI | stderr/2 | prompt dependency、state load、authorization、save、dispatcher | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| 6 prompt dependency | `require("prompts")` 失败 | stderr/2 | state load、authorization、save、dispatcher | `bin/csl-agent-kit.js#resolveInstallTargets` |
| 7 state load/selection | 读取 v1 selection，非法/缺失回退 defaults | 无 completion；进入 prompt | 过期 id 被过滤，不能成为 choice | `bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#buildInstallChoices` |
| 8 authorization | prompt 取消；或所选含 external 且拒绝 confirm | stderr/2 | save、dispatcher、普通 completion | `bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#targets` |
| 9 save | 授权后原子写 selection；失败只 warning | warning 到 stderr，不终止 | 仅记忆可能未更新；dispatcher仍可达 | `bin/csl-agent-kit.js#saveInstallSelection`、`bin/csl-agent-kit.js#resolveInstallTargets` |
| 10 dispatch | selected 返回 `main` | results 输出；exit 0/1 | — | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets` |

### B2：`install --all --dry-run --json --color`

选择理由：该行为零副作用地贯穿声明顺序、所有 strategy、统一 results 与机器格式隔离。

| Checkpoint | Before-reading prediction | Inspect | Observe | Causal result |
| --- | --- | --- | --- | --- |
| B2.1 | all/help 是否各自维护顺序？ | registry、resolver、help | 两者都迭代 `targets` | selection/results 顺序为 `cursor,codex-plugin,pi`（`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`） |
| B2.2 | dry-run 是否仍 probe 外部 CLI？ | handlers、primitives | `!dryRun` 短路 probe；`runCommands` 不 spawn | 一个 Cursor link plan、八个 Codex command plans、一个 Pi plan（`bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`） |
| B2.3 | `--color` 会否改变 JSON？ | `main`、`createColors` | JSON branch 直接 serialize，不进入 human/colors | 可解析、无 ANSI、三项 ok、exit 0（`bin/csl-agent-kit.js#main`；`tests/cli-install-output.test.js:222`） |

### B3：真实 handler failure 与 successful skip 对照

选择理由：用 registry 现有参与者证明 dispatcher 控制策略，避免以抽象 fake adapter 代替真实边界。

| Checkpoint | Before-reading prediction | Inspect | Observe | Causal result |
| --- | --- | --- | --- | --- |
| B3.1 | 可重复前置失败 | Cursor handler/primitive | 隔离 HOME 的 target path 预置普通文件，`ensureSymlink` 明确 throw | cursor failed result，普通文件不变（`bin/csl-agent-kit.js#installCursor`、`bin/csl-agent-kit.js#ensureSymlink`） |
| B3.2 | 后续 Codex 是否参与 | dispatcher loop | try/catch 位于单次迭代内 | fake Codex 可记录 probe 与八个 operations；results 为 cursor failed 后 Codex ok，exit 1，已完成 Codex effect不回滚（`bin/csl-agent-kit.js#installTargets`） |
| B3.3 | Codex missing 是否停止 Pi | handlers | missing branch 正常返回 skip | PATH 只提供记录调用的 fake Pi 时，Codex `ok:true/skip`，Pi 仍运行，results 保序，exit 0（`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`） |

### B4：外部 process 与 cleanup 分类

选择理由：Codex/Pi 是主要 effect 边界；逐 case 阅读才能区分 availability、普通非零和源码尚未分类的 runtime error。

| Case | Probe / operation expectation | Source observation | Result / state consequence |
| --- | --- | --- | --- |
| Codex/Pi dry-run | probe 0 次、operation 0 次 | handler probe guard 与 `runCommands` dry-run early continue | planned changes；无 external log；dispatcher success（`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#runCommands`） |
| probe status 不为 0 | 精确一次 `<cmd> --version`，operation 0 次 | `hasCommand` 返回 false | 一个 skip change，target ok；无 cleanup（`bin/csl-agent-kit.js#hasCommand`） |
| Codex remove 普通非零 | probe 1 次；该 remove operation 1 次，后续仍执行 | tuple 的 `allowFailure:true` | change 记录非零 status；若 required adds 成功则 cleanup 继续（`bin/csl-agent-kit.js#runCommands`） |
| Codex required add / Pi operation 普通非零 | probe 1 次；operation 到失败点 | `allowFailure:false` 后 throw | target failed；Codex cleanup 不执行；dispatcher 后续 target 仍参与（`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#installTargets`；`tests/cli-install-output.test.js:426`） |
| spawn runtime error/resource event | 当前调用点未配置 timeout/signal，也未读取 `result.error` | 仅 status 与 stdout/stderr 被使用 | 当前源码无法独立命名 timeout/cancel/ENOENT 类别；不可凭本报告猜字段（`bin/csl-agent-kit.js#hasCommand`、`bin/csl-agent-kit.js#runCommands`） |

## Human Recall, Prediction & Transfer Checks

### Material opening order

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Verification Key 与源码，只看 Recall prompts 独立作答。
2. **Prediction**：正文可见，Key 与源码仍隐藏；先固定预测及理由。
3. **Transfer**：正文和源码可见，Key 仍隐藏；固定入口、影响边界、验证位置及理由。
4. 三类初始答案全部固定后才打开 Key，逐项核对并补充解释。

提前看 Key 时本轮只算复习；重新测试应换等价 prompts。Agent 不设“主动回忆通过”，只有报告外 sealed held-out prediction/transfer task 可评价报告是否支持推理，不得声称 Agent 已形成记忆或已学会。

### Recall prompts

- **R1**：按顺序说明 install 主要行为前的 gates；parser、environment、authorization 各会阻断哪些 state/effect？
- **R2**：精确列出三个 registry ids 的声明顺序、default/external 与 handler，并说明各字段的行为消费者。
- **R3**：handler、effect primitive、dispatcher result 如何连接？为什么 skip 与 throw 的整体结果不同？
- **R4**：对 Codex/Pi 分别说明 probe 参数、operations、dry-run、missing/普通非零/allow-failure、cleanup 与当前 timeout/retry/cancellation。
- **R5**：统一 results、JSON/human 分流、formatter、color/verbose 与退出谓词分别在哪里？

### Prediction prompts

- **P1**：CI 环境中无 selector 调用 `install --json`，selection file 已有 `cursor,pi`。预测 state/prompt/adapter 是否触发、输出通道与 exit。
- **P2**：saved selection 为 `pi,cursor`，执行 `install --yes --dry-run --json`。预测 selection/results 顺序、saved bytes 是否改变、external probe 次数和 exit。
- **P3**：选择 `codex-plugin,pi`：fake Codex 的一个 remove 返回 7、最后 plugin add 返回 9，fake Pi 可记录调用。预测 exact progression、cleanup、Pi participation、results 与 exit；再把 plugin add 改为成功比较。
- **P4**：同一 success results 分别用 `--json --color --verbose` 和 `--no-color --verbose`。预测解析语义、ANSI、details 与 exit，并给出所有控制点。

### Transfer prompts

#### T1：增加非默认 `claude-plugin` target

在 `targets` 增加 `default:false` 的稳定 id 与具体 handler，按真实 effect 设置 `external`。最小验证成对比较：原 `--yes --dry-run --json` 与变更后保持相同 target/results/exit；显式新 target dry-run 仅生成计划、零 process/filesystem effect；交互拒绝 external consent 时 saved bytes、handler log 不变且 exit 2；all/help/choices 的新位置由声明顺序派生。验证落在 `tests/cli-install-output.test.js` 与 `package.json#scripts.test:cli` 所指 focused command；这里只定位，不执行。

#### T2：增加 `--jsonl` 输出格式

入口仅为 `parseInstallArgs` 与 `main` 中统一 results 之后的新 formatter。对 success 与 required Codex add failure 两组 results，现有 JSON 基线与 JSONL 变化模式都分别叠加 `--color`、`--no-color`、`--verbose`；每个 case 用对应 parser 解析后比较完整 `{ok, ordered results, changes/error}` 与 exit。success 均 exit 0，failure 均 exit 1；机器模式不含 ANSI/verbose 非数据行。另保留无 JSON/JSONL 的 `--no-color --verbose` 人类回归：title、summary、details 存在，无 ANSI，且不是合法机器格式。

#### T3：将 dispatcher 改为 fail-fast

在隔离 HOME 预置普通 Cursor target，经真实 `installCursor` → `ensureSymlink` 制造第一项失败；PATH 提供记录每次调用的 fake Codex。当前基线 `cursor,codex-plugin` 应得到两项同序 results、Codex probe/operations log、Cursor sentinel 不变、exit 1；fail-fast 后只得 Cursor failure，Codex log 为空、sentinel 不变、exit 1。已完成 effect不应被描述为 rollback。再用 `codex-plugin,pi`、missing Codex 与记录调用的 fake Pi 证明 successful skip 后 Pi 仍执行、两项 ok、保序、exit 0。

#### T4：为外部 process 增加 operation timeout

新增正整数 timeout option，并让 Codex/Pi 的 probe 与 operation 共用明确资源 policy；retry 与 cancellation 若不在需求内仍保持“无”。实现前必须核对本仓库 Node runtime 对 missing executable、timeout/kill 及其他 spawn failure 的实际 result/error contract；先按 `result.error` 或经核实的 runtime signal 分类资源失败，再处理普通 status，不能猜字段或沿用 `status !== 0` 吞并所有类别。

使用可观察 fake `codex`/`pi` 记录每次精确 argv 与调用次数，逐 handler 覆盖：

| Case | Codex assertions | Pi assertions |
| --- | --- | --- |
| missing | probe attempt 精确为 `--version`；operation 0；仍按既定 missing policy 产生 skip | 同左 |
| ordinary probe nonzero | probe 1 次、operation 0；与当前 unavailable/skip 语义成对比较 | 同左 |
| ordinary operation nonzero | probe 1 次；Codex allow-failure remove 仍继续并记录，required add 才失败 | probe 1 次、`install <repoRoot>` 1 次并失败 |
| resource-policy failure at probe | probe 1 次后按新 resource failure 分类；operation 0；不得误判 missing | 同左 |
| resource-policy failure at operation | probe 1 次；精确 operations 到超时点；即使 tuple allowFailure 也不得把资源失败当普通允许非零 | probe 1 次；install 1 次；resource failure |
| dry-run | probe 0、operations 0；planned changes 与未加 timeout 的 dry-run 基线相同 | 同左 |

Codex resource failure 时 owned legacy-link sentinel 必须保持，因为 cleanup 只在全部 operations 成功后；dispatcher 选择 `codex-plugin,pi` 时，Codex 资源失败形成 failed result 后，Pi 仍按当前 continue policy参与。核对 ordered results、外部 logs、cleanup state 与 exit 1。若 timeout 实现引入 retry，则必须显式给出次数/退避并更新上述 exact call counts；否则断言每个 probe/operation 均只尝试一次。验证位置为 `tests/cli-install-output.test.js`；本指南只设计可观察断言，不运行它们。

#### T5：增加 `list-targets` discovery 模式

输出按 `Object.entries(targets)` 精确派生 id/title/description/default/external，不进入 install pipeline。它与每类执行 selector 的冲突矩阵为：单独调用成功；与 `--all`/位置 `all`、`--target`/`--targets`/`--target=...`、`--yes/-y`、位置 target 任一同现时 stderr/exit 2 且无 payload。早退必须位于 state load、resolver、dispatcher 之前。隔离 HOME/PATH、CI/非交互环境，设置 selection/prompt/Cursor/Codex/Pi sentinels；成功及冲突 case 均断言 state 字节不变、prompt/adapter/process logs 为空、无普通 install completion；保留未启用 discovery 的 `install --yes --dry-run --json` 回归。

## Verification Key & Completion Standard

### Recall / Prediction Key

| Key | 必须判断 | 可接受替代表述 | 源码锚点及必要对比分支 |
| --- | --- | --- | --- |
| K1（R1/P1） | gate 顺序是 command → parser/direct exit → selector → environment → prompt dependency → state load/selection → authorization → save → dispatcher。CI 无 selector 在 state load 前 stderr/exit 2；`--json` 不格式化该 admission error | 可合并 environment/dependency，但必须保留 state 在后 | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#die` |
| K2（R2/P2） | 顺序与 policy 精确为 cursor(false,false,installCursor)、codex-plugin(true,true,installCodexPlugin)、pi(false,true,installPi)。yes 只选 Codex，不读写 saved state，dry-run 无 probes，单 result exit 0 | false/true 可表述为非默认/默认与无需/需要交互授权 | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`、`tests/cli-install-output.test.js:450` |
| K3（R3） | `installTargets` 循环内 catch；throw 成 failed result但继续，normal skip 成 ok result。dry-run changes 在 primitives 生成 | continue-on-error / successful no-op 可接受 | `bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#runCommands` |
| K4（R4/P3） | probe 精确 `<cmd> --version`；Codex 6 remove allow nonzero，2 add/一条 Pi install 不允许。plugin add 失败阻断 cleanup，dispatcher 仍执行 Pi，overall exit 1；add 成功则 cleanup 后 Codex ok，Pi继续。当前 timeout/retry/cancel均无，runtime error 未独立分类 | 可以把 probe nonzero称 unavailable，但不可称 runtime error 已分类 | `bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installPi`、`bin/csl-agent-kit.js#hasCommand`、`bin/csl-agent-kit.js#runCommands`、`tests/cli-install-output.test.js:426` |
| K5（R5/P4） | results 由 dispatcher生成；`options.json` 精确分流 inline JSON 与 `printResults`。human color=`createColors`、verbose=`printChangeDetails`；JSON ok/exit 都复用 `results.every`. JSON 无 ANSI/details，human no-color verbose 有 details无 ANSI，语义/exit相同 | main 内 serializer 可称 JSON formatter | `bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#printResults`、`bin/csl-agent-kit.js#createColors`、`bin/csl-agent-kit.js#printChangeDetails`、`tests/cli-install-output.test.js:222` |

源码分支揭示的易错判断：saved state 会影响 yes；external 会阻止显式 target；missing/skip 是 failure；allowFailure 可吞掉 timeout 等未分类 runtime error；任一 throw 会中止 dispatcher；color/verbose 会改变 JSON 或 install semantics。

### Transfer Key

#### K6（T1）

- 新职责必须在 `targets` 声明稳定 id/default/external/run 与可见 metadata；all/help/choices/validation/dispatch 从 registry 派生。
- baseline 与 changed `--yes` 必须完整比较解析 results/exit，证明 `default:false` 未改变默认；显式 dry-run核对 changes 与零 effect；authorization 拒绝核对 state、handler log、exit，不能用未知 target error 替代。
- 可接受替代：本地 symlink handler 可 `external:false`，但要验证交互无 confirm 且正常保存/派发。
- 锚点：`bin/csl-agent-kit.js#targets`、`#resolveInstallTargets`、`#printInstallHelp`、`#installTargets`。

#### K7（T3）

- 策略点是 `installTargets` 循环内 catch；前置失败必须来自真实 Cursor primitive，后续参与必须由真实 registry Codex handler 的 fake executable log证明。
- baseline 两项/有 Codex logs/exit 1 对照 fail-fast 单项/空 Codex log/exit 1，并核对 Cursor sentinel 与已完成 effects。
- missing Codex skip + 后续 Pi log 必须仍为两项 ok、保序、exit 0。
- 可接受替代：交换具体 targets，但必须保留真实 primitive、后续真实参与者、skip 与状态断言。

#### K8（T4）

- timeout 必须传到 `hasCommand` 与 `runCommands` 的每个 spawn call；实现前核对 runtime `result.error`/status/signal contract，资源分类先于普通 status。报告未证明的字段不得写死。
- Codex/Pi 各自覆盖 missing、普通 probe 非零、普通 operation 非零、probe resource failure、operation resource failure、dry-run；fake logs核对精确 argv与次数。
- Codex allowFailure 仅适用于普通 status，不能吞 resource failure；任何 operation/resource failure 前的 completed changes无 rollback，cleanup sentinel 保留，后续 dispatcher target 仍参与，ordered results/exit 1。
- retry/cancellation 未新增时明确断言无，调用一次；若新增则给出 policy与更新后的 exact counts。
- 锚点：`bin/csl-agent-kit.js#hasCommand`、`#runCommands`、`#installCodexPlugin`、`#installPi`、`#removeLegacyCodexSkillLinks`、`#installTargets`。

#### K9（T5）

- discovery payload 必须按 `targets` 声明顺序派生精确 metadata，不运行 handler。
- all 两种形式、target 三种 flag形式、yes 两种形式与位置 target 全部冲突并在 state/resolver/dispatcher 前 exit 2；不能只测一个 selector。
- HOME/PATH/CI/非交互 tests 必须证明 state、prompt、Cursor、Codex、Pi logs/sentinels 均未变化且没有普通 completion；正常 install regression仍进入 resolver/dispatcher。
- 可接受替代：实现为 install option，但仍需同一冲突矩阵和早退/零 effect 断言。

#### K10（T2）

- JSONL 只能消费 `installTargets` 已有 results，在 `main` formatter branch 内实现；不得重跑 handlers或解析 human text。
- JSON 与 JSONL 的 success/failure 两侧都各自覆盖 color/no-color/verbose，比较解析后的完整语义及 exit；只看 target name或 ANSI 不充分。
- human regression 保留 title/summary/details/no ANSI/非机器格式；机器路径不调用 `createColors`/`printChangeDetails`。
- 可接受单 envelope 或 result lines + completion，只要 parser contract固定且归一化后与 `results.every` 一致。

### Completion Standard

人类只有遵循材料开放顺序，先固定 Recall、Prediction、Transfer 三类初始答案，再打开 Key，并满足 K1–K10 的关键判断、因果解释和必要对比分支，才算本轮完成。提前查看 Key 只算复习；本文不创建完成记录、学习画像或进度文件。
