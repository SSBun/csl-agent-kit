---
schema: agent-hooks/v1
event: prompt-submit
action: run-script
description: Regenerate a concise Chinese core-intent title from bounded recent conversation context.
enabled: true
script: refresh-tab-title.js
timeout: 5
---
