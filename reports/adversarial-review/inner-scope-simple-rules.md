---
created: 2026-07-27
task: inner-scope-simple-rules
review_cycles: 2
---

# Adversarial review: triggerify inner scope + simple-rules local changes

Topic: Are the local (uncommitted) changes safe to commit?

> **E1:** Editor received the Reviewer's INITIAL APPROVED with one R1 NOTE. The Editor nonetheless implemented a minimal fix for R1: added a local `let discoveringScope = "global"` in `runEvent`, set it to `"inner"` before `discover("inner", ...)`, and changed the budget-catch diagnostic prefix to `` `${discoveringScope}:${error.reason}` ``. Re-ran `npm run test:triggerify` (25/25) and `npm run test:cli` (26/26); `yao validate skills/simple-rules` passed. The change was scoped to the diagnostic label only; fail-open behavior, deadline semantics, and inject-output gating were preserved.
>
> **R1:** INITIAL pass found one NOTE: when `discover("inner", ...)` throws `TRIGGERIFY_BUDGET`, the shared catch labeled the error `global:${error.reason}`, which is inaccurate. Fail-open behavior (empty prompts, `blocked:false`) was already correct; only the debugging label was misleading. Non-blocking, minimal material risk.
>
> **R2:** RE-REVIEW (2) confirmed R1 resolved by the `discoveringScope` change: the prefix now reflects the scope that actually threw (global default; `"inner"` only after global discovery succeeded). The existing budget test (`eventBudgetMs:-1` expecting `global:event-budget-exhausted`) still passes because the deadline is expired at entry and global discovery throws first while `discoveringScope` is still `"global"`. No state leak (local `let`, catch read-only). No new BLOCKER, QUESTION, or unacknowledged NOTE. `STATUS: APPROVED`.

**Conclusion:** R1 acknowledged and minimally remediated by the Editor before re-review; the RE-REVIEW (2) confirmed the fix resolves the diagnostic mislabel without introducing regressions or new findings. The full pinned scope (triggerify inner scope + `inject-output`, the `simple-rules` inner hook/script/skill, test additions, manifest sync, and interrupted-pull cleanup) has no outstanding BLOCKER, QUESTION, or NOTE.

---

**Final decision:** `APPROVED`

**Outcome:** The local changes are safe to commit. Verification: `npm run test:triggerify` 25/25; `npm run test:cli` 26/26; `yao validate skills/simple-rules` ok; inner scope is read-only via all CLI mutation paths (create/update/delete/toggle reject `inner:`); `inject-output` injects only on script success (status 0) and only on inject-capable events, bounded by the existing `bounded()` 64KB cap; `read-simple-rules.js` handles missing/empty files with no path-traversal surface; end-to-end session-start injection confirmed for non-empty `simple-rules.md` and silent skip for empty/missing.

**Remaining:** none
