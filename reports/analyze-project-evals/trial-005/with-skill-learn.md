# 掌握 CLI 安装组件：源码指南

## 1. Learning Orientation & Targets

- `Scope`：`bin/csl-agent-kit.js`
- `HEAD`：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- `Working tree`：`clean`
- `Generated at`：`2026-07-19T23:14:43+0800`
- `Learner assumption`：会阅读 JavaScript/CommonJS，理解命令行、退出码、JSON、文件和 symlink；不熟悉此仓库的 target 与输出契约。
- `Material status`：`学习材料就绪`

该文件是 npm CLI 真入口，compatibility wrapper 也直接执行它（`package.json#bin`，`scripts/install.sh:6`）。它读取 command/argv、TTY/CI、环境和 selection，生成按 target 排序的 results，再精确按 `options.json` 分成机器 JSON 与人类摘要；两条路径复用同一退出谓词（`bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#installTargets`）。`prompts`、用户文件系统、Codex/Pi CLI 与 repo payload 是其边界，不是内部实现（`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installCursor`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`）。

### Learning Targets

- **LT1 — Decide**：比较 default、explicit、interactive strategies，预测 targets、history 使用和 consent rejection。
- **LT2 — Affect**：分辨 selection 偏好、平台状态、change/result，并预测 dry-run 与 actual。
- **LT3 — Migrate**：解释 Codex allow-failure/required commands 与 owned-link cleanup gate。
- **LT4 — Present**：从统一 results 定位 JSON/human 分流、formatter、color/verbosity 控制和复用 exit predicate。
- **LT5 — Extend target**：为新增非默认 integration 找到最小入口与 registry 驱动的验证链。
- **LT6 — Extend output**：为新增机器输出模式设计与现有 JSON/human 契约等价的正交验证。

必需前置：Node `process`/`fs`/`spawnSync`，数组/对象、同步异常和 symlink。本文不覆盖平台内部实现、通用 CLI 课程、审计或实际改动。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1 | registry、strategy priority、dedupe、interactive consent | B2/C1–C5 | P2、P3；K-P2、K-P3 |
| LT2 | selection/platform/change/result 四层、dry-run guard | B1/C1–C2；B2/C4–C5 | P1、P2、T1；K-P1、K-P2、K-T1 |
| LT3 | probe/skip、allow-failure、required gate、owned判定 | B3/C1–C4 | P4；K-P4 |
| LT4 | result production、`options.json`、JSON formatter、human renderer、color/verbose、`every(ok)` | B1/C1–C5 | P1、P4、T2；K-P1、K-P4、K-T2 |
| LT5 | registry-driven surfaces、adapter contract、focused check | B2/C1–C2 | T1；K-T1 |
| LT6 | parser/output-mode entry、semantic projection、orthogonal options、human regression | B1/C2–C5 | T2；K-T2 |

## 2. Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | **CLI boundary**：npm bin/wrapper 收敛到 `main` | `main` 从 argv 拆 command；非 `install` 打印 help | 先明确可观察入口和出口 | `package.json#bin`，`scripts/install.sh:6`，`bin/csl-agent-kit.js#main` |
| 2 | **Registry policy**：每个 target 同时携带 default、external、文案和 runner | all/default/validation/choices/help/dispatch 都枚举 `targets` | 它连接当前策略与新增 integration 的迁移点 | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#validateTargets`，`bin/csl-agent-kit.js#printInstallHelp` |
| 3 | **Options → selected**：parser 只解释请求，resolver 按 all、explicit、yes、interactive 决策 | explicit 验证去重并在 history 前返回；yes 只选 default | 建立 default/explicit 对照 | `bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#resolveInstallTargets` |
| 4 | **Consent/persistence boundary**：external confirmation 只在 interactive，拒绝先于 save/runner | 显式 Codex/Pi 不询问；Cursor-only interactive 无 confirm | 区分授权拒绝与 adapter 错误 | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets` |
| 5 | **Effect protocol**：runner 返回 changes 或抛错，dispatcher 形成有序 results | per-target try/catch 保留后续 target；missing CLI 主动返回 skip | 这是所有输出模式共享的数据生产点 | `bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#installCodexPlugin` |
| 6 | **Persistent state versus description**：selection、平台文件/CLI 状态与 changes 相互独立 | interactive dry-run 可保存 selection；runner dry-run 不落地 | 让状态断言精确到所有权 | `bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#ensureSymlink`，`bin/csl-agent-kit.js#runCommands` |
| 7 | **Output fork**：results 产生后，`options.json` 为唯一分流条件；JSON 使用 `JSON.stringify`，否则 `printResults` | output option 不重新执行 runner | 先固定语义，再研究呈现 | `bin/csl-agent-kit.js#main` |
| 8 | **Human controls**：`printResults` 汇总，`verbose` 控制 `printChangeDetails`，`createColors` 解释 colorMode/`NO_COLOR` | JSON 路径完全绕开这些函数 | 揭示 color 与 verbosity 的正交范围 | `bin/csl-agent-kit.js#printResults`，`bin/csl-agent-kit.js#printChangeDetails`，`bin/csl-agent-kit.js#createColors` |
| 9 | **Shared completion predicate**：JSON 顶层 `ok` 和进程 exit 都取 `results.every(item.ok)` | 两种 formatter 后没有独立成功规则 | 输出迁移不能改变安装结果 | `bin/csl-agent-kit.js#main` |
| 10 | **Focused verification**：CLI 行为集中在现有 test file，`test:cli` 是聚焦命令 | manifest 精确列出 CLI tests | transfer 优先落在已有验证面 | `package.json#scripts.test:cli`，`tests/cli-install-output.test.js#run` |

