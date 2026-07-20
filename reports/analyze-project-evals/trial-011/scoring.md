# Trial 011 匿名盲评计分

## 1. 评审边界

- 评审对象仅为 `anonymous/A-develop.md`、`anonymous/A-learn.md`、`anonymous/B-develop.md`、`anonymous/B-learn.md`。
- 事实核验仅使用 frozen source workspace `/tmp/analyze-project-eval11.cOPvue/baseline-learn` 中的 scope、依赖关系与 focused tests。
- 未读取 manifest、raw、with-skill、live/frozen skill、PRD、旧 trials 或身份 mapping；本文不请求也不推断匿名身份。
- `NO_OUTPUT` 按规则直接记 0。
- Learn 必须同时支持 front-door admission、option lifecycle 与 effect-context 的通用迁移且不得泄露私题；只有可见五项满分者才进入全新 `fork_turns=none` 下游。

## 2. 输入快照

| 匿名文件 | SHA-256 | 行数 |
|---|---|---:|
| A Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | 1 |
| A Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | 1 |
| B Develop | `1bf109f75bbc2cca781f7b2404fb84fb5da4949ed1d9783c29bd3d1633258bd9` | 88 |
| B Learn | `bbccf4f8b74baeeb957700e83dc075bf90010f5d6769fab13fe727ea8eaae4b5` | 269 |

Frozen source：

- HEAD：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- `bin/csl-agent-kit.js` SHA-256：`f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`
- `git status --short` 与 `git diff -- bin/csl-agent-kit.js` 均为空。
- Focused tests：`node --test tests/cli-install-output.test.js`，23/23 通过。
- Learn sealed fixture：`learn-heldout-ef1ec36e9776-t11`
- Sealed skill fingerprint：`979739ca2243aad8b4cf80e93033fa8a16ceae47950fe259417e3f2ad7795640`
- Frozen at：`2026-07-19T17:14:49.111Z`
- Canonical prompt/rubric SHA-256：`ef1ec36e97766d936329a7415f8cf4c3290d0c5c92609c0e92dd315dbfb6bafd`

## 3. 事实核验

冻结源码与报告关键事实一致：

- `main` 仅把 `install` 送入 parser；其他首 token 统一打印顶层 help 并自然以 0 结束。`parseInstallArgs` 统一接纳 selector/effect/presentation flags，help 直接退出 0，语法错误经 `die` 退出 2。
- `resolveInstallTargets` 的 precedence 为 all → explicit（全量 validation 后稳定去重）→ yes → interactive；只有 interactive 路径加载、确认并原子保存 selection state。
- `installTargets` 在每个 target 内独立 try/catch，异常形成当项失败 result 且继续后续 target；shared results 再由 JSON 或 human renderer 投影，并以 `every(ok)` 决定 0/1。
- `installCursor` 把 HOME 下 Cursor target、`repoRoot` source 与 options 交给 `ensureSymlink`。后者在 dry-run 时先于 mkdir/link mutation 返回；actual 对 absent 创建链接，对普通文件/目录抛错，对正确 symlink 返回 unchanged，对 mismatched/broken symlink 先 unlink 再 symlink，因此存在删除后创建失败的破坏窗口。
- `saveInstallSelection` 的临时文件位于 selection data dir，写 JSON、rename 后 finally 清理；Cursor target 位于 HOME 下的 Cursor 路径，二者 ownership 与失败语义不同。
- Codex/Pi probe 继承调用进程 cwd，operation 显式使用 `repoRoot`；dry-run 不 probe/spawn/unlink；Codex required add 失败使 cleanup 不可达，但 dispatcher 仍能继续后续 target。

## 4. 可见报告二元计分

### A Develop：0/5

内容为 `NO_OUTPUT`，五项均记 0。

### A Learn：0/5

内容为 `NO_OUTPUT`，五项均记 0；不进入下游测试。

### B Develop：5/5

| 项 | 分数 | 依据 |
|---|---:|---|
| 范围、入口与新鲜度 | 1 | scope、HEAD、clean 状态、入口/调用者/交付物与 scope 外职责明确，均可由冻结源码和 focused tests 追溯。 |
| 架构与数据流 | 1 | 单一有效 Mermaid 连接 intake、selection/consent、dispatcher、adapters、filesystem/process 与 output；glossary 补足 target/change/external 语义。 |
| 职责与控制流 | 1 | 模块表准确说明输入输出、ownership、anchors 与 tests；非交互 precedence、交互 state/authorization 和 output predicate 完整。 |
| Effect 与失败语义 | 1 | Cursor/Codex/Pi effect、dry-run、successful skip、required failure、owned cleanup 和 per-target isolation 与源码一致。 |
| 密度与可核验性 | 1 | 报告聚焦 causal architecture 和 invariants，没有文件清单或泛化审计建议；重要结论均带可复核锚点。 |

