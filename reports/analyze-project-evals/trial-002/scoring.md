# Analyze Project v2 Trial 002 匿名评分记录

## 1. 评测边界

- 评测角色：独立 Verifier / Blind Scorer。
- 冻结源码：`05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Skill fingerprint：`ae9b34e368999d0ff661dff472d71d2e4e9e9b2548476279bd0f14b685458af3`。
- 匿名身份映射：未读取、未推断、未记录。
- Verifier 事实来源：四份匿名候选与 `/tmp/analyze-project-eval2.N3c7rB/skill-develop` 冻结源码。
- 二元评分规则：每项只能为 `0` 或 `1`；部分满足记 `0`。

## 2. 匿名候选哈希

| Candidate | SHA-256 | 状态 |
| --- | --- | --- |
| A-develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B-develop | `65de62175026b44747f25ac63fb20924478ee58d2c1e654cec83e3b2f759b582` | 有报告 |
| A-learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B-learn | `59c2301b03a0727e477991fb3534d1163ab96c358a37c8c07a14e931125b3cc3` | 有报告 |

## 3. Verifier：事实与锚点核验

### 3.1 Candidate A

`A-develop` 与 `A-learn` 均为标准 `NO_OUTPUT`，没有可核验报告；按协议对应五项全部为 `0`，Learn 不进入 downstream。

### 3.2 Candidate B：共同事实

| 事实组 | 冻结源码核验 | 结果 |
| --- | --- | --- |
| 入口与边界 | `package.json#bin` 指向 `bin/csl-agent-kit.js`；`scripts/install.sh:6` 转发到同一 Node 入口；`main` 仅对 `install` 进入安装链。 | PASS |
| 参数与选择 | `parseInstallArgs` 只形成 options；`resolveInstallTargets` 按 `all`、显式 targets、`yes`、交互分支决定集合，显式 targets 经验证并按首次出现顺序去重，`yes` 只取 `default: true`。 | PASS |
| 交互选择状态 | `CSL_AGENT_KIT_HOME` 或 `~/.csl-agent-kit/install-selection.json` 路径正确；version 1 数组按当前 registry 过滤；有效历史值只作 checklist 预选；external 未确认在保存、安装前退出；保存使用同目录 `0600` 临时文件和 rename，异常仅 warning。 | PASS |
| target 派发 | `targets` 当前为 `cursor`、`codex-plugin`、`pi`；`installTargets` 逐项同步派发、捕获单 target 异常并继续收集 results。 | PASS |
| Cursor / Pi | Cursor dry-run 只报告 symlink，实际路径拒绝覆盖普通文件并保留已正确链接；Pi dry-run 只报告命令，实际缺少 CLI 时返回成功 result 内的 `skip`。 | PASS |
| Codex 命令序列 | dry-run 不探测 CLI，并生成六条允许失败的 remove 与两条必须成功的 add；实际缺少 CLI 时返回 `skip`；required add 失败会在 cleanup 前抛错。 | PASS |
| legacy cleanup | 只遍历真实目录；只处理 symlink；文本 source 或 real source 位于 repo `skills/` 内即属 owned；dry-run 不 unlink；普通项、外部链接、外部 broken link 保留；重复执行不再产生 remove。 | PASS |
| 输出与退出 | JSON 直接序列化 `{ok, results}` 且不经颜色渲染；人类输出由 change action 聚合，verbose 才展开细节；参数/交互错误退出 `2`，任一 target result 失败使最终退出 `1`，全部成功退出 `0`。 | PASS |
| 测试锚点 | 报告引用的 `tests/cli-install-output.test.js:44,59,200,208,215,222,232,250,268,288,306,324,354,377,426,450` 均存在且对应所述行为。 | PASS |
| Freshness | 冻结树 `HEAD` 与报告一致；当前仅有生成后的预期 analysis 输出为 untracked，报告记录的 `Working tree: clean` 是输出前采样状态。 | PASS |

未发现不受冻结源码支持的项目事实、答案或锚点，因此 B 的事实 Verifier 通过。

## 4. Develop §12 五项评分

