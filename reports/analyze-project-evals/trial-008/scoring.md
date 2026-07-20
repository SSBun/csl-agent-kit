# Trial 008 盲评记录

## 1. 边界与身份隔离

- Stage 1 仅读取四份匿名候选与冻结源码 workspace；未读取 manifest、候选 raw、PRD、skill、旧 trials 或 A/B 身份。
- 冻结 scope 为 `bin/csl-agent-kit.js`，源码 commit 为 `05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Held-out fixture 在候选生成前冻结；visible 阶段完成且通过前未解封 rubric。
- 仅非 `NO_OUTPUT` 且 Learn visible 满分的候选进入 `fork_turns=none` 隔离下游；评分前后均不请求或推断 mapping。

## 2. 输入 hash 与冻结状态

| 匿名候选 | SHA-256 | 状态 |
|---|---|---|
| A Develop | `807d76bc01834b1400defa7d67838e3fd46e31936bb6771b517b991dc1763234` | 88 行，非空 |
| A Learn | `26415f7a0b837fa32f4ac52817f18d8a4368f8301a595b22bdf4f55c3729fcf8` | 235 行，非空 |
| B Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |

Develop 与 Learn workspace 的 `HEAD` 均为 `05a6c689e2344dc925b7dc111f02aa03750114f6`；两处 `bin/csl-agent-kit.js` 的 SHA-256 均为 `f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`，该文件无 diff。仅出现各自预期的未跟踪分析输出目录。

## 3. 事实与锚点核验

- `#targets`：registry 声明顺序为 `cursor`、`codex-plugin`、`pi`；default/external/handler metadata 与 A Learn 表格一致。
- `#main`、`#parseInstallArgs`、`#splitTargets`、`#die`：位置 target、`--target`/`--targets`、`--target=` 与逗号列表汇入 options targets；parser 错误在 resolver/state/effect 前直接退出 `2`。
- `#resolveInstallTargets`、`#validateTargets`：all → explicit → yes → interactive；explicit 当前先 validation，再通过 `Set` 去重并保持首次出现顺序。
- `#loadInstallSelection`、`#buildInstallChoices`、`#saveInstallSelection`：interactive 的 admission/state/consent/save 顺序及非交互分支不读写 selection 的描述准确。
- `#installTargets`：按 canonical registry name 查 `spec.run`，每个 handler 返回/异常形成一个同序 result，catch 不阻止后续 target。
- `#installCursor`、`#ensureSymlink`：普通文件冲突可稳定制造真实 handler failure，且 dry-run 不变更 link。
- `#installCodexPlugin`、`#installPi`、`#hasCommand`、`#runCommands`：probe 精确使用 `<cmd> --version`；Codex 八条 operation、Pi 一条 operation、dry-run、missing skip、普通 status/allowFailure 与 required throw 的报告描述均准确。
- 当前两处 `spawnSync` 确实没有 timeout/retry/cancel policy，也没有独立读取 `result.error`；A Learn 未虚构具体 runtime 字段。
- Codex cleanup 只在命令阶段返回后发生；required failure 时不可达。dispatcher 后续真实 target 仍参与，最终 `main` 用 `every(ok)` 决定 JSON 顶层状态与退出 `0/1`。
- `#printInstallHelp`、`#printResults`、`#createColors`、`#printChangeDetails` 的 registry/help 与 JSON/human/color/verbose 描述均与冻结源码一致。
- 未发现伪造函数锚点或与冻结快照冲突的核心陈述。

## 4. Stage 1：Develop 可见质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness | 1 | 0 | A 的 scope、HEAD、生成时间与边界和冻结材料一致；B 为 `NO_OUTPUT`。 |
| 功能职责 + 恰好一张有效 Mermaid | 1 | 0 | A 恰有一张有效 flowchart，并配套模块表描述 routing、governance、effects 与 delivery。 |
| 核心流程含状态与失败 | 1 | 0 | A 覆盖 install、interactive state、三类 effect、direct exit、handler failure/skip 与最终退出。 |
| 高密度且无审计建议/inventory | 1 | 0 | A 按职责、流程与不变量组织，没有退化为审计建议或文件 inventory。 |
| 事实可追溯 | 1 | 0 | A 的关键事实均可落到冻结源码与聚焦测试。 |
| **合计** | **5/5** | **0/5** |  |

