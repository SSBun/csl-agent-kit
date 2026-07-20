# Analyze Project v2 Trial 004 匿名评分记录

## 1. 边界与冻结输入

- 评测角色：独立匿名 Verifier / sealed held-out Scorer。
- 冻结源码 commit：`05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Develop workspace：`/tmp/analyze-project-eval4.KuPBMI/skill-develop`。
- Learn workspace：`/tmp/analyze-project-eval4.KuPBMI/skill-learn`。
- Scope：`bin/csl-agent-kit.js`。
- Skill fingerprint：`a374e11396a21e3138b21d89762af4c2359544274d39b1b40b1f853bfb192dbf`。
- 身份映射：评分期间未读取、未请求、未推断、未记录。
- 二元规则：每项只能为 `0` 或 `1`；部分满足记 `0`。

## 2. 匿名候选 hashes

| Candidate | SHA-256 | 形态 |
| --- | --- | --- |
| A-develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| A-learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B-develop | `9ebd0726be905c8d9887d0d87af6751379f373b2e7be252437635e153531581d` | 有报告 |
| B-learn | `b47706fd95269046f2a3495cca5b7a2885f6c1279f55670ed551105bd97f1743` | 有报告 |

两个冻结 workspace 的 `bin/csl-agent-kit.js`、`package.json`、`scripts/install.sh` 与 `tests/cli-install-output.test.js` hashes 完全一致，HEAD 均为冻结 commit；当前各自只出现生成后的预期 analysis 输出目录。

## 3. Stage 1 事实与锚点核验

### 3.1 Candidate A

`A-develop` 与 `A-learn` 均为标准 `NO_OUTPUT`；按协议各可见维度全部为 `0`，Learn 不调用 downstream。

### 3.2 Candidate B

| 事实组 | 冻结源码核验 | 结果 |
| --- | --- | --- |
| 入口与 scope | `package.json#bin` 指向该 JS；`scripts/install.sh:6` 转发 `install`；`main` 只让 `install` 进入安装链。 | PASS |
| registry 与选择策略 | 当前 targets 为 Cursor、Codex、Pi；`all → explicit → yes → interactive` 顺序、显式验证/去重、`yes` 只选 default 均正确。 | PASS |
| interactive consent | TTY/CI gate、selection version 1、历史过滤、external 仅在 interactive 二次确认、拒绝发生在 save/adapter 前均正确。 | PASS |
| selection 持久化 | `CSL_AGENT_KIT_HOME`/默认路径、同目录临时文件、mode `0600`、rename、保存失败仅 warning，以及 interactive dry-run 仍可写偏好均正确。 | PASS |
| adapter/result | `installTargets` 逐 target 捕获异常并继续；Cursor symlink、Codex plugin、Pi command、missing CLI successful `skip` 均正确。 | PASS |
| Codex gate/cleanup | 六条 remove 允许失败、两条 add required；required failure 越过 cleanup；owned link 的文本或 resolved source containment、dry-run 与幂等断言均正确。 | PASS |
| 输出与退出 | JSON 直接序列化统一 results 且绕过颜色 renderer；人类摘要/verbose 行为、direct exit `2`、failed result exit `1`、全成功 exit `0` 均正确。 | PASS |
| 测试锚点 | 报告引用的 `tests/cli-install-output.test.js` 行号及 `package.json#scripts.test:cli` 均存在并对应所述行为。 | PASS |
| Freshness | 报告 scope/HEAD 正确；`Working tree: clean` 是预期输出写入前的输入采样，当前仅报告输出为 untracked。 | PASS |

未发现不受冻结源码支持的事实、答案或锚点。

## 4. Develop 五项评分

| 维度 | A | B | B 证据 |
| --- | ---: | ---: | --- |
| D1 正确 scope / freshness | 0 | 1 | 单文件 scope、冻结 HEAD、clean 输入状态和生成时间齐全。 |
| D2 职责模块图且恰好一张有效 Mermaid | 0 | 1 | 恰有一个有效 `flowchart LR`，关系图与模块表一致。 |
| D3 核心流程含状态和主要失败 | 0 | 1 | 覆盖选择、interactive state、Codex cleanup、results/output 及退出 `1/2`。 |
| D4 高密度且无审计/建议/inventory | 0 | 1 | 内容为当前状态地图，无审计结论、改造建议或文件 inventory。 |
| D5 项目事实可追溯 | 0 | 1 | 每个模块、流程与不变量均有源码或测试锚点。 |
| **Develop 可见总分** | **0/5** | **5/5** |  |

