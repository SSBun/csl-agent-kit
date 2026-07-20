# `bin/csl-agent-kit.js` 源码学习指南

## Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-20T00:59:23+0800`
- **Learner assumption**：读者会 CommonJS JavaScript、CLI、同步 child process、symlink/realpath 与测试断言，但没有该安装器的心智模型。
- **Material status**：`学习材料就绪`

该 npm bin 将 install 的多种 token 语法或交互答案解析为 registry canonical ids，调用 Cursor filesystem、Codex CLI、Pi CLI，形成统一 results 后选择 JSON 或 terminal renderer 并退出（`package.json#bin`、`scripts/install.sh`、`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets`）。被安装内容和客户端内部实现位于 scope 外（`.codex-plugin/plugin.json#skills`、`package.json#pi`）。

### Registry policy（源码声明顺序）

| Order | Canonical id | Default | External | Handler | Observable responsibility | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cursor` | false | false | `installCursor` | HOME 下 Cursor plugin symlink | `bin/csl-agent-kit.js#targets`、`#installCursor` |
| 2 | `codex-plugin` | true | true | `installCodexPlugin` | Codex lifecycle commands + owned legacy-link cleanup | `bin/csl-agent-kit.js#targets`、`#installCodexPlugin` |
| 3 | `pi` | false | true | `installPi` | `pi install <repoRoot>` | `bin/csl-agent-kit.js#targets`、`#installPi` |

声明顺序驱动 all、interactive choices、state filter/save、help、dispatch/results；default 驱动 yes/默认预选，external 仅驱动 interactive consent，handler 决定 strategy（`bin/csl-agent-kit.js#resolveInstallTargets`、`#buildInstallChoices`、`#saveInstallSelection`、`#printInstallHelp`、`#installTargets`）。

### Input convergence 与带值 option 分层

| Exact syntax | Token acceptance / helper | Shared field | Semantic validation | Order / consumer |
| --- | --- | --- | --- | --- |
| `--target <list>` | parser 消费下一 token；缺值立即 `die`；`splitTargets` 逗号 split/trim/filter | append `options.targets` | resolver 的 `validateTargets` 对每个 id 查 registry | 输入/list 顺序保留；随后 Set 稳定去重、dispatcher消费 |
| `--targets <list>` | 同上 | append `options.targets` | 同上 | 与前序 tokens 串接 |
| `--target=<list>` | parser 截取等号后文本，再 `splitTargets` | append `options.targets` | 同上 | 出现顺序保留 |
| positional `<list>`（非 `all`） | parser 将 token 交 `splitTargets` | append `options.targets` | 同上 | 可混合/重复 |
| `--all` / positional `all` | parser 只置 `options.all=true` | `options.all` | 无 value validation | resolver 第一优先，覆盖 explicit targets |
| `--yes/-y` | parser 置 true | `options.yes` | 无 value validation | all/explicit 均未命中时消费 registry defaults |

当前无 alias/case canonicalization；`splitTargets` 仅做词法清理。explicit 流程严格是：parser append → resolver 选择 explicit → validation → `new Set` 稳定去重 → dispatcher。带值 target option 的 parser 只负责 token/缺值，identifier 语义在 resolver 才检查；unknown stderr/exit 2，且 state/effect 为零（`bin/csl-agent-kit.js#parseInstallArgs`、`#splitTargets`、`#resolveInstallTargets`、`#validateTargets`）。当前其余 options 无自由 value，故没有现成 realpath/stat/range normalization。

### External process contract

| Handler | Probe | Operations | Dry-run | Classification | Cleanup | Resource policy | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | `codex --version`，只判 `status===0` | 6 个 allow-failure remove，required marketplace add、plugin add | probe/operation 均跳过，返回 8 plans | probe不成功→normal skip；remove普通非零记录；required普通非零throw；runtime `error` 未独立分类 | operations 全部返回后才 cleanup | timeout无；retry无；cancel/signal无 | `bin/csl-agent-kit.js#installCodexPlugin`、`#hasCommand`、`#runCommands`、`#removeLegacyCodexSkillLinks` |
| Pi | `pi --version` | required `pi install <repoRoot>` | probe/operation均跳过，返回 plan | probe不成功→skip；operation普通非零throw；runtime error未独立分类 | 无 | timeout无；retry无；cancel/signal无 | `bin/csl-agent-kit.js#installPi`、`#hasCommand`、`#runCommands` |

源码未读取 `spawnSync` 的 runtime `error` 字段；不能猜测具体 Node 版本在 ENOENT/timeout/signal 时的字段，资源策略实现必须先核对 runtime contract，再处理普通 status。

