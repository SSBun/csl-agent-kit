# 学习 `bin/csl-agent-kit.js`

## Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-20T00:36:56+0800`
- **Learner assumption**：读者会基础 CommonJS JavaScript、CLI/退出码、同步进程、symlink 与测试断言，但不了解本仓库安装器。
- **Material status**：`学习材料就绪`

该 npm bin 接收 install 的多种 identifier/selector 语法或交互选择，把它们汇成 registry canonical ids，调用 Cursor filesystem、Codex CLI 或 Pi CLI，产生统一 results，再输出 JSON/终端文本与进程状态（`package.json#bin`、`scripts/install.sh`、`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets`）。它不定义被安装内容和外部客户端内部语义（`.codex-plugin/plugin.json#skills`、`package.json#pi`）。

### Registry contract（声明顺序）

| Order | Canonical id | `default` | `external` | Handler | Responsibility | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cursor` | `false` | `false` | `installCursor` | Cursor local plugin symlink | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installCursor` |
| 2 | `codex-plugin` | `true` | `true` | `installCodexPlugin` | Codex marketplace/plugin migration 与 owned legacy cleanup | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installCodexPlugin` |
| 3 | `pi` | `false` | `true` | `installPi` | `pi install <repoRoot>` | `bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#installPi` |

声明顺序派生 all、interactive choices、saved-state filter/save、help、dispatch/results；default 派生 yes/初始预选，external 只控制 interactive consent，run 决定 strategy（`bin/csl-agent-kit.js#resolveInstallTargets`、`#buildInstallChoices`、`#saveInstallSelection`、`#printInstallHelp`、`#installTargets`）。

### Identifier / selector syntax contract（当前实现）

| Exact syntax | Parser action | Split/normalize helper | Shared field | Order semantics |
| --- | --- | --- | --- | --- |
| `--target <list>` | 消费下一个 token，缺失则 `die` | `splitTargets`：逗号拆分、trim、过滤空项 | append 到 `options.targets` | list 内顺序保留 |
| `--targets <list>` | 与 `--target` 相同 | `splitTargets` | append 到 `options.targets` | 与先前 target tokens 串接 |
| `--target=<list>` | 截取 `=` 后内容 | `splitTargets` | append 到 `options.targets` | 输入出现顺序保留 |
| 位置 `<list>`（不以 `-` 开头、且不等于 `all`） | 作为 target list | `splitTargets` | append 到 `options.targets` | 可与 flags 混合/重复 |
| `--all` 或位置 `all` | 置 `options.all=true` | 无 | `options.all` | resolver 中覆盖整个 targets 集合 |
| `--yes/-y` | 置 `options.yes=true` | 无 | `options.yes` | 仅当 all/explicit 均未命中才使用 defaults |

当前没有 alias 或大小写 canonicalization；trim/filter 只是词法清理。parser 先按出现顺序 append，resolver 再按 all → explicit → yes → interactive；explicit 分支先逐项 `validateTargets`，随后 `new Set` 稳定去重，最后 `installTargets` 派发。因而未知 id 即使与合法 id 混合也在任何派发前 exit 2，重复 canonical id 只按首次位置派发一次（`bin/csl-agent-kit.js#parseInstallArgs`、`#splitTargets`、`#resolveInstallTargets`、`#validateTargets`、`#installTargets`）。

### External process contract（当前实现）

| Handler | Probe | Operations | Dry-run | Failure classification | Cleanup | Resource policy | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | `codex --version`，只判断 `status===0` | 6 个 allow-failure remove，随后 required marketplace add、plugin add | probe/operations 均 0 次；返回 8 plans | probe status 不成功→normal skip；remove 普通非零记录并继续；required add 普通非零 throw；`result.error` 未单独检查 | 仅全部 operations 返回后清理 owned legacy links | timeout 无；retry 无；cancellation/signal 无 | `bin/csl-agent-kit.js#installCodexPlugin`、`#hasCommand`、`#runCommands`、`#removeLegacyCodexSkillLinks` |
| Pi | `pi --version`，同一 probe primitive | `pi install <repoRoot>`，required | probe/operation 0 次；返回 1 plan | probe 不成功→skip；operation 普通非零 throw；runtime error 未单独分类 | 无 | timeout 无；retry 无；cancellation/signal 无 | `bin/csl-agent-kit.js#installPi`、`#hasCommand`、`#runCommands` |