## 5. Stage 1：Learn visible 质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness / material | 1 | 0 | A 明确 scope、HEAD、前置、边界与“学习材料就绪”；B 为 `NO_OUTPUT`。 |
| Targets coverage | 1 | 0 | LT1–LT5 覆盖 gates、registry、effect/dispatcher、external process contract 与输出。 |
| Concept Ladder | 1 | 0 | A 给出 12 级依赖有序阶梯，每级绑定行为事实与源码锚点。 |
| 最小 walkthrough | 1 | 0 | 四个 walkthrough 覆盖 gate、all dry-run、真实 failure/skip 与 external process/cleanup 分类。 |
| Recall → Prediction → Transfer → Key | 1 | 0 | A 明确材料开放顺序，并提供 Recall、Prediction、五个 Transfer 与 K1–K10。 |
| 指定全链与 process-policy 验证 | 1 | 0 | A 覆盖 default/explicit/consent、非默认 target、输出正交、真实 dispatcher、registry/gates/discovery；另精确给出具体 handlers、probe args、operations、dry-run、missing/status/allowFailure/throw、cleanup、现有 resource limits、spawn anchors，并在 T4 设计逐 handler 精确调用日志。 |
| **合计** | **5/5** | **0/5** |  |

### 私有 fixture overlap 检查

A Learn 提供 target registry、explicit validation/Set、handler 与 help 的通用基线，但没有出现 `codex` alias、没有提出 registry 外 canonicalization map、没有规定 canonicalize → validate → dedupe 的新顺序，也没有 alias 专用语法矩阵或 fake Codex 验证。因此没有密封题具体答案重合。Stage 1 通过。

## 6. 解封的 held-out fixture

- Fixture ID：`learn-heldout-05a6c689-t08`
- Skill fingerprint：`c9d0787b07c25c3ab201a8f89e4756e9eb5146f6629f23efb8014a03c13dbcfd`
- Source snapshot：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- 冻结时间：`2026-07-19T16:16:40.369Z`
- Prompt + Rubric canonical combined SHA-256：`c19befdecb85cebd1de91c335e27e6ee309abbbf4bc52ca851e416338a20cda6`

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望为显式 target selector 增加向后兼容 alias：用户输入 `codex` 时应规范化为 canonical `codex-plugin`。alias 必须适用于位置 target、`--target <list>`、`--targets <list>`、`--target=<list>` 以及逗号混合列表；规范化必须发生在 target 合法性校验和去重之前，因此 `pi,codex,codex-plugin,pi,cursor` 最终按首次出现的 canonical 顺序得到 `pi,codex-plugin,cursor`。alias 不能作为新条目加入 target registry，不能产生 alias result id，也不能改变 `--all`、`--yes`、交互 choices/consent、selection persistence 或既有三项 canonical target 顺序。install help 应在 registry 派生的 canonical Targets 列表之外单独说明 alias。未知的其他 target 仍须在任何 state/effect 前直接退出 `2`；未使用 alias 时现有行为不变。