### Effect context matrix（当前实现）

| Effect / handler | Primitive | argv | cwd | env / PATH | Path/source/ownership root | Guard / dry-run | Failure / cleanup | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cursor link | `ensureSymlink` | 不经过 process | 不适用 | HOME 由 `os.homedir()` | target=`HOME/.cursor/plugins/local/csl`；source=`realpath(repoRoot)` | dry-run 在 mkdir/lstat/unlink/symlink 前返回 plan | 普通文件冲突 throw；无 rollback | `bin/csl-agent-kit.js#installCursor`、`#ensureSymlink`、`#home` |
| Codex availability | `hasCommand`→`spawnSync` | `codex --version` | 未传 `cwd`，继承 CLI process 当前 cwd | 未传 `env`，继承单次调用环境/PATH | 无 filesystem ownership | `!dryRun` 才 probe | 不成功变 skip；无 cleanup | `bin/csl-agent-kit.js#installCodexPlugin`、`#hasCommand` |
| Codex operations | `runCommands`→`spawnSync` | 八个 registry-internal command tuples；marketplace add 参数含 `repoRoot` | 显式 `cwd: repoRoot` | 未传 env，继承单次调用环境/PATH | command root=`repoRoot` | dry-run 在 spawn 前记录 plan | required failure throw；全部成功后才 legacy cleanup | `bin/csl-agent-kit.js#installCodexPlugin`、`#runCommands` |
| Pi availability | `hasCommand` | `pi --version` | 继承 CLI process cwd | 继承 env/PATH | 无 | `!dryRun` | 不成功变 skip | `bin/csl-agent-kit.js#installPi`、`#hasCommand` |
| Pi operation | `runCommands` | `pi install <repoRoot>` | 显式 `cwd: repoRoot` | 继承 env/PATH | argv root=`repoRoot` | dry-run零spawn | 非零throw；无 cleanup | `bin/csl-agent-kit.js#installPi`、`#runCommands` |
| Legacy cleanup | filesystem APIs | 不经过 process | 不适用 | HOME 由 `os.homedir()` | ownership=`realpath(repoRoot/skills)`；scan=`HOME/.agents/skills` | Codex commands完成后；dry-run只返回 remove plans | 仅 owned symlink unlink；无 rollback | `bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`、`#isWithin` |

所有 cwd/env 都是单次 `spawnSync` context：代码没有 `process.chdir` 或修改全局 environment。probe 继承调用进程 cwd，operation 明确使用 repoRoot；filesystem effects始终由 repoRoot/HOME 构造。

### Learning Targets

1. 按顺序判断 command/parser/environment/state/authorization gates 及不可达后续。
2. 从全部输入语法推导 raw identifiers、validation、stable dedup、selection/dispatch。
3. 从 registry policy 推导 default/all/interactive/help/handler/result。
4. 解释 handler/primitive、真实失败、后续参与和 successful skip。
5. 推导 process probe/operation、cwd/env/path context、dry-run、failure、cleanup 与资源策略。
6. 定位统一 results、machine/human formatters、color/verbosity 与 exit predicate。

前置：JS control flow、spawnSync、JSON/ANSI、filesystem context、隔离 HOME/PATH 测试。排除平台内部实现、通用 API 教程、审计与 change plan。

| Target | Concepts | Representative behavior | Check | Key |
| --- | --- | --- | --- | --- |
| LT1 | gate/direct exit/state | B1 gate ledger | P1、T5、T7 | K1、K10、K12 |
| LT2 | syntax/helper/value layering | B2 mixed syntax | P2、T6、T7 | K2、K11、K12 |
| LT3 | registry policy | B2 all/yes/interactive | P2、T1、T5、T6 | K3、K6、K10、K11 |
| LT4 | dispatcher/failure/skip | B3 real participants | P3、T3 | K4、K8 |
| LT5 | process/effect context | B4 context cases | P3、P4、T4、T7 | K5、K9、K12 |
| LT6 | output projection | B2/B3 output contrasts | P5、T2 | K7、K13 |

## Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | Direct exits：non-install/help/parser error在 resolver前结束 | main/parser branches | 先固定不可达后续 | `bin/csl-agent-kit.js#main`、`#parseInstallArgs`、`#die` |
| 2 | Syntax convergence：四种 value/positional语法经 `splitTargets` append；all/yes独立 | parser branches | 显式展示 helper与顺序 | `#parseInstallArgs`、`#splitTargets` |
| 3 | Token vs semantic validation：parser管缺值；resolver管 registry id | 两层函数边界 | 为 future context option建立正确 gate | `#parseInstallArgs`、`#resolveInstallTargets`、`#validateTargets` |
| 4 | Selection precedence：all→explicit→yes→interactive；validation→Set→dispatch | resolver order | 推导unknown/duplicate/all覆盖 | `#resolveInstallTargets`、`#installTargets` |
| 5 | Registry policy | 多消费者迭代 `targets` | 连接顺序/default/external/handler | `#targets` |
| 6 | Interactive state machine：environment→dependency→load→select→authorize→save | resolver statements | 判断state/effect可达性 | `#resolveInstallTargets`、`#loadInstallSelection`、`#saveInstallSelection` |
| 7 | Effect context：repoRoot/HOME/继承cwd/显式operation cwd各自独立 | call-site options/path constructors | 避免暗示全局cwd/env变化 | `#repoRoot`、`#home`、`#hasCommand`、`#runCommands` |
| 8 | Process classification：probe、operation、allowFailure、runtime boundary、无资源策略 | spawn call sites | 分清missing/普通非零/未证明runtime error | `#hasCommand`、`#runCommands` |
| 9 | Failure isolation/skip | loop内catch与normal return | 连接later target和exit | `#installTargets`、Codex/Pi handlers |
| 10 | Result projection | results后精确分流 JSON/human | 分离语义与呈现 | `#main`、`#printResults`、`#createColors`、`#printChangeDetails` |

## Guided Code Walkthrough

### B1：pre-effect gate ledger

| Order | Gate | Channel / exit | Unreachable afterwards | Anchors |
| --- | --- | --- | --- | --- |
| 1 | command非install | top help stdout；正常结束 | parser/resolver/state/effect | `#main`、`#printHelp` |
| 2 | install help | stdout；exit0 | resolver/state/effect | `#parseInstallArgs`、`#printInstallHelp` |
| 3 | unknown option / missing target value | stderr；exit2 | semantic validation/state/effect | `#parseInstallArgs`、`#die` |
| 4 | all/explicit/yes；explicit unknown | legal early selection；unknown stderr/2 | 三者绕过interactive；unknown零state/effect | `#resolveInstallTargets`、`#validateTargets` |
| 5 | interactive non-TTY/CI | stderr/2 | prompt dependency/state/auth/effect | `#resolveInstallTargets` |
| 6 | prompts load failure | stderr/2 | state/auth/effect | `#resolveInstallTargets` |
| 7 | state load/selection | invalid/missing回退default | unknown saved ids过滤 | `#loadInstallSelection`、`#buildInstallChoices` |
| 8 | cancel/external reject | stderr/2 | save/dispatch/completion | `#resolveInstallTargets`、`#targets` |
| 9 | save | failure只warning | dispatcher仍可达 | `#saveInstallSelection`、`#resolveInstallTargets` |
| 10 | dispatcher | result output；exit0/1 | — | `#main`、`#installTargets` |

选择理由：先区分每种零-effect原因，避免把 parser、admission 与 authorization 混成一种失败。

### B2：mixed syntax 与 all dry-run

| Checkpoint | Prediction / observation | Causal result | Anchors |
| --- | --- | --- | --- |
| B2.1 `--target cursor,pi codex-plugin --targets pi --target=cursor` | parser targets=`[cursor,pi,codex-plugin,pi,cursor]`；validate全体后Set | selection/results=`[cursor,pi,codex-plugin]` | `#parseInstallArgs`、`#splitTargets`、`#resolveInstallTargets` |
| B2.2 添加 `--all bad-id` | all first return，不进入explicit validation | selection为registry order，bad-id不触发error | `#resolveInstallTargets` |
| B2.3 all/dry-run/json/color | process 0次；Cursor1/Codex8/Pi1 plans；JSON无ANSI | 三项ok、exit0 | handlers、`#runCommands`、`#main`、`tests/cli-install-output.test.js:222` |

选择理由：最小组合同时展示语法汇流、顺序、precedence、registry与machine output。

### B3：real failure 与 successful skip

| Setup | Observable result | Anchors |
| --- | --- | --- |
| HOME中Cursor target为普通文件；selection `cursor,codex-plugin`；fake Codex记录 | Cursor failed且文件不变；Codex probe+8 operations仍执行；results同序、exit1、已完成effect不回滚 | `#ensureSymlink`、`#installTargets`、`#installCodexPlugin` |
| PATH无Codex、仅fake Pi；selection `codex-plugin,pi` | Codex ok/skip，Pi probe+operation继续；results同序、exit0 | `#installCodexPlugin`、`#installPi`、`#main` |

