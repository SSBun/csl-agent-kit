---
schema: agent-hooks/v1
event: before-tool
action: run-script
description: Report opted-in Codex lifecycle status to the local iTermate integration.
enabled: true
script: itermate-codex-status.js
timeout: 3
when:
  path: /host/name
  op: eq
  value: codex
---
