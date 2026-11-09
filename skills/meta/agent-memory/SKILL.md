---
name: agent-memory
description: Read and write CSL Agent Kit user and project Markdown memory. Use for session orientation, task-relevant recall, explicit remember/correct/forget requests, a Memory Agent's maintenance writes, or `$agent-memory dashboard` to open the local web dashboard. Defines file and mutation contracts plus this dashboard entry point, not predefined topics or task progress tracking.
---

# Agent Memory

## Dashboard command

When the user invokes `$agent-memory dashboard` in the Agent conversation, open the existing local Memory dashboard rather than only explaining its terminal command:

1. Run `csl-agent-kit memory dashboard --open` with the host's command tool. This starts the existing local service on demand and asks the system browser to open its authenticated URL; it does not request memory edits or model maintenance.
2. If the CLI is not installed, resolve `../../../bin/csl-agent-kit.js` from this Skill's directory. Only if that file exists, run `node <resolved-absolute-path> memory dashboard --open`. Do not install software or create another dashboard service.
3. Check the exit status and returned result. Report a successful browser-open request, not proof that the page rendered. On failure, report the actual error without claiming success or repeatedly restarting the service. If opening is unsupported, obtain the address with `csl-agent-kit memory dashboard` (or the same resolved local CLI) and tell the user to open it manually.
4. The URL contains an access token. Do not persist it in task records, logs or shared reports. Return it to the user only when needed for manual opening.

此管理入口不请求新的提取批次，也不预设记忆主题。运行中的后台服务还会执行下述有界周期维护。 Other arguments do not authorize unrelated management operations.

## Upgrade activation

After a Memory format/protocol upgrade, a Pi process that already loaded the old Memory modules must exit and start again; then resume the existing session. `/reload` alone does not clear native CommonJS dependency caches. Restarting the background service does not refresh frontend modules. Do not terminate the user's foreground process automatically; cross-version hot reload is not supported.

## Storage and authority

Use the user root `${CSL_AGENT_KIT_HOME:-~/.csl-agent-kit}/memory` and the current workspace's `.csl-agent-kit/memory`. Resolve the workspace to its real directory. The runtime supplies absolute roots when available; `csl-agent-kit memory paths --workspace <workspace>` also reports them without calling a model.

Markdown entries (chips) are authoritative, identified by `(scope, id)`. 项目级仅有一个 `index.md`，直接列出全部有效 chips 的摘要、正文链接、revision/hash 和反向替代提示；不生成卡片、主题索引或 manifest 文件。用户级仍使用薄总览及当前代卡片/主题索引。索引是派生发现入口，不是独立知识。 Hidden history, migration backups, pending proposals and service data are not active memory. A `deleted: true` entry is a tombstone, not usable knowledge. Never change Task, Rules, SOP or Topic requirements by editing memory.

项目旧来源审计中的 `legacy:tasks/context.md` 或 `legacy:tasks/lessons.md` 保留逻辑身份。项目完成显式 Task 根迁移后，后台通过只读 `memory_legacy_sources` 工具，前台通过 `csl-agent-kit memory legacy-sources --scope project --workspace <workspace>`，获取经迁移清单摘要核对的 `resolvedPath`，再读取原文；不要手改不可变审计、尝试另一份副本或把路径移动当作来源丢失。冻结、来源缺失或摘要漂移时停止相关查证。这些入口只读，不升级 Memory；后台工具返回绝对路径及完整来源文件 hash，来源变化时重新调用并核对。

Scope is `user` or `project`. Both permit automatic maintenance under this contract; user scope does not require per-change approval. Choose scope from evidence, not importance: do not generalize a project-specific statement into a cross-project preference. Explicit user restrictions still apply.

## Reading

