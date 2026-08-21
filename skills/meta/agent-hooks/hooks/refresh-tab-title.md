---
schema: agent-hooks/v1
event: prompt-submit
action: run-script
description: Regenerate a project-prefixed, sub-8-word title from bounded recent conversation context.
enabled: true
script: refresh-tab-title.js
timeout: 5
---