### B Learn：5/5

| 项 | 分数 | 依据 |
|---|---:|---|
| 范围、新鲜度与学习目标 | 1 | orientation、registry baseline、读者前置和 material status 完整，事实与 frozen HEAD 一致。 |
| Front-door 与 option lifecycle | 1 | W1 精确区分顶层/install parser；带值 option 表呈现 token admission、normalization、semantic validation、precedence、direct exits 与不可达阶段。 |
| Effect context | 1 | matrix 明确 Cursor/filesystem、selection state、Codex/Pi probe/operation 的 HOME/repoRoot/cwd/env、dry-run、failure/cleanup 边界。 |
| 教学闭环 | 1 | Learning Targets → Concept Ladder → W1–W4 → Recall/Prediction/Transfer → Verification Key/Completion Standard 逐项映射且可自检。 |
| 泛化与验证设计 | 1 | T1–T8 覆盖 registry、presentation、dispatcher/process policy、effect context、discovery、alias 与 front door，并坚持隔离 HOME/PATH、真实 handler 和 sentinels。 |

## 5. Sealed-answer overlap 检查

结论：**PASS**。

B Learn 明确当前 Cursor replacement 是 unlink-first 且失败不回滚，也把 selection state 的同目录 temp+rename 作为现有事实记录；这些属于 frozen source 的通用 effect/failure-context 与原子状态写入知识。报告没有提出把该协议迁移为 Cursor 的临时 sibling symlink、没有给出本题的 rename-over-target 修改方案、两处 fs fault injection 矩阵或本题 rubric，因此能支持迁移但未按私题泄露具体答案。

## 6. Sealed fixture

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队要提高 Cursor integration 更新既有错误链接时的失败安全。无 target 时仍创建指向 canonical `sourceReal` 的链接；已正确指向该 source 时仍返回 `unchanged`；target 为普通文件/目录时仍报当前错误且不得改动。只有当 target 是指向其他位置或已经 broken 的 symlink 时改变实现：不得先删除旧链接；应先在同一 parent 中构造一个指向 `sourceReal` 的临时 sibling symlink，再以单次原子 rename 替换正式 target。临时链接创建失败或 rename 失败时，原 symlink 的 link text/指向必须保持原样，临时项必须清理；该 Cursor result 仍为失败，后续已选择 integration 仍继续。成功替换仍返回现有 `{ action: "symlink", target, source: sourceReal }` 语义。dry-run 仍只返回现有 plan，零 mkdir/symlink/rename/unlink。不要新增 CLI option，不要改变 selection、Codex/Pi、results schema、JSON/human renderer 或退出契约。