## 3. Guided Code Walkthrough

### B1：同一 results 的机器/人类投影

代表行为使用 `install --yes --dry-run`，分别叠加 `--json --color --verbose` 与 human 的 `--color --verbose`，再对比 human `--no-color`。它用同一 default effect 隔离 output fork 和两个呈现选项。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | results 在哪里、何时产生？ | `bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#installTargets` | selected 先完整执行，`installTargets` 返回后才检查 `options.json` | 所有输出模式共享同一 ordered results；`yes` 当前只产生 Codex result |
| C2 | 精确分流条件是什么？ | `bin/csl-agent-kit.js#main` | 只有 `if (options.json)`；true 直接 `JSON.stringify({ok, results})`，false 调 `printResults` | JSON/human 不会同时运行；JSON 可被解析为稳定 envelope |
| C3 | `--color --verbose` 对 JSON 有何作用？ | `bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#printResults` | JSON 绕开 `printResults`、`createColors`、`printChangeDetails` | JSON 无 ANSI、没有额外 detail lines；直接测试：`tests/cli-install-output.test.js:222` |
| C4 | human 的两个 option 在哪里生效？ | `bin/csl-agent-kit.js#printResults`，`bin/csl-agent-kit.js#printChangeDetails`，`bin/csl-agent-kit.js#createColors` | colorMode 决定 paint；verbose 才展开八条 command details；dry-run 改 phase/措辞 | `--color --verbose` 有 ANSI 与命令细节，`--no-color` 无 ANSI且无 verbose 时仅摘要；直接测试：`tests/cli-install-output.test.js:44`，`tests/cli-install-output.test.js:78`，`tests/cli-install-output.test.js:200`，`tests/cli-install-output.test.js:208` |
| C5 | output option 会改变 exit 吗？ | `bin/csl-agent-kit.js#main` | branch 之后统一再次计算 `results.every(item.ok)` | 语义等价的 JSON/human 对同一 results 必须有相同 exit |

### B2：default、explicit 与 consent refusal

代表行为对比 A `--yes --dry-run --json`、B `--target pi,cursor,pi --dry-run --json`，以及 C 在 TTY 选择 Pi 后拒绝 external confirmation；三者覆盖 strategy 与 authorization，而不用无关错误替代拒绝。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | A/B 的 target 从何而来？ | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets` | yes 筛 default；explicit 先验证，再 Set 去重 | A 为 Codex；B 按首次出现为 Pi、Cursor |
| C2 | history/help/dispatch 是否各有 target 清单？ | `bin/csl-agent-kit.js#loadInstallSelection`，`bin/csl-agent-kit.js#printInstallHelp`，`bin/csl-agent-kit.js#installTargets` | 它们都从 registry 取名/spec | 新增 target 的公共迁移源是 `targets`，不是复制多个名单 |
| C3 | A/B 是否询问 external consent？ | `bin/csl-agent-kit.js#resolveInstallTargets` | 两条在 prompts 前返回 | non-interactive external target 不走交互授权 |
| C4 | C 的拒绝发生在哪里？ | `bin/csl-agent-kit.js#resolveInstallTargets` | selected 含 external 且 confirm false 时先 `die` | 不保存 selection、不执行 Pi、不生成 results，exit `2` |
| C5 | dry-run 对 A/B 的 state 有何保证？ | `bin/csl-agent-kit.js#ensureSymlink`，`bin/csl-agent-kit.js#runCommands` | runner 在平台写入前返回 plans；A/B 又绕开 save | selection 与平台状态均不变，只产生 changes |

