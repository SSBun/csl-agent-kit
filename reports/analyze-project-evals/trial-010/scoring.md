# Trial 010 匿名盲评计分

## 1. 评审边界

- 评审对象仅为 `anonymous/A-develop.md`、`anonymous/A-learn.md`、`anonymous/B-develop.md`、`anonymous/B-learn.md`。
- 事实核验仅使用 frozen source workspace `/tmp/analyze-project-eval10.lbEQl8/baseline-learn` 中的源码、依赖关系与 focused tests。
- 未读取 manifest、raw、with-skill、live、frozen skill、PRD、旧 trials 或身份映射；本文不推断匿名身份。
- `NO_OUTPUT` 按规则直接记 0。
- Learn 的可见报告只有满分且未泄露 sealed answer，才进入独立下游 prediction/transfer。

## 2. 输入快照

| 匿名文件 | SHA-256 | 行数 |
|---|---|---:|
| A Develop | `444a5c289e39e83be5c36af84f34efc11e05ca9948701fe9e2fd3d66404be99c` | 89 |
| A Learn | `249b884e24ea7fe58a6784003443f88dc0c8f30c6e3309a98c70a97d0e3ee202` | 203 |
| B Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | 1 |
| B Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | 1 |

Frozen source：

- HEAD：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- `bin/csl-agent-kit.js` SHA-256：`f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`
- `git status --short` 与 `git diff -- bin/csl-agent-kit.js` 均为空。
- Learn sealed fixture：`learn-heldout-05a6c689-t10`
- Sealed skill fingerprint：`6c369b0f595019024513427c95210fc941fad1a835dc586a2d441a79e9f3508f`
- Canonical prompt/rubric SHA-256：`5bed0a62ea8c710c292bca81d355bd5dcde353a7346fb0eb98eccb239264315f`

## 3. 事实核验

源码核验确认：

- `main` 当前以 `const [command = "help", ...args]` 读取 argv，只在 `command === "install"` 时进入 install 链，其余首 token 全部 fall through 到 `printHelp()` 后正常返回。
- `parseInstallArgs` 在 `--help`/`-h` 分支调用 `printInstallHelp()` 并退出 0；未知 install option 调用 `die`，向 stderr 输出 `Error: ...` 并退出 2。
- `resolveInstallTargets` 的选择顺序为 all → explicit（validate 后稳定去重）→ yes → interactive；`installTargets` 逐 target 隔离异常并保持结果顺序。
- Codex/Pi probe 继承调用进程 cwd；真实 operation 通过 `runCommands` 显式使用 `repoRoot`；filesystem 路径由 `repoRoot`/HOME 构造；dry-run 在 effect primitive 前短路真实变化。
- results 只在合法 install 链产生，随后由 JSON 分支或 `printResults` 呈现，并以 results 的整体成功谓词退出 0/1。

真实 CLI 复核与源码一致：无参数、`help`、`--help`、`-h`、`frobnicate`、`cursor`、`--version` 当前均输出同一顶层 help 到 stdout、stderr 空、exit 0；`install --help` 输出详细 install help、exit 0；`install --bogus --json` stdout 空、parser stderr、exit 2；`install --yes --dry-run --json` 返回 canonical Codex dry-run result、exit 0。

## 4. 可见报告二元计分

### A Develop：5/5

| 项 | 分数 | 依据 |
|---|---:|---|
| 范围、入口与新鲜度 | 1 | 正确限定 npm CLI/install orchestration 边界，入口、wrapper 与 scope 外职责陈述可由 frozen source/focused tests 追溯。 |
| 架构与数据流 | 1 | 仅使用一个有效 Mermaid，清楚连接 intake → selection/consent → effects → results/output；正文补足 registry、selection、result 三类核心数据。 |
| 职责与控制流 | 1 | parser、resolver、dispatcher、formatter 的职责、输入输出、policy 与证据位置完整，all/explicit/yes/interactive 优先级准确。 |
| 状态、effect 与失败语义 | 1 | interactive state/authorization、Cursor/Codex/Pi effects、dry-run、skip/throw、per-target failure isolation 和 exit 契约均与源码一致。 |
| 密度与可核验性 | 1 | 无文件清单式堆砌或审计建议；关键结论均给出源码/测试锚点，且没有发现影响结论的事实错误。 |

### A Learn：5/5

