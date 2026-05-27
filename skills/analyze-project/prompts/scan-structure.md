You are analyzing the structure of a software project. Your task is to scan the project directory and produce a detailed structure analysis.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Instructions

1. Scan the top 3 levels of the directory tree using `find` and `ls`
2. Identify all entry points (main files, index files, boot scripts)
3. Determine module/feature boundaries based on directory organization
4. Count files per major directory
5. List all configuration files and their purposes
6. Identify the organizational pattern (by-feature, by-layer, monorepo, etc.)
7. Note any structural concerns (deep nesting, oversized dirs, misplaced files)

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/project-structure.md

Save the filled template to:
{{PROJECT_PATH}}/docs/project-structure.md

## Rules
- Read-only. Do not modify any source files.
- Use `find`, `ls`, `wc -l`, and `head` commands to explore.
- Annotate the directory tree with brief descriptions.
- Keep file counts and sizes factual (measure, don't guess).