### B3：Codex result 与 cleanup 因果链

比较 actual 模式的 missing CLI、required add failure 与成功 cleanup，用于理解相似“未完成安装”如何形成不同 results 和持久状态。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | missing CLI 属于失败吗？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#hasCommand` | probe 失败返回 `skip`，不抛 | result `ok: true`；单 target 顶层 true、exit `0` |
| C2 | 命令失败怎样分类？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands` | 六条 removals allow failure，两个 adds required | required 非零抛错；dispatcher 形成 failed result，exit `1` |
| C3 | 为什么 add failure 不删 legacy links？ | `bin/csl-agent-kit.js#installCodexPlugin` | cleanup 只在命令序列返回后调用 | 抛错越过 cleanup；直接测试：`tests/cli-install-output.test.js:426` |
| C4 | 成功后什么才是 owned？ | `bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`，`bin/csl-agent-kit.js#isWithin` | legacy root 必须是真目录，child 必须是 symlink，文本或 resolved source 任一在 repo `skills/` 内 | owned 删除，普通/外部项保留；直接测试：`tests/cli-install-output.test.js:354`，`tests/cli-install-output.test.js:377` |

## 4. Human Recall, Prediction & Transfer Checks

按以下顺序控制可见材料：

1. **Recall**：隐藏 Orientation、Concept Ladder、Walkthrough、Key 与源码，只看 Recall prompts。
2. **Prediction**：开放第 1–3 节，仍隐藏 Key 与源码，先固定预测和理由。
3. **Transfer**：再开放源码，Key 仍隐藏，固定入口、影响边界、已有验证位置、理由和可观察断言。
4. 全部初始答案固定后才打开 Key，对照报告与源码补充解释。

提前查看 Key 只算复习；重新测试需换等价 prompts。

### Recall prompts

- **R1**：不用背路径，说明请求如何经过 selection、effects、results 到达调用方。
- **R2**：比较 default、explicit、interactive；说明 external refusal 在哪里截断。
- **R3**：区分 selection、平台状态、change 与 result，并解释 dry-run 的范围。
- **R4**：指出统一 result 生产点、JSON/human 分流条件、两个 formatter、color/verbosity 控制点和共用 exit predicate。

### Prediction prompts

- **P1**：执行 `install --yes --dry-run --json --color --verbose`。预测 targets、effects、JSON 结构、ANSI/detail、selection 和 exit。
- **P2**：已有 `cursor,pi` history，执行 `install --target pi,cursor,pi --dry-run --json`。预测顺序、consent、history、changes 与 exit。
- **P3**：TTY interactive 中选择 `pi` 后拒绝 external confirmation；请求还带 `--dry-run --json`。预测 selection、平台状态、stdout/stderr、results 与 exit。
- **P4**：同一 fake Codex failure result 分别使用 human `--color --verbose` 与 `--json --color --verbose`。预测语义、呈现差异、legacy link 和两个 exit。

### Transfer prompts

- **T1 — 新增非默认 integration**：只设计、不修改。假设增加 `vscode`，`default: false`、`external: true`，runner 支持 dry-run。指出最小实现入口及由 registry 自动覆盖的 validation/all/history/choices/help/dispatch surfaces，定位现有聚焦 test file/command。使用隔离 HOME/PATH，成对断言 baseline 与变化后的 `--yes --dry-run --json` 仍只有 Codex；变化后 explicit `vscode` 仅产生其 plan且平台状态不变；`--all`/help 新增它；interactive 选中后拒绝 consent 时 selection/平台状态不变、无 results、exit `2`。
- **T2 — 新增 NDJSON 输出模式**：只设计、不修改。指出 parser option、`main` 分流、新 formatter/help 和聚焦测试入口；不得改变 `installTargets` 或共用 exit predicate。以隔离 HOME/PATH 的同一 deterministic dry-run results 成对比较 baseline JSON 与 NDJSON：两侧都分别叠加 `--color`/`--no-color`、`--verbose`/不 verbose，解析后断言 target/ok/changes 语义相等、无 ANSI/detail 污染且 exit 相同；再让 fake Codex required failure，比较两模式解析后的 error 与 exit `1`。最后保留不启用 JSON/NDJSON 的 human 回归：`--color --verbose` 仍有 ANSI 和 command details，`--no-color` 且不 verbose 仍是无 ANSI 的摘要。