选择理由：以真实 registry handlers证明 continue策略与normal skip。

### B4：process 与 context cases

| Case | Exact calls/context | Classification/state | Anchors |
| --- | --- | --- | --- |
| dry-run | probes/operations 0；filesystem也不变 | planned results | handlers/primitives |
| Codex/Pi probe | `<cmd> --version`；cwd继承CLI process；env/PATH继承 | 不成功→skip | `#hasCommand` |
| operations | exact tuples；cwd显式repoRoot；env继承 | Codex remove普通非零允许；required/Pi非零throw | `#runCommands`、handlers |
| Codex cleanup | 无process；HOME scan + repoRoot/skills ownership | commands全返回后才执行 | `#removeLegacyCodexSkillLinks`、`:426` |
| Cursor | 无process；HOME target + repoRoot source | 普通文件冲突throw | `#installCursor`、`#ensureSymlink` |
| runtime/resource | 无timeout/signal；不读取result.error | 未独立分类，不猜字段 | `#hasCommand`、`#runCommands` |

选择理由：context matrix的代表行为使 probe继承cwd、operation repoRoot cwd和非process paths可直接比较。

## Human Recall, Prediction & Transfer Checks

### Material order

1. Recall 隐藏正文/Key/源码，只看 prompts；2. Prediction 正文可见、Key/源码隐藏；3. Transfer 正文/源码可见、Key隐藏；4. 全部初始答案固定后打开Key。提前看Key只算复习；Agent只由报告外sealed held-out task评价支持度。

### Recall prompts

- R1：按顺序说明全部pre-effect gates和不可达后续。
- R2：列出全部target/all/yes语法、helper、共同字段及token接受→semantic validation→dedup→dispatch。
- R3：列出registry顺序/default/external/handlers及消费者。
- R4：解释real failure、skip、later target。
- R5：对每个effect说明argv、cwd、env、path/root、guard、dry-run、failure、cleanup、resource policy。
- R6：定位results、formatters、color/verbose、exit predicate。

### Prediction prompts

- P1：CI中`install --json`且saved state有cursor/pi；预测state/prompt/effect/channel/exit。
- P2：预测B2.1 raw targets/selection/results；再加all+bad-id比较。
- P3：Codex remove status7、plugin add status9，Pi可用；预测calls/cleanup/results/Pi/exit。
- P4：从任意目录调用CLI；预测Codex/Pi probe PWD、operation PWD/argv、Cursor source与cleanup roots。
- P5：同一success results用JSON+color+verbose与human no-color+verbose，比较semantic/ANSI/details/exit。

### Transfer prompts

- **T1 非默认target**：增加default:false `claude-plugin` 与真实handler；yes baseline不变；显式dry-run仅plans零effect；拒绝consent时state/log不变exit2；all/help/choices由registry顺序派生。验证位置`tests/cli-install-output.test.js`、`package.json#scripts.test:cli`，不执行。
- **T2 JSONL**：仅parser flag/main formatter；JSON/JSONL success/failure两侧各覆盖color/no-color/verbose，parse后比较完整results/exit；机器无ANSI/extra lines；保留human no-color verbose title/summary/details/非机器回归。
- **T3 fail-fast**：真实Cursor普通文件前置失败+fake Codex later log；baseline两results/有calls/exit1，对照fail-fast单result/空log/exit1，核对state/已完成effects；missing Codex+fake Pi仍两项ok/继续/exit0。
- **T4 timeout**：probe/operation均传timeout；实现前核对Node runtime error contract，resource分类先于status。Codex/Pi fake记录精确argv/count，分别覆盖missing、probe普通非零、operation普通非零/allowFailure、probe timeout、operation timeout、dry-run；resource不被allowFailure吞，cleanup sentinel保持，后续target继续，exit1；retry/cancel明确有无。
- **T5 list-targets**：payload按registry metadata/order派生；与all两种、target三种、yes两种、位置target全冲突stderr/2；state/resolver/dispatcher前返回；隔离HOME/PATH/CI并断言state/prompt/filesystem/process/completion均无，保留install回归。
- **T6 alias**：增加`codex`→`codex-plugin`，覆盖`--target`/`--targets`/`--target=`/position及逗号/repeat/mixed；canonicalize在validation/dedup前。registry/default/all/interactive/state/handler/result只canonical。mixed alias+canonical dry-run一result/8plans/零process，actual恰一probe+8ops；unknown effect前失败。
- **T7 `--operation-cwd <dir>`**：parser只接受token/缺值，默认null；`main` install boundary在resolver/state/effect前做realpath与directory validation，absent归一为repoRoot。missing/不存在/not-directory均stderr/exit2，selection bytes、prompt、Cursor与process logs全不变。只把canonical cwd传给`runCommands` operations；`hasCommand` probes仍继承调用进程cwd，argv中的repoRoot不变，Cursor source/target与cleanup ownership/HOME不变，禁止`process.chdir`或全局env修改。HOME/PATH隔离下fake Codex/Pi记录精确argv/PWD/count：custom cwd时probe PWD=调用cwd，operations PWD=custom；dry-run零process且plans不变。用Cursor→Codex required failure→Pi证明先前effect不回滚、后续Pi仍收到custom cwd、results保序/exit1。

