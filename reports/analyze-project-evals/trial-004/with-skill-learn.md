# CLI 安装组件源码学习指南

## 1. Learning Orientation & Targets

- `Scope`：`bin/csl-agent-kit.js`
- `HEAD`：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- `Working tree`：`clean`
- `Generated at`：`2026-07-19T22:54:59+0800`
- `Learner assumption`：能读 JavaScript/CommonJS，了解进程、JSON、文件和 symlink；尚未建立本仓库的 integration 安装模型。
- `Material status`：`学习材料就绪`

该文件是 `package.json` 暴露的 npm CLI，也是兼容 wrapper 的下游（`package.json#bin`，`scripts/install.sh:6`）。它把 command/argv、TTY/CI、环境与历史 selection 转换为 integration results：中间可能规划或执行用户目录 symlink、Codex plugin commands 与 Pi install，最后输出文本/JSON 和退出状态（`bin/csl-agent-kit.js#main`）。`prompts`、三个客户端边界及 repo payload 均在 scope 外；本文件只保存 selection policy 并编排它们（`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installCursor`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`）。

### Learning Targets

- **LT1 — Selection**：比较 default、显式与 interactive strategy，预测有序 targets 或 policy 拒绝。
- **LT2 — Effects**：区分 selection 偏好、平台持久状态与 change records，解释 dry-run 的准确边界。
- **LT3 — Results**：从 adapter 的 success、skip、failure 推导 JSON/人类输出及退出码。
- **LT4 — Migration**：解释 Codex command gate 与 owned legacy-link cleanup 的因果顺序。
- **LT5 — Extension**：为新增一个非默认 target 找到最小 migration 入口，并用现有聚焦检查位置设计 baseline/change/拒绝断言。

必需前置：Node `process`、`fs`、`spawnSync`，同步异常和 symlink 解析。本文不讲 `prompts` 通用 API、平台内部实现、插件内容，也不做审计或实际改动。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1 | registry policy、options/selected 分界、strategy 优先级、consent | B1/C1–C3；B2/C1–C4 | P1、P2、P3；K-P1、K-P2、K-P3 |
| LT2 | selection state、platform state、change protocol、dry-run | B1/C4–C5；B2/C3–C5 | P1、P2、T2；K-P1、K-P2、K-T2 |
| LT3 | per-target catch、skip、aggregate `every(ok)`、renderer | B1/C5；B3/C1–C4 | P1、P4；K-P1、K-P4 |
| LT4 | allow-failure、required add、owned判定、cleanup gate | B3/C2–C4 | P4、T2；K-P4、K-T2 |
| LT5 | registry-driven surfaces、adapter contract、focused test entry | B1/C1–C5 | T1；K-T1 |

## 2. Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | **入口与观察面**：npm bin/wrapper 到 `main`，调用方看到 stdout/stderr 与 exit | 只有 `install` 走安装链，其他 command 打印 help | 先确定组件的输入输出边界 | `package.json#bin`，`scripts/install.sh:6`，`bin/csl-agent-kit.js#main` |
| 2 | **Registry 作为策略表**：每项同时声明 name、default、external、文案和 adapter | validation、all、yes、choices、help、dispatch 都枚举 `targets` | 它是理解 default/explicit 及新增 target 的共同根 | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#validateTargets`，`bin/csl-agent-kit.js#printInstallHelp` |
| 3 | **Request 与 selection 分离**：parser 产生 options；resolver 按 `all` → explicit → `yes` → interactive 形成 selected | explicit 会去重并绕开 history，`yes` 只取 default | 先会预测 strategy，再读 side effects | `bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#resolveInstallTargets` |
| 4 | **Consent 是 interactive gate**：只有 interactive 选中 `external` target 才询问；拒绝发生在保存与执行之前 | 显式 Codex/Pi 不进入 prompt，Cursor-only interactive 不显示 confirm | 避免把 external 当成全局授权或 safety flag | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets` |
| 5 | **三种状态**：selection 是偏好，文件/CLI/link 是平台状态，change 是描述 | interactive dry-run 可写 selection，但 adapters 不落地 | 准确解释 preview 与持久状态 | `bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#ensureSymlink`，`bin/csl-agent-kit.js#runCommands` |
| 6 | **Adapter/result contract**：adapter 返回 changes 或抛错；dispatcher 将异常局部化 | 循环继续生成后续 results，missing CLI 则主动返回 `skip` | 把平台行为接到统一结果模型 | `bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi` |
| 7 | **Codex cleanup commit point**：required adds 完成后才检查 owned legacy links | remove failures 可继续，required failure 越过 cleanup | 由命令顺序预测失败后的文件状态 | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks` |
| 8 | **Focused verification surface**：CLI 行为集中在 `tests/cli-install-output.test.js`，聚焦命令是 `test:cli` | manifest 将该文件纳入 `node --test`，现有测试覆盖 selection、output、cleanup | 为 transfer 提供仓库已有的最小验证入口，不把全套测试当默认 | `package.json#scripts.test:cli`，`tests/cli-install-output.test.js#run` |

