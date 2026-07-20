# CLI 安装组件源码掌握指南

## 1. Learning Orientation & Targets

- `Scope`：`bin/csl-agent-kit.js`
- `HEAD`：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- `Working tree`：`clean`
- `Generated at`：`2026-07-19T22:18:17+0800`
- `Learner assumption`：会阅读 JavaScript/CommonJS，理解 Git、进程退出码、文件与 symlink；不了解本仓库的安装语义。
- `Material status`：`学习材料就绪`

该文件既是 npm `csl-agent-kit` bin，也是旧 wrapper 最终转发到的 Node 入口（`package.json#bin`，`scripts/install.sh:6`）。从外部可观察，它把 `install` 的 argv、TTY/CI、环境与历史选择变成一组 integration targets，再产出平台动作或 dry-run 计划、终端/JSON 输出和退出码（`bin/csl-agent-kit.js#main`）。边界外是 `prompts`、用户目录、Codex CLI、Pi CLI 以及实际被安装的 repo-root 内容；文件只编排这些边界，不实现它们（`bin/csl-agent-kit.js#resolveInstallTargets`，`bin/csl-agent-kit.js#installCursor`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi`）。

### Learning Targets

- **LT1**：给定 argv、TTY/CI 与历史选择，预测最终 target 集合或提前退出原因。
- **LT2**：区分“计划 change record”“实际平台状态变化”“交互选择持久化”，并预测 Cursor、Codex、Pi 三条执行分支。
- **LT3**：解释 Codex plugin 命令与 legacy link 清理的先后、归属边界和失败后果。
- **LT4**：从各 target result 推导人类/JSON 输出语义与进程退出码。

必需前置：JavaScript 函数调用、数组/对象、同步异常；Node `process`、`fs`、`spawnSync` 与 symlink 基本语义。本文不覆盖 `prompts` 通用教程、三种平台内部实现、仓库 skills/hooks 内容、代码质量审计或修改方案。

| Learning Target | 必需概念 | Representative behavior/checkpoint | Prediction or transfer check |
| --- | --- | --- | --- |
| LT1 | entry guard、options 与 selected targets 的分离、选择优先级、`die` | B1/C1–C3；B2/C1–C3 | P1、P2、P3；K-P1、K-P2、K-P3 |
| LT2 | target registry、change record、dry-run 边界、选择文件状态 | B1/C3–C5；B2/C3–C4 | P1、P2、T1；K-P1、K-P2、K-T1 |
| LT3 | allow-failure 命令、cleanup 时序、owned link 判定 | B3/C1–C4 | P4、T2；K-P4、K-T2 |
| LT4 | per-target failure isolation、aggregate `ok`、输出投影 | B1/C4–C5；B3/C2–C4 | P1、P4；K-P1、K-P4 |

## 2. Concept Ladder

| 顺序 | 概念及项目内含义 | 建立在哪项行为事实之上 | 教学理由 | 源码锚点 |
| --- | --- | --- | --- | --- |
| 1 | **入口契约**：只有 `install` 进入安装链；npm bin 与 wrapper 都落到同一 `main` | `main` 从 `process.argv.slice(2)` 取 command，非 `install` 打印帮助 | 先固定观察边界，避免把 helper 当成独立服务 | `package.json#bin`，`scripts/install.sh:6`，`bin/csl-agent-kit.js#main` |
| 2 | **options 与 selected targets**：flags 描述请求；selected 是按 `all` → 显式 targets → `yes` → interactive 得到的有序名称列表 | `parseInstallArgs` 不执行安装，`resolveInstallTargets` 才决定集合并去重/验证 | 后续所有状态与失败都受这一选择点控制 | `bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#resolveInstallTargets` |
| 3 | **target registry**：每个 integration 把元数据和一个 `run` 函数绑定，`installTargets` 只负责按序派发与收集 | 同一循环可执行 Cursor、Codex、Pi，平台差异留在各自函数 | 先看共同调度，再比较平台边界，认知负担最小 | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#installTargets` |
| 4 | **三种状态载体**：confirmed selection 是交互偏好；平台文件/CLI 是安装状态；change record 是对动作的描述 | dry-run 返回 records 而不执行平台动作，但交互路径仍可能保存 selection | 防止把“有 change”误判为“状态已经改变” | `bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#runCommands`，`bin/csl-agent-kit.js#ensureSymlink` |
| 5 | **错误拓扑**：参数/交互错误经 `die` 直接退出 `2`；target 同步异常被捕获为 `ok: false`；缺少 Codex/Pi CLI 是 `ok: true` 内的 `skip` | 三类分支到达不同结果层级 | 这是正确预测退出码与清理行为的前提 | `bin/csl-agent-kit.js#die`，`bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#installPi` |
| 6 | **Codex 迁移提交点**：兼容性 remove 可失败，两个 add 不可失败；只有整个命令序列返回后才清理 owned legacy links | required add 抛错会跳过 `removeLegacyCodexSkillLinks` | 让副作用顺序与失败后的剩余状态形成因果模型 | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands` |
| 7 | **结果投影**：同一 results 可渲染为 JSON 或人类摘要，退出 `0/1` 只看所有 result 的 `ok` | color/verbose 影响展示，不改变 result 成败 | 最后把内部 records 映射回调用方可观察行为 | `bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#printResults`，`bin/csl-agent-kit.js#createColors` |

