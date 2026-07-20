# Trial 005 盲评记录

## 1. 评测边界与身份隔离

- 评测对象仅为四份匿名候选：`A-develop.md`、`A-learn.md`、`B-develop.md`、`B-learn.md`。
- 事实核验仅使用冻结源码：Develop workspace `/tmp/analyze-project-eval5.EJ9lgn/skill-develop`、Learn workspace `/tmp/analyze-project-eval5.EJ9lgn/skill-learn`，scope 为 `bin/csl-agent-kit.js`，源码快照为 `05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Stage 1 完成前，未解封 held-out rubric；未读取 manifest、候选 raw、PRD、skill、旧 trials 或 A/B 身份。
- 本记录只保留匿名 A/B 结论，不推断、不记录身份映射。

## 2. 输入完整性

| 匿名候选 | SHA-256 | 状态 |
|---|---|---|
| A Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| A Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B Develop | `c0bdaa6cea0f003de861c84b4ba31b1474e0ae178a39b8f651b67ea868ab1b56` | 95 行，非空 |
| B Learn | `6ff18c8bdc6b81feea9ced563a7d3872b2e2447d82310f86533a931b3c5a1a69` | 133 行，非空 |

两个冻结 workspace 的 `HEAD` 均为 `05a6c689e2344dc925b7dc111f02aa03750114f6`；任务相关源码内容一致。候选报告生成目录之外没有观察到源码漂移。

## 3. 源码事实核验

对 B 两份报告中影响评分的事实逐项回查冻结源码，结果如下：

- `#parseInstallArgs`：参数解析、未知参数拒绝与输出选项归一化的描述有源码支持。
- `#resolveInstallTargets`：default、explicit、all、interactive 的选择路径，以及参数/授权阶段的直接退出语义有源码支持。
- `#installTargets`：按 selected 顺序逐项派发；每个 adapter 有独立 `try/catch`；异常被转换为 `ok: false` result，当前实现继续后续 target。
- `#installCursor`、`#ensureSymlink`：Cursor 安装路径会通过 symlink helper；普通文件冲突会抛错，能够进入 dispatcher 的 catch。
- `#installPi`：missing CLI 是正常返回的 successful `skip`，不会进入 catch。
- `#main`：JSON/human 共用同一 results；最终成功条件为 `results.every(item => item.ok)`，任一 adapter failure 对应退出 `1`；参数与授权阶段的直接退出 `2` 不经过该聚合路径。
- B 报告引用的测试、输出模式、color/verbosity/exit 关系与冻结源码可互相追溯；未发现伪造锚点或与当前快照冲突的陈述。

## 4. Stage 1：Develop 可见质量

| 维度 | A | B | 判定依据 |
|---|---:|---:|---|
| 范围、快照与材料状态 | 0 | 1 | A 为 `NO_OUTPUT`；B 明确当前范围与材料状态，且与冻结源码一致。 |
| 必需流程图 | 0 | 1 | B 恰有一张有效 flowchart，表达入口、选择、执行、输出和退出关系。 |
| 核心流程、状态与失败路径 | 0 | 1 | B 覆盖选择策略、逐 target 派发、adapter failure、skip、输出与退出。 |
| 密度与边界纪律 | 0 | 1 | B 没有退化为文件清单、审计报告或实现建议，信息密度符合 Develop 目标。 |
| 可追溯性 | 0 | 1 | B 的关键事实均能由冻结源码锚点支持。 |
| **合计** | **0/5** | **5/5** |  |

## 5. Stage 1：Learn 可见质量与泄漏检查

| 维度 | A | B | 判定依据 |
|---|---:|---:|---|
| 范围、快照与材料状态 | 0 | 1 | A 为 `NO_OUTPUT`；B 与冻结范围、快照及材料状态一致。 |
| LT1–LT6 学习目标覆盖 | 0 | 1 | B 覆盖选择策略、授权、adapter、结果聚合、输出和退出契约。 |
| 渐进学习阶梯 | 0 | 1 | B 提供 10 步递进阶梯，顺序与依赖关系清楚。 |
| Walkthrough 与源码锚点 | 0 | 1 | B 有 3 个 walkthrough，并将关键因果落到可核验锚点。 |
| 章节闭环 | 0 | 1 | B 严格使用 Recall → Prediction → Transfer → Key，问题可独立作答。 |
| 边界与回归意识 | 0 | 1 | B 覆盖 default/explicit、external refusal、非默认 target transfer、JSON/human、formatter/color/verbosity/exit、NDJSON color×verbosity 与 human 回归。 |
| **合计** | **0/5** | **5/5** |  |

