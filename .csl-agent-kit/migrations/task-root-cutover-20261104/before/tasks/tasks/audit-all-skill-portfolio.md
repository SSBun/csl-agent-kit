# 审计全部 Skills 的价值、问题与精简机会

Status: Completed (2026-09-11 18:09)
Kind: Task

## Scope

- 审计共享发布与项目本地发现的全部 Skill package，包含当前未提交内容；外部全局安装 Skills 不属于 CSL Agent Kit 清单。
- 只读评估，不删除、修改或重命名 Skills，不运行单元测试、项目测试、实际发布、审批或付费生成操作。

## Plan

1. 核对全部 Skill package、发现与分发边界，并执行只读结构验证。
2. 分别审计 dev、domain 与项目本地、meta 三组 Skills 的独特价值、职责重叠、契约一致性和依赖风险；只读子 Agent 返回逐包覆盖与证据。
3. 主 Agent 复核候选问题、跨组重叠与移除依赖，汇总有优先级的建议和证据边界。

## Target
- [x] T1: 覆盖 CSL Agent Kit 全部 Skills，识别价值不足、职责重叠或存在问题的候选，并给出证据与不确定性。
- [x] T2: 给出可移除或优化的建议及优先顺序，不直接删除或修改 Skills。

## 审计证据

- 审计基线：main，HEAD `0f14393430bcae1bb8d807542f2841151c2619e4`，包含预存未提交改动。对 skills、项目本地整合包及 evals/skills 内 152 个非 node_modules 文件按 canonical 路径与内容计算 SHA-256：`a1948765f9fb58a454a6b6096e55edac47b26f536b765fec1950a06c0c82e299`。
- 实际发现 30 包（共享 28＋项目本地 2）；Claude manifest 对应全部 28 个共享包，无缺项或多项。README Skills 表缺少 eli5、project-index、yunxiao。
- `skill-quality --all --workspace .`：17 pass、12 warning、0 failure，但漏掉项目本地目录软链接 task-target-alignment-eval；单包补查为 warning、0 failure。合计 30 包为 17 pass、13 warning、0 failure，警告均为 context budget。
- 22 个 JS/MJS/Shell 文件仅做 node --check／bash -n 语法检查，0 failure；没有运行单元测试或项目测试。Context validate 通过。
- 15/30 包有 trigger_cases.json，13/30 配有确定性 routing 分类；这不证明真实模型触发准确率。入口总量按门禁算法估算约 41,914 tokens，不代表会话会同时加载全部正文；全部 descriptions 合计 9,437 字符。
- 已核实 tldr 指向未分发的 research；beautiful-mermaid 当前 require.resolve 返回 MODULE_NOT_FOUND，NODE_PATH 未设置，Node 默认解析目录不含 npm global root。未安装依赖或调用渲染。
- 并行只读审计运行 `601cc5ca-2d7a-437f-afba-f597250599b4` 的 dev、domain/local、meta 三组均 completed，覆盖全部 30 个入口全文。主 Agent 复核以下问题的关键源码；复核后 152 文件的内容摘要与基线一致。
- 子 Agent 的范围报告保存在该运行的 managed artifacts：`audit/dev.md`、`audit/domain-local.md`、`audit/meta.md`。本记录保存最终裁定，不采用其模板中的 Merge verdict 作为批准证据。

## 审计结论

没有足够证据建议无条件删除任何完整能力。优先修复行为缺陷与契约矛盾；`eli5`、`task-grill` 可在保留用户需要的交互与产出后，合并为其他能力的显式模式或轻量命令。知乎专用 Skills 可考虑可选分发，而不是删除源码。未获得调用遥测，不能宣称某项无人使用。

### 完整逐包建议

“保留”仅表示本次没有发现值得单列的包级问题，不表示穷尽验证或运行时认证。每个共享包的权威入口为 `skills/<分组>/<name>/SKILL.md`。

