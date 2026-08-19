---
name: task-grill
description: Grill the user relentlessly about a plan, decision, or topic with task-aware recording. Use when the user wants to stress-test thinking and wants the outcomes handled by the canonical task system instead of polluting an existing task record.
---

# Task Grill

Interview the user relentlessly about the topic until you reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one by one. For each question, provide your recommended answer.

Ask questions **one at a time** and wait for the answer before continuing. If a *fact* can be found by exploring the environment (filesystem, tools, docs), look it up rather than asking; the *decisions* are the user's — put each one to them.

Do not act until the user confirms shared understanding.

## Task recording rules

Grill output goes to the canonical task system, not into whatever task file happens to be in focus:

- **Grilling about an existing canonical task** (chatting about that task's plan or design): do **not** record the grill dialogue, Q&A, or interim conclusions into that task file. Only update the owning task when a confirmed final decision changes its scope, status, or deliverable — then follow the `$task` maintenance rules as usual.
- **Grilling a standalone topic** (a discussion, decision, or design with no owning task): create a new canonical task for it via `$task` (e.g. "decide <topic>"), and record the confirmed outcomes there.
