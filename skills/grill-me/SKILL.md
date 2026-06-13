---
name: grill-me
description: Interviews the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

# Grill Me

Stress-test an **existing plan or design** through relentless questioning — not open-ended brainstorming. Use `/brainstorming` when requirements are still undefined.

## When to Use

- User has a proposal, RFC, architecture sketch, or feature plan to validate
- User says "grill me", "poke holes", "stress-test this plan"
- Decisions exist but trade-offs, edge cases, or dependencies are unresolved

**Do not use** for vague ideas with no plan yet, bug fixes, or post-implementation code review.

## Process

### 1. Anchor the plan

Before questioning, restate in 3–5 bullets:
- **Goal** — what success looks like
- **Scope** — in / out
- **Key decisions already made**
- **Open branches** — unresolved forks you will walk

If the user has not shared a plan, ask for it once. Do not invent scope.

### 2. Walk the decision tree

- Ask **one question at a time** (use `AskUserQuestion` on Claude Code; otherwise ask in chat).
- Order: dependencies first — unblock downstream choices before leaf details.
- For each question, give your **recommended answer** and brief rationale.
- If the answer lives in the codebase or docs, **explore first** — do not ask what you can verify.

Track resolved vs open branches mentally (or a short checklist in replies).

### 3. Handle stuck or uncertain answers

| Situation | Action |
|-----------|--------|
| User unsure | Offer 2–3 concrete options with trade-offs; ask them to pick or defer |
| User defers | Record as **TBD** with owner/next step; move to the next independent branch |
| Answer contradicts earlier decision | Surface the conflict; ask which to revise |
| Scope creep mid-session | Flag it; confirm whether to expand scope or park the idea |

### 4. Stop conditions

Stop grilling when **all** of the following are true:

- Every major branch has a decision, explicit TBD, or documented deferral
- No unresolved dependency blocks another open question
- User confirms shared understanding ("we're aligned" or equivalent)

Then produce a **Decision Summary** (do not start implementation unless asked):

```markdown
## Decision Summary

### Locked
- {decision} — {rationale}

### TBD / Deferred
- {item} — {why deferred, who decides next}

### Risks flagged
- {risk} — {mitigation or acceptance}
```

Ask: "Want this written to `docs/plans/` or an ADR, or is the summary enough?"

## Rules

- One question at a time — no question dumps.
- Recommendations required on every question — grilling is not an interrogation with no input.
- Prefer codebase evidence over repeated "what did you mean by X?" when X is discoverable.
- Do not implement or refactor code during the session unless the user explicitly pivots.
- Stay on the plan under review — redirect tangents back to the decision tree.
