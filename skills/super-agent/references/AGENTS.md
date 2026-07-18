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

- Use the session-start directory as the workspace root and keep `tasks/context.md` there as a compact, current map. Save only confirmed, durable facts a later agent would otherwise need to rediscover: workspace structure, component roles and relationships, domain terms, and workspace-level decisions or conventions.
- At the start of a session or after resuming, read it first for orientation, then verify task-relevant details in the workspace itself; context guides exploration, but the workspace is the source of truth.
- Before ending a turn, add newly confirmed facts at the top of their list; update or remove superseded facts. Do not save task progress or history, lessons, speculation, secrets, or global preferences.
- If a material fact is missing or conflicts with evidence, investigate first, then ask focused questions if unresolved. Routine context maintenance needs no task record.

---

### 3. Goal-Driven Task Management

- Use one shared, newest-first `tasks/todo.md`; multiple tasks may be active at once.
- For non-trivial or file-changing work, create or update a task record before execution; keep it current during work and complete its review before closing it.
- Give each task an outcome-oriented title, a status with date, testable goals, and a review of results and verification.
- Add plans or boundaries when they help execution.
- Keep completed tasks as history and avoid changing unrelated task entries.
- Read recent tasks first and search older entries only when relevant.

---

### 4. Self-Improvement Loop

- Treat `tasks/lessons.md` as a compact, current set of durable rules that prevent repeated agent mistakes—not a task diary or project knowledge base.
- After each user correction, review `tasks/lessons.md`; add, refine, merge, replace, or remove a lesson only as needed to preserve a reusable prevention rule.
- Keep new or revised lessons at the top of their list.
- Express each lesson as an observable trigger and the required better behavior.
- Keep project facts in `tasks/context.md` and task history in `tasks/todo.md`; put only reusable prevention rules in lessons.
- Before work, review only the lessons relevant to the current workspace and task.

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

### 7. Strict Review and Verification Before Done
- Before marking any file-changing task complete, invoke `adversarial-code-review` on the final diff.
- Keep completion and commit gates blocked until its independent Reviewer returns `APPROVED`; the Editor may answer or fix findings but cannot self-approve.
- Any reviewed-file change after approval invalidates the verdict and requires another review.
- If the adversarial review cannot run or does not pass, report the task as incomplete or blocked; never claim it is finished.
- Diff behavior between main and your changes when relevant, and run tests, check logs, or otherwise demonstrate correctness.

---