泄漏检查：B Learn 说明了当前 per-target catch 会在失败后继续执行，这是冻结源码的现状知识；它没有出现 `--fail-fast`、没有提出“catch 写入失败 result 后条件 break”，也没有出现本题特定的 Cursor 普通文件冲突与 fake Pi 成对验证。因此与密封题只有必要的源码背景重叠，不构成答案泄漏。Stage 1 通过，可以进入独立下游迁移测试。

## 6. 解封的 held-out fixture

- Fixture ID：`learn-heldout-05a6c689-t05`
- Skill fingerprint：`99161775537493b7102cb43489f1e2a1caa7c28a6bbe9e545d99721271c81ca4`
- Source snapshot：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- 冻结时间：`2026-07-19T15:11:53.094Z`
- Prompt + Rubric 合并 SHA-256：`ab5a00d8543d670d82aee1c1d8c7aa42879a8da0cc61e49ec27c92cb70818dbd`

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望给 `csl-agent-kit install` 增加 `--fail-fast`。传入该参数后，按选择顺序执行 targets 时，第一个 adapter failure 仍要保留为失败 result，但之后尚未执行的 targets 不得再运行、也不得出现在 results 中；未传参数时继续保持当前“单 target 失败隔离、后续 targets 继续”的行为。参数/授权阶段的直接退出与 missing-CLI 的 successful `skip` 语义不得改变，已经完成的副作用不回滚。

请基于报告完成一次 prediction/transfer：先预测当前多 target 中某个 adapter 抛错后 results、后续执行与最终退出码如何形成，再提出满足需求的最小修改方案。说明至少两个需要协作的代码触点、必须保持的行为/不变量、最小验证集合，并用报告中的源码锚点解释“新参数如何只在 per-target failure 后截断执行队列，同时保留失败 result、默认隔离语义与顶层退出契约”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明 `installTargets` 当前按 selected 顺序逐项调用 adapter、每项独立 try/catch 把异常转为 `ok: false` 后继续后续 target，missing CLI 的 `skip` 不抛错仍为成功 result，以及 `main` 由完整 results 的 `every(ok)` 使任一失败最终退出 `1` 时，记 1；缺任一因果环节记 0。
2. 协作触点：只有在回答至少定位两个协作触点，且必含 `parseInstallArgs` 与 `installTargets`，并说明 `failFast` option 如何从解析入口传入 dispatcher、只在 catch 已追加失败 result 后 break 时，记 1；只列名称不说明协作关系记 0。
3. 保持行为/不变量：只有在回答同时保证未传 flag 时继续执行后续 targets、传 flag 时失败 result 保留且已完成副作用不回滚、successful `skip` 不触发截断、参数/target/interactive consent 的 direct exit `2` 不变、selected 顺序和最终退出 `1` 不变时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出隔离 HOME/PATH 的成对多 target CLI 验证，用首个 Cursor 普通文件冲突制造 adapter failure，并用可观察的 fake Pi 调用证明无 flag 时 Pi 仍执行且 results 含两项、flag 开启时 Pi 未调用且 results 只保留 Cursor failure；两者均退出 `1`。另至少验证一次 flag 开启时 preceding missing-CLI `skip` 不阻止后续 target，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#parseInstallArgs`、`#installTargets`、`#installCursor`、`#ensureSymlink`、`#installPi`、`#main` 锚点，并据此解释“解析 option → 顺序派发 → Cursor 冲突抛错 → catch 写入 failure → 条件 break/默认 continue → main 聚合现有 results”的因果链，同时说明 skip 为正常返回而不进入 catch 时，记 1；只有锚点清单或无因果解释记 0。

