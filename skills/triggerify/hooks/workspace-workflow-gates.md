---
schema: triggerify/v1
event: session-start
action: run-script
description: Inject proactive workspace workflow gates into supported session contexts
enabled: true
script: read-workspace-workflow-gates.js
timeout: 5
inject-output: true
---