请基于报告完成一次 prediction/transfer：先预测当前各类显式 selector 输入 `codex` 后如何经过 parser、validation、dispatcher 与退出契约，并解释为什么“把 alias 加进 registry”或“在 validation/dedupe 之后替换名称”都不满足要求；再提出最小修改方案。说明协作触点、必须保持的行为/不变量、最小验证集合，并用报告中的源码锚点解释“所有显式语法汇入 targets → alias canonicalization → validation → canonical 去重保序 → registry handler → canonical result/exit”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明位置 target、`--target`/`--targets` 参数与 `--target=` 都经 `parseInstallArgs`/`splitTargets` 汇入 options 的显式 targets；`resolveInstallTargets` 的 explicit 分支当前先用 `validateTargets` 对 registry keys 校验，再用 `Set` 保留首次出现顺序；因此 `codex` 当前是 unknown target，经 `die` 在 state/dispatcher 前退出 `2`，而合法 canonical 名才进入 `installTargets` 时，记 1；缺任一环节记 0。
2. 协作触点：只有在回答至少定位 `parseInstallArgs`/`splitTargets`、`resolveInstallTargets`、`validateTargets`、`targets` 与 `printInstallHelp`，并说明 alias map/helper 必须位于 registry 外，只在 explicit 分支把原始 names 映射为 canonical names，随后对 canonical 数组先 validation、再 `Set` 去重保序，并在 canonical Targets 列表外增加 alias help 文案时，记 1；把 alias 加入 registry、只改一个 selector 拼写或在 validation/dedupe 后替换记 0。
3. 保持行为/不变量：只有在回答同时保证五类显式输入均接受 alias，results 只含 canonical id；`--all`、`--yes`、interactive choices/external consent、selection load/save 与 registry 声明顺序均不变；alias 不新增 handler、不重复执行 canonical target；其他 unknown target 仍 direct exit `2` 且零 state/effect；未用 alias 时选择顺序、输出与最终退出契约不变时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出聚焦真实 CLI 验证并同时覆盖：(a) 位置、`--target`、`--targets`、`--target=` 与逗号混合五类语法在 dry-run JSON 中都只产生 canonical `codex-plugin` result、退出 `0` 且零外部调用；(b) 隔离 HOME/PATH 的 actual `--target codex --json` 使用可观察 fake Codex，断言一次 `--version` probe 加八条 lifecycle 命令、result id 为 `codex-plugin`、退出 `0` 且 selection 文件不存在；(c) `pi,codex,codex-plugin,pi,cursor` 的 dry-run results 精确为 `pi,codex-plugin,cursor`；(d) `--all`、`--yes`、interactive/saved selection 与 help canonical 列表保持三项且原顺序不变，help 另含 alias 说明；(e) 其他 unknown target 在日志/state/effect 前退出 `2`，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#parseInstallArgs`、`#splitTargets`、`#resolveInstallTargets`、`#validateTargets`、`#targets`、`#installTargets`、`#installCodexPlugin`、`#main`、`#printInstallHelp`、`#die` 锚点，并据此解释“显式语法汇流 → registry 外 alias map 规范化 → canonical validation → canonical Set 去重保序 → installTargets 查 canonical registry handler → main 输出 canonical results/exit；all/yes/interactive 绕过 alias 规范化”的完整因果链时，记 1；只有锚点清单或没有证明 canonicalization 的前后顺序记 0。

## 7. 下游原始回答（A Learn，逐字保留）

## 当前行为预测

根据报告可确认的链路：

`parseInstallArgs` → `resolveInstallTargets` 显式分支 → `validateTargets` → `installTargets` → `main` 统一输出/退出。

当前 registry 只有 `cursor`、`codex-plugin`、`pi`，因此以下输入中的 `codex` 都会被 parser 当作合法的 selector 值接收，而不是 parser 语法错误：

- 位置 target：`install codex`
- `install --target codex`
- `install --targets codex`
- `install --target=codex`
- 包含 `codex` 的逗号列表

它们随后进入 `resolveInstallTargets` 的 explicit 分支；`validateTargets` 查不到 registry id `codex`，经 `die` 向 stderr 报错并退出 `2`。此时：

- dispatcher/handler 不可达；
- 不读取或写入 selection state；
- 不加载 prompts、不显示交互 choices/consent；
- 不产生 filesystem/process effect；
- 不产生 result，更不会有 `codex` result id；
- 即使带 `--json`，错误也不会变成 JSON，因为 JSON formatter 位于 dispatcher 生成 results 之后。

报告没有展示 parser 内部字段名、逗号拆分函数和当前去重实现；以上只断言报告能证明的共同结果：所有被支持的显式语法最终在 validation 因 `codex` 非 registry id 而退出 `2`。

## 为什么两个直觉方案不成立

“把 `codex` 加进 registry”会污染 registry 的多重职责。报告明确指出 `targets` 同时派生：

- `--all` 顺序；
- `--yes` 默认项；
- interactive choices 和 external consent；
- selection load/filter/save；
- install help 的 canonical Targets；
- dispatcher 与 results 顺序。

因此新增 registry 项会把 alias 变成第四个真实 target，可能产生独立 choice、保存值、重复 handler 执行或 `codex` result id，并改变既有 canonical 顺序，直接违反要求。

