---
schema: agent-hooks/v1
event: session-start
action: run-script
description: Inject built-in, user, and project Agent Rules into session context
enabled: true
script: read-agent-rules.js
timeout: 5
inject-output: true
---