| 分组 | Skill | 建议 | 独特价值与本轮行动 |
| --- | --- | --- | --- |
| dev | adversarial-review | 优化后保留 | 交付物审查、整改、复审与批准闭环；澄清独立批准和模拟模式的边界（A17）。 |
| dev | align | 优化后保留 | 对上一条回答重新取证、解释和撤回；统一图示可选条件（A18）。 |
| dev | beautiful-mermaid | 修复后保留 | 确定性的 SVG／ASCII 渲染；修正依赖解析、ESM 入口和主题调用（A05）。 |
| dev | brainstorming | 优化后保留 | 探索未定需求与设计选项；减少按固定字数逐节确认，保留真正的用户决策检查。 |
| dev | bug-fix | 保留，可做小优化 | 复现—定位—最小修复—验证具有独特约束；可明确验证遵守宿主授权，不把某一用户的测试限制写成普遍规则。 |
| dev | deliberate | 保留 | 显式启动多视角迭代以形成充分答案；SUFFICIENT 不等于交付物 APPROVED，不与审查包机械合并。 |
| dev | eli5 | 有条件合并 | 入口只有 10 行，核心是零基础、大图少字的 HTML 图解。可变为视觉解释预设／命令；不能直接并入只输出聊天的 tldr 而丢失 HTML 产出。 |
| dev | git-conflict | 保留 | 活跃 merge/rebase、冲突阶段、ours/theirs 陷阱与窄范围暂存的约束，不能被一般 bug-fix 替代。 |
| dev | project-index | 修复后保留 | 人工确认的跨仓库职责、页面快照和覆盖声明；修复快照边界、失效仓库恢复及总大小检查（A04、A09、A10）。 |
| dev | repo-map | 优化后保留 | 仓库职责、术语和调用关系导航；统一 CodeGraph 写入授权（A14），避免为满足固定术语数填充内容。 |
| dev | tldr | 优化后保留 | 有来源的简略／深入聊天解释；修复不存在的 research 路由（A19），不与复核旧回答或仓库地图混同。 |
| domain | create-app-icon | 修复后保留 | 源图审批、抠图与平台材料验证不是普通生成提示词；修复主体颜色受损（A02）。 |
| domain | figma-describe | 修复后保留 | 框架无关设计树转换；接入已有 payload 或收窄 MasterGo hook（A06）。 |
| domain | venom-cli | 可选分发并优化 | 知乎 iOS 构建和组件导航；明确 doctor --fix 属于写操作（A13）。小众不等于无用。 |
| domain | yunxiao | 可选分发并修复 | 真实的 MR、审批、daemon 与 Dashboard 能力；修正部分失败的机器状态（A03）。 |
| meta | agent-hooks | 修复后保留 | 条件自动化和宿主事件适配；保留禁用状态、消除库存读取隐式迁移，并裁定持久指令归属（A01、A11、A16）。 |
| meta | agent-rules | 优化后保留 | 无条件持久规则的管理入口；与 Hooks 保持分层，消除同一指令的双重默认载体（A16）。 |
| meta | agent-sops | 优化后保留 | 按需过程指引、同名覆盖和候选检索；管理路径应与运行时环境覆盖一致（A15）。 |
| meta | archive | 修复后保留 | 从真实 Pi 分支逐字归档，不是摘要；拒绝断裂父链和重复 entry ID（A08）。 |
| meta | skill-quality | 修复后保留 | 日常确定性门禁不能删除；补齐目录软链接发现（A07），不将结构通过等同运行正确。 |
| meta | task | 优化后保留 | 状态、证据与完成门禁的核心所有者；减少重复权威和重复加载，不删除必要控制。 |
| meta | task-context | 优化后保留 | 持久项目事实与 Authority；重新评估局部 Core 错误引发整文件替换的设计（A12）。 |
| meta | task-grill | 有条件合并 | 19 行的压力访谈与记录纪律，可成为规划／决策的显式模式；保留一次一问、每题推荐、用户决定和既有任务不记访谈流水账。 |
| meta | task-lessons | 保留 | Trigger／Rule／Check 的行为防复发，与 Context 的项目事实不同，不建议合并。 |
| meta | task-maintenance | 保留，优化执行成本 | 精确批准、引用完整性、隔离与禁止覆盖的历史迁移；不得把当前执行分支必需的安全步骤压缩或拆散。 |
| meta | task-plan | 保留 | 规划对齐不授权执行；不能为减少入口而削弱阶段权限。 |
| meta | task-queue | 保留 | 有序父子关系和独立父级集成验证，不等于单任务的多步骤。 |
| meta | task-review | 保留 | 新鲜、只读、一次反馈；任务所有者持有整改循环，区别于 adversarial-review。 |
| project-local | integrate-third-skills | 保留且维持本地 | `.agents/skills/integrate-third-skills/SKILL.md`；保留上游来源、许可证、版本及本地修改的导入流程。 |
| project-local | task-target-alignment-eval | 保留且维持本地 | `.agents/skills/task-target-alignment-eval/SKILL.md` 指向 `evals/skills/`；协议评测和真实模型行为验证，不是 task 执行流程副本。 |