请基于报告完成一次 prediction/transfer：先预测当前 absent、正确 symlink、普通文件/目录、mismatched symlink、broken symlink 分别走到哪里，并指出当前 replacement 的破坏性 failure window；再解释为什么只依赖 `installTargets` 的 catch，或在旧的 `unlink → symlink` 周围加 `finally` 清理，都不能保留原链接；然后给出最小修改方案、必须保持的不变量和最小验证集合。请用报告中的源码锚点解释“selection → Cursor handler → filesystem primitive → per-target result → formatter/exit”的完整因果链，并把交互 selection state 的临时文件协议与 Cursor target ownership 明确区分。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前行为：只有在回答同时说明 `installCursor` 把 HOME 下 Cursor target、`repoRoot` source 与 options 交给 `ensureSymlink`；`ensureSymlink` 先 realpath source，dry-run 在任何 mkdir/link mutation 前返回 plan；actual 会 mkdir parent；absent target 直接 symlink；普通文件/目录抛错且不动；正确 symlink（含相对 link text 经 parent resolve 后 realpath 等于 sourceReal）返回 unchanged；mismatched 与 broken symlink 都会先 `unlinkSync(target)` 再 `symlinkSync(sourceReal,target)`，因此后一步失败会使旧链接永久消失；异常由 `installTargets` 只转换为当前 failed result、后续 target 继续，无法回滚 filesystem 时，记 1。缺任一关键 case 或把 broken link 当作 absent/普通文件记 0。
2. 最小协作触点：只有在回答把修改限制在 `ensureSymlink` 的 mismatched/broken replacement 分支，保留 `installCursor`/registry/selection/renderer；在同一 parent 生成唯一临时 sibling 路径，先 `fs.symlinkSync(sourceReal, temporary)`，再用 `fs.renameSync(temporary, target)` 覆盖旧 symlink，全程不得先 unlink target，并用 `finally` 的 `fs.rmSync(temporary, { force: true })` 清除未消费临时项；同时说明 `installTargets` catch 只能做 result isolation，旧 unlink 后的 finally 不能重建未知原 link text，而 `saveInstallSelection` 的同目录 temp→rename→finally-cleanup 只可作为原子发布协议参照、不能混用其 state path/JSON payload时，记 1。任何 unlink-first、先改正式 target、把 rollback 交给 dispatcher 或改变普通文件策略记 0。
3. 保持行为/不变量：只有在回答同时保证 absent 创建、正确链接 unchanged、普通文件/目录原错误且不动、mismatched/broken 成功后仍是 canonical absolute sourceReal 与同一 change schema；dry-run 零 filesystem effect；HOME 决定 Cursor target、repoRoot 决定 source，临时项只在 target parent 且无残留；失败时旧 link text/指向不变、Cursor result failed、later target 继续、已完成 effect 不回滚；selection/interactive consent/persistence、Codex/Pi argv/cwd/env、JSON/human output schema/顺序与 exit 0/1 契约均不变时，记 1。缺任一项记 0。
4. 最小验证：只有在回答提出隔离 HOME/PATH 的真实 CLI/focused-test 验证，并覆盖：(a) absent target actual 创建 canonical link且无 temp；(b)正确 absolute 与 relative symlink 均 unchanged；(c)普通文件和目录均字节/目录内容不变、Cursor failed；(d)mismatched 与 broken symlink 成功替换为 sourceReal、无 temp；(e)通过可控 fs fault injection 分别令 temporary `symlinkSync` 与 replacement `renameSync` 抛错，断言原始 link text 精确不变、无 temp、Cursor failed，并选择 later fake Codex 或 Pi 证明仍继续且 results 保序/exit 1；(f)dry-run 对 absent/mismatched case 均零 mkdir/link/rename/unlink而 plan 不变；(g)至少一个 JSON 与一个 human 回归确认 schema/formatter 不变，记 1。只做 happy path、没有两处 failure injection 或只检查最终 exists 记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#main`、`#resolveInstallTargets`、`#installTargets`、`#installCursor`、`#ensureSymlink`、`#isSymlink`、`#saveInstallSelection`、`#printResults` 锚点，并据此解释“合法 install/selection → registry Cursor handler → ensureSymlink 的 dry-run/type/current-target gates → 新 temp+rename publish → throw/success 被 dispatcher封装 → JSON或printResults/整体exit”的完整链；且明确 state persistence 的临时文件位于 selection data dir，而 Cursor 临时 symlink 位于 Cursor target parent，二者 ownership/内容/失败处理不同，记 1。只有锚点清单或混淆两类临时文件记 0。

## 7. 下游原始回答

## 当前路径预测

源码锚点链路是：

`parseInstallArgs / resolveInstallTargets` → registry 中 `cursor` → `installCursor` → `ensureSymlink` → `installTargets` 的逐项结果 → `main` 的 JSON/human formatter → `results.every(item.ok)` 决定退出码。

在 Cursor 已被选中的前提下：

| target 状态 | 当前预测 | 结果/后续 |
| --- | --- | --- |
| 不存在 | `installCursor` 计算 `sourceReal=realpath(repoRoot)`，`ensureSymlink` 创建 parent 后直接建立指向 `sourceReal` 的链接 | 成功，返回 `{action:"symlink", target, source:sourceReal}` |
| 已正确指向 `sourceReal` | `ensureSymlink` 判定无需替换 | 成功，返回现有 `unchanged` change；零修改 |
| 普通文件 | 非 symlink conflict，抛出当前错误，不删除文件 | `installTargets` 转为该 target 的 `{ok:false,error}`，继续后续 target |
| 普通目录 | 与普通文件相同，不递归、不删除目录 | 同上 |
| 指向其他位置的 symlink | 判定需要替换，当前先 `unlink(target)`，再 `symlink(sourceReal,target)` | 成功时仍是 `symlink` change；第二步失败时旧链接已经永久丢失 |
| broken symlink | 最合理预测是仍由 symlink 分支识别为待替换链接，走 `unlink → symlink` | 与 mismatched 相同；但报告未展开 `ensureSymlink` 的 broken-link 探测实现。若实际使用 `existsSync` 而非 `lstat` 探测，可能变成直接创建并因 `EEXIST` 失败；这一源码细节不应假装已确认 |

