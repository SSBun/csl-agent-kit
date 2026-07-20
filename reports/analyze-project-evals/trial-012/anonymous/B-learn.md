# CLI 安装组件源码学习指南

## 1. Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-20T01:39:59+0800`
- **Learner assumption**：读者理解 JavaScript、Node.js 同步 `fs`/`spawnSync`、CLI stream/退出码、Git 与测试，但不熟悉本仓库安装模型。
- **Material status**：`学习材料就绪`

该文件由 npm binary 和兼容 wrapper 进入，把 argv 与运行上下文变为 ordered targets，选择性保存交互状态，执行 Cursor/Codex/Pi effects，再把统一 results 投影为 JSON 或终端输出。[`package.json#bin`](package.json#bin) [`scripts/install.sh`](scripts/install.sh) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) 它的直接边界是 `prompts`、用户目录文件系统与 `codex`/`pi` processes；安装后的 plugin、skills、hooks 和 Pi extensions 不在本 scope。[`package.json#dependencies`](package.json#dependencies) [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi)

### Ordered target registry

| 顺序 | Stable ID | `default` | `external` | Handler | 可观察职责 | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cursor` | false | false | `installCursor` | 将 repo root 链到 `HOME/.cursor/plugins/local/csl` | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) |
| 2 | `codex-plugin` | true | true | `installCodexPlugin` | 重建 Codex marketplace/plugin 注册，成功后清理 owned legacy links | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| 3 | `pi` | false | true | `installPi` | 执行 `pi install <repoRoot>` | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) |

声明顺序直接决定 `--all`、default filtering、interactive choices、state 过滤、valid-target error、install help 与 dispatch/result 顺序；`external` 只控制 interactive consent，`default` 只控制无显式 selector 的 `--yes` 和无 saved state 的预选。[`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#buildInstallChoices`](bin/csl-agent-kit.js#buildInstallChoices) [`bin/csl-agent-kit.js#printInstallHelp`](bin/csl-agent-kit.js#printInstallHelp)

### External process contract

| Handler / primitive | Probe（参数） | Operation | Dry-run guard | Missing | 普通 nonzero / allowFailure | Throw / cleanup order | Timeout / retry / cancellation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `installCodexPlugin` → `hasCommand` / `runCommands` | live: `codex --version`，stdio ignored | 六个 remove 后依次 marketplace add、plugin add；operation cwd=`repoRoot` | 不 probe、不 spawn；生成 8 planned commands，再只报告 owned removals | probe `status !== 0` → 一个 `skip` change，正常成功返回 | 六个 remove `allowFailure=true`，nonzero 记录 status；两个 add 为 false，nonzero 抛错 | required add throw 后 legacy cleanup 不可达；只有 commands 正常返回才 cleanup | 无 / 无 / 无 | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`](tests/cli-install-output.test.js) |
| `installPi` → `hasCommand` / `runCommands` | live: `pi --version` | `pi install <repoRoot>`，`allowFailure=false` | 不 probe、不 spawn；生成一项计划 | 返回 successful skip | operation nonzero 抛错 | 无 handler cleanup | 无 / 无 / 无 | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| `runCommands` spawn primitive | 无 | `spawnSync(cmd,args,{cwd:repoRoot,encoding:"utf8"})` | 在 spawn 前 append planned record 并 continue | 不单独分类 | 先比较 `status`；false 时 throw，true 时 append status | 已完成命令不回滚 | 无 / 无 / 无 | [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |

当前代码没有读取 `spawnSync` 的 `result.error`；未来 resource policy 必须先用目标 Node runtime 的聚焦测试固定 missing/timeout/error/status/signal contract，再在普通 status 之前分类，不能从本报告猜字段。[`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand)

### Effect context matrix

