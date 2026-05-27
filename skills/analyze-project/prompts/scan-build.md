You are analyzing the build and deployment configuration of a software project.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Instructions

1. Identify the build system from config files:
   - `Makefile`, `package.json` (scripts), `build.gradle`, `pom.xml`, `Cargo.toml`, `Rakefile`, etc.
2. Read the build configuration to understand build targets and steps
3. Check for CI/CD configuration:
   - `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`, `Jenkinsfile`, `bitbucket-pipelines.yml`
4. Check for Docker/container configuration:
   - `Dockerfile`, `docker-compose.yml`, `.dockerignore`
5. Check for deployment configuration:
   - Kubernetes manifests, serverless configs, PaaS configs (Procfile, app.yaml, etc.)
6. Identify environment requirements from `.env.example`, `README`, config files
7. Document the local development setup steps

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/build-and-deploy.md

Save the filled template to:
{{PROJECT_PATH}}/docs/build-and-deploy.md

## Rules
- Read-only. Do not run builds or deployments.
- If no CI/CD config found, state "No CI/CD configuration detected."
- If no Docker/container config found, state "No containerization detected."
- Redact any secrets found in config files.
