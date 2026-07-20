# Trial 006 盲评记录

## 1. 边界与身份隔离

- Stage 1 仅读取四份匿名候选与两份冻结源码 workspace；评测时未读取 manifest、候选 raw、PRD、skill、旧 trials 或 A/B 身份。
- 冻结 scope 为 `bin/csl-agent-kit.js`，源码 commit 为 `05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Held-out fixture 在候选生成前冻结；Stage 1 完成且通过前未解封 rubric。
- 只有非 `NO_OUTPUT` 且 visible 满分的 Learn 候选才获得隔离下游测试；本记录不推断、不保存 A/B 身份映射。

## 2. 输入 hash 与冻结状态

| 匿名候选 | SHA-256 | 状态 |
|---|---|---|
| A Develop | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| A Learn | `3f90b41dba3a45ff8c336203f76b5bf77e059166936fe423feabe60c94be4b40` | `NO_OUTPUT` |
| B Develop | `5c1f7abcfc1e69bdb3d72c83638ecb68be7e1f19d99923a6859a9237816cade5` | 88 行，非空 |
| B Learn | `7d22d23c8545d5480fd09d41b7aacadbf5262ecae2220763939cc459dd1c64f6` | 187 行，非空 |

Develop 与 Learn workspace 的 `HEAD` 均为 `05a6c689e2344dc925b7dc111f02aa03750114f6`，`bin/csl-agent-kit.js` 的 SHA-256 均为 `f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`，该文件无工作区 diff。仅各自产生了预期的未跟踪分析输出目录。

## 3. 事实与锚点核验

逐项回查冻结源码及候选引用的聚焦测试证据：

- `#targets`：registry 声明顺序为 `cursor`、`codex-plugin`、`pi`；仅 `codex-plugin` 为 default，Cursor 为 internal，Codex/Pi 为 external。
- `#main`、`#parseInstallArgs`、`#splitTargets`、`#die`：install 参数先归一化；未知 option、缺失 target 参数等解析错误直接写 stderr 并退出 `2`。
- `#resolveInstallTargets`、`#loadInstallSelection`、`#saveInstallSelection`：选择优先级为 all → explicit → yes → interactive；仅 interactive 路径读取和写入 selection，CI/non-TTY 无 selector 时直接退出 `2`；external consent 拒绝发生在保存与派发前。
- `#installTargets`：按 selected 顺序逐项运行真实 handler，每项独立 `try/catch`；异常转为失败 result 后继续下一 target。
- `#installCursor`、`#ensureSymlink`：隔离 HOME 中预置普通文件可稳定触发 Cursor handler 异常，且原文件保持不变。
- `#installCodexPlugin`、`#installPi`、`#runCommands`：missing CLI 是正常返回的 successful `skip`；Codex dry-run 形成八条有序 command change；required add failure 会阻止后续 cleanup。
- `#removeLegacyCodexSkillLinks`、`#isWithin`：只清理本仓库拥有的 legacy symlink，并保持普通文件、外部链接等边界。
- `#printResults`、`#createColors`、`#printChangeDetails`、`#main`：JSON 与 human 从同一 results 精确分流；color/verbose 仅作用于 human；顶层 `ok` 与退出状态复用 `results.every(item => item.ok)`。
- `#printInstallHelp`：target 帮助由 registry 枚举，现有 install options 在该函数中呈现。
- 候选引用的 `tests/cli-install-output.test.js` 行号与相应行为一致；未发现伪造锚点、过期流程或与冻结快照冲突的核心事实。

