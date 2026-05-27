You are analyzing the dependencies of a software project. Your task is to inventory all dependencies, check their status, and audit licenses.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Instructions

1. Read the dependency manifest file(s):
   - Node: `package.json`, `yarn.lock`, `pnpm-lock.yaml`
   - Python: `requirements.txt`, `pyproject.toml`, `Pipfile.lock`
   - Go: `go.mod`, `go.sum`
   - Rust: `Cargo.toml`, `Cargo.lock`
   - Java: `pom.xml`, `build.gradle`
   - Ruby: `Gemfile`, `Gemfile.lock`
   - PHP: `composer.json`, `composer.lock`
   - Swift: `Package.swift`
   - .NET: `*.csproj`, `*.sln`

2. Separate runtime (prod) dependencies from dev dependencies
3. Check for outdated versions using the appropriate tool (`npm outdated`, `pip list --outdated`, etc.) if available
4. Identify any known vulnerabilities (`npm audit`, `pip audit`, `cargo audit`) if the tools are installed
5. Audit licenses for all dependencies
6. Identify the dependency graph — which packages depend on which others
7. Flag circular dependencies if detectable

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/dependencies.md

Save the filled template to:
{{PROJECT_PATH}}/docs/dependencies.md

## Rules
- Read-only. Do not install, update, or modify any packages.
- If audit tools are not installed, note "Tool not available" and skip that check.
- Redact any credentials or tokens found in config files.