源码只证明当前调用点不读取 runtime `error` 且未配置资源策略；不能从本文件猜测特定 Node runtime 在 ENOENT/timeout/signal 时的字段，相关实现必须先核对 runtime contract，再处理普通 status。

### Learning Targets

1. 按顺序判断 command/parser/environment/state/authorization gates 及不可达后续。
2. 从全部输入语法推导 raw ids、selector precedence、validation、稳定去重和 dispatch。
3. 从 registry policy 推导默认/全部/交互/help/handler/result 行为。
4. 解释真实 handler、effect primitive、dispatcher failure isolation 与 successful skip。
5. 推导 Codex/Pi probe、operation、dry-run、非零、cleanup 和资源策略现状。
6. 精确定位统一 results、JSON/human formatters、color/verbose 和共享退出谓词。

前置：JavaScript control flow、`spawnSync`、JSON/ANSI、文件状态及隔离 HOME/PATH 测试。排除：平台内部实现、通用 Node 教程、审计、完整 inventory、change plan。

| Learning Target | Concepts | Representative checkpoint | Prediction / transfer | Key |
| --- | --- | --- | --- | --- |
| LT1 gates | direct exit、admission、state、consent | B1 gate ledger | P1、T5 | K1、K10 |
| LT2 syntax pipeline | split、append order、all precedence、validation-before-dedup、canonical id | B2 syntax convergence | P2、T6 | K2、K11 |
| LT3 registry | order/default/external/run | B2 all/yes/interactive | P2、T1、T5、T6 | K3、K6、K10、K11 |
| LT4 dispatch | primitive、per-item catch、skip | B3 real Cursor failure / Codex skip | P3、T3 | K4、K8 |
| LT5 process | probe/operation、allowFailure、cleanup、runtime/resource boundary | B4 process cases | P3、T4 | K5、K9 |
| LT6 output | result producer、branch、renderers、controls、predicate | B2/B3 output comparison | P4、T2 | K7、K12 |

## Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | Command/direct exit：非 install、install help、parser error 可在 resolver 前结束 | `main` 与 parser 直接分支 | 先固定不可达边界 | `bin/csl-agent-kit.js#main`、`#parseInstallArgs`、`#die` |
| 2 | Syntax convergence：四种 target list 语法都经 `splitTargets` append 到同一数组；all/yes 用独立字段 | parser branch 与 helper | identifier 语法不能被藏在“parser 会处理”中 | `bin/csl-agent-kit.js#parseInstallArgs`、`#splitTargets` |
| 3 | Selection pipeline：all precedence；explicit 时 validation 在稳定去重前 | resolver 源码顺序 | 解释 unknown 与 duplicate 的差别 | `bin/csl-agent-kit.js#resolveInstallTargets`、`#validateTargets` |
| 4 | Registry policy：canonical id/order/default/external/run 的共同事实源 | 多个消费者迭代 `targets` | 连接可见性、授权与策略 | `bin/csl-agent-kit.js#targets` |
| 5 | Interactive state machine：environment → prompt dependency → load → select → authorize → save | resolver 语句顺序 | 判断 state/effect 是否可达 | `bin/csl-agent-kit.js#resolveInstallTargets`、`#loadInstallSelection`、`#saveInstallSelection` |
| 6 | Effect primitive：dry-run 在 symlink/command/remove 边界返回计划 | primitives 检查 `options.dryRun` | changes 不等于再次执行 | `bin/csl-agent-kit.js#ensureSymlink`、`#runCommands`、`#removeLegacyCodexSkillLinks` |
| 7 | Probe/operation：Codex/Pi 真实模式先 `<cmd> --version` | handler availability branch | 区分 missing 与 operation failure | `bin/csl-agent-kit.js#hasCommand`、`#installCodexPlugin`、`#installPi` |
| 8 | Runtime boundary：只读取 status/stdout/stderr；无 timeout/retry/cancel | 两个 spawn call sites | 不猜测未证明的错误字段 | `bin/csl-agent-kit.js#hasCommand`、`#runCommands` |
| 9 | Ordered failure isolation：循环内 try/catch 生成统一同序 results | dispatcher | 连接后续参与者与 exit | `bin/csl-agent-kit.js#installTargets` |
| 10 | Successful skip：probe 不成功由 handler 正常 return | Codex/Pi missing branches | 未执行 operation 不等于失败 | `bin/csl-agent-kit.js#installCodexPlugin`、`#installPi` |
| 11 | Output projection：JSON inline serializer 与 `printResults` 在 results 后分流 | `main` | 分离语义与呈现 | `bin/csl-agent-kit.js#main`、`#printResults`、`#createColors`、`#printChangeDetails` |

