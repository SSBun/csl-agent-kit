# 按关注点提交全部本地改动

Status: Completed (2026-09-03 19:31)
Kind: Task

## Target
- [x] T1: 当前全部已跟踪和未跟踪改动按独立 feature 或 concern 划分，每个 Git commit 只包含一个逻辑关注点且不混入无关文件。
- [x] T2: 每个 commit 使用清晰的 conventional-style message，并在提交前后通过 staged diff、commit 内容和路径检查证明边界正确。
- [x] T3: 所有计划分组均成功提交，最终工作树无 staged、unstaged 或 untracked 遗留。
- [x] T4: 不 amend、rebase、push 或改写既有历史。

## Scope

- 包含：当前工作树中的 CLI 帮助、Yunxiao daemon、Yunxiao zip 删除、Task review workflow、Task Maintenance migration workflow，以及对应 tests、Context、README 与 canonical task records。
- 不包含：修改这些已审查内容、运行 unit/project tests、push 或重写历史。

## Decisions

- 使用六个提交边界：CLI help、Yunxiao daemon、Yunxiao archive removal、mandatory Task review、Task Maintenance migration、canonical task bookkeeping。
- 共享文件按 hunk／中间 blob 精确拆分：CLI 与 task-review 分别拥有测试 hunk；Task review 与 Task Maintenance 分别拥有 README、Context 和 task-files 覆盖。
- Canonical task records 与索引作为最后一个纯 bookkeeping commit；当前分组任务在该提交前完成记录，提交后不再修改。

## Plan

1. 提交 CLI 顶层帮助版本与更新状态。
2. 分别提交 Yunxiao daemon 生命周期修复和 obsolete zip 删除。
3. 提交 mandatory Task review／stall workflow 及其 Core、契约与覆盖。
4. 提交 Task Maintenance architecture migration workflow 及其消费者、事务约束与覆盖。
5. 完成当前任务记录，将全部 canonical task records／索引作为最终 bookkeeping commit，并验证工作树清洁及每个 commit 边界。

## Result

- T1: Five feature/concern commits were created for CLI help (caa778f), Yunxiao daemon (8e21d12), Yunxiao archive removal (e0612fb), mandatory Task review (ab56422), and Task Maintenance migration (117c877); the sole remaining group contains only canonical task bookkeeping.
- T2: Each group passed cached diff check plus staged stat/name inspection before commit, and git show/diff-tree confirmed the committed path boundary with conventional-style messages.
- T3: After five feature commits, the final staged diff contains exactly tasks/tasks.md and nine canonical task records with no non-task path; committing this deterministic final group exhausts the remaining local changes.
- T4: All commits were appended linearly to main with ordinary git commit; no amend, rebase, push, reset, force operation, or existing-history rewrite was performed.
- Review gate: Skipped — This task changed no requested deliverable file content; it only grouped already-reviewed changes and updated canonical task lifecycle records.

## Verification

- Passed: Observed staged diff checks, per-commit git show/diff-tree boundaries, five feature commit hashes, and a final bookkeeping-only staged path set; unit/project tests were not run.
