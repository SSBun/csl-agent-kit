# Trial 009 盲评记录

## 1. 边界与身份隔离

- Stage 1 仅读取四份匿名候选与冻结源码 workspace；未读取 manifest、候选 raw、PRD、skill、旧 trials 或 A/B 身份。
- 冻结 scope 为 `bin/csl-agent-kit.js`，源码 commit 为 `05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Held-out fixture 在候选生成前冻结；visible 阶段完成且通过前未解封 rubric。
- 仅非 `NO_OUTPUT` 且 Learn visible 满分的候选进入 `fork_turns=none` 隔离下游；评分前后均不请求或推断 mapping。

## 2. 输入 hash 与冻结状态

| 匿名候选 | SHA-256 | 状态 |
|---|---|---|
| A Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| A Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B Develop | `cb41645d3a514f5209476122ccaa517d24d6bbc8c7ee3a571f6823d347a1692f` | 90 行，非空 |
| B Learn | `9bc73160efb19306ac17a494414c6a8497c0d7ffac2b919808722752fd7e371d` | 212 行，非空 |

Develop 与 Learn workspace 的 `HEAD` 均为 `05a6c689e2344dc925b7dc111f02aa03750114f6`；两处 `bin/csl-agent-kit.js` 的 SHA-256 均为 `f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`，该文件无 diff。仅出现各自预期的未跟踪分析输出目录。

## 3. 事实与锚点核验

- `#targets`：registry canonical ids、声明顺序、default/external/handlers 与 B 报告一致。
- `#parseInstallArgs`、`#splitTargets`：`--target value`、`--targets value`、`--target=value`、位置 list 均按出现顺序 append 到 `options.targets`；逗号 split/trim/filter 事实准确；all/yes 使用独立字段。
- `#resolveInstallTargets`、`#validateTargets`：all → explicit → yes → interactive；explicit 当前先 validation，再用 `Set` 稳定去重；all 早退会覆盖 explicit validation。
- `#loadInstallSelection`、`#buildInstallChoices`、`#saveInstallSelection`：environment/state/consent/save 顺序与非交互不读写 preference 的描述准确。
- `#installTargets`：按 canonical registry id 调 handler，逐项 try/catch 产生同序 results；throw 不阻止后续 target，normal skip 为成功。
- `#installCursor`、`#ensureSymlink`：普通文件冲突与 dry-run effect 边界准确。
- `#installCodexPlugin`、`#installPi`、`#hasCommand`、`#runCommands`：probe args、Codex 六个 allow-failure remove + 两个 required add、Pi operation、dry-run、missing skip、普通 status 与 cleanup 顺序均准确。
- 现有 probe spawn 不显式设置 cwd；现有 operation spawn 使用 `cwd: repoRoot`，而 Codex marketplace add 与 Pi install argv 中仍携带 canonical `repoRoot`。
- `#removeLegacyCodexSkillLinks`、`#isWithin`：cleanup ownership/root 与普通/外部对象保护边界准确。
- `#main`、`#printResults`、`#createColors`、`#printChangeDetails`：统一 results、JSON/human 分流、color/verbose 与 `every(ok)` 退出契约准确。
- 未发现伪造函数锚点或与冻结快照冲突的核心陈述。

## 4. Stage 1：Develop 可见质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness | 0 | 1 | A 为 `NO_OUTPUT`；B 的 scope、HEAD、时间与边界和冻结材料一致。 |
| 功能职责 + 恰好一张有效 Mermaid | 0 | 1 | B 恰有一张有效 flowchart，并配套模块表覆盖 front door、selector、dispatcher 与 formatter。 |
| 核心流程含状态与失败 | 0 | 1 | B 覆盖非交互、interactive state/consent、三类 effect、parser/validation exit、throw/skip 与最终退出。 |
| 高密度且无审计建议/inventory | 0 | 1 | B 按职责、因果流与不变量组织，没有退化为审计建议或文件 inventory。 |
| 事实可追溯 | 0 | 1 | B 的关键事实均可落到冻结源码和聚焦测试。 |
| **合计** | **0/5** | **5/5** |  |

