# Trial 012 匿名盲评计分

## 1. 评审边界

- 评审对象仅为 `anonymous/A-develop.md`、`anonymous/A-learn.md`、`anonymous/B-develop.md`、`anonymous/B-learn.md`。
- 事实核验仅使用 frozen source workspace `/tmp/analyze-project-eval12.QDWuaP/baseline-learn` 中的 scope、依赖关系与 focused tests。
- 未读取 manifest、raw、with-skill、live/frozen skill、PRD、旧 trials 或身份 mapping；本文不请求也不推断匿名身份。
- `NO_OUTPUT` 按规则直接记 0。
- Learn 必须支持 front door、option lifecycle、effect context 与 filesystem state/publication 的通用迁移且不得泄露私题；只有可见五项满分者才进入全新 `fork_turns=none` 下游。

## 2. 输入快照

| 匿名文件 | SHA-256 | 行数 |
|---|---|---:|
| A Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | 1 |
| A Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | 1 |
| B Develop | `c392fab68b393de0d3fb4049f6e771fc4d4828e2fc46a139ff2c546ee3b7a07a` | 87 |
| B Learn | `b76bb82d21bf40a1fcbf39d3a653bf08febee8544b45e026710df3eb6f19476d` | 308 |

Frozen source：

- HEAD：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- `bin/csl-agent-kit.js` SHA-256：`f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`
- `git status --short` 与 `git diff -- bin/csl-agent-kit.js` 均为空。
- Focused tests：`node --test tests/cli-install-output.test.js`，23/23 通过。
- Learn sealed fixture：`learn-heldout-8ac09f934c18-t12`
- Sealed skill fingerprint：`d9c37535229f96efeab82527875d6b9b08eddc020624c5399108506f160ec42e`
- Frozen at：`2026-07-19T17:38:32.390Z`
- Canonical prompt/rubric SHA-256：`8ac09f934c18f296a8247b00480265ce318e6dfd58bcf6a078e2fd63661cd2ba`

## 3. 事实核验

冻结源码与报告关键事实一致：

- `targets` 顺序为 cursor、codex-plugin、pi；default 仅 codex-plugin，external 为 codex-plugin 与 pi。
- `main` 只把 `install` 送入 parser；`parseInstallArgs` 当前不认识 `--accept-external`，未知 install option 经 `die` 输出 stderr/status 2。
- `resolveInstallTargets` 按 all → explicit → yes → interactive early return。all/explicit/yes 当前绕过 TTY、state、prompt 与 external confirmation；yes 直接选择 external 的默认 codex-plugin。
- 只有 bare interactive 路径加载 state、显示 checklist，并在 selected 含 external 时确认；拒绝在 save/effects 前退出 2，接受后以同目录 temp→rename 原子保存再 dispatch。
- explicit target 经 split/trim/filter 后，在 resolver 内先全量 validation 再稳定去重；unknown target 在 state/effect 前退出 2。
- `installTargets` 对每项 handler 独立 try/catch，shared results 后才做 machine/human projection；Cursor/Codex/Pi 的 filesystem/process roots、dry-run 与失败边界和报告一致。
- `ensureSymlink` 的 type/canonical-identity matrix、unlink→symlink publication window，以及 `saveInstallSelection` 的独立 JSON temp→rename protocol均与源码一致。

## 4. 可见报告二元计分

### A Develop：0/5

内容为 `NO_OUTPUT`，五项均记 0。

### A Learn：0/5

内容为 `NO_OUTPUT`，五项均记 0；不进入下游测试。

### B Develop：5/5

| 项 | 分数 | 依据 |
|---|---:|---|
| 范围、入口与新鲜度 | 1 | scope、HEAD、clean 状态、调用者、输入/产出与 scope 外职责明确，可由 frozen source/focused tests 核验。 |
| 架构与数据流 | 1 | 单一有效 Mermaid 连接 intake、selection/consent、dispatcher、adapters、filesystem/process 与 output；glossary 区分 target/change/external。 |
| 职责与控制流 | 1 | 模块表与三条 core flows 准确覆盖 parser、selector precedence、interactive state/authorization、handler dispatch 与 projection。 |
| Effect、state 与失败语义 | 1 | dry-run、successful skip、required failure、owned cleanup、atomic selection save、per-target isolation 与 cwd/root 边界正确。 |
| 密度与可核验性 | 1 | 内容围绕 causal map/invariants，没有文件清单或审计建议；关键结论均有源码/测试锚点。 |

### B Learn：5/5

