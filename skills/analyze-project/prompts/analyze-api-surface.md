You are analyzing the API surface of a software project. Your task is to document all public endpoints, protocols, and the auth model.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Context
Read these reports first for context:
- {{PROJECT_PATH}}/docs/project-structure.md
- {{PROJECT_PATH}}/docs/architecture.md

## Instructions

1. **Identify all API definitions**:
   - REST: route definitions, controller files
   - GraphQL: schema/type definitions, resolvers
   - gRPC: .proto files
   - WebSocket: connection handlers
   - RPC: method definitions

2. **For each endpoint**, document:
   - HTTP method + path (or equivalent)
   - Auth requirement
   - Brief description of what it does
   - Group by resource/domain

3. **Analyze authentication**:
   - Mechanism (JWT, session, API key, OAuth)
   - Token format and lifecycle
   - Where auth is enforced (middleware, decorator, filter)

4. **Analyze authorization**:
   - Permission/scopes model
   - Role definitions
   - How permissions are checked per endpoint

5. **Document middleware stack**:
   - Order of execution
   - Purpose of each middleware

6. **Map outbound API calls**:
   - External services called
   - Protocol and auth used

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/api-surface.md

Save the filled template to:
{{PROJECT_PATH}}/docs/api-surface.md

## Rules
- Read-only. Do not modify any files.
- Do not include example request/response bodies with real data.
- Redact any tokens, keys, or credentials found.