## 5. Learn 可见五项评分

| 维度 | A | B | B 证据 |
| --- | ---: | ---: | --- |
| L1 正确 scope / freshness / material status | 0 | 1 | scope、HEAD、clean 输入、生成时间、learner assumption 与“学习材料就绪”齐全。 |
| L2 targets 覆盖链 | 0 | 1 | LT1–LT5 映射 concepts、B/C checkpoints、P/T 与 Key，覆盖选择、效果、结果、迁移。 |
| L3 Concept Ladder | 0 | 1 | 八层从入口/registry 到策略、consent、state、adapter、cleanup 与聚焦验证，事实/理由/锚点分列。 |
| L4 最小 walkthrough | 0 | 1 | 三个代表行为分别覆盖 default/explicit、interactive refusal、Codex failure/cleanup，无重复铺陈。 |
| L5 严格材料顺序与必需 Transfer 覆盖 | 0 | 1 | 明确 Recall→Prediction→Transfer→Key 串行隔离；覆盖 default/explicit、external consent 拒绝、非默认 target 迁移及 `test:cli` 聚焦验证。 |
| **Learn visible 总分** | **0/5** | **5/5** |  |

### Sealed overlap 检查

B Learn 描述现有 JSON 无 ANSI、results/exit 语义，但练习与 Key 未包含 `--json-compact`、单行序列化、pretty/compact 等价或本 fixture 的具体修改/验证答案，故无具体重合。

## 6. Sealed fixture 解封

- Fixture ID：`learn-heldout-05a6c689-t04`
- Combined SHA-256：`97544ebecdddc52ef0ced7270685869daab581a35a423ac71702cded2c9ff189`
- 冻结时间：`2026-07-19T14:53:10.304Z`
- Skill fingerprint：`a374e11396a21e3138b21d89762af4c2359544274d39b1b40b1f853bfb192dbf`

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望给 `csl-agent-kit install` 增加 `--json-compact`。该参数本身即启用 JSON 输出，输出必须是单行，但解析后的顶层 schema、每个 target result、change/error 内容都必须与同一请求的现有 `--json` 完全相同；二者同时出现时只改变空白格式，采用 compact。现有 `--json` 仍保持缩进输出，人类输出、颜色/verbose 行为与所有退出码均不得改变。

请基于报告完成一次 prediction/transfer：先预测当前 JSON 与人类输出如何共享 results、在哪里分流、退出码何时决定，再提出满足需求的最小修改方案。说明至少两个需要协作的代码触点、必须保持的行为/不变量、最小验证集合，并用报告中的源码锚点解释“新参数如何只改变 JSON 序列化空白，而不改变安装执行、结果结构或退出语义”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明 `installTargets` 先形成统一 results、`main` 的 `options.json` 分支直接以两空格缩进序列化 `{ok, results}` 并绕过 `printResults` / color renderer，以及输出后仍由同一 `results.every(item.ok)` 决定退出 `0/1` 时，记 1；缺任一因果环节记 0。
2. 协作触点：只有在回答至少定位两个协作触点，且必含 `parseInstallArgs` 与 `main`，并说明新 option 如何从解析入口传到 JSON 分支、如何与现有 `json` option 组合决定 serializer 的缩进参数时，记 1；只列名称不说明协作关系记 0。
3. 保持行为/不变量：只有在回答同时保证现有 `--json` 继续缩进、compact 与 pretty 的 JSON.parse 结果完全相等、JSON 路径始终无 ANSI 且不受 verbose 影响、人类 `printResults` 路径不变、target 执行/结果顺序/失败隔离/退出码均不变时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出同一成功请求和同一失败请求的成对 CLI 验证，比较 `--json` 与 `--json-compact` 的 JSON.parse 深度相等和退出码相等；同时断言 compact 只有一行、pretty 保持多行、两者即使带 `--color --verbose` 也无 ANSI，并至少有一个无 JSON flag 的人类输出回归断言时，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#parseInstallArgs`、`#installTargets`、`#main`、`#printResults`、`#createColors` 锚点，并据此解释“解析 compact option → 复用同一 results → 只选择不同 JSON.stringify 缩进 → 绕过人类 renderer → 复用同一退出谓词”的因果链时，记 1；只有锚点清单或无因果解释记 0。