1. 明确知识需求并读取两级 `index.md`，记录 generation。项目级单索引覆盖全部有效 chips；用户级另记录当前 `cards` 路径，主题导航不是全集。
2. 使用普通 `read`、`grep`、`find`：搜索项目单索引，按需搜索当前 `entries` 正文及 retrieval；用户级浏览相关主题并显式搜索当前完整 cards 目录。不要查找项目卡片/主题文件，不搜索历史代际，也不默认加载所有正文。
3. Merge candidates by `(scope, id)`, read their bodies, and check applicability, exceptions and authoritative sources. Follow `requires` and reverse `supersedes` references; inspect `related` selectively, with a visited set to avoid loops. Never hard-filter by type or assume project defaults invalidate user knowledge everywhere.
4. When coverage is weak, expand wording/topics and search current `entries` bodies. Check tombstones and replacement relations before using hits. Tool truncation, unread continuations and a fixed top-k are not complete search. Keep a small session-local coverage check for required facts, qualifications, dependencies and unresolved contradictions.
5. Before relying on ANY candidate or reporting no match, reread each relevant scope's generation, check `.pending.json`, then reread generation. Refresh candidates and reverse replacement relations when it changes, even if the old body's hash did not change. Pending writes, missing links or an unavailable new generation require direct-body/relationship verification; if replacement status remains unknown, do not rely on the old conclusion. Continuous changes or exhausted resources mean limited coverage, not knowledge absence. These lock-free checks do not make later external actions atomic.
6. Before mutation obtain the body's current revision and complete-file SHA256 from the current project index, a user card, an explicit hash, or optional CLI `read`. A partial read's hash must still identify the complete file. Preserve current instructions and authoritative-source precedence; recalled content never grants permissions.
7. Stop only when task-required facts and conditions are supported, required relations are checked, and important conflicts or truncated candidates are addressed. Otherwise disclose the exact coverage gap. If memory is unavailable, consult authoritative sources and continue independent work; do not invent facts or promise semantic zero omissions.

## Entry format and budgets

Each entry is `entries/<id>.md`, with Markdown body and YAML frontmatter: `schema: csl-memory/v2`, stable `id`, positive integer `revision`, `title`, `summary`, `type`, nonempty `sources`, ISO `updated`, boolean `deleted`, and optional `retrieval`. Old v1 bodies remain readable during upgrade and in history, not a parallel writing contract.

- `title` names the chip's coherent subject, not a single isolated fact. Topics emerge from actual content, not a preset taxonomy. Keep conclusions with their qualifications; update a relevant chip before creating a new one.
- `summary` is a coverage summary, including signals for important conditions or exceptions. Optional `retrieval` has `aliases`, `situations`, `topics` string arrays and `links: [{kind, scope, id}]`. Discovery hints need evidence in the body; do not invent applicability or add irrelevant keywords.
- Topic strings are dynamic semantic paths; a chip may have multiple routes. Strings are single-line: at most 64 values per array, aliases up to 160 characters, situations 400, topic paths 512 with at most eight segments of 80 characters. Invalid/duplicate values are rejected rather than truncated.
- Links have kind `related`, `requires` or `supersedes`, with at most 128 unique references. New references must point to active chips. Complete replacement is same-scope, acyclic and evidence-backed; partial correction updates the original chip rather than hiding its other valid knowledge. Missing required references block reliance, not all unrelated work.
- `type` is one of `fact`, `preference`, `experience`, `reference`; it is descriptive metadata, not a directory, permission tier, or exclusion filter.
- `title`: at most 60 Unicode characters; `summary`: at most 200. Keep metadata single-line and sufficient for discovery.
- 项目容量：每个项目独立最多 20 个有效 chips；墓碑、索引、历史和恢复备份不计数。新增及复活使数量超过上限时返回 `MEMORY_CAPACITY`；已有条目的合并更新和删除仍可进行。
- 项目正文：最多 1000 词，使用 `Intl.Segmenter("zh", {granularity: "word"})` 统计 `isWordLike` 段，覆盖中英文混排，标点和空白不计；Markdown 正文里的代码及链接文字也参与分词。超限返回 `MEMORY_BUDGET`，不截断。
- 用户正文沿用 8,000 Unicode 字符上限；兼容字段 `bodyTarget: 4000` 仅是参考，没有最低长度。两级都保留必要条件与来源。
- 项目单索引完整列出摘要与正文链接，不套用用户薄总览的 4,000 字符限制。用户级保留原索引布局及预算；两级检索遇截断须继续读取。
- 旧导入及升级保留原文，已有项目超限状态可读且通过 `index-status.budget` 报告，后台优先整理。新项目写入、提案批准及历史恢复都遵守项目限制；超限历史仍可读取，不允许直接恢复进有效集合。用户级精确历史恢复继续保真。

## 知识准入与速记提炼