## Guided Code Walkthrough

### B1：安装前 gate ledger

选择理由：先分清直接退出，才能解释为什么某些调用没有 state、prompt 或 effect。

| Order | Gate / condition | Channel / exit | Unreachable afterwards | Evidence |
| --- | --- | --- | --- | --- |
| 1 | command 非 install | top help stdout；正常结束 | parser/resolver/state/dispatch | `bin/csl-agent-kit.js#main`、`#printHelp` |
| 2 | install help | install help stdout；exit 0 | resolver/state/dispatch | `bin/csl-agent-kit.js#parseInstallArgs`、`#printInstallHelp` |
| 3 | parser error | stderr；exit 2 | resolver/state/dispatch | `bin/csl-agent-kit.js#parseInstallArgs`、`#die` |
| 4 | all/explicit/yes；explicit unknown | 合法 selection early return；unknown stderr/2 | 三者绕过 interactive；unknown 零 effect | `bin/csl-agent-kit.js#resolveInstallTargets`、`#validateTargets` |
| 5 | interactive 非 TTY 或 CI | stderr/2 | prompt dependency/state/consent/save/dispatch | `bin/csl-agent-kit.js#resolveInstallTargets` |
| 6 | prompts load failure | stderr/2 | state/consent/save/dispatch | `bin/csl-agent-kit.js#resolveInstallTargets` |
| 7 | state load/selection | invalid/missing state 回退 defaults | unknown saved ids被过滤 | `bin/csl-agent-kit.js#loadInstallSelection`、`#buildInstallChoices` |
| 8 | cancel / external consent reject | stderr/2 | save/dispatch/completion | `bin/csl-agent-kit.js#resolveInstallTargets`、`#targets` |
| 9 | state save | failure 仅 warning；继续 | 只有偏好可能未更新 | `bin/csl-agent-kit.js#saveInstallSelection`、`#resolveInstallTargets` |
| 10 | dispatch | results → output → 0/1 | — | `bin/csl-agent-kit.js#main`、`#installTargets` |

### B2：语法汇流与 dry-run all

选择理由：组合语法揭示 append/order/precedence，而 all dry-run 覆盖 registry 和无副作用输出。

| Checkpoint | Prediction | Inspect | Observation / consequence |
| --- | --- | --- | --- |
| B2.1 | `--target cursor,pi codex-plugin --targets pi` 的 raw order | parser + split | `targets=[cursor,pi,codex-plugin,pi]`；validate 全部后 Set 得 `[cursor,pi,codex-plugin]`（`bin/csl-agent-kit.js#parseInstallArgs`、`#splitTargets`、`#resolveInstallTargets`） |
| B2.2 | 加 `--all` 后 explicit 是否仍 validation | resolver | all 第一条 return，explicit/unknown 均被覆盖；selection 为 registry order（`bin/csl-agent-kit.js#resolveInstallTargets`） |
| B2.3 | `--all --dry-run --json --color` 是否 probe/ANSI | handlers + main | probe/operation 0；plans 为 Cursor 1、Codex 8、Pi 1；JSON 可解析无 ANSI，三 results ok，exit 0（`bin/csl-agent-kit.js#runCommands`、`#main`；`tests/cli-install-output.test.js:222`） |