### 应优先修复的缺陷

优先级是建议处理顺序，不是已证实的生产事故等级。除 A07 的门禁漏检和 A05 的当前模块解析失败外，以下运行行为主要由源码路径推导，未执行对应业务操作或回归测试。

1. **A01／优先：agent-hooks 替换更新可重新启用禁用规则。** `skills/meta/agent-hooks/scripts/lib/cli.js:107-119` 的 `update --from` 直接保存 replacement；`scripts/lib/rule.js:61` 将省略 enabled 归为 true，与 `SKILL.md:50` 要求保留 enabled 冲突。修复应保存原开关，启停仍须明确操作。置信度高。
2. **A02／优先：create-app-icon 抠图误伤合法主体颜色。** `skills/domain/create-app-icon/scripts/remove-green-background.mjs:141-167` 对不以绿色为主的颜色也降低 alpha。按公式，纯绿背景上的不透明 `(255,170,85,255)` 暖橙色会变为约 `(255,128,128,170)`；现有输出检查只验证比例、格式与角落，不能证明颜色保真。收窄色键／解混适用范围，并在未来获准测试时覆盖暖色与边缘。置信度高，数值为静态推导。
3. **A03／优先：yunxiao 未完成全部步骤仍返回 completed。** `skills/domain/yunxiao/scripts/yunxiao.mjs:1550-1626,1687-1693` 的 `syncChecks` 吞掉自测／QA 写入异常，只加 warning；调用者可能仍返回 completed。与 `references/manifest-schema.md:93,103-104` 的步骤和 partial 契约冲突。建议传播结构化失败、保留已经创建的 MR，禁止盲目重放远端写入。置信度高，未调用内部服务。
4. **A04／优先：project-index 快照读取没有重验真实路径边界。** `skills/dev/project-index/scripts/project-index.js:113-132` 写入验证 realpath，但 `:232-250,405-413` 的读取仅做非文件检查及 stat。快照后来变为目录外图片的软链接时仍标记 available。应在返回可加载路径前复用目录归属检查。置信度高，触发场景未复现，也未检查个人索引数据。
5. **A05／优先：beautiful-mermaid 安装、加载和主题示例失配。** `skills/dev/beautiful-mermaid/SKILL.md:11-17,34,52` 使用 require、全局安装及 `{theme:...}`；当前项目 require.resolve 实际报 MODULE_NOT_FOUND。已存在的全局 1.1.3 包 exports 只有 bun/import/types，库 `dist/index.js:9232-9247` 读取 bg/fg 等字段而不读取 theme。建议同一明确解析的 ESM 路径用于 preflight 和渲染，主题传入 `THEMES[name]`，声明验证版本。置信度高，未生成 SVG 或联网查询其他版本。
6. **A06／优先：figma-describe 与设计数据 hook 输入不一致。** `hooks/hooks.json:84-90`、`pi/extensions/csl-context-hooks.ts:92-96` 在 Figma 或 MasterGo 获取数据后强制路由；`skills/domain/figma-describe/SKILL.md:10,18-30` 却只接受 Figma URL／MCP 并从重新获取开始。仅有 MasterGo 时被错误阻塞。应支持已有数据输入，或暂时收窄 hook；不应为“精简”删除有用的设计树能力。置信度高。
7. **A07／优先：skill-quality --all 不是真正全量。** `skills/meta/skill-quality/scripts/check.js:334-339` 只递归 Dirent.isDirectory；实际漏掉 `.agents/skills/task-target-alignment-eval` 目录软链接。全量输出 29 包而真实发现为 30，单包可正常检查。应跟随受支持的目录链接，结合 realpath 去重和环检测。置信度高，有本轮命令证据。
8. **A08／后续：archive 对断裂父链未 fail closed。** `skills/meta/archive/scripts/archive-session.mjs:80-91` 在找不到非空 parentId 时结束遍历，Map 也会覆盖重复 ID；所选端点只要仍在截断后的列表内就可继续。与入口要求来源／分支可靠不符。应区分正常根和断链，拒绝重复 ID。置信度高，未操作真实会话归档。
9. **A09／后续：project-index 无法逐条恢复多个失效仓库。** `skills/dev/project-index/scripts/project-index.js:148-171,214-225,542-552` 的单条 upsert 严格验证所有仓库是否仍存在；两个仓库同时搬迁时，修任一条都会被另一条拦住。应对更新记录严格校验，对全局结构／唯一性保持检查，将其他记录实时不可用作为诊断。置信度高。
10. **A10／后续：project-index 可成功写入随后拒绝读取的超大索引。** 同脚本 `:242,263-273,534-553` 有读取总量限制和单条输入限制，却没有最终序列化总大小检查。应在原子替换前检查相同上限，失败保留原文件。置信度高，现实触发频率未知。