## 4. Stage 1：Develop 可见质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness | 0 | 1 | A 为 `NO_OUTPUT`；B 明确 scope、HEAD、生成时间与材料边界，和冻结快照一致。 |
| 功能职责 + 恰好一张有效 Mermaid | 0 | 1 | B 有且仅有一张有效 flowchart，并配合模块表说明入口、选择、派发、effects 与呈现职责。 |
| 核心流程含状态与失败 | 0 | 1 | B 覆盖非交互、交互 selection/consent/persistence、Codex 两阶段 effect、解析退出 `2`、target 失败退出 `1` 与 successful skip。 |
| 高密度且无审计建议/inventory | 0 | 1 | B 以因果流与不变量组织内容，没有退化为文件 inventory、审计结论或修改建议。 |
| 事实可追溯 | 0 | 1 | B 的关键陈述均能落到冻结源码函数或聚焦测试证据。 |
| **合计** | **0/5** | **5/5** |  |

## 5. Stage 1：Learn visible 质量

| 维度 | A | B | 依据 |
|---|---:|---:|---|
| Scope / freshness / material | 0 | 1 | A 为 `NO_OUTPUT`；B 的 scope、HEAD、前置假设与“学习材料就绪”状态完整且准确。 |
| Targets 覆盖链 | 0 | 1 | LT1–LT4 将 request grammar、selection、effect/dispatcher、Codex 迁移、输出与退出连成可验证链。 |
| Concept Ladder | 0 | 1 | B 给出 10 级有依赖顺序的概念阶梯，每级都有行为事实、教学理由与源码锚点。 |
| 最小 walkthrough | 0 | 1 | B 用四个最小 walkthrough 覆盖默认 dry-run、交互拒绝、真实 handler failure 与 normal-return skip 对照。 |
| Recall → Prediction → Transfer → Key 严格闭环 | 0 | 1 | B 明确材料开放顺序，并提供 Recall、Prediction、Transfer、Verification Key 与 completion standard。 |
| 必需迁移与双侧验证覆盖 | 0 | 1 | B 覆盖 default/explicit、external 拒绝、非默认 target、聚焦验证、精确 JSON/human 控制点和 color/verbosity 双侧正交验证；还用真实 Cursor failure primitive、后续 fake Codex/Pi 可观察参与者、normal-return skip 对照，要求状态、调用、results 顺序与退出断言。 |
| **合计** | **0/5** | **5/5** |  |

### 私有 fixture overlap 检查

B Learn 包含通用的 target registry、参数解析、selection precedence、help 可发现性与 dispatcher 边界，这些是回答相邻任务所需的源码知识；但它没有出现 `--list-targets`、没有提出 selector 冲突后的 discovery 早退分支、没有给出三行制表符输出，也没有给出 CI 下无 selection I/O 的专用验证。因此不存在密封题具体答案泄漏。Stage 1 通过。

## 6. 解封的 held-out fixture

- Fixture ID：`learn-heldout-05a6c689-t06`
- Skill fingerprint：`64015d5a1f1626aa461280ecd1a9be3bccda92107d521b31698f247749297ec1`
- Source snapshot：`05a6c689e2344dc925b7dc111f02aa03750114f6`
- 冻结时间：`2026-07-19T15:29:48.564Z`
- Prompt + Rubric canonical combined SHA-256：`5bac38474edb27a0a278e1ad1eefb5f32137213994ea28ff77be9e7c2adf2350`

### Prompt

你是下游 Agent，只能读取分配给你的匿名 Learn 报告和本题，不能扫描仓库或读取其他资源。

相邻变更：团队希望给 `csl-agent-kit install` 增加纯发现模式 `--list-targets`。单独传入时，它必须按 target registry 的声明顺序，每个 target 输出一行制表符分隔的 `<name>\t<default|optional>\t<internal|external>`，然后退出 `0`。该模式不得进入 target 选择：不能读取或写入保存的 selection、不能提示或请求 external consent、不能调用 adapter、不能探测或执行外部 CLI，也不能生成普通 install 的 results、JSON 或 human completion。若同时出现任一执行选择器（`--all`、`--yes`、`--target`/位置 target），必须在任何上述副作用之前直接退出 `2`。未传新参数时现有安装行为不变。