## 3. Guided Code Walkthrough

### B1：default 与 explicit strategy 对照

用两个 dry-run JSON 请求对照：A 为 `install --yes --dry-run --json`，B 为 `install --target cursor,pi,cursor --dry-run --json`。这组最小行为同时显出 registry policy、选择优先级、adapter contract 和 output。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | `--yes` 是否表示全部？ | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets` | `yes` 只筛 `default: true`；当前只有 `codex-plugin` | A 的 targets 仅为 Codex，且不读取历史 selection |
| C2 | B 是否受 default 或历史影响？ | `bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#validateTargets` | explicit 分支早于 `yes`/interactive，验证后由 `Set` 去重 | B 的顺序为 Cursor、Pi；history 不读写 |
| C3 | default/explicit 是否触发 consent？ | `bin/csl-agent-kit.js#resolveInstallTargets` | 两条路径均在 prompts 前返回 | 即使 Codex/Pi 是 external，也没有 interactive confirmation |
| C4 | 两请求会不会探测或执行平台 CLI？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`，`bin/csl-agent-kit.js#runCommands` | dry-run 跳过 probe，命令在 spawn 前变成 plan；Cursor 也在写文件前返回 | A 有八个 Codex command plans；B 有一个 Cursor symlink plan 和一个 Pi command plan，平台状态不变 |
| C5 | JSON 与退出如何形成？ | `bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#main` | results 保持 selected 顺序，顶层 `ok` 与 exit 都使用 `every(ok)` | 两请求均输出无 ANSI JSON、顶层 true、exit `0`；颜色隔离直接测试：`tests/cli-install-output.test.js:222` |

### B2：interactive external consent 被拒绝

代表行为是“TTY 中无 all/targets/yes，用户选择 Pi 后拒绝 external confirmation”。选择它是为了单独验证 authorization gate，不用 adapter failure 代替拒绝。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | interactive 前有哪些 admission 条件？ | `bin/csl-agent-kit.js#resolveInstallTargets` | stdin 必须是 TTY 且不能处于 CI；随后 require `prompts` | 不满足时在读取 selection 前退出 `2` |
| C2 | checklist 初始值从哪来？ | `bin/csl-agent-kit.js#loadInstallSelection`，`bin/csl-agent-kit.js#buildInstallChoices` | version 1 历史按 registry 过滤；无有效项用 default | 历史只提供预选，不是最终 target 决定 |
| C3 | 为什么选 Pi 会出现第二问？ | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets` | confirm type 取决于 selected 中是否有 `external: true` | Pi/Codex 需要确认；只选 Cursor 时该 prompt 为 null |
| C4 | 拒绝后 selection 是否保存？ | `bin/csl-agent-kit.js#resolveInstallTargets` | `die("External integrations were not confirmed.")` 位于 `saveInstallSelection` 前 | 原 selection 保持，Pi adapter 未调用，无 results，exit `2` |
| C5 | 接受后 dry-run 的偏好/平台差异是什么？ | `bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#runCommands` | selection 保存不检查 dry-run；Pi command 则只记录 plan | 偏好可更新而 Pi 状态不变；显式请求仍不写 selection（直接测试：`tests/cli-install-output.test.js:450`） |