“validation/dedupe 后再替换”也不成立：

- validation 后替换：`codex` 已被 `validateTargets` 拒绝，替换不可达；
- dedupe 后替换：`codex` 与 `codex-plugin` 会先被视为两个不同值，替换后形成两个 canonical `codex-plugin`，可能重复派发、重复 effect、重复 result；
- 对 `pi,codex,codex-plugin,pi,cursor`，只有先 canonicalize 才能按首次 canonical 出现得到 `pi,codex-plugin,cursor`。

## 最小修改方案

保持 `targets` registry 完全不动，另设精确 alias 映射：

```js
const targetAliases = {
  codex: "codex-plugin",
};
```

在 `resolveInstallTargets` 的 explicit 分支中，所有显式语法已经汇入 target 列表之后，只做一次：

```js
const canonical = explicitTargets.map(
  id => targetAliases[id] ?? id
);

validateTargets(canonical);

return [...new Set(canonical)];
```

关键顺序必须是：

```text
显式语法汇入 targets
→ exact alias canonicalization
→ validateTargets
→ canonical stable dedupe
→ installTargets
→ targets["codex-plugin"].run
→ canonical result
→ results.every 决定 exit
```

JS `Set` 保留首次出现顺序，因此示例依次成为：

```text
pi,codex,codex-plugin,pi,cursor
→ pi,codex-plugin,codex-plugin,pi,cursor
→ pi,codex-plugin,cursor
```

未知名称不在 alias map 中，保持原值，随后仍由 `validateTargets` 在任何 state/effect 前退出 `2`。不要增加大小写折叠或其他未要求的模糊 alias。

`printInstallHelp` 保留现有 registry 派生的三项 canonical Targets，之后单独增加例如：

```text
Aliases:
  codex → codex-plugin
```

该行可从 `targetAliases` 派生，但不能从 `targets` registry 派生。

## 必须保持的不变量

- registry 顺序仍是 `cursor,codex-plugin,pi`。
- `--all` 仍返回上述三项，绝无 `codex`。
- 无显式 selector 的 `--yes` 仍只选择默认 `codex-plugin`。
- selector precedence 仍为 all → explicit → yes → interactive。
- 显式 `codex` 和显式 `codex-plugin` 一样绕过交互 state、choices、consent 与 persistence。
- interactive choices、external consent 和保存内容只使用 canonical ids。
- dispatcher 只收到 canonical ids，因此 handler 与 result id 都是 `codex-plugin`。
- canonical handler 正常成功或 availability skip 时 exit `0`；handler throw 形成 failed result时 exit `1`；未知 selector 仍 exit `2`。
- 未使用 alias 的输入，selection、effects、results、输出与 exit 不变。

## 协作触点与源码锚点

- `parseInstallArgs`：继续负责各显式语法和列表解析，不应分别实现 alias。
- `resolveInstallTargets`：唯一 canonicalization 插入点；其 explicit early return保证不触碰交互状态机。
- `validateTargets`：只校验 canonical ids，继续以 `targets` 为合法性事实源。
- `targets`：保持三项声明不变，从而保护 all/default/choices/persistence。
- `printInstallHelp`：canonical 列表照旧，额外显示独立 alias 段。
- `installTargets`：接收保序去重后的 canonical ids，按 registry handler 分派并逐项形成 canonical result。
- `main`：继续由 `results.every` 复用 JSON/human 的 success 与 exit 契约。

这些结论分别对应报告的 `#parseInstallArgs`、`#resolveInstallTargets`、`#validateTargets`、`#targets`、`#printInstallHelp`、`#installTargets` 和 `#main` 锚点。`scripts/install.sh` 据报告只是参数转发，因此无需为 alias 增加第二套实现。

## 最小验证集合