### 契约与设计需要收敛的地方

11. **A11／设计风险：Hooks list/show 会迁移旧数据。** `skills/meta/agent-hooks/scripts/lib/store.js:98-145,187-188` 在解析目录时执行复制、协议改写、rename、旧目录删除及忽略文件修改；`cli.js:63-79` 的库存读取进入该路径。这是已有实现和测试明确支持的一次性迁移，不是未知回归。建议让读取返回迁移诊断，将迁移放到显式授权操作；不声称当前已发生数据丢失。
12. **A12／设计风险：Context 局部格式错误引发整文件替换。** `skills/meta/task-context/SKILL.md:14,163-165,199-207` 明确授权无有效 Core 时仅重建 Core、不保留旧内容；`scripts/context.js:63-108` 的格式错误即可触发失败。这可能移除仍有效的 Packs。建议区分局部 Core 损坏与全文件非标准化；该建议改变当前已明确的契约，须另获批准，不能当作无意 bug 静默修正。
13. **A13／契约矛盾：venom-cli doctor --fix 的权限分类不清。** `skills/domain/venom-cli/SKILL.md:50,87-88` 推荐自动修复，同时将未限定参数的 doctor 归为无需确认的读取。应明确只有无修复参数的 doctor 是读取，--fix 属于写操作。置信度高；未确认外部 CLI 当前所有版本的行为。
14. **A14／契约不一致：CodeGraph 的 init/sync 授权。** `skills/dev/repo-map/references/repo-map-workflow.md:36-37` 允许直接生成／更新索引，`skills/dev/project-index/SKILL.md:39` 则要求先确认。建议轻量只读理解默认查询现有索引，写入遵守一致的授权条件，不能写时回退源码搜索。
15. **A15／条件性缺陷：SOP 管理目录与加载器不一致。** `skills/meta/agent-sops/SKILL.md:15,100,118` 固定默认路径，而 `scripts/sop-candidates.js:91-94` 与 `scripts/sop-summaries.sh:6-8` 支持 `CSL_AGENT_KIT_SOPS_DIR`／`CSL_AGENT_KIT_HOME`。有环境覆盖时可能创建或修改到不生效目录。应共用解析顺序，保留默认行为。
16. **A16／职责重叠：无条件持久指令有两个默认载体。** `skills/meta/agent-rules/SKILL.md:3,30,39-41` 归 Rules；`skills/meta/agent-hooks/SKILL.md:30-38` 又将未来会话 directive 归单条 global hook。建议明确默认路由和跨载体查重，保留用户显式选择；不能直接删除其中一个基础机制。
17. **A17／契约歧义：独立审查与模拟批准共享 APPROVED。** `skills/dev/adversarial-review/SKILL.md:19,35` 同时写无独立 Reviewer 则 fail closed、经确认的模拟模式可 APPROVED；`references/subagent-dispatch.md:127-131` 允许且要求披露模拟。现有流程没有静默降级，但仍应明确模拟结果不能满足尚未取消的独立批准要求。主张区分证据等级，不将其误述为已经伪造审查。
18. **A18／低成本优化：align 图示是否必需有两套规则。** `skills/dev/align/SKILL.md:15,26` 按是否改善理解决定；`references/align-method.md:37,52-59` 除严格 trivial 情况外强制。统一为有价值时才使用，保留重新取证与撤回要求。
19. **A19／低成本修复：tldr 悬空 research 路由。** `skills/dev/tldr/SKILL.md:12` 指向 `research`，实际全量清单及当前分发没有同名 Skill。应改为可用的宿主研究能力／任务流程，或声明可选外部依赖，不要求用户为此新增一个同义 Skill。
20. **A20／低成本修复：文档清单与当前分发／审查分级不同步。** README Skills 表漏列 eli5、project-index、yunxiao；task-review 行仍泛称文件变更强制审查，而当前 SKILL.md 已限定 R2 mandatory pass。Claude manifest 28 项与共享发现完全一致。建议从 canonical 发现结果验证文档清单及语义，避免只维护名称数组。

