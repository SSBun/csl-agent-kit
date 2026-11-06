---
schema: agent-hooks/v1
event: before-tool
action: run-script
description: commit-guard 的审查标记规则；阻止 Agent 提交暂存内容中的临时说明，工作区可保留说明。
enabled: true
script: check-code-review-commit.js
timeout: 30
on-error: block
---