## 3. Guided Code Walkthrough

### B1：默认 target 的无副作用 JSON 预演

选择 `install --yes --dry-run --json`，因为一条行为同时覆盖入口、默认选择、Codex dry-run、change records 与聚合输出。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | `--yes` 是否等于所有 targets？ | `bin/csl-agent-kit.js#parseInstallArgs`，`bin/csl-agent-kit.js#resolveInstallTargets` | `yes` 只选择 registry 中 `default: true` 的项；当前只有 `codex-plugin` | selected 为单元素列表，不进入 prompt 或选择文件路径 |
| C2 | dry-run 是否仍要求本机已有 Codex CLI？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#hasCommand` | CLI 探测受 `!options.dryRun` 保护 | 不调用 `codex --version`，继续生成完整迁移计划 |
| C3 | 八条 plugin 命令是否真正执行？ | `bin/csl-agent-kit.js#runCommands` | dry-run 在 `spawnSync` 前返回 `{action: "command", dryRun: true}` | result 成功且包含八个计划 command；平台状态不变 |
| C4 | JSON 是否可能带 ANSI color？ | `bin/csl-agent-kit.js#main`，`bin/csl-agent-kit.js#createColors` | JSON 分支直接序列化 results，不经过 `printResults` | 即使另有 `--color`，JSON 仍无 ANSI；直接证据：`tests/cli-install-output.test.js:222` |
| C5 | 最终退出码如何决定？ | `bin/csl-agent-kit.js#main` | 顶层 `ok` 与退出码都使用 `results.every(item.ok)` | 当前单 target 成功，顶层 `ok: true` 且退出 `0`；默认输出测试也确认八条计划：`tests/cli-install-output.test.js:44` |

### B2：带历史值的交互选择

选择“已有 `codex-plugin,pi` 历史值后进入无 flags 的 TTY 交互”，因为它揭示 selection state 与本次安装 request 的边界。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | 无 flags 是否总会打开 checklist？ | `bin/csl-agent-kit.js#resolveInstallTargets` | 非 TTY 或 CI 会先经 `die` 退出；只有可交互环境才加载 `prompts` | prompt 不是所有无 flags 调用都可达的分支 |
| C2 | 历史 JSON 是否原样成为 targets？ | `bin/csl-agent-kit.js#loadInstallSelection`，`bin/csl-agent-kit.js#buildInstallChoices` | 只接受 version 1 数组，并按当前 registry 过滤；无有效项则使用 default | 历史值只决定初始勾选，不绕过本次选择 |
| C3 | 为什么还会出现第二次确认？ | `bin/csl-agent-kit.js#targets`，`bin/csl-agent-kit.js#resolveInstallTargets` | `codex-plugin`、`pi` 标记为 external；选中任一个都会启用 confirm prompt | 拒绝确认会在保存和安装前退出 `2` |
| C4 | 确认后何时更新选择文件？ | `bin/csl-agent-kit.js#saveInstallSelection`，`bin/csl-agent-kit.js#resolveInstallTargets` | 有效名称先过滤，以 `0600` 临时文件写入后 rename；保存异常被降级成 warning | selection 持久化失败不阻止本次已确认 target 继续执行；直接测试：`tests/cli-install-output.test.js:232` |
| C5 | 显式 target 会不会覆盖历史？ | `bin/csl-agent-kit.js#resolveInstallTargets` | 显式列表在 `loadInstallSelection` 前返回 | 一次性命令不读取也不保存该状态；直接测试：`tests/cli-install-output.test.js:450` |