### B3：dispatcher 真实 failure / skip

选择理由：用具体 registry handlers 而非 fake adapter 证明 continue policy。

| Checkpoint | Setup | Observation / consequence | Evidence |
| --- | --- | --- | --- |
| B3.1 Cursor failure | 隔离 HOME 的 Cursor target 预置普通文件 | `ensureSymlink` throw；cursor failed，文件不变 | `bin/csl-agent-kit.js#installCursor`、`#ensureSymlink` |
| B3.2 later Codex | selection `cursor,codex-plugin`，fake Codex 记录 argv | Codex probe + 8 operations 仍参与；results 同序，exit 1，完成 effects不回滚 | `bin/csl-agent-kit.js#installTargets`、`#installCodexPlugin` |
| B3.3 successful skip | selection `codex-plugin,pi`，PATH 无 Codex、仅 fake Pi | Codex ok/skip，Pi probe+operation继续；results 同序，exit 0 | `bin/csl-agent-kit.js#installCodexPlugin`、`#installPi`、`#main` |

### B4：process / cleanup cases

选择理由：外部 process 是主要 effect 边界，必须按 probe、operation、cleanup 分类。

| Case | Exact calls | Classification / state | Evidence |
| --- | --- | --- | --- |
| dry-run | Codex/Pi probe 0、operation 0 | planned changes，成功 | handlers、`bin/csl-agent-kit.js#runCommands` |
| probe nonzero | 一次 `<cmd> --version`，operation 0 | normal skip，target ok | `bin/csl-agent-kit.js#hasCommand` |
| Codex remove nonzero | probe 1，operation 到该 remove 后继续 | allowed status记录；required adds成功后 cleanup | `bin/csl-agent-kit.js#runCommands` |
| Codex required / Pi operation nonzero | probe 1，operation到失败点 | throw→failed result；Codex cleanup不可达；后续 target继续 | `bin/csl-agent-kit.js#installCodexPlugin`、`#installPi`、`#installTargets`；`tests/cli-install-output.test.js:426` |
| runtime/resource error | 当前无 timeout/signal且不读取 `result.error` | 未独立分类，不得猜字段 | `bin/csl-agent-kit.js#hasCommand`、`#runCommands` |

## Human Recall, Prediction & Transfer Checks

### Material opening order

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Key 和源码，只看 Recall prompts。
2. **Prediction**：正文可见，Key/源码隐藏；固定预测和理由。
3. **Transfer**：正文/源码可见，Key隐藏；固定入口、影响、验证位置和理由。
4. 三类答案均固定后再打开 Key 核对。

提前看 Key 只算复习；重测须换等价 prompts。Agent 不设主动回忆通过，只有报告外 sealed held-out task 可评价报告支持度。

### Recall prompts

- **R1**：按顺序说明主要行为前的 gates 与不可达 state/effects。
- **R2**：列出全部 target/all/yes 精确语法，并说明 split、append、precedence、validation、stable dedup、dispatch 的顺序。
- **R3**：列出 registry canonical ids/order/default/external/handlers 及消费者。
- **R4**：解释真实 failure、successful skip 与 later target participation。
- **R5**：说明 Codex/Pi probe/operations/dry-run/nonzero/cleanup/resource policy。
- **R6**：定位 results、format branch、renderers、color/verbose 与 exit predicate。

### Prediction prompts

- **P1**：CI 中执行 `install --json`，saved state 有 cursor/pi。预测 state/prompt/effect、channel、exit。
- **P2**：执行 `install --target cursor,pi codex-plugin --targets pi --target=cursor --dry-run --json`。写出 parser targets、validation/dedup 后 selection、results 与 exit；再加 `--all bad-id` 比较。
- **P3**：Codex 一个 remove status 7、plugin add status 9，随后 Pi 可用。预测 exact calls、cleanup、ordered results、Pi participation、exit。
- **P4**：同一 success results 使用 JSON+color+verbose 与 human no-color+verbose，比较 parsed semantics、ANSI/details、exit。

