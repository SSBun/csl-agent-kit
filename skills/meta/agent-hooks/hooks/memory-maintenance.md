---
schema: agent-hooks/v1
event: stop
action: run-script
description: Queue a visible conversation increment for the independent Memory Agent after Pi settles
enabled: true
when:
  all:
    - path: /host/name
      op: eq
      value: pi
    - path: /native/event
      op: eq
      value: agent_settled
script: memory-enqueue.js
timeout: 5
---