| Effect / handler | Primitive | argv | cwd | env | Path/source/ownership root | Guard / dry-run | 默认上下文 | Failure / cleanup | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cursor link | `ensureSymlink` + `fs` | 不适用 | 不适用 | HOME 由 `os.homedir()` 间接读取 | target=`HOME/.cursor/plugins/local/csl`；source=`realpath(repoRoot)` | source canonicalization 后 dry-run 立即返回；无 mkdir/target read/mutation | 当前用户 HOME、文件所在 repo | fs error throw；mismatch unlink 后 publish failure 无 rollback | [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) |
| Codex probe | `hasCommand` / `spawnSync` | `codex --version` | 未传 cwd，继承 CLI process cwd | 未传 env，继承 PATH/env | 无 fs root | only live；dry-run skip probe | caller cwd/env | nonzero/missing → successful skip；无 cleanup | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| Codex operations | `runCommands` / `spawnSync` | handler 固定 8 组 `codex ... --json` | 显式 `repoRoot` | 继承 env | marketplace add argv 带 `repoRoot` | dry-run records only | repo root | allowed failures continue；required failure throw；已完成 effect 不回滚 | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| Legacy cleanup | `removeLegacyCodexSkillLinks` + `fs` | 不适用 | 不适用 | HOME 间接影响 scan root | owner=`realpath(repoRoot/skills)`；scan=`HOME/.agents/skills` | commands 成功后；dry-run 不 unlink | repo skills + current HOME | 仅 owned symlink 移除；逐项失败抛错，无 rollback | [`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`](bin/csl-agent-kit.js#removeLegacyCodexSkillLinks) [`bin/csl-agent-kit.js#isWithin`](bin/csl-agent-kit.js#isWithin) |
| Pi probe | `hasCommand` / `spawnSync` | `pi --version` | 继承 CLI cwd | 继承 env/PATH | 无 fs root | only live | caller cwd/env | nonzero/missing → successful skip | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) |
| Pi operation | `runCommands` / `spawnSync` | `pi install <repoRoot>` | 显式 `repoRoot` | 继承 env | argv source root=`repoRoot` | dry-run no spawn | repo root | nonzero throw；无 cleanup | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| Interactive selection state | `loadInstallSelection` / `saveInstallSelection` + `fs` | 不适用 | 不适用 | `CSL_AGENT_KIT_HOME` 优先，否则 HOME | data root=`CSL_AGENT_KIT_HOME` 或 `HOME/.csl-agent-kit` | 仅 interactive confirm 后写；execution selectors 不读写；interactive dry-run 仍保存 | 当前用户 data root | read failure → default；save temp→rename，finally rm；save failure warning 后 effects 继续 | [`bin/csl-agent-kit.js#installSelectionFile`](bin/csl-agent-kit.js#installSelectionFile) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |

上下文只随单次调用传播；源码无 `process.chdir` 或 `process.env` mutation。Operation 的 repoRoot cwd 不能推广到 probe、filesystem 或全局 process。[`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand)

### Filesystem target-state matrix：Cursor link publication

共同前置：`ensureSymlink` 总是先 `realpathSync(source)` 得 `sourceReal`；dry-run 随即返回 `{action:"symlink",target,source:sourceReal,dryRun:true}`，不会 mkdir、读取 target 或 mutation。下表描述 live；parent `mkdirSync({recursive:true})` 发生在 target classification 之前。[`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink)

| Target state | Type / canonicalization helpers | Live primitive 顺序 | Result | Destructive window / recovery |
| --- | --- | --- | --- | --- |
| absent | `existsSync=false`；`isSymlink` 内 `lstatSync` catch→false | `mkdirSync(parent)` → `symlinkSync(sourceReal,target)` | `symlink` change | publish 前 target absent；symlink failure 保持 absent；无 temp/rollback |
| 已正确，同一 link text | `isSymlink`→true；`readlinkSync`；absolute 保持、relative 以 parent `resolve`；existing current path 经 `realpathSync`，等于 `sourceReal` | mkdir → classify/read/canonical compare；不 mutation | `unchanged` | 无 destructive primitive；原 link 可恢复性不变 |
| 已正确，不同文本但 canonical target 相同 | 同上；例如 relative、alias chain 最终 `realpath` 相同 | 同上，不改写 link text | `unchanged` | 原始 link text 被保留；没有 publication window |
| mismatched symlink（指向存在的其他目标） | `existsSync=true`；`isSymlink=true`；`readlinkSync`；current target `realpathSync` 后不等于 source | mkdir → `unlinkSync(target)` → `symlinkSync(sourceReal,target)` | 成功为 `symlink` change | unlink 后到 symlink 成功前正式 target absent；原 link text 已丢失，函数无 rollback；外层只能报 failure |
| broken symlink | `existsSync(target)=false` 但 `isSymlink` 的 `lstatSync` 为 true；`readlinkSync`；broken current path 不做 realpath，直接比较 resolved/normalized path | mkdir → `unlinkSync(target)` → `symlinkSync(sourceReal,target)` | 成功为 `symlink` change | 同一 destructive window；原 broken link text unlink 后不可由 helper 恢复 |
| regular file | `existsSync=true`；`isSymlink=false` | mkdir → throw；不 unlink、不 symlink | dispatcher 投影 `ok:false,error` | 正式 file bytes 保留；parent mkdir 可能已发生，但 target 不变 |
| directory | `existsSync=true`；`isSymlink=false` | mkdir → throw；不 unlink、不 symlink | dispatcher 投影 `ok:false,error` | directory 保留；无 target destructive window |

`ensureSymlink` 没有 temp、rename 或 finally cleanup；mismatched/broken replacement 是 unlink→symlink 的非原子 publication。`installTargets` 只捕获异常生成失败 result，并继续后续 target，不能恢复 link text 或撤销已完成 mkdir/unlink。[`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets)

### 其他 filesystem mutation 边界

| 协议 | State/type gate | Mutation / publication | Temp ownership与 cleanup | Failure semantics | Evidence |
| --- | --- | --- | --- | --- | --- |
| Selection persistence | selected 先按 registry 过滤且不得为空 | mkdir → write unique same-directory temp（JSON version 1、selected IDs、newline、mode 0600）→ `renameSync(temp,file)`；rename 是 publish point | `.<basename>.<pid>.<Date.now()>.tmp`；finally `rmSync(force:true)` | publish 前原正式文件仍在；write/rename error 抛到 resolver 后只 warning，effects 继续；temp 尝试清除 | [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| Legacy owned-link removal | legacy root absent→empty；root symlink/non-directory→empty；entry 用 `lstatSync`，非 symlink保留；link text 或 resolved source 必须位于 owner root | live 对每个 owned entry 直接 `unlinkSync`；dry-run 只记录 | 无 temp | 已移除 links 不回滚；后续 entry error 使 Codex target failure | [`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`](bin/csl-agent-kit.js#removeLegacyCodexSkillLinks) [`tests/cli-install-output.test.js#test("Codex plugin cleanup removes only owned links and is idempotent")`](tests/cli-install-output.test.js) |

Selection 的 temp→rename 可作为仓库内 staged publication 证据，但其 path、payload、mode、错误处理与 symlink target 不同，不能直接声称 `ensureSymlink` 已原子化。

### Learning Targets

- **LT1**：按首 token 和 install token 预测 command admission、parser/direct exit、streams、status 与不可达阶段。
- **LT2**：从所有 selector 语法推导 normalization → validation → stable dedup → dispatch，并解释 precedence、defaults、state 与 consent。
- **LT3**：由 ordered registry 的 ID/default/external/handler 推导 help、choices、all/default/state/result，并定位新增非默认职责的最小入口。
- **LT4**：区分 probe、operation、filesystem、cleanup 的 argv/cwd/env/root、dry-run、resource 与 failure contracts。
- **LT5**：对 Cursor 全部目标状态预测 exact fs primitives、change/result、destructive window 与恢复边界，并区分 selection temp→rename。
- **LT6**：解释 dispatcher 如何隔离真实 handler failure、继续后续 participant，并区分 successful skip。
- **LT7**：从 shared results 推导 JSON/human、color/verbosity 与统一 exit predicate。
- **LT8**：为 output、dispatcher/process/context/filesystem publication、discovery、command admission、alias 和新 target 设计隔离的成对验证。

必需前置：JavaScript control flow、`Set` insertion order、symlink/realpath/lstat、同步 fs/process API、stdout/stderr/status。明确不覆盖：安装产物内部行为、通用 Node/symlink 课程、审计、改动实现或学习进度。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1 | front door、parser exits、gate ledger | W1 command matrix | P1、T8 → K1/K16 |
| LT2 | syntax convergence、precedence、validation、state/consent | W2 mixed selectors 与 denial | P2/P3、T9 → K2/K3/K17 |
| LT3 | ordered registry/policies/handler | registry baseline | R2、T1/T7 → K2/K10/K15 |
| LT4 | process contract、effect context、dry-run | W4 Codex failure/missing | P5、T4/T5 → K5/K6/K13 |
| LT5 | target-state matrix、unlink window、staged publication | W3 Cursor states | P4、T6 → K4/K14 |
| LT6 | per-target catch、ordered results、skip | W4 Codex failure→Pi、skip→Cursor | P5、T3 → K7/K12 |
| LT7 | output split、presentation、exit predicate | W5 JSON vs human | P6、T2 → K8/K11 |
| LT8 | paired baselines、isolated state/effect sentinels | T1–T9 | T1–T9 → K10–K17 |

## 2. Concept Ladder

### Input convergence and value-option layering

| Exact syntax | Parser/helper | Shared field | Order semantics | Resolver path |
| --- | --- | --- | --- | --- |
| `--target a,b` | consume next token → `splitTargets` | `options.targets` | append split values at token position | explicit validate → stable dedup → dispatch |
| `--targets a,b` | same branch/helper | `options.targets` | same | same |
| `--target=a,b` | slice after `=` → `splitTargets` | `options.targets` | same | same |
| positional `a,b` | non-option/non-`all` → `splitTargets` | `options.targets` | same | same |
| `--all` / positional `all` | set boolean | `options.all` | does not append targets；highest resolver precedence | registry declaration order |
| `--yes` / `-y` | set boolean | `options.yes` | only used when all=false and targets empty | registry-order defaults |

Current canonicalization is only comma split、trim、empty filtering；there is no alias map. `validateTargets` runs on the whole explicit array before `new Set` stable dedup, then `installTargets` dispatches in resulting order. all > explicit > yes > interactive, independent of last-token wins.[`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets)

| Value option | Parser acceptance / missing | Default | Semantic boundary | Consumer / propagation | Invalid result and zero effects |
| --- | --- | --- | --- | --- | --- |
| `--target` / `--targets` | increment index, only checks truthiness；a following `--json` is accepted as value | `targets=[]` | `splitTargets` text normalize；resolver calls `validateTargets` before state/effect | options → selected → dispatcher | true missing: stderr/status 2；option-like value: unknown target stderr/status 2；both zero state/effect/results |
| `--target=` | empty suffix splits to empty list and is not parser error | same | empty proceeds as no explicit selector；nonempty validates | same | unknown status 2；empty may reach yes/interactive |

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | Front door：only `install` enters subcommand parser；all other first tokens currently render generic help | single equality in `main` | first decide whether major behavior is reachable | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printHelp`](bin/csl-agent-kit.js#printHelp) |
| 2 | Parser gate：syntax aggregation plus help/unknown/missing direct exits | `parseInstallArgs` loop | separates token acceptance from target semantics | [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) |
| 3 | Ordered registry：ID/policies/handler share one declaration and order | all `Object.keys/entries` consumers | explains cross-cutting behavior from one source | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) |
| 4 | Selection gates：all→explicit→yes→environment/dependency/state/prompt/consent/save | early-return order | predicts state/effect reachability | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 5 | Filesystem identity：type uses lstat via `isSymlink`，semantic equality uses readlink/path resolve/realpath | target-state matrix | type and canonical identity lead to different mutation decisions | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#isSymlink`](bin/csl-agent-kit.js#isSymlink) |
| 6 | Publication/failure safety：Cursor mismatch is unlink→symlink；selection state is same-dir temp→rename | two exact primitive sequences | exposes destructive window and prevents conflating protocols | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| 7 | Effect context：probe inherits cwd；operations use repoRoot；filesystem roots derive from HOME/repo | distinct spawn/path call sites | prevents global-context inference | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| 8 | Result isolation：handler throw becomes one failure result；loop continues；skip is normal changes | per-item try/catch and missing branches | foundation for stop/retry/rollback reasoning | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| 9 | Output projection：shared results then JSON/human split；color/verbose only human | formatter branch after dispatch | separates effect semantics from presentation | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) |
| 10 | Exit taxonomy：direct user/gate errors=2，target/results error=1，all ok=0 | `die`、main catch、every(ok) | locates failure layer from status | [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |

## 3. Guided Code Walkthrough

### W1：Command front door and direct exits

教学理由：先校准谁拥有 token，避免把 top-level fallback、help renderer 与 install parser 混为一层。

| argv after CLI | Actual branch / renderer | stdout | stderr | status | Unreachable |
| --- | --- | --- | --- | --- | --- |
| `[]` | missing first token defaults `command="help"` → `printHelp` | generic help | empty | 0 natural | install parser/state/effect/results |
| `help` | non-install fallback → `printHelp` | generic help | empty | 0 | same |
| `--help` | not a declared top-level alias；same fallback | generic help | empty | 0 | same |
| `-h` | same | generic help | empty | 0 | same |
| `install` | accepted command → parser, then selection | depends on later gates | non-TTY normally admission error | normally 2 in non-TTY | only later gates reachable |
| `cursor` target-like unknown | generic fallback | generic help | empty | 0 | install parser/validation/state/effect/results |
| `--json` option-like unknown | generic fallback | generic help | empty | 0 | same |
| `install --help` / `install -h` | parser → `printInstallHelp` → `process.exit(0)` | install help, registry-order targets | empty | 0 | resolver/state/effect/results/completion |
| `install --bogus` | parser → `die` | empty | exact unknown-option error | 2 | resolver/state/effect/results |
| `install --target` | parser missing value → `die` | empty | requires-list error | 2 | same |

`help`/`--help`/`-h` currently are not top-level alias branches；they merely share the fallback with every unknown command. Command admission belongs to `main`，rendering belongs to `printHelp`，install syntax belongs to `parseInstallArgs`.[`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printInstallHelp`](bin/csl-agent-kit.js#printInstallHelp)

### W2：Gate ledger and selector contrasts

教学理由：按不可逆的先后表区分 parser error、environment admission、state load、authorization 与 dispatcher。

| Order | Gate / condition | Output/status | Therefore unreachable | Anchor |
| --- | --- | --- | --- | --- |
| 0 | first token != `install` | generic help stdout / 0 | parser onward | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |
| 1 | install help or syntax error | help stdout/0；error stderr/2 | resolver/state/effects/results | [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) |
| 2 | all, then explicit validation+dedup, then yes | unknown target stderr/2 | environment/state/effects | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) |
| 3 | interactive only: non-TTY or CI | stderr/2 | require prompts/state/prompt/effects | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 4 | interactive only: `require("prompts")` fails | stderr/2 | state/prompt/effects | same |
| 5 | state load | invalid/missing silently returns null | prompt remains reachable | [`bin/csl-agent-kit.js#loadInstallSelection`](bin/csl-agent-kit.js#loadInstallSelection) |
| 6 | prompt cancel | stderr/2 | consent/save/effects | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 7 | selected contains external and confirm false | stderr/2 | save/effects/results | same |
| 8 | save selection | failure only warning；continue | effects still reachable | [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| 9 | per-target dispatcher | throw→failure result | later target remains reachable | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| 10 | projection | JSON or human stdout / 0 or 1 | end | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |

| Checkpoint | Before reading | Inspect | Observe | Causal result |
| --- | --- | --- | --- | --- |
| `--target pi,cursor --targets cursor --target=codex-plugin,pi --yes` | predict IDs | parser→split→resolver | accumulation then validation then Set | `pi,cursor,codex-plugin`; yes ignored |
| add `--all` | predict precedence | resolver first branch | token order does not override early branch | `cursor,codex-plugin,pi` registry order |
| invalid saved state | error or default? | load→choices | all read/parse/schema failures return null | checklist defaults `codex-plugin`; test evidence [`tests/cli-install-output.test.js#test("invalid saved selection falls back to the Codex default checklist")`](tests/cli-install-output.test.js) |
| external denial | state/effects? | prompt response branch | denial precedes save/return | state and effects zero |

### W3：Cursor target states and publication window

教学理由：一个 helper 同时展示 type、canonical identity、dry-run 与 failure recovery，最适合建立 filesystem causal model。

| Checkpoint | Before reading | Inspect | Observe | Causal result |
| --- | --- | --- | --- | --- |
| correct relative symlink | will text be rewritten? | `readlink`→resolve→realpath compare | semantic identity, not textual equality | unchanged；original text preserved |
| broken/mismatched link | exact destructive order? | mismatch branch | `unlinkSync` precedes `symlinkSync` | failure between primitives leaves target absent；dispatcher cannot rollback |
| regular file/directory | overwritten? | `isSymlink` gate | throws before unlink | original target preserved；failure result |
| dry-run with any target state | target inspected? parent created? | early return position | only source realpath precedes return | same planned change；target and parent untouched |
| selection save comparison | can its temp protocol be assumed for links? | `saveInstallSelection` | temp payload is JSON file, publish via rename, finally rm | evidence for a distinct protocol, not current link atomicity |

### W4：Process failure isolation and successful skip

教学理由：Codex offers a reproducible real failure and cleanup boundary；Pi/Cursor provide observable later participants。

| Checkpoint | Before reading | Inspect | Observe | Causal result |
| --- | --- | --- | --- | --- |
| selected `codex-plugin,pi`; fake Codex required add exits 9 | Pi? cleanup? result order? | runCommands→handler→dispatcher | add throws；cleanup unreachable；per-item catch continues | Codex failure then Pi result；status 1；completed commands not rolled back. Existing test proves failure/cleanup boundary, later Pi needs focused assertion [`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`](tests/cli-install-output.test.js) |
| missing Codex followed by Cursor | skip stops? | missing branch→dispatcher | handler returns normally with skip | `ok:true`; Cursor runs；skip not failure |
| Codex dry-run, PATH missing | probe? mutations? | handler guards/runCommands/cleanup | no probe/spawn/unlink | 8 commands + owned removals as records；tests prove order/no mutation [`tests/cli-install-output.test.js#test("Codex plugin cleanup dry-run reports owned links without mutating them")`](tests/cli-install-output.test.js) |

### W5：Shared results and output split

教学理由：同一 results 的两种 projection 能把 semantic result、presentation 与 exit 清晰分层。

| Control | Condition / producer | Formatter | Color/verbosity | Exit predicate | Evidence |
| --- | --- | --- | --- | --- | --- |
| shared results | `installTargets` completes | ordered result objects | none | not yet | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| JSON | `options.json` true | `JSON.stringify({ok:every(ok),results},null,2)` | bypass human/color/detail | same `every(ok)` | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`tests/cli-install-output.test.js#test("JSON output remains valid and color-free when --color is passed")`](tests/cli-install-output.test.js) |
| Human | json false | `printResults`→summary；verbose→details | always/never/auto+`NO_COLOR` | same `every(ok)` | [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) [`bin/csl-agent-kit.js#createColors`](bin/csl-agent-kit.js#createColors) |

## 4. Human Recall, Prediction & Transfer Checks

### Material order

1. **Recall**：hide Orientation、Ladder、Walkthrough、Key and source；answer Recall only.
2. **Prediction**：正文 visible，Key/source hidden；freeze prediction and reasons.
3. **Transfer**：正文/source visible，Key hidden；freeze entry、impact boundary、observable assertions、verification location and reasons.
4. Only after all initial answers open Key and reconcile. Looking early counts only as review；retest uses equivalent new prompts.

### Recall prompts

- **R1**：scope 的输入、主要产出、direct boundaries 与不负责的相邻职责是什么？
- **R2**：按顺序写出三 targets 的 ID/default/external/handler，并说明两 policy 的作用。
- **R3**：explicit IDs 从文本到 dispatch 的顺序及 all/explicit/yes/interactive precedence 是什么？
- **R4**：对 absent、canonical-equivalent、mismatched、broken、file、directory，Cursor helper 如何分类、mutation、返回？哪个状态有 destructive window？
- **R5**：probe/operation 的 cwd/env 与 filesystem roots 如何区分？
- **R6**：required process failure、successful skip、dispatcher continuation、output/exit 如何关联？

### Prediction prompts

- **P1**：预测 bare CLI、`--help`、`cursor`、`install --help`、`install --bogus` 的 streams/status 与不可达阶段。
- **P2**：预测混合 selector `--target pi,cursor --targets cursor --target=codex-plugin,pi --yes`，再加入 `--all`。
- **P3**：在 CI/non-TTY 比较 bare `install`、`install --yes`、`install --target unknown` 的首个失败/早退 gate 与 state/prompt/effects。
- **P4**：用六种 Cursor target state 分别预测 dry-run/live 的 exact fs calls、link text/bytes、result 和 publication failure 后状态。
- **P5**：fake Codex required add 失败且后接 Pi；预测 commands、cleanup、Pi、results、status；再改 missing Codex。
- **P6**：比较 human `--verbose --no-color` 与 `--json --verbose --color` 的 parsed semantics、ANSI/details 和 status。

### Transfer prompts

#### T1：New non-default responsibility

新增 `claude-local` target：`default:false`、`external:false`，handler 复用 `ensureSymlink` 将 repoRoot 链到隔离 HOME 的 `.claude/plugins/local/csl`。成对断言 `--yes` 仍只有 Codex、`--all` 按新 registry order 包含它；help/choices/state/result 只用 stable ID；四种 explicit syntax 均可选。隔离 HOME 比较 dry-run（planned link、零 fs mutation）与 actual（link→`realpath(repoRoot)`、零 process）；unknown 仍 state/effect 前 status 2。验证放在 `tests/cli-install-output.test.js` 的 CLI helper 附近。

#### T2：New `--jsonl` output mode

定义与 `--json` conflict 在 resolver/state/effect 前 status 2。对每项 orthogonal presentation option `--color`、`--no-color`、`--verbose`，baseline `--json` 与变化 `--jsonl` 两侧都叠加：parse 后比较 target/result/change order、ok、error 与 exit；均无 ANSI。覆盖 success 与 real failure，并保留不启用 jsonl 的 human summary+verbose regression。入口是 shared results 后 `main` formatter split，不改 handlers。

#### T3：New `--fail-fast`

隔离 HOME/PATH，用现有 Codex handler 的 required `plugin add` 制造 failure，fake Pi 记录 exact call。Baseline 证明 Pi 执行，变化侧证明 Pi 不执行；两侧核对 prior Codex calls 保留、legacy cleanup 不执行、results order/status 1。另用 missing Codex successful skip 后接 actual Cursor link，证明 skip 不触发 stop。禁止用 abstract fake adapter 替代真实 participants。

#### T4：Timeout/retry process policy

先用目标 Node runtime 聚焦测试确定 `spawnSync` missing/resource timeout 的实际 error/status/signal contract，分类必须先 runtime error 后 ordinary status。可观察 fake `codex`/`pi` 记录 probe/operation 的 exact argv、PWD、call count；覆盖 missing、allowed remove nonzero、required add resource failure、retry success/exhaustion、dry-run zero calls、cleanup、later Pi、results/exit。Probe 与 operation policy 分别断言；已完成 effects不回滚；未知 runtime fields 不得猜。

#### T5：New `--operation-cwd <dir>`

Parser 只收 token；在 resolver/state/effect 前做 realpath/existence/directory validation。missing/not-found/not-directory 均 stderr/status 2，state/effect logs zero。只把 canonical cwd 传给 operation primitive；probe still inherits CLI cwd；canonical argv/repo roots、Cursor/cleanup paths unchanged；no `process.chdir`。隔离 HOME/PATH，用 fake executables exact argv/PWD/per-handler counts 比较 baseline repoRoot 与 custom cwd，并确认 prior effects 不因 later failure rollback。

#### T6：Make `ensureSymlink` staged-publication safe

为 absent、mismatched、broken 的 publication 明确定义：source realpath 与 existing type/canonical checks保持；在 target parent 同边界创建唯一 sibling temp `.<basename>.<pid>.<time>.tmp`，payload 是精确 `sourceReal` symlink text；只在本 invocation 的 `symlinkSync(sourceReal,temp)` 成功后标记 ownership；以 `renameSync(temp,target)` 为唯一 publish point，`finally` 只清理 owned temp。Correct canonical link 仍 unchanged；regular file/directory 在 temp/rename/unlink 前失败；dry-run 仍不 mkdir/read target/mutate。不得调用 `unlinkSync(target)`。

验证覆盖 absent、same-text correct、different-text canonical-equivalent、mismatched、broken、file、directory；在 mkdir/temp-symlink/rename/finally-cleanup 每个新 primitive 注入 failure，逐案比较原始 file bytes/link text、正式 target canonical identity、temp residue 与不得调用的 destructive primitive。特别证明 rename 前 failure 保留 mismatched/broken 原 link text，rename success 后只见新 link；temp 不遗留。再选择 `cursor,pi`，以 fake Pi 证明 Cursor failure 后 results 保序并继续；各保留一条 JSON 与 human projection regression。明确保持 selection/consent/persistence、source/target roots、其他 handlers argv/cwd/env、prior effects 与 exit contract。

同时对比 `saveInstallSelection`：它也是 same-directory temp→rename，但 temp 是 mode 0600 JSON file、路径位于 data root、save failure 只 warning；不能复用其 payload/path/failure assertions 来替代 symlink publication tests。

#### T7：New `install --list-targets` discovery

与所有 execution selectors（`--target`、`--targets`、`--target=`、positional target、`--all`、positional `all`、`--yes/-y`）的任一组合都 conflict，并在 state/resolver/dispatcher 前 status 2；单独模式从 registry order/metadata 精确输出 ID/default/external/title 后早退。隔离 HOME/PATH、CI/non-TTY，用 selection、prompt、filesystem、process、results/completion sentinels 证明全零；保留未启用模式的 `--yes --dry-run --json` regression。

#### T8：Tighten top-level command admission

Unknown target-like/option-like first token 改 stderr/status 2；bare token、`help`、`--help`、`-h` 仍 generic help/0，`install` 唯一 execution command。表驱动覆盖无 token、每个 help token、install、两类 unknown、install help、install unknown option、合法 install flow，精确 message/stream/status。在隔离 HOME/PATH 以 state/prompt/fs/process/results/completion sentinels证明 error branches零后续。策略只放 `main` front door，并回归 selector precedence、consent/persistence、effects、machine/human output/exit。

#### T9：Alias canonicalization

新增 `codex`→`codex-plugin`，canonicalization 位于所有 `splitTargets` 汇流之后、validation 与 stable dedup 之前。覆盖 `--target value`、`--targets value`、`--target=value`、positional 及 `codex,codex-plugin,codex`；registry/default/all/interactive/state/handler/result 仅 canonical ID。以真实 Codex handler dry-run 8 commands 和 actual fake executable log 各证明只 dispatch 一次；unknown ID 仍 state/effect 前 status 2。

## 5. Verification Key & Completion Standard

### Recall / Prediction Key

| Key | Must judge | Acceptable alternative | Anchor / contrast |
| --- | --- | --- | --- |
| K1（R1/P1） | scope orchestrates install/results；only `install` enters parser；top-level unknown currently help/0；install help stdout/0，syntax error stderr/2 | “unknown command is generic fallback” | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) |
| K2（R2/P2） | exact registry order/policies/handlers；all>explicit>yes；default only Codex | insertion-order wording acceptable | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| K3（R3/P2/P3） | split/trim/filter → validate → stable dedup → dispatch；unknown before state/effect；execution selectors bypass interactive state/consent | may call first stage text normalization | [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) |
| K4（R4/P4） | absent creates；canonical-equivalent unchanged/text preserved；mismatch/broken unlink→symlink；file/dir throw without target mutation；dry-run only source realpath then plan | must distinguish broken `existsSync=false` plus lstat symlink | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#isSymlink`](bin/csl-agent-kit.js#isSymlink) |
| K5（R5） | probe inherits CLI cwd/env；operation explicit repoRoot/inherited env；Cursor/cleanup no process，roots from HOME/repo | “missing cwd option means inherit” | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| K6（P5） | missing live→successful skip；dry-run skips probe but plans；Codex cleanup only after commands return | skip not target failure | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| K7（R6/P5） | required add failure→Codex failure，cleanup unreachable，dispatcher continues Pi，ordered results/status1，prior effects no rollback；missing skip continues and may end 0 | later participant must remain explicit | [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| K8（R6/P6） | shared results before formatter；JSON bypasses color/verbose renderer；human applies them；same every(ok) drives payload/exit | presentation does not alter result semantics | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) |
| K9（P3） | bare install fails environment gate；yes returns default before it；unknown fails validation before it；none writes selection，only yes reaches effects | gate order required | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |

### Transfer Key

| Key | Must judge and observable assertions | Acceptable alternative | Anchor / verification |
| --- | --- | --- | --- |
| K10（T1） | registry entry+handler minimal；default false preserves yes；all/help/choice/state derive；all syntax works；isolated dry-run zero fs、actual canonical link、zero process；unknown zero state/effect | concrete new non-default ID may differ | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`tests/cli-install-output.test.js#run`](tests/cli-install-output.test.js) |
| K11（T2） | json/jsonl conflict pre-effect；both modes each overlay color/no-color/verbose；parsed success/failure semantics and exit equal/no ANSI；human regression remains | JSONL envelope may vary if normalized before compare | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`tests/cli-install-output.test.js#test("JSON output remains valid and color-free when --color is passed")`](tests/cli-install-output.test.js) |
| K12（T3） | real Codex required failure；baseline Pi called vs fail-fast not；prior commands/cleanup/result order/status asserted；missing skip does not stop actual later handler | later existing handler may be Cursor or Pi, not fake adapter | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`tests/cli-install-output.test.js#createFakeCodex`](tests/cli-install-output.test.js) |
| K13（T4/T5） | process policy separately probes/operations with exact argv/PWD/count and runtime-error-first classification；all required branches, cleanup/later participant/result/exit. Context input semantically validates pre-state/effect，only operations get cwd，probe/roots/nonprocess unchanged，invalid zero effects/no global chdir | policy values may differ but coverage cannot | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| K14（T6） | exact order classify→owned sibling temp symlink→rename publish→finally owned cleanup；no `unlinkSync(target)`；all six/seven target states and every new primitive failure compare original bytes/text/formal target/temp/destructive calls；Cursor failure still followed by real Pi，results order；JSON+human regressions；selection temp protocol explicitly distinguished | unique temp scheme may differ if same-boundary/owned/collision-safe/payload exact | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| K15（T7） | complete selector conflict matrix；early before state/resolver/dispatcher；registry-derived ordered output；CI/HOME/PATH sentinels all zero；normal flow regression | JSON/text allowed with fixed fields/order | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |
| K16（T8） | matrix includes no token, all help tokens, install, both unknown classes, subcommand help/unknown, valid flow；exact streams/status；unknown front-door zero all sentinels；install contracts preserved | may declare aliases explicitly, but all three current tokens need policy/tests | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printHelp`](bin/csl-agent-kit.js#printHelp) |
| K17（T9） | alias after convergence, before validation/dedup；all syntaxes/mixed list dispatch once；no alias leaks registry/state/result；real Codex dry/live calls once；unknown zero state/effect | another alias acceptable only for concrete existing handler | [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |

### Completion Standard

人类只有按规定 visibility 顺序固定 Recall、Prediction、Transfer 全部初始答案，再打开 Key，并满足 K1–K17 的关键判断、对比分支与因果解释，才算本轮完成；提前看 Key 只算复习。这里不写完成记录、learner profile 或进度。Agent 可持续读取材料，不能据此声称主动回忆或已经学会；只有报告外 sealed held-out prediction/transfer task 能评价材料是否支持其推理。