## 7. 下游原始回答（B Learn，逐字保留）

当前行为预测：

`main` 先由 `parseInstallArgs` 解析参数，再由 `resolveInstallTargets` 得到保持选择顺序的 `selected`，随后交给 `installTargets`。根据报告中的 `bin/csl-agent-kit.js#installTargets`，runner 的契约是“返回 changes 或抛错”，dispatcher 在每个 target 外有独立 `try/catch`：

- adapter 成功：追加成功 result，包含该 target 的 changes。
- adapter 抛错：catch 将该 target 转成 `ok: false`、带 error 的失败 result。
- 当前 catch 不终止遍历，因此后续 targets 仍按选择顺序执行并继续追加 results。
- 最终 results 是所有已选 targets 的有序结果；只要其中有一个失败，`main` 的共享谓词 `results.every(item => item.ok)` 为 false，所以 JSON 顶层 `ok` 为 false，human 也呈现失败，最终 exit 为 `1`。锚点是 `bin/csl-agent-kit.js#installTargets` 与 `bin/csl-agent-kit.js#main`。

最小修改应只增加一个解析布尔值和一个 dispatcher 截断条件：

1. 在 `bin/csl-agent-kit.js#parseInstallArgs` 识别 `--fail-fast`，默认 `false`；在 `bin/csl-agent-kit.js#printInstallHelp` 增加帮助文案。
2. 由 `bin/csl-agent-kit.js#main` 把该值传给 `installTargets`。
3. 在 `bin/csl-agent-kit.js#installTargets` 现有 per-target catch 中，先按原契约追加失败 result，再在 `failFast` 为 true 时 `break`；未传参数则不 break。

等价伪代码是：

```js
for (const target of selected) {
  try {
    results.push(successResult(target, targets[target].run(options)));
  } catch (error) {
    results.push(failureResult(target, error));
    if (options.failFast) break;
  }
}
```

这里不需要新增执行队列、失败类型或回滚机制。关键顺序必须是“先 push failure，再 break”：这样失败 target 仍出现在 results 中，而失败后的 targets 因循环终止既不会运行，也不会产生占位 result。失败前已经完成的 results 和副作用自然保留。

因果链如下：

`parseInstallArgs(--fail-fast)`  
→ `main` 将布尔值随安装选项传入 dispatcher  
→ `resolveInstallTargets` 仍独立完成选择、校验和授权  
→ `installTargets` 仍逐 target 运行  
→ runner 正常返回时继续；runner 抛错时先形成 `ok: false` result  
→ 仅当 `failFast === true` 才在该 catch 后 break  
→ `main` 对截断后的真实 results 继续使用 `every(ok)`  
→ 因保留了失败 result，顶层 `ok` 仍为 false，exit 仍为 `1`。

必须保持的不变量：

- 未传 `--fail-fast` 时，现有单 target 失败隔离不变：失败被记录，后续 targets 继续执行。
- `resolveInstallTargets` 中参数错误、目标校验或 interactive external consent refusal 等前置直接退出不进入 dispatcher；其无 results、无 runner 执行、exit `2` 的契约不变。
- missing CLI 是 adapter 主动返回的 successful `skip`，不是抛错；即使启用 `--fail-fast` 也不得截断，后续 targets 应继续执行。
- 已成功 target 的文件、命令或 selection 等副作用不回滚。
- JSON/human 仍投影同一份 results；color、verbose 与新参数正交。
- 顶层退出规则不新增分支，继续由 `results.every(item.ok)` 决定：存在 adapter failure 时 exit `1`。
- selected 的原有顺序、explicit 去重、default/all/interactive 策略均不变。

最小验证集合应放在报告指出的 `tests/cli-install-output.test.js`，通过 `package.json#scripts.test:cli` 运行：

