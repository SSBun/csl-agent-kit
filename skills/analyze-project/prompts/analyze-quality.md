You are analyzing the code quality and testing strategy of a software project.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Context
Read these reports first for context:
- {{PROJECT_PATH}}/docs/project-structure.md
- {{PROJECT_PATH}}/docs/dependencies.md
- {{PROJECT_PATH}}/docs/build-and-deploy.md

## Instructions

1. **Test strategy analysis**:
   - Find test files (look for test directories, `*.test.*`, `*_test.*`, `*.spec.*` patterns)
   - Identify test framework(s) used
   - Categorize test types (unit, integration, e2e)
   - Count test files and estimate test-to-source ratio

2. **Test coverage assessment**:
   - Check if coverage tool is configured
   - Run coverage report if tool is available and non-destructive
   - If no coverage tool, estimate coverage from test file distribution

3. **Test quality review**:
   - Read sample test files to assess quality
   - Are tests testing behavior or implementation details?
   - Are mocks/stubs used appropriately?
   - Is test isolation maintained?
   - Edge case coverage

4. **Linting and formatting**:
   - Identify linting tools (ESLint, Pylint, RuboCop, Clippy, etc.)
   - Read configuration to assess strictness
   - Check for formatting tools (Prettier, Black, gofmt, etc.)

5. **Type safety**:
   - TypeScript strict mode? Python type hints? Go static types?
   - Assess type coverage if measurable

6. **Code quality metrics** (estimate from reading code):
   - Average function length (sample key modules)
   - Maximum file length
   - TODO/FIXME/HACK comment count
   - Comment ratio

7. **Identify untested critical areas**:
   - Compare test directories against source directories
   - Which modules have no corresponding tests?
   - Which are most critical to test?

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/quality-report.md

Save the filled template to:
{{PROJECT_PATH}}/docs/quality-report.md

## Rules
- Read-only. Do not modify any files.
- Running tests is OK if non-destructive, but do not install new packages.
- If coverage tools are not installed, estimate and note "estimated, not measured".
- Keep quality assessments factual and evidence-based.