| 项目 | A | B | B 的证据与判断 |
| --- | ---: | ---: | --- |
| D1 组件职责、输入输出与边界 | 0 | 1 | Scope Summary 正确定位 npm bin / wrapper、argv/环境、targets、结果与外部平台边界。 |
| D2 功能模块及关系 | 0 | 1 | 恰有一个 Mermaid 关系图，并以表格连接解析、派发、展示、状态文件和三个平台边界。 |
| D3 核心工作流与因果顺序 | 0 | 1 | 完整覆盖非交互安装、交互持久化、Codex 迁移/cleanup 三条代表流程及提交顺序。 |
| D4 状态、失败路径与跨流不变量 | 0 | 1 | 覆盖 dry-run、参数退出 `2`、target 失败隔离、聚合退出 `1`、选择状态边界和 cleanup 安全边界。 |
| D5 源码/测试证据与变更可操作性 | 0 | 1 | 模块、流程和不变量均有源码锚点，关键结论有直接测试位置，可据此定位安全修改与验证面。 |
| **Develop 总分** | **0/5** | **5/5** | A 为 `NO_OUTPUT`；B Verifier PASS。 |

## 5. Learn Verifier 与 §16.2 五项评分

### 5.1 Schema 与教学契约

| 检查项 | B 证据 | 结果 |
| --- | --- | --- |
| 五段 schema | Orientation & Targets、Concept Ladder、Guided Walkthrough、Human Checks、Verification Key & Completion Standard 齐全。 | PASS |
| 主要职责覆盖链 | LT1–LT4 显式映射必需概念、代表行为/checkpoint、Prediction/Transfer 与 Key；覆盖选择、平台动作、cleanup、输出/退出。 | PASS |
| 事实与教学理由分离 | Concept Ladder 分列“行为事实”“教学理由”“源码锚点”，Walkthrough 分列预测、观察和因果结果。 | PASS |
| 人类材料顺序 | 明确 Recall 只看 prompts，Prediction 看第 1–3 节但隐藏 Key/源码，Transfer 可看源码但隐藏 Key；全部初始答案固定后才开放 Key。 | PASS |
| Agent 非回忆语义 | Completion Standard 明确 Agent 只能以报告外 sealed held-out prediction/transfer 衡量效用，不声称形成记忆或已经学会。 | PASS |
| sealed fixture 重合 | 报告讨论现有 selection 读取/保存语义，但练习与 Key 未包含 `--no-save-selection`、条件跳过保存或本 fixture 的验证答案；不存在具体场景/答案重合。 | PASS |

### 5.2 §16.2 可见五项

| 项目 | A | B | B 的覆盖链 |
| --- | ---: | ---: | --- |
| L1 概念关系：install target 与 install result | 0 | 1 | Concept Ladder 2–3、R2/K-R2 区分 options、selected targets、change records 与 per-target results。 |
| L2 因果追踪：参数到选择、执行、输出和退出 | 0 | 1 | B1 C1–C5 与 K-R2/K-P1 给出 `parse → resolve → installTargets → output → exit` 链。 |
| L3 行为预测：`--yes` 只选 `default: true` | 0 | 1 | B1 C1/K-P1 明确当前仅选择 `codex-plugin`，锚定 `#resolveInstallTargets`。 |
| L4 失败理解：未知 target 与 external 未确认 | 0 | 1 | Concept Ladder 2/5 连接显式 target 验证与参数错误退出 `2`；B2 C3、P3/K-P3 明确 external 未确认在 save/install 前退出 `2`。 |
| L5 基础迁移：新增默认关闭 target 与 CLI 检查 | 0 | 1 | B1 C1 给出 default 选择语义；T1/K-T1 要求定位 registry、选择/确认、target 内 dry-run、result 边界及 `tests/cli-install-output.test.js` CLI 验证位置。 |
| **可见 Learn 总分** | **0/5** | **5/5** | A 为 `NO_OUTPUT`；B schema、事实与可见覆盖均 PASS。 |

## 6. Sealed fixture 解封

- Fixture ID：`learn-heldout-05a6c689-t02`
- Combined SHA-256：`ce7e4b7cf7ed8169d6dda4fb6253ab268d607e69cd5ef94f529d3d16c91b2ea0`
- 冻结时间：`2026-07-19T14:16:50.522Z`
- Skill fingerprint：`ae9b34e368999d0ff661dff472d71d2e4e9e9b2548476279bd0f14b685458af3`

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望给 `csl-agent-kit install` 增加 `--no-save-selection`。交互安装仍要读取已有记忆来预选 checklist，也要按用户本次确认的目标正常执行，但本次运行不得创建或改写 `install-selection.json`；不传该参数时行为必须完全不变。非交互的 `--target`、`--all`、`--yes` 路径也不能因新参数改变选择或执行结果。

