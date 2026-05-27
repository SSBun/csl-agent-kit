You are analyzing the data flow and tech stack of a project. Your task is to inventory all technologies and trace how data moves through the system.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Context
Read these Phase 1 reports first for context:
- {{PROJECT_PATH}}/docs/project-structure.md
- {{PROJECT_PATH}}/docs/dependencies.md
- {{PROJECT_PATH}}/docs/build-and-deploy.md

## Instructions

1. Build a complete tech stack inventory:
   - Language, runtime, framework versions (from config files)
   - Databases (from connection strings, ORM config, migration files)
   - Caching layers (Redis, Memcached, in-memory)
   - Message queues (RabbitMQ, Kafka, SQS)
   - File storage (local, S3, GCS)
   - Monitoring/logging tools

2. Trace the request lifecycle:
   - Entry point → middleware chain → handler → service → data layer → response
   - Identify what technology handles each step

3. Identify data pipelines:
   - Background jobs / workers
   - Scheduled tasks / cron
   - Event/stream processing
   - ETL flows

4. Map external integrations:
   - Third-party APIs called
   - Webhooks received
   - File imports/exports

5. Document caching strategy:
   - What is cached
   - Where (layers)
   - TTL and invalidation approach

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/data-flow.md

Save the filled template to:
{{PROJECT_PATH}}/docs/data-flow.md

## Rules
- Read-only. Do not modify any files.
- Redact connection strings, API keys, and credentials.
- Distinguish between what IS implemented vs what is configured but unused.
