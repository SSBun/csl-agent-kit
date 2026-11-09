# 规划 tasks 目录结构优化

Status: Completed (2026-08-31 16:54)
Kind: Plan

## Scope

- 包含：为 Task 附属文件实施稳定的按 Task ID 聚合结构；更新实际写入这些文件的 Skill 合同及其聚焦 fixture；迁移当前可确定所属 Task 的既有文件；更新迁移后会失效的活动链接和路径校验。
- 不包含：修改 Task 索引或 canonical task record schema、task core、Pi task overlay、Context、Lessons、Conversation 归档路径、项目正式源码／文档位置，或 `reports/analyze-project-evals/` 等非 Task artifact 数据。
- 不创建兼容 symlink、双写或旧路径 fallback；迁移完成后旧目录只在确认为空时删除。

## Target
- [x] T1: 所有当前会写入 Task 附属文件的 Skill 使用 `tasks/artifacts/<task-id>/` 下 discussions、specs、reports 或 evidence 的稳定职责路径，文件状态变化不触发移动
- [x] T2: Task 索引、canonical task records 的 schema 与位置、Context、Lessons、Conversation 归档及 task-plan 的默认 record 交接保持不变
- [x] T3: 当前可映射的 plans、thinking、Task reports 与 adversarial review reports 无损迁移到所属 Task，活动引用同步更新，旧目录仅在为空时删除，未映射文件不经独立安全确认不删除
- [x] T4: 当前生产者、消费者和聚焦 fixture 与新路径一致；旧路径仅残留于允许的历史文本，且获准的 Skill Quality、JSON、Task、Context 与 diff 检查通过

## Decisions

- 固定布局为 `tasks/artifacts/<task-id>/<category>/`；Task ID 是稳定所有者，category 只表达文件固有职责，不表达 Draft、Accepted、Completed 或 Superseded 等状态。
- category 只有 `discussions/`、`specs/`、`reports/` 与 `evidence/`，均按需创建：可见讨论与综合结果进入 discussions；RFC、PRD、ADR、设计和独立方案进入 specs；调研、分析、审查和审计文档进入 reports；日志、截图、benchmark 与其他原始验证材料进入 evidence。
- artifact 的状态、当前性和满足哪个 Target 由 canonical task record 或文档正文表达；状态变化不移动文件。正式项目源码、配置和长期权威文档继续留在项目自己的 canonical 位置。
- `tasks/tasks.md`、`tasks/tasks/`、`tasks/context.md`、`tasks/lessons.md` 与 `tasks/conversations/` 保持不变。`task-plan` 默认仍只把实施交接写入 canonical plan record，不为每个 Plan 自动创建 specs 文件。
- 只修改会生成或校验 Task artifact 的 Skill 合同与聚焦 fixture：`task` 提供通用路由；`brainstorming` 写 specs；`deliberate` 写 discussions；`adversarial-review` 写 reports。各分发 Skill 自包含路径规则，不依赖仓库专用设计文档。
- Review report 的新固定位置为 `tasks/artifacts/<task-id>/reports/adversarial-review.md`；普通 `task-review` 继续只在聊天返回反馈，不生成报告。
- 现有文件只在能确定唯一 Task ID、目标不存在且内容可无损保持时迁移。当前清单中的文件都能映射；预期只删除迁移后为空的旧目录。若执行时发现无法映射的额外文件，先列出精确路径并在实际删除边界单独取得 Safety Confirmation。
- 历史逐字 Conversation 不修改，即使正文保留旧路径文本；当前 Task record 中真正承担导航作用的链接更新到新位置，普通历史叙述不为路径整洁而重写。
- 不运行项目单元测试，除非实施请求届时再次明确授权；仍更新受影响的测试 fixture，并用静态路径检查、文件校验和、Skill Quality、JSON 解析、Context/task 校验与 `git diff --check` 完成允许范围内的验证。

### Migration Map

| Current source | Stable destination |
| --- | --- |
| `tasks/plans/2026-08-09-tldr-design.md` | `tasks/artifacts/create-tldr-skill/specs/2026-08-09-tldr-design.md` |
| `tasks/thinking/2026-08-09-optimize-analyze-project.md` | `tasks/artifacts/optimize-analyze-project/discussions/2026-08-09-optimize-analyze-project.md` |
| `tasks/thinking/2026-08-27-task-target-direct-execution.md` | `tasks/artifacts/deliberate-task-target-bypass/discussions/2026-08-27-task-target-direct-execution.md` |
| `tasks/reports/2026-08-07-brooks-lint*/` | `tasks/artifacts/deep-explore-brooks-lint/reports/2026-08-07-brooks-lint*/` |
| `tasks/reports/pi-task-system-workflow.md` and `pi-task-execution-flow.*` | `tasks/artifacts/document-pi-task-system-workflow/reports/` |
| `tasks/reports/task-system-lifecycle.*` and `task-target-confirmation-gates.*` | `tasks/artifacts/explain-task-system-flow/reports/` |
| `reports/adversarial-review/<task-id>.md`（当前 28 份） | `tasks/artifacts/<task-id>/reports/adversarial-review.md` |