### B3：Codex required add 失败时的清理边界

选择“实际 Codex 安装中 plugin add 失败且存在 owned legacy link”，因为它把命令容错、cleanup 提交点、result 聚合连成一条可检验因果链。

| 检查点 | 阅读前预测 | 查看源码 | 应观察什么 | 因果结果 |
| --- | --- | --- | --- | --- |
| C1 | 任一旧 identity remove 失败是否终止迁移？ | `bin/csl-agent-kit.js#installCodexPlugin`，`bin/csl-agent-kit.js#runCommands` | 六条 remove 的 `allowFailure` 为 `true`，两个 add 为 `false` | remove 失败仍继续；required add 非零才抛错 |
| C2 | plugin add 失败后 cleanup 是否已经发生？ | `bin/csl-agent-kit.js#installCodexPlugin` | cleanup 调用位于 `runCommands` 成功返回之后 | 抛错越过 cleanup，owned legacy links 保持原样；直接测试：`tests/cli-install-output.test.js:426` |
| C3 | 成功后哪些 legacy 项可删？ | `bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`，`bin/csl-agent-kit.js#isWithin` | 不遍历 symlinked legacy root；子项须为 symlink，且文本或 real source 位于 repo `skills/` 内 | 普通目录、外部链接、外部 broken link 保留；owned 与指向 repo 内缺失目标的 stale link 可删；直接测试：`tests/cli-install-output.test.js:354`，`tests/cli-install-output.test.js:377` |
| C4 | 该异常怎样到达调用方？ | `bin/csl-agent-kit.js#installTargets`，`bin/csl-agent-kit.js#main` | `installTargets` 捕获为该 target 的 `{ok: false, error}`，主流程再聚合 | JSON 仍可输出结构化失败 result，但顶层 `ok: false`、退出 `1` |

## 4. Human Recall, Prediction & Transfer Checks

严格按以下材料开放顺序进行；三类初始答案全部固定后才能查看第 5 节：

1. **Recall**：隐藏本节以外的 Orientation、Concept Ladder、Walkthrough、Verification Key 与源码，只看 Recall prompts 后独立作答。
2. **Prediction**：可看第 1–3 节，但隐藏 Verification Key 与源码；先固定预测和理由。
3. **Transfer**：可看第 1–3 节和源码，仍隐藏 Verification Key；固定入口、影响边界、验证位置与理由。
4. Recall、Prediction、Transfer 初始答案全部固定后，才打开 Verification Key，对照报告与源码补充解释。

任一阶段提前查看 Key，本轮只算复习；重新测试须换用语义等价但具体场景不同的 prompts。

### Recall prompts

- **R1**：这个文件对调用方承担什么核心职责？说出主要输入、可观察输出及一个不属于它的边界。
- **R2**：解释 options、selected targets、change records 与最终 results/exit code 的因果关系。
- **R3**：保存的 selection 在什么时候读取、什么时候写入？显式 target 与它是什么关系？
- **R4**：说出 Codex required add 失败为何不会删除 owned legacy links，并指出这类失败与参数错误的退出语义差异。

### Prediction prompts

- **P1**：机器没有 `codex` 可执行文件，运行 `install --yes --dry-run --json --color`。预测 selected target、是否探测/执行 Codex、changes、ANSI、顶层 `ok` 与退出码，并解释原因。
- **P2**：选择文件已有 `cursor,pi`，运行 `install --target cursor,cursor,pi --dry-run`。预测 target 顺序、平台状态、选择文件和人类输出层级会发生什么。
- **P3**：选择文件无效，TTY 交互中用户选中 `pi` 后拒绝 external confirmation。预测默认勾选、是否保存、是否执行 Pi 及退出码。
- **P4**：实际 `codex-plugin` 安装中旧 identity removals 失败，但 marketplace add 成功、plugin add 失败；用户目录中有 owned legacy links。预测命令推进位置、links、target result、顶层 `ok` 与退出码。

### Transfer prompts

- **T1**：假设 registry 新增一个不调用外部 CLI、只写用户目录的 target。指出必须检查的选择/确认入口、dry-run 状态边界、result 输出边界及最直接的验证位置；解释为什么 `external` 标记不能替代 dry-run 保护。
- **T2**：面对一个新的 legacy symlink 样例，source 文本在 repo `skills/` 外，但解析后的 real target 在其内。仅凭现有代码判断是否属于 owned、何时会删除、什么失败会阻止删除，并给出源码核对点。