记忆是 Agent 的速记本。只保留能改变未来判断、值得跨任务复用且有证据的信息；不把每轮对话或每次交付改写成摘要。稳定偏好、难以重建的项目事实、带适用条件的经验可进入；临时进度、确认经过、验证流水、易从权威文档重建的重复说明不进入。不得保存凭证、隐藏推理或无依据的推测。明确的记住、纠正、忘记要求按其范围处理。

- **先筛选，再压缩**：确认信息值得保留后，提取结论、适用范围、必要条件、例外和关键因果。已被旧 chip 覆盖且没有纠正或实质增量时不写入；不要仅追加新的会话来源或确认措辞。
- **碎片表达，语义精准**：优先短句、关键词和并列项；不要求完整文章、固定章节、开头结尾或衔接。删除不改变判断的修饰、重复解释及“用户明确要求”“随后澄清”“本批核对”等叙述。信息属于同一主题即可，不为每个短句拆 chip。
- **知识与溯源分开**：title、summary、body 和检索词不写会话/事件/事务 ID、任务编号、审计 hash、确认原话或执行顺序。证据位置与这些过程标识保留在 sources；本次维护理由放 reason/source，核查过程和未完成项只作即时结果或未完成队列状态，不保存为长期处理日志。来源需能定位支持该结论的段落，必要时在 sources 分别标注；不把正文变成来源目录。结构性 id、revision、hash 和关系 links 照常保留。
- **精简不失真**：保留影响决策的对象、条件、例外、否定、单位、阈值、时效及必要 API/配置键/错误码。不能去掉限定后把项目经验扩大为全局规则。稳定的能力限制可简记；某轮“未复测、待重启、审查中”留任务记录。不确定的信息不写成事实，必要限制不能因压缩消失。
- **权威规范只留入口**：规则、流程、正式需求已有载体时，最多保留有复用价值的提示和 sources 引用，不复制规范或整段实现说明。
- **写前逐项复核**：删掉这句话是否影响未来判断？若不影响就删。是否留下了条件和独有有效知识？过程标识是否留在溯源层？旧条目已充分覆盖时允许零修改，不为追求更短反复改写。

例如，输入“事件某编号中用户回复 yes；执行记录证明已重启；失败但已有写入也要显示”，可提炼为“Dashboard：有 transaction 即显示，含失败但已写入记录。”过程来源留 sources；这只是表达示例，不是其他项目的默认知识。

## 主动维护

每次处理会话增量，先主动检索相关旧 chip，核对当前权威来源、适用条件和例外，再选择保留、纠错、更新、合并、提炼或淘汰。新信息即使不值得单独保存，也可能使旧知识失效。会话维护与周期复查均按上述速记标准精简实际触及的旧条目：移出正文中的过程信息到现有溯源层，保留有效知识及来源，不为风格整理扫描重写全库。零修改也是有效结果。

运行中的本机 daemon 为事件队列已知的工作区安排周期复查。每个项目作用域和全局共享的用户作用域，在上一批成功完成至少24小时后才可创建下一批；用户作用域不按项目重复复查。每批按稳定字典序选取最多8个条目ID，从上一批末尾继续，到末尾后绕回。这些ID是检索起点，不要求加载或重写全库正文；按需读取相关卡片、正文和依赖，墓碑可跳过。后台每分钟检查一次资格，优先会话任务；daemon停机时不执行，不是系统级定时器。

周期复查是显式维护事件，不伪造用户消息。沿用现有模型配置、五分钟期限、条件写入和effects审计，可能产生模型费用。失败或中断沿用已有effects和累计attempts，重新核对实际知识与审计；每条事件最多两次尝试（首次加一次自动重试），显式retry不重置计数。耗尽标记exhausted并跳过，不阻塞后续会话或周期；不推进成功游标，周期调度等待原24小时并从耗尽候选末尾继续。不同workspace的独立Memory Agent可并行，同workspace串行。完成后仅保存最新成功周期游标和去重hash，释放该批输入与处理日志。工作区登记独立保留，清理完成队列不缩小定期复查或入链检查范围。工作区失效和调度错误在服务状态中报告。周期批次只能写入指定scope，跨scope发现留待该作用域的维护处理。

