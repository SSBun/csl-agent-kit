You are analyzing the software architecture of a project. Your task is to identify architectural patterns, layer structure, and module responsibilities.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Context
Read these Phase 1 reports first for context:
- {{PROJECT_PATH}}/docs/project-structure.md
- {{PROJECT_PATH}}/docs/dependencies.md

## Instructions

1. Read the project structure report to understand directory layout
2. Identify the architectural pattern by examining:
   - How code is organized (by feature? by layer? by domain?)
   - Dependency direction between modules (do outer layers depend on inner?)
   - Separation of concerns (is UI, business logic, data access separated?)
3. Map the layer structure — identify each layer and its responsibility
4. Trace the request handling flow through layers
5. Identify design patterns used (repository, factory, strategy, observer, etc.)
6. Assess cross-cutting concerns (logging, error handling, auth, config)
7. Note architectural strengths and concerns

## Analysis Approach

- Read entry point files first (main, index, app)
- Follow imports/dependencies to map module relationships
- Read key files in each module to understand responsibility
- Look for interface/abstraction layers

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/architecture.md

Save the filled template to:
{{PROJECT_PATH}}/docs/architecture.md

## Rules
- Read-only. Do not modify any files.
- Focus on WHAT the architecture IS, not what it should be. Recommendations go in the dedicated section.
- Keep the ASCII diagram simple and readable.