| 项 | 分数 | 依据 |
|---|---:|---|
| 范围、新鲜度与学习目标 | 1 | 明确 scope、读者任务和可复核锚点，材料完整而非占位。 |
| option lifecycle 与 semantic gate | 1 | 将 target 的 token consumption、append、semantic validation、stable dedupe 与 dispatch 分层，并给出 direct-exit/gate ledger；可迁移到新的 admission/context option。 |
| effect-context 推理 | 1 | 用 argv、cwd、env/PATH、ownership root、dry-run、failure/cleanup 矩阵区分 probe、operation 与 filesystem effects。 |
| 教学闭环 | 1 | Learning Thread、Concept Ladder、B1–B4 walkthrough、Recall/Prediction/Transfer、Key 与完成标准互相映射，答案可由报告自身推导。 |
| 泛化与边界 | 1 | T1–T7 同时覆盖 registry、parser/semantic gate、failure policy、presentation 与 operation context；不假装掌握 scope 外实现。 |

### B Develop：0/5

内容为 `NO_OUTPUT`，五项均记 0。

### B Learn：0/5

内容为 `NO_OUTPUT`，五项均记 0；不进入下游测试。

## 5. Sealed-answer overlap 检查

结论：**PASS**。

A Learn 提供的是通用的 command/direct-exit、parser/semantic validation、effect context 与验证设计方法。它说明“non-install 当前落到 top help”“install help/parser error 在 resolver 前退出”，但没有给出本题新增的严格顶层 command admission、精确 unknown-command 文案、指定 alias/unknown 测试矩阵或本题答案。因此具备迁移所需的通用材料，但未泄露 sealed answer。

## 6. Sealed fixture

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望收紧 `csl-agent-kit` 的顶层 command admission。无参数、`help`、`--help`、`-h` 仍应打印顶层 help 到 stdout 并正常退出 `0`；首 token 为 `install` 时继续进入现有 install parser/selection/effect/output 流。任何其他首 token（包括位置看似 target 的 `cursor`，或未实现的 `--version`）都必须打印 `Error: Unknown command: <token>` 到 stderr 并直接退出 `2`，不得进入 install parser、target validation、interactive state/prompt、adapter、外部 CLI 或 results formatter。`install --help` 仍由 install parser 输出详细 install help/退出 `0`；未知 install option 仍使用现有 parser error/退出 `2`。常规 install 行为不变。

请基于报告完成一次 prediction/transfer：先预测当前无参数、help aliases、任意未知首 token 与 `install --help` 分别走到哪里、输出到哪个通道并如何退出，再解释为什么只改 `printHelp` 或把未知 command 交给 `parseInstallArgs` 都不满足边界；然后给出最小修改方案、必须保持的不变量和最小验证集合。请用报告中的源码锚点解释“argv 首 token 分类 → top-level help 正常返回 / unknown command die / install parser → resolver → dispatcher → formatter”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明 `main` 当前把缺失首 token 默认成 `help`、只对 `command === "install"` 进入安装分支，而所有其他首 token（包括 `help`/`--help`/`-h` 与任意未知 command）都落到同一个 `printHelp` 后正常返回/退出 `0`；因此未知 command 当前不经过 `parseInstallArgs`、不产生 stderr/exit `2`、state/effect/results 均不可达；`install --help` 则在 `parseInstallArgs` 内调用 `printInstallHelp` 并退出 `0` 时，记 1。缺任一分支记 0。
2. 协作触点：只有在回答至少定位 `main`、`printHelp`、`die`、`parseInstallArgs` 与 `printInstallHelp`，并说明在 `main` 中按顺序区分“无首 token或 top-level help alias → printHelp 后 return”“install → 现有 install 链”“其他 → die(Unknown command)”，未知 command 不应调用 install parser，且 `printHelp`/`printInstallHelp` 文案职责无需混合时，记 1；只改 help 文案、把未知 command 传入 parser 或影响 install help 记 0。
3. 保持行为/不变量：只有在回答同时保证无参数、`help`、`--help`、`-h` 均为 stdout help/exit `0`；未知 command 为 stdout 空、单条指定 stderr、exit `2` 且零 state/prompt/filesystem/process/results；`install --help` 仍详细 help/exit `0`；未知 install option 仍 parser stderr/exit `2`；合法 install 的 selector precedence、consent/persistence、effects、JSON/human 与退出契约均不变时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出隔离 HOME/PATH、selection/prompt/Cursor/fake Codex/Pi sentinels 的真实 CLI 验证，并覆盖：(a) 无参数、`help`、`--help`、`-h` 四项均 exit `0`、stderr 空、stdout 为同一顶层 help；(b) `frobnicate`、`cursor`、`--version` 各自 stdout 空、stderr 精确 `Error: Unknown command: <token>`、exit `2` 且所有 sentinel/log 不变；(c) `install --help` 为详细 install help/exit `0` 且零 effect；(d) `install --bogus --json` 仍不是 JSON、stderr parser error/exit `2`；(e) 一个合法 `install --yes --dry-run --json` 回归保持 canonical result/exit `0`，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#main`、`#printHelp`、`#die`、`#parseInstallArgs`、`#printInstallHelp`、`#resolveInstallTargets`、`#installTargets`、`#printResults` 锚点，并据此解释“当前 non-install 全部 fallthrough 到 top help → 新 main 分类 help/install/unknown → unknown 由 die 在 parser 前退出 → install help 仍在 parser 早退 → 合法 install 才到 resolver/dispatcher/JSON或 printResults”的完整因果链时，记 1；只有锚点清单或混淆 top-level/install help 与 parser 边界记 0。