1. 以 `--dry-run --json` 分别覆盖位置 target、`--target`、`--targets`、`--target=`；每项断言只有 canonical `codex-plugin` result、exit `0`。
2. 覆盖逗号混合输入 `pi,codex,codex-plugin,pi,cursor`，断言结果顺序精确为 `pi,codex-plugin,cursor`，且 Codex handler 仅派发一次。
3. `codex,unknown` 断言 stderr/exit `2`，selection 字节、prompt/handler/process/filesystem sentinels 全部不变，且无 results payload。
4. 回归 `--all`、`--yes`、interactive choices/consent、saved selection：仍只有三项 canonical ids，顺序和原行为不变。
5. help 断言 canonical Targets 仍为三项，alias 只出现在独立说明段。
6. 成对比较未使用 alias 的 canonical invocation；results、effect logs 和 exit 必须不变。
7. 复用 canonical Codex handler 的 skip/failure场景验证 alias：availability skip 为 canonical ok result/exit `0`；required operation failure 为 canonical failed result/exit `1`。

验证位置按报告应落在 `tests/cli-install-output.test.js`，并运行 `package.json#scripts.test:cli` 指向的 focused command。

## 8. Held-out 二元评分

B Learn 为 `NO_OUTPUT`，五项均为 0。A Learn 严格逐项如下：

| 项目 | A | B | A 的判定依据 |
|---|---:|---:|---|
| H1 当前约束 | 0 | 0 | 正确列出五类显式语法、validation/`die` 与 state/dispatcher 不可达；但明确表示报告未展示逗号拆分函数和当前去重实现，未定位 `#splitTargets`，也未明确给出当前 explicit 分支“先 validate、再 Set”的完整事实。二元项部分正确仍为 0。 |
| H2 协作触点 | 0 | 0 | registry 外 alias map、explicit canonicalization、canonical validation/Set 和独立 help 段均正确；但未定位 rubric 必需的 `#splitTargets`，因此严格项为 0。 |
| H3 保持行为/不变量 | 1 | 0 | 覆盖五类显式输入、canonical result、all/yes/interactive/consent/load-save/registry 不变、无重复 handler、unknown direct exit/零 effect，以及非 alias 输入的选择/输出/退出不变。 |
| H4 最小验证 | 0 | 0 | 覆盖语法、collision、unknown、all/yes/interactive/help，但缺少隔离 HOME/PATH 下 actual `--target codex --json` 的 fake Codex 精确断言：一次 `--version`、八次 lifecycle、selection 文件不存在。第一组也未明确证明所有五类均零外部调用。 |
| H5 锚点因果 | 0 | 0 | 因果顺序正确，但锚点集合缺少必需的 `#splitTargets`、`#installCodexPlugin` 与 `#die`，不能以抽象 handler/错误描述替代。 |
| **合计** | **1/5** | **0/5** | A = `0 + 0 + 1 + 0 + 0`。 |

## 9. Verdict

- A：Develop `5/5`，Learn visible `5/5`，held-out `1/5`。
- B：Develop `0/5`，Learn visible `0/5`，held-out `0/5`。
- Held-out 门槛要求 `5/5` 且至少领先 baseline 1 分；A 虽领先 1 分，但未达到 `5/5`。
- **Trial 008：FAIL**。
- Verdict 与匿名身份映射无关；评分前后均未请求或推断 mapping。

## 10. Audit replay

- 回放前 scoring SHA-256：`fdd3a71bb248d0ea3c40074446d21def532a3ce6d7ed1f1f2f6f5c5bca436ef3`。
- 从第 6 节按 canonical 格式重新拼接 `PROMPT\n...\n\nRUBRIC\n...\n`，SHA-256 为 `c19befdecb85cebd1de91c335e27e6ee309abbbf4bc52ca851e416338a20cda6`，与候选生成前冻结值一致。
- 四份匿名候选回放 hash 依次为 `807d76bc...3234`、`26415f7a...fcf8`、`3f90b41d...4b40`、`3f90b41d...4b40`，与第 2 节完整值一致。
- 独立重算 Develop：A `5/5`，B `0/5`。
- 独立重算 Learn visible：A `5/5`，B `0/5`。
- 独立重算 held-out：A 为 H1–H5 = `0 + 0 + 1 + 0 + 0 = 1/5`；B `0/5`。
- 门槛回放：A 虽领先 B 1 分，但 `1/5 < 5/5`，因此 verdict 仍为 **FAIL**。
- 回放未读取、请求或推断 A/B 身份映射。
