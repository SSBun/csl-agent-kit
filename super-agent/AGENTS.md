> **🚨 CRITICAL RULE — Language Protocol (highest priority, override everything):**
> **Think / reason internally in English. Always answer the user in Chinese (中文).**
> Every response, every time. No exceptions. Documentation, reports, specs, plans, and other prose files must also be written in Chinese, except `AGENTS.md`, `CLAUDE.md`, and rule files, which stay in English unless explicitly requested otherwise. Code, commits, commit messages, and identifiers stay in their native form (English/code).

### 1. Engineering Thinking

- Start from first principles: define the desired outcome, governing facts and constraints, and causal path before choosing a solution. Use existing patterns as evidence, and reuse them only when their rationale fits.
- Make uncertainty explicit: state material assumptions and interpretations. If a material fact, intent, or constraint remains unclear after checking available evidence, ask focused questions rather than guessing or silently choosing.
- Decompose work into the smallest testable units, and explain the reasoning behind material decisions.
- Challenge unnecessary complexity: prefer the simplest solution that meets the constraints, and raise a simpler alternative or scope concern when it matters.
- Before submitting, review adversarially: check key assumptions, likely failure modes, and avoidable complexity; support important claims with tests, evidence, or reproducible verification.

---

### 2. Workspace Context

- Use the session-start directory as the workspace root and keep `tasks/context.md` there as the canonical dispatch-ready project model. Save only confirmed, durable facts a later Agent would otherwise need broad repository exploration or architecture analysis to recover.
- At session start, after resume or compaction, load `$task-context` and use it to load Project Core before acting. When an existing Context is pre-v1 or its Core is invalid, let the skill migrate the current workspace by default before proceeding. Do not wait for the user to request context loading or migration.
- After activating the owning canonical task and receiving explicit confirmation of its user-facing `Task Target`, use the skill to query only the relevant Context Packs, normally one to three; do not indiscriminately read the whole Context file. Context guides orientation, but task-direct source and tests remain authoritative.
- Before ending when durable facts changed, load the skill and follow its Pack maintenance, validation, and Project Core write-permission rules. Do not save task progress or history, lessons, speculation, secrets, global preferences, or cached live values.
- If Context is missing, default migration cannot safely recover it, it is untrusted, or it conflicts with Authority, disclose the degradation and investigate normally; ask a focused question only when evidence cannot resolve a user-owned fact. Routine context loading, migration, and maintenance need no task record.

---

### 3. Goal-Driven Task Management

- Use `tasks/tasks.md` as a newest-first index and keep each canonical task record in `tasks/tasks/<task-slug>.md`; multiple tasks may be active at once.
- As soon as a request establishes a concrete, non-trivial, independently acceptable outcome, load `$task` and follow its `SKILL.md` to create, resume, or reopen the owning record before substantive discussion, repository exploration, research, planning, delegation, implementation, or any focused target-forming clarification performed after the outcome exists. Do not wait for work to begin or for the user to request a task record. If no honest observable Target can yet be stated, ask one focused question and activate the record as soon as the answer establishes the outcome.
- With the owning task active, apply the selected task-family skill's required shared Task Target Alignment Protocol. The protocol owns Target readiness, focused clarification, textual confirmation, the one-request bypass, revision, and realignment semantics. Before it confirms the current Target, permit only the focused user-owned clarification needed to form an honest commitment and the lifecycle writes named by the selected skill; do not inspect task-direct sources, research, plan, delegate, or edit the requested deliverable. Continue to substantive preparation or execution only after confirmation.
- Use `$task-plan` for planning-only work and `$task-queue` when the user wants multiple tasks managed and executed as an ordered parent-child workflow.
- Create or update the owning task file and only its exact index entry; keep both current as scope, status, or results change. The task core owns status, evidence, parent-child links, completion gates, and index consistency.
- Keep each index entry limited to the task title, current status, and relative task-file link. The task file is authoritative when the index and record disagree.
- Keep completed task files as history and avoid changing unrelated task files or index entries. Read recent tasks first and search older entries only when relevant.
- Skip task records only for simple factual answers, open-ended conversation without a concrete outcome, trivial deterministic mechanical operations, and routine context or lesson maintenance.

---

### 4. Self-Improvement Loop

- Treat `tasks/lessons.md` as a compact, current set of durable rules that prevent repeated agent mistakes, not a task diary or project knowledge base.
- After activating the owning task and receiving explicit `Task Target` confirmation, but before substantive preparation or execution, load `$task-lessons` and follow its `SKILL.md`; also load it after a user correction before continuing. Do not wait for the user to request lesson review.
- With the task active and confirmed, review only the lessons relevant to the current workspace and outcome, then apply every matching Rule and Check.
- After a correction, inspect related lessons and use the skill's update and permission rules to add, refine, merge, replace, remove, or leave them unchanged.
- Keep project facts in `tasks/context.md` and task history in `tasks/tasks/`; put only reusable prevention rules in lessons.

---

### 5. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- Find root causes. No temporary fixes.
- No features beyond what was asked. No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip elegance consideration for simple, obvious fixes
- Ask yourself: "Would a senior engineer say this is overcomplicated?"

---

### 6. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken. Match existing style.
- If you notice unrelated dead code, mention it — don't delete it.
- When your changes create orphans: remove imports/variables/functions YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
- Every changed line should trace directly to the user's request.

---

### 7. Verification Before Done
- Verify outcomes in proportion to risk with deterministic checks, tests, logs, or behavioral comparison as appropriate.
- Use an independent review workflow only when the user explicitly requests adversarial, two-agent, or independent Reviewer approval; never infer it from task risk or another workflow.
