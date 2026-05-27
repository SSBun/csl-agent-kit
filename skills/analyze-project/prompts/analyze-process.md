You are analyzing the business logic and functional processes of a software project. Your task is to document what the software DOES step by step, not how the code is structured.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Context
Read these reports first for context:
- {{PROJECT_PATH}}/docs/project-structure.md
- {{PROJECT_PATH}}/docs/architecture.md
- {{PROJECT_PATH}}/docs/api-surface.md

## Instructions

1. **Understand what the software does**: Read README, main entry points, and config to understand the product's purpose.

2. **Identify core workflows**: What are the primary user-facing features? For each:
   - What triggers it (user action, event, schedule)?
   - What steps happen in sequence?
   - What tools/libraries are used at each step?
   - What decisions/branches exist?
   - What happens on success vs failure?

3. **Identify secondary workflows**: Supporting features like:
   - Data export/import
   - Notification sending
   - Background processing
   - Admin functions

4. **Map background processes**:
   - Scheduled tasks (cron, timers)
   - Queue workers (what queues, what messages)
   - Event listeners (what events, what response)

5. **Document state machines**: If entities have lifecycles (e.g., order: pending → paid → shipped), map all valid transitions and triggers.

6. **Extract business rules**: What constraints and rules are enforced in code?

7. **Document error flows**: How does the system handle failures at each step?

## Key Principle

Think like a product manager explaining the system to a new hire. Focus on the FUNCTIONAL process — what happens and why — not the code structure.

Example for a downloader app:
1. User provides URL → validate format, check reachability
2. Check cache → if cached, return result immediately
3. Create download task → use aria2c/yt-dlp/wget based on URL type
4. Track progress → poll task status, emit progress events
5. Process result → verify checksum, convert format if needed
6. Store output → move to configured output directory
7. Export metadata → save URL, timestamp, file path, size to index

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/process-analysis.md

Save the filled template to:
{{PROJECT_PATH}}/docs/process-analysis.md

## Rules
- Read-only. Do not modify any files.
- Write in plain language. Avoid code jargon in workflow descriptions.
- Use the actual library/tool names found in the code.
- Cover both happy path and error paths.