| 项 | 分数 | 依据 |
|---|---:|---|
| 范围、新鲜度与学习目标 | 1 | orientation、ordered registry、读者前置、material status 与 frozen HEAD 一致。 |
| Front door 与 option lifecycle | 1 | command/parser matrix、带值 option 表和 gate ledger明确 token admission、normalization、semantic validation、precedence、direct exits 与不可达阶段。 |
| Effect context | 1 | matrix 区分 Cursor/state filesystem、Codex/Pi probe/operation 的 HOME/repoRoot/cwd/env、dry-run、failure/cleanup。 |
| Filesystem state/publication | 1 | 六态 Cursor matrix明确 type、canonical identity、link text、mutation/result 与 unlink window，并严格区分 selection JSON staged publication。 |
| 教学与迁移闭环 | 1 | LT1–LT8、Concept Ladder、W1–W5、Recall/Prediction/Transfer、K1–K17 与 completion standard互相映射，验证坚持隔离环境、真实 handlers 与 sentinels。 |

## 5. Sealed-answer overlap 检查

结论：**PASS**。

B Learn 说明 `external` 当前只控制 interactive consent，all/explicit/yes 会绕过 state/prompt/consent；这是 frozen source 的通用 selection/authorization 事实。报告没有提出 `--accept-external`、flag-alone admission、selected external-id 错误协议、新 gate 的插入点或本题验证矩阵，因此具备迁移材料但未泄露 sealed answer。

## 6. Sealed fixture

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队要让非交互安装外部 integration 必须显式授权。新增 install-only boolean option `--accept-external`，默认 false，并在详细 install help 中说明。`--all`、任一显式 target 语法或 `--yes/-y` 构成 execution selector；若提供 `--accept-external` 却没有任何 execution selector，必须在 resolver/state/prompt/effect 前向 stderr 精确输出 `Error: --accept-external requires --target, --all, or --yes.` 并退出 `2`。有 execution selector 时先按现有 precedence/validation/dedup 得到 selected；若 selected 含 `external:true` target 而 flag 为 false，必须在 dispatcher 前向 stderr 输出 `Error: External integrations require --accept-external: <selected 中 external ids，保持 selected 顺序并用逗号空格连接>.` 并退出 `2`，且 selection state、prompt、filesystem、外部进程、results/formatter 均不可达。只选 `cursor` 不需要该 flag；带 flag 的合法 all/explicit/yes 照常执行。未知 target 仍先报现有 unknown-target error。没有 execution selector 且没有 flag 的 bare `install` 仍走现有 interactive checklist、external confirmation 与 selection persistence；不得用新 flag 绕过或替代 interactive consent。常规 parser error、dry-run、handlers、results/renderer 和退出契约不变。

