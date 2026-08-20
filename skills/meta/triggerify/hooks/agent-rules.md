---
schema: triggerify/v1
event: session-start
action: run-script
description: Inject user agent-rules.md or its legacy predecessor into session context when non-empty
enabled: true
script: read-agent-rules.js
timeout: 5
inject-output: true
---