## 5. Stage 1：Learn visible 质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness / material | 0 | 1 | A 为 `NO_OUTPUT`；B 明确 scope、HEAD、前置、边界与“学习材料就绪”。 |
| Targets coverage | 0 | 1 | LT1–LT6 覆盖 gates、syntax pipeline、registry、dispatcher、process 与 output。 |
| Concept Ladder | 0 | 1 | B 给出 11 级依赖有序阶梯，逐级绑定事实与锚点。 |
| 最小 walkthrough | 0 | 1 | 四个 walkthrough 覆盖 gate、syntax/all、真实 failure/skip 与 process/cleanup。 |
| Recall → Prediction → Transfer → Key | 0 | 1 | B 明确开放顺序，提供 Recall、Prediction、六个 Transfer 与 K1–K12。 |
| 指定 normalization 与 alias/rename transfer | 0 | 1 | B 给出精确 syntax/parser action/split helper/common field/order 表，明确 canonicalization 缺失、validation-before-stable-dedupe-dispatch；T6 覆盖所有语法、alias/canonical 混合、saved state、具体 Codex handler dry-run 8 plans/零调用与 actual 一次 probe+八次 operations。此前 registry/gates/discovery/process/output 全链也保留。 |
| **合计** | **0/5** | **5/5** |  |

### 私有 fixture overlap 检查

B Learn 精确说明 probe/operation 与 process resource 基线，但没有出现 `--operation-cwd`、没有提出目录 realpath/stat gate、没有描述仅替换 operation PWD、也没有 PWD/argv 专用验证。因此没有密封题具体答案重合。Stage 1 通过。

## 6. 解封的 held-out fixture

- Fixture ID：`learn-heldout-05a6c689-t09`
- Skill fingerprint：`35ff69341d63c0d676f058d01895c3cfa53db0ccbb8aefc31c1f41f65a2985ec`
- Source snapshot：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- 冻结时间：`2026-07-19T16:35:07.038Z`
- Prompt + Rubric canonical combined SHA-256：`96f6a24b9eaf27faecb696a02b5c40e315a69ff78bbcd0997a9785f88f0b3b2e`

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望给 `csl-agent-kit install` 增加 `--operation-cwd <dir>`。它只改变 Codex/Pi 实际安装 operation 的工作目录：传入路径必须在任何 target selection、state、probe 或 effect 前解析为现存真实目录，否则缺值、路径不存在或不是目录都直接退出 `2`。未传参数时 operation 继续使用当前 `repoRoot`。availability probe 的调用方式与继承工作目录保持不变；传给 Codex marketplace add 和 Pi install 的 `repoRoot` 参数也不得变化。Cursor symlink source、legacy cleanup ownership/root、selection/consent、dry-run 零子进程、missing-CLI skip、allow-failure、results 顺序与最终退出契约均不得改变。不得用全局 `process.chdir` 实现。

