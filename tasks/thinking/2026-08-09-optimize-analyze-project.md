# `analyze-project` 实施级优化提案

## 一、执行结论

将 `analyze-project` 收敛为单一 need-driven 产品：

> 针对唯一 Git scope 和一个当前实现问题，生成一份可由源码证明、直接回答该问题的持久报告。

本轮仅交付只读优化提案，不修改任何 skill 源码；以下文件变更仅供后续获准实施。

核心决定：

- `develop` 保留为 standard focus alias。
- `learn` 保留为 learning focus alias。
- focus 只影响是否追加紧凑的 Learning Check，不改变报告路径、安全合同或答案内核。
- 删除双模式报告、双 freshness 和双覆盖流程。
- 唯一发布门：答案内核必须能由源码直接证明，或能写成源码支持的穷尽条件结论。
- 不新增 runner、parser、filesystem helper、通用评测框架或 race fixture。
- 后续 `SKILL.md`、reference、确认框、问题、错误及运行时回复全部使用英文；本文作为实施提案使用中文。
- 声明式 contract cases 只作为合同与人工审阅输入，不冒充已执行测试。
- 模型价值验收要求两个 case 各至少一个 accepted attempt，不要求领先历史 baseline。

---

## 二、当前问题与证据

- **HIGH** — [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/SKILL.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/SKILL.md)：`develop|learn` 同时控制内容、输出路径和覆盖协议，造成同一分析产品分叉。
- **HIGH** — [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/learn-mode.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/learn-mode.md)：无条件课程化矩阵显著扩张多数学习 need，包含不必要的 Recall、Transfer 和掌握状态。
- **HIGH** — [`"/Users/caishilin/.local/share/mise/installs/node/22/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/tools/write.js"`](file:///Users/caishilin/.local/share/mise/installs/node/22/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/tools/write.js)：当前实现使用递归 `mkdir` 后直接 `writeFile`，不能提供 no-clobber 新建或安全 replacement。
- **MEDIUM** — [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/develop-mode.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/develop-mode.md)：Mermaid validator 被提升为整份报告的交付门，阻塞与核心答案无关。
- **MEDIUM** — [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/contract_cases.json"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/contract_cases.json)：现有 28 个 JSON case 为声明式数据，不能描述为已机械执行的测试。
- **MEDIUM** — [`"/Users/caishilin/.local/share/mise/installs/node/22/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js"`](file:///Users/caishilin/.local/share/mise/installs/node/22/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js)：若未使用 `--no-skills`，自动发现的 enabled skills 会污染模型价值评测。

修订方案本身无 blocker。

---

## 三、目标产品、路由和确定性 need 合同

### 3.1 路由边界

| 请求 | 应使用的产品 |
|---|---|
| 当前实现的一条职责、行为或因果链，需要持久报告 | `analyze-project` |
| 快速寻找入口或相关文件 | `repo-map` |
| 外部官方资料 | `research` |
| 通用长期课程 | `teach` |
| PR/diff 缺陷 | `code-review` |
| 修改步骤、diff 或实施计划 | change planning |
| 风险、缺陷及改进建议 | audit |

应同步更新 [`"/Users/caishilin/Desktop/personal/skills/skills/repo-map/SKILL.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/repo-map/SKILL.md)，明确它只负责宽泛定向，不承担 need-bounded 深度报告。

### 3.2 调用形状

```text
/analyze-project [target] [develop|learn] [--need <free-text tail>]
```

解析顺序：

1. `--need` 必须是最后一个控制字段；其后的全部内容 trim 后成为 need，不再解释 alias。
2. 空 `--need` 时零报告写入，并询问：
   `What current implementation question should this report answer?`
3. `--need` 前最多允许一个 target 和一个 alias。
4. 已存在路径或唯一自然语言组件优先解释为 target，即使名称是 `learn` 或 `develop`。
5. 精确 alias 只在 target 已解析，或它是唯一 token 且不存在同名 target 时生效。
6. 未提供 target 时使用当前目录。
7. 多 target、多 Git root、多余位置参数或多候选组件不得猜测；零报告写入，只问一次。
8. alias 不得扩张 need，也不得改变 active path。
9. Agent 直接解释 invocation，不新增 parser 脚本或解析依赖。

### 3.3 声明式解析矩阵

成功行假设 target 存在、active report 不存在且答案内核可由静态源码证明。

| Invocation | Target | Focus | Need | 结果 |
|---|---|---|---|---|
| `/analyze-project` | cwd | standard | bounded default | 唯一入口时生成一次 |
| `/analyze-project ./learn`，且目录存在 | `./learn` | standard | bounded default | 生成一次 |
| `/analyze-project ./develop`，且目录存在 | `./develop` | standard | bounded default | 生成一次 |
| `/analyze-project ./learn learn` | `./learn` | learning | bounded default | 生成一次 |
| `/analyze-project bin/csl-agent-kit.js develop --need explain why learn wins` | named file | standard | `explain why learn wins` | 生成一次 |
| `/analyze-project bin/csl-agent-kit.js --need` | named file | standard | invalid | 询问当前实现问题；零写入 |
| `/analyze-project src/a src/b` | unresolved | none | none | `Choose one scope: …`；零写入 |
| `/analyze-project` 且无唯一主要入口 | cwd | standard | unresolved | `Which observable behavior should this report explain?`；零写入 |

### 3.4 有界默认 need

没有显式 need 时使用：

> Explain how one normal call travels from the default or primary real entry to its main observable result, including the earliest current branch that can change that result and the existing verification entry. Exclude unrelated responsibilities.

若源码不能识别唯一主要入口，先询问可观察行为，不生成宽泛项目地图。

---

## 四、报告合同

### 4.1 唯一 active path

以 Git root 为绝对路径基准：

```text
project:   <Git root>/docs/analysis/project-map.md
directory: <Git root>/docs/analysis/components/dir/<relative-dir>/map.md
file:      <Git root>/docs/analysis/components/file/<relative-file>.md
```

`map.md` 只作为兼容文件名；报告实际内容完全由 `Need` 限定。

### 4.2 最小结构

1. **Metadata**
   - `Scope`
   - `Need`
   - `HEAD` 或 `unborn`
   - `Working tree`
   - 带时区的 `Generated at`
2. **Direct Answer**
3. **Need-bounded Working Model**
4. **Critical Evidence Path**
5. **Verification Anchors**
6. **Material Uncertainty**，仅在存在重大未知时
7. **Learning Check**，仅 learning focus

每一段至少满足一项，否则删除：

- 直接回答 need；
- 解释必要因果关系；
- 提供支持结论的源码锚点；
- 标出会改变结论适用范围的重大未知；
- 检验 need 范围内的当前行为理解。

不得生成完整目录树、模块/API/type/test inventory、风险清单或修改计划。

### 4.3 答案内核与未知处理

允许发布：

- 答案内核可由源码直接证明；或
- 源码能够证明所有相关条件、各条件结果以及条件集合的穷尽性，只是不知道实际运行选择哪项。

必须零报告写入：

- need 所需的必要节点、因果边或结果无法证明；
- 无法形成穷尽条件答案；
- 核心结论必须执行项目才能证明，但尚未获得授权。

非核心测试缺失、术语缺失或可选图表不得阻塞发布。

### 4.4 Mermaid

- 只有文本或紧凑表格不足以表达时才生成。
- 存在本地只读 validator 时执行验证。
- validator 缺失或图表无效时，降级为文本或表格继续。
- 不安装依赖、不要求固定图数、不因 Mermaid 失败而零写入。

### 4.5 Freshness

候选报告、证据检查、Mermaid fallback 和 redaction 全部在内存完成后，且在任何 `mkdir`、temp 创建或 active-report mutation 前采样：

- `HEAD`
- working-tree state
- 带时区时间

当 `HEAD: unborn` 时写入：

> This report is based on uncommitted working-tree content and does not represent a revision.

### 4.6 既有报告替换与旧格式

确认框必须显示：

- active path；
- old Need；
- old HEAD；
- old Generated at；
- new Need；
- `Replace` / `Cancel`。

Fallback：

- 旧 Need 缺失、重复或无法解析：
  `unknown (pre-need report)`
- HEAD 或时间缺失、无法解析：
  `unknown`

行为：

- `Cancel` 保持旧文件 bytes 不变。
- `Replace` 必须重新读取源码并分析；旧报告正文不得作为事实证据。
- 旧格式回归 case 必须验证：仅有 Scope、HEAD、Working tree、Generated at 时显示 `unknown (pre-need report)`。
- 旧 `docs/analysis/learning/**` 仅作历史归档，不更新、移动、删除或引用为证据，并显示：
  `Legacy report retained at <path>; archival only.`

成功后的运行时回复保持最小，只报告 active path，以及适用的 blocker、redacted warning 或 legacy notice。

---

## 五、Learning focus

### 5.1 Learning Check 合同

只在以下情况追加：

- 显式使用 `learn` alias；
- need 明确要求预测或检验当前源码理解。

内容：

1. 复用 Critical Evidence Path，不重复 walkthrough。
2. 一个 Prediction，预测 need 内当前输入、状态或分支。
3. 最多一个 Transfer，只使用源码中已经存在且与 need 相关的对比分支。
4. prompts 在前，紧凑 Key 在后。
5. Key 只包含判断、因果理由和源码锚点。

禁止：

- Recall 仪式或材料开放流程；
- 声称掌握、记忆或完成状态；
- 假想修改、diff 或新测试计划；
- 为凑 Transfer 扩张 scope。

### 5.2 冻结 learning fixture

**Scope：** [`"/Users/caishilin/Desktop/personal/skills/bin/csl-agent-kit.js"`](file:///Users/caishilin/Desktop/personal/skills/bin/csl-agent-kit.js)

**Need：**

> Learn how `--all`, an explicit target, `--yes`, and bare install currently select targets. Use one representative path and one existing contrast branch; do not create a course or change plan.

**源码锚点：**

- `#parseInstallArgs`
- `#targets`
- `#resolveInstallTargets`
- `#validateTargets`
- `#die`
- [`"/Users/caishilin/Desktop/personal/skills/tests/cli-install-output.test.js"`](file:///Users/caishilin/Desktop/personal/skills/tests/cli-install-output.test.js) 中的 `explicit target installs do not overwrite the saved interactive selection`

**代表路径：**

`--target pi,cursor,pi` 经 split、整体 validation 和稳定去重后得到 `pi,cursor`，并绕过 interactive state 与 consent。

**Prediction：**

> In CI/non-TTY, does `install --yes --dry-run` reach the TTY gate, read saved selection state, or show external confirmation?

**Key：**

`--yes` 在 TTY gate 前选择 registry default `codex-plugin`；不读取 state、不 prompt、不执行 interactive consent。

**Transfer：**

> In CI/non-TTY, where does `install --target unknown --yes` fail first, and which later stages are unreachable?

**Key：**

explicit selector 优先于 `yes`；`validateTargets` 经 `die` 写 stderr 并退出 2；state、prompt、consent、dispatcher 和 effects 均不可达。

---

## 六、Scope、证据、授权与 redaction

### 6.1 Scope 安全

- target 必须等于唯一 Git root 或位于其中。
- 拒绝仓库外 symlink、路径逃逸和无法安全表示的路径。
- 多 Git root、多 target、多候选组件只询问一次。
- component scope 只读取其内部、直接上下游及 need 相关行为。
- 输出链上任何现有父级 symlink 均拒绝。
- 不把 component 分析扩张成全仓库审计。

### 6.2 证据优先级

1. 行为：`path#symbol`
2. 配置：`path#key`
3. 没有稳定 symbol/key 时才使用行号

README 和设计文档只证明意图；CodeGraph 只用于导航。静态可证但没有测试时允许报告，但不得表述为“已测试”。

### 6.3 Runtime authorization

默认只读：

- 源码和适用规则；
- Git metadata；
- 静态配置；
- 文档及测试源码。

以下操作必须明确授权：

- build/test；
- 执行项目 CLI 或启动进程；
- 安装依赖；
- 网络或外部服务；
- 任何可能改变项目或外部状态的命令。

核心答案依赖运行且未获授权时零报告写入；非核心运行时细节直接省略。

### 6.4 Redaction

报告、内存候选、temp、持久 transcript artifact 和最终回复均不得包含疑似 secret 的值、片段或 hash。

唯一 warning 格式：

> Suspected `<category>` at `<repo-relative path>`; secret value was not recorded.

不得因此把任务扩张成安全审计。

---

## 七、active report 安全发布

仅使用 Node 标准库，不直接调用 Pi write 覆盖 active report，也不新增 helper library：

- `node:path`
- `node:fs/promises`：`lstat`、`realpath`、`mkdir`、`open`、`readFile`、`link`、`rename`、`unlink`
- `node:crypto`：`randomUUID`、`createHash`
- `process.pid`

### 7.1 发布前状态

1. 使用 `path.resolve` 计算目标，确认词法位置在 Git root 内。
2. 从最深现有祖先开始逐段 `lstat`，拒绝 symlink 和非目录。
3. 若 target 已存在：
   - 必须为普通文件；
   - 读取旧 bytes；
   - 在内存保存旧 bytes 的 SHA-256、长度，以及 target/parent 的 `dev`、`ino`；
   - 这些值仅用于本次比较，不进入报告或 artifact。
4. 显示 Replace/Cancel；Cancel 立即结束。
5. 在内存完成候选、证据核对、fallback 和 redaction。
6. 此时才采样 freshness；此前不得 `mkdir`、创建 temp 或写 active report。

### 7.2 创建并复核父级

freshness 后，从已验证的现有祖先向下逐段处理：

1. `lstat(segment)`：
   - 存在时必须是非 symlink 目录；
   - `ENOENT` 时只执行非递归 `mkdir(segment)`。
2. `mkdir` 返回 `EEXIST` 时重新 `lstat`，不能假定其安全。
3. 创建后再次 `lstat` 并保存目录 identity。
4. 创建 temp 前和发布前重新走查整个父链；symlink、类型或 identity 变化时拒绝发布。

逐段检查不能消除检查与下一次路径系统调用之间的 hostile TOCTOU。

### 7.3 唯一 owned sibling temp

1. temp 位于 target 同一父目录，名称包含 target basename、`process.pid` 和 `randomUUID()`。
2. 使用 `open(temp, "wx")`；只有成功取得 handle 后，该 temp 才属于本次运行。
3. 写入完整 UTF-8 candidate，确认 write 和 close 成功后才能发布。
4. 不使用固定 temp 名，不删除任何未由本次成功 `open("wx")` 创建的路径。

### 7.4 原先不存在的 target

1. 再次验证父链。
2. 调用 `fs.link(temp, target)`：
   - 成功：target 原子获得已完整关闭的 candidate，再 `unlink(temp)`；
   - `EEXIST`：作为 no-clobber 失败，竞争者 target bytes 保持不变；
   - 其他错误或不支持 hard link：不得回退到 `writeFile`，不发布报告。
3. 禁止使用“先检查 absent，再覆盖写入”的竞态流程。

### 7.5 已确认存在的普通 target

1. 发布前重新 `lstat`、`readFile`：
   - parent 和 target identity 必须匹配；
   - bytes 长度和 SHA-256 必须匹配旧值；
   - 任一变化即拒绝 replacement。
2. 仅在平台及文件系统支持同目录 replacement rename 时调用 `fs.rename(temp, target)`。
3. `rename` 成功即替换；失败或不支持时不得直接写入，旧 bytes 保持不变。
4. 最终比较到 `rename` 之间仍存在不可避免的普通并发窗口。

### 7.6 清理与边界声明

`finally` 只对 owned temp 调用 `unlink`：

- `ENOENT` 表示已随成功发布移除；
- 其他清理失败必须报告；
- 不扫描或删除未知 temp。

不得声称：

- 已执行 `fsync` 或具备断电 durability；
- 提供 concurrent-writer isolation；
- 阻止 hostile TOCTOU；
- 具备 path-level tool confinement；
- link/rename 在所有平台和文件系统上语义一致。

发布失败可能留下本次创建的空父目录，但不得留下部分 active report；不为清理空目录引入新的删除竞态。

声明式 publication cases 必须覆盖：

- absent target 遇到 `EEXIST` 时竞争者 bytes 不变；
- replacement `rename` 不支持或失败时旧 bytes 不变；
- 成功、拒绝和失败路径都只清理 owned temp；
- 缺失父级按层创建并成功发布；
- target、parent 或 bytes 检测到变化时拒绝发布。

不增加 race injection 或 barrier fixture。

---

## 八、实现资产与 case 迁移

### 8.1 文件变更范围

实施时：

- 重写 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/SKILL.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/SKILL.md)：英文单一 need 合同。
- 新增 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/report-contract.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/report-contract.md)：英文报告合同及 Node 发布序列。
- 删除 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/develop-mode.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/develop-mode.md)。
- 删除 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/learn-mode.md"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/references/learn-mode.md)。
- 更新 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/contract_cases.json"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/contract_cases.json)。
- 新增 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/value_cases.json"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/value_cases.json)，恰好两个 case。
- 更新 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/trigger_cases.json"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/trigger_cases.json) 和 [`"/Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/semantic_config.json"`](file:///Users/caishilin/Desktop/personal/skills/skills/analyze-project/evals/semantic_config.json)。
- 更新 [`"/Users/caishilin/Desktop/personal/skills/README.md"`](file:///Users/caishilin/Desktop/personal/skills/README.md)、仓库根 [`"/Users/caishilin/Desktop/personal/skills/README.md"`](file:///Users/caishilin/Desktop/personal/skills/README.md) 中适用说明，以及 repo-map 相邻边界。

若不存在 skill-local README，则只更新仓库 README；不为此新建额外文档。

### 8.2 现有 28 个 contract case

**保留并收紧语义，共 8 个：**

- `single-scope-single-report`
- `path-collision-avoidance`
- `ambiguous-scope`
- `canonical-path-escape`
- `nonregular-report-target`
- `static-evidence-without-tests`
- `runtime-proof-requires-authorization`
- `suspected-secret`

**替换，共 17 个：**

- 六个 develop/learn output case → 统一 active path，仅区分 focus。
- `existing-develop-report`、`existing-learn-report` → Replace/Cancel 与 legacy fallback。
- `atomic-replace-unavailable` → old bytes 不变、owned temp 清理、无直接覆盖 fallback。
- `freshness-input-state` → 任意 output mutation 前采样。
- 三个 Mermaid case → valid 时使用，missing/invalid 时 fallback。
- `learn-does-not-consume-develop` → 每次从源码重新分析。
- `learn-human-material-order` → Prediction/Transfer 后置紧凑 Key。
- `learn-agent-semantics` → 不声称掌握或记忆。
- `minimal-final-response` → path、blocker、redacted warning、legacy notice。

**删除，共 3 个：**

- `learn-disconnected-project-or-directory`
- `learn-connected-project-or-directory`
- `learn-disconnected-file`

同时删除 coverage graph 产品以及 race/barrier 注入断言。

新增声明式覆盖：

- invocation parsing matrix；
- legacy active report 缺失 Need；
- replacement cancellation；
- pre-confirmation 和 pre-publication identity/content mismatch；
- absent-target `EEXIST` preservation；
- missing-parent creation；
- replacement failure preserves old bytes；
- owned-temp cleanup。

---

## 九、价值验证与验收条件

### 9.1 冻结基线

使用 revision：

```text
05a6c689e2344dc925b7dc111f02aa03750114f6
```

复核以下冻结 SHA-256：

- [`"/Users/caishilin/Desktop/personal/skills/bin/csl-agent-kit.js"`](file:///Users/caishilin/Desktop/personal/skills/bin/csl-agent-kit.js)：`f3a3342b514d0c67381672229a20afffbc31a1448332addeb9696948a6bdc7b5`
- [`"/Users/caishilin/Desktop/personal/skills/tests/cli-install-output.test.js"`](file:///Users/caishilin/Desktop/personal/skills/tests/cli-install-output.test.js)：`ce35af5d92de14a0448209f8a0472a5ad3f7f5a8ff16dea8200a2c00466c6897`
- [`"/Users/caishilin/Desktop/personal/skills/package.json"`](file:///Users/caishilin/Desktop/personal/skills/package.json)：`390b2dad27bc87bb0bea57e6d83d7d8af5937373187e9792376fed9aa5fd58f8`

### 9.2 Value Case A：standard/develop

```text
/analyze-project bin/csl-agent-kit.js develop --need Before changing non-interactive external-integration authorization, explain the current selection/consent path, failure exits, and existing verification entry. Do not provide an implementation plan.
```

报告必须回答：

- selector precedence：all → explicit → yes → interactive；
- all 使用 registry 顺序；
- explicit 先完成整体 validation，再稳定去重；
- yes 选择 default `codex-plugin`；
- all/explicit/yes 不读取 interactive state、不 prompt、不执行 external confirmation；
- bare install 才经过 TTY、state、checklist、external confirmation 和 save；
- denial 在 save/dispatcher 前经 `die` 退出；
- unknown explicit target 在 state/effects 前失败；
- dispatcher 只是该 need 的下游边界。

不得包含 installer 内部、风险清单、修改方案或 Learning Check。

### 9.3 Value Case B：learning focus

使用第五节冻结的 scope、need、代表路径、Prediction、Transfer、Key 和源码锚点；写入与 Case A 相同的 active path，只追加紧凑 Learning Check。

验证 case 数量：

```bash
node -e 'const j=require("./skills/analyze-project/evals/value_cases.json"); if(j.cases.length!==2) process.exit(1)'
```

这里限制的是 case 数量，不是模型尝试次数。

### 9.4 模型输出验收

验收门：

- Case A 至少一个 accepted attempt；
- Case B 至少一个 accepted attempt；
- 不限制总尝试数；
- 不要求结果领先历史 baseline。

每个 attempt：

1. 创建独立 OS-temp 根。
2. 创建 fresh `HOME` 和 fresh `PI_CODING_AGENT_DIR`，不复制用户 settings、skills、context 或 templates。
3. fixture clone detached checkout 到冻结 revision，并复核三个 source hash。
4. 将 proposed skill package 复制到独立 snapshot；按排序后的相对文件名记录每个文件 SHA-256。
5. `--skill` 只能指向 snapshot，不得指向变化中的工作树。
6. 认证若需注入，只记录认证通道类别及是否存在，不记录 secret 值、片段或 hash。

调用形状：

```bash
(
  cd "$FIXTURE"
  HOME="$ATTEMPT/home" \
  PI_CODING_AGENT_DIR="$ATTEMPT/pi-coding-agent" \
  pi \
    --print \
    --mode json \
    --no-session \
    --no-extensions \
    --no-context-files \
    --no-prompt-templates \
    --no-skills \
    --tools read,bash,write \
    --approve \
    --model openai-codex/gpt-5.5 \
    --skill "$SKILL_SNAPSHOT" \
    "$PROMPT"
)
```

`--no-skills` 禁止自动发现 skills；显式 `--skill` 提供唯一 proposed-skill snapshot。

每次记录：

- `command -v pi`、`pi --version`、Pi executable SHA-256；
- requested/resolved provider/model；
- 后端暴露的 model revision/hash；未暴露时记录 `unavailable`；
- source revision、dirty state 和三个 source hash；
- skill snapshot 文件清单及 hashes；
- cwd、环境输入类别、完整 flags 和 prompt；
- JSON transcript；
- 运行前后 fixture、fresh HOME、fresh Pi directory 文件清单；
- process exit code；
- 生成的报告副本；
- 每项 post-run assertion 结果。

transcript 如需 secret redaction，使用占位符并在 manifest 说明发生过 redaction；不得保存原值或其 hash。

建议 artifact 根：

- [`"/Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/need-contract-v1/default-develop"`](file:///Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/need-contract-v1/default-develop)
- [`"/Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/need-contract-v1/learning"`](file:///Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/need-contract-v1/learning)

每个 attempt 使用 `attempt-NNN` 子目录，保留：

- `manifest.json`
- `transcript.jsonl`
- 存在时的 `report.md`

失败 attempt 必须保留并在汇总中披露，不得覆盖或删除。允许在 source、skill snapshot、prompt、rubric、Pi/model 和 flags 全部不变时重跑；其中任一变化时创建新的 eval version。manifest 必须披露模型非确定性。

### 9.5 Post-run assertions

仅在运行结束后检查：

- 预期报告存在，且没有额外 fixture 写入；
- Direct Answer 紧跟 metadata；
- golden facts 正确，且锚点支持主张；
- 不包含排除主题、secret 或无效 Mermaid；
- 未经授权未运行 build/test/project CLI；
- standard/learning focus 边界正确；
- transcript 未显示 active report 通过直接 Pi write/`writeFile` 覆盖发布；
- 发布路径符合 `open("wx")` → `link`/`rename` 合同。

不声称具备 pre-run confinement、监控器或 sandbox。文件清单只能证明已观察目录；Bash/tool allowlist 不能证明 fixture 外零写入。

### 9.6 静态及仓库验证

令 `$ROOT` 指向 [`"/Users/caishilin/Desktop/personal/skills"`](file:///Users/caishilin/Desktop/personal/skills)，实施后执行：

```bash
python3 ~/.codex/skills/yao-meta-skill/scripts/trigger_eval.py \
  --description "$NEW_DESCRIPTION" \
  --cases "$ROOT/skills/analyze-project/evals/trigger_cases.json" \
  --semantic-config "$ROOT/skills/analyze-project/evals/semantic_config.json"

python3 ~/.codex/skills/yao-meta-skill/scripts/yao.py \
  validate "$ROOT/skills/analyze-project"

python3 ~/.codex/skills/yao-meta-skill/scripts/resource_boundary_check.py \
  "$ROOT/skills/analyze-project"

npm test
git diff --check
```

JSON cases必须由 Node 成功解析并人工核对；不建设执行引擎。

---

## 十、历史迁移

- [`"/Users/caishilin/Desktop/personal/skills/docs/analysis/analyze-project-v2-prd.md"`](file:///Users/caishilin/Desktop/personal/skills/docs/analysis/analyze-project-v2-prd.md)：标记 `Superseded by the need-driven report contract`。
- [`"/Users/caishilin/Desktop/personal/skills/docs/analysis/analyze-project-v2-learn-prd.md"`](file:///Users/caishilin/Desktop/personal/skills/docs/analysis/analyze-project-v2-learn-prd.md)：同样标记 Superseded。
- [`"/Users/caishilin/Desktop/personal/skills/tasks/tasks/analyze-project-skill.md"`](file:///Users/caishilin/Desktop/personal/skills/tasks/tasks/analyze-project-skill.md)：保留 Aborted，并注明旧 runner 要求已被两个 accepted model-output cases 取代。
- [`"/Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/contract-fixtures.md"`](file:///Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/contract-fixtures.md) 以及 [`"/Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/trial-001"`](file:///Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/trial-001) 至 [`"/Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/trial-013"`](file:///Users/caishilin/Desktop/personal/skills/reports/analyze-project-evals/trial-013) 保持不变，只作历史审计证据。

---

## 十一、实施顺序

1. 更新 contract/value JSON，先冻结 parsing、legacy、publication 和两个价值 case。
2. 将 `SKILL.md` 重写为英文单一 need 产品。
3. 用一个英文 `report-contract.md` 替换两个 mode reference。
4. 接入 Node 标准库 publication 序列，禁止 active report 直接覆盖写入。
5. 更新 routing fixtures、README、repo-map 边界及历史状态。
6. 运行静态验证和仓库测试。
7. 创建冻结 skill snapshot 并执行模型 attempts，直到两个 value case 各有一个 accepted attempt；保留全部失败证据。

---

## 十二、残余风险

- replacement 最终检查到 `rename` 之间仍有普通并发窗口。
- 逐段 `lstat` 不能消除 hostile TOCTOU。
- 文件系统不支持 hard link 或 replacement rename 时会安全拒绝发布。
- publication failure 可能留下本次创建的空父目录，但不会清理未知目录。
- 未执行 `fsync`，因此不保证断电 durability。
- 模型非确定性、未暴露的后端 revision 和隐式服务端输入限制可重现性。
- observed file inventories 不能证明 fixture 外零写入。
- 两个 value cases 均来自同一 CLI component，不能代表所有项目形态。
- 单 active report 在确认替换后不保留旧 need；本方案不增加 archive mode。