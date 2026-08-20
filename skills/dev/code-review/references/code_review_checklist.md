# Code Review Checklist

Use this as a focused pass over a diff. Start with correctness and risk; leave style comments only when they affect maintainability or violate local standards.

## Review Order

1. **Intent**
   - Does the change match the PR description or user request?
   - Are unrelated files, generated artifacts, or broad refactors mixed in?
   - Is the smallest reasonable surface area touched?

2. **Correctness**
   - Check boundary cases, empty input, invalid input, duplicate input, ordering, time zones, concurrency, and retry behavior where relevant.
   - Verify changed call sites still satisfy function contracts.
   - Look for partial updates: model changed but serializer, validator, migration, UI state, or tests were not updated.

3. **Security and data safety**
   - Flag secrets, tokens, unsafe logging, weak defaults, injection risks, path traversal, SSRF, XSS, auth bypass, and permission checks that moved client-side only.
   - Check destructive operations for confirmation, scoping, transactions, rollback, and idempotency.
   - Confirm sensitive data is not persisted, cached, or exposed unnecessarily.

4. **Compatibility**
   - Check migrations, API contracts, feature flags, config defaults, and backwards compatibility.
   - Confirm error shapes, status codes, event names, analytics payloads, and public types remain stable unless the change intends otherwise.

5. **Tests and verification**
   - New or changed logic should have focused tests for the risky branch, not only happy paths.
   - UI changes should cover important states: loading, empty, error, disabled, long text, and small viewport when applicable.
   - If tests are missing, explain the specific behavior that is unprotected.

6. **Maintainability**
   - Prefer existing helpers and patterns over one-off code.
   - Names should describe domain meaning, not implementation mechanics.
   - Comments should explain surprising intent, not repeat the code.

## Finding Format

Each finding should include:

- Location: `file:line`
- Impact: what can go wrong
- Evidence: the code path or scenario that proves the risk
- Suggested fix: specific enough to act on

Avoid speculative feedback. If a concern depends on an assumption, state the assumption and confidence.