## Verification Key & Completion Standard

| Key | 必须判断 | 可接受表述 | Anchors |
| --- | --- | --- | --- |
| K1 R1/P1 | gate顺序command→parser→selector→environment→dependency→state→authorization→save→dispatch；CI无selector在state前stderr/2，json不格式化admission error | environment/dependency可合并 | `#main`、`#parseInstallArgs`、`#resolveInstallTargets`、`#die` |
| K2 R2/P2 | 四种target list语法split/append；all/yes独立；explicit validation→Set→dispatch。B2.1 raw五项→三项；all覆盖bad-id不validation | stable unique=首次顺序 | `#parseInstallArgs`、`#splitTargets`、`#resolveInstallTargets`、`#validateTargets` |
| K3 R3 | cursor(false,false)、codex-plugin(true,true)、pi(false,true)及handlers/order；消费者准确 | 默认/非默认、需/无需consent | `#targets`及consumers |
| K4 R4 | loop内catch继续；throw failed、skip normal ok；Cursor failure后Codex、missing Codex后Pi | continue-on-error/successful no-op | `#installTargets`、handlers/primitives |
| K5 R5/P3/P4 | probes `--version`继承cwd；operations显式repoRoot cwd/env继承；Cursor/cleanup用HOME+repoRoot。Codex6 remove allow status，2 add/Pi required；plugin add失败无cleanup但Pi继续；resource无独立分类 | unavailable=probe不成功 | `#hasCommand`、`#runCommands`、handlers、`:426` |
| K7 R6/P5 | results由dispatcher；json精确分流inline serializer/human；colors/verbose只human；ok/exit共享every | main JSON formatter | `#main`、`#printResults`、`#createColors`、`#printChangeDetails`、`:222` |

源码分支揭示的易错判断：parser已做identifier semantic validation；trim等于canonicalization；dedup在validation前；all仍validate explicit；operation与probe cwd相同；runCommands改变全局cwd/env；external阻止显式调用；skip是failure；allowFailure可吞runtime resource error；JSON受color/verbose影响。

### Transfer Keys

- **K6 T1**：registry内声明id/default/external/run；yes完整baseline不变；显式dry-run零effect；consent拒绝核对state/log/exit；all/help/choices自动派生。local external:false可接受但需无confirm对照。
- **K8 T3**：策略点dispatcher loop catch；failure来自真实Cursor primitive，later由Codex log证明；baseline/fail-fast核对results/log/state/exit/已完成effects；skip+Pi对照继续。
- **K9 T4**：timeout进入每个probe/operation，runtime contract先核对且resource先于status；Codex/Pi逐类exact calls；resource阻止cleanup、later target继续；retry/cancel明确。
- **K10 T5**：registry-derived payload、全部selector冲突、state/resolver/dispatch前返回；隔离context证明state/prompt/fs/process/completion均零；install回归。
- **K11 T6**：所有CLI语法在validation/dedup前canonicalize；registry/default/all/interactive/state/handler/result只canonical；dry-run一result/8plans/零call，actual一probe+8ops；unknown早失败。旧state alias可明确视invalid，但load/choices/save仍只canonical。
- **K12 T7**：parser仅token/缺值；realpath/stat/directory semantic validation位于main且早于resolver/state/effect；默认repoRoot。custom context只传operations，probe/argv/root/filesystem不变，无全局cwd/env。invalid零后续；fake日志证明每handler argv/PWD/count；failure后已完成effect不回滚、later target仍获context。可接受option名不同，但传播边界不变。
- **K13 T2**：JSONL消费既有results，不重跑handler；JSON/JSONL success/failure两侧各覆盖所有presentation options并比较parsed full semantics/exit；human回归完整。

### Completion Standard

人类须按材料顺序先固定Recall、Prediction、Transfer，再打开Key，并满足K1–K13的判断、因果与对比分支。本报告不创建完成记录、学习画像或进度文件。
