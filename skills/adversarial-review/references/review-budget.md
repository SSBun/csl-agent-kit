# Review Budget Contract

Pin one mode in the initial packet:

- `Round limit: 3` by default: use `INITIAL (1/3)`, `RE-REVIEW (2/3)`, and `FINAL (3/3)`. After a blocked final review, stop routing and publish the final report.
- `Round limit: OPEN` only when the user explicitly requests deep or open-ended review. Use `INITIAL (1/OPEN)`, then `RE-REVIEW (n/OPEN)` until `APPROVED`, user input is required, or the review stalls.

The Coordinator may suggest `OPEN` for a large task but must not enable it. The user may switch to `OPEN` after a bounded final report; continue the existing count, such as `RE-REVIEW (4/OPEN)`, instead of resetting it.

Every Reviewer response, including a Decision Consensus challenge, consumes a round. Reviewer replacement, reviewed-artifact changes, and restarts never reset the count.

In `OPEN`, stop and ask the user when the same blocking item survives two consecutive rounds without new evidence, a relevant artifact change, or a relevant diff change. This is a stalled review, not approval.

## Round Completeness

- The Reviewer must inspect the full pinned scope and report every currently visible `BLOCKER`, `QUESTION`, and `NOTE` in one response. Never sample, postpone, or drip-feed known findings. A finding first raised in a later round must identify the new artifact, diff, evidence, or other reason it was not previously actionable.
- The Editor must answer every reported item in one batch: fix accepted items, provide evidence for rejections, and acknowledge notes. Request ordinary re-review only after all items are resolved. If any item needs user input, remain `BLOCKED`; use the Decision Consensus Gate for alternatives or ask the user directly. Never use ordinary re-review to bypass the decision. Send the complete ledger, combined changes, and verification together.