## 7. 下游原始回答

### 当前行为预测

| 输入 | 当前路径 | stdout / stderr | 退出 |
|---|---|---|---|
| 无参数 | `main` 将缺失的首 token 归入“非 install”，调用顶层 `printHelp` 后正常返回 | 顶层 help → stdout；stderr 空 | `0` |
| `help` / `--help` / `-h` | 均属于“非 install”，同样调用顶层 `printHelp` | 顶层 help → stdout；stderr 空 | `0` |
| 任意其他首 token，如 `cursor`、`--version` | 当前也只是“非 install”，不会当作 target 或 option；打印顶层 help 后返回 | 顶层 help → stdout；stderr 空 | `0` |
| `install --help` | `main` 接纳 `install`，进入 `parseInstallArgs`；parser 走 install-help 直接出口，调用 `printInstallHelp` | 详细 install help → stdout；stderr 空 | `0` |

因此当前 `cursor` 不会进入 positional target 解析；只有 `install cursor` 才会。以上直接出口均使 resolver、交互状态、handler、外部 CLI 和 formatter 不可达（`#main`、`#parseInstallArgs`、`#printHelp`、`#printInstallHelp`、`#die`）。

### 为什么两个局部方案不成立

只改 `printHelp` 不足：`printHelp` 同时服务合法的无参数和三个 help alias。所需差异是首 token 的 admission 分类、输出通道及退出码，不是 help 文本本身。把它改成报错会破坏合法 help；继续正常打印则未知 command 仍为 stdout/0。

把未知首 token 交给 `parseInstallArgs` 也不成立：

- `cursor` 会被 parser 当作合法 positional target，随后经 resolver 进入 dispatcher，可能产生真实 effect。
- 普通未知词会变成 target，直到 resolver 的 `validateTargets` 才失败，错误类别和阻断位置都错了。
- `--version` 会成为未知 install option，得到 parser option error，而不是精确的顶层 `Unknown command`。
- 这无法保证所有未知 command 都在 install parser、state、prompt、adapter 和 formatter 之前统一终止。

### 最小修改方案

修改点只应位于 `bin/csl-agent-kit.js#main` 的首 token admission：

```js
const [command, ...args] = argv;

if (command === undefined || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  return;
}

if (command !== "install") {
  die(`Unknown command: ${command}`);
}

const options = parseInstallArgs(args);
// 保留现有 resolver → dispatcher → formatter 流程
```

这是结构示意；报告没有提供 `main` 的精确变量名、`die` 的签名以及它是否自动添加 `Error: ` 前缀。实现时必须据实际签名保证最终 stderr 精确为：

```text
Error: Unknown command: <token>
```

并退出 `2`。不要改 `printHelp`、`parseInstallArgs`、resolver、handlers 或 formatters。

### 必须保持的不变量

- 无参数、`help`、`--help`、`-h`：顶层 help 仅写 stdout，退出 `0`。
- 任意其他首 token：在 parser 前经 `die`，仅写指定 stderr，退出 `2`，所有后续状态与 effect 为零。
- `install --help`：仍由 install parser 输出详细 help 到 stdout，退出 `0`。
- `install --bogus` 等未知 install option：仍使用现有 parser error，退出 `2`。
- `install cursor` 等 positional target 语法及其他 target/all/yes 语法不变。
- resolver 仍保持 `all → explicit → yes → interactive`，以及 explicit validation 后稳定去重。
- dispatcher 仍按选择顺序调用 registry handler、聚合 results，并继续现有失败隔离。
- main 仍只在正常安装获得 results 后选择 JSON serializer 或 human `printResults`；退出仍由 results 的成功谓词决定。

