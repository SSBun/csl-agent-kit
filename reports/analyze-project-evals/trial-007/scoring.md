# Trial 007 盲评记录

## 1. 边界与身份隔离

- Stage 1 仅读取四份匿名候选与两份冻结源码 workspace；未读取 manifest、候选 raw、PRD、skill、旧 trials 或 A/B 身份。
- 冻结 scope 为 `bin/csl-agent-kit.js`，源码 commit 为 `05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Held-out fixture 在候选生成前冻结；visible 阶段完成且通过前未解封 rubric。
- 仅非 `NO_OUTPUT` 且 Learn visible 满分的候选进入 `fork_turns=none` 隔离下游；评分前后均不请求、不推断 mapping。

## 2. 输入 hash 与冻结状态

| 匿名候选 | SHA-256 | 状态 |
|---|---|---|
| A Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| A Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B Develop | `dcaf783a834b813295fb2abbf7bac840fca8efb08bfca7980cdeacb3c050809d` | 88 行，非空 |
| B Learn | `adf23133d1d3dadf6212bcf89a513186e6ce4d139b580907fe429c122238737b` | 211 行，非空 |

Develop 与 Learn workspace 的 `HEAD` 均为 `05a6c689e2344dc925b7dc111f02aa03750114f6`；两处 `bin/csl-agent-kit.js` 的 SHA-256 均为 `f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`，该文件无 diff。仅出现各自预期的未跟踪分析输出目录。

## 3. 事实与锚点核验

- `#targets`：声明顺序精确为 `cursor`、`codex-plugin`、`pi`；metadata 分别为非默认/internal、默认/external、非默认/external，handler 分别为 `installCursor`、`installCodexPlugin`、`installPi`。
- `#main`、`#parseInstallArgs`、`#printHelp`、`#printInstallHelp`、`#die`：command gate 先于 install parser；install help 正常退出 `0`，未知 option 或缺少 target 值直接写 stderr 并退出 `2`。
- `#resolveInstallTargets`、`#validateTargets`：all → explicit → yes → interactive；all 使用 registry 声明顺序，explicit 验证后按首次出现去重，yes 只取 default target。
- `#loadInstallSelection`、`#buildInstallChoices`、`#saveInstallSelection`：interactive 的顺序为 TTY/CI admission → prompt dependency → state load → choice/consent → atomic save；CI/non-TTY 在 state load 前退出，external 拒绝在 save/dispatch 前退出。
- `#installTargets`：循环内逐 target `try/catch`，handler 返回或异常各生成一项同序 result，异常不阻止后续 target。
- `#installCursor`、`#ensureSymlink`：隔离 HOME 的普通文件冲突会真实抛错且保持原文件，可用作真实 failure primitive。
- `#installCodexPlugin`、`#installPi`、`#hasCommand`：非 dry-run 先 probe CLI；缺失时正常返回 successful `skip`，不是异常。
- `#runCommands`：Codex 六条 remove 允许普通非零继续，两条 add 必须成功；dry-run 只生成计划，不 spawn。required add 抛错使 cleanup 不可达。
- `#removeLegacyCodexSkillLinks`、`#isWithin`：只处理真实 legacy 目录中归属于仓库 skills 根的 symlink。
- `#main`、`#printResults`、`#createColors`、`#printChangeDetails`：JSON/human 共用统一 results 与 `every(ok)` 成功谓词；color/verbose 只影响 human。
- 候选引用的聚焦测试行号支持其关键行为；未发现伪造函数锚点或与冻结快照冲突的核心陈述。

## 4. Stage 1：Develop 可见质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness | 0 | 1 | A 为 `NO_OUTPUT`；B 的 scope、HEAD、时间与边界和冻结材料一致。 |
| 功能职责 + 恰好一张有效 Mermaid | 0 | 1 | B 恰有一张有效 flowchart，并配套模块表说明 control、selection、execution 与 projection。 |
| 核心流程含状态与失败 | 0 | 1 | B 覆盖显式/默认、交互 state/consent、三类 effect、解析退出 `2`、handler failure/skip 与最终退出。 |
| 高密度且无审计建议/inventory | 0 | 1 | B 按职责、因果流和不变量组织，没有退化为审计建议或文件 inventory。 |
| 事实可追溯 | 0 | 1 | B 的关键事实均可落到冻结源码和聚焦测试。 |
| **合计** | **0/5** | **5/5** |  |

