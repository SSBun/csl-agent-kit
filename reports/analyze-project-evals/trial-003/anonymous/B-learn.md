# 学会 CSL Agent Kit CLI 安装入口

## 1. Learning Orientation & Targets

- `Scope`：`bin/csl-agent-kit.js`
- `HEAD`：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- `Working tree`：`clean`
- `Generated at`：`2026-07-19T22:41:38+0800`
- `Learner assumption`：能阅读 JavaScript/CommonJS，知道进程退出码、JSON、文件与 symlink 的基本语义，但没有本仓库安装模型。
- `Material status`：`学习材料就绪`

这是 npm manifest 暴露的 `csl-agent-kit` 可执行入口；兼容脚本也只负责把 `install` 与参数转交给它（`package.json#bin`，`scripts/install.sh:6`）。可观察输入包括 command/argv、TTY/CI、环境变量、交互响应和历史 selection；输出包括平台动作或计划、每个 integration 的结构化结果、人类/JSON 文本与退出码（`bin/csl-agent-kit.js#main`）。`prompts`、用户目录、Codex/Pi CLI 和 repo-root plugin/package 是直接边界，不是该文件内部实现（`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installCursor`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`）。

### Learning Targets

- **LT1 — Route**：从 command、flags 与运行环境判断会打印帮助、退出参数错误，还是得到哪组 targets。
- **LT2 — State**：区分 selection 偏好、平台持久状态和 change records，并预测 dry-run/actual 的差异。
- **LT3 — Failure**：区分 direct exit、per-target failure 与 successful skip，推导后续处理和整体退出码。
- **LT4 — Ownership**：用 Codex 命令顺序与 owned-link 判定解释 cleanup 会不会发生、会影响什么。

必需前置：Node `process`、`fs`、`spawnSync`，数组/对象、异常与 symlink。明确不覆盖 `prompts` 库教学、Cursor/Codex/Pi 内部机制、插件内容、审计或修改计划。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1 | 入口 guard、options/selected 分离、选择优先级与 registry | B1/C1–C2；B2/C1–C2 | P1、P2、P4；K-P1、K-P2、K-P4 |
| LT2 | selection state、change protocol、平台 effect guard | B1/C3–C5；B2/C3–C5 | P1、P2、T1；K-P1、K-P2、K-T1 |
| LT3 | `die`、adapter catch、`skip`、aggregate success | B1/C5；B3/C1–C4 | P3、P4；K-P3、K-P4 |
| LT4 | allow-failure、cleanup sequencing、`isWithin` ownership | B3/C1–C4 | P3、T2；K-P3、K-T2 |

## 2. Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | **Observable entry**：npm bin 和 wrapper 收敛到 `main`，只有 `install` 进入安装链 | `main` 先拆 command，其余路径打印帮助 | 先圈定组件边界，后续分支才有共同起点 | `package.json#bin`，`scripts/install.sh:6`，`bin/csl-agent-kit.js#main` |
| 2 | **Policy registry**：`targets` 同时给出有效名称、默认性、external consent 和 adapter | `all`、默认筛选、choices、help 与 dispatch 都枚举同一对象 | 先认识策略源，避免把三个 adapter 当成无关脚本 | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#printInstallHelp` |
| 3 | **Request versus decision**：`parseInstallArgs` 只形成 options，`resolveInstallTargets` 才按 `all`、显式、`yes`、interactive 决定 selected | 显式列表会验证并去重，其他路径不会读取历史 selection | 这是预测控制流的最小分界 | `bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#resolveInstallTargets` |
| 4 | **Three state carriers**：selection 文件是交互偏好；Cursor/CLI/legacy links 是平台状态；changes 是动作描述 | interactive dry-run 仍可保存 selection，但平台 adapters 只返回 dry-run records | 先分清“记录了什么”与“改变了什么” | `bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#ensureSymlink`，`bin/csl-agent-kit.js#runCommands` |
| 5 | **Adapter/result boundary**：平台差异封装在 `spec.run`；异常只把当前 target 转成 failed result | `installTargets` 捕获异常并继续循环 | 由此可以独立推导 mixed results | `bin/csl-agent-kit.js#installTargets` |
| 6 | **Failure planes**：请求拒绝退出 `2`，adapter 异常最终退出 `1`，外部 CLI 缺失产生 successful `skip` | 三种分支分别在 `die`、`installTargets`、Codex/Pi adapter 中形成 | 防止只凭 stderr 或“没安装”判断失败类型 | `bin/csl-agent-kit.js#die`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`，`bin/csl-agent-kit.js#main` |
| 7 | **Codex commit boundary**：required add 成功返回后才进入 owned-link cleanup | allow-failure remove 不抛，required add 非零会抛并越过 cleanup | 把命令结果与持久状态后果连成因果链 | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 8 | **Outcome projection**：JSON 与人类摘要共享 results，color/verbose 只改变呈现；总体成败取 `every(ok)` | `main` 选择 renderer 后用相同谓词退出 | 最后回到调用方能断言的输出 | `bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#printResults`，`bin/csl-agent-kit.js#createColors` |