## Plan

1. 在任何移动前重新读取工作树状态，枚举 `tasks/plans/`、`tasks/thinking/`、`tasks/reports/` 与 `reports/adversarial-review/` 的 tracked／untracked 文件，生成 source、Task ID、category、destination、引用方和 SHA-256 的迁移清单；目标已存在、Task ID 不唯一或校验和无法建立时停止，不覆盖文件。
2. 更新 `skills/meta/task/SKILL.md` 的 artifact 路由边界：只有用户要求持久文件且没有更权威项目位置时才使用 artifact 目录；Task record 仅保存摘要、状态和链接；evidence 只在一行证据或外部链接不足时落盘。同步收紧 `skills/meta/task-plan/SKILL.md`，明确 canonical plan record 仍是默认交接载体。
3. 更新 `skills/dev/brainstorming/SKILL.md`：显式设计／RFC 文档写入 owning Task 的 specs 目录，Task record 的 Plan 使用 `../artifacts/<task-id>/specs/...` 链接；没有 owning Task 时不得创建游离 artifact。保持“只有用户明确要求文档或确认持久交接时才写文件”。
4. 更新 `skills/dev/deliberate/SKILL.md` 及 `evals/workflow_cases.json`：最终可见 deliberation 结果写入 owning Task 的 discussions 目录，保持不覆盖和禁止保存私有推理／角色交换；路径变化不改变路由或收敛语义。
5. 更新 `skills/dev/adversarial-review/references/final-review-report.md` 与 `evals/report_contract_cases.json`：终止或暂停时只维护 owning Task 下的 `reports/adversarial-review.md`；恢复 Review 继续更新同一文件；删除无 owning Task 的游离报告路径，因为当前工作流会先激活 canonical Task。
6. 更新 `tests/task-files.test.mjs` 的静态图校验：递归读取 `tasks/artifacts/<task-id>/reports/adversarial-review.md`，验证目录 Task ID、report frontmatter、Task record 链接和 report 文件一一对应；fixture 使用 `../artifacts/<task-id>/reports/adversarial-review.md`。不改变 task core、索引解析或 Pi overlay 测试。
7. 按 Migration Map 创建所需目标目录并执行无覆盖移动。Markdown 与配套 SVG／PNG 保持同一 reports 目录；`pi-task-system-workflow.md` 对跨 Task 复用的生命周期图使用指向 `explain-task-system-flow` artifact 的相对链接，不复制图像。
8. 更新迁移直接影响的活动引用：28 个 Review Task records、`create-tldr-skill` 与 `deliberate-task-target-bypass` 等明确 artifact 链接，以及 `pi-task-system-workflow.md` 的图表链接。完成任务正文中仅作为历史事实的旧路径和 Conversation 原文保持不变。
9. 比较迁移前后清单：每个 source 恰好对应一个 destination，文件数量和 SHA-256 一致，无覆盖、无内容丢失。确认旧目录为空后删除 `tasks/plans/`、`tasks/thinking/`、`tasks/reports/` 与 `reports/adversarial-review/`；若发现未映射文件，暂停并执行独立删除安全确认。
10. 对当前生产者和消费者执行旧路径扫描，允许的残留仅限历史 Task 叙述、Conversation 原文和明确负向 fixture；确认新路径均能从 owning Task record 解析。逐包运行 Skill Quality（task、task-plan、brainstorming、deliberate、adversarial-review），解析改动的 JSON，运行 task/context 校验和 `git diff --check`。只有用户在实施请求中明确授权时，才额外运行聚焦 Node 单元测试。

## Result

- T1: task、brainstorming、deliberate 与 adversarial-review 已改用 tasks/artifacts/<task-id>/ 下 discussions、specs、reports、evidence 的稳定职责路径；task-plan 明确不复制 canonical Plan。
- T2: Task 索引、record schema 与位置、Context/Lessons/Conversation 路径均未迁移；Context 仅同步两项已变化的 durable 路径事实并通过 validate。
- T3: 42 个已知文件共 888476 bytes 全部映射并移动，28 份 review reports 与 29 个 Task 链接一致；0 个未映射文件，4 个旧目录确认空后删除。
- T4: 生产者、report contract、JSON fixture 与 task-files 路径校验已同步；active old-path scan 为 0，五个 Skill Quality 均 0 failure，JSON/JS syntax、Task、Context 与 diff 检查通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 静态迁移校验确认 42/42 destinations 存在、0 legacy source、13 个内容变化仅为预期链接更新、28/28 review ownership 有效；Context/task validate、Skill Quality、JSON/JS syntax 与 git diff --check 通过。按用户规则未运行单元测试。