## 5. Stage 1：Learn visible 质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness / material | 0 | 1 | A 为 `NO_OUTPUT`；B 明确 scope、HEAD、学习前置、边界与“学习材料就绪”。 |
| Targets coverage | 0 | 1 | LT1–LT5 覆盖 admission、registry selection、dispatcher/skip、Codex transaction 与输出/退出。 |
| Concept Ladder | 0 | 1 | B 给出 11 级依赖有序阶梯，逐级绑定行为事实、教学理由与锚点。 |
| 最小 walkthrough | 0 | 1 | 四个 walkthrough 分别覆盖 gate、全 registry dry-run、真实 failure/skip 对照与 required add failure。 |
| Recall → Prediction → Transfer → Key | 0 | 1 | B 明确开放顺序，并提供 Recall、Prediction、四个 Transfer、K1–K9 与 completion standard。 |
| 指定覆盖与双侧验证 | 0 | 1 | B 精确列出 registry 声明顺序/metadata/handler；完整解释 parser error → CI/non-TTY admission → state load → consent → dispatcher gate；T1 给出 discovery early-exit 冲突矩阵与 selection/prompt/Cursor/CLI 零 effect 断言；同时覆盖 default/explicit、external 拒绝、非默认 target、输出控制/正交验证与真实 dispatcher 参与者。 |
| **合计** | **0/5** | **5/5** |  |

### 私有 fixture overlap 检查

B Learn 提供回答相邻开发题所需的 `spawnSync`、availability probe、successful skip、allow-failure、dispatcher 与退出基线；但没有出现 `--command-timeout`、没有描述 timeout/ENOENT 分流、没有提出 timeout 必须先于 allowFailure 判定，也没有 fixture 指定的 Pi/Codex timeout 验证。因此没有密封题具体答案重合。Stage 1 通过。

## 6. 解封的 held-out fixture

- Fixture ID：`learn-heldout-05a6c689-t07`
- Skill fingerprint：`a7ba53eabed14652424c40f41d71d291a4034df11960c70fd87c7130d5f8fb84`
- Source snapshot：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- 冻结时间：`2026-07-19T15:54:59.621Z`
- Prompt + Rubric canonical combined SHA-256：`517a8f01a71a35d684ecbd4a2c52866bb9c7dcfeca9f2f1c6b1430a4565d31df`

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望给 `csl-agent-kit install` 增加 `--command-timeout <ms>`。它为每一次外部子进程调用设置正整数毫秒超时，既覆盖 CLI 可用性 probe，也覆盖实际安装命令；未传参数时保持现有无超时行为。probe 或实际命令超时都必须作为当前 adapter failure 进入统一失败 result，不能把 probe timeout 误当成 missing-CLI successful `skip`；即使某条命令原本允许普通非零退出，timeout 也必须中止该 handler，因为无法确认其完成状态。已经完成的命令副作用不回滚。missing CLI 的 successful `skip`、dry-run 的零子进程行为、普通 allow-failure 非零继续、参数/授权阶段的直接退出和最终 results/exit 契约均不得改变。缺值、非整数或非正数必须在任何选择、probe 或 effect 前直接退出 `2`。