完整因果链为：

```text
argv 首 token
├─ 缺失/help alias → printHelp → stdout → return 0
├─ 其他 token      → die("Unknown command…") → stderr → exit 2
└─ install
   → parseInstallArgs
      ├─ --help / parser error → 直接退出
      └─ options
         → resolveInstallTargets
         → installTargets（dispatcher）
         → results
         → JSON formatter 或 printResults
         → results 成功谓词决定 0/1
```

对应源码锚点：`#main`、`#printHelp`、`#die`、`#parseInstallArgs`、`#printInstallHelp`、`#resolveInstallTargets`、`#validateTargets`、`#installTargets`、`#printResults`。

### 最小验证集合

1. 表驱动验证无参数、`help`、`--help`、`-h`：同一顶层 help、stdout、stderr 空、退出 `0`。
2. 表驱动验证 `cursor`、`--version`、任意未知词：stdout 空、stderr 精确匹配、退出 `2`；隔离 HOME/PATH 并用 sentinel 证明 state、prompt、filesystem、外部进程及 completion output 均未发生。
3. `install --help`：详细 install help、stdout、stderr 空、退出 `0`，且零后续 effect。
4. `install --bogus`：保留现有 parser error/退出 `2`，不能变成顶层 unknown-command error。
5. `install cursor --dry-run`：证明 `cursor` 在 `install` 后仍是 positional target，并正常经过 resolver、dispatcher、formatter。
6. 保留现有 `install --all --dry-run --json` 回归：registry 顺序的三项结果、Cursor 1/Codex 8/Pi 1 个 plan、零外部进程、退出 `0`。报告给出的验证位置是 `tests/cli-install-output.test.js` 与 `package.json#scripts.test:cli`。

## 8. Held-out 二元计分：2/5

| 项 | 分数 | 严格判定 |
|---|---:|---|
| 1. 当前约束 | 0 | 正确预测了各分支、通道和退出，但只说缺失首 token 被归入“非 install”，没有说明当前代码把它默认赋值为 `help`；rubric 要求全部同时满足，故不得给部分分。 |
| 2. 协作触点 | 1 | 定位 `main`、`printHelp`、`die`、`parseInstallArgs`、`printInstallHelp`，把 help/install/unknown 分类放在 `main`，并明确未知 command 不进入 parser、两类 help 文案职责不混合。 |
| 3. 保持行为/不变量 | 0 | alias、unknown、install help、selector/dispatcher/formatter 多数正确，但没有同时明确保持 interactive consent/persistence；对未知 install option 也未明确写出 stderr 通道，未满足全量 conjunctive 条件。 |
| 4. 最小验证 | 0 | 没有逐项指定 selection/prompt/Cursor/fake Codex/Pi sentinels；未知命令集未明确点名 `frobnicate`；缺少 `install --bogus --json` 的非 JSON 断言，也以 `--all` 回归替代 rubric 指定的 `install --yes --dry-run --json` canonical 回归。 |
| 5. 锚点因果 | 1 | 引用了八个必需锚点，并完整说明当前 fallthrough、新 main 分类、unknown 在 parser 前 die、install help parser 早退，以及合法 install 到 resolver/dispatcher/JSON 或 `printResults` 的链。 |

## 9. 汇总与裁决

| 匿名候选 | Develop | Learn 可见 | Learn held-out | 总体裁决 |
|---|---:|---:|---:|---|
| A | 5/5 | 5/5 | 2/5 | FAIL |
| B | 0/5 | 0/5 | 未运行 | FAIL |

Trial 010 裁决：**FAIL**。A 的可见报告质量达标，但 held-out prediction/transfer 未满分；B 为 `NO_OUTPUT`。

## 10. Audit replay

- 首次写入 scoring SHA-256：`8b41f47fa481d4d0e26ba7cf9c22319e5c6fc4c0352cf2eb582e55936d5afd96`。
- 重新计算四份匿名输入哈希，均与“输入快照”一致。
- 从本文 `### Prompt` 与 `### Rubric` 按 canonical `PROMPT\n…\n\nRUBRIC\n…\n` 格式重建 fixture，SHA-256 为 `5bed0a62ea8c710c292bca81d355bd5dcde353a7346fb0eb98eccb239264315f`，与 sealed canonical hash 一致。
- 独立重算可见表格：A Develop `5`、A Learn `5`、B Develop `0`、B Learn `0`。
- 独立重算 held-out 表格：`2`。
- 分数与汇总表一致；原始下游回答在揭示 rubric 前已固定，本文逐字保留。