## 3. Guided Code Walkthrough

### B1：全 target JSON 预演

代表行为是“隔离 HOME 中运行 `install --all --dry-run --json --color`”；它用一次请求覆盖 registry 顺序、三个 adapters、dry-run 和结果投影。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | `--all` 是否仍受 saved selection 影响？ | `bin/csl-agent-kit.js#resolveInstallTargets` | `all` 在历史读取前返回 `Object.keys(targets)` | selected 顺序为 `cursor`、`codex-plugin`、`pi` |
| C2 | 显式 `--color` 是否污染 JSON？ | `bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#createColors` | JSON 分支不调用 color renderer | 输出仍是可解析、无 ANSI 的 JSON；直接测试：`tests/cli-install-output.test.js:222` |
| C3 | Cursor dry-run 做什么？ | `bin/csl-agent-kit.js#installCursor`，`bin/csl-agent-kit.js#ensureSymlink` | 在 mkdir/unlink/symlink 前返回一个 `symlink` plan | Cursor 用户目录不变，result 有一个 `dryRun: true` change |
| C4 | Codex/Pi dry-run 会不会探测或执行 CLI？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`，`bin/csl-agent-kit.js#runCommands` | `!dryRun` 才探测；`runCommands` 在 `spawnSync` 前产生 plans | Codex 描述八条 commands，Pi 描述一条；隔离 HOME 无 legacy root 时无 remove plans |
| C5 | 三项中一项异常是否会使后续项消失？ | `bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#main` | adapter 调用各自 try/catch；results 全部完成后才计算 `every(ok)` | 后续 target 仍执行；任一 failed result 会让顶层 `ok: false`、退出 `1` |

### B2：交互 dry-run 仍改变 selection 偏好

代表行为是“历史 JSON 无效，在 TTY 中运行 `install --dry-run` 并只选择 Cursor”；它专门暴露三种 state carrier 的差异。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | 无 target flags 是否一定交互？ | `bin/csl-agent-kit.js#resolveInstallTargets` | 非 TTY 或 CI 会先 `die`；只有 TTY 才加载 `prompts` | 本行为必须满足 TTY 且非 CI |
| C2 | 无效历史如何影响初始勾选？ | `bin/csl-agent-kit.js#loadInstallSelection`，`bin/csl-agent-kit.js#buildInstallChoices` | parse/schema/有效名称任一失败都返回 `null` | checklist 回退到唯一默认项 `codex-plugin`，用户仍可改选 Cursor；直接测试：`tests/cli-install-output.test.js:250` |
| C3 | 只选 Cursor 是否要求 external confirm？ | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets` | Cursor 的 `external` 是 false，confirm prompt type 为 null | 没有第二次确认；取消 checklist 仍会退出 `2` |
| C4 | dry-run 是否禁止 selection 写入？ | `bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#saveInstallSelection` | save 位于交互确认后、adapter 前，未检查 dry-run | selection 以 version 1/`0600` 临时文件原子替换为 `cursor` |
| C5 | 哪个状态保持不变？ | `bin/csl-agent-kit.js#ensureSymlink` | Cursor adapter 看见 dry-run 即返回 plan | Cursor plugin path 不变；人类摘要报告 planned link |

### B3：Codex 的 skip、failure 与 cleanup