### 精简顺序与不应删除的边界

1. 先处理 A01–A07 的开关、数据保真、错误状态、读取边界、可运行性与门禁覆盖，再补相应的授权行为验证。
2. 修正其余当前矛盾；A11、A12 等明确设计选择单独讨论并确认，不伪装成机械修复。
3. 统一 Rules／Hooks 的持久指令所有权；Task 系列减少重复权威和不必要加载，而不是合并不同授权阶段。task 入口约 5,528、task-context 3,651、task-lessons 2,511、Target 协议 6,119、注入 Contract 3,289 estimated tokens；它们合计约 21.1k 是文档体量估算，不是每次调用实测消耗。
4. 再考虑 eli5、task-grill 的条件合并；默认发现清单减少最多两项，但实际节省 token／误触发尚未测量。需要保留输出和交互差异、检查 README／manifest／命令／规则／Context／测试消费者。
5. 将 yunxiao、venom-cli 的是否默认启用与是否保留分开；npm 整包仍统一声明 mqtt／classic-level 等依赖，简单禁用 Skill 不等于减少安装依赖。未测安装成本，不建议未经验证立即拆包。
6. 保留所有核心验证、权限和证据机制。csl-tasks/shared 不是 Skill，但为必要共享依赖，不能因缺少 SKILL.md 被清理。

### 验证限制与自检

- 本轮是完整入口覆盖＋定向源码审计，不是全部代码路径、平台和远端服务的穷尽测试。22 文件语法检查和结构门禁通过不证明运行正确；13 个预算 warning 不是 13 个故障，也不能据此删除必要工作流。
- 未运行测试／自测、付费模型或图片生成、安装、内部 API、审批、Hook 执行或真实归档；未读取个人项目索引或认证数据。
- 单叶安装能否带齐 csl-tasks/shared 与 npm 根依赖仍是跨分发路径的待验证风险。README 允许单项安装，但本轮未执行 npx skills 安装，不将可能的依赖缺失冒充实测失败。
- 最可能的误判已处理：软链接漏项以补查及逐包清单校验覆盖；小众／无遥测不等于无用；静态推导与实测分开；脏工作区以实际内容哈希复核；移除建议保留依赖和差异化语义，未执行删除。
- 外部用户特有测试授权规则不计为共享 Skill 的普遍缺陷；未采纳为了预算而拆散当前工作流核心契约的建议。没有新增永久 Context 或 Lessons。

## Result

- T1: 已逐项覆盖 28 个共享与 2 个项目本地 Skill 入口；三组只读审计均完成，主 Agent 复核关键源码。完整逐包表与发现 A01–A20 见本记录；名称集合校验 30/30、无缺失或重复。区分源码推导、设计风险与本轮命令证据。
- T2: 给出优先修复清单、eli5/task-grill 有条件合并、知乎两包可选分发与 Task 契约去重建议；没有无条件删除建议。152 个源码文件摘要复核不变，未修改任何 Skill，未把无遥测或预算 warning 当作无用证据。
- Review gate: Skipped — 当前 R0 审计仅产出反馈与任务记录，无交付物改动；不递归审查或批准审计自身。三组只读分析作为来源覆盖证据，不冒充审批。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 只读全量 Skill 组合审计与建议，未修改请求范围的交付物；仅维护所属任务记录及索引。用户没有要求对审计结果另做独立批准。
- Snapshot: no-file audit-v1；本记录审计结论正文 SHA256=6d1716818c65c4d819b320afa51858158ee80a4405ad73fdf6bcafb5ef952c16；152 源码文件 SHA256=a1948765f9fb58a454a6b6096e55edac47b26f536b765fec1950a06c0c82e299
- Evidence: 本记录审计证据、完整逐包建议、A01–A20 与验证限制；30/30 清单验证，结构门禁 0 failure，22 文件语法检查 0 failure；已检查五类最可能误判并保留未运行测试的限制。
- Task fingerprint: 352537bfb331d9281f418acccfab453a198fdc8af66280aee7d85ad3b948165b

## Verification

- Passed: 终态核对审计正文与 152 个源码文件的 SHA-256 均未变化；30/30 Skill 名称覆盖无缺项或重复，所属任务 diff --check 通过；结构补查与语法检查证据已记录，测试和真实业务验证未执行。
