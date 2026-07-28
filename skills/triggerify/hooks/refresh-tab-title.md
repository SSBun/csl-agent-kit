---
schema: triggerify/v1
event: prompt-submit
action: run-script
description: Name the active conversation from available context; keep the current title for follow-ups or model failure.
enabled: true
script: refresh-tab-title.js
timeout: 5
---
