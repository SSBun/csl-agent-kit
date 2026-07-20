# CLI 安装组件源码学习指南

## 1. Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-20T01:58:21+0800`
- **Learner assumption**：读者理解 JavaScript、Node.js 同步 fs/process API、symlink、CLI stream/退出码、Git 与测试，但不熟悉本仓库安装模型。
- **Material status**：`学习材料就绪`

该文件由 npm binary 与兼容 wrapper 进入，将 argv 和运行上下文解析为 ordered targets，选择性读取/保存交互状态，执行 Cursor/Codex/Pi effects，并把 shared results 投影为 JSON 或终端输出。[`package.json#bin`](package.json#bin) [`scripts/install.sh`](scripts/install.sh) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) 直接边界为 `prompts`、用户目录 filesystem、`codex`/`pi` processes；安装产物的内部行为不在本 scope。[`package.json#dependencies`](package.json#dependencies) [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi)

### Ordered registry baseline

| 顺序 | Stable ID | `default` | `external` | Handler | Responsibility | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cursor` | false | false | `installCursor` | repoRoot → `HOME/.cursor/plugins/local/csl` symlink | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) |
| 2 | `codex-plugin` | true | true | `installCodexPlugin` | Codex registration + owned legacy-link cleanup | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| 3 | `pi` | false | true | `installPi` | `pi install <repoRoot>` | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) |

Registry declaration order drives all/default/choices/state filtering/valid-list/help/dispatch/results；`default` affects `--yes` and empty saved-state preselection，`external` only affects interactive confirm after final selection。[`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#buildInstallChoices`](bin/csl-agent-kit.js#buildInstallChoices) [`bin/csl-agent-kit.js#printInstallHelp`](bin/csl-agent-kit.js#printInstallHelp)

### External process contract

| Handler / primitive | Availability probe | Operation | Dry-run | Missing | Nonzero / allowFailure | Throw / cleanup order | Timeout / retry / cancellation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Codex → `hasCommand` / `runCommands` | live `codex --version`，stdio ignored | six allowed removes, then marketplace add and plugin add；operation cwd=repoRoot | no probe/spawn；8 planned commands；cleanup only reports | `status!==0` → normal `skip` change (`ok:true`) | removes allowed and record status；adds required and throw | required add throw makes legacy cleanup unreachable；prior commands no rollback | 无 / 无 / 无 | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`](tests/cli-install-output.test.js) |
| Pi → `hasCommand` / `runCommands` | live `pi --version` | `pi install <repoRoot>`，required | no probe/spawn；one planned command | normal skip | operation nonzero throws | no handler cleanup | 无 / 无 / 无 | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| `runCommands` spawn | none | `spawnSync(cmd,args,{cwd:repoRoot,encoding:"utf8"})` | append planned record before spawn | no explicit classification | compares status first；allowed records status, required throws | completed prior commands remain | 无 / 无 / 无 | [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |

源码不读取 `spawnSync.result.error`；resource policy 变更前须由目标 Node runtime 的 focused check 固定 missing/timeout/error/status/signal contract，先分类 runtime error 再处理 ordinary status，不能猜测字段。[`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands)

### Effect context matrix

