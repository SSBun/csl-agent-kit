# CLI 安装组件源码学习指南

## 1. Learning Orientation & Targets

- **Scope**：`bin/csl-agent-kit.js`
- **HEAD**：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- **Working tree**：`clean`
- **Generated at**：`2026-07-20T01:16:35+0800`
- **Learner assumption**：读者理解 JavaScript、Node.js 同步文件/进程 API、CLI 退出码、Git 与测试，但不了解本仓库的安装领域模型。
- **Material status**：`学习材料就绪`

该文件由 npm binary 和兼容 wrapper 进入，把 argv 与运行上下文解析成有序安装目标，选择性持久化交互选择，调用 Cursor/Codex/Pi effect，并把统一结果投影为 JSON 或终端输出。[`package.json#bin`](package.json#bin) [`scripts/install.sh`](scripts/install.sh) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) 直接边界是 `prompts`、用户目录文件系统以及 `codex`/`pi` 子进程；plugin、skill、hook 与 Pi extension 安装后的行为不属于本 scope。[`package.json#dependencies`](package.json#dependencies) [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi)

### Registry 行为基线

声明顺序会影响 `--all`、默认筛选、交互 choices、help、selection state 过滤和结果顺序，因此必须先掌握精确 registry，而不能只记“registry-driven”。

| 声明顺序 | Stable ID | `default` | `external` | Handler | 主要职责 | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `cursor` | `false` | `false` | `installCursor` | 把仓库根链接到 `~/.cursor/plugins/local/csl` | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) |
| 2 | `codex-plugin` | `true` | `true` | `installCodexPlugin` | 重建 Codex marketplace/plugin 注册，再清理 owned legacy skill links | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| 3 | `pi` | `false` | `true` | `installPi` | 调用 `pi install <repoRoot>` | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) |

### External process contract

| Handler / primitive | Availability probe | Operation | Dry-run | Missing | 普通 nonzero / allowFailure | 抛错与 cleanup 顺序 | Timeout / retry / cancellation | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `installCodexPlugin` → `hasCommand` / `runCommands` | 非 dry-run 执行 `codex --version`；参数固定，stdio ignored | 依次六个 remove、marketplace add、plugin add；operation cwd=`repoRoot` | 不 probe、不 spawn；生成 8 个 planned command，随后只报告 owned-link removal | probe `status !== 0` 时返回 `skip` change，target 仍成功 | 六个 remove 的 `allowFailure=true`，nonzero 仍记录 status；两个 add 为 false，nonzero 抛错 | 必需 add 抛错后 legacy cleanup 不可达；正常命令全部完成后才 cleanup | 均为 `无` | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`](tests/cli-install-output.test.js) |
| `installPi` → `hasCommand` / `runCommands` | 非 dry-run 执行 `pi --version` | `pi install <repoRoot>`，`allowFailure=false` | 不 probe、不 spawn；返回一个 planned command | 返回 `skip` change，target 仍成功 | operation nonzero 抛错 | 无 handler-specific cleanup | 均为 `无` | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| `runCommands` 底层 spawn | 无 | `spawnSync(cmd,args,{cwd:repoRoot,encoding:"utf8"})` | 在 spawn 前 continue | 不自行分类；`status` 由调用结果决定 | 先比较 `status`，仅 `allowFailure=false` 抛错；true 则记录 status | 已完成的前序命令不回滚 | 均为 `无` | [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |

静态源码没有单独检查 `spawnSync` 的 `result.error`；因此将来增加 timeout/retry 时，必须先以目标 Node runtime 的实际 error contract 确认资源失败字段，再在普通 status 分类之前处理，不能从本报告猜字段。[`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand)

### Effect context matrix

