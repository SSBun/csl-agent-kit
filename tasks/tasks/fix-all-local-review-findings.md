# 修复全部本地审查问题

Status: Completed (2026-09-03 18:16)
Kind: Task

## Scope

- 包含：修复 Task sync 审查失效、Review ledger 重复／未知 schema 绕过、Task Maintenance 结构删除与 stable-ID 引用门，以及 Context 中冲突的旧 `Skipped` 规则。
- 不包含：实际执行任何数据／结构迁移、修改无关本地改动、运行远端操作，或扩大 mandatory review 与 stall policy。

## Target
- [x] T1: 直接修改已审查任务的 Target 或其他规范内容并执行 sync 后，旧终态 Review gate 与 Verification 会失效，不能沿用旧证据完成。
- [x] T2: Task Review ledger 能拒绝重复 Review sections、未知 schema 版本及 ledger-like malformed 内容，同时保留单个历史自由格式 Review 的兼容性。
- [x] T3: task-maintenance 分离 Migrate、byte-identical duplicate Delete 与 empty-directory Delete，唯一非空内容只能先迁移，并在 Data Delete 前保护所有 live stable-ID consumers。
- [x] T4: Workspace Context 不再保留文件改动默认 Skipped 的旧规则，与 mandatory task-review 契约一致。
- [x] T5: 聚焦行为覆盖、Skill/Context/Task 门禁与 mandatory task-review 修复循环共同证明全部确认问题已关闭。

## Decisions

- Active task 的 `sync` 作为所有直接规范编辑后的保守失效入口：无论具体字段，清除 Verification，并把 `Passed`／`Approved` 退回 `Required`；Completed task 必须先 reopen 才能改规范。
- Review parser 通过按 Markdown 列宽展开 space/tab 的 scanner 用按 quote depth 分组的 list-indent 栈及 fence／HTML opener identity，枚举 fenced／indented/list-container code 与 HTML block/comment 之外的 column-zero level-two ATX Review headings，支持 closing hashes，并拒绝 backtick info 中含 backtick 的伪 fence；重复 section 直接失败。Ledger-like detection 用 quote-scoped list-item stack 在 nested item 后恢复 parent 并聚合 continuation lines，并无序宽识别 `-`／`+`／`*` marker 中的 TR-n／no-progress 与 label 空白畸形，再以规范化 0–3 列缩进后的严格 v1 parser 校验；未知、未标记与 malformed 内容失败，单个无 marker 历史自由格式兼容。
- Task Maintenance 的 structure candidates 互斥为 Migrate、仅 non-empty byte-identical source 的 Duplicate Delete、独占 empty-source cases 的 Empty Directory Delete；三者使用不同 destination 要求，并在最终删除前立即重验、原子 quarantine source、验证 quarantine 自身，再在 postconditions 与最终 recheck 通过后清理 quarantine；rollback 在 rename 调用边界再次确认 source absent 并使用 atomic no-replace primitive；primitive 不可用或 source 已重建时禁止覆盖并保留全部副本作为 unresolved recovery conflict。
- Data Delete 移除稳定 Context/Lesson ID 前必须枚举全部当前非历史 consumers，任何 consumer 无法继续有效即 Defer；不得通过顺手修改其他 carrier 让删除成立。

## Plan

1. 让 active task 的 `sync` 失效终态审查／Verification，并让 Review ledger 对重复 section、未知 marker 和 ledger-like malformed 内容 fail closed。
2. 将 Task Maintenance 结构操作拆成 Migrate、byte-identical duplicate Delete 与 empty-directory Delete，并补齐各自事务、回滚和 Data Delete live-consumer 门。
3. 更新冲突 Context、routing/contract fixtures 与聚焦 Core／Skill 断言。
4. 运行行为探针、语法、数据格式、Context／Task、Skill Quality 与差异检查，再执行 mandatory task-review 修复循环。

## Result

- T1: Active Target-change probe shows sync invalidates terminal review/Verification and blocks completion; Completed sync is rejected until reopen, with Task and injected contracts aligned.
- T4: Context now states every requested deliverable file change, including trivial edits, enters Task and mandatory task-review; Skipped remains only for no-file work and adversarial review stays explicit-only.
- T3: Structure rollback is fail-closed at both final cleanup and no-replace restore call boundaries; the atomic primitive is verified before writes and late source reappearance preserves source/quarantine/destination/current refs. Operation and rollback fixtures cover all branches.
- T2: List/finding container ownership now uses outer indentation plus quote depth: sibling quote entry removes the exited list item, truly nested quote preserves it, deeper quote items are removed on lower-depth markers, and all prior fence/HTML/schema/list-marker fail-closed cases remain covered.
- T5: Mandatory task-review ran 10 fresh passes: every original and newly exposed TR-1 through TR-10 finding was remediated with substantive evidence, and pass 10 resolved the final TR-8 with no new finding or blocking evidence gap.
- Review gate: Passed — Independent mandatory task-review pass 10 resolved the final TR-8 and found no Critical Finding, Concern, or Target-blocking evidence gap.

## Verification

- Passed: Post-review probes passed sync invalidation, duplicate/container heading handling, malformed-ledger fail-closed, sibling/nested quote boundaries, 7 maintenance operation and 3 rollback cases, and Context alignment; JS syntax, JSON, Context/Lessons/Task validation, git diff and three Skill Quality gates passed with context-budget warnings only. Unit/project tests were not run.