### B3：Codex skip、required failure 与 cleanup

比较实际安装的两个分支：找不到 Codex CLI，以及 CLI 可用但 required plugin add 失败。它们都“没有完成安装”，却属于不同结果层级。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | probe 失败是否抛错？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#hasCommand` | 找不到命令直接返回 `skip` change | dispatcher 包装为 `ok: true`，单 target 时 exit `0` |
| C2 | 哪些 plugin 命令构成 gate？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands` | 六个 removals allow failure，两个 adds required | removal 非零仍继续；required add 非零抛错 |
| C3 | required failure 后哪些状态不变？ | `bin/csl-agent-kit.js#installCodexPlugin` | cleanup 调用在 `runCommands` 返回之后 | owned legacy links 尚未删除；直接测试：`tests/cli-install-output.test.js:426` |
| C4 | 成功时 owned 如何定义？ | `bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`，`bin/csl-agent-kit.js#isWithin` | legacy root 不能是 symlink；child 必须是 symlink；文本或 resolved source 任一位于真实 `skills/` 根内 | 仅 owned links 删除；外部 links、普通项保留；直接测试：`tests/cli-install-output.test.js:354`，`tests/cli-install-output.test.js:377` |

## 4. Human Recall, Prediction & Transfer Checks

严格执行以下开放顺序：

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Key 与源码，只看 Recall prompts 并独立作答。
2. **Prediction**：开放第 1–3 节，Key 与源码仍隐藏；先固定预测和理由。
3. **Transfer**：再开放源码，Key 仍隐藏；固定入口、影响边界、仓库验证位置、理由和可观察断言。
4. 所有初始答案固定后才打开 Key，用报告与源码核对并补充解释。

任何阶段提前查看 Key，本轮只算复习；重测需更换为语义等价的 prompts。

### Recall prompts

- **R1**：概括该组件的输入、主要职责、可观察输出和一个不负责的边界。
- **R2**：解释 registry、options、selected targets、changes 与 results 的因果关系。
- **R3**：比较 default、explicit、interactive 三种 selection strategy，并说明 external consent 只约束哪一条。
- **R4**：区分 selection 偏好、平台状态和 change record；再说明 direct exit、failed result 与 successful skip。

### Prediction prompts

- **P1**：selection 已保存 `cursor,pi`，执行 `install --yes --dry-run --json --color`。预测 target、selection 是否读写、commands/effects、ANSI、顶层 `ok` 与 exit。
- **P2**：同一 selection 下执行 `install --target pi,cursor,pi --dry-run --json`。预测顺序、去重、consent、selection、changes 与 exit。
- **P3**：TTY interactive 选择 `codex-plugin` 后拒绝 external confirmation。预测保存、CLI probe、legacy links、输出层级与 exit。
- **P4**：比较实际 `codex-plugin` 的 A“没有 Codex CLI”和 B“plugin add required failure，且有 owned legacy link”。预测两者 result、link 与 exit。

### Transfer prompts

- **T1 — 新增非默认 target 的最小迁移链**：只设计、不修改。假设新增 `claude-plugin`，要求 `default: false`、`external: true`，adapter 支持 dry-run。指出最小代码入口、自动受 registry 驱动而无需单独改的 surfaces，以及现有聚焦验证文件/命令。用隔离 HOME/PATH 写出成对断言：baseline 与变化后的 `--yes --dry-run --json` 仍只选 Codex；变化后显式 `--target claude-plugin --dry-run --json` 出现且只出现该 target 的 plan、平台状态不变；`--all`/help 新增该 target；interactive 选中它再拒绝 consent 时 selection 和平台状态都不变、无 results、exit `2`。
- **T2 — Codex ownership/commit 边界**：只设计、不执行。用隔离 HOME 和 fake Codex，成对比较完全外部 legacy symlink 与“文本 source 在外、resolved source 在 repo `skills/` 内”的 link；先断言成功安装后的 changes/持久状态，再让 required add 失败并断言拒绝 cleanup。指出源码和聚焦测试位置。