破坏性 failure window 是 `unlink(target)` 成功之后、`symlinkSync(sourceReal,target)` 成功之前。进程异常、权限变化、磁盘错误或 symlink 创建错误都会使正式 target 从“原有链接”退化为“不存在”，且当前没有回滚。

## 为什么外围 catch/finally 不够

`installTargets` 的 catch 位于 handler 外层。它只能：

- 把异常投影成当前 Cursor 的失败 result；
- 保持 selected 顺序；
- 继续 Codex/Pi 等后续 integration。

它无法撤销已经成功的 `unlink`，也没有原链接的精确 link text，因此不能恢复文件系统状态。

在旧的 `unlink → symlink` 外围加 `finally` 也不能提供原子性。`finally` 执行时旧链接已经消失；若尝试重建旧链接，仍会存在缺失窗口，恢复本身也可能失败，而且必须事先保留原始 link text。若 `finally` 只是清理新链接，则只会让 target 更确定地保持缺失。正确边界必须是：正式 target 在最终原子替换成功前完全不动。

## 最小修改方案

只修改 `ensureSymlink` 的“已有且需替换的 symlink”分支；`installCursor`、registry、selection、dispatcher、result schema、formatter 和 CLI 都无需改变。

1. 保留当前 source canonicalization、absent、correct symlink、普通文件/目录及 dry-run 分支。
2. mismatched/broken symlink live replacement 时：
   - 在 `dirname(target)` 下生成唯一临时 sibling 名；
   - 用当前相同的 symlink 参数创建 `temp → sourceReal`；
   - 仅在创建成功后调用一次 `rename(temp,target)`；
   - `finally` 只清理由本次调用成功创建、但尚未 rename 的 temp；
   - 绝不调用 `unlink(target)`。
3. `rename` 成功后继续返回现有 `{action:"symlink",target,source:sourceReal}`。

同 parent 保证 temp 与 target 位于同一文件系统，满足原子 rename 的必要条件。报告没有给出目标平台对“rename 覆盖现有 symlink”的精确兼容契约，也没有给出当前 symlink type 参数；实现时应复用现有 symlink 调用参数，并以目标 Node/平台测试固定该行为。

不应为此抽取通用事务框架；这是 `ensureSymlink` 内一个局部分支。

## 必须保持的不变量

- `source` 始终是 `realpath(repoRoot)` 得到的 canonical `sourceReal`。
- absent 仍直接创建；正确链接仍 `unchanged`。
- 普通文件/目录仍报完全相同类别的错误，内容和目录树不变。
- dry-run 不调用 `mkdir`、`symlink`、`rename` 或 `unlink`，只产生现有 plan。
- 正式 target 在 temp 创建失败或 rename 失败时保留原始 link text；不能用“解析后等价但文本不同”的重建冒充保留。
- 失败后不留下本次创建的 temp sibling。
- Cursor 失败仍只令该 result 为 `ok:false`；后续已选择 integration 继续。
- 成功 change、results schema、顺序、JSON/human 输出和 `every(ok)` 退出契约不变。
- 不新增 option，不改变 all/explicit/yes/interactive precedence，也不改变 Codex/Pi。
- replacement 路径不得对正式 target 调用 `unlink`。
- 并发进程在检查后把 symlink 换成普通文件的竞态，报告没有现成契约；普通 `rename` 也不能表达“仅当 destination 仍是原 symlink 时替换”，因此不能声称该竞态已被报告覆盖。

## selection state 与 Cursor ownership 的区别

两者都可能使用“同目录 temp + rename”，但领域和失败契约完全不同：

- `saveInstallSelection` 写的是交互选择状态，位置为 `CSL_AGENT_KIT_HOME` 或 `HOME/.csl-agent-kit`。它只在交互授权后发生；dry-run 仍可能保存。失败只产生 warning，安装继续。temp 是该状态写入事务自己创建和拥有的普通临时项。
- Cursor target 是 `HOME/.cursor/plugins/local/csl`，属于安装 effect。正式 target 可能是用户的普通文件/目录，因此 handler 只拥有“可创建的 absent 路径”或“已确认是 symlink 的替换权”；绝不能把正式 target 当临时项清理。这里的 temp sibling 仅由本次 replacement 事务拥有，Cursor effect 失败会形成失败 result。
- 执行 selector 不读写交互 selection state；selection state 的原子保存协议并不会自动让 Cursor replacement 安全，只能借鉴其 staging 形状。

