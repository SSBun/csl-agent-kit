---
schema: triggerify/v1
event: session-start
action: run-script
description: Inject user simple-rules.md into session context when non-empty
enabled: true
script: read-simple-rules.js
timeout: 5
inject-output: true
---
