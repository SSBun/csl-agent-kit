---
schema: triggerify/v1
event: prompt-submit
action: run-script
description: Generate the terminal tab title from the latest prompt with an isolated deepseek-v4-flash call.
enabled: true
script: refresh-tab-title.js
timeout: 5
---