请基于报告完成一次 prediction/transfer：先预测当前外部 CLI 路径中 availability probe、实际命令、allow-failure、missing CLI、adapter result 与最终退出如何衔接，并说明为什么“只给实际安装命令增加 timeout”以及“只看 probe 的非零 status”都不足；再提出满足需求的最小修改方案。说明协作代码触点、必须保持的行为/不变量、最小验证集合，并用报告中的源码锚点解释“参数归一化 → probe timeout/ENOENT 分流 → command timeout/普通非零分流 → exception-to-result → 顶层退出”的因果链。报告未提供的 Node 运行时错误字段细节应明确标注并在实现时核对，不能虚构。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明当前 `parseInstallArgs` 会把未知 `--command-timeout` 交给 `die` 并退出 `2`；Codex/Pi 非 dry-run 先由 `hasCommand` 用 `--version` probe，缺失时 handler 正常返回 `skip` 而得到 `ok:true`；可用时 `runCommands` 同步执行实际命令，普通非零仅在 `allowFailure` 为 false 时抛错；异常由 `installTargets` 转为失败 result，随后 `main` 由 `every(ok)` 使最终退出 `1`；且当前两处 spawn 都没有 timeout 时，记 1。缺任一环节记 0。
2. 协作触点：只有在回答至少定位 `parseInstallArgs`、`installCodexPlugin`/`installPi`、`hasCommand`、`runCommands` 与 `printInstallHelp`，并说明解析正整数 timeout、把 options/timeout 传给 probe、两处 `spawnSync` 都设置 timeout、在读取 status 或应用 allowFailure 之前识别 timeout error 并抛出带 command/probe 上下文的异常，以及缺值/非法值调用 `die` 时，记 1；只修改实际命令或把 timeout 当作普通非零记 0。
3. 保持行为/不变量：只有在回答同时保证未传 flag 时不设置 timeout、missing executable 仍为 successful `skip`、dry-run 仍不 probe/spawn、普通 allow-failure 非零仍记录并继续、timeout 即使发生在 allow-failure 命令也中止 handler、已完成副作用不回滚、参数/授权 direct exit 与 ordered results 不变，且 timeout failure 仍由既有 dispatcher/main 契约得到失败 result 与退出 `1` 时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出隔离 HOME/PATH 和可观察 fake executable 日志的真实 CLI 验证，并同时覆盖：(a) Pi 的 `--version` probe 超时，断言只有 probe 调用、无 install 调用、单一 Pi failure result、退出 `1`；(b) probe 快速成功但 `pi install` 超时，断言两次调用、failure result、退出 `1`；(c) Codex 第一条 allow-failure remove 超时，断言后续命令与 legacy cleanup 均未发生、Codex failure、退出 `1`；(d) missing Pi CLI 仍是 `ok:true` skip/退出 `0`；(e) dry-run 加极小 timeout 仍零调用并输出完整计划；另验证缺值、非整数、零/负数均在 effect 前退出 `2`，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#parseInstallArgs`、`#installCodexPlugin`、`#installPi`、`#hasCommand`、`#runCommands`、`#installTargets`、`#main`、`#printInstallHelp`、`#die` 锚点，并据此解释“解析 timeout → handler 把 timeout 送入 probe → ENOENT/不可用正常返回 skip，但 timeout error 抛出 → 可用时 runCommands 对 timeout 先于 allowFailure 判定并抛出 → dispatcher catch 写 failure → main 聚合退出 1；dry-run 绕过两类 spawn”的完整因果链时，记 1；只有锚点清单或未区分 missing/timeout/allow-failure 记 0。

## 7. 下游原始回答（B Learn，逐字保留）

## 当前路径预测

非 dry-run 下，`installCodexPlugin` 与 `installPi` 先做 CLI availability probe；CLI 缺失时 handler 正常返回 `skip` change，不抛异常，因此 `installTargets` 生成 `ok:true` result，并继续后续 target（`bin/csl-agent-kit.js#installCodexPlugin`、`#installPi`、`#installTargets`）。

probe 成功后：

- Codex 进入 `runCommands`：前六条 remove 允许普通非零退出，仍记录 change 并继续；后两条 add 为必需命令，普通非零会抛异常。全部命令完成后才执行 legacy cleanup。
- Pi 执行 `pi install <repoRoot>`。
- handler 异常由 `installTargets` 循环内的 catch 转成当前 target 的失败 result；其他 target 仍继续，已完成副作用不回滚。
- `main` 最终用 `results.every(item.ok)`同时决定 JSON 顶层 `ok` 与 exit：全部成功/skip 为 `0`，任一 adapter failure 为 `1`（`bin/csl-agent-kit.js#runCommands`、`#installTargets`、`#main`）。

dry-run 在 handler 中短路 availability probe，`runCommands` 也只生成计划，不 spawn，因此仍须保持零子进程。参数错误和授权拒绝仍在 results 产生前直接 exit `2`。

只给实际安装命令增加 timeout 不够：availability probe 本身也可能永久阻塞，且 probe 超时后根本到不了安装命令。

