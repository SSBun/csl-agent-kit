# Final Review Report Contract

After approval or any pause or stop condition, generate exactly one report:

```text
# Final Review Report
Gate: APPROVED | BLOCKED
Review state: APPROVED | NEEDS_USER | BLOCKED | STALLED | USER_STOP
Stop reason: approved | user-decision-required | objective-blocker | review-stalled | user-stopped
Reviewer: <agent identity>
Task record: <task-list path and task title>
Scope: <review base and artifacts>
Rounds: <used> (INITIAL, RE-REVIEW...)
Resolved: <finding IDs>
Unresolved:
- <finding ID, evidence, risk, and user question, resume condition, or required acknowledgement as applicable; or none>
Questions for user:
1. <finding ID: exact question, or none>
Verification: <commands or evidence>
External action authorization: <separate user instruction or not authorized>
```

For a blocked report, list every unresolved `BLOCKER`, `QUESTION`, and unacknowledged `NOTE` with its evidence and risk. Include every user-addressable item under `Questions for user` and ask the user to answer them in one response. Keep the Gate `BLOCKED`; resume the same numbered history only after the stop condition clears or the user requests follow-up work.