请基于报告完成一次 prediction/transfer：先预测当前 Codex/Pi probe 与 operation 各自使用什么 argv/cwd、dry-run/missing/failure 如何进入 results/exit，并说明为什么全局 chdir 或只修改调用参数都不满足需求；再提出最小修改方案。说明协作触点、必须保持的行为/不变量、最小验证集合，并用报告中的源码锚点解释“参数解析与目录校验 → handler/probe 保持原状 → runCommands 只替换 operation spawn cwd → canonical repoRoot 参数与非进程 effects 保持 → dispatcher/main 退出”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明当前未知 `--operation-cwd` 经 `parseInstallArgs`/`die` 在 resolver 前退出 `2`；Codex/Pi 非 dry-run 先由 `hasCommand` 分别执行 `codex --version`/`pi --version`，该 probe spawn 未显式设置 cwd；可用时 `runCommands` 的实际 operation spawn 明确使用 `cwd: repoRoot`，Codex marketplace add 与 Pi install 的 argv 仍包含 `repoRoot`；dry-run 跳过 probe/operation；operation throw 经 `installTargets` 成失败 result、`main` 最终退出 `1` 时，记 1。缺任一环节记 0。
2. 协作触点：只有在回答至少定位 `parseInstallArgs`、`main`、`runCommands` 与 `printInstallHelp`，并说明新增默认未设置的 option、缺值调用 `die`、在 `main` 调 resolver 前用 filesystem realpath/stat 校验现存目录并把可操作错误转为 direct exit `2`、随后由现有 options 传到 handlers/`runCommands`，且只将 operation `spawnSync` 的 cwd 改为 `options.operationCwd || repoRoot`，不修改 `hasCommand` 或调用 `process.chdir` 时，记 1；缺任一协作关系记 0。
3. 保持行为/不变量：只有在回答同时保证未传 flag 时 operations 仍以 `repoRoot` 为 cwd；probe argv/cwd 不变；Codex/Pi operation argv 中的 canonical `repoRoot` 不变；Cursor source 与 legacy cleanup root/ownership 不变；dry-run 仍零 probe/operation 且计划不变；missing skip、allow-failure、selection/consent、ordered results、无 rollback 与 dispatcher/main 退出契约均不变；非法目录 direct exit `2` 且零 state/effect 时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出隔离 HOME/PATH、fake executable 同时记录精确 argv 与 `PWD` 的真实 CLI 验证，并覆盖：(a) actual Codex：probe 仍以继承 cwd 运行，后续八条 lifecycle operations 全部以 realpath 后的指定目录为 PWD，marketplace add argv 仍携带 `repoRoot`，canonical result/exit `0`；(b) actual Pi：probe PWD 不变，唯一 `install <repoRoot>` 的 PWD 为指定目录，exit `0`；(c) 未传 flag 时 operation PWD 仍为 `repoRoot`；(d) Cursor 与 Codex cleanup sentinel 证明 source/ownership 不受 flag 影响；(e) dry-run 加 flag 时零日志且 planned changes 与基线相同；另验证缺值、不存在路径、普通文件在 selection/state/probe/effect 前 exit `2`，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#parseInstallArgs`、`#main`、`#installCodexPlugin`、`#installPi`、`#hasCommand`、`#runCommands`、`#installCursor`、`#ensureSymlink`、`#removeLegacyCodexSkillLinks`、`#installTargets`、`#printInstallHelp`、`#die` 锚点，并据此解释“parse/realpath+stat direct gate → probe 仍走 hasCommand 原 cwd → operations 经 runCommands 使用新 cwd 但 argv repoRoot 不变 → Cursor/cleanup 仍绑定 repoRoot → exception/result/main exit 不变；dry-run 两类 spawn 不可达”的完整因果链时，记 1；只有锚点清单或混淆 process cwd 与 repoRoot argv/source 记 0。

## 7. 下游原始回答（B Learn，逐字保留）

## 当前行为预测

以下“精确”受匿名报告的信息边界约束：Pi argv 完整可知；Codex 的 6 组 remove、marketplace add、plugin add 的完整参数顺序未在报告展开，不能臆造。

| 阶段 | 进程/argv | cwd |
|---|---|---|
| Codex probe | `codex ["--version"]` | 继承启动安装器时的 cwd |
| Pi probe | `pi ["--version"]` | 继承启动安装器时的 cwd |
| Codex operation | 6 个 allow-failure remove，随后 required marketplace add、required plugin add；marketplace add 的路径参数保持 canonical `repoRoot` | 当前为 `repoRoot`（由题面明确；报告未展示具体 `spawnSync` 写法） |
| Pi operation | `pi ["install", repoRoot]` | 当前为 `repoRoot` |

对应锚点是 `#hasCommand`、`#installCodexPlugin`、`#installPi`、`#runCommands`。

### results 与退出

- dry-run：Codex/Pi 的 probe 和 operation 都是 0 次；Codex 返回 8 个计划，Pi 返回 1 个计划；两项均为成功 result，整体退出 `0`。
- probe 非零：handler 正常返回 successful skip，不执行 operation；dispatcher 仍生成 ok result，后续 target 继续。若其余结果均 ok，退出 `0`。
- Codex remove 普通非零：因 `allowFailure` 被记录后继续；两个 required add 成功后才执行 legacy cleanup。
- Codex required add 或 Pi install 非零：handler throw，`installTargets` 的逐项 catch 产生 failed result；后续 target 仍参与，结果保持 selection 顺序，最终退出 `1`。
- Codex required operation 失败时，legacy cleanup 不可达。
- 当前代码没有 timeout/retry/cancel，也没有单独检查 `result.error`；报告不足以断言 ENOENT、signal 等 runtime error 的精确结果。