## 7. Downstream 原始回答

### Candidate A

按协议未调用：`A-learn` 为 `NO_OUTPUT`。

### Candidate B

### 当前行为预测

`parseInstallArgs` 先把 argv 转为 options；`resolveInstallTargets` 再决定有序 selected targets；`installTargets` 按顺序调用 adapter，并把 adapter 的 changes 或局部捕获的 error 统一组成 results（`bin/csl-agent-kit.js#parseInstallArgs`、`#resolveInstallTargets`、`#installTargets`）。

JSON 与人类输出应共享同一份 results，并在 `main` 的输出阶段才分流（`bin/csl-agent-kit.js#main`）：

- JSON 分支序列化包含顶层 `ok` 与 results 的现有 payload；报告未提供完整顶层字段名，因此不能断言除 `ok`、results 外是否还有字段。
- 人类分支把同一 results 渲染为摘要/文本；具体 renderer 函数名报告未提供。
- JSON 不带 ANSI，即使同时传 `--color`；人类输出的颜色、verbose 行为属于另一分支。

退出码也不应由 renderer 决定：

- 参数错误、非 TTY/CI admission 失败、interactive external consent 拒绝等在 results 形成前经 `die` 直接退出 `2`（`#resolveInstallTargets`、`#die`）。
- adapter 抛错由 `installTargets` 局部捕获为该 target 的 failed result，后续 target 仍执行。
- 顶层 `ok` 与最终退出码共同基于 `results.every(result => result.ok)`：全 true 为 `0`，任一 false 为 `1`（`#installTargets`、`#main`）。
- missing CLI 产生 successful `skip` change，target 仍为 `ok: true`，不会令退出码变成 `1`（`#installCodexPlugin`）。

### 最小修改方案

生产代码只需在 `bin/csl-agent-kit.js` 协作修改两个核心触点：

1. `parseInstallArgs`

   增加 `--json-compact`。解析它时同时设置“启用 JSON”和“compact”状态，例如语义上等价于：

   ```js
   options.json = true
   options.jsonCompact = true
   ```

   `--json` 仍只设置 `options.json = true`。这样无论两个参数的先后顺序如何，`jsonCompact` 一旦为 true 就保持 true，满足“同时出现时采用 compact”。

2. `main` 的现有 JSON 输出分支

   继续使用当前 `--json` 已经序列化的同一个 payload，仅把 `JSON.stringify` 的缩进参数改为条件值：

   ```js
   JSON.stringify(payload, null, options.jsonCompact ? 0 : 2)
   ```

   不为 compact 重建对象、不映射 results、不改 change/error。`0` 只去除格式化空白；字符串内容中的换行会由 JSON 转义，不会生成额外物理输出行。现有 stdout 写入若追加一个结尾换行，仍然是单行 JSON。

还应在 `printInstallHelp` 增加该参数说明，并在 `tests/cli-install-output.test.js` 添加聚焦验证；报告给出的现有命令入口是 `package.json#scripts.test:cli`。确切 help 排版和现有 payload 局部变量名未在报告中提供，应按源码原样做最小调整。

### 必须保持的不变量

- `--json` 仍使用现有缩进格式。
- `--json-compact` 单独出现即进入 JSON 分支。
- 两参数同时出现只改变空白，compact 胜出。
- `JSON.parse(compactStdout)` 与同请求 `JSON.parse(jsonStdout)` 深度相等，包括顶层 schema、target 顺序、每个 result、change 和 error。
- 不修改 `resolveInstallTargets`、`installTargets` 或任何 adapter，因此 selection、安装执行、dry-run、平台状态和 results 顺序不变。
- 人类输出、颜色、verbose、ANSI 隔离不变。
- direct exit `2`、successful/skip exit `0`、failed result exit `1` 均不变。

### 最小验证集合