## 5. Verification Key & Completion Standard

### Verification Key

- **K-R1**：必须判断该文件把安装请求编排为 target actions/results，并输出摘要或 JSON 与退出码；输入至少含 argv 与运行环境。可接受“安装 orchestrator/CLI 入口”等表述。边界示例可答“不实现 Codex/Pi 或被安装内容”。锚点：`bin/csl-agent-kit.js#main`、`bin/csl-agent-kit.js#installTargets`；对比分支：非 `install` 只打印帮助。
- **K-R2**：必须给出 options 先形成 selected targets，targets 产生 per-target change/error records，所有 result 的 `ok` 决定顶层状态与退出码。可把 change records 称为动作描述/计划。锚点：`bin/csl-agent-kit.js#parseInstallArgs`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#main`。
- **K-R3**：必须判断 selection 仅在交互路径读取以预选，并在 external confirmation 通过后尝试写入；`all`、显式 targets、`yes` 都提前返回。可接受“显式命令不触碰历史选择”。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`；对比分支：保存失败只警告。
- **K-R4**：必须判断 required add 使 `runCommands` 抛错，cleanup 位于其后所以未运行；target 异常形成失败 result 并最终退出 `1`，而参数错误经 `die` 直接退出 `2`。锚点：`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#die`。
- **K-P1**：selected 仅为 `codex-plugin`；dry-run 不做 `hasCommand` 探测、不执行命令，产生八条 `dryRun` command records；JSON 不经 color renderer，无 ANSI；result 与顶层均成功，退出 `0`。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#main`；直接测试：`tests/cli-install-output.test.js:222`。
- **K-P2**：显式 targets 去重后保持首次出现顺序 `cursor,pi`；两项仅产生 dry-run 计划，不改平台状态；选择文件不读写；默认人类摘要显示每项汇总，非 verbose 不展开路径/命令。锚点：`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#ensureSymlink`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#printResults`。
- **K-P3**：无效历史值使 checklist 回退到默认 `codex-plugin` 预选；用户最终选择 `pi` 会触发 external confirm；拒绝后在 save 和 install 前经 `die` 退出 `2`。锚点：`bin/csl-agent-kit.js#loadInstallSelection`、`bin/csl-agent-kit.js#buildInstallChoices`、`bin/csl-agent-kit.js#resolveInstallTargets`；必要对比：确认通过后才尝试保存。
- **K-P4**：允许失败的 removals 不阻断；required plugin add 失败时命令序列抛错，legacy links 未删；`installTargets` 生成 `ok: false` result，顶层 `ok: false`、退出 `1`。锚点：`bin/csl-agent-kit.js#installCodexPlugin`、`bin/csl-agent-kit.js#runCommands`、`bin/csl-agent-kit.js#installTargets`、`bin/csl-agent-kit.js#main`；直接测试：`tests/cli-install-output.test.js:426`。
- **K-T1**：必须定位 `targets`/`resolveInstallTargets` 的选择与 external-confirmation 语义、target `run` 内的实际 dry-run guard、`installTargets`/`printResults` 的 result 边界，以及 `tests/cli-install-output.test.js` 的 CLI 级验证位置。关键判断是 `external: false` 只抑制交互二次确认，不保证不写用户目录；Cursor 已是该对比分支。锚点：`bin/csl-agent-kit.js#targets`、`bin/csl-agent-kit.js#resolveInstallTargets`、`bin/csl-agent-kit.js#ensureSymlink`。
- **K-T2**：必须判断 owned 条件是文本 source 或 resolved source 任一位于 `skillsRoot` 内，因此该样例属于 owned；只有 Codex 命令序列成功后进入 cleanup，dry-run 只报告，实际路径才 unlink。required add 失败、legacy root 是 symlink/非目录、或该 child 不是 symlink 都阻止删除。锚点：`bin/csl-agent-kit.js#removeLegacyCodexSkillLinks`、`bin/csl-agent-kit.js#isWithin`、`bin/csl-agent-kit.js#installCodexPlugin`。

### Completion Standard

人类学习者只有依照第 4 节的可见材料顺序完成三类初始答案，再打开 Key，并对 R1–R4、P1–P4、T1–T2 的全部关键判断给出正确因果解释，才算完成本轮；提前查看 Key 只算复习。对 Agent，只能由报告外 sealed held-out prediction/transfer task 判断这份材料是否支持其推理，不声称 Agent 已形成记忆或已经学会。
