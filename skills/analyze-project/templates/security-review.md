# Security Review

> Project: <!-- FILL: project name -->
> Generated: <!-- FILL: date -->

## Overall Assessment

| Metric | Rating |
|--------|--------|
| Overall security posture | <!-- strong / moderate / weak --> |
| Critical findings | <!-- FILL --> |
| High findings | <!-- FILL --> |
| Medium findings | <!-- FILL --> |

## Authentication

<!-- FILL: Authentication mechanism analysis.
- How users authenticate
- Password storage (hashing algorithm, salt)
- Token management (JWT, session)
- MFA support
-->

## Authorization

<!-- FILL: Authorization model.
- Role-based / attribute-based / capability-based
- How permissions are checked
- Admin vs regular user separation
-->

## Secret Management

<!-- FILL: How secrets are handled.
- Where secrets are stored (env vars, vault, config files)
- Are secrets in source code?
- Secret rotation strategy
-->

## Input Validation & Injection

<!-- FILL: Protection against injection attacks.
- SQL injection: parameterized queries used?
- XSS: output encoding/sanitization?
- CSRF: tokens implemented?
- Command injection: user input sanitized?
- Path traversal: file paths validated?
-->

## Dependency Security

<!-- FILL: Known vulnerabilities in dependencies.
Reference dependencies.md for full list.
-->

## Data Protection

<!-- FILL: How sensitive data is protected.
- Encryption at rest
- Encryption in transit (TLS)
- PII handling
- Data retention/deletion policies
-->

## Findings

### CRITICAL

<!-- FILL: Critical security issues that must be fixed immediately. -->

### HIGH

<!-- FILL: High severity issues. -->

### MEDIUM

<!-- FILL: Medium severity issues. -->

### LOW

<!-- FILL: Low severity / informational findings. -->

## Recommendations

1. <!-- FILL: Most critical fix -->
2. <!-- FILL -->
3. <!-- FILL -->