只看 probe 的 `status` 也不够：timeout、CLI 不存在以及普通退出并不保证能仅靠数值 status 区分。若继续把“非零或非成功 status”统一解释成 unavailable，probe timeout 会错误落入 successful `skip`。报告没有提供当前受支持 Node 版本中 `spawnSync` 对 timeout、ENOENT 返回的具体 `error/status/signal` 字段组合；实现时必须用该版本的官方契约和可运行测试核对，不能假定某个字段值。

## 最小修改方案

1. 在 `parseInstallArgs` 增加 `--command-timeout <ms>`：

   - 默认 `undefined`，保持现有无超时行为。
   - 取值后以 `Number.isInteger(value) && value > 0` 归一化。
   - 缺值、非整数、零或负数立即调用现有 `die`，exit `2`。
   - 解析仍先于 `resolveInstallTargets`，所以 selection、state、prompt、probe 和 effect 均不可达。
   - 在 `printInstallHelp` 增加该参数；不改变既有 parser/help 的扫描优先级。

2. 将归一化后的 timeout 随现有 `options` 传入 Codex/Pi handler、availability probe 和 `runCommands`。每次 spawn 都使用同一个“单次命令 timeout”，不是整次 install 的累计 deadline。未传值时不设置 spawn timeout。

3. 在 probe 结果处先分类，再判断 status：

   - timeout：抛出带命令上下文的异常；
   - ENOENT：保持现有 missing-CLI 正常 `skip`；
   - 正常完成：沿用现有 status-based availability 语义；
   - 其他 spawn error：沿用或收紧为异常，但不得伪装成 missing CLI。

   timeout 与 ENOENT 的具体 Node 字段需在实现时核对。

4. 在 `runCommands` 中把 timeout 判定放在普通 exit-status/`allowFailure` 逻辑之前：

   - timeout：立即抛异常，中止当前 handler；
   - 普通非零且 `allowFailure:true`：照旧记录并继续；
   - 普通非零且 `allowFailure:false`：照旧抛异常；
   - 成功：照旧继续。

   因而 Codex 的 allow-failure remove 若超时，也不会继续 required add 或 cleanup；因为超时后命令完成状态未知。此前已完成、以及超时命令可能已经产生的副作用均不回滚。

不需要修改 `installTargets` 或 `main` 的 result/exit 结构：抛出的 timeout 自然复用现有 exception-to-result 路径。报告说明 `scripts/install.sh` 原样转交参数，因此无需为它增加解析逻辑。

## 协作触点与不变量

代码触点：

- `bin/csl-agent-kit.js#parseInstallArgs`
- `bin/csl-agent-kit.js#printInstallHelp`
- Codex/Pi availability probe 所在逻辑
- `bin/csl-agent-kit.js#installCodexPlugin`
- `bin/csl-agent-kit.js#installPi`
- `bin/csl-agent-kit.js#runCommands`
- `tests/cli-install-output.test.js`

必须保持：

- 未传参数时无 timeout。
- dry-run 零 spawn。
- ENOENT/missing CLI 仍为 `ok:true` skip，并继续后续 target。
- 普通 allow-failure 非零仍继续。
- timeout 无视 `allowFailure`，中止当前 handler。
- adapter 失败不阻断后续 adapter。
- Codex cleanup 仍只在全部 command stage 完成后发生。
- 已完成副作用不回滚。
- 参数/环境/授权错误仍直接 exit `2`，不进入 JSON/human results formatter。
- result 顺序、JSON/human 分流及最终 `results.every(item.ok)` 契约不变。

## 最小验证集合

1. 参数归一化：分别覆盖缺值、文本、`1.5`、`0`、负数，断言 exit `2`，selection/state/prompt/Cursor/probe/effect sentinel 全部不变。
2. 默认与 dry-run：未传 timeout 的现有用例完全不变；传 timeout 的 dry-run 仍零子进程，计划 changes 与 exit 不变。
3. Probe 分流：

   - ENOENT 仍生成 successful skip，后续 target 执行，整体 exit `0`。
   - fake CLI 在 probe 阶段阻塞超过 timeout：当前 adapter 失败而非 skip，后续 target仍执行，整体 exit `1`。

