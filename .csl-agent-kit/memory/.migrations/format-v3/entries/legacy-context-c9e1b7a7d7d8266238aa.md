---
schema: csl-memory/v1
id: legacy-context-c9e1b7a7d7d8266238aa
revision: 1
type: fact
title: 项目约定与审查职责边界
summary: 理解任务记录、审查角色、规则分层和 Skill 语言约定时读取；当前权威契约优先。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#Decisions and Conventions:1
updated: 2026-11-02T03:43:09.229Z
deleted: false
---

## Decisions and Conventions

- Skill packages use English for `SKILL.md`, runtime references, prompts, templates, and eval-facing prose; generated reports and user responses still follow the user's language. A task that modifies one skill does not bulk-translate unrelated existing packages unless the user explicitly requests a repository-wide migration — authoritative source: user confirmation on 2026-08-07; review when that language convention changes.
- 新任务从下一项开始采用 `Target` 作为唯一 checkbox（稳定 `Tn` ID），`Plan` 使用普通有序列表，`Result` 按 Target ID 记录当前证据，不再创建独立 `Checklist`；`Scope`、`Block` 与 review details 仅在生命周期需要时出现，当前任务和未触及历史不迁移。
- 自动注入的 CSL Agent Kit Contract 保留稳定原则、task-family 路由与分级审查触发边界；详细字段、循环和输出契约属于 Skill 与共享协议。所有请求交付物文件改动（包括 trivial edits）进入 task 记录，所有结果按风险验证；R0／R1 在具备当前 assessment 且无显式或既有审查义务时可免独立审查，R2 执行 mandatory `task-review` 并以 `Passed` 完成。R1 包括满足全部条件的小范围逻辑修改，不按行数或主观信心免审。`$adversarial-review`、双 Agent Reviewer–Editor 循环与独立 Reviewer 批准仍仅在用户明确要求时触发；R2 不能用它们替代 mandatory pass。
- `adversarial-review` 必须把 `Finding`、`Required Outcome` 和 `Suggested Remedy` 作为三个独立概念：Finding 只陈述有证据的问题或风险，Required Outcome 只定义必须达到的结果，Suggested Remedy 是可被 Editor 接受、缩小或基于证据拒绝的建议；解决 Finding 不等于必须采用 Reviewer 的建议实现。
- `adversarial-review` 的 `BLOCKER` 必须同时说明被违反的要求或原则、可观察证据、不处理的实际风险与 `Required Outcome`；缺少任一项时不得作为阻塞性 Finding，应降级为 `QUESTION`、`NOTE` 或省略。`Suggested Remedy` 不能代替这四项成立条件。
- `adversarial-review` 的 Editor 对每个 Finding 必须依次审计 `Current Adequacy`、`Minimal Resolution`、`Blast Radius` 与 `Proportionality`，再选择接受、缩小、拒绝、确认无需修改或需要用户决定。当前方案已满足 `Required Outcome` 时默认保留，除非正确性、安全、数据完整性或明确需求提供了必须变更的证据。
- `adversarial-review` 只以 `Required Outcome` 是否已满足作为 Finding 的复审和关闭标准，不以 `Suggested Remedy` 是否被采用为标准。Editor 的更小修复或基于证据的拒绝已消除风险时，Reviewer 必须关闭 Finding；若继续阻塞，必须指出新证据或仍未满足的 `Required Outcome`，不得只重复原建议。
- `adversarial-review` 的 Finding 类型语义固定：`BLOCKER` 是满足四项成立条件的明确违规或实质风险，可通过满足 `Required Outcome` 或证明 Finding 不成立而关闭；`QUESTION` 只请求判断所需的缺失信息，不得隐含修改命令；`NOTE` 是非阻塞观察或可选改进，Editor 确认后即关闭，不得要求修改 artifact。纯偏好、顺手重构与推测性未来需求应省略。
- `adversarial-review` 的 Reviewer 与 Editor 共同遵守以下优先级：用户意图，然后是正确性、安全、数据完整性与明确兼容要求，再是 `Required Outcome`、证据、最小改动、最小影响范围和最低的已证成本。当多个方案都满足 `Required Outcome` 时，必须选择影响范围更小、维护成本更低且新假设更少的方案；最终以测试或可观察证据判定，不以双方口头同意判定。
- `tasks/tasks.md` 是 newest-first 导航索引，只保存任务标题、当前状态和 `tasks/tasks/<task-slug>.md` 的索引相对链接 `tasks/<task-slug>.md`；每个独立任务文件才是目标、计划、审查状态与复核历史的唯一权威记录。Agent 只能修改所属任务文件及其精确索引项，不能重写其他任务状态。
- `adversarial-review` 在循环运行中只通过 Agent handoff 传递完整 finding ledger，不写中间报告或同步 task 状态；仅在审查结束或暂停时写一次 `tasks/artifacts/<task-id>/reports/adversarial-review.md`。最终文件只包含每个实质 finding 的讨论结果和一项最终决定，其中 `Reviewer position` 与 `Editor response` 用嵌套列表逐条展示核心观点；报告不含总体结论、主题清单、验证章节、Reviewer/轮次/fingerprint/round history 等技术附录。写入前必须已有 owning task；缺失时返回 Task 激活，写入后只向该 task 追加最终决定和报告链接。
- 每次 adversarial-review pass 都必须覆盖固定的完整 scope：Reviewer 一次性报告当前可见的全部 `BLOCKER`、`QUESTION` 与 `NOTE`，并在复审中逐项说明全部既有 finding ID 已解决或未解决，不得故意分轮释放；Editor 一次性回答和处理整轮全部条目后才能请求普通复审。后续新 finding 必须指出使其此前不可行动的新 artifact、diff、证据或其他原因；需要用户决定时保持 `BLOCKED`，多个方案进入 Decision Consensus Gate，否则直接询问用户，不得用普通复审绕过决定。
- `adversarial-review` 对代码、PRD、RFC、设计文档及其他交付物执行同一 fail-closed 双 Agent 流程；不设总轮次上限，只保留单调递增的 `INITIAL (1)` 与 `RE-REVIEW (n)` 审计编号。流程仅按 `APPROVED`、需要用户、客观阻塞、连续无实质进展或用户停止等状态结束或暂停；不同交付物只切换 review lens。
- `skills/meta/agent-sops/references/code-style/swift-style.md` 只保留按主题分组的 Swift 具体规则：类型与状态、可选值与失败路径、控制流、enum 与 MARK、extension 组织、方法布局、文档注释和改动边界；覆盖 `T!` 边界、强制操作、`guard`、`for ... where`、`@unknown default`、类型简写和公开声明 summary。只有需要展示精确语法或布局的规则才附最小代码块，适用边界和使用顺序放在 `code-style.md`。
- 任务计划记录不等于进入宿主 plan mode 或授权委派。使用 subagent 仍须当前用户或适用指令授权，任务规模本身不构成授权；必要独立审查按 Task 契约执行。
- CSL Agent Kit Contract 位于 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 并随 Agent Hooks skill 分发；仓库不再发布或安装独立的 `super-agent` 规则资产。