请基于报告完成一次 prediction/transfer：先预测当前运行 `install --list-targets` 会在哪一层、以何种退出契约结束，并说明为什么“只让 parser 接受新 flag”仍不足；再提出满足需求的最小修改方案。说明需要协作的代码触点、必须保持的行为/不变量、最小验证集合，并用报告中的源码锚点解释“解析 discovery flag → 校验与 selector 冲突 → 在 target resolution 前列出 registry → 退出而不进入安装流水线”的因果链。不要假装看过报告未提供的源码；不确定处要明确标注。

### Rubric

总分 5；每项只能记 0 或 1，部分正确记 0。

1. 当前约束：只有在回答同时说明 `parseInstallArgs` 当前会把未知 `--list-targets` 交给 `die` 并直接退出 `2`、正常 install 的 `main` 在 parse 后必定进入 `resolveInstallTargets`、无 selector 的 CI/non-TTY 路径也会在 resolver 直接退出 `2`，且 interactive resolver 可能读取保存的 selection 并提示/授权，因此仅让 parser 接受 flag 会错误进入 target resolution 时，记 1；缺任一因果环节记 0。
2. 协作触点：只有在回答至少定位 `parseInstallArgs`、`main`、target registry 与 `printInstallHelp`，并说明新增默认 false 的 `listTargets` option、解析新 flag、由 `main` 在调用 `resolveInstallTargets` 前校验与 `all/yes/targets` 的冲突、冲突时调用 `die`、无冲突时用一个小型 printer 遍历 registry 后退出 `0` 时，记 1；只列名称或把分支放在 resolver/dispatcher 之后记 0。
3. 输出与不变量：只有在回答同时保证输出严格按 registry 声明顺序且三行语义为 `cursor\toptional\tinternal`、`codex-plugin\tdefault\texternal`、`pi\toptional\texternal`，discovery 成功时不产生 selection I/O、prompt/consent、adapter/CLI 调用、普通 results/JSON/human completion，selector 冲突仍直接退出 `2`，且未传 flag 时既有选择顺序、保存 selection、安装、输出与退出契约全部不变时，记 1；缺任一项记 0。
4. 最小验证：只有在回答提出隔离 HOME/PATH、设置 `CI=1` 并提供可观察 fake `codex`/`pi` 调用日志的真实 CLI 验证，断言 `install --list-targets` 退出 `0`、stdout 精确为上述三行、stderr 为空、日志与 selection 文件均不存在；另分别验证至少一个 option selector（如 `--all`）和一个位置 target 与 discovery flag 冲突时退出 `2` 且无副作用，并包含一项未传 flag 的现有 install 回归以及 help 暴露新 flag，记 1；否则记 0。
5. 锚点因果：只有在回答引用匿名报告中的 `#targets`、`#parseInstallArgs`、`#main`、`#resolveInstallTargets`、`#loadInstallSelection`、`#installTargets`、`#printInstallHelp`、`#die` 锚点，并据此解释“当前未知参数由 die 退出 → 新 option 进入 main → selector 冲突先 die → 无冲突则按 Object.entries(targets) 的声明顺序投影 default/external 元数据 → exit 0 → resolver、selection 与 dispatcher 不可达”的完整因果链时，记 1；只有锚点清单或未证明早退边界记 0。

## 7. 下游原始回答（B Learn，逐字保留）

## 当前行为预测

`install --list-targets` 最可能在 `parseInstallArgs` 参数解析层被当作未知 flag，通过 `die` 输出错误到 stderr 并退出 `2`；不会进入 `resolveInstallTargets`，也不会产生列表。报告未提供 parser 的具体分支和错误文案，因此只能确定退出契约，不能声称精确报错文本。

只让 parser 接受 `--list-targets` 不足：现有主链仍是：

`parseInstallArgs` → `resolveInstallTargets` → `installTargets` → JSON/人类输出 → results 退出谓词