4. Command 分流：

   - 普通 allow-failure 非零仍继续后续命令。
   - allow-failure 命令超时则立即停止当前 handler，后续命令和 cleanup 不发生。
   - required 命令超时同样失败；此前命令日志/副作用仍保留。
   - 后续 adapter 仍执行，证明异常只转成当前 adapter failure。

5. 输出回归：timeout failure 在 JSON 与 human 模式都来自统一 results；JSON 顶层 `ok:false`、exit `1`，无 timeout 的 all-ok/skip 仍 exit `0`。

完整因果链是：

`parseInstallArgs/die` 参数归一化  
→ `installCodexPlugin` / `installPi` 对 probe timeout 与 ENOENT 分流  
→ `runCommands` 对 timeout 与普通非零分流  
→ `installTargets` 将异常转为当前 target 失败 result  
→ `main` 以 `results.every(item.ok)` 投影输出并 exit `0/1`。

## 8. Held-out 二元评分

A Learn 为 `NO_OUTPUT`，五项均为 0。B Learn 严格逐项如下：

| 项目 | A | B | B 的判定依据 |
|---|---:|---:|---|
| H1 当前约束 | 0 | 0 | 覆盖 probe、skip、allow-failure、exception-to-result、`every(ok)` 与 dry-run，但没有明确说明“当前未知 `--command-timeout` 经 parser/`die` 退出 `2`”，也没有明确陈述当前 probe 与实际命令两处 `spawnSync` 均未设置 timeout。部分正确按二元规则仍为 0。 |
| H2 协作触点 | 0 | 0 | 解析、handlers、probe、`runCommands`、help 与 timeout/error 顺序基本正确，但未定位必需的 `#hasCommand`；代码触点只写“availability probe 所在逻辑”。严格条件缺一项即为 0。 |
| H3 保持行为/不变量 | 0 | 1 | 同时保证无 flag 无 timeout、missing CLI skip、dry-run 零 spawn、普通 allow-failure 继续、timeout 覆盖 allowFailure、无回滚、direct exit、ordered results 与 dispatcher/main 的失败/退出契约。 |
| H4 最小验证 | 0 | 0 | 只有抽象 probe/command timeout 用例；没有分别固定 Pi probe-only 调用、Pi probe+install 两次调用、单一 Pi failure result，也没有指定 Codex 第一条 allow-failure remove timeout 的日志/结果组合。严格场景不完整。 |
| H5 锚点因果 | 0 | 0 | 因果解释总体正确，但缺少 rubric 必需的 `#hasCommand` 与 `#die` 完整源码锚点；仅写 `parseInstallArgs/die` 和抽象 probe 不能替代指定锚点集合。 |
| **合计** | **0/5** | **1/5** | B = `0 + 0 + 1 + 0 + 0`。 |

## 9. Verdict

- A：Develop `0/5`，Learn visible `0/5`，held-out `0/5`。
- B：Develop `5/5`，Learn visible `5/5`，held-out `1/5`。
- Held-out 门槛要求 `5/5` 且至少领先 baseline 1 分；B 虽领先 1 分，但未达到 `5/5`。
- **Trial 007：FAIL**。
- Verdict 与匿名身份映射无关；评分前后均未请求或推断 mapping。

## 10. Audit replay

- 回放前 scoring SHA-256：`64cabac4d3f14143169581088fa429d183cfec4470b897b56b93372b64f4d7f5`。
- 从第 6 节按 canonical 格式重新拼接 `PROMPT\n...\n\nRUBRIC\n...\n`，SHA-256 为 `517a8f01a71a35d684ecbd4a2c52866bb9c7dcfeca9f2f1c6b1430a4565d31df`，与候选生成前冻结值一致。
- 四份匿名候选回放 hash 依次为 `3f90b41d...4b40`、`3f90b41d...4b40`、`dcaf783a...809d`、`adf23133...737b`，与第 2 节完整值一致。
- 独立重算 Develop：A `0/5`，B `5/5`。
- 独立重算 Learn visible：A `0/5`，B `5/5`。
- 独立重算 held-out：A `0/5`；B 为 H1–H5 = `0 + 0 + 1 + 0 + 0 = 1/5`。
- 门槛回放：B 虽领先 A 1 分，但 `1/5 < 5/5`，因此 verdict 仍为 **FAIL**。
- 回放未读取、请求或推断 A/B 身份映射。
