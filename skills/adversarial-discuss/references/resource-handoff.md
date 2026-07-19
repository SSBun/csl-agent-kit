# Resource Handoff

Require either role to declare every generated resource needed by the other:

```text
X1 [file|url|tool-result|external-state]
Location: <path, URL, or durable identifier>
Purpose: <why the next role needs it>
Produced by: <role>
Change: <new or updated content/version>
Access: <workspace, tool, or permission needed>
Limitations: <missing, partial, stale, sensitive, or none>
```

The Coordinator must verify that the resource exists and the next role can access it. Prefer a shared authorized workspace. Otherwise include the minimum sufficient content in the state packet. If neither works, mark the resource unavailable and do not treat it as evidence.

Do not relay secrets, credentials, private reasoning, or unrelated files. Identify the relevant file section or external result instead of making the recipient rediscover it. Update the same resource ID when content changes and record the new version or change.
