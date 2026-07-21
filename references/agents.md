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

### 2. Workspace Workflow

- At session start, after resume or compaction, and before ending when durable facts changed, use `$workspace-maintain-context`.
- Before non-trivial work and after a user correction, use `$workspace-capture-lessons`.
- For non-trivial work that changes a deliverable, use `$workspace-manage-task`.

---

### 3. Simplicity First
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

### 4. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken. Match existing style.
- If you notice unrelated dead code, mention it — don't delete it.
- When your changes create orphans: remove imports/variables/functions YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
- Every changed line should trace directly to the user's request.

---

### 5. Verification Before Done
- Verify outcomes in proportion to risk with deterministic checks, tests, logs, or behavioral comparison as appropriate.
- Use an independent review workflow only when the user requests it or an applicable task requirement makes it a completion gate.

---