## 最小验证集合

1. 基线五态：
   - absent：创建到 `sourceReal`，精确成功 change；
   - correct：`unchanged`，零修改；
   - 普通文件、普通目录：当前错误不变，内容/结构不变；
   - mismatched、broken：成功原子替换，正式链接解析到 `sourceReal`，无 temp 遗留。

2. 两个关键失败注入，各对 mismatched 和 broken 至少覆盖一次：
   - temp symlink 创建失败；
   - temp 创建成功、rename 失败。

   每次都断言：
   - `readlink(target)` 与执行前的原始 link text 完全相同；
   - 正式 target 从未被 `unlink`；
   - 无本次 temp 遗留；
   - Cursor result 为失败；
   - 后续已选择 integration 仍执行并出现在下一项 result；
   - 整体退出状态为 1。

3. dry-run：
   - 至少覆盖 parent 不存在、mismatched 和 broken；
   - 断言零 `mkdir/symlink/rename/unlink`；
   - plan/change schema 与当前输出完全相同。

4. 投影回归：
   - 成功 replacement 的 JSON 精确保留 `{action:"symlink",target,source:sourceReal}`；
   - 一次 human 或 JSON 失败场景确认 formatter 不改语义；
   - 混合 selected targets 确认结果顺序和 `every(ok)` 退出谓词不变。

报告只指出现有测试集中在 `tests/cli-install-output.test.js`，没有说明 `ensureSymlink` 是否可直接导入或当前测试如何注入 `fs` 失败，因此具体 mock/preload 机制无法仅凭报告确定。

## 8. Held-out 二元计分：0/5

| 项 | 分数 | 严格判定 |
|---|---:|---|
| 1. 当前行为 | 0 | 多数 case 与 failure window 判断正确，但把 `sourceReal` 的计算归给 `installCursor`，没有说明 `installCursor` 传入 HOME target/repoRoot source/options，也没有确认相对正确 symlink 的 parent-resolve/realpath 判定；对 broken symlink 还保留了可能走 EEXIST 的错误分支，未满足全量 conjunctive 条件。 |
| 2. 最小协作触点 | 0 | 方案方向正确且限制在 `ensureSymlink`，但没有明确给出 `fs.symlinkSync`、`fs.renameSync`、`fs.rmSync(temporary,{force:true})` 的完整协议，也没有明确 selection state temp 的 JSON payload 不能复用，故不得给部分分。 |
| 3. 保持行为/不变量 | 0 | 覆盖了文件类型、dry-run、link text、result/formatter 多数契约，但未同时明确“已完成 effect 不回滚”、interactive consent/persistence，以及 Codex/Pi argv/cwd/env 全部不变。 |
| 4. 最小验证 | 0 | 有两处 fault injection 和主要状态矩阵，但没有分别覆盖正确 absolute/relative symlink，没有指定 later fake Codex/Pi，并只要求 human 或 JSON 失败投影而非至少一个 JSON 与一个 human 回归。 |
| 5. 锚点因果 | 0 | 因果链大体正确并区分了两类 ownership，但没有引用必需的 `#isSymlink` 与 `#printResults` 锚点，也未按要求完整列出八个 anchors。 |

## 9. 汇总与裁决

| 匿名候选 | Develop | Learn 可见 | Learn held-out | 总体裁决 |
|---|---:|---:|---:|---|
| A | 0/5 | 0/5 | 未运行 | FAIL |
| B | 5/5 | 5/5 | 0/5 | FAIL |

Trial 011 裁决：**FAIL**。B 的可见报告质量达标，但 held-out prediction/transfer 未满分；A 为 `NO_OUTPUT`。

## 10. Audit replay

- 首次完整写入 scoring SHA-256：`13d5cf68b885a71d5695cded831ef5ffe75f1326e88d39e9569e26d97e0d05bf`。
- 重新计算四份匿名输入哈希，均与“输入快照”一致。
- 从本文 `### Prompt` 与 `### Rubric` 按 canonical `PROMPT\n…\n\nRUBRIC\n…\n` 格式重建 fixture，SHA-256 为 `ef1ec36e97766d936329a7415f8cf4c3290d0c5c92609c0e92dd315dbfb6bafd`，与 sealed canonical hash 一致。
- 独立重算可见表格：A Develop `0`、A Learn `0`、B Develop `5`、B Learn `5`。
- 独立重算 held-out 表格：`0`。
- 分数与汇总表一致；下游回答在解封 rubric 前已固定，本文逐字保留。