若 flag 仅被保存但未建立早退分支，无 selector 时会进入交互路径，读取保存的 selection、加载 prompt，并可能请求 external consent；与 `--yes`、`--all` 或显式 target 同用时，还会执行 handler。之后仍会生成普通 results 和 completion 输出。

## 最小修改方案

仅触及以下位置：

1. `parseInstallArgs`
   - 增加归一化布尔字段 `listTargets`，默认 `false`。
   - 接受 `--list-targets`。
   - 继续复用现有显式 target/位置 target 的归一化结果，不另造 selector 模型。

2. `main`
   - 在 `resolveInstallTargets` 之前按以下顺序处理：

```js
const hasSelector =
  options.all ||
  options.yes ||
  options.<现有显式目标列表字段>.length > 0;

if (options.listTargets && hasSelector) {
  die("..."); // 现有契约：stderr + exit 2
}

if (options.listTargets) {
  process.stdout.write(
    targets
      .map(target =>
        `${target.<现有标识字段>}\t` +
        `${target.default ? "default" : "optional"}\t` +
        `${target.external ? "external" : "internal"}`
      )
      .join("\n") + "\n"
  );
  return;
}
```

   - selector 冲突检查必须早于 `validateTargets`、`resolveInstallTargets` 和任何 prompt/effect。
   - 直接遍历 `targets` 的原生声明顺序，不排序、不复制第二份 target 清单。
   - `return` 后由正常进程契约退出 `0`；不得构造空 results 再走现有 formatter。

3. `printInstallHelp`
   - 增加 `--list-targets` 的帮助说明。报告只证明该函数已有 install help 职责，未给出其具体字符串布局。

4. `tests/cli-install-output.test.js`
   - 增加聚焦 CLI 测试；无需修改 handlers、`resolveInstallTargets`、`installTargets`、`printResults` 或 JSON serializer。

报告确认的 registry 语义包括：当前仅 `codex-plugin` 为默认 target；Codex/Pi 属于 external consent 范围，Cursor 使用内部 symlink effect。报告没有明确列出 registry 的完整声明顺序或标识字段名，实施时应以实际 `targets` 定义为准，不能据本报告虚构精确 stdout 顺序。

## 必须保持的不变量

- 未传 `--list-targets` 时，现有 `all → 显式 target → yes → interactive` 优先级完全不变。
- discovery 输出直接派生自 registry 的名称、`default`、`external` 元数据。
- discovery 不调用 `resolveInstallTargets`，因此不读写 selection、不加载 prompts、不请求 external consent。
- discovery 不调用 `installTargets`，因此不进入 adapter，不执行 `hasCommand` 探测或任何外部 CLI。
- discovery 不生成 results，也不受 `--json`、color、verbose 或 human completion formatter 影响。
- 与任一执行 selector 冲突时均退出 `2`，且冲突判断与参数出现顺序无关。

源码因果链为：

`main` / `parseInstallArgs` 解析 discovery flag  
→ `main` 检查 `all`、`yes`、显式/位置 target 冲突  
→ 直接遍历 `targets` registry  
→ `return` 退出 `0`  
→ 永远不到 `resolveInstallTargets`、`installTargets`、JSON/`printResults`

对应锚点：`bin/csl-agent-kit.js#main`、`#parseInstallArgs`、`#splitTargets`、`#targets`、`#resolveInstallTargets`、`#installTargets`、`#printResults`。

## 最小验证集合

- 纯 discovery：
  - 退出 `0`、stderr 为空。
  - stdout 与当前 registry 的硬编码声明顺序逐行完全一致，字段之间只能是 `\t`，末尾换行。
  - 隔离 HOME 中预置 selection；运行后内容不变。
  - PATH 中放记录调用的 fake Codex/Pi；调用日志为空。
  - Cursor 安装路径无新增内容。
  - 可叠加 `--json --color --verbose` 验证仍只有 discovery 文本，不产生 JSON、ANSI、details 或 completion。