请基于报告完成一次 prediction/transfer：先预测当前实现读取和保存交互选择的时机及约束，再提出满足需求的最小修改方案。说明至少两个需要协作的代码触点、必须保持的行为/安全不变量、最小验证集合，并用报告中的源码锚点解释“已有选择如何继续影响本次提示，而新参数只阻止持久化”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明 `--target` / `--all` / `--yes` 等非交互分支在读取记忆前提前返回，以及交互分支先 `loadInstallSelection`、完成提示和外部目标确认后才 `saveInstallSelection` 时，记 1；缺任一因果顺序记 0。
2. 协作触点：只有在回答至少定位两个协作触点，且必含参数解析入口 `parseInstallArgs` 与选择解析流程 `resolveInstallTargets`，并说明后者如何与 `loadInstallSelection` / `saveInstallSelection` 协作实现“读但不写”时，记 1；只列名称不说明协作关系记 0。
3. 保持行为/不变量：只有在回答同时保证未传 flag 时原有持久化行为不变、传 flag 时已有记忆仍用于预选但状态文件不被创建或改写、目标验证与外部目标确认不被绕过、最终选择/执行/退出语义及非交互路径不变时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出隔离 `CSL_AGENT_KIT_HOME` 和可控 prompt 的成对验证：相同初始记忆与用户选择下，无 flag 会更新记忆、有 flag 会得到相同目标结果但文件内容与修改时间保持不变；并至少验证一次外部目标未确认时仍失败且不写文件，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#parseInstallArgs`、`#resolveInstallTargets`、`#loadInstallSelection`、`#saveInstallSelection` 锚点，并据此解释“解析 option → 加载记忆并构造预选 → 确认目标 → 条件跳过保存 → 安装结果不变”的因果链时，记 1；只有锚点清单或无因果解释记 0。

## 7. Downstream 原始回答

### Candidate A

按协议未调用：`A-learn` 为 `NO_OUTPUT`。

### Candidate B

### 实现预测

当前安装链应为：

`parseInstallArgs` 解析请求 → `resolveInstallTargets` 按 `--all`、显式 `--target`、`--yes`、交互模式的优先级决定 targets → `installTargets` 执行。

仅交互分支会处理历史选择：

1. `loadInstallSelection` 读取 version 1 的数组，并按当前 target registry 过滤。
2. `buildInstallChoices` 用有效历史值预选 checklist；无有效值时回退默认 target。
3. 用户本次选择 external target 时仍须二次确认。
4. 确认通过后，`saveInstallSelection` 以 `0600` 临时文件加 rename 的方式保存。
5. 保存失败只产生 warning，不阻止本次已确认 targets 继续安装。

因此历史文件只影响提示初始状态，不直接决定本次安装。`--all`、`--target`、`--yes` 会在读取历史选择前提前返回，既不读取也不保存。

### 最小修改

至少需要两个代码触点：

1. `bin/csl-agent-kit.js#parseInstallArgs`

   识别 `--no-save-selection`，保存为布尔 option，例如 `noSaveSelection`。必须由参数解析器消费该 flag，不能让它进入 target 列表或触发未知参数错误。若帮助文本与参数定义同处维护，同步补一行说明。

2. `bin/csl-agent-kit.js#resolveInstallTargets`

   保持 `loadInstallSelection`、`buildInstallChoices`、checklist、external confirmation 和最终 selected targets 的现有流程，只在确认成功后的持久化调用处增加唯一条件：

   ```js
   if (!options.noSaveSelection) {
     saveInstallSelection(selected);
   }
   ```

   guard 必须包住整个 `saveInstallSelection` 调用，而不是传入后让保存函数自行决定，以保证本次运行不会创建临时文件、rename 或改写 `install-selection.json`。无需修改 `saveInstallSelection`、`installTargets` 或各平台 installer。

因果链是：

`loadInstallSelection` → `buildInstallChoices` 形成历史预选 → 用户重新选择并确认 → `selected` 返回给 `installTargets` 正常执行；新增 flag 只切断 `selected` → `saveInstallSelection` 这条持久化边，不切断历史读取、提示或执行链。

### 必须保持的不变量

