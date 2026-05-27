You are performing a security review of a software project. Your task is to identify security vulnerabilities, assess the security posture, and provide remediation recommendations.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Context
Read ALL previous reports for context:
- {{PROJECT_PATH}}/docs/project-structure.md
- {{PROJECT_PATH}}/docs/dependencies.md
- {{PROJECT_PATH}}/docs/api-surface.md
- {{PROJECT_PATH}}/docs/data-model.md
- {{PROJECT_PATH}}/docs/architecture.md

## Instructions

1. **Authentication review**:
   - How users authenticate
   - Password storage mechanism (hashing, salting)
   - Token management (JWT, session, expiry)
   - MFA support

2. **Authorization review**:
   - Permission model
   - How access control is enforced
   - Privilege escalation risks

3. **Secret management**:
   - Scan for hardcoded secrets (API keys, passwords, tokens)
   - Check .env files, config files, source code
   - Assess secret storage strategy

4. **Injection attack surface**:
   - SQL injection: check for string concatenation in queries
   - XSS: check for unescaped user input in output
   - Command injection: check for user input in shell commands
   - Path traversal: check for unsanitized file paths
   - CSRF: check for token implementation

5. **Data protection**:
   - Encryption at rest and in transit
   - PII handling
   - Data exposure in logs and error messages

6. **Dependency vulnerabilities**:
   - Reference dependencies.md for known CVEs
   - Flag packages with known security issues

7. **Classify findings** by severity: CRITICAL / HIGH / MEDIUM / LOW

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/security-review.md

Save the filled template to:
{{PROJECT_PATH}}/docs/security-review.md

## Rules
- Read-only. Do not modify any files.
- REDACT all secrets found: replace with `***REDACTED***`
- Do NOT include actual passwords, tokens, or API keys in the report.
- Focus on factual findings, not theoretical risks.