### Transfer prompts

#### T1：增加非默认 target

增加 `default:false` 的 `claude-plugin` canonical id 与真实 handler，按 effect 设置 external。成对验证 yes baseline unchanged；显式 dry-run 只有新 target plans、零 effect；交互拒绝时 state/log不变、exit 2；all/help/choices 顺序从 registry 派生。位置：`tests/cli-install-output.test.js`、`package.json#scripts.test:cli`；不执行。

#### T2：增加 JSONL formatter

只改 parser option 与 `main` 中 results 后分流。对 success/required failure，JSON baseline 与 JSONL 变化均分别叠加 color/no-color/verbose，解析并比较完整 ok/ordered results/changes-error/exit；机器无 ANSI/extra lines。保留 human no-color verbose 的 title/summary/details/非机器格式回归。

#### T3：dispatcher fail-fast

Cursor 普通文件经真实 primitive 前置失败，fake Codex 记录后续。baseline 两 results+Codex calls+exit1，对照 fail-fast 单 result+空 Codex log+exit1；核对 Cursor state及已完成 effect。missing Codex + fake Pi 对照必须继续、两项 ok、保序、exit0。

#### T4：operation timeout

timeout 同时传 probe/operation；实现前核对实际 Node runtime 的 error/status/signal contract，先分类 resource error再处理普通 status。Codex/Pi 可观察 fake 均记录精确 argv/count，分别覆盖 missing、probe普通非零、operation普通非零/allowFailure、probe timeout、operation timeout、dry-run。资源失败不得被 Codex allowFailure 吞掉；Codex cleanup sentinel保持，后续 Pi继续，ordered results/exit1。retry/cancel 若未加入则明确无且每次仅一次；若加入须声明策略和新 counts。

#### T5：`list-targets` discovery

payload 按 registry 顺序派生 id/title/description/default/external。与 `--all`/位置 all、`--target`/`--targets`/`--target=...`、yes/-y、位置 target 全部冲突为 stderr/2。早退在 resolver/state/dispatcher 前；隔离 HOME/PATH/CI/非交互并设置 state/prompt/Cursor/process sentinels，断言全部不变且无 install completion；保留普通 install 回归。

#### T6：增加 `codex` → `codex-plugin` alias

alias 只能在输入边界存在；规范化必须先于 validation 和 stable dedup。覆盖所有汇流语法：`--target codex`、`--targets codex`、`--target=codex`、位置 `codex`，以及每种语法的逗号 list、重复 flag、alias/canonical 混合。还要覆盖 v1 saved selection 中 alias 的迁移：load 后、choices value、save 后 bytes 均只含 canonical id；registry/default/all/interactive/handler/result 也只出现 `codex-plugin`。

用 `codex --target codex-plugin --targets cursor,codex --target=codex,cursor` 验证 canonicalization 后再 validation/dedup，selection/results 为 `[codex-plugin,cursor]`，每个只一次。dry-run 断言一个 canonical Codex result、8 plans、零 process；actual 用记录 argv 的 fake Codex，断言恰好一次 `--version` 与八个 operations，result target仍 canonical。unknown id 在 state/effect 前 stderr/2。all 与 yes 仍直接来自 registry canonical ids，不受 alias 条目扩张。

## Verification Key & Completion Standard

