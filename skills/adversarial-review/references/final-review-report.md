# Final Review Report Contract

After approval, a bounded final review, or an `OPEN` stall, generate exactly one report:

```text
# Final Review Report
Gate: APPROVED | BLOCKED
Stop reason: approved | final-review-unresolved | user-decision-required | open-review-stalled
Reviewer: <agent identity>
Task record: <task-list path and task title>
Scope: <review base and artifacts>
Round limit: 3 | OPEN
Rounds: <used>/<limit> (<round names>)
Resolved: <finding IDs>
Unresolved:
- <finding ID, evidence, risk, and question, or none>
Questions for user:
1. <finding ID: exact question, or none>
Verification: <commands or evidence>
External action authorization: <separate user instruction or not authorized>
```

For `BLOCKED`, list every unresolved `BLOCKER` or `QUESTION` with its evidence, risk, and exact question. Ask the user to answer each numbered question in the same response. Keep the gate `BLOCKED`; only an explicit user request may switch a bounded review to `OPEN` or start follow-up work.