| Effect / handler | Primitive | 精确 argv | cwd | env | Path / source / ownership root | Guard / dry-run | 默认上下文 | 失败结果与 cleanup | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cursor link / `installCursor` | `ensureSymlink` + `fs` | 不适用 | 不适用 | `os.homedir()` 间接受当前进程 HOME | target=`HOME/.cursor/plugins/local/csl`；source=`realpath(repoRoot)` | dry-run 在 mkdir/unlink/symlink 前返回计划 | 当前用户 HOME 与文件所在仓库根 | 非 symlink 冲突或 fs 错误抛错；替换旧 symlink 时先 unlink，后续 symlink 失败不回滚 | [`bin/csl-agent-kit.js#installCursor`](bin/csl-agent-kit.js#installCursor) [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) |
| Codex probe | `hasCommand` / `spawnSync` | `codex --version` | 未传 `cwd`，继承 CLI 进程 cwd | 未传 `env`，继承当前 env/PATH | 无文件 root | 仅 live；dry-run 跳过 | 调用进程 cwd/env | 非零或 missing 都转 successful skip；无 cleanup | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| Codex operations | `runCommands` / `spawnSync` | registry handler 中固定的 8 组 `codex plugin ... --json` | 显式 `repoRoot` | 继承当前 env | marketplace add argv 使用 `repoRoot` | dry-run 生成 command records，不 spawn | 文件所在仓库根 | allowed remove 失败继续；required add 失败抛错；已完成命令不回滚 | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| Codex legacy cleanup | `removeLegacyCodexSkillLinks` + `fs` | 不适用 | 不适用 | HOME 间接影响目录 | ownership root=`realpath(repoRoot/skills)`；scan root=`HOME/.agents/skills` | command 阶段成功后；dry-run 不 unlink | 仓库 skills 与当前用户 HOME | 只移除 link 文本或解析结果在 ownership root 内的 symlink；finally 不适用 | [`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`](bin/csl-agent-kit.js#removeLegacyCodexSkillLinks) [`bin/csl-agent-kit.js#isWithin`](bin/csl-agent-kit.js#isWithin) |
| Pi probe | `hasCommand` / `spawnSync` | `pi --version` | 继承 CLI 进程 cwd | 继承当前 env/PATH | 无文件 root | 仅 live；dry-run 跳过 | 调用进程 cwd/env | 非零或 missing 转 successful skip | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) |
| Pi operation | `runCommands` / `spawnSync` | `pi install <repoRoot>` | 显式 `repoRoot` | 继承当前 env | argv source root=`repoRoot` | dry-run 不 spawn | 文件所在仓库根 | nonzero 抛错；无 cleanup | [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) |
| Interactive selection state | `loadInstallSelection` / `saveInstallSelection` + `fs` | 不适用 | 不适用 | `CSL_AGENT_KIT_HOME` 优先，否则 HOME | data root=`CSL_AGENT_KIT_HOME` 或 `HOME/.csl-agent-kit` | 仅交互确认后写；执行 selectors 不读写；dry-run 仍会保存已确认交互选择 | 当前用户 data root | 读取失败回退默认；写入用同目录 temp+rename+finally rm，失败只 warning，安装继续 | [`bin/csl-agent-kit.js#installSelectionFile`](bin/csl-agent-kit.js#installSelectionFile) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |

所有上下文都随单次 helper/spawn 调用传播；源码没有 `process.chdir` 或对 `process.env` 的赋值，不能把 operation 的 `repoRoot` cwd 误推到 probe、filesystem 或全局进程。[`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand)

### Learning Targets

- **LT1**：逐 token 预测 front door 与 install parser 的 stdout/stderr、退出状态和后续不可达阶段。
- **LT2**：从所有 selector 语法推导统一 target 序列，解释 normalization、validation、稳定去重、precedence、默认值与 consent/state 边界。
- **LT3**：从 registry metadata 推导 default/all/help/interactive/handler 行为，并定位新增非默认 target 的最小迁移入口。
- **LT4**：区分 probe、operation、filesystem 与 cleanup 的 argv/cwd/env/root、dry-run 和资源策略。
- **LT5**：解释 dispatcher 如何隔离真实 handler 失败、继续后续 target，并区分 successful skip 与失败。
- **LT6**：从统一 results 推导 JSON/终端分流、color/verbose 控制和一致退出谓词。
- **LT7**：能为 output、dispatcher policy、process policy、effect context、discovery、command admission 与 alias 变更设计成对、隔离且可观察的验证。

必需前置：JavaScript 控制流、`Set` 插入顺序、同步 `fs`/`spawnSync`、stdout/stderr 与退出码。明确不覆盖：plugin 内容、通用 Node 教程、代码质量/安全审计、改动实现方案或实际学习进度。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1 | front door、parser direct exit、gate ordering | W1：无 token/help/unknown/install help/install unknown | P1，T8 → K1/K15 |
| LT2 | input convergence、precedence、validation、stable dedup、state/consent | W2：混合 selector 与交互拒绝 | P2、P3，T7 → K2/K3/K14 |
| LT3 | ordered registry、policy metadata、handler binding | registry 表与 W2 | R2，T1/T6 → K2/K9/K13 |
| LT4 | probe vs operation、effect context、dry-run、cleanup | W3：Codex live/dry-run/failure；context matrix | P4，T4/T5 → K4/K5/K12 |
| LT5 | per-target catch、ordered results、skip-as-success | W3：真实 Codex add failure 后的 Pi；missing Codex skip | P5，T3 → K6/K11 |
| LT6 | shared results、formatter split、color/verbosity、exit predicate | W4：`--json --color` 对比 human verbose | P6，T2 → K7/K10 |
| LT7 | paired baselines、isolated state/effects、sentinels | T1–T8 | T1–T8 → K9–K15 |

## 2. Concept Ladder

### 输入语法汇流与顺序语义

| 精确语法 | Parser 分支 / helper | 共同字段 | 顺序语义 | 后续 |
| --- | --- | --- | --- | --- |
| `--target a,b` | 取下一个 token；`splitTargets` | `options.targets` | 在当前位置追加拆分结果 | explicit 分支 validate → stable dedup → dispatch |
| `--targets a,b` | 与 `--target` 共用分支和 `splitTargets` | `options.targets` | 同上 | 同上 |
| `--target=a,b` | 截取等号后字符串；`splitTargets` | `options.targets` | 同上 | 同上 |
| 位置 token `a,b` | 任何不以 `-` 开头且不是位置 `all`；`splitTargets` | `options.targets` | 同上 | 同上 |
| `--all` | 直接置 `options.all=true` | `options.all` | 不向 targets 追加；resolver 优先级最高 | 返回 `Object.keys(targets)` 声明顺序 |
| 位置 token `all` | 与 `--all` 同一分支 | `options.all` | 同上 | 同上 |
| `--yes` / `-y` | 置 `options.yes=true` | `options.yes` | 仅在 `all=false` 且 targets 为空时生效 | 按 registry 顺序筛 `default=true` |

当前所谓 canonicalization 只有 `splitTargets` 的 comma split、trim 与空项过滤，没有 alias 映射；随后 `resolveInstallTargets` 对整个显式数组执行 `validateTargets`，通过后才用 `new Set` 稳定去重，最后按所得顺序派发。`all` 覆盖显式 targets，显式 targets 覆盖 `yes`，`yes` 覆盖 interactive。[`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets)

### 带值 option：token 接纳与语义验证分层

| Option | Parser token contract | 默认值 | Normalization / validation boundary | 最终 consumer 与传播 | 无效值结果 |
| --- | --- | --- | --- | --- | --- |
| `--target` / `--targets` | 仅递增索引并检查 token 是否 truthy；若下个 token 是 `--json`，parser 仍把它当值 | `targets=[]` | `splitTargets` 做文本 normalization；`resolveInstallTargets` 在 state/resolver effect 前调用 `validateTargets` | `options.targets` → resolver → selected → `installTargets` | 真缺值：stderr + status 2；像 option 的值：作为 unknown target 在 validation 时 stderr + status 2；两者均无 state/effect/results |
| `--target=<value>` | 等号后可为空；空值被过滤，不触发 parser 缺值 | `targets=[]` | 空数组会继续走 `yes` 或 interactive；非空仍由 `validateTargets` | 同上 | unknown status 2；空值不是错误，而是“未显式选择” |

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | Front door：只有首 token `install` 进入安装 parser，其余 token 都打印通用帮助并自然成功 | `main` 的唯一 command equality branch | 先判定某 token 是否会进入组件主要行为，避免把顶层 unknown 当 parser error | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printHelp`](bin/csl-agent-kit.js#printHelp) |
| 2 | Install parser：把 selector、effect 与 presentation flag 汇成 options，并拥有 help/unknown/missing-value direct exits | 单循环与 `die`/`process.exit` | 区分语法 gate 与后续语义 gate | [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) |
| 3 | Ordered registry：stable ID、default、external 与 handler 共置，声明顺序参与多处行为 | `targets` 与所有 `Object.keys/entries` consumer | 建立 selection、help、state、dispatch 的共同来源 | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) |
| 4 | Selection precedence：all → explicit validate/dedup → yes/default → interactive | resolver 的 early returns | 同一 options 组合的实际结果由 precedence 而非 token 最后出现者决定 | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 5 | Admission/state/authorization：只在 interactive 路径读取、询问、确认与保存 | TTY/CI gate 位于 require/state 前；external confirmation 位于 save/effect 前 | 能预测拒绝时哪些状态和 effect 不可达 | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) |
| 6 | Effect context：probe 继承 cwd，operation 显式 repoRoot，filesystem 由 HOME/repoRoot 分治 | 两类 spawn 选项和 path helpers 不同 | 防止把一个调用点的上下文误推广为全局上下文 | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#home`](bin/csl-agent-kit.js#home) |
| 7 | Result isolation：每个 handler 异常变成一项失败结果，循环继续；skip 是成功 changes | `installTargets` 每轮独立 try/catch | 为停止策略和真实后续参与者预测建立基础 | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) |
| 8 | Output projection：共享 results 后才按 `json` 分流；human 内部再处理 color/verbose | `main` 先 dispatch 后 formatter branch | 避免把呈现选项误认为会改变 effect 或结果语义 | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) [`bin/csl-agent-kit.js#createColors`](bin/csl-agent-kit.js#createColors) |
| 9 | Exit contract：parser/admission/auth 用状态 2，未捕获 main error 用 1，安装结果以 every(ok) 得 0/1 | 三个 exit primitive 所在边界 | 退出码同时表达失败发生在哪一层 | [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |

## 3. Guided Code Walkthrough

### W1：front door 与 direct exits

教学理由：先用不会产生 effect 的分支校准“哪个 parser 实际获得控制权”，后续 gate 顺序才不会错位。

| argv（CLI 名之后） | 实际分支 / renderer | stdout | stderr | status | 因此不可达 |
| --- | --- | --- | --- | --- | --- |
| `[]` | 缺失首 token 默认 `command="help"` → `printHelp` | 通用 help | 空 | 0（自然结束） | install parser、state、effect、results |
| `help` | 非 `install` fallback → `printHelp` | 通用 help | 空 | 0 | 同上 |
| `--help` | 没有顶层 alias 分支；仍是非 `install` fallback | 通用 help | 空 | 0 | 同上 |
| `-h` | 同上 | 通用 help | 空 | 0 | 同上 |
| `install` | accepted command → `parseInstallArgs([])` | 取决于后续 admission | 取决于后续 admission | 非交互通常 2；交互取决于回答 | 只有 parser 后 gate 可达 |
| `cursor`（target-like unknown command） | 非 `install` fallback | 通用 help | 空 | 0 | install parser、validation、state、effect、results |
| `--json`（option-like unknown command） | 非 `install` fallback | 通用 help | 空 | 0 | 同上 |
| `install --help` / `install -h` | install parser → `printInstallHelp` → direct exit | install help，targets 按 registry 顺序 | 空 | 0 | selection、state、effect、results、completion |
| `install --bogus` | install parser → `die` | 空 | `Error: Unknown install option: --bogus` | 2 | selection、state、effect、results |
| `install --target` | parser 缺值 → `die` | 空 | requires-list error | 2 | 同上 |

front door 没有把 `help`、`--help`、`-h` 声明为 aliases；它们只是和所有其他非 `install` token 一样命中通用 fallback。该差异会决定未来“收紧 command admission”应改 `main`，而不是改 help renderer 或 install parser。[`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printHelp`](bin/csl-agent-kit.js#printHelp) [`bin/csl-agent-kit.js#printInstallHelp`](bin/csl-agent-kit.js#printInstallHelp)

### W2：parser 之后的 gate ledger

教学理由：用一个有序 ledger 区分 parser error、环境 admission、state load、authorization 与 direct exit，明确失败让哪些后续状态不可达。

| Gate 顺序 | 条件 / 分支 | 输出通道与状态 | 不可达的后续 | Anchor |
| --- | --- | --- | --- | --- |
| 0. command admission | 首 token不是 `install` | `printHelp` stdout，status 0 | install parser 及全部主要行为 | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |
| 1. parser direct exit | install help → stdout/status 0；unknown option 或真缺值 → stderr/status 2 | `printInstallHelp` 或 `die` | resolver、state、effect、results | [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) |
| 2. selector resolution | `all` 立即返回；否则显式 target 先 validation 后 stable dedup；否则 `yes` 返回 defaults | unknown target → stderr/status 2 | state、prompt、effect、results | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) |
| 3. environment admission | 仅 interactive；stdin 非 TTY 或 `CI` truthy | stderr/status 2 | require prompts、state load、prompt、effect | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 4. dependency admission | 仅 interactive；`require("prompts")` 失败 | stderr/status 2 | state load、prompt、effect | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 5. state load | 读取 selection；无效/缺失/读取失败均回退 defaults | 无直接输出；继续 | 不阻塞 prompt | [`bin/csl-agent-kit.js#loadInstallSelection`](bin/csl-agent-kit.js#loadInstallSelection) |
| 6. prompt cancellation | `onCancel` | stderr/status 2 | authorization、save、effect | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 7. authorization | selected 含 external 且 confirm false | stderr/status 2 | save、effect、results | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 8. selection persistence | 已授权后 atomic save；失败 catch | stderr warning，但不退出 | effect 仍可达；失败不是 authorization denial | [`bin/csl-agent-kit.js#saveInstallSelection`](bin/csl-agent-kit.js#saveInstallSelection) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| 9. dispatcher | selected 逐项 handler | 异常转 result，不直接输出 | 仅单 target 后续步骤不可达；后续 target 仍可达 | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| 10. projection/exit | results 完整后 | JSON 或 human stdout；status 0/1 | 无 | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |

代表检查点：`install --all --target pi --yes` 由 `all` 获得 registry 全序列；`install --target pi,cursor,pi` 先全量验证，再稳定去重为 `pi,cursor`；`install --yes` 只得 `codex-plugin`；这些执行 selector 都不读取或改写 selection state，也不走 interactive external consent。[`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`tests/cli-install-output.test.js#test("explicit target installs do not overwrite the saved interactive selection")`](tests/cli-install-output.test.js)

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| 混合显式语法 | 先写下 target 顺序与重复项 | `parseInstallArgs` → `splitTargets` → `resolveInstallTargets` | 所有形式追加到同一数组；validation 在 dedup 前 | 一个 unknown 重复项仍先失败；合法项按首次出现顺序派发 |
| invalid saved state | 预测是失败还是默认 | `loadInstallSelection` → `buildInstallChoices` | 错误被 catch；过滤后无有效项返回 null | 交互 checklist 回退仅勾选 `codex-plugin`；聚焦测试直接验证此分支 [`tests/cli-install-output.test.js#test("invalid saved selection falls back to the Codex default checklist")`](tests/cli-install-output.test.js) |
| external consent denial | 预测 selection 文件和 handlers 是否触发 | `resolveInstallTargets` 中 response 后半段 | denial 在 save 与 return 前调用 `die` | selection state 与 effects 都为零 |

### W3：真实 effect、失败隔离与 successful skip

教学理由：`codex-plugin` 同时具有可重复 fake 失败、cleanup 顺序和 skip 分支，配上后续 `pi` 最小充分地揭示 dispatcher 策略。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| `codex-plugin,pi`，fake codex 在 `plugin add` 返回 9 | 写下 Pi 是否仍运行、结果顺序与 exit | `installCodexPlugin` → `runCommands` → `installTargets` | required add 抛错；cleanup 未调用；dispatcher catch 后继续循环 | results 先 Codex failure、后 Pi result；整体 status 1；前序 Codex 命令不回滚。现有测试证明真实 add failure 与 cleanup 不可达，后续 Pi 参与需新增聚焦断言 [`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`](tests/cli-install-output.test.js) |
| PATH 中无 codex，后续含 `cursor` | 判断 skip 是否停止 | `installCodexPlugin` missing 分支 → `installTargets` | handler 正常返回 `[{action:"skip"}]` | Codex result `ok:true`，后续 Cursor 仍参与，skip 不会使整体失败 |
| `codex-plugin --dry-run` 且 PATH 无 codex | 判断 probe、operation、cleanup 是否执行 | handler dry-run guard、`runCommands`、cleanup | probe 被跳过，8 个 command 和 owned-link removal 仅形成 records | 不依赖外部 CLI 可用性，文件系统不变；测试验证 command 顺序与 links 不变 [`tests/cli-install-output.test.js#test("Codex plugin cleanup dry-run reports owned links without mutating them")`](tests/cli-install-output.test.js) |
| symlinked `~/.agents/skills` | 判断是否遍历 | `removeLegacyCodexSkillLinks` 的 lstat gate | root 是 symlink 立即返回空 | 不触碰被指向的外部树；聚焦测试验证 [`tests/cli-install-output.test.js#test("Codex plugin cleanup does not traverse a symlinked legacy skills directory")`](tests/cli-install-output.test.js) |

### W4：共享结果之后的输出分流

教学理由：从同一 results 比较机器/人类输出，可以把 effect 语义、presentation controls 和 exit predicate 分开。

| 控制点 | 精确条件 | Formatter / renderer | color / verbosity | Exit predicate | Evidence |
| --- | --- | --- | --- | --- | --- |
| 统一结果生产 | `installTargets(selected,options)` 完整返回 | 有序 `{target,ok,changes|error}` | 不应用呈现选项 | 尚未退出 | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| JSON | `options.json === true` | `JSON.stringify({ok: every(ok),results}, null, 2)` → `console.log` | `--color`、`--no-color`、`NO_COLOR`、`verbose` 均不经过 human renderer | `results.every(item.ok)` | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`tests/cli-install-output.test.js#test("JSON output remains valid and color-free when --color is passed")`](tests/cli-install-output.test.js) |
| Human | `options.json === false` | `printResults` → `summarizeChanges`；verbose 时 `printChangeDetails` | `createColors(colorMode)`：always 开、never 关、auto 由 `NO_COLOR` 决定；verbose 只展开详情 | 同一 `results.every(item.ok)` | [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) [`bin/csl-agent-kit.js#createColors`](bin/csl-agent-kit.js#createColors) [`tests/cli-install-output.test.js#test("verbose install output includes underlying paths")`](tests/cli-install-output.test.js) |
| Human completion | 每项 summary 后 | success/failed 计数与 `Done`/`Finished with errors` | 颜色只影响 ANSI | 不重新定义退出码 | [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) |

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| `--json --color --verbose` | JSON 是否含 ANSI/详情文本 | `main` formatter branch | json 分支完全绕过 `printResults/createColors/printChangeDetails` | JSON 仍可 parse、无 ANSI，results 语义不因呈现 flag 改变 |
| human `--verbose --no-color` | 摘要、详情、ANSI、状态 | `printResults`/`printChangeDetails`/`createColors` | details 出现，paint 返回原文 | stdout 有路径/命令但无 ANSI；状态仍只由 results 决定 |

## 4. Human Recall, Prediction & Transfer Checks

### 材料开放顺序

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Verification Key 和源码，只看 Recall prompts 并独立作答。
2. **Prediction**：正文可见，Verification Key 与源码仍隐藏；先固定预测及理由。
3. **Transfer**：正文与源码可见，Verification Key 仍隐藏；固定入口、影响边界、最小可观察断言、验证位置和理由。
4. 三类初始答案全部固定后才打开 Key，用报告和源码逐项核对并补充因果解释。任何阶段提前查看 Key，本轮只算复习；重新测试必须换等价 prompts。

### Recall prompts

- **R1**：这个文件从什么输入产生哪些主要输出？哪些相邻职责明确不归它管？
- **R2**：按声明顺序写出三个 target 的 stable ID、default/external policy 与 handler，并解释两个 policy 各改变什么行为。
- **R3**：写出 all、explicit、yes、interactive 的 precedence，以及 explicit target 从文本到 dispatch 的四个阶段。
- **R4**：为什么 Codex CLI missing 是成功结果，而 required `plugin add` nonzero 是失败结果？失败后 dispatcher 做什么？
- **R5**：probe 与 operation 的 cwd 有何区别？Cursor/legacy cleanup 的 source/ownership root 又来自哪里？
- **R6**：JSON 与 human output 在哪里分流？color、verbose 与最终退出码分别由什么控制？

### Prediction prompts

- **P1**：分别预测 `csl-agent-kit`、`csl-agent-kit --help`、`csl-agent-kit cursor`、`csl-agent-kit install --help`、`csl-agent-kit install --bogus` 的 stdout/stderr、status 与后续不可达阶段。
- **P2**：预测 `install --target pi,cursor --targets cursor --target=codex-plugin,pi --yes` 的最终 dispatch 顺序；再加入 `--all` 后重新预测并说明原因。
- **P3**：在非 TTY 且 `CI=1` 时，比较 `install`、`install --yes`、`install --target unknown`：哪个 gate 先失败，selection file、prompt 与 effects 各是否可达？
- **P4**：比较 PATH 无 codex 时 `codex-plugin` live 与 dry-run 的 probe、command records、cleanup、result 与退出码。
- **P5**：用 fake codex 让 required add 失败且 selected 为 `codex-plugin,pi`；预测已执行副作用、legacy cleanup、Pi 调用、results 顺序与最终 status。再把 Codex 场景改为 missing，判断哪些结论变化。
- **P6**：同一成功 results 分别叠加 human `--verbose --no-color` 与 `--json --verbose --color`，预测可解析语义、ANSI、详情文本和 status。

### Transfer prompts

#### T1：新增非默认 filesystem target

设计一个 stable ID 为 `claude-local`、`default:false`、`external:false` 的 target，handler 复用 `ensureSymlink` 把 `repoRoot` 链到隔离 HOME 下的 `.claude/plugins/local/csl`。固定最小入口与成对断言：registry/help/interactive choices/state 都只保存 canonical ID；`--yes` 前后仍只选 `codex-plugin`，`--all` 按新声明顺序包含它；四种 explicit 汇流语法都能选择它。以隔离 HOME 比较 dry-run（报告 link、文件系统零变化）与 actual（创建指向 `realpath(repoRoot)` 的 link），并断言不启动 process；unknown target 仍在 state/effect 前 status 2。验证落在 `tests/cli-install-output.test.js` 的 CLI helper 附近。

#### T2：新增 `--jsonl` output mode

先定义它与 `--json` 的冲突在 parser 后、resolver/state/effect 前 status 2。对每个相关正交 option `--color`、`--no-color`、`--verbose`，分别运行 baseline `--json` 与变化侧 `--jsonl`：解析两者，比较 target/result/change 顺序、`ok` 与 exit status 完全相同，且均无 ANSI；再保留一个不启用 `--jsonl` 的 human summary+verbose 回归断言。失败 results 也必须比较 status 1 与 error 语义，不能只验证成功侧。锚定统一生产点 `installTargets` 与分流点 `main`，而不是改 handler。

#### T3：新增 `--fail-fast` dispatcher policy

在隔离 HOME/PATH 中使用现有真实 `codex-plugin` 与 `pi`：fake codex 在 required `plugin add` 失败并记录精确 argv，fake pi 记录调用。baseline 必须证明失败后 Pi 仍执行；变化侧证明 Pi 不执行；两侧核对 Codex 前序命令保留、legacy cleanup 不执行、结果顺序和 status 1。另用 PATH 无 codex 的 successful skip 后接真实 Cursor link，证明 skip 不触发 fail-fast，Cursor 仍执行且整体成功。不要用抽象 fake adapter 代替现有 handlers。[`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`tests/cli-install-output.test.js#createFakeCodex`](tests/cli-install-output.test.js)

#### T4：为外部 process 增加 timeout/retry policy

先在目标 Node runtime 写聚焦检查确认 `spawnSync` missing、timeout/resource failure 的实际 error/status/signal contract；分类顺序必须先处理 runtime error，再处理普通 status。用会记录每次精确 argv、PWD 与调用次数的 fake `codex`/`pi`，分别覆盖 probe 与 operation：missing、allowed remove nonzero、required add resource failure、retry 后成功/耗尽、dry-run 零调用、cleanup 是否可达、后续 Pi 是否参与、results 与 exit。断言 probe 重试策略与 operation 策略各自明确；已完成命令不回滚；resource-policy failure 不得误当 allowed status；报告未证明的 runtime 字段必须由实现时测试固定。

#### T5：新增 `--operation-cwd <dir>` effect context

parser 只接纳 token；在 resolver/state/effect 前做 `realpath`、存在性与 directory 语义验证，missing/不存在/非目录均 stderr/status 2，selection state 与 effect logs 为零。仅把 canonical cwd 传给 `runCommands` 的 operation spawn；`hasCommand` probe 仍继承 CLI cwd，Codex/Pi argv 与 repoRoot 参数、Cursor link、legacy ownership/scan roots均保持不变，也不得 `process.chdir`。隔离 HOME/PATH，用 fake executables 的精确 argv、PWD、每 handler 次证实传播边界；比较 baseline 默认 repoRoot 与新 cwd，且已完成 effect 在后续 target 失败时不回滚。

#### T6：新增 `install --list-targets` discovery mode

定义与执行 selectors 的冲突矩阵：`--target`、`--targets`、`--target=`、位置 target、`--all`、位置 `all`、`--yes/-y` 任一并用均在 state/resolver/dispatcher 前 status 2；单独使用则从 registry 声明顺序与 metadata 精确派生 stable ID/default/external/title，随后早退。隔离 HOME/PATH、`CI=1`，设置 selection 文件、prompt、filesystem、process、results/completion sentinels，断言 discovery 不读取/写入 state、不要求 TTY、不 prompt、不调 adapter、不产生普通 completion；再保留未启用该模式的 `--yes --dry-run --json` 主流程回归。

#### T7：新增 alias canonicalization

把 `codex` 定义为 `codex-plugin` alias，并把 canonicalization 放在 `splitTargets` 汇流之后、`validateTargets` 与稳定去重之前。覆盖 `--target value`、`--targets value`、`--target=value`、位置 token 以及 `codex,codex-plugin,codex` 混合输入；证明 registry、default/all、interactive/state、handler 和 result 始终只使用 canonical ID。以真实 Codex handler 比较 dry-run 的 8-command 顺序与 actual fake executable 日志，证明只派发一次；另保留 unknown identifier 在 state/effect 前 status 2。

#### T8：收紧顶层 command admission

把 target-like/option-like unknown 首 token 从当前“通用帮助且 status 0”改为 stderr/status 2，但保持缺失首 token、`help`、`--help`、`-h` 输出通用帮助 status 0，`install` 为唯一合法执行 command。表驱动覆盖：无 token、每个 help token、`install`、target-like unknown、option-like unknown、`install --help`、`install --bogus` 与一个合法 `install --yes --dry-run --json`。在隔离 HOME/PATH 下以 selection、prompt、filesystem、process、results/completion sentinels 证明错误分支零后续；策略只放在 `main` front door，不借 `printHelp` 或 `parseInstallArgs` 改类，同时回归 selector precedence、consent/persistence、effects、machine/human output 和退出契约。

## 5. Verification Key & Completion Standard

### Recall / Prediction Key

| Key | 必须判断 | 可接受替代表述 | 源码锚点与必要对比分支 |
| --- | --- | --- | --- |
| K1（R1/P1） | Scope 负责 install orchestration 与结果投影；顶层只有 `install` 进入 parser，其他 token 当前都打印 help/status 0；install help 为 stdout/0，install syntax error 为 stderr/2 | “unknown command 当前被当作 help fallback” | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) [`bin/csl-agent-kit.js#die`](bin/csl-agent-kit.js#die) |
| K2（R2/P2） | 顺序 `cursor`、`codex-plugin`、`pi`；default 仅 Codex；external 为 Codex/Pi；handler 精确对应；all 覆盖 explicit，explicit 覆盖 yes | 可用“registry insertion order”解释顺序 | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |
| K3（R3/P2/P3） | explicit 流程为 split/trim/filter → validate → stable dedup → dispatch；unknown 在 state/effect 前 status 2；执行 selectors 绕过 TTY/state/consent | 把 split/trim/filter统称文本 normalization，但必须保留 validation-before-dedup | [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) |
| K4（R5/P4） | Codex/Pi probe 继承 CLI cwd，operation 显式 repoRoot；env 都继承；Cursor/cleanup 不经过 process；dry-run 不 probe、不 spawn、不 unlink | “spawn 未给 cwd”可表述为继承 `process.cwd()` | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) |
| K5（P4） | missing live → successful skip；dry-run 即使 missing 也计划 commands；Codex cleanup 仅在命令正常返回后，dry-run 只报告 owned links | “missing 不算 target failure” | [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`](bin/csl-agent-kit.js#removeLegacyCodexSkillLinks) |
| K6（R4/P5） | required Codex add 失败转该 target failure，cleanup 不可达；dispatcher 继续 Pi；结果保持 selected 顺序，整体 status 1；missing 则 skip ok、后续继续、整体可成功 | 已完成 effect 不回滚必须出现 | [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`tests/cli-install-output.test.js#test("Codex plugin add failure leaves owned legacy links untouched")`](tests/cli-install-output.test.js) |
| K7（R6/P6） | results 在 formatter 前统一产生；json 精确绕过 human/color/verbose renderer；human 才应用 color/verbose；payload ok 与 exit 复用 every(ok) | “JSON presentation flags 无语义影响” | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printResults`](bin/csl-agent-kit.js#printResults) [`bin/csl-agent-kit.js#createColors`](bin/csl-agent-kit.js#createColors) |
| K8（P3） | 裸 `install` 在非 TTY/CI admission 失败；`--yes` 在该 gate 前返回 defaults；unknown target 在 environment gate 前 validation 失败；三者都不写 selection，后两种仅 yes 可达 effects | 必须指出 gate 先后而非只写退出码 | [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) |

### Transfer Key

| Key | 必须判断与可观察断言 | 可接受替代表述 | 源码锚点 / 验证位置 |
| --- | --- | --- | --- |
| K9（T1） | 唯一 registry entry+handler 是最小入口；default=false 保持 `--yes` baseline；all/help/choices/state 由 registry 派生；四种 syntax 都 canonical dispatch；隔离 HOME 下 dry-run 零 fs、actual link source 为 realpath(repoRoot)、process 零调用；unknown 零 state/effect | target 名可换，但必须是具体非默认职责并验证真实 handler | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#ensureSymlink`](bin/csl-agent-kit.js#ensureSymlink) [`tests/cli-install-output.test.js#run`](tests/cli-install-output.test.js) |
| K10（T2） | `json`/`jsonl` conflict 在 effects 前；baseline/变化两侧都逐项叠加 color/no-color/verbose，解析后语义与 exit 相同、无 ANSI；含成功与失败；保留未启用新模式的 human 回归 | JSONL 可逐行承载 envelope 或 result，但比较前须解析成同一语义模型 | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`tests/cli-install-output.test.js#test("JSON output remains valid and color-free when --color is passed")`](tests/cli-install-output.test.js) |
| K11（T3） | 真实 Codex required add 制造前置失败；baseline Pi 日志存在，fail-fast 不存在；两侧结果顺序/status/已完成副作用/cleanup 一致地被断言；missing Codex skip 不触发停止且后续 Cursor effect 存在 | 后续参与者可换另一个现有真实 handler，但不能 fake dispatcher adapter | [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) [`bin/csl-agent-kit.js#installCodexPlugin`](bin/csl-agent-kit.js#installCodexPlugin) [`bin/csl-agent-kit.js#installPi`](bin/csl-agent-kit.js#installPi) |
| K12（T4/T5） | process policy 必须分别覆盖 probe/operation、精确 argv/次数/PWD；runtime error 先于普通 status；missing、allowFailure、resource failure、dry-run、cleanup、后续 participant、results/exit 均有断言。cwd option 在 parser 后语义验证且 invalid 零 state/effect，只传 operation；probe、canonical argv/root、非 process effects不变；不全局 chdir | timeout/retry 的具体数值可由需求另定，但不能省略分类与两类 spawn | [`bin/csl-agent-kit.js#hasCommand`](bin/csl-agent-kit.js#hasCommand) [`bin/csl-agent-kit.js#runCommands`](bin/csl-agent-kit.js#runCommands) [`tests/cli-install-output.test.js#createFakeCodex`](tests/cli-install-output.test.js) |
| K13（T6） | discovery 与所有执行 selector 有完整 conflict；早退在 state/resolver/dispatcher 前；输出严格由 registry order/metadata 派生；隔离 CI/HOME/PATH 下所有 state/prompt/effect/result/completion sentinels 为零；普通主流程回归存在 | 输出可 JSON 或文本，但字段与顺序须固定 | [`bin/csl-agent-kit.js#targets`](bin/csl-agent-kit.js#targets) [`bin/csl-agent-kit.js#resolveInstallTargets`](bin/csl-agent-kit.js#resolveInstallTargets) [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) |
| K14（T7） | alias 在汇流后、validation/dedup 前 canonicalize；所有语法与混合 canonical+alias 只派发一次；registry/default/all/interactive/state/handler/result 不泄漏 alias；真实 Codex dry-run/actual 序列各一次；unknown 仍零 state/effect | alias 名可换，但须映射到具体已有 handler | [`bin/csl-agent-kit.js#splitTargets`](bin/csl-agent-kit.js#splitTargets) [`bin/csl-agent-kit.js#validateTargets`](bin/csl-agent-kit.js#validateTargets) [`bin/csl-agent-kit.js#installTargets`](bin/csl-agent-kit.js#installTargets) |
| K15（T8） | 表格包含无 token、help/--help/-h、install、两类 unknown、子命令 help/unknown、合法主流程；message、stdout/stderr、status 精确；unknown command 在 front door status 2 且所有 sentinels 零；install 内既有 selection/consent/state/effect/output/exit 契约保持 | 可选择让 bare `help` 成为唯一 alias，但 prompt 所列三个现有 help token必须明确策略并测试 | [`bin/csl-agent-kit.js#main`](bin/csl-agent-kit.js#main) [`bin/csl-agent-kit.js#printHelp`](bin/csl-agent-kit.js#printHelp) [`bin/csl-agent-kit.js#parseInstallArgs`](bin/csl-agent-kit.js#parseInstallArgs) |

### Completion Standard

人类只有在不提前看 Key 的前提下，按规定顺序固定 Recall、Prediction、Transfer 的全部初始答案，再打开 Key，并对 K1–K15 的关键判断、必要对比分支和因果解释逐项满足，才算本轮完成；提前查看只算复习。该标准不产生完成记录、学习画像或进度文件。Agent 可持续读取本报告，不能据此声称主动回忆或“已经学会”；只有报告外 sealed held-out prediction/transfer task 能评价本材料是否支持其推理。