请基于报告完成一次 prediction/transfer：先预测当前 `--accept-external`、all/explicit/yes 选择 external target、只选 cursor 与 bare interactive install 分别经过哪些 gates，并解释为什么把检查放进 handler/dispatcher 或复用 interactive confirm 都不满足要求；然后给出最小修改方案、必须保持的不变量和最小验证集合。请用报告中的源码锚点解释“install parser → execution-selector admission → resolver precedence/validation → external authorization → dispatcher/effects”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前行为：只有在回答同时说明当前 parser 没有 `--accept-external`，因此该 token 现在作为 unknown install option 经 `die` 输出 stderr/status 2 且 resolver/state/effect 不可达；registry 中 `cursor` 为 external false/default false，`codex-plugin` 为 external true/default true，`pi` 为 external true/default false；`resolveInstallTargets` 对 all、explicit、yes 依次 early return，三者当前均绕过 TTY/state/prompt/external confirmation，其中 yes 会直接选择 external 的 `codex-plugin`，all/explicit 也可无确认执行 external；只有 bare interactive 路径会按 selected 的 external metadata 显示 confirm，拒绝在 save/effect 前 status 2，接受后保存再执行时，记 1。缺任一分支记 0。
2. 最小协作触点：只有在回答同时把 `acceptExternal:false`、`--accept-external` parser branch 与 help 文案加入 `parseInstallArgs`/`printInstallHelp`；在 `main` 的 parser 后先判定 execution selector（all、非空 targets、yes），flag-alone 经 `die` 在 resolver 前退出；随后仍调用现有 `resolveInstallTargets`，再用 registry metadata 从 selected 按顺序筛 external ids，并在 non-interactive selected 含 external 且 flag false 时于 `installTargets` 前 `die` 精确错误；保留 unknown target 在 resolver validation 中先于 authorization 报错，且不修改 interactive confirmation、state helpers、handlers/dispatcher时，记 1。把授权放进单个 handler、dispatcher 循环、parser token 阶段或用 prompt 处理非交互路径均记 0。
3. 保持行为/不变量：只有在回答同时保证 flag-alone 精确 stderr/status 2 且零后续；cursor-only 无 flag 仍可执行；all/explicit/yes 选择 external 且无 flag 时 stdout 空、精确 external-id stderr/status 2、零 selection read/write、prompt、filesystem/process/results；unknown target 仍使用现有 error/status 2 并先于 external error；带 flag 的 all/explicit/yes 保持 all→explicit→yes precedence、validation-before-stable-dedup、selected/result 顺序、dry-run 与 effects；bare interactive 不识别 flag 为 consent，仍按 external metadata confirm、拒绝零 save/effect、接受后 atomic persistence；Codex/Pi/Cursor handlers、machine/human schema 与 status 0/1 契约不变时，记 1。缺任一项记 0。
4. 最小验证：只有在回答提出隔离 HOME/PATH、selection/prompt/Cursor/fake Codex/Pi sentinels 的真实 CLI/focused tests，并覆盖：(a) `install --accept-external` 精确 requires-selector stderr/status 2且全部 sentinel 不变；(b) 无 flag 的 `--target codex-plugin`、位置 `pi`、显式 mixed `cursor,pi`、`--yes`、`--all` 分别精确列出 selected 中 external ids、stdout 空/status 2且零后续；(c) `--target cursor` 无 flag actual 成功且只发生 Cursor effect；(d)上述 external selector 至少 all、explicit、yes 各一例带 flag后按既有顺序执行，dry-run 零真实 effect，live fake CLI 精确调用；(e) unknown explicit target 无 flag仍先报 unknown-target而非 consent error，`--all unknown` 仍因 all precedence选择registry全集并报 `codex-plugin, pi`；(f) bare interactive 的 external拒绝/接受分别保持零保存/原子保存及 effect边界；(g) install help出现新 option、其他 unknown install option仍是原 parser error时，记 1。缺任一矩阵或只测成功侧记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#main`、`#parseInstallArgs`、`#printInstallHelp`、`#targets`、`#resolveInstallTargets`、`#validateTargets`、`#installTargets`、`#die` 锚点，并据此解释“当前 token 在 parser 失败/当前 noninteractive selector绕过consent → 新 parser接纳flag → flag-alone admission早退 → resolver保持precedence与unknown validation → selected external authorization在dispatcher前早退或放行 → 既有effects/results”的完整链；且明确 interactive external confirm/save仍封装在 resolver 内而新 gate只约束 execution-selector路径时，记 1。只有锚点清单或混淆 parser、resolver、authorization 与 handler边界记 0。

## 7. 下游原始回答

## 预测

当前源码尚不认识 `--accept-external`：

- `install --accept-external` 会在 `parseInstallArgs` 被当作未知 install option，stderr 报现有 unknown-option error、退出 `2`；resolver、selection state、prompt、effects、results 均不可达。报告没有给出现有错误文本，不能确认其精确字符串。
- 顶层直接传 `--accept-external` 不会进入 install parser；按当前 `main` 的非 `install` fallback，只打印 generic help 并自然退出 `0`。新增选项应保持 install-only，不应顺便改变该顶层契约。

当前 execution selector 都绕过交互 consent：

| 调用 | 当前路径 |
| --- | --- |
| `install --all` | `resolveInstallTargets` 第一优先级，按 registry 顺序得到 `cursor,codex-plugin,pi`；不读写 selection state、不 prompt、不确认 external，直接 dispatch |
| 显式 targets | `splitTargets` → 全量 `validateTargets` → `Set` 稳定去重，保持首次出现顺序；不走 state/prompt/consent，直接 dispatch |
| `install --yes` | 在 all/explicit 之后取 `default:true`，当前仅 `codex-plugin`；不走 environment/state/prompt/consent，直接 dispatch |
| 只选 `cursor` | explicit validation/dedup 后直接 dispatch；其 `external:false`，新规则下也不需要 flag |
| bare `install` | 进入 interactive-only environment/dependency gate → load state → checklist → 若 selected 含 external 则 confirm → save selection → dispatch；拒绝 external confirmation 时退出 `2`，save/effects/results 不可达 |

新增行为应为：

- `install --accept-external` 且无 execution selector：精确 stderr  
  `Error: --accept-external requires --target, --all, or --yes.`  
  退出 `2`，并在 `resolveInstallTargets` 前停止。
- `--all` 无 flag：selected 为 `cursor,codex-plugin,pi`，随后精确报  
  `Error: External integrations require --accept-external: codex-plugin, pi.`  
  退出 `2`。
