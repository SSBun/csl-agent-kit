# 优化 Workspace Context 检索与记录系统

Status: Completed (2026-08-09 19:48)
Kind: Plan

## Scope

- 包含：重写 `workspace-maintain-context` 的 dispatch/query 与维护契约，新增只读 Context CLI，bootstrap `tasks/context.md` 的最小 Project Core，并同步 interface metadata、query/admission eval、focused tests、默认 Agent rules、workflow gates 与 `csl-task` 的 Context consumer wording。
- 排除：批量迁移现有 legacy Context、改变 CSL Tasks 状态核心、修改 Workspace Lessons、生成持久 index/cache，或让 Context 取代任务直接相关源码验证。

## Target
- [x] T1: 新 Agent 在 session start/resume/compaction 加载 Project Core，并在接收任务后通过 `core/index/show` 获得通常 1–3 个完整 Context Packs，无需重新进行宽泛 repo exploration 或项目分析。
- [x] T2: 单一 `tasks/context.md` 包含可校验的 Project Core 与稳定 `CTX-*` Packs；Pack metadata、允许的正文 sections、Authority、Recheck 和分级写入权限符合已批准契约。
- [x] T3: 当前已确认内容生成最小 Project Core，现有 Components/Relationships/Decisions 保持 legacy 并可由临时 hash IDs 查询；只有实际触及的内容才渐进迁移为正式 Pack。
- [x] T4: 默认 Agent rules、workflow gates 与 `csl-task` 不再要求无差别读取完整 Context；CLI self-test、focused tests、query/admission eval、routing、OpenAI validation、Yao、resource-boundary 和 `git diff --check` 满足最终门禁。

## Decisions

- Context 的首要责任是让任务可直接 dispatch 给新 Agent，使其无需重新进行宽泛 repo exploration 或项目分析；检索可靠性与 record 质量服务于这一目标。
- 优先目标同时包含检索与应用可靠性、record 质量和可解析性；单纯压缩 token 或清理当前数据不是主目标。
- 保留 Context 只承载已确认、项目特有、稳定且会改变未来决策的事实；Tasks、Lessons、rules、SOP、ADR 与实时状态继续由各自载体负责。
- 当前 `SKILL.md` 的 admission、mutable value、temporary fact 与 same-work maintenance 语义是基线，不得为了缩短文件或通过 Yao token 预算而失真。
- 当前 `tasks/context.md` 约 21 KB，使用 section 下的自由格式 bullets，无稳定 record ID 或确定性 query boundary；现有 contract tests 主要验证 admission 语义，不验证任务相关检索。
- Context 必须同时提供最小 Project Core（项目定位、术语、组件边界和关键关系）与任务相关 records；只做后者会让新 Agent 缺少形成正确 Task Fingerprint 的词汇。
- “无需重新探索”明确指跳过宽泛 repo exploration、repo-map 和重复架构分析；新 Agent 仍须读取 Context 指向的任务直接相关源码与测试，并验证可能变化或高后果的事实。
- 采用 Hybrid Script + Agent：只读 Node 脚本负责 Project Core、record index、按 ID 读取、legacy compatibility 和 schema validation；Agent 负责 Task Fingerprint、语义匹配、来源验证与写入判断。
- 脚本不得语义匹配、修改 Context、执行验证命令或建立持久缓存；使用 Node 标准库。
- 新建或实际修改的 records 采用 v1 schema，legacy content 渐进兼容，不批量迁移当前约 21 KB Context。
- 继续使用单一 canonical `tasks/context.md`：顶部 `Project Core` 始终加载，后续 indexed records 按任务查询；不拆分 records 目录或生成持久 index/cache。
- 脚本最小查询面包含 `core`、`index`、批量 `show <id>...`、`validate` 和 `--self-test`。
- Context 采用 `Project Core + Context Packs`，不是 Lessons 式单事实 records；完整 Context 是 Core 与全部 Packs 的组合，任务查询单位是完整 Pack。
- `Project Core` 始终加载，固定覆盖 Purpose、Global Vocabulary、System Map 与 Global Invariants，使新 Agent 能形成正确 Task Fingerprint。
- 每个 Pack 使用稳定 `CTX-<ascii-slug>` ID；required metadata 为 Scope、Paths、Keywords、Authority 与 Recheck，正文从 Purpose and Boundaries、Vocabulary、Structure、Relationships、Workflows、Decision and Verification Boundaries 中保留适用章节且不得创建空章节。
- `index` 只返回 Pack ID、title、Scope、Paths 与 Keywords；`show` 批量返回完整 Pack。Agent 选择通常 1–3 个 Packs，并读取其 Authority 指向的直接相关源码。
- 首次实施采用 Bootstrap Core + 渐进迁移：从已确认内容提炼最小 Project Core，保留现有 Components/Relationships/Decisions；脚本把每个 legacy bullet 暂作 `legacy-<content-hash>` 候选 Pack。
- 当实际任务触及某组件时，才把相关 legacy bullets 合并为正式 `CTX-*` Pack，并删除已迁移的原 bullets；不一次性重写当前约 21 KB Context。
- Context 持久写入采用分级权限：权威源码明确证明的普通 Pack 新增、更新或删除可在所属任务中自动执行并校验；Project Core 的任何持久变更必须先展示精确 diff 并取得确认。
- 来源冲突、用户业务判断、无法证明的事实和任何批量迁移都必须暂停并询问；写后校验失败时恢复写前内容。
- Pack 选择采用有界召回优先：标题、Scope、Paths 或 Keywords 存在合理匹配即进入候选；Agent 通常选择 1–3 个完整 Packs，按直接路径、组件边界和跨组件依赖排序，不静默加载全部 Context。
- Session start/resume/compaction 运行 `core`；形成 Task Fingerprint 后运行 `index` 与一次批量 `show`；重要决策前验证 Authority；结束前维护发生变化的 Packs 并运行 `validate`。
- `tasks/context.md` 缺失、Project Core 无效或无法获得可信相关 Packs 时，Agent 必须披露 Context 不可用并回退普通探索，不得假装具备 dispatch-ready 模型。
- 脚本失败时允许人工执行同一 Core/metadata/Pack 读取；duplicate ID 或相关 malformed Pack 禁止自动应用，Authority 与 Context 冲突时以 Authority 为准并在同一任务更新 Pack。
- 普通 Pack 写后校验失败必须恢复写前内容；Project Core、用户判断、来源冲突、无法证明的事实与批量迁移维持显式确认/询问门禁。
- 用户已批准完整数据流、失败策略与实施/验证边界。