代表行为比较“实际 Codex CLI 缺失”和“CLI 可用但 required plugin add 失败”；它覆盖最容易混淆的两种未安装结果。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | 找不到 `codex` 是否是 failed result？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#hasCommand` | adapter 直接返回 `skip` change，不抛错 | `installTargets` 包装为 `ok: true`；单 target 时顶层 `ok: true`、退出 `0` |
| C2 | 哪些命令失败会抛错？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands` | 六条 removals allow failure；两个 adds required | remove 非零仍继续，required add 非零停止序列 |
| C3 | plugin add 失败时 legacy links 如何？ | `bin/csl-agent-kit.js#installCodexPlugin` | cleanup 表达式位于 `runCommands` 成功返回后 | required failure 越过 cleanup，owned links 保持；直接测试：`tests/cli-install-output.test.js:426` |
| C4 | 成功后 owned 怎样判定？ | `bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`，`bin/csl-agent-kit.js#isWithin` | legacy root 不能是 symlink；child 必须是 symlink；source 文本或 resolved source 任一在 repo `skills/` 内即可 | 只报告/删除 owned links；普通目录和外部 links 保留，重复成功执行无新的 removes；直接测试：`tests/cli-install-output.test.js:354`，`tests/cli-install-output.test.js:377` |

## 4. Human Recall, Prediction & Transfer Checks

必须严格按以下可见材料顺序作答，并把初始答案固定下来：

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Key 与源码，只显示 Recall prompts。
2. **Prediction**：开放第 1–3 节，仍隐藏 Key 与源码；先写预测和理由。
3. **Transfer**：再开放源码，Key 仍隐藏；写出入口、影响边界、验证位置、理由和最小可观察断言。
4. 三类初始答案全部固定后才打开 Key，用报告与源码逐项核对并补充解释。

提前查看 Key 的本轮只算复习；重新测试必须换成语义等价但情境不同的 prompts。

### Recall prompts

- **R1**：不用背符号，说明该文件如何把一个安装请求变成可观察结果，并指出一个外部边界。
- **R2**：解释 policy registry、options、selected targets、changes 与 results 的关系。
- **R3**：说明 selection 偏好、平台状态、change record 在 interactive dry-run 中分别会怎样。
- **R4**：比较参数拒绝、adapter failure 与 missing-CLI skip 的结果层级和退出语义。

### Prediction prompts

- **P1**：在没有 `.agents/skills` 的隔离 HOME 中执行 `install --all --dry-run --json --color`。预测 target 顺序、三项 changes、外部 CLI 调用、ANSI、顶层 `ok` 与退出码。
- **P2**：selection JSON 无效，在 TTY 中执行 `install --dry-run`，用户从默认勾选改为只选 Cursor。预测 prompts、selection 文件、Cursor path、人类输出与退出码。
- **P3**：比较两个 `install --target codex-plugin --json` 场景：A 没有 `codex`；B fake Codex 可探测，但 plugin add 返回非零且 HOME 有 owned legacy link。分别预测 result、link 与退出码。
- **P4**：执行 `install --target unknown --json`。预测是否产生 JSON result、stderr 与退出码，并解释失败发生在哪一层。

### Transfer prompts

- **T1 — Cursor 持久状态边界**：仅设计、不执行一组最小验证。使用隔离 HOME，成对比较基线“目标已是正确 repo-root symlink”与变化“目标是错误 symlink”；再覆盖 dry-run 和拒绝分支“目标是普通文件”。写出每个场景的 result action/ok/exit 断言，以及运行前后 symlink/普通文件应保持或改变的精确断言，并指出源码核对点。
- **T2 — Codex ownership 与失败边界**：仅设计、不执行最小验证。使用隔离 HOME 与 fake Codex，成对比较基线“legacy symlink 的文本和 resolved source 都在 repo `skills/` 外”与变化“文本 source 在外、resolved source 在内”；先比较成功安装后的持久状态，再让 required plugin add 失败并断言拒绝清理。写出 changes、退出码和每个 link 是否仍存在的断言，并指出源码核对点。

## 5. Verification Key & Completion Standard

### Verification Key