- 显式 `pi,cursor,codex-plugin,pi` 无 flag：validation、稳定去重后 selected 为 `pi,cursor,codex-plugin`，报错列表为 `pi, codex-plugin`。
- `--yes` 无 flag：selected 为默认的 `codex-plugin`，报错列表只有 `codex-plugin`。
- 上述三类带 flag 时正常 dispatch；只选 `cursor` 无 flag 也正常 dispatch。
- 显式列表含 unknown 时，`validateTargets` 的现有 unknown-target error 必须先发生，external authorization 不可抢先。
- bare interactive 不受新 gate 约束，仍用原 external confirm；新 flag 不能代替或绕过该 consent。

## 最小修改方案

因果链应固定为：

```text
main install admission
  → parseInstallArgs
  → execution-selector admission
  → resolveInstallTargets
      all > explicit > yes > interactive
      explicit: split/trim/filter → validate → stable dedup
  → external authorization
  → installTargets dispatcher
  → handlers/effects
  → shared results
  → JSON/human renderer
```

最小改动集中在 `bin/csl-agent-kit.js`：

1. `parseInstallArgs`
   - 增加 `acceptExternal:false`。
   - 识别 `--accept-external` 并置 `true`。
   - 不让它隐含 `--yes`、`--all` 或任何 target。

2. `printInstallHelp`
   - 在详细 install help 加入该 boolean option 及“非交互 external target 必须显式授权”的说明。
   - 不改 generic top-level help，除非另有要求。

3. parser 返回后、调用 `resolveInstallTargets` 前
   - 计算 execution selector：
     `options.all || options.targets.length > 0 || options.yes`。
   - 若 flag 为 true 而 selector 为 false，调用现有 direct-error 路径输出指定文本并退出 `2`。

4. `resolveInstallTargets` 返回 selected 后、调用 `installTargets` 前
   - 仅对 execution-selector 路径检查：
     `selected.filter(id => targets[id].external)`。
   - 保持 selected 顺序，不重新按 registry 排序、不用 `Set` 重排、不硬编码 external IDs。
   - 非空且 flag 为 false时，输出指定文本并退出 `2`。
   - bare interactive 路径跳过此新检查，因为其授权已由原 confirm 完成。

这里不应把检查放进 handler 或 dispatcher：

- handler 已进入 effect 层；`--all` 中 `cursor` 排在 external target 前，晚检查可能已经修改 filesystem。
- 单个 handler 看不到完整 selected，无法一次按 selected 顺序汇总全部 external IDs。
- handler throw 会被 `installTargets` 转成 target failure result，继续后续 target并最终走 formatter/退出 `1`；要求却是 dispatcher 前直接 stderr/退出 `2`，且 results 不可达。
- 即使在 dispatcher 循环开头检查，也违反“dispatcher 前”的边界，并把 CLI admission policy 混入 result-isolation 层。

也不能复用 interactive confirm：

- execution selectors 当前按 `resolveInstallTargets` 的 early return 明确绕过 prompt/state。
- 非交互授权要求来自 argv 的显式、可审计 boolean，而不是运行时 prompt。
- `--yes`/CI/non-TTY 下 prompt 会改变既有 admission 语义。
- bare interactive 已有 checklist、external confirmation、selection persistence；用新 flag 替换它会破坏既有 consent。

## 必须保持的不变量

- registry 顺序与元数据不变：`cursor`、`codex-plugin`、`pi`；external 为后两者。
- selector precedence 保持 `all > explicit > yes > interactive`。
- explicit 保持 split/trim/empty-filter → validate whole array → stable dedup。
- unknown-target error 先于 external authorization。
- parser error/help、stream 与退出契约不变。
- execution selector 不读写 selection state、不 prompt。
- bare install 继续读取 state、显示 checklist、确认 external、保存 selection；拒绝时不保存、不执行。
- authorization failure不进入 filesystem、process、dispatcher、results 或 formatter；即使同时给 `--json`，也只能向 stderr 输出指定纯文本并退出 `2`。
- `--dry-run` 不豁免授权；它只改变已获授权后的 handler effects。
- 获授权后 handlers、successful skip、per-target failure isolation、result 顺序、JSON/human renderer及 `every(ok)` 退出规则不变。
- `--accept-external` 只授权，不负责选择 target。

报告明确指出 `--target=` 当前会得到空 `targets` 并退回 yes/interactive。题目中的“任一显式 target 语法”是否包含这个空值退化形式存在歧义。为同时保持现有 parser/resolver 契约，最小解释是：只有归一化后至少产生一个 ID 的显式 target 才构成 execution selector；因此 `--accept-external --target=` 应报新的 requires-selector error，而不带 flag 的 `--target=` 仍保持原行为。若需求方坚持“出现 option 即算 selector”，还必须另行定义空 selected 的行为，否则会与“execution selector 不可达 state/prompt”冲突。

