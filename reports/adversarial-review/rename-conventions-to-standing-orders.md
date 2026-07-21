---
created: 2026-07-21
task: rename-conventions-to-standing-orders
review_cycles: 2
---

# Adversarial review: rename conventions to standing-orders and harden the skill

Topic: Should the rename and skill hardening land as committed in `60098d4`, or does it carry material defects?

> **E1:** Editor shipped the rename with data file kept as `conventions.md` (justified as "avoid migrating user data"), a File spec mandating "no paragraphs" while the data file had a paragraph intro, and a 1500-char cap stated without basis.
>
> **R1:** Reviewer returned `CONTINUE` with one BLOCKER (R4 naming split), two NOTEs (R1 spec/data inconsistency, R2 strict-trigger gap), one QUESTION (R3 cap basis). R4 argued the rename justification was weak: 5 plain-text lines are trivially renamable, and the perpetual naming split plus its disclaimer violated root-cause / simplest-solution principles.
>
> **E2:** Editor accepted R4 (rename the data file, update 8 references, drop the disclaimer), accepted R1 (permit a one-line intro in the spec, shorten the data intro), answered R3 with the token math and added the parenthetical, acknowledged R2 as by-design.
>
> **R2:** Reviewer returned `APPROVED`. Every finding resolved; the remaining internal symbol `conventions` in the Pi extension is a private implementation detail outside the contract boundary, not actionable under scope preservation.

**Conclusion:** Rename and hardening land cleanly once the data file is renamed to match the skill name. The only BLOCKER was self-inflicted naming debt, fixed by a 8-file mechanical change.

---

**Final decision:** `APPROVED`

**Outcome:** `skills/standing-orders/` ships with a unified name across skill, data file (`~/.csl-agent-kit/standing-orders.md`), agents.md section, hooks, Pi extension section heading, all 6 plugin manifests, README, context, and lessons. File spec caps at 15 entries / 1500 chars (≤120 chars each, single-line imperative, one-line intro permitted), justified by session-start injection cost. Guide flow routes non-standing-order content to AGENTS.md / sop-manager / lessons.md / one-off execution via CLASSIFY → DISTILL → CHECK → CONFIRM.

**Remaining:** none