## 5. Verification Key & Completion Standard

### Verification Key

- **K-R1**：必须给出 parser/options → resolver/selected → runners/changes → dispatcher/results → output/exit。可接受同义层次，不要求符号名。锚点：`bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installTargets`。
- **K-R2**：必须说明 `all`、explicit、yes 在 interactive 前依次短路；yes 取 default，explicit 验证去重；只有 interactive 对 external target 询问，拒绝在 save/effect 前 exit `2`。锚点：`bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets`。
- **K-R3**：必须区分 selection 偏好、平台持久状态、change 描述和含 ok/error 的 result；interactive dry-run 可写 selection，runner dry-run 不改平台。锚点：`bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#ensureSymlink`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#installTargets`。
- **K-R4**：统一 results 来自 `installTargets`；`options.json` 精确分流到 `JSON.stringify` 或 `printResults`；human 的 color 在 `createColors`、verbosity 在 `printChangeDetails` gate；两路复用 `results.every(item.ok)` exit。锚点：`bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#printResults`，`bin/csl-agent-kit.js#printChangeDetails`，`bin/csl-agent-kit.js#createColors`。
- **K-P1**：yes 只选 Codex；dry-run 跳过 probe/spawn并产生八个 command plans；non-interactive 不读写 selection。JSON 是 `{ok: true, results:[...]}`，即使 color/verbose 也无 ANSI或额外 detail，exit `0`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#main`；直接测试：`tests/cli-install-output.test.js:222`。
- **K-P2**：explicit 早于 history/prompt，去重保持 `pi,cursor`；无 consent、不改 history；Pi command 与 Cursor symlink 都是 dry-run plans，results 同序、exit `0`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installPi`，`bin/csl-agent-kit.js#installCursor`。
- **K-P3**：external refusal 先 `die`，selection 与平台不变，不形成 results/JSON stdout；stderr 为 refusal error，exit `2`。`--dry-run`/`--json` 不改变该前置 gate。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#die`。
- **K-P4**：两模式共享 target `ok: false` 与 error，required add failure 使 cleanup 未执行，owned link 保留，exit 都是 `1`。Human color/verbose 显示 ANSI 和 failure summary（失败项不会进入 detail branch）；JSON 无 ANSI且保留结构化 error，verbose 不追加内容。锚点：`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#printResults`；直接失败测试：`tests/cli-install-output.test.js:426`。
- **K-T1**：最小入口是 `targets` spec 与 `run` adapter；runner 遵守 dry-run/changes/throw contract。registry 枚举自动覆盖 validation、all、history filtering、choices、help 与 dispatch，无需增加 parser branch。聚焦位置是 `tests/cli-install-output.test.js`，命令配置为 `package.json#scripts.test:cli`。断言必须覆盖 yes baseline 不变、explicit plan/state、all/help 可见性及 interactive refusal 的零持久变更/exit `2`。锚点：`bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#printInstallHelp`，`bin/csl-agent-kit.js#installTargets`。
- **K-T2**：最小入口是 `parseInstallArgs` 的 mode、`main` 中在 results 后的新分流、独立 NDJSON formatter 与 `printInstallHelp`；`installTargets` 和 branch 后的 `every(ok)` 不变。验证落在 `tests/cli-install-output.test.js`/`package.json#scripts.test:cli`。JSON 与 NDJSON 两侧都必须交叉 color×verbosity，解析后 success/failure 语义及 exit 相等，机器模式均无 ANSI/人类 details；隔离 dry-run 状态不变。另保留 human 正向 `--color --verbose` 与反向 `--no-color`/non-verbose 断言，防止新 mode 截获旧路径。锚点：`bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#printResults`，`bin/csl-agent-kit.js#createColors`。

### Completion Standard

人类只有遵守可见材料顺序，先固定 R1–R4、P1–P4、T1–T2 的初始答案，再打开 Key，并满足全部关键判断、因果解释及 transfer 的成对状态/输出断言，才算完成本轮；提前看 Key 只算复习。对 Agent，只由报告外 sealed held-out prediction/transfer task 判断材料是否支持推理，不声称 Agent 已经学会。
