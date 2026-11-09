---
schema: agent-hooks/v1
event: session-start
action: run-script
description: Upgrade legacy memory once and expose user/project Markdown indexes for ordinary file-tool recall
enabled: true
script: read-agent-memory.js
timeout: 30
inject-output: true
---