## 最小验证集合

建议在报告指出的 `tests/cli-install-output.test.js` CLI helper 附近增加成对测试：

1. `install --help`
   - 包含 `--accept-external` 说明；stdout、退出 `0`。

2. flag admission
   - `install --accept-external`：精确 stderr、退出 `2`、stdout 空。
   - state、prompt、filesystem、process、results/formatter sentinels 全为零。

3. external selection
   - `--all` 无 flag：精确列出 `codex-plugin, pi`，退出 `2`，所有 effect/result sentinels 为零。
   - 显式 mixed order + duplicate 无 flag：验证报错只含 external IDs，并保持 selected 顺序。
   - `--yes` 无 flag：只列 `codex-plugin`。
   - 三者带 flag：正常执行；至少用 dry-run 验证 selected/result 顺序，另用 fake executable 验证既有 handler 路径仍可达。

4. precedence
   - 显式列表混入 unknown 与 external：仍先得到现有 unknown-target error，authorization/effects 全零。

5. non-external
   - 只选 `cursor` 且无 flag：正常执行；dry-run 验证 planned link，actual 隔离 HOME 验证 filesystem path。

6. interactive regression
   - bare install 选择 external：拒绝仍不 save/effect；接受仍 save 后执行。
   - `--accept-external` 单独存在不能触发 checklist，也不能作为 interactive consent。

7. 契约回归
   - external + `--dry-run --json` 无 flag：仍是精确 stderr/`2`，无 JSON。
   - 同一调用加 flag：正常得到原 JSON results。
   - `--target=` 的空值边界按上述解释增加一条锁定测试。

## 8. Held-out 二元计分：2/5

| 项 | 分数 | 严格判定 |
|---|---:|---|
| 1. 当前行为 | 1 | 正确说明新 flag 当前是 parser unknown option；准确给出 registry external/default 关系、all/explicit/yes early return 与绕过 consent，以及 bare interactive confirm→拒绝早退/接受保存后执行。 |
| 2. 最小协作触点 | 1 | 把 parser 默认/branch/help、flag-alone admission、现有 resolver、selected external gate 和 dispatcher 前早退放在正确边界；保留 unknown validation precedence、interactive consent/state 与 handlers。 |
| 3. 保持行为/不变量 | 0 | 多数契约正确，但没有明确保证 bare interactive 接受后仍使用 atomic persistence；对 all/explicit/yes 无 flag 的 stdout 空也未作为完整矩阵逐项固定，未满足 conjunctive rubric。 |
| 4. 最小验证 | 0 | 缺少无 flag 的独立 `--target codex-plugin` 与位置 `pi` 两项；未覆盖 `--all unknown` 的 all-precedence/external-error；没有明确保留其他 unknown install option parser-error 回归，且带 flag 的 all/explicit/yes live/dry-run矩阵不完整。 |
| 5. 锚点因果 | 0 | 因果链正确，但没有按要求引用完整八个源码锚点，尤其未明确引用 `#die`；函数名叙述不能替代严格 anchor 集。 |

## 9. 汇总与裁决

| 匿名候选 | Develop | Learn 可见 | Learn held-out | 总体裁决 |
|---|---:|---:|---:|---|
| A | 0/5 | 0/5 | 未运行 | FAIL |
| B | 5/5 | 5/5 | 2/5 | FAIL |

Trial 012 裁决：**FAIL**。B 的可见报告质量达标，但 held-out prediction/transfer 未满分；A 为 `NO_OUTPUT`。

## 10. Audit replay

- 首次完整写入 scoring SHA-256：`662b73bdaf9cb439fd463d1632e62943d9eb92d25cc5964561be0c6bde0a9084`。
- 重新计算四份匿名输入哈希，均与“输入快照”一致。
- 从本文 `### Prompt` 与 `### Rubric` 按 canonical `PROMPT\n…\n\nRUBRIC\n…\n` 格式重建 fixture，SHA-256 为 `8ac09f934c18f296a8247b00480265ce318e6dfd58bcf6a078e2fd63661cd2ba`，与 sealed canonical hash 一致。
- 独立重算可见表格：A Develop `0`、A Learn `0`、B Develop `5`、B Learn `5`。
- 独立重算 held-out 表格：`2`。
- 分数与汇总表一致；下游回答在解封 rubric 前已固定，本文逐字保留。