## 5. Verification Key & Completion Standard

### Verification Key

- **K-R1**：必须判断组件接收 CLI/环境/交互状态，选择并执行或预演 integrations，输出 results/摘要与 exit；边界可答平台 CLI、prompts 或 payload。可接受“安装 orchestrator”。锚点：`bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#installTargets`。
- **K-R2**：必须给出 registry 定义 target policy；parser 形成 options；resolver 形成 selected；adapter 返回 changes/抛错；dispatcher 形成 results。锚点：`bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installTargets`。
- **K-R3**：必须说明 `all`、explicit、`yes` 先后短路，interactive 最后；`yes` 只选 default，explicit 验证去重；external confirmation 只在 interactive 分支。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#targets`。
- **K-R4**：必须区分 interactive 可写 selection 而平台 dry-run 不落地；参数/拒绝经 `die` exit `2`，adapter 异常形成 failed result/exit `1`，missing CLI 是 successful `skip`。锚点：`bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#die`，`bin/csl-agent-kit.js#installCodexPlugin`。
- **K-P1**：`yes` 忽略 saved selection，只选 `codex-plugin`；不读写 selection，不 probe/执行 Codex，产生八个 command plans；JSON 无 ANSI、顶层 true、exit `0`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#main`；输出直接测试：`tests/cli-install-output.test.js:222`。
- **K-P2**：explicit 早于 history/interactive，验证后保持首次出现顺序 `pi,cursor`；无 consent、不读写 selection；Pi 一个 command plan、Cursor 一个 symlink plan，results 同序、exit `0`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installPi`，`bin/csl-agent-kit.js#installCursor`。
- **K-P3**：external refusal 在 save/adapter 之前调用 `die`；原 selection、legacy links 不变，不 probe Codex，不形成 JSON results，即使请求含 `--json` 也只在 stderr 输出错误，exit `2`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#die`。
- **K-P4**：A 返回 `skip`，target/top-level `ok: true`、link 不变、exit `0`。B 的 required add 抛错，cleanup 未执行，owned link 保留，target/top-level false、exit `1`。锚点：`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#installTargets`；B 的直接测试：`tests/cli-install-output.test.js:426`。
- **K-T1**：最小实现入口是 `targets` 中新增非默认/external spec 与其 `run` adapter；adapter 必须遵守 changes/throw 与 dry-run contract。validation、`--all`、default filter、choices、help、dispatch 由 registry 枚举自动覆盖；无需新增 parser branch。聚焦位置为 `tests/cli-install-output.test.js`，配置命令为 `package.json#scripts.test:cli`。断言必须覆盖：前后 `--yes` 都只有 Codex；explicit 新 target 仅返回其 dry-run plan且隔离状态不变；`--all`/help 增加它；interactive 拒绝后 selection/平台状态均不变、无 results、exit `2`。锚点：`bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#printInstallHelp`，`bin/csl-agent-kit.js#installTargets`。
- **K-T2**：成功 baseline 的完全外部 link 保留且无 remove；成功变化中 resolved source 位于 repo 内即 owned，出现 remove 且 link 消失。required add 失败时变化 link 仍存在、target false、exit `1`。验证必须隔离 HOME/PATH 并逐项 lstat，避免污染真实用户状态。锚点：`bin/csl-agent-kit.js#isWithin`，`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`，`bin/csl-agent-kit.js#installCodexPlugin`；聚焦位置：`tests/cli-install-output.test.js:377`，`tests/cli-install-output.test.js:426`。

### Completion Standard

人类学习者只有遵守材料开放顺序，先固定 R1–R4、P1–P4、T1–T2 的初始答案，再打开 Key，并满足全部关键判断、因果解释及 transfer 的成对持久状态断言，才算完成本轮；提前查看 Key 只算复习。对 Agent，只能由报告外 sealed held-out prediction/transfer task 评价材料是否支持推理，不声称 Agent 已经记住或学会。