| Key | 必须判断 | 可接受替代表述 | Anchors / contrast |
| --- | --- | --- | --- |
| K1（R1/P1） | gate 顺序 command→parser→selector→environment→dependency→state→authorization→save→dispatch；CI 无 selector 在 state 前 stderr/2，json不接管 admission error | environment/dependency可合称 admission | `bin/csl-agent-kit.js#main`、`#parseInstallArgs`、`#resolveInstallTargets`、`#die` |
| K2（R2/P2） | 四种 target list语法均 split/append；all/yes独立。explicit先validate再Set去重再dispatch。P2 raw `[cursor,pi,codex-plugin,pi,cursor]`→`[cursor,pi,codex-plugin]`; 加 all 时 registry order且 bad-id不validation | stable unique=首次顺序去重 | `#parseInstallArgs`、`#splitTargets`、`#resolveInstallTargets`、`#validateTargets` |
| K3（R3） | cursor(false,false)、codex-plugin(true,true)、pi(false,true) 及对应 handlers/order；policy消费者准确 | 非默认/默认、local/external表述可接受 | `bin/csl-agent-kit.js#targets` 及 consumers |
| K4（R4） | 循环内 catch继续；throw failed，skip normal ok；真实 Cursor failure 后 Codex仍参与，missing Codex 后 Pi仍参与 | continue-on-error/successful no-op | `#installTargets`、`#ensureSymlink`、Codex/Pi handlers |
| K5（R5/P3） | probes精确 `--version`；Codex 6 remove allow普通非零，2 add/Pi install required；plugin add失败阻止cleanup但Pi继续，overall1。timeout/retry/cancel无，runtime error未独立分类 | unavailable=probe status不成功 | `#hasCommand`、`#runCommands`、`#installCodexPlugin`、`#installPi`、`:426` |
| K7（R6/P4） | results在dispatcher；json精确分流inline serializer/human renderer；color/createColors、verbose/printChangeDetails仅human；ok/exit共享every | main JSON formatter | `#main`、`#printResults`、`#createColors`、`#printChangeDetails`、`:222` |

源码分支揭示的易错判断：trim等于alias canonicalization；dedup发生在validation前；all仍validate explicit tokens；saved state影响yes；external阻止显式选择；skip是failure；allowFailure可安全吞runtime resource error；JSON受color/verbose改变。

### Transfer Keys

- **K6（T1）**：新 id/default/external/run 位于 registry；yes baseline完整语义不变；显式 dry-run零effect；consent拒绝核对state/log/exit；all/help/choices从声明顺序派生。可接受 local external:false，但需无confirm对照。锚点：`#targets`、`#resolveInstallTargets`、`#printInstallHelp`、`#installTargets`。
- **K8（T3）**：策略点是 dispatcher循环内catch；failure来自真实 Cursor primitive，后续由 Codex log证明；baseline/fail-fast核对results、logs、state、exit、已完成effects；skip+Pi对照保持ok/继续。可交换真实targets但不可用抽象adapter。
- **K9（T4）**：timeout进入每个probe/operation；实现前核对runtime contract且resource分类先于status；Codex/Pi各覆盖missing、普通probe/operation、resource probe/operation、dry-run与exact calls；resource failure阻止cleanup、后续target继续、exit1；retry/cancel明确有无。
- **K10（T5）**：discovery按registry精确派生；所有selector拼写冲突；state/resolver/dispatch前退出；HOME/PATH/CI tests证明state/prompt/adapters/process/completion均未产生；普通install回归保留。
- **K11（T6）**：所有CLI list语法与saved state都在validation/dedup前 canonicalize；registry/default/all/interactive/state/handler/result只用canonical。混合 alias/canonical dry-run只一result/8plans/零call，actual只一次probe+8 operations；unknown仍effect前失败。可接受 alias不迁移旧state，但此时必须明确把alias state视为invalid并证明load/choices/save仍只canonical；CLI覆盖不可省。
- **K12（T2）**：JSONL消费现有results，不重跑handlers；JSON/JSONL success/failure两侧均覆盖color/no-color/verbose并比较parsed full semantics/exit；human title/summary/details/noANSI/非机器回归保留。envelope或result-lines均可，只要parser contract固定。

### Completion Standard

人类必须按开放顺序先固定 Recall、Prediction、Transfer，再打开 Key，并满足 K1–K12 的判断、因果与对比分支，才算本轮完成。提前看 Key 只算复习；不创建完成记录、学习画像或进度文件。
