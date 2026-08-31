---
schema: agent-hooks/v1
event: prompt-submit
action: run-script
description: Maintain a concise Chinese current-work title from bounded recent conversation context.
enabled: true
script: refresh-tab-title.js
timeout: 5
---