锚点：`#runCommands`、`#removeLegacyCodexSkillLinks`、`#installTargets`、`#main`。

## 为什么两个直觉实现都不对

全局 `process.chdir(operationCwd)` 会改变 probe 本应继承的 cwd，也可能波及 state、Cursor symlink、legacy cleanup 和后续 target。即使事后恢复，它在生效区间内仍改变所有相对路径语义，违反“只改变 operation spawn cwd”。

把 `operationCwd` 替换进命令 argv 也不对：cwd 是进程启动属性，不是普通参数。尤其不能把 Codex marketplace add 或 `pi install` 的 `repoRoot` 参数改成 `operationCwd`，否则改变的是安装来源，而非 operation 的执行目录。

## 最小修改方案

1. 在 `#parseInstallArgs` 增加 `--operation-cwd <dir>`。

   - 缺值直接 `die(..., 2)`。
   - 使用 Node 标准库按安装器初始 cwd 解析相对路径，再以 `realpath` 得到现存真实绝对路径，并检查 `stat.isDirectory()`。
   - 不存在、无法解析或不是目录均退出 `2`。
   - 校验必须在调用 `#resolveInstallTargets` 前完成，不能延迟到 handler 或 `#runCommands`；否则 target selection、state 或 probe 已经发生。
   - 未传时令有效 operation cwd 为 `repoRoot`。
   - 在 `#printInstallHelp` 补充该参数。

2. 沿现有 options/handler 调用链传递已校验的 `operationCwd`。报告没有给出函数签名，因此无法断言具体需要改几层参数；只需最短透传，不新增抽象。

3. 保持 `#hasCommand` 原样：仍执行 `<cmd> --version`，且不设置 `cwd`。

4. 只在 `#runCommands` 的真实 operation `spawnSync` 选项中使用：

   ```js
   cwd: operationCwd
   ```

   dry-run 的提前返回位置保持不变，确保零子进程。

5. handler 构造的 argv 保持原样：

   - Codex marketplace add 继续携带 canonical `repoRoot`；
   - Pi 继续是 `["install", repoRoot]`；
   - Codex remove/plugin add 参数不变；
   - Cursor source、legacy cleanup ownership/root 继续使用各自原有 `repoRoot` 语义。

不需要 `process.chdir`、新依赖、cwd 上下文对象或恢复逻辑。

## 因果链与协作触点

```text
#parseInstallArgs
  解析并 realpath/校验 operationCwd
        ↓
#resolveInstallTargets
  selection/state/consent 保持原状
        ↓
#installTargets
  registry 顺序、逐项 catch、results 顺序保持
        ↓
#installCodexPlugin / #installPi
  #hasCommand probe argv 与继承 cwd 不变
        ↓
#runCommands
  仅 operation spawn 的 cwd = operationCwd
  operation argv 中的 repoRoot 不变
        ↓
Cursor symlink / legacy cleanup
  非进程 effect、ownership/root 不变
        ↓
#main
  JSON/human 输出与 every-ok 退出谓词不变
```

主要协作触点只有 `#parseInstallArgs`、`#printInstallHelp`、options 透传处、`#runCommands` 和 `tests/cli-install-output.test.js`。不要改 registry、resolver 或 dispatcher 策略。

## 最小验证集合

