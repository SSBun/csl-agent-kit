---
description: Plan and approve all Yunxiao MR requests from today and yesterday
---
Load the `yunxiao` Skill and follow its `references/approval-workflow.md` exactly.

Treat "the last 2 days" as two local calendar days: today and yesterday. Determine both dates at execution time in `YYYY-MM-DD` format; do not use a rolling 48-hour window.

Run `plan-approvals` for that inclusive range and show the complete plan, including `approvalRequests`, `excluded`, and `planId`. If there are no matching requests, report that result and stop.

If requests exist, state that execution will send one remote approval for every listed MR and will not merge them. Wait for explicit confirmation of this exact plan. Only then run `approve-all` with the same dates, the displayed `planId`, and `--yes`.

Report the top-level status, complete summary, and every result item. If the plan changed, show the replacement plan and obtain a new confirmation instead of reusing the old one. Never describe a partial result as full success.
