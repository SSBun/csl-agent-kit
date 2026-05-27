# Process Analysis (Business Logic)

> Project: <!-- FILL: project name -->
> Generated: <!-- FILL: date -->

## Overview

<!-- FILL: What does this software do functionally?
Describe in plain language as if explaining to a non-technical stakeholder.
-->

## Core Workflow(s)

<!-- FILL: The primary user-facing workflow(s).
For each workflow, document the step-by-step functional process.
Include: what triggers it, what happens at each step, what tools/libraries are used, what the output is.
-->

### <!-- FILL: Workflow Name, e.g., "User Registration" -->

1. **<!-- FILL: Step name -->**
   - Trigger: <!-- FILL -->
   - Action: <!-- FILL: what happens, using what library/tool -->
   - Decision points: <!-- FILL: any branching logic -->
   - Error handling: <!-- FILL: what happens on failure -->

2. **<!-- FILL: Step name -->**
   - <!-- FILL: same structure -->

<!-- Repeat for each step -->

## Secondary Workflows

<!-- FILL: Supporting workflows that are important but not the primary flow.
Example: password reset, data export, batch processing, notification sending.
-->

### <!-- FILL: Workflow Name -->

1. **<!-- FILL -->**
   - <!-- FILL -->

## Background Processes

<!-- FILL: Any scheduled tasks, workers, or async processing.
- Cron jobs: schedule + what they do
- Queue consumers: what queue + what messages they process
- Event listeners: what events + response
-->

| Process | Schedule/Trigger | Function | Implementation |
|---------|-----------------|----------|---------------|
| <!-- FILL --> | <!-- FILL --> | <!-- FILL --> | <!-- FILL: file/function --> |

## State Machine / Workflow Transitions

<!-- FILL: If the system has entities with lifecycle states (e.g., order: pending → paid → shipped → delivered),
document the state transitions and what triggers each transition.
-->

```
<!-- FILL: State diagram or transition table -->
```

## Business Rules

<!-- FILL: Key business rules enforced in code.
Example: "Users can't delete accounts with active subscriptions"
"Downloads limited to 5 concurrent per user"
"Prices must be > 0 and in valid currency format"
-->

| Rule | Enforced Where | Description |
|------|---------------|-------------|
| <!-- FILL --> | <!-- FILL: file/function --> | <!-- FILL --> |

## Edge Cases & Error Flows

<!-- FILL: How the system handles edge cases and failures.
- What happens when external service is down?
- What happens on invalid input at each step?
- What happens on timeout?
- Retry logic?
-->

## Recommendations

1. <!-- FILL -->
2. <!-- FILL -->