1. 前置校验：缺值、不存在路径、普通文件均 stderr/exit `2`；state、prompt、probe、Cursor 和 cleanup sentinel 全部未触发。目录 symlink 应解析为真实目录。
2. cwd/argv：fake Codex/Pi 同时记录 argv 与 cwd；probe 仍继承启动 cwd，所有 operation 使用真实 `operationCwd`；marketplace add 和 Pi install 的参数仍是 `repoRoot`。
3. 默认回归：未传参数时，operation cwd 仍为 `repoRoot`。
4. dry-run：合法 `operationCwd` 下仍为零子进程、Codex 8 plans、Pi 1 plan、results 保序、exit `0`。
5. failure/skip：missing CLI 仍 successful skip；Codex allow-failure remove 仍继续；required failure 仍产生 failed result、后续 target 继续、最终 exit `1`，cleanup 可达性不变。
6. 非进程 effect：Cursor symlink source 与 legacy cleanup ownership/root 不随 `operationCwd` 改变。

重复 `--operation-cwd` 的优先级、以及它与 `--help` 同时出现时的优先级，匿名报告和题面均未明确；不应在实现中悄然发明新契约。

## 8. Held-out 二元评分

A Learn 为 `NO_OUTPUT`，五项均为 0。B Learn 严格逐项如下：

| 项目 | A | B | B 的判定依据 |
|---|---:|---:|---|
| H1 当前约束 | 0 | 0 | 正确覆盖 probe/operation cwd、argv、dry-run、skip、throw/result/exit，但没有明确说明“当前未知 `--operation-cwd` 经 parser/`die` 在 resolver 前退出 `2`”。二元项缺一环即为 0。 |
| H2 协作触点 | 0 | 0 | parser/help/realpath/stat/options/runCommands/hasCommand 边界基本正确，但把 filesystem 校验放进 `parseInstallArgs`，未按 rubric 在 `main` 的 parser 后、resolver 前建立 direct gate；也未明确使用 `options.operationCwd || repoRoot` 的默认表达。 |
| H3 保持行为/不变量 | 0 | 0 | 大多数不变量均覆盖，但没有明确保证“已完成副作用无 rollback”。严格项缺少该要求即为 0。 |
| H4 最小验证 | 0 | 0 | 有 fake argv/PWD、默认/dry-run/非法目录/Cursor-cleanup 对照，但未明确隔离 HOME/PATH，也未分别固定 actual Codex 的八条 operation 与 canonical result/exit `0`、actual Pi 唯一 operation/exit `0` 的完整断言。 |
| H5 锚点因果 | 0 | 0 | 因果链总体正确，但缺少必需的 `#installCursor`、`#ensureSymlink` 与 `#die` 源码锚点；“Cursor symlink”与 `die(...)` 不能替代指定锚点集合。 |
| **合计** | **0/5** | **0/5** | B = `0 + 0 + 0 + 0 + 0`。 |

## 9. Verdict

- A：Develop `0/5`，Learn visible `0/5`，held-out `0/5`。
- B：Develop `5/5`，Learn visible `5/5`，held-out `0/5`。
- Held-out 门槛要求 `5/5` 且至少领先 baseline 1 分；两候选均为 `0/5`，无领先且均未达到门槛。
- **Trial 009：FAIL**。
- Verdict 与匿名身份映射无关；评分前后均未请求或推断 mapping。

## 10. Audit replay

- 回放前 scoring SHA-256：`53522d67e728682f90ff68bad958281d58db5c236813056de8645e48a28c42e3`。
- 从第 6 节按 canonical 格式重新拼接 `PROMPT\n...\n\nRUBRIC\n...\n`，SHA-256 为 `96f6a24b9eaf27faecb696a02b5c40e315a69ff78bbcd0997a9785f88f0b3b2e`，与候选生成前冻结值一致。
- 四份匿名候选回放 hash 依次为 `3f90b41d...4b40`、`3f90b41d...4b40`、`cb41645d...692f`、`9bc73160...371d`，与第 2 节完整值一致。
- 独立重算 Develop：A `0/5`，B `5/5`。
- 独立重算 Learn visible：A `0/5`，B `5/5`。
- 独立重算 held-out：A `0/5`；B 为 H1–H5 = `0 + 0 + 0 + 0 + 0 = 0/5`。
- 门槛回放：两候选 held-out 同为 `0/5`，无领先且均未达到 `5/5`，verdict 仍为 **FAIL**。
- 回放未读取、请求或推断 A/B 身份映射。