- selector 冲突参数化测试：
  - `--all`
  - `--yes`
  - `--target <name>`
  - 位置 `<name>`
  - 对 `--list-targets` 位于 selector 前后各测一次。
  - 全部退出 `2`；无列表、selection 不变、fake CLI 日志为空、无安装文件变化。

- 普通安装回归：
  - `install --yes --dry-run --json` 仍只选择默认 `codex-plugin`，results 语义及顺序不变，退出 `0`。
  - 现有交互 selection/consent、未知 target、JSON/人类输出测试继续通过。

- help：
  - install help 可发现 `--list-targets`。

## 8. Held-out 二元评分

A Learn 为 `NO_OUTPUT`，五项均为 0。B Learn 严格逐项评分：

| 项目 | A | B | B 的判定依据 |
|---|---:|---:|---|
| H1 当前约束 | 0 | 0 | 正确预测当前未知 flag 经 parser/`die` 退出 `2`，也说明正常主链会进入 resolver；但把“只解析新 flag 后的无 selector”笼统预测为进入 interactive，遗漏并违背 CI/non-TTY 会在 resolver 直接退出 `2` 的必需分支。二元项部分正确仍为 0。 |
| H2 协作触点 | 0 | 1 | 定位 parser、`main`、registry 与 help，给出默认 false option、selector 冲突检查、`die`、resolver 前遍历并退出 `0` 的协作关系。虽以内联输出表达小型 printer，不改变该因果边界。 |
| H3 输出与不变量 | 0 | 0 | 保持副作用与默认安装不变量基本完整，但明确拒绝固定 registry 的精确声明顺序，未给出 rubric 要求的三行语义；“仅 codex-plugin default”只能间接推出 optional，不能替代精确输出契约。 |
| H4 最小验证 | 0 | 0 | 有隔离 HOME/PATH、fake CLI、selector/位置冲突、普通回归与 help，但没有设置 `CI=1`，预置并保持 selection 而非断言 selection 文件不存在，也没有断言精确三行 stdout。 |
| H5 锚点因果 | 0 | 0 | 缺少必需的 `#loadInstallSelection`、`#printInstallHelp`、`#die` 锚点与 `Object.entries(targets)` 对象声明顺序；伪代码反而使用未知的 `targets.map`，未满足完整指定链。 |
| **合计** | **0/5** | **1/5** | B = `0 + 1 + 0 + 0 + 0`。 |

## 9. Verdict

- A：Develop `0/5`，Learn visible `0/5`，held-out `0/5`。
- B：Develop `5/5`，Learn visible `5/5`，held-out `1/5`。
- Held-out 门槛要求 `5/5` 且至少领先 baseline 1 分；B 虽领先 1 分，但未达到 `5/5`。
- **Trial 006：FAIL**。
- 该判定不依赖 A/B 身份映射；评分前后均未请求或推断 mapping。

## 10. Audit replay

- 回放前 scoring SHA-256：`5bd4392d04d911b2edfd6d8a999958fa0c17c2c5f35c59d1c70e09ab4c024dc9`。
- 从第 6 节按 canonical 格式重新拼接 `PROMPT\n...\n\nRUBRIC\n...\n`，SHA-256 为 `5bac38474edb27a0a278e1ad1eefb5f32137213994ea28ff77be9e7c2adf2350`，与候选生成前冻结值完全一致。
- 四份候选回放 hash 依次为 `3f90b41d...4b40`、`3f90b41d...4b40`、`5c1f7abc...ade5`、`7d22d23c...64f6`，与第 2 节保存的完整值一致。
- 独立重算 Develop：A `0/5`，B `5/5`。
- 独立重算 Learn visible：A `0/5`，B `5/5`。
- 独立重算 held-out：A `0/5`；B 为 H1–H5 = `0 + 1 + 0 + 0 + 0 = 1/5`。
- 门槛重放：B 相对 A 领先 1 分，但 `1/5 < 5/5`，因此 verdict 仍为 **FAIL**。
- 回放未读取、请求或推断 A/B 身份映射。
