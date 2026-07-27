---
schema: triggerify/v1
event: prompt-submit
action: run-script
description: Keep the current tab title for routine follow-ups; otherwise generate one with an isolated model call.
enabled: true
script: refresh-tab-title.js
timeout: 5
---