- **K-R1**：必须判断入口解析/选择 targets、调用 adapters、汇总 results，再输出文本或 JSON 与退出码；可接受“安装编排器”。外部边界可答 prompts、用户目录、Codex/Pi CLI 或 repo payload。锚点：`bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#installTargets`。
- **K-R2**：必须说明 registry 定义有效策略；options 是请求；resolver 产生 selected；adapter 产生 changes/error；`installTargets` 形成 results。可接受把 changes 称为动作描述。锚点：`bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installTargets`。
- **K-R3**：必须判断 interactive dry-run 仍在 adapter 前保存 confirmed selection；平台 dry-run 不改 Cursor/Codex/Pi/legacy 状态，只形成 records。可接受“偏好写、安装不写”。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#ensureSymlink`，`bin/csl-agent-kit.js#runCommands`。
- **K-R4**：必须区分 `die` 直接退出 `2`、adapter 异常形成 `ok: false` 后整体退出 `1`、missing CLI 形成 `ok: true` 的 `skip` 并可退出 `0`。锚点：`bin/csl-agent-kit.js#die`，`bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#main`。
- **K-P1**：顺序是 `cursor,codex-plugin,pi`；Cursor 一个 symlink plan、Codex 八个 command plans、Pi 一个 command plan，均 `dryRun: true`；不探测/调用平台 CLI，隔离 HOME 无 remove plans；JSON 无 ANSI，全部 `ok`、顶层 true、退出 `0`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#ensureSymlink`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`，`bin/csl-agent-kit.js#main`。
- **K-P2**：无效 JSON 回退预选 `codex-plugin`；用户只选 Cursor 后不显示 external confirm；selection 写成 version 1 的 `cursor`，Cursor path 不变，摘要为 planned link，result 成功且退出 `0`。必要对比：取消 checklist 会在写 selection 前退出 `2`。锚点：`bin/csl-agent-kit.js#loadInstallSelection`，`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#ensureSymlink`。
- **K-P3**：A 返回 `skip` change、target `ok: true`、link 不变、顶层 true、退出 `0`。B 的 allow-failure removes 可继续，但 required plugin add 抛错；cleanup 未运行，owned link 仍在，target/top-level false，退出 `1`。锚点：`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#installTargets`；B 的直接测试：`tests/cli-install-output.test.js:426`。
- **K-P4**：`validateTargets` 在 adapter/results 之前调用 `die`；不会进入 JSON serialization，stderr 是 unknown-target 错误，退出 `2`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#validateTargets`，`bin/csl-agent-kit.js#die`；直接测试：`tests/cli-install-output.test.js:268`。
- **K-T1**：最小断言必须使用隔离 HOME 并核对目标路径。基线 actual：正确 symlink 保持指向 repo root，change 为 `unchanged`、ok true、exit `0`。变化 actual：错误 symlink 被替换为 repo-root link，change 为 `symlink`、ok true、exit `0`；相同变化的 dry-run 必须保持原错误 link 且 change 带 `dryRun: true`。拒绝分支：普通文件不被覆盖，target `ok: false`、文件内容/类型不变、exit `1`。锚点：`bin/csl-agent-kit.js#ensureSymlink`，结果边界：`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#main`。
- **K-T2**：必须隔离 HOME/PATH 并逐个 lstat links。成功基线：完全外部 link 保留且无 remove change；成功变化：resolved source 在 repo 内使其 owned，出现 remove change且 link 消失。required add 失败的变化场景：cleanup 不运行，link 仍存在、target false、exit `1`。这些成对断言分别隔离 ownership 与命令提交点。锚点：`bin/csl-agent-kit.js#isWithin`，`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`，`bin/csl-agent-kit.js#installCodexPlugin`；相邻证据：`tests/cli-install-output.test.js:377`，`tests/cli-install-output.test.js:426`。

### Completion Standard

人类只有遵守材料开放顺序，先固定 R1–R4、P1–P4、T1–T2 的全部初始答案，再打开 Key，并满足每项关键判断、因果解释及 T1/T2 的可观察状态断言，才算完成本轮。提前查看 Key 只算复习。对 Agent，仅允许报告外 sealed held-out prediction/transfer task 判断材料是否支持推理，不声称 Agent 已记住或学会。
