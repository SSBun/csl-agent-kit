---
name: workspace-manage-task
description: Manage workspace task records for non-trivial deliverable changes, including scope, evidence, status, and user-requested adversarial review. Excludes read-only answers, trivial mechanical work, context maintenance, and correction lessons.
---

# Manage Workspace Tasks

## Activation Boundary

- Create or update a task before non-trivial work that changes a deliverable.
- Start a new canonical task for each new user-requested outcome that can be accepted independently.
- Reuse an existing task only when it owns the request under the Record Ownership boundary.
- Skip task records for read-only answers and simple operations with direct deterministic verification.
- Do not create a task solely to host an adversarial-review report.

## Record Ownership

- Keep `tasks/todo.md` as a newest-first index containing only title, status, and task link.
- Keep `tasks/todo/<task-slug>.md` as the canonical task record.
- An existing task owns the request only when the request directly corrects, completes, or re-verifies that task's same outcome and leaving its current Target or Result unchanged would be incomplete or misleading.
- Component, file, topic, or implementation overlap alone does not establish ownership; when ownership is ambiguous, create a new task.
- Modify only the owning task file and its exact index entry.
- Preserve completed task files and unrelated task state.

## Task Contract

- 新建任务必须使用以下任务索引条目格式，标题链接放在条目开头，状态和时间戳放在链接后；时间戳必须替换为创建或状态变更时的当前本地时间：

  ```md
  - [任务标题](todo/task-slug.md) — In Progress (<YYYY-MM-DD HH:MM>)
  ```

- 新建任务的正文必须使用以下状态行格式，使用与索引条目完全相同的状态和时间戳：

  ```md
  Status: In Progress (<YYYY-MM-DD HH:MM>)
  ```

- `<state>` 只能使用 `Pending`、`In Progress`、`In Review`、`Completed` 或 `Blocked`；索引条目与任务正文中的状态和时间戳必须完全一致。
- 每次新建、重新打开或更改任务状态并同步索引后，立即运行 `node "<skill-dir>/scripts/check-task-index.js" "tasks/todo/task-slug.md"`；`<skill-dir>` 是本 `SKILL.md` 所在目录。检查通过前不得继续交付工作或完成状态迁移。
- 检查脚本只校验参数指定的 canonical task 及其索引项；已存在的历史条目不需要批量迁移，重新打开或更新历史任务时才必须按上述新格式同步该条目。
- Create `Target` and `Plan` when the task starts.
- Add `Scope`, `Block`, `Result`, and review details only when their lifecycle conditions apply.
- Do not create an independent `Checklist`; task-specific completion conditions belong in `Target`, while shared verification and review gates belong in this workflow.
- Do not add placeholders or fields without substantive content.

### Scope

- Add `Scope` only when an adjacent boundary is easy to include accidentally, the user excludes work explicitly, or expansion materially changes cost or risk.
- Record included and excluded boundaries without prescribing implementation.
- Update Scope before expanding the affected outcome.

### Target

- Use the task's only checkbox list here, with stable IDs such as `T1`, `T2`, and `T3`.
- Require at least one observable, pass-or-fail delivery condition.
- Keep one result, compatibility requirement, preserved behavior, risk boundary, or side-effect boundary per item.
- Do not include implementation steps, commands, shared workflow gates, or review status.
- Check a Target only when its current evidence is recorded under the same ID in `Result`; update both in the same change.

### Plan

- Use an ordered list without checkboxes.
- Keep only the current necessary result nodes, dependencies, and next actions.
- Revise the Plan as the work changes; do not preserve completed steps as a progress log.
- Do not prescribe algorithms, files, functions, types, or call paths unless the user requires them.
- Do not duplicate shared verification or adversarial-review gates.

### Result

- Add `Result` only after evidence exists.
- Map every Target ID to current evidence that states the checked object, method, and observed result.
- A shared check may support multiple Targets, but name each covered ID explicitly.
- Record the delivered artifact and only material scope, approach, or verification deviations.
- Before completion, record `Review gate: Required — <explicit user request>` or `Review gate: Skipped — no explicit user request`.
- After an actual review, append the decision and report link; never prewrite approval.

### Block

- Add `Block` only while the task status is `Blocked`.
- Record `Reason` and an observable `Unblock when` condition.
- Remove the section when work resumes; preserve only effects that materially changed the Result.

## Subtasks

- Create a separate canonical task for work with an independently acceptable outcome, blocking condition, or review boundary, even when it touches the same component as another task.
- Link the subtask from the parent Plan without copying its Target, Plan, status, or Result.
- A completed subtask does not prove the parent Target; verify the parent independently.

## Review Gate

Set `Required` only when the user explicitly requests `$adversarial-review`, a two-agent Reviewer–Editor loop, or independent Reviewer approval for the current task. Otherwise set `Skipped`.

- Do not infer a review requirement from risk, criticality, complexity, verification gaps, another rule or workflow, or Agent judgment.
- Ordinary one-pass review, verification, testing, proofreading, or self-review requests do not request `$adversarial-review`.
- Re-evaluate only when the user's review request changes. Do not ask whether review is wanted merely because a task appears risky or difficult.

Keep `evals/review_gate_cases.json` aligned with this gate.

## Lifecycle

- Use `Pending`, `In Progress`, `In Review`, `Completed`, or `Blocked`, followed by the current local date and 24-hour time in `YYYY-MM-DD HH:MM` format.
- Reopen a completed task only when the Record Ownership boundary holds: append the next Target ID, revise the Plan, set `In Progress`, update its exact index entry, and re-evaluate the Review Gate from the current user request. Otherwise create a new canonical task.
- Before `In Progress`, require at least one valid Target.
- Before completion, require every Target to be checked and mapped to current Result evidence, proportionate verification to pass, and the Review gate to be recorded.
- For `Required`, set `In Review`, invoke `$adversarial-review`, and complete only after recorded `APPROVED`.
- For `Skipped`, do not enter `In Review`; set `Completed` after the shared completion requirements pass.
- If review changes the artifact, return to `In Progress`, uncheck affected Targets, replace invalid evidence, and review again.
- Keep the complete status text identical in the canonical task and index, updating both in the same change.
- When they disagree, treat the canonical task as authoritative and repair the index before considering the transition complete.

## Adoption

- Apply this contract to new tasks and reopened scope.
- Do not retrofit untouched completed history.

## Maintainer Validation

- Run focused contract tests, routing evaluation when the description changes, OpenAI validation, and Yao audit after edits.
- The only acceptable non-blocking failure is Yao `Estimated initial-load tokens exceed budget` against its 1000-token initial-load budget.
- Syntax/frontmatter, lint, governance, every other resource-boundary check, applicable routing evaluation, OpenAI validation, and tests remain blocking.
- Never delete, distort, or split core operational guidance merely to satisfy the initial-load budget.
