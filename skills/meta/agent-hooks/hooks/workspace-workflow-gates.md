---
schema: agent-hooks/v1
event: session-start
action: run-script
description: Inject the CSL Agent Kit behavioral contract into supported session contexts
enabled: true
script: read-workspace-workflow-gates.js
timeout: 5
inject-output: true
---