1. 默认隔离回归：三个有序 targets 中间 adapter 抛错；断言三个均被调用，results 保持“成功、失败、成功”的顺序，顶层 `ok: false`，exit `1`。
2. fail-fast：同一场景加 `--fail-fast`；断言前两个被调用、第三个未调用，results 只含“成功、失败”，失败 error 被保留，exit `1`。
3. 首 target 失败：断言 results 仍含该失败项，所有后续 targets 均未调用。
4. missing-CLI skip：首 target 返回 successful `skip`；加 `--fail-fast` 后仍执行下一 target，skip result 保持 `ok: true`。
5. 前置退出回归：至少覆盖一个参数/目标校验错误和 interactive external refusal，断言仍在 runner 前 exit `2`、无 results；授权拒绝仍不保存 selection。
6. 副作用不回滚：在“成功 → 失败 → 未执行”场景中，断言首 target 已完成的副作用仍存在，第三 target 无副作用。

报告没有提供 `parseInstallArgs`、`main`、`installTargets` 的精确函数签名及 result 构造字段全集，因此参数应作为独立布尔值还是并入现有 options、测试如何注入 fake adapter，需要以实际源码现有调用风格为准；不应据此虚构新的 result schema。

## 8. Held-out 二元评分

A Learn 为 `NO_OUTPUT`，五项均记 0。B Learn 逐项如下：

| 项目 | A | B | B 的严格判定 |
|---|---:|---:|---|
| H1 当前约束 | 0 | 1 | 同时说明 selected 顺序、per-target try/catch、失败转 `ok: false` 后继续、missing-CLI skip 为成功正常返回，以及 `main` 的 `every(ok)` 导致 exit `1`。 |
| H2 协作触点 | 0 | 1 | 明确 `#parseInstallArgs` → `#main` → `#installTargets` 的 option 传递，并要求 catch 先追加 failure 再条件 break。 |
| H3 保持行为/不变量 | 0 | 1 | 覆盖默认继续、失败 result 保留、已完成副作用不回滚、skip 不截断、direct exit `2`、selected 顺序与最终 exit `1`。 |
| H4 最小验证 | 0 | 0 | 只提出了抽象 fake-adapter 场景；没有满足 rubric 指定的隔离 HOME/PATH、首个 Cursor 普通文件冲突、可观察 fake Pi 的成对 CLI 验证。虽然提到 skip 回归，部分正确按二元规则仍为 0。 |
| H5 锚点因果 | 0 | 0 | 使用了 `#parseInstallArgs`、`#installTargets`、`#main`，但缺少必需的 `#installCursor`、`#ensureSymlink`、`#installPi`，也没有给出 Cursor 冲突到 catch、Pi skip 正常返回的完整指定因果链。 |
| **合计** | **0/5** | **3/5** | B = `1 + 1 + 1 + 0 + 0`。 |

## 9. 结论

- A：Develop `0/5`，Learn visible `0/5`，held-out `0/5`。
- B：Develop `5/5`，Learn visible `5/5`，held-out `3/5`。
- Held-out 放行门槛为 `5/5`，且领先至少 1 分。A、B 均未达到 `5/5`。
- **Trial 005：FAIL**。
- 结论与 A/B 身份映射无关；本记录未尝试建立映射。

## 10. Audit replay

- 回放前 scoring SHA-256：`7f2a47b29b50ecbe26544581fbe77245d951c6c2fe3f6fd296ab03c76e7676fc`。
- 从本记录的 `Prompt` 与 `Rubric` 章节按冻结格式重新拼接，SHA-256 为 `ab5a00d8543d670d82aee1c1d8c7aa42879a8da0cc61e49ec27c92cb70818dbd`，与密封值完全一致。
- 四份匿名候选回放 hash 分别为 `3f90b41d...4b40`、`3f90b41d...4b40`、`c0bdaa6c...1b56`、`6ff18c8b...1a69`，与第 2 节保存的完整 hash 一致。
- 独立重算 Develop：A `0/5`，B `5/5`。
- 独立重算 Learn visible：A `0/5`，B `5/5`。
- 独立重算 held-out：A `0/5`；B 为 `1 + 1 + 1 + 0 + 0 = 3/5`。
- 回放结论仍为 **FAIL**：没有匿名候选达到 held-out `5/5` 门槛。
- 回放全程未读取或推断 A/B 身份映射。