| Effect | Primitive / argv | cwd | env | Path/source/ownership root | Guard / dry-run | Default context | Failure / cleanup | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cursor link | `ensureSymlink` + fs；no argv | n/a | HOME via `os.homedir` | target=HOME cursor path；source=`realpath(repoRoot)` | source realpath then dry-run returns；no mkdir/read/mutation | caller HOME + file repo | mismatch unlink→symlink；publish failure no rollback | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) |
| Codex probe | `codex --version` | inherited CLI cwd | inherited PATH/env | none | live only | caller cwd/env | missing/nonzero→skip | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) |
| Codex operations | 8 fixed `codex ... --json` argv | explicit repoRoot | inherited | marketplace add receives repoRoot | dry-run no spawn | file repo | allowed continue；required throw；cleanup afterward | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| Legacy cleanup | fs lstat/readlink/realpath/unlink | n/a | HOME affects scan | owner=`realpath(repoRoot/skills)`；scan=HOME agents skills | after commands；dry-run no unlink | repo skills + HOME | only owned symlinks；partial unlinks no rollback | [`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`](bin/csl-agent-kit.js#removeLegacyCodexSkillLinks) [`bin/csl-agent-kit.js#isWithin`](bin/csl-agent-kit.js#isWithin) |
| Pi probe | `pi --version` | inherited CLI cwd | inherited | none | live only | caller cwd/env | missing/nonzero→skip | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) |
| Pi operation | `pi install <repoRoot>` | explicit repoRoot | inherited | argv source=repoRoot | dry-run no spawn | file repo | nonzero throw；no cleanup | [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| Selection state | read/write/rename/rm fs | n/a | `CSL_AGENT_KIT_HOME` else HOME | data root env or `HOME/.csl-agent-kit` | interactive accepted only；interactive dry-run still saves | current data root | invalid read→default；save failure warning；finally temp rm | [`bin/csl-agent-kit.js#installSelectionFile`](bin/csl-agent-kit.js#installSelectionFile) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |

No `process.chdir`/global env mutation exists；context propagates per call only。Operation repoRoot cwd does not apply to probes or filesystem.[`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands)

### Filesystem target-state matrix：Cursor publication

`ensureSymlink` always computes `sourceReal=realpathSync(source)` first。Dry-run then immediately returns a planned symlink change：no parent mkdir、target read or mutation。Live calls `mkdirSync(parent,{recursive:true})` before classifying target。[`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink)

| Target state | Type/canonical helpers | Exact live sequence | Change/result | Destructive window / recovery |
| --- | --- | --- | --- | --- |
| absent | `existsSync=false`；`isSymlink` lstat catch→false | mkdir → `symlinkSync(sourceReal,target)` | `symlink` | target absent until publish；failure stays absent；no temp/rollback |
| correct, same text | lstat symlink；readlink；absolute unchanged/relative resolve parent；existing current realpath equals sourceReal | mkdir → compare；no mutation | `unchanged` | no destructive call；text preserved |
| correct, different text but same canonical target | same helpers；alias/relative chain realpath equals sourceReal | same | `unchanged` | original link text intentionally retained |
| mismatched symlink | lstat/readlink/current realpath differs | mkdir → `unlinkSync(target)` → `symlinkSync(sourceReal,target)` | success=`symlink` | formal target absent between primitives；old link text lost after unlink；no rollback |
| broken symlink | `existsSync(target)=false` but lstat says symlink；readlink；missing current path compared without realpath | mkdir → unlink → symlink | success=`symlink` | same window；broken text unrecoverable by helper after unlink |
| regular file | exists；lstat not symlink | mkdir → throw before unlink | dispatcher `ok:false,error` | file bytes retained；target not mutated |
| directory | exists；lstat not symlink | mkdir → throw before unlink | dispatcher failure result | directory retained |

There is no temp/rename/finally in link publication；dispatcher can only catch and project failure, then continue next target，not restore target or reverse mkdir/unlink。[`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets)

| Other fs protocol | Gate/state | Mutation/publication | Temp ownership/cleanup | Failure semantics | Evidence |
| --- | --- | --- | --- | --- | --- |
| Selection save | registry-filtered selected must be nonempty | mkdir → write same-dir `.<basename>.<pid>.<Date.now()>.tmp` containing version1 JSON+newline mode0600 → rename publish | invocation temp；finally rm force | original formal file remains before rename；error becomes warning in resolver，effects continue | [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| Owned-link cleanup | absent root empty；root symlink/non-dir empty；entry lstat nonlink retained；text/resolved source must be in owner root | each owned live entry direct unlink；dry-run record only | none | removed entries not rolled back if later error | [`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`](bin/csl-agent-kit.js#removeLegacyCodexSkillLinks) [`tests/cli-install-output.test.js#test("Codex plugin cleanup removes only owned links and is idempotent")`](tests/cli-install-output.test.js) |

Selection temp→rename is a different path/payload/mode/failure contract and does not make current symlink replacement atomic.

### Learning Targets

- **LT1**：predict front-door/parser branch、streams/status and unreachable stages.
- **LT2**：derive target order from every syntax through normalize→validate→stable dedup→dispatch and precedence.
- **LT3**：derive help/default/all/interactive/state/handler behavior from ordered registry and locate a new non-default responsibility's minimum migration entry.
- **LT4**：for all/explicit/yes/interactive，explain state/prompt/consent boundaries；state precisely that yes selects defaults rather than only authorizing.
- **LT5**：distinguish process probe/operation and filesystem contexts、dry-run/resource/cleanup contracts.
- **LT6**：predict every Cursor target state, exact fs calls、destructive window and dispatcher recovery limit.
- **LT7**：explain real handler failure continuation、successful skip and ordered results.
- **LT8**：derive JSON/human split、presentation controls and common exit predicate.
- **LT9**：design paired isolated checks for output、dispatcher/process/context/fs publication/discovery/front-door/authorization/alias/new target changes.

Prerequisites：JS control flow、Set insertion order、lstat/readlink/realpath、sync fs/process、CLI streams/status。Not covered：installed artifacts internals、general Node course、audit/change implementation/progress.

| Learning Target | Required concepts | Representative checkpoint | Prediction/transfer → Key |
| --- | --- | --- | --- |
| LT1 | command ownership/direct exits/gates | W1 command matrix | P1/T8 → K1/K16 |
| LT2 | syntax convergence/precedence/validation | W2 mixed selectors | P2/P3/T9 → K2/K3/K17 |
| LT3 | ordered registry/policies | baseline table | R2/T1/T7 → K2/K10/K15 |
| LT4 | selector-consent matrix/auth gate | W2 consent matrix/denial | P3/P4/T10 → K4/K18 |
| LT5 | process contract/effect context | W4 Codex failure/missing | P6/T4/T5 → K6/K13 |
| LT6 | fs target states/publication | W3 state contrasts | P5/T6 → K5/K14 |
| LT7 | dispatcher/skip | W4 real failure→Pi，skip→Cursor | P6/T3 → K7/K12 |
| LT8 | shared results/output | W5 JSON vs human | P7/T2 → K8/K11 |
| LT9 | paired baselines/sentinels | T1–T10 | T1–T10 → K10–K18 |

## 2. Concept Ladder

### Input convergence and value-option layers

| Exact syntax | Parser/helper | Common field | Ordering | Next stage |
| --- | --- | --- | --- | --- |
| `--target a,b` | consume next token → `splitTargets` | `options.targets` | append split values at occurrence | explicit validate→dedup→dispatch |
| `--targets a,b` | same | same | same | same |
| `--target=a,b` | slice suffix → splitTargets | same | same | same |
| positional `a,b` | non-option/non-all → splitTargets | same | same | same |
| `--all` / positional `all` | boolean | `options.all` | no target append；highest precedence | registry order |
| `--yes` / `-y` | boolean | `options.yes` | only if all false and targets empty | registry defaults；not authorization-only |

Current canonicalization is comma split/trim/empty filter only；no aliases。Validation precedes stable Set dedup，then dispatch；all > explicit > yes > interactive。[`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets)

| Value option | Parser token contract | Default | Semantic boundary | Consumer/path | Invalid and zero effects |
| --- | --- | --- | --- | --- | --- |
| `--target`/`--targets` | increments index；only truthiness check，so next `--json` is accepted as value | `targets=[]` | splitTargets text normalization；resolver validate before state/effect | options→selected→dispatcher | true missing stderr/2；option-like value unknown target stderr/2；both zero state/effect/results |
| `--target=` | empty suffix becomes empty list, no parser error | same | empty follows yes/interactive；nonempty validates | same | unknown/2；empty not itself invalid |

| Order | Concept in project | Built on behavior fact | Teaching reason | Anchor |
| --- | --- | --- | --- | --- |
| 1 | Front door：only install enters parser；others generic-help fallback | main equality | decide reachability first | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |
| 2 | Parser gate：syntax aggregation plus direct help/error exits | parse loop | separate token acceptance from semantics | [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) |
| 3 | Ordered registry：ID/default/external/handler co-located | Object keys/entries consumers | common source for selection/help/state/dispatch | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) |
| 4 | Selection vs authorization：execution selectors return before interactive；only interactive selected external metadata triggers confirm | resolver early returns and prompt type | prevents interpreting yes as authorization flag | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 5 | Filesystem identity：lstat type vs readlink/path/realpath semantic equality | ensureSymlink | predicts mutation from state | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#isSymlink`](bin/csl-agent-kit.js#isSymlink) |
| 6 | Publication safety：Cursor unlink→symlink vs selection temp→rename | distinct primitives | exposes recovery/destructive window | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| 7 | Effect context：probe inherited cwd；operation repoRoot；fs HOME/repo | call-site options | avoids global-context inference | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| 8 | Per-target result isolation；skip normal | handler try/catch + missing branch | basis for continuation policy | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| 9 | Output projection after shared results | main formatter branch | separates semantics/presentation | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) |
| 10 | Exit taxonomy：direct gate 2，result failure 1，success 0 | die/main/every | locate failure layer | [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |

## 3. Guided Code Walkthrough

### W1：Front door and direct exits

教学理由：先确认 token owner，避免混写 command admission、help renderer 与 install parser。

| argv | Branch/renderer | stdout | stderr | status | Unreachable |
| --- | --- | --- | --- | --- | --- |
| none | command defaults help→`printHelp` | generic help | empty | 0 natural | parser/state/effect/results |
| `help` | non-install fallback | generic help | empty | 0 | same |
| `--help` | not declared alias；same fallback | generic help | empty | 0 | same |
| `-h` | same | generic help | empty | 0 | same |
| `install` | accepted → parser/resolver | later-dependent | non-TTY usually admission error | usually 2 non-TTY | later gates only |
| `cursor` target-like unknown | generic fallback | generic help | empty | 0 | install stages |
| `--json` option-like unknown | generic fallback | generic help | empty | 0 | same |
| `install --help/-h` | parser→install help→exit | install help | empty | 0 | resolver/state/effect/results |
| `install --bogus` | parser→die | empty | unknown option | 2 | resolver onward |
| `install --target` | parser missing value→die | empty | requires-list | 2 | same |

Top-level help tokens share generic fallback with unknown commands；they are not explicit aliases。Admission lives in `main`，rendering in `printHelp`，subcommand syntax in parser。[`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printHelp`](bin/csl-agent-kit.js#printHelp) [`bin/csl-agent-kit.js#printInstallHelp`](bin/csl-agent-kit.js#printInstallHelp)

### W2：Gate ledger and selector/consent matrix

教学理由：authorization only exists on one selection path，so compare every selector rather than treating it as a global gate。

| Gate order | Condition | Channel/status | Later unreachable | Anchor |
| --- | --- | --- | --- | --- |
| 0 command | first token non-install | help stdout/0 | parser/state/effect/results | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |
| 1 parser | help stdout/0；syntax error stderr/2 | direct exit | resolver onward | [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) |
| 2 selector | all early return；explicit validate+dedup；yes defaults | unknown explicit stderr/2 | interactive/state/auth | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) |
| 3 environment | interactive only non-TTY/CI | stderr/2 | dependency/state/prompt/effect | resolver |
| 4 dependency | prompts missing | stderr/2 | state/prompt/effect | resolver |
| 5 state | invalid/missing→null/default choices | no output | prompt remains | [`bin/csl-agent-kit.js#loadInstallSelection`](bin/csl-agent-kit.js#loadInstallSelection) |
| 6 cancel | onCancel | stderr/2 | authorization/save/effect | resolver |
| 7 authorization | final interactive selected contains external and confirm false | stderr/2 | save/dispatcher/results | resolver + [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) |
| 8 persistence | accepted selected temp→rename | failure warning only | effects remain | [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| 9 dispatcher | per handler | throw→failure result | later target remains | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |

| Selection path | Parser fields | Resolver/selected | State read/write | Prompt | Policy derivation/auth position | Reject outcome/unreachable |
| --- | --- | --- | --- | --- | --- | --- |
| `--all` or positional `all` | `all=true`；other target tokens may still accumulate | first branch returns all registry IDs；does not validate accumulated targets | no/no | no | none；external metadata not consulted | n/a；effects directly reachable |
| `--target value` | targets append split IDs | explicit branch validate all then stable dedup | no/no | no | none | unknown stderr/2 before dispatcher/state/effects/results |
| `--targets value` | same | same | no/no | no | none | same |
| `--target=value` | same | same | no/no | no | none | same |
| positional target | same | same | no/no | no | none | same |
| `--yes/-y` only | `yes=true` | registry defaults=`codex-plugin` | no/no | no | none；despite external default | n/a；yes selects defaults rather than merely granting permission |
| no execution selector | defaults fields | after admission/state, prompt returns selected | read before prompt；accepted writes after auth | checklist；confirm only if final selected `.some(external)` | derived from final selected order/registry metadata after checklist，before save/dispatch | cancel/deny stderr/2；save/effect/results zero |

Specific contrasts：`--all --target unknown` follows all precedence and ignores unknown validation；`--target unknown --yes` follows explicit validation and fails；all/explicit/yes never prompt even for external IDs；interactive cursor-only has no confirm，Codex/Pi/mixed does；there is no authorization-only option，and yes without another selector still selects Codex。[`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets)

| Checkpoint | Prediction | Inspect | Observe | Result |
| --- | --- | --- | --- | --- |
| mixed explicit syntaxes + yes | order/consent? | parser→resolver | append→validate→dedup；yes ignored | explicit order dispatch；no state/prompt/auth |
| add all + unknown | which error? | resolver first branch | all returns before validation | registry all；unknown ignored |
| invalid saved state | fail/default? | loader→choices | errors→null | Codex default preselected；test proves [`tests/cli-install-output.test.js#test("invalid saved selection falls back to the Codex default checklist")`](tests/cli-install-output.test.js) |
| interactive external denial | state/effects? | response/auth branch | die before save/return | selection formal file unchanged；no dispatcher/results |

### W3：Filesystem state and publication

教学理由：Cursor helper exposes type、canonical identity、dry-run and failure recovery in one behavior。

| Checkpoint | Prediction | Inspect | Observe | Result |
| --- | --- | --- | --- | --- |
| different-text canonical-equivalent link | rewrite? | readlink→resolve→realpath | semantic equality | unchanged/text preserved |
| mismatch/broken | exact order? | mismatch branch | unlink then symlink | failure window leaves target absent；no rollback |
| file/directory | overwrite? | lstat gate | throw before unlink | original bytes/object retained；failure result |
| dry-run | target read/mkdir? | early return | only source realpath first | planned change；target/parent untouched |
| selection save | same protocol? | save helper | JSON temp+rename+finally | different protocol, not current link atomicity |

### W4：Process failure, dispatcher continuation, successful skip

教学理由：real Codex add failure plus Pi/Cursor later participant proves policy without abstract adapters。

| Checkpoint | Prediction | Inspect | Observe | Result |
| --- | --- | --- | --- | --- |
| `codex-plugin,pi`; fake required add exit9 | Pi/cleanup/order? | runCommands→handler→dispatcher | throw before cleanup；per-target catch continues | Codex failure then Pi result；status1；prior commands retained。Test proves add failure/cleanup boundary；later Pi needs focused assertion [`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`](tests/cli-install-output.test.js) |
| missing Codex then Cursor | skip stop? | missing branch | normal return `skip` | Codex ok:true；Cursor executes；overall can succeed |
| Codex dry-run missing PATH | probe/mutation? | handler guards | no probe/spawn/unlink | eight command records + owned removal records；tests verify [`tests/cli-install-output.test.js#test("Codex plugin cleanup dry-run reports owned links without mutating them")`](tests/cli-install-output.test.js) |

### W5：Shared results and output split

教学理由：compare projections of identical results to separate semantics from presentation。

| Point | Condition/producer | Formatter | Color/verbosity | Exit | Evidence |
| --- | --- | --- | --- | --- | --- |
| results | installTargets completes | ordered objects | none | pending | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| JSON | options.json | JSON.stringify envelope | bypass human colors/details | every(ok) | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`tests/cli-install-output.test.js#test("JSON output remains valid and color-free when --color is passed")`](tests/cli-install-output.test.js) |
| human | json false | printResults→summary/details | color mode+NO_COLOR；verbose details | same every(ok) | [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) [`bin/csl-agent-kit.js#createColors`](bin/csl-agent-kit.js#createColors) |

## 4. Human Recall, Prediction & Transfer Checks

### Material visibility order

1. **Recall**：hide Orientation/Ladder/Walkthrough/Key/source；answer prompts alone.
2. **Prediction**：正文 visible，Key/source hidden；freeze outcomes/reasons.
3. **Transfer**：正文/source visible，Key hidden；freeze entry/boundary/observable checks/location/reasons.
4. Open Key only after all initial answers；early view means review only，retest needs equivalent new prompts.

### Recall prompts

- **R1**：scope inputs/outputs/direct boundaries/non-responsibilities?
- **R2**：registry order、IDs、default/external、handlers；each policy effect?
- **R3**：explicit text→dispatch phases and selection precedence?
- **R4**：for all/explicit/yes/interactive，which read/write state、prompt、authorize；what does yes actually do?
- **R5**：Cursor six states, primitives, destructive window/recovery?
- **R6**：probe/operation contexts、required failure/skip/continuation/output exit relation?

### Prediction prompts

- **P1**：bare、`--help`、`cursor`、`install --help`、`install --bogus` streams/status/unreachable stages。
- **P2**：mixed explicit syntaxes + yes 的 order；then add all；then add unknown under all。
- **P3**：CI/non-TTY compare bare install、yes、explicit unknown：first gate/state/prompt/auth/effects。
- **P4**：compare all、each explicit syntax、yes、interactive cursor-only/external/mixed，predict consent/state；explain yes alone。
- **P5**：all Cursor target states dry/live exact calls/result/failure aftermath。
- **P6**：Codex required failure then Pi，versus missing Codex then Cursor。
- **P7**：human verbose no-color versus JSON verbose color semantics/ANSI/details/status。

### Transfer prompts

#### T1：New non-default target

Add `claude-local` default:false/external:false using `ensureSymlink` to isolated HOME `.claude/plugins/local/csl`。Assert yes baseline unchanged；all registry order includes it；help/choices/state/results canonical；all explicit syntaxes select it。Pair dry-run zero mutation/process vs actual canonical link；unknown zero state/effect。Add checks beside test `run` helper。

#### T2：New `--jsonl`

Conflict with json pre-resolver/state/effect。For each `--color`、`--no-color`、`--verbose`，overlay on both baseline JSON and JSONL；parse/compare ordered semantic results、ok/error/exit，no ANSI；cover success + real failure；retain human summary/verbose regression without target mode。Change only formatter split after shared results。

#### T3：New `--fail-fast`

Isolate HOME/PATH。Real Codex required add failure logs calls，fake Pi logs later call：baseline Pi yes，fail-fast Pi no；assert prior effects、no cleanup、result order/status1。Missing Codex successful skip followed by actual Cursor proves skip does not stop。No abstract fake dispatcher adapters。

#### T4：Timeout/retry policy

First pin target runtime spawnSync error/status/signal contract。Fake codex/pi record exact probe/operation argv/PWD/count。Cover missing、allowed nonzero、required resource failure、retry success/exhaustion、dry-run zero calls、cleanup、later participant、results/exit；classify runtime error before status；do not guess unproven fields。

#### T5：`--operation-cwd <dir>`

Parser token acceptance；realpath/existence/directory validation before resolver/state/effect。Missing/notfound/notdir stderr2 and all sentinels zero。Pass canonical cwd only to operation；probe inherited cwd、argv/repo/fs roots unchanged、no process.chdir。Isolated fake logs exact argv/PWD/count compare baseline/custom；completed effect no rollback。

#### T6：Staged symlink publication

Preserve source realpath and state classification。For absent/mismatch/broken create unique owned sibling temp `.<base>.<pid>.<time>.tmp` in target parent，payload exact sourceReal symlink text；mark ownership only after temp `symlinkSync` succeeds；`renameSync(temp,target)` is sole publish point；finally removes owned temp；never `unlinkSync(target)`。Correct canonical remains unchanged；file/dir fail before temp/rename；dry-run unchanged。

Verify all target states and inject failure at mkdir/temp-symlink/rename/finally cleanup；compare original bytes/link text、formal target canonical identity、temp residue and forbidden destructive calls。Use real later Pi to prove Cursor failure result ordering/continuation；retain JSON+human projections。Preserve consent/state/persistence、roots、other argv/cwd/env、prior effects/exit。Distinguish selection JSON mode0600 temp→rename path/payload/warning semantics。

#### T7：`--list-targets`

Conflict with every execution selector syntax/all/yes before state/resolver/dispatcher；alone derives ordered ID/default/external/title and exits。Isolate HOME/PATH/CI with state/prompt/fs/process/result/completion sentinels all zero；retain normal yes dry-run JSON flow。

#### T8：Tighten command admission

Unknown target-like/option-like first token becomes stderr2；none/help/--help/-h remain generic help0；install sole execution command。Table-test no token、all help tokens、install、two unknown classes、install help/unknown、valid flow，exact message/stream/status and all error sentinels zero。Policy in main only；preserve install selection/consent/state/effects/output/exit。

#### T9：Alias canonicalization

Add `codex`→`codex-plugin` after all syntax convergence but before validation/dedup。Cover all four forms and mixed alias/canonical duplicates；registry/default/all/interactive/state/handler/results canonical only。Real Codex dry-run 8-command and actual fake log each prove single dispatch；unknown still pre-state/effect error。

#### T10：Add explicit noninteractive authorization policy

Define new `--authorize-external` as authorization-only for execution selectors；it never selects。Used alone is parser/command-boundary error before state/prompt (`requires --target, --all, or --yes`)；interactive without it retains original checklist+conditional confirm，denial writes no selection，acceptance retains atomic persistence。After resolver has produced validated/stable selected IDs，derive authorization need from ordered selected and registry `external` metadata；for all preserve current precedence, so `--all --target unknown` still selects all rather than validating unknown。Missing authorization for external execution selection writes exact stderr/status2 before dispatcher，with state/prompt/effect/results zero。

Table-test each `--target value`、`--targets value`、`--target=value`、positional、all/positional all、yes：authorization absent/present；cursor-only succeeds without it；Codex/Pi/mixed/duplicate require it；unknown explicit fails validation before authorization；all+unknown precedence as specified；flag-alone error。Lock install help entry and existing missing-value/unknown-option errors。For all、explicit、yes separately run paired dry-run and live scenarios under isolated HOME/PATH：fake Codex/Pi log exact calls and Cursor checks filesystem；assert messages、stdout/stderr、exit、state/prompt/fs/process/results/completion sentinels。Anchor parser/help/registry/resolver/validator/new auth boundary/dispatcher/die；do not move interactive confirm or weaken save ordering。

## 5. Verification Key & Completion Standard

### Recall / Prediction Key

| Key | Must judge | Acceptable wording | Anchors/contrasts |
| --- | --- | --- | --- |
| K1 R1/P1 | orchestrates install/results；only install enters parser；top unknown help0；install help stdout0，syntax errors stderr2 | unknown command is generic fallback | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) |
| K2 R2/P2 | cursor/codex-plugin/pi exact policies/handlers；all>explicit>yes；default only Codex | registry insertion order | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| K3 R3/P2/P3 | split/trim/filter→validate→stable dedup→dispatch；unknown before state/effect；all+unknown skips explicit validation | text normalization acceptable name | [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) |
| K4 R4/P4 | all/explicit/yes zero state/prompt/consent；yes selects default external target and is not auth-only；interactive reads state，external from final selected triggers confirm，denial stderr2/no save/effect/results；cursor-only no confirm | execution selectors bypass interactive gate | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| K5 R5/P5 | absent create；canonical unchanged/text retained；mismatch/broken unlink→symlink；file/dir no target mutation；dry-run only source realpath then plan；dispatcher no rollback | must distinguish broken exists=false+lstat symlink | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#isSymlink`](bin/csl-agent-kit.js#isSymlink) |
| K6 R6 | probe inherits cwd/env，operations repoRoot/inherited env，fs HOME/repo；dry-run no probe/spawn/mutation | call-specific context | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| K7 R6/P6 | required add fails Codex/no cleanup，dispatcher continues Pi，ordered results/status1/prior effects remain；missing skip ok and later Cursor runs | later real participant required | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| K8 P7 | shared results precede split；JSON bypasses human color/details；human applies them；same every(ok) | presentation does not alter semantic results | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) |
| K9 P3 | bare install fails environment；yes returns defaults before it；unknown validates before it；none write state，yes alone reaches effects | gate order mandatory | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |

### Transfer Key

| Key | Must judge / assertions | Acceptable alternative | Anchor/location |
| --- | --- | --- | --- |
| K10 T1 | one registry entry+handler；default false preserves yes；all/help/choices/state derived；all syntaxes；dry zero fs/process vs actual canonical link；unknown zero state/effect | concrete nondefault ID may differ | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) |
| K11 T2 | json/jsonl conflict pre-effect；both modes each overlay all presentation options；parsed success/failure semantics and exit equal/no ANSI；human regression | JSONL shape may normalize | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`tests/cli-install-output.test.js#test("JSON output remains valid and color-free when --color is passed")`](tests/cli-install-output.test.js) |
| K12 T3 | real Codex failure；baseline Pi called vs failfast not；prior effects/no cleanup/order/status；missing skip does not stop actual participant | later existing handler may vary | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`tests/cli-install-output.test.js#createFakeCodex`](tests/cli-install-output.test.js) |
| K13 T4/T5 | probe+operation exact argv/PWD/count，runtime-error-first，all missing/allowed/resource/dry/cleanup/later/result branches；cwd validation pre-state/effect and operation-only，probe/roots/nonprocess unchanged，invalid zero/no chdir | policy numeric values flexible | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| K14 T6 | exact classify→owned sibling temp symlink→rename publish→finally cleanup；no target unlink；all states/new primitive failures compare bytes/text/formal/temp/calls；later real Pi and JSON/human；selection protocol distinct | temp scheme can differ if unique/same-boundary/owned/payload exact | [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| K15 T7 | full selector conflict；registry-derived output；early state/prompt/effect/result/completion zero under CI/HOME/PATH；normal regression | fixed JSON or text accepted | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |
| K16 T8 | matrix all required tokens/branches exact stream/status；front-door error sentinels zero；install contracts preserved；policy in main | help aliases may become explicit but all listed | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printHelp`](bin/csl-agent-kit.js#printHelp) |
| K17 T9 | alias after convergence before validate/dedup；all forms/mix dispatch once；no alias leaks；real Codex dry/live once；unknown zero state/effect | different concrete alias to existing handler | [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| K18 T10 | authorization flag only authorizes, never selects；flag-alone pre-state error；need derived after validation/dedup from ordered selected+registry；every selector syntax/all/yes covers absent/present，cursor-only/mixed/duplicate/unknown/all+unknown；execution reject stderr2 and every sentinel zero；interactive confirm/deny/atomic save unchanged；help/parser locked；all/explicit/yes each dry+live under isolated HOME/PATH | flag name may differ if semantics and complete matrix remain | [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) [`bin/csl-agent-kit.js#printInstallHelp`](bin/csl-agent-kit.js#printInstallHelp) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) |

### Completion Standard

Human completes only after freezing all Recall、Prediction、Transfer initial answers in the required visibility order，then opening Key and satisfying K1–K18 judgments/contrasts/causal explanations。Early Key view is review only；no completion record/profile/progress file。Agent may read continuously and cannot claim active recall or learned status；only sealed held-out tasks outside this report can judge whether the material supports reasoning。