## Plan

1. 将 Project Core、Context Packs、session/task lifecycle、Authority verification、分级写入与降级策略写入 `workspace-maintain-context`，并同步 interface metadata。
2. 用 Node 标准库实现只读 `core/index/show/validate/--self-test` CLI，覆盖 v1 Packs、legacy bullets、缺失/无效 Core、duplicate IDs 与 deterministic diagnostics。
3. 从当前已确认内容 bootstrap 最小 Project Core，保留 legacy sections；同步默认 Agent rules、workflow gates 与 `csl-task` 的 Context consumer wording。
4. 扩展 focused contract/CLI tests、query/admission fixtures 与 routing cases，验证同一候选 Context 的生产、查询、消费和渐进迁移边界。
5. 运行 CLI self-test、实际 Context 校验、相关 Node tests、routing、OpenAI validation、所有受影响 skill 的 Yao/resource-boundary、残留搜索、`git diff --check` 与 CSL Tasks 门禁。

## Result

- T1: 实际 `core/index/show` 已从当前 workspace 加载 Project Core，并按 metadata 命中、批量读取 `CTX-workspace-context`；query lifecycle tests 通过且默认消费者限制通常选择 1–3 Packs。
- T2: `context.js` 校验 Project Core、稳定 CTX ID、五项 metadata 与允许的非空正文 sections；fixture 同时通过写入格式和 CLI 消费测试。
- T3: `tasks/context.md` 已加入有效 Project Core 与正式 `CTX-workspace-context`，其余 50 个 legacy bullets 保持原位并以 deterministic hash IDs 可查询。
- T4: `super-agent`、workflow gates 与 `csl-task` 已改为 Core + relevant Packs；npm tests、routing 13/13、OpenAI quick validation、CLI self-test、Context validation、symlink comparison 与 diff check 全部通过。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查；按显式 review gate 跳过。

## Verification

- Passed: `npm test` 全绿；Context CLI self-test/actual validate、routing eval、OpenAI quick validation、symlink consumer comparison 与 git diff check 通过；两项 Yao 仅有已允许的 1000-token initial-load overage。