- 不传新参数时行为完全不变，包括交互 dry-run 仍可保存选择、保存失败仍只 warning。
- 传入新参数时，已有选择仍预选 checklist；无效历史仍回退默认项。
- 用户本次确认的 targets、顺序、external confirmation、安装动作、results 和退出码均不改变。
- 拒绝 external confirmation 仍在保存和安装前退出 `2`。
- `--target`、`--all`、`--yes` 与新参数组合时仍走原提前返回路径；新参数是无副作用 no-op，不能改变选择或执行结果。
- 未设置新参数时，原有 `0600` 临时文件与原子 rename 安全语义保持不变。
- 新参数只禁止 selection 持久化，不得隐含为平台安装的 dry-run。

### 最小验证集合

1. 交互核心测试：预置有效历史选择，带 `--no-save-selection` 启动；断言 checklist 仍按历史预选，用户改选并确认后对应 target 正常执行，同时 `install-selection.json` 内容及状态不变，且没有残留临时文件。
2. 默认行为回归：同一交互场景不带新参数，断言仍按本次确认结果保存；现有保存失败只 warning 的测试继续通过。
3. 非交互参数化测试：分别比较 `--target`、`--all`、`--yes` 加与不加新参数的 selected targets、dry-run JSON results 和退出码，结果应一致，选择文件均不被触碰。

报告未提供 `parseInstallArgs` 的具体实现体、帮助文本位置以及测试中的 prompt 注入方式，因此上述字段名和测试装配细节需以实际源码确认；修改边界和行为条件则可由报告中的 `#parseInstallArgs`、`#resolveInstallTargets`、`#loadInstallSelection`、`#buildInstallChoices`、`#saveInstallSelection`、`#installTargets` 锚点确定。

## 8. Held-out 二元评分

| Rubric | A | B | B 判断 |
| --- | ---: | ---: | --- |
| H1 当前约束 | 0 | 1 | 明确非交互分支在读取前返回，以及交互 `load → prompt/confirm → save` 顺序。 |
| H2 至少两个协作触点 | 0 | 1 | 明确 `#parseInstallArgs` 与 `#resolveInstallTargets`，并解释其与 load/save 的 option 传递和条件分支。 |
| H3 保持行为/不变量 | 0 | 1 | 默认路径、历史预选、external confirmation、最终选择/执行/退出、非交互早退均保持；唯一修改位于确认后的 save guard，因此既有 target 验证路径不变。 |
| H4 最小验证 | 0 | 0 | 虽提出 flag 开关的交互成对测试和非交互回归，但没有把“external target 未确认仍失败且不写文件”列为实际测试；也未明确以隔离 `CSL_AGENT_KIT_HOME`、文件 mtime 作为断言。按部分正确记 `0`。 |
| H5 报告锚点解释因果 | 0 | 1 | 引用四个必需锚点，并解释 option 只切断 `selected → saveInstallSelection`，不切断 load/prompt/install 链。 |
| **Held-out 总分** | **0/5** | **4/5** | A 按 `NO_OUTPUT` 固定为 0；B 未达到必需的 `5/5`。 |

## 9. 总分与 Verdict

| Candidate | Develop | Learn visible | Learn held-out | Candidate verdict |
| --- | ---: | ---: | ---: | --- |
| A | 0/5 | 0/5 | 0/5 | FAIL (`NO_OUTPUT`) |
| B | 5/5 | 5/5 | 4/5 | FAIL（held-out 未达 5/5） |

**TRIAL 002 VERDICT：FAIL。**

该结论不依赖匿名 arm mapping：A 为 `NO_OUTPUT`，B 的 Learn held-out 为 `4/5`；因此没有任何匿名候选满足 Learn 必需的 `5/5`，无法满足完整通过条件。身份映射继续保持隐藏。

## 10. Audit replay

- 重放时间：`2026-07-19T14:30:21.841Z`
- 重放输入：保存后的本文件（追加本节前 SHA-256：`673e3f932260e2f8fa03841cc406e407c401cdcb4fa961a36e135ea711e50cae`）内的匿名候选 hashes、Verifier 记录、解封 fixture、downstream 原始回答与二元 rubric。
- 重算 Develop：A `0/5`，B `5/5`。
- 重算 Learn visible：A `0/5`，B `5/5`。
- 重算 held-out：A 按 `NO_OUTPUT` 为 `0/5`；B 为 `1 + 1 + 1 + 0 + 1 = 4/5`。
- 重算 verdict：没有候选达到 Learn held-out `5/5`，故 `FAIL`。
- 重放结果：与第 9 节原 verdict 一致。