在 `tests/cli-install-output.test.js` 中至少覆盖：

1. 成功 dry-run：同一隔离 HOME/PATH 请求分别使用 `--json` 与 `--json-compact`；断言两者解析后深度相等，compact stdout 只有一个物理非空行，旧 `--json` 仍含缩进换行，退出码均为 `0`。
2. 优先级：使用 `--json --json-compact`，断言仍为单行，并与仅 `--json` 的解析结果相等。
3. 失败结果：用现有 fake Codex 让 required add 失败；两种 JSON 输出解析后深度相等，error 内容不变，退出码均为 `1`。
4. 回归：保留现有无 JSON、人类输出、`--color`/verbose、skip 和 direct exit `2` 测试；可在 compact 成功用例同时带 `--color`，断言 stdout 无 ANSI。

因果链是：新参数只在 `parseInstallArgs` 打开现有 JSON 模式并记录 compact 偏好；selection 仍由 `resolveInstallTargets` 完成；执行与结果仍由原 adapters 和 `installTargets` 完成；`main` 仍从同一 results 计算顶层 `ok` 与退出码；最后仅把同一 payload 的 `JSON.stringify` 缩进从 `2` 切换为 `0`。因此安装执行、结果结构和退出语义没有新的分支，唯一变化是 JSON 序列化空白。

## 8. Held-out 二元评分

| 维度 | A | B | B 判断 |
| --- | ---: | ---: | --- |
| H1 当前约束 | 0 | 1 | 说明统一 results、`main` 输出分流、现有两空格序列化、JSON 无 ANSI及同一 `every(ok)` 退出谓词。 |
| H2 至少两个协作触点 | 0 | 1 | 明确 `parseInstallArgs` 与 `main`，并给出 `json/jsonCompact` option 组合和条件缩进。 |
| H3 保持行为/不变量 | 0 | 1 | pretty/compact parse 等价、旧 JSON、人类输出、颜色/verbose、执行顺序、失败隔离和退出均保持。 |
| H4 最小验证 | 0 | 0 | 成功/失败成对与行数、人类回归均有，但只明确 compact 成功用例带 `--color`；未要求 pretty 与 compact 两种 JSON 都带 `--color --verbose` 并断言无 ANSI。部分满足记 `0`。 |
| H5 报告锚点因果 | 0 | 0 | 引用 `#parseInstallArgs`、`#installTargets`、`#main` 并解释主要因果链，但明确表示报告未提供 renderer 名称，未引用必需的 `#printResults` 与 `#createColors`。部分满足记 `0`。 |
| **Held-out 总分** | **0/5** | **3/5** | A 为 `NO_OUTPUT`；B 未达到必需 `5/5`。 |

## 9. 总分与 Verdict

| Candidate | Develop visible | Learn visible | Learn held-out | Candidate verdict |
| --- | ---: | ---: | ---: | --- |
| A | 0/5 | 0/5 | 0/5 | FAIL (`NO_OUTPUT`) |
| B | 5/5 | 5/5 | 3/5 | FAIL（held-out 未达 `5/5`） |

**TRIAL 004 VERDICT：FAIL。**

该结论不依赖且不披露身份映射：没有任何匿名候选达到 Learn held-out `5/5`，因此完整通过条件不成立。

## 10. Audit replay

- 重放时间：`2026-07-19T15:08:53.020Z`
- 保存输入：追加本节前 `scoring.md` SHA-256 为 `5a1a477b02063dcbdd6cd7cae4529bc2233d9ae31d1ce1fe79095ab051f4206c`。
- Fixture 重算：从保存的 Prompt/Rubric 重建 canonical combined text，SHA-256 为 `97544ebecdddc52ef0ced7270685869daab581a35a423ac71702cded2c9ff189`，与冻结值一致。
- 匿名候选 hashes：从保存文件重算后与第 2 节四项一致。
- Develop 重算：A `0/5`，B `5/5`。
- Learn visible 重算：A `0/5`，B `5/5`。
- Held-out 重算：A `0/5`；B `1 + 1 + 1 + 0 + 0 = 3/5`。
- Verdict 重算：没有候选达到 held-out `5/5`，结果为 `FAIL`。
- Replay 结论：与第 9 节一致；未使用身份映射。