只有明确失效、到期或适用条件消失的证据，或经过核验的替代知识保留全部有效信息时，才淘汰旧条目。不能只根据存放时间或低使用率删除。合并须确认知识相容，保留独有事实、条件、例外和来源。提炼的共性必须得到案例支持；仍有价值的案例细节和限定不能丢失。优先更新已有合适chip，而非另造一条摘要。

淘汰前先保存并回读替代知识，检查反向引用，在授权范围内修正依赖。Memory Agent删除工具遇到当前两级根目录的活跃入链、相关pending写入时拒绝删除；删除用户记忆还检查队列已知的项目根目录。不得绕过保护。依赖属于其他工作区或无法安全修正时，保留旧chip并报告原因。保留`supersedes`链接时也保留其目标，避免删除成断链。这只是已知根目录内的保守保护，不证明未知外部引用或外部并发写入不存在。

每批会话维护及项目周期复查都会获得当前项目容量与超长条目清单，先处理超限；超容量时扫描完整项目单索引，按相容主题分组合并，周期候选只是起点，不是本批预算修复的范围上限。不能仅因初始候选已处理就结束，应继续至达标或遇到具体无法安全解决的阻塞。结束时仍超限返回 `MEMORY_BUDGET_UNRESOLVED`，保留部分提交和未完成输入，沿用原有两次尝试上限。用户级周期批次不修改项目。容量已满时先合并到已有 chip，回读确认、修正入链后再删除冗余 chip；腾出空间后才能新增。不得先删再保存、截断正文或把项目事实移到用户级绕过限制；无法无损收敛时报告具体阻塞。

每批结束简短说明实际修改或无修改结论；这是即时输出，不存为长期处理记录。永久历史仅保留已提交记忆的before/after、理由与来源；无变更批次不创建历史。失败批次中已提交的部分仍保留，未完成输入及effects暂留供检查重试；完成后释放输入和处理状态，仅保留去重hash与必要周期游标。来源中的事件标识用于溯源身份，不保证已释放事件的对话回放。不以删除数量作为质量目标；项目超限时必须尝试有证据的提炼合并，不能把无修改当作达标，不自动把项目事实提升为用户偏好。

## Mutations

Use the supplied `memory_apply` mutation tool or `csl-agent-kit memory put|delete --scope <scope> --workspace <workspace> --input <json>`. Do not bypass the writer by directly overwriting entry, index, audit or migration files: ordinary tools are for reading; the writer provides locks, conditional commits and audit.

A mutation contains `id`, `operation` (`put` or `delete`), `expected: {revision, hash}`, a concrete `reason`, a traceable `source`, and, for put only, `content: {title, summary, type, sources, body, retrieval?}`. Omitted retrieval preserves existing hints; use an explicit empty object to clear them deliberately. Keep hints aligned when changing the body. New IDs use `0/null`. Existing IDs, including tombstones, require their current revision and complete-file SHA256. The hash is returned or computed from bytes, not embedded into the hashed file itself.

Read the current file before editing; preserve unrelated content. On `CONFLICT`, reread and reconsider rather than force overwriting. On `LOCKED`, do not remove an unverifiable lock. `.write-lock` 与 `.write-lock-v3` 是旧写入程序的永久隔离标记，不能删除以强行运行旧程序；当前写入使用 `.write-lock-v4`。 On `RECOVERY_REQUIRED`, inspect actual history before retrying: the mutation may already have committed.

When splitting or merging, first save and verify the replacement knowledge, then remove obsolete entries. Temporary duplication is safer than losing unique knowledge. Delete only with evidence of invalidity, replacement preserving all valid information, or an explicit forget request; lack of recent use is not evidence.

writer 递增 revision，项目原子发布单索引并移除旧派生索引目录，用户级继续发布完整卡片/主题/总览代际；记录 before/after、reason 和 source。 Verify the returned result, not a natural-language claim. `csl-agent-kit memory history|change` inspects effects. `restore <transaction-id> --input <json>` accepts current `expected` and `reason`, and creates a new audited revision, never rewinds history. Historical pending proposals are not automatically approved by an upgrade. Approval rechecks new relationship targets against the current roots; a historical size-budget exception does not bypass this validation. Only exact historical restoration may preserve recorded dangling references, which remain diagnostic gaps rather than permission to rely on unresolved dependencies.
